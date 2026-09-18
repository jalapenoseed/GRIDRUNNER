import {validateCommanderFleet} from './fleet-commander-core.js';
export const FLEET_STORAGE_KEY='gridrunner.commander.fleets.v1';
export function parseFleetFile(text){if(typeof text!=='string'||text.length>2000000)throw Error('Fleet files must be smaller than 2 MB.');let raw;try{raw=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}return validateCommanderFleet(raw);}
export function readFleetLibrary(storage){const text=storage.getItem(FLEET_STORAGE_KEY);if(!text)return [];if(text.length>4800000)throw Error('Saved fleet library is too large. Export and clear old setups.');const raw=JSON.parse(text);if(!Array.isArray(raw)||raw.length>20)throw Error('Saved fleet library could not be read.');return raw.map(validateCommanderFleet);}
export function saveNamedFleet(storage,fleet){const valid=validateCommanderFleet(fleet),all=readFleetLibrary(storage),i=all.findIndex(f=>f.name===valid.name);if(i>=0)all[i]=valid;else{if(all.length>=20)throw Error('Twenty fleets are saved. Use an existing name to replace one, or export this fleet.');all.push(valid);}storage.setItem(FLEET_STORAGE_KEY,JSON.stringify(all.map(compactFleet)));return valid;}

export function compactFleet(fleet){const {fleetIds,groups,activeIds,...program}=fleet.program;return {...fleet,program:{...program,enabled:false,running:false,time:0,activeIds:[]}};}
