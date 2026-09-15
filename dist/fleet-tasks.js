// Persistent jobs own references, not duplicate aircraft, charge, or cargo.
// Four existing airframes retain class-keyed slots until multi-instance hangars.
import {commandDrone} from './drone-system.js';
export const TASK_STATES=['RUNNING','PAUSED','COMPLETED','CANCELLED','FAILED'];
export const TASK_STAGES=['TRANSIT','SURVEY','RETURN','DONE'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
const point=p=>Array.isArray(p)&&p.length===3&&finite(p[0],-600,600)&&finite(p[1],.65,195)&&finite(p[2],-4720,230);
export const aircraftId=type=>'aircraft-'+type+'-01';
export const aircraftBatteryId=type=>'battery-'+type+'-01';
export const hasLiveTask=r=>!!r.task&&['RUNNING','PAUSED'].includes(r.task.state);
export function taskDestination(record){const t=record.task;return t?.state==='RUNNING'&&['TRANSIT','SURVEY'].includes(t.stage)?t.destination:null;}
export function createAircraftRecord(type,system,battery=100){return {id:aircraftId(type),type,batteryId:aircraftBatteryId(type),system,battery,taskSerial:0,task:null};}

export function validateAircraftTask(record,source,leg=1){
 if(source.id!==undefined&&source.id!==record.id||source.type!==undefined&&source.type!==record.type||source.batteryId!==undefined&&source.batteryId!==record.batteryId)throw Error('Invalid aircraft ownership');
 const serial=source.taskSerial??0;if(!Number.isSafeInteger(serial)||serial<0||serial>1e9)throw Error('Invalid fleet task sequence');record.taskSerial=serial;
 if(source.task===undefined||source.task===null)return record;
 const t=source.task;
 if(!t||t.version!==1||t.kind!=='SURVEY'||t.id!==record.id+':task:'+serial||serial<1||t.aircraftId!==record.id||t.batteryId!==record.batteryId)throw Error('Invalid fleet task ownership');
 if(!TASK_STATES.includes(t.state)||!TASK_STAGES.includes(t.stage)||!point(t.destination)||![1,2,3].includes(t.leg)||!finite(t.elapsed,0,1e10)||!finite(t.stageElapsed,0,1e10)||!finite(t.dwell,0,5)||typeof t.scanned!=='boolean'||!Number.isInteger(t.contacts)||t.contacts<0||t.contacts>1000||typeof t.reason!=='string'||t.reason.length>160)throw Error('Invalid fleet task record');
 if(t.destination[2]<(t.leg===3?-4720:t.leg===2?-3200:-1600)||['RUNNING','PAUSED'].includes(t.state)&&t.leg!==leg)throw Error('Fleet task belongs to another region');
 if((['RETURN','DONE'].includes(t.stage)!==t.scanned)||t.state==='COMPLETED'&&t.stage!=='DONE'||t.stage==='DONE'&&t.state!=='COMPLETED'||!t.scanned&&t.contacts!==0)throw Error('Invalid fleet task progress');
 record.task={version:1,id:t.id,kind:t.kind,aircraftId:t.aircraftId,batteryId:t.batteryId,leg:t.leg,state:t.state,stage:t.stage,destination:[...t.destination],elapsed:t.elapsed,stageElapsed:t.stageElapsed,dwell:t.dwell,scanned:t.scanned,contacts:t.contacts,reason:t.reason};
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
  }else if(record.task.state==='RUNNING'&&mode!==(t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD')){
   record.task.state='PAUSED';record.task.reason='Flight order changed; resume explicitly';record.system.mode='HOLD';record.system.hold=[...record.system.pos];
  }
 }
 return record;
}

function finish(r,state,reason){r.task.state=state;r.task.reason=reason;r.task.dwell=0;}
function complete(r){finish(r,'COMPLETED','Survey complete; docked at bike');r.task.stage='DONE';}
function failAndReturn(r,reason,home,solids){finish(r,'FAILED',reason);if(!['DOCK','LANDED'].includes(r.system.mode))commandDrone(r.system,'RETURN HOME',home,r.battery,solids);}
export function assignSurvey(record,{destination,leg=1,home,solids=[]}={}){
 if(hasLiveTask(record))return {ok:false,reason:'Pause/resume or cancel the current job first.'};
 if(!point(destination)||![1,2,3].includes(leg)||destination[2]<(leg===3?-4720:leg===2?-3200:-1600))return {ok:false,reason:'Survey point is outside this region.'};
 if(record.taskSerial>=1e9)return {ok:false,reason:'Task sequence limit reached.'};
 if(record.battery<25||record.system.hp<30)return {ok:false,reason:'Survey needs at least 25% battery and 30% hull.'};
 if(!commandDrone(record.system,'SCOUT AHEAD',home,record.battery,solids))return {ok:false,reason:'Recover the landed aircraft before assigning work.'};
 record.taskSerial++;
 record.task={version:1,id:record.id+':task:'+record.taskSerial,kind:'SURVEY',aircraftId:record.id,batteryId:record.batteryId,leg,state:'RUNNING',stage:'TRANSIT',destination:[...destination],elapsed:0,stageElapsed:0,dwell:0,scanned:false,contacts:0,reason:'Flying to survey point'};
 return {ok:true,reason:record.task.reason};
}

