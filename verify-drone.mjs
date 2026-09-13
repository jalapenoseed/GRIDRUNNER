import assert from 'node:assert/strict';
import {createDrone,commandDrone,updateDrone,migrateDrone,scanEntities,obstruction} from './dist/drone-system.js';
const home=[0,2,15];let d,battery;
const reset=()=>{d=createDrone(home);battery=100;};
function tick(seconds,extra={}){for(let t=0;t<seconds;t+=.02){const r=updateDrone(d,.02,{home,battery,...extra});battery=r.battery;}}
reset();assert(commandDrone(d,'MANUAL',home,battery));tick(.1,{input:[1,0,0]});assert(d.speed>0&&d.speed<3,'Acceleration is gradual');tick(2,{input:[1,0,1]});assert(d.altitude>10,'Ascend');let altitude=d.altitude;tick(3,{input:[0,0,-1]});assert(d.altitude<altitude,'Descend');tick(3);assert(d.speed<.5,'Drag brakes after releasing input');assert(battery<100);
reset();commandDrone(d,'MANUAL',home,battery);tick(5,{input:[1,0,1]});let p=[...d.pos];commandDrone(d,'HOLD',home,battery);tick(15);assert(Math.hypot(...d.pos.map((v,i)=>v-p[i]))<.5,'HOLD returns to its captured position');commandDrone(d,'DOCK',home,battery);tick(30);assert.equal(d.mode,'DOCK','Physical return and docking');
reset();commandDrone(d,'FOLLOW',home,battery);for(let t=0;t<20;t+=.02){home[2]-=.6;tick(.02);}assert(Math.abs(d.pos[2]-home[2])<35,'FOLLOW catches a 30m/s bike');
reset();commandDrone(d,'MANUAL',home,battery);d.pos=[500,20,-600];tick(5);assert.equal(d.mode,'RETURN HOME','Sustained link loss engages return');
reset();commandDrone(d,'MANUAL',home,battery);battery=8;tick(.1);assert.equal(d.mode,'RETURN HOME','Battery reserve failsafe');
reset();commandDrone(d,'MANUAL',home,battery);battery=0;tick(8);assert.equal(d.mode,'LANDED');assert(d.altitude<1,'Emergency landing survives connection loss');
reset();commandDrone(d,'MANUAL',home,battery);const wall={x:0,z:home[2]-8,w:5,d:1,minY:0,maxY:12};tick(3,{input:[1,0,0],solids:[wall]});assert(d.hp<100,'Collision damage');assert(d.pos[2]>wall.z,'Cannot fly through wall');
assert.equal(obstruction([0,4,0],[0,4,-20],[{x:0,z:-10,w:2,d:1,maxY:10}]),1);assert.equal(obstruction([0,20,0],[0,20,-20],[{x:0,z:-10,w:2,d:1,maxY:10}]),0,'Above roof has clear signal');
reset();commandDrone(d,'MANUAL',home,battery);const entities=[{id:'near',kind:'ENERGY',name:'Power',x:0,y:2,z:home[2]},{id:'far',kind:'SIGNAL',name:'Far',x:500,y:2,z:0}];assert.equal(scanEntities(d,entities,{}).length,1);assert.equal(scanEntities(d,entities,{}).length,0,'Cooldown');assert.equal(migrateDrone(undefined,home).mode,'DOCK');assert.equal(migrateDrone(undefined,home,true).mode,'MANUAL');assert.throws(()=>migrateDrone({...d,pos:[NaN,0,0]},home));
console.log('PASS: drone inertia, speed, climb/descent, braking, follow, hold, physical dock, collision, damage, signal loss, reserve return, emergency landing, scan radius/cooldown and migration.');
// Attitude changes trajectory, persists independently, and yields to the autopilot.
reset();commandDrone(d,'MANUAL',home,battery);d.pos=[home[0],40,home[2]];d.pitch=Math.PI/6;tick(1,{flight:'acro',input:[1,0,0]});assert(d.pos[1]>40,'Pitched nose drive produces upward world motion');assert(d.pos[2]<home[2],'Thrust follows nose');
let roll=d.roll;tick(.3,{flight:'acro',attitude:[0,.5,.6]});assert(d.roll>roll);assert(d.yaw>0);const savedAttitude=migrateDrone(JSON.parse(JSON.stringify(d)),home,true);assert.equal(savedAttitude.pitch,d.pitch);assert.equal(savedAttitude.roll,d.roll);assert.equal(savedAttitude.yaw,d.yaw);
const legacyAttitude=JSON.parse(JSON.stringify(d));for(const k of ['pitch','roll','yaw','rates'])delete legacyAttitude[k];assert.equal(migrateDrone(legacyAttitude,home,true).roll,0);assert.throws(()=>migrateDrone({...d,roll:NaN},home,true));
commandDrone(d,'HOLD',home,battery);tick(12,{flight:'acro'});assert(d.speed<.3);commandDrone(d,'DOCK',home,battery);tick(30,{flight:'acro'});assert.equal(d.mode,'DOCK','Acro yields to safe automatic docking');
reset();commandDrone(d,'MANUAL',home,battery);d.pos=[home[0],20,home[2]];d.roll=.65;tick(1,{flight:'acro'});assert(d.pos[1]<20,'Banking reduces vertical rotor lift; gravity is not cosmetic');
reset();commandDrone(d,'MANUAL',home,battery);d.pos=[0,10,0];d.velocity=[0,0,-100];updateDrone(d,.05,{home:[0,2,0],battery:100,flight:'acro',solids:[{x:0,z:-1,w:3,d:.02,minY:0,maxY:20}]});assert(d.pos[2]>-1,'Swept collision stops thin-wall tunneling');
console.log('PASS: pitch/yaw/roll dynamics, oriented thrust, gravity, saved attitude/rates, legacy migration, thin-wall collision and acro-to-autopilot recovery.');
