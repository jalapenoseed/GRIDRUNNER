import assert from 'node:assert/strict';
import {AIRCRAFT,FORMATIONS,formationSlot,validFormation} from './dist/squadron.js';
import {createDrone,commandDrone,updateDrone} from './dist/drone-system.js';

assert.deepEqual(FORMATIONS,['WEDGE','TRAIL','LINE','ORBIT','RELAY OUTPOST','STAGGERED','HIGH / LOW','PROTECTIVE RING','OVERWATCH','SEARCH GRID','BUZZ PASS']);
assert.equal(validFormation('LINE'),'LINE');
assert.equal(validFormation('unknown'),'WEDGE');

const home=[0,2,0],yaw=.63;
for(const formation of FORMATIONS){
 const slots=AIRCRAFT.map(id=>formationSlot(formation,id,yaw,12));
 assert.equal(new Set(slots.map(p=>p.map(n=>n.toFixed(3)).join(','))).size,4,formation+' gives every aircraft a unique slot');
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)assert(Math.hypot(...slots[i].map((n,k)=>n-slots[j][k]))>3.5,formation+' maintains safe spacing');
}

const squad=AIRCRAFT.map(id=>({id,d:createDrone(home),battery:100}));
for(const r of squad)assert(commandDrone(r.d,'FOLLOW',home,r.battery,[]));
for(let frame=0;frame<600;frame++)for(const r of squad){
 const result=updateDrone(r.d,.02,{home,yaw,battery:r.battery,type:r.id,terrain:()=>0,formationOffset:formationSlot('WEDGE',r.id,yaw,frame*.02)});
 r.battery=result.battery;
}
for(let i=0;i<squad.length;i++)for(let j=i+1;j<squad.length;j++)assert(Math.hypot(...squad[i].d.pos.map((n,k)=>n-squad[j].d.pos[k]))>3.5,'Wedge aircraft converge without overlap');
const before=formationSlot('ORBIT','scout',0,0),after=formationSlot('ORBIT','scout',0,5);
assert.notDeepEqual(after,before,'Orbit formation advances around the rider');
console.log('PASS: fleet presets and outpost fallback slots, stable per-aircraft spacing and moving orbit formation.');
