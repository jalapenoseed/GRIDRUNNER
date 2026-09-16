import {createDrone,migrateDrone} from './drone-system.js';
import {createAircraftRecord,validateAircraftTask} from './fleet-tasks.js';
export const AIRCRAFT=['scout','cargo','engineer','relay'];
export const FORMATIONS=['WEDGE','TRAIL','LINE','ORBIT','RELAY OUTPOST','STAGGERED','HIGH / LOW','PROTECTIVE RING','OVERWATCH','SEARCH GRID','BUZZ PASS'];
const localToWorld=([right,up,forward],yaw)=>[
 Math.cos(yaw)*right-Math.sin(yaw)*forward,
 up,
 -Math.sin(yaw)*right-Math.cos(yaw)*forward
];
// Stable slots keep autonomous aircraft separated while the selected drone
// remains free to enter FPV. Values are metres relative to the operator's body, independent of the docking rig.
export function formationSlot(formation,id,yaw=0,elapsed=0){
 const index=Math.max(0,AIRCRAFT.indexOf(id)),slots={
  WEDGE:[[0,8,-8],[-7,9,-15],[7,9,-15],[0,12,-23]],
  TRAIL:[[0,8,-8],[0,9,-16],[0,10,-24],[0,11,-32]],
  LINE:[[-12,9,-10],[-4,9,-10],[4,9,-10],[12,9,-10]],
  STAGGERED:[[-5,8,-9],[5,10,-18],[-5,8,-27],[5,12,-36]],
  'HIGH / LOW':[[-8,7,-10],[8,13,-10],[-8,13,-22],[8,7,-22]],
  OVERWATCH:[[-12,22,-8],[12,26,-8],[-12,22,-24],[12,26,-24]],
  ORBIT:[[0,6,0],[0,7,0],[0,8,0],[0,9,0]]
 };
 if(formation==='SEARCH GRID'){
  const points=[[-18,-12],[18,-12],[18,-22],[-18,-22],[-18,-32],[18,-32],[18,-42],[-18,-42]],phase=elapsed/12+index*2,step=Math.floor(phase),mix=phase-step,a=points[step%points.length],b=points[(step+1)%points.length];
  return localToWorld([a[0]+(b[0]-a[0])*mix,12+index*4,a[1]+(b[1]-a[1])*mix],yaw);
 }
 // An overhead pass, never a player collision course: >=8m lateral, >=9m up.
 if(formation==='BUZZ PASS')return localToWorld([(index%2?1:-1)*(8+index*2),9+index*4,Math.sin(elapsed*.16+index*Math.PI/2)*22],yaw);
 if(formation==='ORBIT'||formation==='PROTECTIVE RING'){
  const angle=elapsed*.28+index*Math.PI*.5,radius=13+index%2*4;
  const r=formation==='PROTECTIVE RING'?10:radius;
  return [Math.sin(angle)*r,formation==='PROTECTIVE RING'?4+index:slots.ORBIT[index][1],Math.cos(angle)*r];
 }
 return localToWorld((slots[formation]||slots.WEDGE)[index],yaw);
}
export function validFormation(value){return FORMATIONS.includes(value)?value:'WEDGE';}
export function syncSquad(s){s.squad||={};for(const id of AIRCRAFT){const r=s.squad[id];if(!r)s.squad[id]=createAircraftRecord(id,createDrone());else if(!r.id)s.squad[id]={...createAircraftRecord(id,r.system,r.battery),...r};}const selected=s.squad[s.droneType];selected.system=s.droneSystem;selected.battery=s.drone;return s.squad;}
export function selectAircraft(s,id){if(!AIRCRAFT.includes(id))return false;const squad=syncSquad(s);if(id===s.droneType)return true;if(s.droneSystem.mode==='MANUAL'){s.droneSystem.mode='HOLD';s.droneSystem.hold=[...s.droneSystem.pos];s.droneSystem.reason='Holding while another aircraft is selected';}s.droneType=id;s.droneSystem=squad[id].system;s.drone=squad[id].battery;return true;}
export function validateSquad(s){
 const source=s.squad===undefined?{}:s.squad,out={};
 if(!source||typeof source!=='object'||Array.isArray(source)||Object.keys(source).some(id=>!AIRCRAFT.includes(id)))throw Error('Invalid fleet manifest');
 for(const id of AIRCRAFT){
  const existing=Object.hasOwn(source,id),r=existing?source[id]:{};
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid aircraft record');
  if(existing&&(!Number.isFinite(r.battery)||r.battery<0||r.battery>100||!r.system))throw Error('Invalid fleet battery or airframe');
  const savedSystem=migrateDrone(r.system,[0,2,15]),system=id===s.droneType?s.droneSystem:savedSystem;
  if((id!==s.droneType||s.mode!=='drone')&&system.mode==='MANUAL'){system.mode='HOLD';system.hold=[...system.pos];}
  const record=createAircraftRecord(id,system,id===s.droneType?s.drone:r.battery??100);
  validateAircraftTask(record,r,s.leg||1);if(['PERCHED','RELEASE'].includes(system.mode)&&(id!=='engineer'||record.task?.kind!=='LINE'||system.perch?.spanId!==record.task.anchor.spanId||system.perch?.u!==record.task.anchor.u))throw Error('Invalid conductor owner');if(system.mode==='RELAY'&&(id!=='relay'||record.task?.kind!=='RELAY'||record.task.state!=='RUNNING'||record.task.stage!=='RELAY'))throw Error('Invalid relay outpost ownership');out[id]=record;
 }
 s.squad=out;syncSquad(s);return out;
}
