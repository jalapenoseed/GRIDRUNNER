import assert from 'node:assert/strict';
import {createDrone,migrateDrone,updateDrone,droneLink,radioQuality} from './dist/drone-system.js';
import {createAircraftRecord,validateAircraftTask,taskDestination,advanceAircraftTask,activeRelayNodes,commandAircraft,controlTask} from './dist/fleet-tasks.js';
import {planRelayOutpost,deployRelayOutpost} from './dist/relay-outpost.js';
import {GamePhysics} from './dist/physics-world.js';
import {DroneFleet} from './dist/drone-fleet.js';
import * as T from './dist/three.js';
const home=[0,2,0],copy=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>Object.fromEntries(['scout','relay'].map(id=>[id,createAircraftRecord(id,createDrone(home))]));
const options={home,terrain:()=>0,leg:1,solids:[]};
let scans=0,maxRange=0,relayed=false;
function tick(squad,seconds,extra={}){
 const env={...options,...extra};
 for(let i=0;i<seconds*50;i++)for(const r of Object.values(squad)){
  const result=updateDrone(r.system,.02,{...env,type:r.type,battery:r.battery,taskTarget:taskDestination(r),relayNodes:activeRelayNodes(squad)});r.battery=result.battery;
  advanceAircraftTask(r,.02,{...env,squad,events:result.events,scan:()=>{scans++;return 3;}});
  if(r.type==='scout'){maxRange=Math.max(maxRange,r.system.range);relayed||=!!r.system.linkVia;}
 }
}
const reload=s=>Object.fromEntries(Object.entries(copy(s)).map(([id,r])=>[id,validateAircraftTask(createAircraftRecord(id,migrateDrone(r.system,home),r.battery),r)]));
function settleRelay(s){for(let i=0;i<2500&&s.relay.system.mode!=='RELAY';i++)tick(s,.02);assert.equal(s.relay.system.mode,'RELAY','Outpost must land within 50 seconds');}
let squad=fresh();assert(deployRelayOutpost(squad,options).ok);assert.equal(squad.scout.task.stage,'WAIT');
tick(squad,1);assert(squad.scout.system.range<20,'Scout waits near launch while Relay deploys');
const before=copy(squad);squad=reload(squad);assert.equal(squad.scout.task.relayId,squad.relay.id);assert.equal(squad.relay.battery,before.relay.battery);
settleRelay(squad);assert.equal(squad.relay.system.mode,'RELAY');assert.equal(squad.relay.task.stage,'RELAY');assert(squad.relay.system.altitude<.85);assert.equal(squad.relay.system.thrust,0);assert.equal(squad.relay.system.hp,100);
const landed=copy(squad.relay.system.pos),charge=squad.relay.battery;squad=reload(squad);tick(squad,2);assert.deepEqual(squad.relay.system.pos,landed);assert(Math.abs(charge-squad.relay.battery-.024)<1e-8,'Landed relay draws radio power only');
tick(squad,50);assert.equal(squad.scout.task.state,'COMPLETED');assert.equal(squad.scout.system.mode,'DOCK');assert.equal(scans,1);assert(maxRange>450&&relayed,'Scout goes beyond its 420 m direct range on the relay');
const battery=squad.scout.battery;squad=reload(squad);tick(squad,1);assert.equal(scans,1);assert.equal(squad.scout.battery,battery);
const relayPos=[...squad.relay.system.pos];assert(commandAircraft(squad.relay,'RETURN HOME',home));assert.deepEqual(squad.relay.system.pos,relayPos,'Remote recall never teleports the landed relay');tick(squad,40);assert.equal(squad.relay.system.mode,'DOCK');assert.equal(squad.relay.task.state,'CANCELLED');

