import assert from 'node:assert/strict';
import {createBatteryPacks,buildBatteryPack,loadBatteryPack,unloadBatteryPack,drainStoredPacks,packPayload,validateBatteryPacks,preparePackDelivery,PACK_WH} from './dist/battery-packs.js';
import {createDrone,updateDrone} from './dist/drone-system.js';
import {createAircraftRecord,advanceAircraftTask,taskDestination,controlTask,validateAircraftTask} from './dist/fleet-tasks.js';
import {createLineGrid,lineBody} from './dist/power-lines.js';
import {assignLineHarvest} from './dist/line-harvest.js';
const home=[0,2.4,15],trailerHome=[3,2.4,15];
const r=createAircraftRecord('engineer',createDrone(home),65),s={leg:1,engineerBuilt:true,batteryPacks:createBatteryPacks(),lineGrid:createLineGrid(),squad:{engineer:r},inv:{cells:8,wire:16,electronics:8,rubber:8},field:{storage:{trailer:{}}},trailer:20};
const context={near:true,stopped:true,trailerHome};
assert(buildBatteryPack(s,context).ok);assert(buildBatteryPack(s,context).ok);
const scout=createAircraftRecord('scout',createDrone(home));assert(!loadBatteryPack(s,scout,context).ok);assert(!loadBatteryPack(s,r,{...context,trailerHome:[100,2.4,15]}).ok);
assert(loadBatteryPack(s,r,context).ok);assert(!loadBatteryPack(s,r,context).ok);assert.equal(packPayload(s,'engineer'),1.2);
assert(assignLineHarvest(r,{state:s,home,trailerHome,deliver:true}).ok);
// Direct charge boundary: no flight draw, equal loss at circuit and gain across both batteries.
r.system.mode='PERCHED';r.system.perch={...r.task.anchor};r.system.pos=lineBody(r.task.anchor);r.task.stage='CHARGING';
const p=s.batteryPacks.packs[0],total=()=>s.lineGrid.remainingWh.south+r.battery*1.8+p.chargeWh+s.trailer*20;
const before=total();for(let i=0;i<1000;i++)advanceAircraftTask(r,.05,{state:s,home,trailerHome,trailerStopped:true});assert(Math.abs(total()-before)<1e-8);
const bank=s.lineGrid.remainingWh.south;controlTask(r,'pause',home);for(let i=0;i<100;i++)advanceAircraftTask(r,.05,{state:s,home,trailerHome,trailerStopped:true});assert.equal(s.lineGrid.remainingWh.south,bank);
assert(controlTask(r,'resume',home).ok);for(let i=0;i<3000&&r.task.stage!=='DELIVER';i++)advanceAircraftTask(r,.05,{state:s,home,trailerHome,trailerStopped:true});assert.equal(r.task.stage,'DELIVER');assert(Math.abs(p.chargeWh-PACK_WH*.9)<1e-7);assert.equal(r.system.mode,'RELEASE');
for(let i=0;i<500&&r.system.mode==='RELEASE';i++){const result=updateDrone(r.system,.02,{home,battery:r.battery,type:'engineer',payloadKg:1.2});r.battery=result.battery;advanceAircraftTask(r,.02,{state:s,home,trailerHome,trailerStopped:true,events:result.events});}
assert(controlTask(r,'pause',home).ok);const saved=JSON.parse(JSON.stringify(r));validateAircraftTask(r,saved,1);assert.equal(r.task.stage,'DELIVER');assert.equal(r.task.state,'PAUSED');assert.equal(p.owner,r.id);assert(controlTask(r,'resume',home).ok);
preparePackDelivery(r,[24,2.4,15]);assert.deepEqual(taskDestination(r),[24,2.4,15]);
assert(!unloadBatteryPack(s,r,{trailerHome,stopped:true}).ok,'No remote unloading');
// Full storage never drops the pack. When space is freed the same owned pack unloads once.
r.system.pos=[...trailerHome];r.system.speed=0;s.field.storage.trailer.steel=34;
assert(!unloadBatteryPack(s,r,{trailerHome,stopped:true}).ok);assert.equal(p.owner,r.id);
s.field.storage.trailer={};s.trailer=40;assert(unloadBatteryPack(s,r,{trailerHome,stopped:true}).ok);assert.equal(p.chargeWh,108);assert.equal(p.owner,'trailer');assert.equal(drainStoredPacks(s),0);
s.trailer=39;assert.equal(drainStoredPacks(s),20);assert.equal(p.chargeWh,88);assert.equal(s.trailer,40);
r.task.state='COMPLETED';r.task.stage='DONE';validateBatteryPacks(s);
const bad=JSON.parse(JSON.stringify(s));bad.batteryPacks.packs[1].id='pack-1';assert.throws(()=>validateBatteryPacks(bad));
console.log('PASS: finite pack assembly, payload/remote-load gates, exact onboard+pack+circuit conservation, paused coupling, saved delivery HOLD/resume, moving trailer target, cargo-full retention and capped reserve transfer.');
