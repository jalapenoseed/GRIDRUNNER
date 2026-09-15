import {createDrone,migrateDrone} from './drone-system.js';
export const AIRCRAFT=['scout','cargo','engineer','relay'];
export const FORMATIONS=['WEDGE','TRAIL','LINE','ORBIT'];
const localToWorld=([right,up,forward],yaw)=>[
 Math.cos(yaw)*right-Math.sin(yaw)*forward,
 up,
 -Math.sin(yaw)*right-Math.cos(yaw)*forward
];
// Stable slots keep autonomous aircraft separated while the selected drone
// remains free to enter FPV. Values are metres relative to the bike/drone home.
export function formationSlot(formation,id,yaw=0,elapsed=0){
 const index=Math.max(0,AIRCRAFT.indexOf(id)),slots={
  WEDGE:[[0,8,-8],[-7,9,-15],[7,9,-15],[0,12,-23]],
  TRAIL:[[0,8,-8],[0,9,-16],[0,10,-24],[0,11,-32]],
  LINE:[[-12,9,-10],[-4,9,-10],[4,9,-10],[12,9,-10]],
  ORBIT:[[0,10,0],[0,12,0],[0,14,0],[0,16,0]]
 };
 if(formation==='ORBIT'){
  const angle=elapsed*.28+index*Math.PI*.5,radius=13+index%2*4;
  return [Math.sin(angle)*radius,slots.ORBIT[index][1],Math.cos(angle)*radius];
 }
 return localToWorld((slots[formation]||slots.WEDGE)[index],yaw);
}
export function validFormation(value){return FORMATIONS.includes(value)?value:'WEDGE';}
export function syncSquad(s){s.squad||={};for(const id of AIRCRAFT)s.squad[id]||={system:createDrone(),battery:100};s.squad[s.droneType]={system:s.droneSystem,battery:s.drone};return s.squad;}
export function selectAircraft(s,id){if(!AIRCRAFT.includes(id))return false;const squad=syncSquad(s);if(id===s.droneType)return true;if(s.droneSystem.mode==='MANUAL'){s.droneSystem.mode='HOLD';s.droneSystem.hold=[...s.droneSystem.pos];s.droneSystem.reason='Holding while another aircraft is selected';}s.droneType=id;s.droneSystem=squad[id].system;s.drone=squad[id].battery;return true;}
export function validateSquad(s){const source=s.squad||{},out={};for(const id of AIRCRAFT){const r=source[id];if(!r){out[id]={system:createDrone(),battery:100};continue;}if(!Number.isFinite(r.battery)||r.battery<0||r.battery>100)throw Error('Invalid fleet battery');const system=migrateDrone(r.system,[0,2,15]);if(id!==s.droneType&&system.mode==='MANUAL'){system.mode='HOLD';system.hold=[...system.pos];}out[id]={system,battery:r.battery};}s.squad=out;syncSquad(s);return out;}
