import assert from 'node:assert/strict';
import {createCampaignProgress,campaignUnlocks,progressionRows,syncCampaignProgress} from './dist/campaign-progress.js';
import {createFleetPolicy,validateFleetPolicy,configureFleetPolicy,advanceFleetPolicy} from './dist/fleet-policy.js';
import {createBatteryPacks} from './dist/battery-packs.js';
import {createLineGrid} from './dist/power-lines.js';
import {createDrone} from './dist/drone-system.js';
import {createAircraftRecord} from './dist/fleet-tasks.js';
import {renderFleetPolicy} from './dist/fleet-policy-ui.js';

const home=[0,2.4,15],trailerHome=[3,2.4,15],record=createAircraftRecord('engineer',createDrone(home),75);
const state={leg:1,met:false,won:false,leg2Won:false,engineerBuilt:false,relayHouse:{schematicRead:false,discovered:false},intro:{salvaged:false},progression:createCampaignProgress(),fleetPolicy:createFleetPolicy(),batteryPacks:createBatteryPacks(),lineGrid:createLineGrid(),squad:{engineer:record},inv:{cells:4,wire:8,electronics:4,rubber:4},field:{storage:{trailer:{}}},trailer:8};

let unlocks=campaignUnlocks(state);assert(unlocks.airframes.scout);assert(!unlocks.airframes.cargo);assert(!unlocks.airframes.engineer);assert(!unlocks.airframes.relay);assert(!unlocks.packFabrication);assert(!unlocks.lineHarvest);assert(!unlocks.reservePolicy);
state.met=true;state.engineerBuilt=true;state.relayHouse.schematicRead=true;state.relayHouse.discovered=true;unlocks=campaignUnlocks(state);assert(unlocks.airframes.cargo&&unlocks.airframes.engineer&&unlocks.airframes.relay);assert(unlocks.packFabrication&&unlocks.lineHarvest);assert(!unlocks.reservePolicy);
assert.equal(progressionRows(state).filter(r=>r.done).length>=5,true);

state.batteryPacks.serial=1;state.batteryPacks.packs=[{id:'pack-1',capacityWh:120,chargeWh:0,massKg:1.2,owner:'trailer'}];
record.task={id:'aircraft-engineer-01:task:1',kind:'LINE',packId:'pack-1',state:'COMPLETED',stage:'DONE'};
let events=advanceFleetPolicy(state,record,{elapsed:10,nearTrailer:true,trailerStopped:true,trailerHome,home});
assert(events.includes('policy-unlocked'));assert(syncCampaignProgress(state).firstPackDelivered);assert(campaignUnlocks(state).reservePolicy);assert.equal(state.fleetPolicy.cycles,1);
advanceFleetPolicy(state,record,{elapsed:11,nearTrailer:true,trailerStopped:true,trailerHome,home});assert.equal(state.fleetPolicy.cycles,1,'completed delivery is counted once');
assert(configureFleetPolicy(state,{enabled:true,targetPercent:80}).ok);
events=advanceFleetPolicy(state,record,{elapsed:12,nearTrailer:true,trailerStopped:true,trailerHome,home,storm:true});assert(!events.includes('policy-dispatched'));assert.match(state.fleetPolicy.status,/weather/);
events=advanceFleetPolicy(state,record,{elapsed:28,nearTrailer:true,trailerStopped:true,trailerHome,home});assert(events.includes('policy-loaded'));assert(events.includes('policy-dispatched'));assert.equal(record.task.state,'RUNNING');assert.equal(record.task.packId,'pack-1');
assert.match(renderFleetPolicy(state),/80%/);assert.match(renderFleetPolicy(state),/ARMED/);

const migrated=validateFleetPolicy(undefined);assert.equal(migrated.targetPercent,60);assert.throws(()=>validateFleetPolicy({...migrated,targetPercent:55}));assert.throws(()=>validateFleetPolicy({...migrated,status:'x'.repeat(181)}));
const later={...state,leg:2,progression:createCampaignProgress(),met:false,engineerBuilt:true,relayHouse:{schematicRead:false,discovered:false}};assert(campaignUnlocks(later).airframes.relay);assert(campaignUnlocks(later).packFabrication);
console.log('PASS: quest-gated airframes/systems, persistent manual-delivery unlock, one-time cycle accounting, weather hold, safe pack loading, repeat dispatch, target selection and save validation.');

record.task.state='FAILED';record.task.id='failed-after-arm';record.system.mode='DOCK';
events=advanceFleetPolicy(state,record,{elapsed:50,nearTrailer:true,trailerStopped:true,trailerHome,home});assert(!state.fleetPolicy.enabled);assert.match(state.fleetPolicy.status,/Suspended/);assert(!events.includes('policy-dispatched'));
assert(configureFleetPolicy(state,{enabled:true}).ok);events=advanceFleetPolicy(state,record,{elapsed:51,nearTrailer:true,trailerStopped:true,trailerHome,home});assert(events.includes('policy-dispatched'),'explicit re-arm acknowledges previous failed job');
console.log('PASS: failed autonomous job disarms policy and requires explicit re-arm.');

configureFleetPolicy(state,{enabled:true});const runningId=record.task.id;assert.equal(record.task.state,'RUNNING');record.task.state='FAILED';record.system.mode='DOCK';events=advanceFleetPolicy(state,record,{elapsed:60,nearTrailer:true,trailerStopped:true,trailerHome,home});assert.equal(record.task.id,runningId);assert(!state.fleetPolicy.enabled,'arming a running job does not acknowledge its later failure');assert(!events.includes('policy-dispatched'));
