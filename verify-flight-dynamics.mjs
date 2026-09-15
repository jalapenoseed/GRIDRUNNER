import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {dronePerformance,createDrone,updateDrone,migrateDrone,commandDrone} from './dist/drone-system.js';
import {droneSticks,TouchStick} from './dist/drone-controls.js';
import {flightPayload,YARD_CARGO_KG} from './dist/flight-yard.js';

const classes=['scout','relay','engineer','cargo'];
for(let i=1;i<classes.length;i++){
 const light=dronePerformance(classes[i-1]),heavy=dronePerformance(classes[i]);
 assert(light.massKg<heavy.massKg);assert(light.speed>heavy.speed);assert(light.acceleration>heavy.acceleration);
 assert(light.angularResponse>heavy.angularResponse);assert(light.windResponse>heavy.windResponse);
}
const empty=dronePerformance('cargo'),loaded=dronePerformance('cargo',YARD_CARGO_KG);
assert.equal(loaded.massKg,14.4);assert(loaded.speed<empty.speed&&loaded.climb<empty.climb);
assert(loaded.braking<empty.braking&&loaded.drain>empty.drain);
for(const bad of [NaN,Infinity,-6,undefined])assert.equal(dronePerformance('cargo',bad).loadKg,0);
assert.equal(dronePerformance('cargo',999).loadKg,8);assert.equal(dronePerformance('missing').name,'Scout');
assert.equal(flightPayload({carrying:true},'cargo'),6);assert.equal(flightPayload({carrying:true},'scout'),0);assert.equal(flightPayload(null,'cargo'),0);

function simulate(type,payloadKg=0,extra={},seconds=2,initial={}){
 const d=Object.assign(createDrone([0,40,0]),{mode:'MANUAL'},initial);let battery=100;
 for(let t=0;t<seconds;t+=.02){const result=updateDrone(d,.02,{home:[0,40,0],battery,type,payloadKg,...extra});battery=result.battery;}
 return {d,battery};
}
const unloaded=simulate('cargo',0,{input:[1,0,1]}),laden=simulate('cargo',6,{input:[1,0,1]});
assert(unloaded.d.speed>laden.d.speed);assert(unloaded.d.pos[1]>laden.d.pos[1]);assert(unloaded.battery>laden.battery);
// Equal initial speed makes the extra stopping distance a mass effect.
const stopEmpty=simulate('cargo',0,{},5,{velocity:[0,0,-15]}),stopLaden=simulate('cargo',6,{},5,{velocity:[0,0,-15]});
assert(Math.abs(stopLaden.d.pos[2])>Math.abs(stopEmpty.d.pos[2])*1.35);assert(stopLaden.d.speed<.1);
const lightTurn=simulate('scout',0,{flight:'acro',attitude:[0,.5,0]},.3),heavyTurn=simulate('cargo',6,{flight:'acro',attitude:[0,.5,0]},.3);
assert(lightTurn.d.yaw>heavyTurn.d.yaw);
assert(simulate('scout',0,{wind:3,elapsed:1},.5).d.pos[0]>simulate('cargo',0,{wind:3,elapsed:1},.5).d.pos[0]);
for(const type of classes){
 const profile=dronePerformance(type),fast=simulate(type,0,{flight:'acro'},.02,{velocity:[300,50,-300]});
 assert(Math.hypot(fast.d.velocity[0],fast.d.velocity[2])<=profile.speed+.001);assert(fast.d.velocity[1]<=profile.climb);
 const wall=simulate(type,0,{input:[1,0,0],solids:[{x:0,z:-6,w:5,d:.02,minY:0,maxY:80}]},2);
 assert(wall.d.pos[2]>-6,'Fast '+type+' cannot tunnel through a thin wall');
 const old=migrateDrone(JSON.parse(JSON.stringify(wall.d)),[0,40,0]);assert.equal(old.mode,wall.d.mode);
 const home=[0,2,0],roof=[{x:0,z:0,w:8,d:6,minY:3.4,maxY:3.9}],returning=createDrone(home);returning.mode='MANUAL';returning.pos=[30,12,0];commandDrone(returning,'DOCK',home,100,roof);
 for(let i=0;i<2000&&returning.mode!=='DOCK';i++)updateDrone(returning,.02,{home,battery:100,type,payloadKg:type==='cargo'?6:0,solids:roof});
 assert.equal(returning.mode,'DOCK',type+' physically returns under cover');assert.equal(returning.hp,100);
}
const reserveEmpty=simulate('cargo',0,{},.02,{pos:[240,40,0]}),reserveLoaded=simulate('cargo',6,{},.02,{pos:[240,40,0]});
assert(Number.isFinite(reserveEmpty.battery)&&Number.isFinite(reserveLoaded.battery));
let d=createDrone([0,40,0]);d.mode='MANUAL';d.pos=[240,40,0];updateDrone(d,.02,{home:[0,40,0],battery:11,type:'cargo',payloadKg:6});assert.equal(d.mode,'RETURN HOME','Loaded reserve includes slower travel and higher draw');
d=createDrone([0,40,0]);d.mode='MANUAL';d.pos=[240,40,0];updateDrone(d,.02,{home:[0,40,0],battery:11,type:'cargo'});assert.equal(d.mode,'MANUAL','The same battery is enough for the unloaded return reserve');
d=createDrone([0,40,0]);assert.equal(updateDrone(d,.02,{home:[0,40,0],battery:50,type:'cargo',payloadKg:6}).battery,50,'Docked cargo does not consume flight energy');

