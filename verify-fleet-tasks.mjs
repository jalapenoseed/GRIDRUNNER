import assert from 'node:assert/strict';
import {createDrone,migrateDrone,updateDrone} from './dist/drone-system.js';
import {AIRCRAFT,syncSquad,selectAircraft,validateSquad} from './dist/squadron.js';
import {createAircraftRecord,validateAircraftTask,assignSurvey,commandAircraft,controlTask,advanceAircraftTask,taskDestination,cancelRegionTasks} from './dist/fleet-tasks.js';
import {renderFleetTask} from './dist/fleet-task-ui.js';
const home=[0,2,0],destination=[0,20,-70];
const fresh=(type='scout')=>createAircraftRecord(type,createDrone(home));
const copy=v=>JSON.parse(JSON.stringify(v));
const reload=r=>validateAircraftTask(createAircraftRecord(r.type,migrateDrone(copy(r.system),home),r.battery),copy(r));
let scans=0;
function tick(r,seconds=.02,extra={}){
 for(let t=0;t<seconds;t+=.02){
  const result=updateDrone(r.system,.02,{home,battery:r.battery,type:r.type,taskTarget:taskDestination(r),...extra});r.battery=result.battery;
  advanceAircraftTask(r,.02,{home,solids:extra.solids,events:result.events,scan:()=>{scans++;return 4;}});
 }
}
const start=r=>assert(assignSurvey(r,{home,destination,leg:1}).ok);
for(const type of AIRCRAFT){
 scans=0;let r=fresh(type);start(r);const id=r.task.id;tick(r,.5);r=reload(r);assert.equal(r.task.id,id);
 for(let i=0;i<4000&&r.task.state==='RUNNING';i++){tick(r);if(i===300)r=reload(r);}
 assert.equal(r.task.state,'COMPLETED',type+' finishes survey and docks');assert.equal(r.system.mode,'DOCK');assert.equal(scans,1);assert.equal(r.task.contacts,4);
 const charge=r.battery;r=reload(r);tick(r,1);assert.equal(scans,1);assert.equal(r.battery,charge,'Restoring a completed job neither scans nor drains');
 assert.equal(r.id,'aircraft-'+type+'-01');assert.equal(r.batteryId,'battery-'+type+'-01');
}

// Scan debit is exactly once across the survey/return persistence boundary.
scans=0;let r=fresh();start(r);r.system.pos=[...destination];r.system.speed=0;
for(let i=0;i<250;i++)advanceAircraftTask(r,.02,{home,scan:()=>{scans++;return 2;}});
assert.equal(r.task.state,'RUNNING');r=reload(r);
for(let i=0;i<5;i++)advanceAircraftTask(r,.02,{home,scan:()=>{scans++;return 2;}});
assert.equal(scans,1);assert.equal(r.battery,97);assert.equal(r.task.stage,'RETURN');
assert(controlTask(r,'pause',home).ok);assert.equal(r.system.mode,'HOLD');r=reload(r);assert.equal(r.task.state,'PAUSED');
assert(controlTask(r,'resume',home).ok);tick(r,30);assert.equal(r.task.state,'COMPLETED');assert.equal(scans,1,'Resuming a return does not rescan');

// Manual flight interrupts a job, keeps its destination/identity and yields to resume.
r=fresh();start(r);tick(r,1);const job=r.task.id,point=[...r.task.destination];assert(commandAircraft(r,'MANUAL',home));assert.equal(r.task.state,'PAUSED');
tick(r,.2,{input:[0,1,0]});const before=[...r.system.pos];r=reload(r);assert.equal(r.task.state,'PAUSED');assert.equal(r.system.mode,'MANUAL');assert.deepEqual(r.system.pos,before);assert.deepEqual(r.task.destination,point);
assert(controlTask(r,'resume',home).ok);assert.equal(r.task.id,job);assert.equal(r.system.mode,'SCOUT AHEAD');
assert.equal(assignSurvey(r,{home,destination}).ok,false,'Cannot overwrite an active job');
const taskBefore=copy(r.task);assert.equal(commandAircraft(r,'UNKNOWN',home),false);assert.deepEqual(r.task,taskBefore,'Rejected commands do not change work');
assert(commandAircraft(r,'HOLD',home));const elapsed=r.task.elapsed;tick(r,.4);assert.equal(r.task.elapsed,elapsed,'Paused time is not job time');
const position=[...r.system.pos];assert(commandAircraft(r,'DOCK',home));assert.equal(r.task.state,'CANCELLED');assert.deepEqual(r.system.pos,position,'Recall cannot teleport an airborne aircraft');tick(r,35);assert.equal(r.task.state,'CANCELLED');assert.equal(r.system.mode,'DOCK');
start(r);assert.notEqual(r.task.id,job,'A new job gets a new monotonic ID');assert(commandAircraft(r,'FOLLOW',home));assert.equal(r.task.state,'CANCELLED');

