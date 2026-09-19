import assert from 'node:assert/strict';
import {SpatialIndex} from './dist/spatial-index.js';
import {obstruction} from './dist/drone-system.js';
import {clipCamera} from './dist/experience.js';

let seed=71;const random=()=>((seed=seed*1664525+1013904223>>>0)/4294967296);
const solids=Array.from({length:1200},()=>({x:random()*1200-600,z:random()*5200-4900,w:.5+random()*12,d:.5+random()*12,minY:0,maxY:2+random()*30}));
const index=new SpatialIndex(solids,64);assert.equal(index.stats().bodies,solids.length);
let arrayChecks=0,indexChecks=0;
for(let i=0;i<250;i++){
 const a=[random()*1200-600,1+random()*35,random()*5200-4900],b=[a[0]+random()*80-40,a[1]+random()*20-10,a[2]+random()*80-40];
 assert.equal(obstruction(a,b,index),obstruction(a,b,solids),'Indexed obstruction matches full scan');
 assert.deepEqual(clipCamera(a,b,index),clipCamera(a,b,solids),'Indexed camera clipping matches full scan');
 arrayChecks+=solids.length;indexChecks+=index.querySegment(a,b,.4).length;
}
assert(indexChecks<arrayChecks*.08,'Broad phase removes at least 92% of distant checks');
const extra={x:0,z:0,w:2,d:2,minY:0,maxY:5};solids.push(extra);assert(index.queryPoint(0,0).includes(extra),'Index rebuilds when static collision list grows');
console.log('PASS: spatial broad phase preserves obstruction/camera results and reduced candidates by '+Math.round((1-indexChecks/arrayChecks)*100)+'%.',index.stats());
