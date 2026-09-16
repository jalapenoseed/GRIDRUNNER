import assert from 'node:assert/strict';
import {createCircuits,evaluateCircuits,energizeCircuits,setCircuitRoute,validateCircuits,CIRCUIT_CLUES,LOADS} from './dist/relay-circuits.js';
import {MenuTrail,lessonState,completeLesson,rankedFieldPages} from './dist/field-flow.js';
import {FORMATIONS,AIRCRAFT,formationSlot} from './dist/squadron.js';
import {availableSensors,sensorFor,idleOffset} from './dist/sensor-packages.js';
import {createDrone,scanEntities,updateDrone} from './dist/drone-system.js';
const trail=new MenuTrail();trail.enter('quick','',true);trail.enter('drones','quick',true);trail.enter('settings','drones',true);assert.equal(trail.back(true),'drones');assert.equal(trail.back(true),'quick');assert.equal(trail.back(true),'pause');
const state={lessons:{sensor:'skipped'},mode:'drone',hp:100,battery:100};completeLesson(state,'scan');assert.deepEqual(lessonState(JSON.parse(JSON.stringify(state.lessons))),{scan:'done',sensor:'skipped'});assert.throws(()=>lessonState({scan:'unlocked'}));assert.equal(rankedFieldPages(state)[0][0],'drones');
// Enumerate all 256 authored routes, independent of the player UI.
const solutions=[];for(const A of Object.keys(LOADS))for(const B of Object.keys(LOADS))for(const C of Object.keys(LOADS))for(const D of Object.keys(LOADS)){const routes={A,B,C,D};const result=evaluateCircuits(routes,true);if(result.ok&&result.complete)solutions.push(routes);}
assert.deepEqual(solutions,[{A:'fan',B:'transmitter',C:'receiver',D:'off'}]);
const c=createCircuits();c.routes={...solutions[0]};assert(!energizeCircuits(c).ok,'Clues required');c.clues=Object.keys(CIRCUIT_CLUES);assert(!energizeCircuits(c).ok,'168 W startup trips');assert(!c.running);setCircuitRoute(c,'A','off');assert(energizeCircuits(c).ok);assert(!c.solved);assert(validateCircuits(structuredClone(c)).running);setCircuitRoute(c,'A','fan');assert(energizeCircuits(c).complete);const tries=c.attempts;energizeCircuits(c);assert.equal(c.attempts,tries,'Commissioning is idempotent');assert(!setCircuitRoute(c,'D','fan'),'Commissioned state locked');assert(validateCircuits(undefined,{legacySolved:true}).solved);
assert.throws(()=>validateCircuits({...createCircuits(),solved:true}));
const entities=[{id:'power',name:'equipment',kind:'ENERGY',x:20,y:1,z:0},{id:'person',name:'body',kind:'HOSTILE',x:20,y:1,z:2},{id:'crate',name:'cache',kind:'SALVAGE',x:20,y:1,z:4}];
const read=(type,sensor)=>scanEntities({...createDrone(),pos:[0,3,0]},entities,{type,sensor});
assert.equal(read('engineer','thermal').length,2);assert.equal(read('relay','rf').length,1);assert.equal(read('scout','acoustic').length,1);assert.equal(read('cargo','depth').length,3);assert.match(read('cargo','depth')[0].reading,/m range/);assert.equal(sensorFor('cargo','thermal'),'visible');assert(!availableSensors('relay').includes('night'));assert(read('engineer','thermal').every(p=>p.source==='world-simulation'&&p.confidence>0&&p.confidence<=1));
for(const pattern of FORMATIONS.filter(f=>f!=='RELAY OUTPOST'))for(let t=0;t<100;t+=.5){const points=AIRCRAFT.map(id=>formationSlot(pattern,id,0,t));for(let i=0;i<4;i++){assert(points[i].every(Number.isFinite));assert(points[i][1]>=7);if(pattern==='BUZZ PASS')assert(Math.hypot(points[i][0],points[i][2])>=8);for(let j=i+1;j<4;j++)assert(Math.hypot(...points[i].map((v,k)=>v-points[j][k]))>=2.9,'Slots remain separated');}}
assert(Math.hypot(...idleOffset('scout',2))>Math.hypot(...idleOffset('cargo',2)));
const d=createDrone();d.mode='HOLD';d.pos=d.hold=[0,10,0];updateDrone(d,.02,{home:[0,2,0],battery:100,type:'scout',elapsed:5,formationOffset:[20,20,20]});assert.deepEqual(d.pos,[0,10,0],'Idle / formation never shifts operator HOLD');
console.log('PASS: parent traversal, saved lessons, context ranking, unique circuit solve / surge / reload / legacy, sensor evidence distinctions, formation clearance and HOLD authority.');