for(const safety of ['battery','signal','hull','landing']){
 r=fresh();start(r);r.system.pos=[0,20,-50];
 if(safety==='battery')r.battery=5;if(safety==='signal'){r.system.pos=[500,20,0];r.system.signal=0;r.system.linkLost=2;}if(safety==='hull')r.system.hp=10;if(safety==='landing')r.battery=0;
 tick(r);assert.equal(r.task.state,'FAILED',safety+' overrides autonomy');assert(['RETURN HOME','LANDED'].includes(r.system.mode));r=reload(r);assert.equal(r.task.state,'FAILED');assert(!controlTask(r,'resume',home).ok);
}
r=fresh();start(r);commandAircraft(r,'MANUAL',home);r.battery=5;tick(r);assert.equal(r.task.state,'FAILED','Failsafes also stop a paused manual job');
r=fresh();start(r);r.task.stageElapsed=121;tick(r);assert.equal(r.task.state,'FAILED');assert.equal(r.system.mode,'RETURN HOME','Stalled routes terminate the job and request a safe return');
r=fresh();start(r);r.system.pos=[...destination];r.system.speed=0;r.task.stage='SURVEY';r.task.dwell=5;advanceAircraftTask(r,.02,{home,scan:()=>{throw Error('scanner unavailable');}});assert.equal(r.task.state,'FAILED');assert.equal(r.battery,97);r=reload(r);assert.equal(r.task.state,'FAILED','Failed scan never replays after load');
r=fresh();start(r);r.task.stage='RETURN';r.task.scanned=true;r.task.state='PAUSED';r.system.mode='RETURN HOME';r=reload(r);assert.equal(r.task.state,'FAILED');assert.equal(r.system.mode,'RETURN HOME','Restore never replaces a safety return with HOLD');
r=fresh();start(r);const target=taskDestination(r);tick(r,.5,{home:[20,2,0]});assert.deepEqual(taskDestination(r),target,'Moving bike cannot drag the assigned waypoint');
r=fresh();start(r);tick(r,55,{solids:[{x:0,z:-25,w:5,d:.1,minY:0,maxY:12}]});assert.equal(r.task.state,'COMPLETED');assert.equal(r.system.hp,100,'Task respects obstacle avoidance and physical return');

// Bad identities/progress must be rejected, not repaired into fresh charged aircraft.
r=fresh();start(r);const good=copy(r);
for(const mutate of [
 x=>x.id='aircraft-relay-01',x=>x.batteryId='battery-relay-01',x=>x.task.aircraftId='aircraft-cargo-01',x=>x.task.batteryId='battery-relay-01',
 x=>x.taskSerial=-1,x=>x.taskSerial=9,x=>x.task.state='INFINITE',x=>x.task.stage='DONE',x=>x.task.kind='HARVEST',
 x=>x.task.destination=[Infinity,20,0],x=>x.task.destination=[700,20,0],x=>x.task.destination=[0,20,-4700],x=>x.task.elapsed=NaN,
 x=>x.task.stage='RETURN',x=>x.task.contacts=1,x=>x.task.leg=2,x=>x.task.dwell=9,x=>x.task.reason='x'.repeat(161)
]){const bad=copy(good);mutate(bad);assert.throws(()=>validateAircraftTask(fresh(),bad));}
const legacy={droneType:'scout',droneSystem:createDrone(home),drone:47,leg:1,squad:{cargo:{system:createDrone(home),battery:61}}};validateSquad(legacy);
assert.equal(legacy.squad.scout.battery,47);assert.equal(legacy.squad.cargo.battery,61);assert.equal(legacy.squad.scout.task,null);
const stable=syncSquad(legacy).scout;start(stable);for(let i=0;i<20;i++)assert.equal(syncSquad(legacy).scout,stable,'HUD sync preserves aircraft and task objects');
selectAircraft(legacy,'relay');assert.equal(legacy.squad.scout.task.id,stable.task.id);validateSquad(legacy);assert.equal(legacy.squad.scout.task.state,'RUNNING');
cancelRegionTasks(legacy);assert.equal(legacy.squad.scout.task.state,'CANCELLED');
for(const manifest of [null,[],{scout:null},{scout:{system:createDrone(home)}},{scout:{system:createDrone(home),battery:NaN}},{unrecognized:{system:createDrone(home),battery:100}}])assert.throws(()=>validateSquad({...legacy,squad:manifest}),'Malformed manifests cannot silently create fresh charge');
const noPilot=copy(legacy);noPilot.mode='bike';noPilot.droneSystem.mode='MANUAL';validateSquad(noPilot);assert.equal(noPilot.droneSystem.mode,'HOLD','Only an actual selected FPV session may restore manual thrust');
const html=renderFleetTask(stable);assert(html.includes('data-fleet-task="resume"')===false);assert(html.includes('Task details'));
const unsafe={...stable,task:{...stable.task,reason:'<img src=x onerror=bad()>'}};assert(!renderFleetTask(unsafe).includes('<img'));
console.log('PASS: four physical survey sorties, owned identities, legacy migration, save/resume, at-most-once scan/debit, manual/HOLD takeover, recall/cancel, safety overrides, route timeout, fixed waypoints, collision, malformed jobs and menu status.');
