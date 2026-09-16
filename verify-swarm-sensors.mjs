import assert from 'node:assert/strict';
import {createDrone,updateDrone,scanEntities} from './dist/drone-system.js';
import {swarmSnapshot,swarmVelocity} from './dist/swarm-steering.js';
import {availableSensors,sensorFor} from './dist/sensor-packages.js';
import {LAB_CONTACTS,FIELD_UV,recordLabScan,compareLabDetections} from './dist/sensor-lab.js';
import {createFlightSession} from './dist/flight-yard.js';
const squad={scout:{type:'scout',system:createDrone([-20,12,0]),battery:100},cargo:{type:'cargo',system:createDrone([20,12,0]),battery:100}};
for(const r of Object.values(squad))r.system.mode='FOLLOW';let nearest=Infinity;
for(let i=0;i<600;i++){
 const peers=swarmSnapshot(squad);
 for(const [id,r]of Object.entries(squad))r.battery=updateDrone(r.system,.02,{home:[0,2,0],battery:r.battery,type:id,formationOffset:[id==='scout'?20:-20,10,0],swarmPeers:peers,idleMotion:false}).battery;
 nearest=Math.min(nearest,Math.hypot(...squad.scout.system.pos.map((v,k)=>v-squad.cargo.system.pos[k])));
}
assert(nearest>2.2,'crossing airframes retain hull clearance');assert(squad.scout.system.pos[0]>19&&squad.cargo.system.pos[0]<-19,'avoidance still reaches assigned slots');assert(squad.scout.battery<100&&squad.cargo.battery<100,'finite battery remains authoritative');
const d=createDrone([0,12,0]),desired=[4,0,0],peers=[{id:'cargo',pos:[.1,12,0],velocity:[-5,0,0],mode:'FOLLOW',radius:1.5}];
for(const mode of ['MANUAL','HOLD','RETURN HOME','RELEASE','PERCHED','RELAY','LANDED']){d.mode=mode;assert.deepEqual(swarmVelocity(d,desired,{id:'scout',peers}),desired,mode+' keeps control');}
d.mode='SCOUT AHEAD';assert.deepEqual(swarmVelocity(d,desired,{id:'scout',peers,taskTarget:[5,12,0]}),desired,'precision job keeps control');
d.mode='FOLLOW';assert(swarmVelocity(d,[40,20,40],{id:'scout',peers,speed:12,climb:4}).every(Number.isFinite));
updateDrone(d,.02,{home:[0,2,0],battery:2,swarmPeers:peers});assert.equal(d.mode,'RETURN HOME','battery failsafe wins');
assert(availableSensors('scout').includes('uv'));assert(availableSensors('engineer').includes('thermal'));assert(availableSensors('relay').includes('rf'));assert.equal(sensorFor('cargo','uv'),'visible');
for(const [mode,type,id]of [['uv','scout','lab-uv'],['thermal','engineer','lab-thermal'],['rf','relay','lab-rf']]){
 const drone=createDrone([160,7,111]),tags=scanEntities(drone,[...LAB_CONTACTS,{id:'generic',kind:'OBJECTIVE',x:160,y:1,z:111}],{type,sensor:mode});
 assert(tags.some(t=>t.id===id&&t.source==='world-simulation'&&t.sensor===mode));assert(!tags.some(t=>t.id==='generic'),'no unmodeled fluorescence');
 const blocked=scanEntities(createDrone([160,7,111]),LAB_CONTACTS,{type,sensor:mode,solids:[{x:160,z:104,w:40,d:1,minY:0,maxY:30},{x:160,z:102,w:40,d:1,minY:0,maxY:30}]});assert.equal(blocked.length,0,'occlusion respected');
}
assert.equal(scanEntities(createDrone([-28,4,-199]),FIELD_UV,{sensor:'visible'}).length,0,'UV traces hidden from RGB scan');
assert.equal(scanEntities(createDrone([0,4,0]),FIELD_UV,{sensor:'uv'}).length,0,'UV range limited');
const f=createFlightSession();f.job='sensors';assert(!recordLabScan(f,[], 'uv'));
for(const mode of ['uv','thermal','rf'])recordLabScan(f,[{id:'lab-'+mode,sensor:mode}],mode);assert(f.complete);recordLabScan(f,[{id:'lab-uv',sensor:'uv'}],'uv');assert.equal(f.sensorReadings.length,3);
const box={label:'person',x1:0,y1:0,x2:20,y2:40,score:.9};assert.deepEqual(compareLabDetections([box,box],[box]),{matches:1,missed:0,extra:1,total:1});assert.equal(compareLabDetections([{...box,label:'car'}],[box]).matches,0,'labels cannot substitute');assert.equal(compareLabDetections([],[box]).missed,1,'no invented detection on a miss');
console.log('PASS: crossing clearance '+nearest.toFixed(2)+' m, formation arrival, finite charge, pilot/task/failsafe authority, UV/thermal/RF filters and occlusion, lab completion and honest pixel/reference scoring.');
