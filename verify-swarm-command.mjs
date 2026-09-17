import assert from 'node:assert/strict';
import {buildSwarmDrones,createSwarmState,formationSlots,stepSwarm,swarmCohesion,renderSwarmCommand,SWARM_FORMATIONS} from './dist/swarm-command.js';
const panel=renderSwarmCommand();assert(panel.includes('data-swarm-root')&&panel.includes('LAUNCH ALL')&&panel.includes('EDIT ORIGIN'),'command surface renders its controls');
const fleet=buildSwarmDrones({scout:3,cargo:2,engineer:1,relay:2});
assert.equal(fleet.length,8);assert.deepEqual([...new Set(fleet.map(d=>d.type))],['scout','cargo','engineer','relay']);
for(const formation of SWARM_FORMATIONS){const s=createSwarmState({formation,drones:buildSwarmDrones({scout:3,cargo:2,engineer:1,relay:2})});assert.equal(formationSlots(s,2).length,8);assert(formationSlots(s,2).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),formation+' slots are finite');}
const state=createSwarmState({drones:fleet});state.launched=true;fleet.forEach(d=>d.active=true);const before=fleet.map(d=>[d.x,d.y]);
for(let i=0;i<500;i++)stepSwarm(state,.02);
assert(fleet.some((d,i)=>Math.hypot(d.x-before[i][0],d.y-before[i][1])>20),'fleet moves toward programmed slots');assert(Number.isFinite(swarmCohesion(state)));
state.mission='relay';const relay=formationSlots(state);assert(relay[0].x<relay.at(-1).x,'relay mesh spans origin to objective');
state.mission='harvest';const harvest=formationSlots(state);assert.equal(harvest[fleet.findIndex(d=>d.type==='engineer')].y,state.objective.y-52,'Utility receives energy-harvest slot');
state.running=false;const held=fleet.map(d=>[d.x,d.y]);stepSwarm(state,1);assert.deepEqual(fleet.map(d=>[d.x,d.y]),held,'pause holds the simulation');
console.log('PASS: programmable fleet counts, seven formations, mission slots, movement, cohesion and pause authority.');
