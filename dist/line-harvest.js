import {carriedPack,unloadBatteryPack,PACK_WH} from './battery-packs.js';
import {commandDrone,obstruction,radioQuality,DRONE_CLASSES} from './drone-system.js';
import {solidList} from './spatial-index.js';
import {LINE_SPANS,UTILITY_BATTERY_WH,LINE_RATE_WH,spanById,validLineAnchor,lineBody,lineApproach,lineRelease,lineStatus} from './power-lines.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const attachedStages=['PERCH','COUPLING','CHARGING','STANDBY'];
export const LINE_STAGES=['APPROACH','ALIGN',...attachedStages,'DELIVER','UNLOAD','DONE'];
const live=r=>r.task&&['RUNNING','PAUSED'].includes(r.task.state);
const bounded=(n,max)=>Number.isFinite(n)&&n>=0&&n<=max;

export function findLineAnchor(record,{state,home,solids=[],terrain=()=>0,storm=false,jammed=false,anchor=null}){
 const origin=record.system.mode==='DOCK'?home:record.system.pos;
 const candidates=anchor?[anchor]:LINE_SPANS.filter(s=>s.leg===state.leg).map(s=>({spanId:s.id,u:Math.max(.06,Math.min(.94,(s.z-origin[2])/s.length))}));
 const padded=solidList(solids).filter(b=>b.drone!==false).map(b=>({...b,w:b.w+.7,d:b.d+.7,minY:(b.minY??0)-.7,maxY:(b.maxY??12)+.7}));
 const occupied=Object.values(state.squad||{}).filter(r=>r.id!==record.id&&live(r)&&r.task.kind==='LINE').map(r=>lineBody(r.task.anchor));
 return candidates.filter(a=>{
  if(!validLineAnchor(a)||spanById(a.spanId).leg!==state.leg||!lineStatus(state,a.spanId).live)return false;
  const p=lineBody(a),approach=lineApproach(a),release=lineRelease(a);
  return p[1]>terrain(p[0],p[2])+3&&!occupied.some(o=>distance(o,p)<6)&&!obstruction(approach,p,padded)&&!obstruction(p,release,padded)&&radioQuality(home,p,DRONE_CLASSES.engineer.range,{solids,terrain,storm,jammed})>12;
 }).sort((a,b)=>distance(origin,lineBody(a))-distance(origin,lineBody(b)))[0]||null;
}
export function assignLineHarvest(record,options){
 const pack=options.deliver?carriedPack(options.state,record):null;
 if(options.deliver&&!pack)return {ok:false,reason:'Load a removable pack on Utility first.'};
 if(record.type!=='engineer'||!options.state.engineerBuilt)return {ok:false,reason:'Fit the engineer module and select Utility to perch on conductors.'};
 if(live(record))return {ok:false,reason:'Finish or cancel the current aircraft job first.'};
 if(['PERCHED','RELEASE'].includes(record.system.mode))return {ok:false,reason:'Finish releasing the conductor before assigning another job.'};
 if(record.battery<25||record.system.hp<30||record.system.mode==='LANDED')return {ok:false,reason:'Line harvest needs 25% battery, 30% hull and a recovered aircraft.'};
 if(record.taskSerial>=1e9)return {ok:false,reason:'Task sequence limit reached.'};
 const anchor=findLineAnchor(record,options);if(!anchor)return {ok:false,reason:'No clear energized conductor in link range. Move closer to the transmission corridor.'};
 if(!commandDrone(record.system,'SCOUT AHEAD',options.home,record.battery,options.solids))return {ok:false,reason:'Aircraft cannot depart. Release or recover it first.'};
 record.taskSerial++;
 record.task={version:1,id:record.id+':task:'+record.taskSerial,kind:'LINE',aircraftId:record.id,batteryId:record.batteryId,leg:options.state.leg,state:'RUNNING',stage:'APPROACH',destination:lineBody(anchor),anchor:{...anchor},elapsed:0,stageElapsed:0,dwell:0,scanned:false,contacts:0,reason:'LINE DETECTED / approaching conductor',harvestedWh:0,targetPercent:90};
 if(pack){record.task.packId=pack.id;record.task.deliveryTarget=[...options.trailerHome];}
 return {ok:true,reason:record.task.reason};
}
export function lineTaskTarget(r){const t=r.task;return t?.kind==='LINE'&&t.state==='RUNNING'?(t.stage==='APPROACH'?lineApproach(t.anchor):t.stage==='ALIGN'?lineBody(t.anchor):['DELIVER','UNLOAD'].includes(t.stage)?t.deliveryTarget:null):null;}

