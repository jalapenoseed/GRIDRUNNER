// One campaign-owned, non-weaponized patrol. Perception reads the player only
// through a bounded camera cone and LOS. Movement uses the existing aircraft
// controller, hull sweeps, terrain and battery drain, not position assignment.
import {createDrone,migrateDrone,commandDrone,updateDrone,obstruction,wrapAngle} from './drone-system.js';

export const WATCH_HOME=Object.freeze([-24,1.1,-352]);
export const WATCH_CAPACITY_WH=60;
export const WATCH_PATROL=Object.freeze([[24,12,-200],[42,14,-258],[10,12,-330],[-14,12,-282]]);
const PHASES=['PATROL','INVESTIGATE','OBSERVE','SEARCH','RETREAT','RECHARGE','GROUNDED'];
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSurveillance(){return {version:1,phase:'PATROL',system:createDrone(WATCH_HOME),battery:100,stationWh:180,waypoint:0,exposure:0,lastSeen:null,lostFor:0,phaseTime:0,encounters:0};}

export function validateSurveillance(raw){
 if(raw===undefined)return createSurveillance();
 const bad=()=>{throw Error('Invalid WATCH-01 record');};
 if(!raw||raw.version!==1||!PHASES.includes(raw.phase))bad();
 for(const [key,max]of [['battery',100],['stationWh',180],['exposure',1],['lostFor',1e10],['phaseTime',1e10],['encounters',1e8]])if(!Number.isFinite(raw[key])||raw[key]<0||raw[key]>max)bad();
 if(!Number.isSafeInteger(raw.encounters)||!Number.isInteger(raw.waypoint)||raw.waypoint<0||raw.waypoint>=WATCH_PATROL.length)bad();
 if(raw.lastSeen!==null&&(!Array.isArray(raw.lastSeen)||raw.lastSeen.length!==3||raw.lastSeen.some(n=>!Number.isFinite(n)||Math.abs(n)>10000)))bad();
 if(['INVESTIGATE','OBSERVE','SEARCH'].includes(raw.phase)&&!raw.lastSeen)bad();
 if(!raw.system||!['DOCK','SCOUT AHEAD','RETURN HOME','LANDED'].includes(raw.system.mode))bad();
 const system=migrateDrone(raw.system,WATCH_HOME);
 if(system.pos[0]<-600||system.pos[0]>600||system.pos[1]<.6||system.pos[1]>200||system.pos[2]<-1600||system.pos[2]>230)bad();
 if(system.mode==='DOCK'&&distance(system.pos,WATCH_HOME)>1.3)bad();
 if(raw.phase==='RECHARGE'&&system.mode!=='DOCK'||raw.phase==='GROUNDED'&&system.mode!=='LANDED')bad();
 return {...createSurveillance(),...raw,system,lastSeen:raw.lastSeen?[...raw.lastSeen]:null};
}

export function watchCanSee(eye,yaw,target,{solids=[],terrain=()=>0,storm=false,visibility=1}={}){
 if(!target)return false;
 const delta=target.map((v,i)=>v-eye[i]),range=distance(eye,target),horizontal=Math.hypot(delta[0],delta[2]);
 if(range>(storm?42:68)*Math.max(.2,Math.min(1,visibility))||range<.01||Math.abs(delta[1])>Math.max(18,horizontal*1.7))return false;
 if(horizontal>4&&(-Math.sin(yaw)*delta[0]-Math.cos(yaw)*delta[2])/horizontal<Math.cos(Math.PI*.36))return false;
 if(obstruction(eye,target,solids))return false;
 const samples=Math.max(2,Math.ceil(range/1.5));
 for(let i=1;i<samples;i++){const t=i/samples,x=eye[0]+delta[0]*t,z=eye[2]+delta[2]*t;if(terrain(x,z)>eye[1]+delta[1]*t-.12)return false;}
 return true;
}