assert(droneSticks().input.every(v=>v===0));
let mapped=droneSticks({move:[.5,-1],look:[.3,-.8]});
assert.deepEqual(mapped.input,[.8,.3,1]);assert.deepEqual(mapped.look,[-.5,0]);
mapped=droneSticks({move:[.5,-1],look:[.3,-.8]},{flight:'acro'});
assert.deepEqual(mapped.input,[0,0,1]);assert.deepEqual(mapped.attitude,[-.8,-.5,-.3]);
assert.equal(droneSticks({look:[0,-1]},{flight:'acro',invert:true}).attitude[0],1);
mapped=droneSticks({move:[.4,-.7],look:[.2,-.6],vertical:1},{layout:'classic',flight:'acro'});
assert.deepEqual(mapped.input,[.7,.4,1]);assert.deepEqual(mapped.attitude,[.6,-.2,-.4]);

const dom=new JSDOM('<div id="left"><i></i></div><div id="right"><i></i></div>'),w=dom.window;
let enabled=true;const elements=[...w.document.querySelectorAll('div')];
for(const element of elements)element.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
const [left,right]=elements.map(e=>new TouchStick(e,e.firstElementChild,{enabled:()=>enabled}));
const pointer=(el,type,id,x=50,y=50)=>el.dispatchEvent(Object.assign(new w.Event(type,{cancelable:true}),{pointerId:id,clientX:x,clientY:y}));
pointer(elements[0],'pointerdown',1,50,0);pointer(elements[1],'pointerdown',2,100,50);assert.equal(left.y,-1);assert.equal(right.x,1);
pointer(elements[0],'pointerdown',3,0,50);assert.equal(left.pointer,1,'Extra finger cannot steal a stick');
pointer(elements[0],'pointerup',3);assert.equal(left.y,-1);
pointer(elements[1],'pointercancel',2);assert.equal(right.x,0);assert.equal(left.y,-1,'Cancel affects only its own stick');
left.reset();pointer(elements[0],'pointermove',1,0,50);assert.equal(left.x,0,'Menu reset ignores stale pointer moves');
pointer(elements[0],'pointerdown',4,51,50);assert.equal(left.x,0,'Center deadzone');pointer(elements[0],'lostpointercapture',4);assert.equal(left.pointer,null);
enabled=false;pointer(elements[1],'pointerdown',5,100,50);assert.equal(right.pointer,null);
console.log('PASS: mass/class/load dynamics, stopping distance, draw, reserve return, angular response, wind, speed limits, fast swept collisions, legacy records, Mode 2/classic axes and independent touch cancellation.');