// Called for both selected-aircraft and squad commands; rejected commands do not
// mutate a job. Automatic failsafes bypass this wrapper and are reconciled below.
export function commandAircraft(record,command,home,solids=[]){
 if(!commandDrone(record.system,command,home,record.battery,solids))return false;
 if(hasLiveTask(record)){
  if(['MANUAL','HOLD'].includes(command)){record.task.state='PAUSED';record.task.dwell=0;record.task.reason=command==='MANUAL'?'Manual takeover; resume when ready':'Operator hold; resume when ready';}
  else finish(record,'CANCELLED',['DOCK','RETURN HOME'].includes(command)?'Recalled by operator':'Replaced by '+command);
 }
 return true;
}
export function controlTask(record,action,home,solids=[]){
 if(!hasLiveTask(record))return {ok:false,reason:'No active job on this aircraft.'};
 const t=record.task;
 if(action==='pause'){const ok=commandAircraft(record,'HOLD',home,solids);return {ok,reason:ok?'Job paused; aircraft holding.':'Aircraft cannot hold; recover it first.'};}
 if(action==='cancel'){
  finish(record,'CANCELLED',record.system.mode==='LANDED'?'Cancelled; recover the landed aircraft':record.system.mode==='DOCK'?'Cancelled; aircraft already docked':'Cancelled by operator; returning to bike');
  if(!['DOCK','LANDED'].includes(record.system.mode))commandDrone(record.system,'RETURN HOME',home,record.battery,solids);
  return {ok:true,reason:t.reason};
 }
 if(action!=='resume'||t.state!=='PAUSED')return {ok:false,reason:'This job is not paused.'};
 if(record.battery<15||record.system.hp<25||['LANDED','RETURN HOME','DOCK'].includes(record.system.mode))return {ok:false,reason:'Recover, recharge or finish the safety return before resuming.'};
 if(!commandDrone(record.system,t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD',home,record.battery,solids))return {ok:false,reason:'Aircraft cannot resume.'};
 t.state='RUNNING';t.stageElapsed=0;t.dwell=0;t.reason='Job resumed';return {ok:true,reason:t.reason};
}
export function cancelRegionTasks(s){for(const r of Object.values(s.squad||{}))if(hasLiveTask(r))finish(r,'CANCELLED','Region changed; assign a new local job');}

export function advanceAircraftTask(record,dt,{home,solids=[],events=[],scan}={}){
 if(!hasLiveTask(record))return [];
 const t=record.task,d=record.system,out=[];dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
 if(d.mode==='LANDED'){finish(record,'FAILED','Emergency landing: '+d.reason);return ['task-failed'];}
 if(events.includes('return')||d.mode==='RETURN HOME'&&(t.stage!=='RETURN'||t.state==='PAUSED')){finish(record,'FAILED','Safety return: '+d.reason);return ['task-failed'];}
 if(t.state==='PAUSED')return out;
 if(d.mode==='DOCK'){
  if(t.stage==='RETURN')complete(record);else finish(record,'FAILED','Docked before survey completed');
  return [t.state==='COMPLETED'?'task-complete':'task-failed'];
 }
 if(d.mode==='MANUAL'){t.state='PAUSED';t.dwell=0;t.reason='Manual takeover; resume when ready';return out;}
 if(d.mode!==(t.stage==='RETURN'?'RETURN HOME':'SCOUT AHEAD')){t.state='PAUSED';t.dwell=0;t.reason='Flight order changed; resume explicitly';return out;}
 t.elapsed+=dt;t.stageElapsed+=dt;
 if(t.stageElapsed>120){failAndReturn(record,'Route timed out; return requested',home,solids);return ['task-failed'];}
 if(t.stage==='RETURN'){t.reason=d.returnPlan?.blocked?'Return path blocked; move the bike into the open':'Returning to bike';return out;}
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
