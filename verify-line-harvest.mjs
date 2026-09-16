import assert from 'node:assert/strict';
import {createDrone,migrateDrone,updateDrone} from './dist/drone-system.js';
import {createAircraftRecord,validateAircraftTask,taskDestination,advanceAircraftTask,commandAircraft,controlTask} from './dist/fleet-tasks.js';
import {assignLineHarvest,findLineAnchor} from './dist/line-harvest.js';
import {LINE_SPANS,linePoint,lineBody,createLineGrid,validateLineGrid,UTILITY_BATTERY_WH} from './dist/power-lines.js';
import {GamePhysics} from './dist/physics-world.js';
const copy=v=>JSON.parse(JSON.stringify(v)),home=[0,2,15];
const fresh=()=>{const r=createAircraftRecord('engineer',createDrone(home),50);return {r,state:{leg:1,engineerBuilt:true,lineGrid:createLineGrid(),squad:{engineer:r}}};};
const options=o=>({home,state:o.state,solids:[],terrain:()=>0});
function tick(o,seconds=.02,extra={}){
 for(let i=0;i<seconds*50;i++){
  const r=o.r,result=updateDrone(r.system,.02,{...options(o),type:'engineer',battery:r.battery,taskTarget:taskDestination(r),...extra});r.battery=result.battery;
  const before=r.battery,source=Object.values(o.state.lineGrid.remainingWh).reduce((a,b)=>a+b,0);
  advanceAircraftTask(r,.02,{...options(o),events:result.events,...extra});
  const debit=source-Object.values(o.state.lineGrid.remainingWh).reduce((a,b)=>a+b,0);
  assert(Math.abs((r.battery-before)/100*UTILITY_BATTERY_WH-debit)<1e-9,'Every credited Wh is deducted once from the circuit');
 }
}
function until(o,condition,max=130,extra={}){for(let i=0;i<max*50&&!condition(o);i++)tick(o,.02,extra);assert(condition(o),JSON.stringify({task:o.r.task,mode:o.r.system.mode,pos:o.r.system.pos}));}
function reload(o){const source=copy(o.r),bank=copy(o.state.lineGrid);o.r=validateAircraftTask(createAircraftRecord('engineer',migrateDrone(source.system,home),source.battery),source,1);o.state.lineGrid=validateLineGrid(bank);o.state.squad.engineer=o.r;assert.deepEqual(o.state.lineGrid,bank);assert.equal(o.r.battery,source.battery);}
assert.equal(LINE_SPANS.length,24);assert.deepEqual(linePoint('line-0-0',.5),[82,36,15]);
let o=fresh();assert(assignLineHarvest(o.r,options(o)).ok);const id=o.r.task.id,anchor=copy(o.r.task.anchor),stages=new Set();
for(let i=0;i<6500&&o.r.task.stage!=='STANDBY';i++){
 const stage=o.r.task.stage;if(!stages.has(stage)){stages.add(stage);reload(o);assert.equal(o.r.task.id,id);}
 tick(o);
}
assert.deepEqual([...stages],['APPROACH','ALIGN','PERCH','COUPLING','CHARGING']);assert.equal(o.r.task.stage,'STANDBY');assert.equal(o.r.system.mode,'PERCHED');assert.equal(o.r.battery,90);assert.equal(o.r.system.hp,100);assert.equal(o.r.system.thrust,0);assert.deepEqual(o.r.system.perch,anchor);assert(Math.hypot(...o.r.system.pos.map((n,i)=>n-lineBody(anchor)[i]))<.12);
assert(Math.abs(500-o.state.lineGrid.remainingWh.south-o.r.task.harvestedWh)<1e-8);const held=copy(o.r.system.pos),bank=o.state.lineGrid.remainingWh.south;tick(o,2);assert.deepEqual(o.r.system.pos,held);assert.equal(o.state.lineGrid.remainingWh.south,bank,'Standby does not keep harvesting');
assert.equal(commandAircraft(o.r,'MANUAL',home),false,'FPV cannot bypass release');assert.equal(o.r.system.mode,'PERCHED');
assert(controlTask(o.r,'pause',home).ok);reload(o);const paused=o.state.lineGrid.remainingWh.south;tick(o,2);assert.equal(o.state.lineGrid.remainingWh.south,paused,'Paused jobs cannot charge');assert(controlTask(o.r,'resume',home).ok);assert.equal(o.r.task.stage,'COUPLING');tick(o,4);assert.equal(o.r.task.stage,'STANDBY');
assert(commandAircraft(o.r,'HOLD',home));assert.equal(o.r.system.mode,'RELEASE');assert.deepEqual(o.r.system.pos,held,'Release starts at the real attachment position');reload(o);until(o,x=>x.r.system.mode==='HOLD',15);assert.equal(o.r.system.perch,null);assert(Math.hypot(...o.r.system.pos.map((n,i)=>n-held[i]))>2.5);assert.equal(o.r.task.state,'PAUSED');assert(controlTask(o.r,'resume',home).ok);until(o,x=>x.r.system.mode==='PERCHED',30);assert(controlTask(o.r,'cancel',home).ok);assert.equal(o.r.system.mode,'RELEASE');assert.equal(assignLineHarvest(o.r,options(o)).ok,false,'A new job waits for release');reload(o);until(o,x=>x.r.system.mode==='DOCK',50);assert.equal(o.r.task.state,'CANCELLED');assert.equal(o.r.system.hp,100);

