import assert from 'node:assert/strict';
import {GamePhysics} from './dist/physics-world.js';
import {buildCampRoutes} from './dist/camp-navigation.js';
import {AmbientResidents} from './dist/ambient-residents.js';
import * as T from './dist/three.js';

// Load the same vendored WASM shipped to the browser, not npm mocks.
const solids=[{x:3,z:0,w:.1,d:5,minY:0,maxY:4},
  {x:0,z:12,w:3,d:3,minY:3,maxY:3.2},
  {x:0,z:-12,w:3,d:2,minY:0,maxY:8,drone:false}];
const physics=new GamePhysics(solids);
assert.equal(physics.moveRider({x:0,y:1.7,z:0},1,0).hit,false,'Startup uses swept fallback movement');
await physics.ready;assert.equal(physics.status,'ready');
let moved=physics.moveRider({x:0,y:1.7,z:0},20,2);
assert(moved.hit&&moved.x<2.8&&moved.x>2.6,'Swept rider cannot tunnel through a thin wall');
assert(Math.abs(moved.z-2)<.01,'Rider slides along the wall');
moved=physics.moveRider({x:0,y:7,z:0},20,0);assert(moved.x>19.9,'Raised rider clears low walls');
moved=physics.moveRider({x:0,y:1.7,z:8},0,7);assert(moved.z>14.9,'Grounded rider passes beneath roof');
assert(physics.sweepDrone([0,2,0],[50,2,0]),'Fast drone crosses a wall between endpoints');
assert(physics.sweepDrone([0,1,12],[0,7,12]),'Drone cannot pass through a thin roof');
assert(!physics.sweepDrone([0,5,0],[50,5,0]),'Drone clears wall top');
assert(!physics.sweepDrone([0,2,-7],[0,2,-17]),'Ground-only barriers do not block aircraft');
assert(physics.moveRider({x:0,y:1.7,z:-7},0,-10).hit,'Ground-only barrier still stops rider');
solids.push({x:0,z:25,w:4,d:.1,minY:0,maxY:5});
assert(physics.sweepDrone([0,2,20],[0,2,30]),'New geometry refreshes the broad phase');
solids.at(-1).x=40;physics.rebuild();
assert(!physics.sweepDrone([0,2,20],[0,2,30]),'Explicit rebuild updates moved geometry');
physics.dispose();physics.dispose();assert.equal(physics.status,'disposed');
const cancelled=new GamePhysics([]);cancelled.dispose();await cancelled.ready;
assert.equal(cancelled.status,'disposed','Dispose during asynchronous startup is safe');

const camp={id:'test',x:0,z:0,bounds:[-10,10,-10,10],stops:[[-6,0],[6,0],[6,6],[-6,6]]};
const obstacle={x:0,z:0,w:2,d:2,minY:0,maxY:3};
const [result]=await buildCampRoutes([camp],[obstacle]);
assert.equal(result.error,undefined);assert.equal(result.routes.length,4);
assert(result.routes[0].length>2,'Recast generates a detour around the building');
for(const path of result.routes)for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i];
  for(let t=0;t<=1;t+=.01){const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
    assert(!(Math.abs(x)<2.25&&Math.abs(z)<2.25),'Route keeps person clearance from walls');}
}
const [blocked]=await buildCampRoutes([camp],[{...obstacle,d:20}]);
assert(blocked.error&&blocked.routes.length===0,'Disconnected/partial paths are rejected');
const [lowRoof]=await buildCampRoutes([{...camp,stops:[[-1,0],[1,0]]}],
  [{x:0,z:0,w:4,d:4,minY:1.5,maxY:4}]);
assert(lowRoof.error,'Low ceiling excludes standing-height navigation');

const makeActor=()=>{const actor=new T.Group();actor.userData.legs=[new T.Group(),new T.Group()];actor.userData.arms=[new T.Group(),new T.Group()];return actor;};
const mara=makeActor();const residents=new AmbientResidents(mara,{actors:[]},[],{
  build:async()=>[{id:'mara',routes:[[{x:54,z:-94},{x:57,z:-94}],[{x:57,z:-94},{x:54,z:-94}]]}]
});await residents.ready;
const state={leg:1,mode:'foot',pos:new T.Vector3(70,1.7,-94)};
for(let i=0;i<500;i++)residents.update(.05,state,{allowMara:false});
assert.equal(mara.position.x,54,'Mara remains fixed throughout onboarding');
for(let i=0;i<230;i++)residents.update(.05,state);
assert(mara.position.x>55,'Resident walks after working');
assert(mara.userData.legs.some(leg=>leg.rotation.x!==0),'Walking articulates legs');
state.pos.set(mara.position.x+3,1.7,mara.position.z);const stopped=mara.position.clone();
for(let i=0;i<100;i++)residents.update(.05,state);
assert(mara.position.x===stopped.x&&mara.position.z===stopped.z,'Resident stops for conversation');
assert.equal(residents.actors[0].state,'WATCH');
const fresh={...state,pos:new T.Vector3(70,1.7,-94)};residents.update(.05,fresh);
assert.equal(mara.position.x,54,'New campaign restores ambient actors to camp');
console.log('PASS: real Rapier sweeps, sliding, roof/ground masks, collider rebuilds and disposal; real Recast detours, unreachable stops and low ceilings; resident schedules, conversation stops and tutorial reset.');
