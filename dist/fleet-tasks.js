// Persistent jobs own references, not duplicate aircraft, charge, or cargo.
// Four existing airframes retain class-keyed slots until multi-instance hangars.
import {lineTaskTarget,validateLineHarvest,controlLineTask,advanceLineHarvest} from './line-harvest.js';
import {commandDrone,droneLink} from './drone-system.js';
export const TASK_STATES=['RUNNING','PAUSED','COMPLETED','CANCELLED','FAILED'];
export const TASK_STAGES=['WAIT','TRANSIT','SURVEY','LAND','RELAY','RETURN','DONE'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const point=p=>Array.isArray(p)&&p.length===3&&finite(p[0],-600,600)&&finite(p[1],.65,195)&&finite(p[2],-4720,230);
export const aircraftId=type=>'aircraft-'+type+'-01';
export const aircraftBatteryId=type=>'battery-'+type+'-01';
export const hasLiveTask=r=>!!r.task&&['RUNNING','PAUSED'].includes(r.task.state);
export function taskDestination(record){
 const t=record.task;if(t?.state!=='RUNNING')return null;if(t.kind==='LINE')return lineTaskTarget(record);
 if(t.stage==='WAIT')return record.system.hold;
 if(t.kind==='RELAY'&&t.stage==='TRANSIT')return [t.destination[0],t.destination[1]+12,t.destination[2]];
 return ['TRANSIT','SURVEY','LAND'].includes(t.stage)?t.destination:null;
}
export function activeRelayNodes(squad={}){
 return Object.values(squad).filter(r=>r.type==='relay'&&r.task?.kind==='RELAY'&&r.task.state==='RUNNING'&&r.task.stage==='RELAY'&&r.system.mode==='RELAY'&&r.battery>=10&&r.system.hp>=20)
  .map(r=>({id:r.id,pos:r.system.pos,battery:r.battery,hp:r.system.hp}));
}
export function createAircraftRecord(type,system,battery=100){return {id:aircraftId(type),type,batteryId:aircraftBatteryId(type),system,battery,taskSerial:0,task:null};}

export function validateAircraftTask(record,source,leg=1){
 if(source.id!==undefined&&source.id!==record.id||source.type!==undefined&&source.type!==record.type||source.batteryId!==undefined&&source.batteryId!==record.batteryId)throw Error('Invalid aircraft ownership');
 const serial=source.taskSerial??0;if(!Number.isSafeInteger(serial)||serial<0||serial>1e9)throw Error('Invalid fleet task sequence');record.taskSerial=serial;
 if(source.task===undefined||source.task===null)return record;
 const t=source.task;
 if(!t||t.version!==1||!['SURVEY','RELAY','LINE'].includes(t.kind)||t.id!==record.id+':task:'+serial||serial<1||t.aircraftId!==record.id||t.batteryId!==record.batteryId)throw Error('Invalid fleet task ownership');
 if(t.kind==='LINE')return validateLineHarvest(record,t,leg);
 if(!TASK_STATES.includes(t.state)||!TASK_STAGES.includes(t.stage)||!point(t.destination)||![1,2,3].includes(t.leg)||!finite(t.elapsed,0,1e10)||!finite(t.stageElapsed,0,1e10)||!finite(t.dwell,0,5)||typeof t.scanned!=='boolean'||!Number.isInteger(t.contacts)||t.contacts<0||t.contacts>1000||typeof t.reason!=='string'||t.reason.length>160)throw Error('Invalid fleet task record');
 if(t.destination[2]<(t.leg===3?-4720:t.leg===2?-3200:-1600)||['RUNNING','PAUSED'].includes(t.state)&&t.leg!==leg)throw Error('Fleet task belongs to another region');
 const relay=t.kind==='RELAY',relayId=t.relayId??null;
 if(relay&&(record.type!=='relay'||!['TRANSIT','LAND','RELAY'].includes(t.stage)||t.scanned||t.contacts||t.state==='COMPLETED')||!relay&&(['LAND','RELAY'].includes(t.stage)||(['RETURN','DONE'].includes(t.stage)!==t.scanned)||t.state==='COMPLETED'&&t.stage!=='DONE'||t.stage==='DONE'&&t.state!=='COMPLETED')||!t.scanned&&t.contacts!==0)throw Error('Invalid fleet task progress');
 if(relayId!==null&&(relayId!==aircraftId('relay')||record.type!=='scout'||relay)||t.stage==='WAIT'&&!relayId)throw Error('Invalid relay dependency');
 record.task={version:1,id:t.id,kind:t.kind,aircraftId:t.aircraftId,batteryId:t.batteryId,leg:t.leg,state:t.state,stage:t.stage,destination:[...t.destination],elapsed:t.elapsed,stageElapsed:t.stageElapsed,dwell:t.dwell,scanned:t.scanned,contacts:t.contacts,reason:t.reason,relayId};
 // A save must never restart a failsafe or silently seize manual controls.
 if(hasLiveTask(record)){
  const mode=record.system.mode;
  if(mode==='LANDED')finish(record,'FAILED','Emergency landing');
  else if(mode==='RETURN HOME'&&(t.stage!=='RETURN'||t.state==='PAUSED'))finish(record,'FAILED','Safety return restored');
  else if(mode==='DOCK'){
   if(t.stage==='RETURN')complete(record);else finish(record,'FAILED','Aircraft docked before survey completed');
  }else if(mode==='MANUAL'){record.task.state='PAUSED';record.task.reason='Manual control restored';}
  else if(record.task.state==='PAUSED'&&mode!=='HOLD'){
   record.system.mode='HOLD';record.system.hold=[...record.system.pos];record.task.reason='Paused job restored';
  }else if(record.task.state==='RUNNING'&&mode!==(t.stage==='RELAY'?'RELAY':t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD')){
   record.task.state='PAUSED';record.task.reason='Flight order changed; resume explicitly';record.system.mode='HOLD';record.system.hold=[...record.system.pos];
  }
 }
 return record;
}

function finish(r,state,reason){r.task.state=state;r.task.reason=reason;r.task.dwell=0;}
function complete(r){finish(r,'COMPLETED','Survey complete; docked at bike');r.task.stage='DONE';}
function failAndReturn(r,reason,home,solids){finish(r,'FAILED',reason);if(!['DOCK','LANDED'].includes(r.system.mode))commandDrone(r.system,'RETURN HOME',home,r.battery,solids);}
export function assignSurvey(record,{destination,leg=1,home,solids=[],payloadKg=0}={}){
 if(hasLiveTask(record))return {ok:false,reason:'Pause/resume or cancel the current job first.'};
 if(!point(destination)||![1,2,3].includes(leg)||destination[2]<(leg===3?-4720:leg===2?-3200:-1600))return {ok:false,reason:'Survey point is outside this region.'};
 if(record.taskSerial>=1e9)return {ok:false,reason:'Task sequence limit reached.'};
 if(record.battery<25||record.system.hp<30)return {ok:false,reason:'Survey needs at least 25% battery and 30% hull.'};
 if(!commandDrone(record.system,'SCOUT AHEAD',home,record.battery,solids,{type:record.type,payloadKg}))return {ok:false,reason:'Recover the landed aircraft before assigning work.'};
 record.taskSerial++;
 record.task={version:1,id:record.id+':task:'+record.taskSerial,kind:'SURVEY',aircraftId:record.id,batteryId:record.batteryId,leg,state:'RUNNING',stage:'TRANSIT',destination:[...destination],elapsed:0,stageElapsed:0,dwell:0,scanned:false,contacts:0,reason:'Flying to survey point'};
 return {ok:true,reason:record.task.reason};
}

// Called for both selected-aircraft and squad commands; rejected commands do not
// mutate a job. Automatic failsafes bypass this wrapper and are reconciled below.
export function commandAircraft(record,command,home,solids=[],payloadKg=record.system.collisionPayload||0){
 if(!commandDrone(record.system,command,home,record.battery,solids,{type:record.type,payloadKg}))return false;
 if(hasLiveTask(record)){
  if(['MANUAL','HOLD'].includes(command)){record.task.state='PAUSED';record.task.dwell=0;record.task.reason=command==='MANUAL'?'Manual takeover; resume when ready':'Operator hold; resume when ready';}
  else finish(record,'CANCELLED',['DOCK','RETURN HOME'].includes(command)?'Recalled by operator':'Replaced by '+command);
 }
 return true;
}
export function controlTask(record,action,home,solids=[]){
 if(!hasLiveTask(record))return {ok:false,reason:'No active job on this aircraft.'};
 const t=record.task;if(t.kind==='LINE')return controlLineTask(record,action,home,solids);
 if(action==='pause'){const ok=commandAircraft(record,'HOLD',home,solids);return {ok,reason:ok?'Job paused; aircraft holding.':'Aircraft cannot hold; recover it first.'};}
 if(action==='cancel'){
  finish(record,'CANCELLED',record.system.mode==='LANDED'?'Cancelled; recover the landed aircraft':record.system.mode==='DOCK'?'Cancelled; aircraft already docked':'Cancelled by operator; returning to bike');
  if(!['DOCK','LANDED'].includes(record.system.mode))commandDrone(record.system,'RETURN HOME',home,record.battery,solids);
  return {ok:true,reason:t.reason};
 }
 if(action!=='resume'||t.state!=='PAUSED')return {ok:false,reason:'This job is not paused.'};
 if(record.battery<15||record.system.hp<25||['LANDED','RETURN HOME','DOCK'].includes(record.system.mode))return {ok:false,reason:'Recover, recharge or finish the safety return before resuming.'};
 if(t.kind==='RELAY'&&t.stage==='RELAY')t.stage='TRANSIT';
 if(!commandDrone(record.system,t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD',home,record.battery,solids))return {ok:false,reason:'Aircraft cannot resume.'};
 t.state='RUNNING';t.stageElapsed=0;t.dwell=0;t.reason='Job resumed';return {ok:true,reason:t.reason};
}
export function cancelRegionTasks(s){for(const r of Object.values(s.squad||{}))if(hasLiveTask(r))finish(r,'CANCELLED','Region changed; assign a new local job');}

export function advanceAircraftTask(record,dt,{home,solids=[],events=[],scan,state=null,squad={},terrain=()=>0,storm=false,jammed=false,trailerHome=null,trailerStopped=false}={}){
 if(!hasLiveTask(record))return [];
 if(record.task.kind==='LINE')return advanceLineHarvest(record,dt,{state,home,solids,events,trailerHome,trailerStopped});
 const t=record.task,d=record.system,out=[];dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
 if(d.mode==='LANDED'){finish(record,'FAILED','Emergency landing: '+d.reason);return ['task-failed'];}
 if(events.includes('return')||d.mode==='RETURN HOME'&&(t.stage!=='RETURN'||t.state==='PAUSED')){finish(record,'FAILED','Safety return: '+d.reason);return ['task-failed'];}
 if(t.state==='PAUSED')return out;
 if(d.mode==='DOCK'){
  if(t.stage==='RETURN')complete(record);else finish(record,'FAILED','Docked before survey completed');
  return [t.state==='COMPLETED'?'task-complete':'task-failed'];
 }
 if(d.mode==='MANUAL'){t.state='PAUSED';t.dwell=0;t.reason='Manual takeover; resume when ready';return out;}
 if(d.mode!==(t.stage==='RELAY'?'RELAY':t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD')){t.state='PAUSED';t.dwell=0;t.reason='Flight order changed; resume explicitly';return out;}
 t.elapsed+=dt;t.stageElapsed+=dt;
 if(t.stage==='RELAY'){t.reason='Landed relay online; radio drawing battery';return out;}
 if(t.stageElapsed>120){failAndReturn(record,'Route timed out; return requested',home,solids);return ['task-failed'];}
 if(t.stage==='RETURN'){t.reason=d.returnPlan?.blocked?'Return path blocked; move the bike into the open':'Returning to bike';return out;}
 if(t.stage==='WAIT'){
  const relay=squad.relay;
  if(!relay||relay.id!==t.relayId||!hasLiveTask(relay)||relay.task.kind!=='RELAY'){failAndReturn(record,'Relay outpost unavailable; returning',home,solids);return ['task-failed'];}
  const nodes=activeRelayNodes(squad),link=droneLink(t.destination,home,{type:record.type,relayNodes:nodes,solids,terrain,storm,jammed});
  if(nodes.length&&link.via===t.relayId&&link.signal>8){t.stage='TRANSIT';t.stageElapsed=0;t.reason='Relay established; surveying beyond direct range';}
  else t.reason='Waiting for landed relay and a clear two-hop link';
  return out;
 }
 if(t.kind==='RELAY'){
  const target=taskDestination(record),onStation=distance(d.pos,target)<1&&d.speed<1;
  if(t.stage==='TRANSIT'&&onStation){t.stage='LAND';t.stageElapsed=0;t.reason='Descending onto outpost';}
  else if(t.stage==='LAND'&&distance(d.pos,t.destination)<.15&&d.speed<.5){
   d.mode='RELAY';d.reason='Outpost radio online';d.velocity=[0,0,0];d.speed=d.thrust=d.pitch=d.roll=0;
   t.stage='RELAY';t.stageElapsed=0;t.reason='Landed relay online';return ['task-relay'];
  }
  return out;
 }
 const onStation=distance(d.pos,t.destination)<3&&d.speed<2;
 if(t.stage==='TRANSIT'&&onStation){t.stage='SURVEY';t.stageElapsed=0;t.reason='Holding for survey';}
 if(t.stage==='SURVEY'){
  t.dwell=onStation?Math.min(5,t.dwell+dt):0;t.reason=onStation?'Surveying '+Math.floor(t.dwell/5*100)+'%':'Reacquiring survey position';
  if(t.dwell>=5&&!t.scanned&&d.scanCooldown<=0){
   if(record.battery<3){failAndReturn(record,'Not enough energy for survey scan',home,solids);return ['task-failed'];}
   if(typeof scan!=='function'){t.reason='Scanner unavailable';return out;}
   // At-most-once debit and scan. The adapter merges discoveries only; it must
   // not move aircraft, create batteries, award quest items or debit again.
   record.battery-=3;t.scanned=true;t.stage='RETURN';t.stageElapsed=0;t.dwell=0;
   try{const count=scan(record);t.contacts=Number.isFinite(count)?clamp(Math.floor(count),0,1000):0;}catch{failAndReturn(record,'Survey scanner failed; return requested',home,solids);return ['task-failed'];}
   d.scanCooldown=5;commandDrone(d,'RETURN HOME',home,record.battery,solids);t.reason='Survey recorded; returning to bike';out.push('task-scan');
  }
 }
 return out;
}
