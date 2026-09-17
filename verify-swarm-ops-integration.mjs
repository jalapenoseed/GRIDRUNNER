import assert from 'node:assert/strict';
import {watchCanSee} from './dist/surveillance.js';
import {validateSwarmOps,validateCamo} from './dist/swarm-ops.js';
export function verifySwarmOpsIntegration({run,tick,w}){
 run('started=false;settings.weather="heat";settings.randomEnvironment=false;settings.movingSun=false;settings.sunHour=12;open("swarm")');
 w.document.querySelector('[data-swarm-start]').click();
 assert.equal(run('started'),true);assert.equal(run('s.intro.stage'),'line');assert(run('operatorConcealed()'));
 assert.equal(run('STARTER_AIRCRAFT.length'),6);
 assert.equal(run('new Set(Object.values(s.squad).map(r=>r.id)).size'),8);
 assert.equal(run('new Set(Object.values(s.squad).map(r=>r.batteryId)).size'),8);
 run('open("swarm")');const waiting=w.document.querySelector('[data-swarm-order="scout-04"]');waiting.value='standby';waiting.dispatchEvent(new w.Event('change',{bubbles:true}));assert(!run('fleetLaunchQueue.includes("scout-04")'),'standby cancels an unlaunched assignment');w.document.querySelector('[data-swarm-split]').click();w.document.querySelector('[data-swarm-resume]').click();
 assert.equal(run('s.squad["scout-02"].type'),'scout');assert.equal(run('s.squad["relay-02"].type'),'relay');
 tick(30);
 assert.equal(run('fleetLaunchQueue.length'),0,'all six staged launches complete');
 for(const id of ['scout','scout-02','scout-03','scout-04','relay','relay-02']){
  assert.equal(run(`s.squad['${id}'].system.mode`),'FOLLOW',id+' flies its live assignment');
  assert(run(`s.squad['${id}'].battery<100&&s.squad['${id}'].battery>50`),id+' spends its own battery');
  assert(run(`fleet.meshes['${id}'].visible`),id+' has a visible 3D instance');
  assert(run(`s.squad['${id}'].system.hp>90`),id+' keeps clearance during launch');
 }
 assert(run('s.squad["scout-03"].system.range>55'),'scouts leave the operator');
 assert(run('nearbyGuards(s.squad,fleetAnchor().pos).length>=1'),'guards stay near the body');
 assert(run('airborneRelays(s.squad).length===2'),'both relay identities join the link network');
 assert(run('guardDamageScale(s.squad,fleetAnchor().pos)<1'),'nearby guards reduce incoming damage');
 assert(run('fieldCoverWorld.root.visible'),'cloth renders in world');
 run('open("swarm")');assert.equal(w.document.querySelectorAll('[data-swarm-order]').length,6);
 const control=w.document.querySelector('[data-swarm-order="scout-04"]');control.value='bike';control.dispatchEvent(new w.Event('change',{bubbles:true}));
 assert.equal(run('s.squad["scout-04"].swarmOrder'),'bike');assert.equal(run('s.squad["scout-03"].swarmOrder'),'scout','one order does not overwrite another');
 // A live FPV camera leaves the physical rider and the remaining guard anchored.
 w.document.querySelector('[data-swarm-fpv="scout-03"]').click();assert.equal(run('s.mode'),'drone');assert.equal(run('s.droneType'),'scout-03');
 assert.equal(run('s.squad["scout-03"].swarmOrder'),null);assert(run('operatorConcealed()'));
 tick(2);assert.equal(run('s.squad.scout.swarmOrder'),'operator');
 run('open("swarm")');w.document.querySelector('[data-swarm-split]').click();assert.equal(run('s.droneSystem.mode'),'MANUAL','split does not seize piloted aircraft');
 // Selection, batteries and the workshop cloth survive a real serialized save.
 run('writeSave("manual1");restore(getSave("manual1"))');assert.equal(run('s.droneType'),'scout-03');assert(run('operatorConcealed()'));
 assert.equal(run('s.squad["scout-02"].swarmOrder'),'bike');assert.equal(run('s.squad["relay-02"].type'),'relay');
 // Old saves gain exactly the missing instances without duplicating a depleted battery.
 run('releaseDroneView();issueDrone("HOLD");selectAircraft(s,"scout");s.drone=37;syncSquad(s);globalThis.legacySwarmSave=JSON.parse(JSON.stringify(snapshot()));for(const id of EXTRA_AIRCRAFT)delete legacySwarmSave.state.squad[id];delete legacySwarmSave.state.swarmOps;delete legacySwarmSave.state.camo;restore(legacySwarmSave)');
 assert.equal(run('s.drone'),37);assert.equal(run('s.squad["scout-04"].battery'),100);assert.equal(run('Object.keys(s.squad).length'),8);
 run('s.pos.set(2.5,1.7,16);s.mode="foot";s.speed=0;open("swarm")');w.document.querySelector('[data-swarm-cover]').click();assert(run('operatorConcealed()'));
 run('s.pos.x+=9');assert.equal(run('operatorConcealed()'),false,'walking out breaks concealment');
 run('bike.position.x+=2;tickSwarmOps(.02)');assert.equal(run('s.camo.deployed'),false,'moving rig packs the cloth');
 assert(watchCanSee([0,10,0],0,[0,2,-40]));assert(!watchCanSee([0,10,0],0,[0,2,-40],{visibility:.4}));assert(watchCanSee([0,10,0],0,[0,2,-12],{visibility:.4}),'nearby observer still sees through concealment');
 assert.throws(()=>validateSwarmOps({...run('createSwarmOps()'),spacing:Infinity}));assert.throws(()=>validateCamo({...run('createCamo()'),deployed:true}));
 run('s.squad["scout-04"].swarmOrder="scout";s.squad["scout-04"].battery=5;s.squad["scout-04"].system.mode="FOLLOW";play()');tick(.1);assert.equal(run('s.squad["scout-04"].swarmOrder'),null,'battery return clears assignment');
 run('open("swarm")');w.document.querySelector('[data-swarm-recall]').click();assert.equal(run('fleetLaunchQueue.length'),0);assert(run('STARTER_AIRCRAFT.every(id=>!s.squad[id].swarmOrder)'));
 console.log('PASS: six independent 3D aircraft, staged launch, split guard/scout duties, airborne relay links, FPV authority, cloth concealment, persistent identities, old-save migration and cluster recall.');
}
