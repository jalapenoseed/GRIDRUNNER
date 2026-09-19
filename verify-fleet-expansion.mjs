import assert from 'node:assert/strict';
import * as T from './dist/three.js';
import {createCommanderFleet,validateCommanderFleet,CommanderSimulation} from './dist/fleet-commander-core.js';
import {commanderPreset} from './dist/commander-presets.js';
import {sampleSwarmProgram} from './dist/swarm-program.js';
import {wordSequenceState,sequenceWords} from './dist/word-sequence.js';
import {InWorldCommander} from './dist/in-world-commander.js';
import {AircraftBeacons} from './dist/aircraft-beacons.js';
import {fleetNeighborQuery} from './dist/fleet-spatial.js';
import {compactFleet,parseFleetFile,saveNamedFleet,readFleetLibrary} from './dist/fleet-commander-storage.js';

const fleet=createCommanderFleet(2000),ids=fleet.roster.map(d=>d.id);
assert.equal(ids.length,2000);assert.equal(new Set(ids).size,2000);assert.equal(ids.at(-1),'drone-2000');
assert.throws(()=>validateCommanderFleet({...fleet,roster:[...fleet.roster,fleet.roster[0]]}),/2,000/);
const compact=JSON.stringify(compactFleet(fleet));assert(compact.length<350000);assert.equal(parseFleetFile(compact).roster.length,2000);
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
saveNamedFleet(storage,fleet);assert.equal(readFleetLibrary(storage)[0].program.ids.length,2000);
const old=createCommanderFleet(6);for(const key of Object.keys(old.program.settings).filter(k=>k.startsWith('sequence')))delete old.program.settings[key];assert.equal(validateCommanderFleet(old).program.settings.sequenceEnabled,false);

const show=commanderPreset(fleet,'sequence'),p=show.program,settings=p.settings;
assert.deepEqual(sequenceWords('hello\nworld\nGRID RUNNER'),['HELLO','WORLD','GRID RUNNER']);assert.throws(()=>sequenceWords('HELLO'),/2–16/);
const start=settings.countIn+settings.morph,change=start+settings.sequenceHold,end=change+settings.sequenceTransition;
assert.equal(wordSequenceState(settings,start).current,'HELLO');assert.equal(wordSequenceState(settings,change+settings.sequenceTransition/2).blend,.5);assert.equal(wordSequenceState(settings,end).current,'WORLD');
assert.equal(wordSequenceState({...settings,sequenceLoop:false},1e5).current,'WORLD');
for(const id of ['drone-001','drone-1000','drone-2000']){
 const a=sampleSwarmProgram(p,id,{time:change}).target,b=sampleSwarmProgram(p,id,{time:end}).target,mid=sampleSwarmProgram(p,id,{time:change+settings.sequenceTransition/2}).target;
 a.forEach((v,i)=>assert(Math.abs(mid[i]-(v+b[i])/2)<1e-8,'smooth target morph uses one aircraft slot'));
 const before=sampleSwarmProgram(p,id,{time:end-1e-5}).target;assert(Math.hypot(...b.map((v,i)=>v-before[i]))<.001,'no jump between cues');
 assert.deepEqual(sampleSwarmProgram(p,id,{time:1,reducedMotion:true}).target,sampleSwarmProgram(p,id,{time:100,reducedMotion:true}).target);
}
assert.equal(new Set(ids.map(id=>sampleSwarmProgram(p,id,{time:start}).target.join(','))).size,2000,'all word aircraft have separate targets');

// Compare nearest-neighbor results against a brute-force oracle, including cell
// edges, vertical layers and negative coordinates.
const peers=Array.from({length:180},(_,i)=>({id:String(i),pos:[Math.sin(i*7)*70,Math.cos(i*3)*35,Math.sin(i*11)*70]})),query=fleetNeighborQuery(peers);
for(const peer of peers.filter((_,i)=>i%17===0)){
 const dist=p=>p.pos.reduce((n,v,i)=>n+(v-peer.pos[i])**2,0),expected=peers.filter(p=>p!==peer&&dist(p)<48**2).sort((a,b)=>dist(a)-dist(b)).slice(0,24).map(p=>p.id).sort();
 assert.deepEqual(query(peer.pos,peer.id).map(p=>p.id).sort(),expected);
}
const sim=new CommanderSimulation(fleet);sim.launch();let began=performance.now();for(let i=0;i<320;i++)sim.step(.05);const practiceMs=(performance.now()-began)/320;
assert.equal(sim.metrics().active,2000);assert(sim.metrics().cohesion>95);assert.equal(sim.targetClamps,0);assert(sim.checks<2000*1999/20);
const bodies=[...sim.drones];sim.apply(show);for(let i=0;i<Math.ceil((end+2)/.05);i++)sim.step(.05);
assert.equal(wordSequenceState(sim.program.settings,sim.program.time).current,'WORLD');assert(sim.drones.every((d,i)=>d===bodies[i]&&d.mode==='FLY'&&d.pos.every(Number.isFinite)));
sim.recall();assert(sim.drones.every(d=>d.mode==='RETURN'));assert.equal(sim.program.activeIds.length,0);

const ctx={operator:[0,0,0],bike:[12,0,0]},world=new InWorldCommander();world.spawn(fleet,ctx);began=performance.now();for(let i=0;i<320;i++)world.step(.05,ctx);const worldMs=(performance.now()-began)/320;
assert.equal(world.stats().active,2000);assert.equal(world.stats().queued,0);assert(world.drones.every(d=>d.system.pos.every(Number.isFinite)&&d.system.hp>95));
const systems=world.drones.map(d=>d.system);world.apply(show);for(let i=0;i<24;i++)world.step(.05,ctx);assert(world.drones.every((d,i)=>d.system===systems[i]));
world.recall();assert.equal(world.stats().returning,2000);assert.equal(world.program.activeIds.length,0);
world.spawn(fleet,{...ctx,operator:[599,0,229],yaw:Math.PI/4});assert.equal(new Set(world.drones.map(d=>d.home.join(','))).size,2000);assert(world.drones.every(d=>Math.abs(d.home[0])<=590&&d.home[2]<=220));
world.recall();world.step(.05,ctx);assert.equal(world.stats().queued,0);assert.equal(world.stats().active,0,'recall cancels every queued launch');

const root=new T.Group(),beacons=new AircraftBeacons(root),camera=new T.PerspectiveCamera();camera.position.set(0,30,0);beacons.update(bodies,camera,{time:12});
assert.equal(beacons.points.geometry.drawRange.count,2000);assert.equal(beacons.points.geometry.attributes.position.count,2000);assert.equal(beacons.points.material.blending,T.AdditiveBlending);assert.equal(beacons.lights.length,8);assert(beacons.lights.every(l=>!l.castShadow));
beacons.update(bodies,camera,{reducedMotion:true});assert.equal(beacons.points.material.uniforms.steady.value,1);beacons.clear();assert.equal(beacons.points.geometry.drawRange.count,0);assert(beacons.lights.every(l=>l.intensity===0));beacons.dispose();
console.log(`PASS: 2,000 real flight bodies in both modes; same-body word morph, timing, loop/end, legacy/large saves, spatial oracle, stable edges, full recall and beacon capacity. CPU mean: practice ${practiceMs.toFixed(2)} ms; world ${worldMs.toFixed(2)} ms at 20 Hz. GPU lighting and frame rate require WebGL hardware.`);