export function advanceSurveillance(w,dt,{active=false,target=null,solids=[],terrain=()=>0,storm=false,visibility=1}={}){
 if(!active||!Number.isFinite(dt)||dt<=0)return [];
 dt=Math.min(dt,.05);const events=[],d=w.system;
 const phase=next=>{if(w.phase===next)return;w.phase=next;w.phaseTime=0;events.push(next);};
 w.phaseTime+=dt;
 if(w.phase==='GROUNDED'){
  const result=updateDrone(d,dt,{home:WATCH_HOME,battery:w.battery,type:'scout',terrain,solids,storm,idleMotion:false});w.battery=result.battery;return events;
 }
 if(w.phase==='RECHARGE'){
  const wh=Math.min(.3*dt,w.stationWh,(100-w.battery)*WATCH_CAPACITY_WH/100);
  w.stationWh=Math.max(0,w.stationWh-wh);w.battery=clamp(w.battery+wh/WATCH_CAPACITY_WH*100,0,100);
  if(w.battery>=90&&w.phaseTime>8&&d.hp>=30){w.exposure=0;w.lastSeen=null;w.lostFor=0;phase('PATROL');}
  return events;
 }
 if(w.battery<22||d.hp<30||d.mode==='RETURN HOME')phase('RETREAT');
 // Retreat never follows the target. The charger has a finite independent bank.
 if(w.phase!=='RETREAT'){
  const visible=watchCanSee(d.pos,d.yaw,target,{solids,terrain,storm,visibility});
  if(visible){w.lastSeen=[...target];w.lostFor=0;w.exposure=clamp(w.exposure+dt*.32,0,1);}
  else{w.lostFor+=dt;w.exposure=Math.max(0,w.exposure-dt*.12);}
  if(visible&&w.exposure>=.95&&w.phase!=='OBSERVE'){w.encounters++;phase('OBSERVE');}
  else if(visible&&w.exposure>=.25&&w.phase==='PATROL')phase('INVESTIGATE');
  if(['OBSERVE','INVESTIGATE'].includes(w.phase)&&w.lostFor>=2.5)phase('SEARCH');
  if(w.phase==='SEARCH'&&w.phaseTime>=14){w.exposure=0;phase('RETREAT');}
  // A target cannot drag the patrol into camp or another chapter indefinitely.
  if(w.lastSeen&&(w.lastSeen[2]>-165||w.lastSeen[2]<-410||Math.abs(w.lastSeen[0])>150))phase('RETREAT');
 }
 let destination=WATCH_PATROL[w.waypoint];
 if(w.phase==='RETREAT'){
  if(d.mode!=='RETURN HOME'&&d.mode!=='LANDED')commandDrone(d,'RETURN HOME',WATCH_HOME,w.battery,solids);
 }else{
  if(w.phase==='PATROL'&&distance(d.pos,destination)<3){w.waypoint=(w.waypoint+1)%WATCH_PATROL.length;destination=WATCH_PATROL[w.waypoint];}
  if(w.lastSeen&&['INVESTIGATE','OBSERVE','SEARCH'].includes(w.phase)){
   const offset=w.phase==='SEARCH'?[[0,10,0],[14,10,0],[0,10,14],[-14,10,0],[0,10,-14]][Math.min(4,Math.floor(w.phaseTime/3))]:[0,9,0];
   destination=w.lastSeen.map((v,i)=>v+offset[i]);
  }
  if(d.mode==='DOCK')commandDrone(d,'SCOUT AHEAD',WATCH_HOME,w.battery,solids);
  if(d.mode!=='LANDED')d.mode='SCOUT AHEAD';
 }
 // Limit look-ahead to six metres: this yields a readable ~8 m/s observation
 // pace while retaining the normal acceleration, braking and collision model.
 const delta=destination.map((v,i)=>v-d.pos[i]),horizontal=Math.hypot(delta[0],delta[2]),ratio=Math.min(1,6/Math.max(.001,horizontal));
 const taskTarget=[d.pos[0]+delta[0]*ratio,Math.max(destination[1],terrain(destination[0],destination[2])+7),d.pos[2]+delta[2]*ratio];
 let yaw=horizontal>.5?Math.atan2(-delta[0],-delta[2]):d.yaw;
 if(w.phase==='SEARCH')yaw=wrapAngle(d.yaw+dt*.85);
 if(w.phase==='RETREAT')yaw=Math.atan2(d.pos[0]-WATCH_HOME[0],d.pos[2]-WATCH_HOME[2]);
 const result=updateDrone(d,dt,{home:WATCH_HOME,yaw,taskTarget,battery:w.battery,type:'scout',terrain,solids,storm,idleMotion:false});
 w.battery=result.battery;
 if(d.mode==='LANDED'){phase('GROUNDED');w.exposure=0;}
 else if(d.mode==='DOCK'&&w.phase==='RETREAT'){phase('RECHARGE');w.exposure=0;}
 else if(result.events.includes('return')){phase('RETREAT');w.exposure=0;}
 return events;
}

export function surveillanceReadout(w){
 if(w.phase==='OBSERVE')return {level:'alert',text:'WATCH-01 · TRACKING',hint:'Break line of sight. The roofed service bay is cover.'};
 if(w.phase==='INVESTIGATE'||w.phase==='PATROL'&&w.exposure>.05)return {level:'warning',text:'WATCH-01 · SUSPICION '+Math.round(w.exposure*100)+'%',hint:'Its camera can see your rider. Move behind solid cover.'};
 if(w.phase==='SEARCH')return {level:'warning',text:'WATCH-01 · LAST-KNOWN SEARCH',hint:'Stay out of sight or leave by the service path.'};
 return null;
}
