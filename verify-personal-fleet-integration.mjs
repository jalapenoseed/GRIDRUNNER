import assert from 'node:assert/strict';

export function verifyPersonalFleet({run,tick,w}){
 run('newCampaign();settings.sensorMemory={};settings.sensorOwner=null;settings.sensorMode="visible";settings.tutorialEnabled=false;play();s.mode="foot";applySettings();settings.sensorMode="visible";applySettings();action("sensor");action("sensor")');
 assert.equal(run('settings.sensorMode'),'thermal','B reaches personal thermal with Scout selected');
 assert.equal(w.document.body.dataset.sensor,'thermal');
 run('open("drones")');
 const thermal=w.document.querySelector('[data-sensor-mode="thermal"]');
 assert(thermal&&!thermal.disabled,'personal thermal has a menu button');
 run('s.met=true;selectFleetAircraft("cargo")');
 assert.equal(run('settings.sensorMode'),'thermal','airframe selection does not remove visor heat view');
 run('play();issueDrone("MANUAL")');
 assert.equal(run('settings.sensorMode'),'visible','Cargo FPV enforces its own payload');
 run('issueDrone("HOLD")');
 assert.equal(run('settings.sensorMode'),'thermal','return to body restores visor thermal');
 run('writeSave("manual3");issueDrone("MANUAL");restore(getSave("manual3"))');assert.equal(run('settings.sensorMode'),'thermal','loading a walking save restores visor optics');
 run('s.mode="bike";applySettings()');assert.equal(run('settings.sensorMode'),'thermal');
 run('s.mode="foot";s.pos.set(80,1.7,120);s.yaw=0;bike.position.set(0,0,15);selectFleetAircraft("scout");issueDrone("FOLLOW");s.fleetFormation="PROTECTIVE RING"');
 assert.deepEqual(Array.from(run('fleetAnchor().pos')),[80,2,120]);
 tick(25);
 const position=Array.from(run('s.droneSystem.pos'));
 assert(Math.hypot(position[0]-80,position[2]-120)<22,'escort arrives at walking operator, away from bike');
 assert(run('fleet.records.scout.root.position.distanceTo(new T.Vector3(...s.droneSystem.pos))')<.001,'rendered aircraft follows simulated aircraft');
 run('issueDrone("MANUAL");s.droneSystem.pos=[180,30,160];s.pos.fromArray(s.droneSystem.pos);s.yaw=2');
 assert.deepEqual(Array.from(run('fleetAnchor().pos')),[80,2,120],'FPV does not drag formation away from operator body');
 assert.equal(run('fleetAnchor().yaw'),0);
 run('issueDrone("RETURN HOME")');tick(45);
 assert.equal(run('s.droneSystem.mode'),'DOCK','return still docks at rig, not operator');
 assert(Math.hypot(...Array.from(run('s.droneSystem.pos')).map((v,i)=>v-[0,2,15][i]))<.01);
 run('settings.sensorMode="visible";applySettings()');
 console.log('PASS: personal B/menu thermal, bike optics, independent FPV payload/restoration, walking escort, rendered world position, stable FPV operator anchor and physical rig return.');
}