export function validateLineHarvest(record,t,leg){
 if(record.type!=='engineer'||t.leg!==1||!['RUNNING','PAUSED','FAILED','CANCELLED','COMPLETED'].includes(t.state)||!LINE_STAGES.includes(t.stage)||!validLineAnchor(t.anchor)||!Array.isArray(t.destination)||t.destination.length!==3||!t.destination.every(Number.isFinite)||distance(t.destination,lineBody(t.anchor))>.001||!bounded(t.elapsed,1e10)||!bounded(t.stageElapsed,1e10)||!bounded(t.dwell,2)||!bounded(t.harvestedWh,1700)||t.targetPercent!==90||t.scanned!==false||t.contacts!==0||typeof t.reason!=='string'||t.reason.length>160)throw Error('Invalid line harvest job');
 if(['RUNNING','PAUSED'].includes(t.state)&&leg!==t.leg)throw Error('Line job belongs to another region');
 record.task={...t,anchor:{spanId:t.anchor.spanId,u:t.anchor.u},destination:[...t.destination]};
 const d=record.system;
 if(t.packId!==undefined&&(!/^pack-[1-8]$/.test(t.packId)||!Array.isArray(t.deliveryTarget)||t.deliveryTarget.length!==3||!t.deliveryTarget.every(n=>Number.isFinite(n)&&Math.abs(n)<10000)))throw Error('Invalid pack delivery');
 if(['DELIVER','UNLOAD','DONE'].includes(t.stage)&&!t.packId||t.state==='COMPLETED'&&t.stage!=='DONE'||t.stage==='DONE'&&t.state!=='COMPLETED')throw Error('Invalid delivery progress');
 if(d.perch&&(d.perch.spanId!==t.anchor.spanId||d.perch.u!==t.anchor.u))throw Error('Line attachment ownership mismatch');
 if(!live(record))return record;
 if(['DELIVER','UNLOAD'].includes(t.stage)&&['SCOUT AHEAD','RELEASE','HOLD','MANUAL'].includes(d.mode)){
  if(d.mode==='RELEASE'&&!['SCOUT AHEAD','HOLD'].includes(d.releaseOrder)){record.task.state='FAILED';record.task.reason='Delivery release interrupted';}
  else if(['HOLD','MANUAL'].includes(d.mode)){record.task.state='PAUSED';record.task.reason='Delivery paused; resume explicitly';}
  return record;
 }
 if(['LANDED','RETURN HOME','DOCK'].includes(d.mode)||d.mode==='RELEASE'&&d.releaseOrder!=='HOLD'){record.task.state='FAILED';record.task.reason='Safety return or interrupted line job restored';}
 else if(d.mode==='PERCHED'){
  if(!attachedStages.includes(t.stage))throw Error('Invalid attached task stage');
  // Re-couple against current power state after load; no stored offline charging.
  if(t.state==='RUNNING'){record.task.stage='COUPLING';record.task.stageElapsed=0;}
 }else if(d.mode==='MANUAL'||t.state==='PAUSED'||d.mode!=='SCOUT AHEAD'||attachedStages.includes(t.stage)){
  record.task.state='PAUSED';record.task.stage='APPROACH';record.task.dwell=0;record.task.reason='Line job paused; resume explicitly';
 }
 return record;
}
export function controlLineTask(record,action,home,solids=[]){
 const t=record.task,d=record.system;if(!live(record))return {ok:false,reason:'No active line job.'};
 if(action==='pause'){
  if(d.mode!=='PERCHED'&&!commandDrone(d,'HOLD',home,record.battery,solids))return {ok:false,reason:'Aircraft cannot hold.'};
  t.state='PAUSED';t.reason=d.mode==='PERCHED'?'Charging paused; still clamped to conductor':'Line job paused';return {ok:true,reason:t.reason};
 }
 if(action==='cancel'){
  if(!['DOCK','LANDED'].includes(d.mode))commandDrone(d,'RETURN HOME',home,record.battery,solids);
  t.state='CANCELLED';t.reason='Cancelled; release and return requested';return {ok:true,reason:t.reason};
 }
 if(action!=='resume'||t.state!=='PAUSED'||['RELEASE','RETURN HOME','LANDED','DOCK'].includes(d.mode)||record.battery<15||d.hp<25)return {ok:false,reason:'Finish release or recover the aircraft before resuming.'};
 if(d.mode==='PERCHED')t.stage='COUPLING';
 else{if(!commandDrone(d,'SCOUT AHEAD',home,record.battery,solids))return {ok:false,reason:'Aircraft cannot resume.'};if(!['DELIVER','UNLOAD'].includes(t.stage))t.stage='APPROACH';}
 t.state='RUNNING';t.stageElapsed=t.dwell=0;t.reason='Rechecking conductor and coupling';return {ok:true,reason:t.reason};
}
export function advanceLineHarvest(record,dt,{state,home,solids=[],events=[],trailerHome=null,trailerStopped=false}={}){
 if(!live(record))return [];
 const t=record.task,d=record.system;dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
 const fail=reason=>{t.state='FAILED';t.reason=reason;if(!['DOCK','LANDED','RELEASE','RETURN HOME'].includes(d.mode))commandDrone(d,'RETURN HOME',home,record.battery,solids);return ['task-failed'];};
 if(events.includes('return')||['LANDED','RETURN HOME','DOCK'].includes(d.mode))return fail('Safety override: '+d.reason);
 if(d.mode==='RELEASE'){if(t.packId&&t.stage==='DELIVER'&&d.releaseOrder==='SCOUT AHEAD')return [];if(t.state!=='PAUSED')return fail('Conductor released; job ended');return [];}
 if(t.state==='PAUSED')return [];
 if(d.mode==='MANUAL'){t.state='PAUSED';if(!['DELIVER','UNLOAD'].includes(t.stage))t.stage='APPROACH';t.reason='Manual takeover; resume explicitly';return [];}
 const pack=t.packId?carriedPack(state,record):null;
 if(t.packId&&pack?.id!==t.packId)return fail('Carried pack ownership lost');
 if(['DELIVER','UNLOAD'].includes(t.stage)){
  t.elapsed+=dt;t.stageElapsed+=dt;
  if(d.mode!=='SCOUT AHEAD'){t.state='PAUSED';t.reason='Delivery paused by flight order';return [];}
  if(t.stageElapsed>180)return fail('Trailer delivery timed out; pack retained aboard');
  const onStation=trailerHome&&distance(d.pos,trailerHome)<.7&&d.speed<.6&&trailerStopped;
  t.dwell=onStation?Math.min(2,t.dwell+dt):0;t.stage=onStation?'UNLOAD':'DELIVER';
  t.reason=onStation?'UNLOAD / securing pack to trailer':'Returning pack to trailer; stop for unloading';
  if(t.dwell>=2){const result=unloadBatteryPack(state,record,{trailerHome,stopped:trailerStopped});t.reason=result.reason;if(result.ok){t.stage='DONE';t.state='COMPLETED';commandDrone(d,'RETURN HOME',home,record.battery,solids);return ['task-complete'];}}
  return [];
 }
 const status=lineStatus(state||{},t.anchor.spanId);if(!status.live)return fail('Line unavailable: '+status.reason);
 t.elapsed+=dt;t.stageElapsed+=dt;
 if(['APPROACH','ALIGN'].includes(t.stage)){
  if(d.mode!=='SCOUT AHEAD'){t.state='PAUSED';t.reason='Flight order changed';return [];}
  if(t.stageElapsed>120)return fail('Line approach timed out');
  const target=lineTaskTarget(record),onStation=distance(d.pos,target)<(t.stage==='ALIGN'?.12:.7)&&d.speed<(t.stage==='ALIGN'?.3:1);
  if(t.stage==='APPROACH'&&onStation){t.stage='ALIGN';t.stageElapsed=t.dwell=0;t.reason='ALIGN / matching conductor';}
  else if(t.stage==='ALIGN'){
   t.dwell=onStation?Math.min(2,t.dwell+dt):0;
   if(t.dwell>=2){d.mode='PERCHED';d.perch={...t.anchor};d.velocity=[0,0,0];d.speed=d.thrust=d.pitch=d.roll=0;d.reason='Clamped to conductor';t.stage='PERCH';t.stageElapsed=0;t.reason='PERCH / propulsion stopped';return ['task-perch'];}
  }
  return [];
 }
 if(d.mode!=='PERCHED'||!d.perch||distance(d.pos,lineBody(t.anchor))>.22)return fail('Physical attachment lost');
 if(t.stage==='PERCH'&&t.stageElapsed>=1){t.stage='COUPLING';t.stageElapsed=0;t.reason='COUPLING / checking energized line';}
 else if(t.stage==='COUPLING'&&t.stageElapsed>=2){t.stage='CHARGING';t.stageElapsed=0;t.reason='CHARGING / onboard battery';}
 else if(t.stage==='CHARGING'){
  const room=Math.max(0,(t.targetPercent-record.battery)/100*UTILITY_BATTERY_WH),packRoom=pack?Math.max(0,PACK_WH*.9-pack.chargeWh):0,circuit=spanById(t.anchor.spanId).circuit;
  const gain=Math.min(room+packRoom,status.remainingWh,LINE_RATE_WH*dt),onboard=Math.min(room,gain);
  state.lineGrid.remainingWh[circuit]=Math.max(0,state.lineGrid.remainingWh[circuit]-gain);
  record.battery=Math.min(100,record.battery+onboard/UTILITY_BATTERY_WH*100);if(pack)pack.chargeWh+=gain-onboard;t.harvestedWh+=gain;
  if(pack&&pack.chargeWh>=PACK_WH*.9-1e-8){commandDrone(d,'SCOUT AHEAD',home,record.battery,solids);t.stage='DELIVER';t.stageElapsed=t.dwell=0;t.reason='Pack charged / releasing for trailer delivery';return ['task-charged'];}
  if(!pack&&record.battery>=t.targetPercent-1e-8){t.stage='STANDBY';t.stageElapsed=0;t.reason='Charged to 90%; perched until recalled';return ['task-charged'];}
  t.reason=pack?'CHARGING / pack '+pack.chargeWh.toFixed(1)+' / 108 Wh':'CHARGING / '+Math.round(record.battery)+'% · '+Math.ceil(room/LINE_RATE_WH)+' s to 90%';
 }
 return [];
}