// A disconnected, exhausted, damaged or paused relay cannot serve as a free range boost.
const node={id:'relay',pos:[0,.7,-240],battery:80,hp:100};
const scoutPoint=[0,22,-460],link=droneLink(scoutPoint,home,{relayNodes:[node]});assert(link.signal>50&&link.via==='relay');assert.equal(droneLink(scoutPoint,home).signal,0);
assert.equal(droneLink(scoutPoint,home,{relayNodes:[{...node,battery:0}]}).signal,0);
assert(droneLink(scoutPoint,home,{relayNodes:[node],storm:true}).signal<link.signal);
assert.equal(droneLink(scoutPoint,[600,2,0],{relayNodes:[node]}).via,null,'The upstream hop must reach the bike');
assert.equal(radioQuality(home,node.pos,620,{terrain:(x,z)=>z<-70&&z>-100?12:0}),0,'Hills obstruct radio');
assert.equal(planRelayOutpost({...options,terrain:()=>200}),null);
assert.equal(planRelayOutpost({...options,home:[0,2,-1590]}),null,'Region edge cannot clamp distant jobs onto the bike');
assert.equal(planRelayOutpost({...options,solids:[{x:0,z:-240,w:90,d:50,minY:0,maxY:100}]}),null,'Occupied pads are rejected');
for(const reason of ['low','busy','sequence']){
 squad=fresh();if(reason==='low')squad.scout.battery=5;if(reason==='busy')assert(deployRelayOutpost(squad,options).ok);if(reason==='sequence')squad.scout.taskSerial=1e9;
 const snapshot=copy(squad);assert.equal(deployRelayOutpost(squad,options).ok,false);assert.deepEqual(squad,snapshot,'Failed deployment is atomic: '+reason);
}
squad=fresh();deployRelayOutpost(squad,options);settleRelay(squad);assert(controlTask(squad.relay,'pause',home).ok);assert.equal(activeRelayNodes(squad).length,0);squad=reload(squad);assert(controlTask(squad.relay,'resume',home).ok);settleRelay(squad);
squad.relay.battery=5;tick(squad,.02);assert.equal(squad.relay.system.mode,'RETURN HOME');assert.equal(squad.relay.task.state,'FAILED');assert.equal(activeRelayNodes(squad).length,0);squad=reload(squad);assert.equal(squad.relay.task.state,'FAILED');
squad=fresh();deployRelayOutpost(squad,options);commandAircraft(squad.relay,'RETURN HOME',home);tick(squad,.02);assert.equal(squad.scout.task.state,'FAILED','Waiting Scout cancels if its Relay is recalled');
squad=fresh();deployRelayOutpost(squad,options);settleRelay(squad);squad.scout.system.pos=[...scoutPoint];squad.scout.system.velocity=[0,0,0];squad.scout.system.signal=0;squad.scout.system.linkLost=2;commandAircraft(squad.relay,'RETURN HOME',home);tick(squad,.02);assert.equal(squad.scout.system.mode,'RETURN HOME');assert.equal(squad.scout.task.state,'FAILED','Relay loss respects the normal lost-link return');
for(const mutate of [s=>s.scout.task.relayId='foreign',s=>s.relay.task.scanned=true,s=>s.relay.task.kind='SURVEY',s=>s.scout.task.stage='RELAY']){
 squad=fresh();deployRelayOutpost(squad,options);settleRelay(squad);mutate(squad);assert.throws(()=>reload(squad),'Malformed dependency and task stages rejected');
}

// A real Rapier volume on the approach must be flown over, including on recall.
const physics=new GamePhysics([{x:0,z:-120,w:3,d:.1,minY:0,maxY:8}]);await physics.ready;assert.equal(physics.status,'ready');
squad=fresh();assert(deployRelayOutpost(squad,{...options,solids:physics}).ok);tick(squad,65,{solids:physics});assert.equal(squad.scout.task.state,'COMPLETED');assert.equal(squad.relay.system.mode,'RELAY');assert.equal(squad.scout.system.hp,100);assert.equal(squad.relay.system.hp,100);commandAircraft(squad.relay,'RETURN HOME',home,physics);tick(squad,40,{solids:physics});assert.equal(squad.relay.system.mode,'DOCK');physics.dispose();

// Material/geometry checks, not a claim about GPU appearance.
const scene=new T.Scene(),fleet=new DroneFleet(scene,{assets:false}),camera=new T.PerspectiveCamera();camera.position.set(0,2,0);
const state={droneType:'scout',droneSystem:createDrone(home),drone:100,squad:{},mode:'bike',elapsed:0};state.droneSystem.mode='HOLD';state.droneSystem.pos=[0,20,-300];
fleet.update(.02,state,new T.Object3D(),new T.Object3D(),camera);const beacon=fleet.records.scout.root.userData.beacon;assert.equal(beacon.material.blending,T.AdditiveBlending);assert(beacon.material.opacity>=.88);assert(beacon.scale.x<1.9,'Small distance-scaled point, not the previous 5.4 m halo');assert(beacon.material.depthTest,'World geometry still occludes beacons');
state.squad.relay.system.mode='RELAY';const rotor=fleet.records.relay.root.userData.rotors[0],angle=rotor.rotation.y;fleet.update(.02,state,new T.Object3D(),new T.Object3D(),camera);assert.equal(rotor.rotation.y,angle);
console.log('PASS: physical outpost landing/relaunch, waiting Scout and extended route, two-hop/terrain/weather signal, finite idle drain, loss/recall/pause, atomic refusal, persistent jobs, real Rapier clearance and compact beacon materials.');