// The projection is continuous along the supported wire, not a fixed station.
for(const u of [.13,.37,.81]){o=fresh();o.r.system.mode='MANUAL';o.r.system.pos=[81,35,120-210*u];const selected=findLineAnchor(o.r,options(o));assert.equal(selected.spanId,'line-0-0');assert(Math.abs(selected.u-u)<1e-12);}
o=fresh();const dead={spanId:'line-3-0',u:.5},northOptions={...options(o),home:[0,2,-615],anchor:dead};assert.equal(assignLineHarvest(o.r,northOptions).ok,false);o.state.relay=o.state.interface=true;assert(assignLineHarvest(o.r,northOptions).ok,'Restored north circuit can accept attachments');
o=fresh();const unsupported=copy(o.r);o.state.engineerBuilt=false;assert.equal(assignLineHarvest(o.r,options(o)).ok,false);assert.deepEqual(o.r,unsupported);assert.equal(findLineAnchor(o.r,{...options(o),anchor:{spanId:'line-0-0',u:.01}}),null,'Tower-end clearance is reserved');
o=fresh();o.state.squad.other={id:'other',task:{kind:'LINE',state:'RUNNING',anchor:{spanId:'line-0-0',u:.5}}};assert.notEqual(findLineAnchor(o.r,options(o)).spanId,'line-0-0','Occupied wire section is reserved');

for(const scenario of ['depletion','powerLoss','linkLoss','hull','emptyBattery']){
 o=fresh();assignLineHarvest(o.r,options(o));until(o,x=>x.r.task.stage==='CHARGING',40);const before=copy(o.r.system.pos);
 if(scenario==='depletion')o.state.lineGrid.remainingWh.south=.001;
 if(scenario==='powerLoss')o.state.lineGrid.remainingWh.south=0;
 if(scenario==='linkLoss'){o.r.system.signal=0;o.r.system.linkLost=2;}
 if(scenario==='hull')o.r.system.hp=10;if(scenario==='emptyBattery')o.r.battery=0;
 tick(o,.08,scenario==='linkLoss'?{home:[600,2,0]}:{});
 assert.equal(o.r.task.state,'FAILED',scenario+' stops charging');assert(o.state.lineGrid.remainingWh.south>=0);assert.equal(o.r.system.mode,scenario==='emptyBattery'?'LANDED':'RELEASE',scenario+' has a physical exit');assert(Math.hypot(...o.r.system.pos.map((n,i)=>n-before[i]))<1,'No exit teleports to the bike');reload(o);assert.equal(o.r.task.state,'FAILED');
}
o=fresh();assignLineHarvest(o.r,options(o));until(o,x=>x.r.system.mode==='PERCHED',40);o.r.system.pos[0]+=2;const beforeLost=o.state.lineGrid.remainingWh.south;tick(o);assert.equal(o.r.task.state,'FAILED');assert.equal(o.state.lineGrid.remainingWh.south,beforeLost,'Displaced attachment cannot collect');
for(const mutate of [r=>r.task.anchor.u=2,r=>r.task.destination[0]+=3,r=>r.task.harvestedWh=-1,r=>r.task.targetPercent=120,r=>r.task.batteryId='foreign',r=>r.system.perch.spanId='unknown']){
 o=fresh();assignLineHarvest(o.r,options(o));until(o,x=>x.r.system.mode==='PERCHED',40);mutate(o.r);assert.throws(()=>reload(o));
}
assert.throws(()=>validateLineGrid({version:1,remainingWh:{south:501,north:1200}}));assert.deepEqual(validateLineGrid(undefined),createLineGrid());

const physics=new GamePhysics([{x:40,z:15,w:.1,d:12,minY:0,maxY:20}]);await physics.ready;assert.equal(physics.status,'ready');o=fresh();assert(assignLineHarvest(o.r,{...options(o),solids:physics}).ok);until(o,x=>x.r.task.stage==='STANDBY',130,{solids:physics});assert.equal(o.r.system.hp,100);commandAircraft(o.r,'RETURN HOME',home,physics);until(o,x=>x.r.system.mode==='DOCK',60,{solids:physics});assert.equal(o.r.system.hp,100);physics.dispose();
console.log('PASS: continuous shared wire geometry, approach/alignment/attachment/coupling, stopped propulsion, exact Wh conservation, capped charge and parked standby, every-stage saves, pause/resume, physical release, dead/occupied spans, safety and real Rapier clearance.');
