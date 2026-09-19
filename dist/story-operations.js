import {FIELD_STATIONS,storyFlag,storyOwns,storyStation,syncStoryCampaign} from './story-campaign.js';
import {commandDrone,createDrone} from './drone-system.js';
import {hasLiveTask} from './fleet-tasks.js';
import {assignLineHarvest} from './line-harvest.js';
import {lineStatus,spanById,UTILITY_BATTERY_WH,LINE_RATE_WH} from './power-lines.js';
import {carriedPack} from './battery-packs.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function placeStoryDrone(s,id,siteId,{operator,home,terrain=()=>0}={}){
 const c=syncStoryCampaign(s),site=FIELD_STATIONS.find(p=>p.id===siteId),r=s.squad?.[id];
 if(!site||site.leg!==s.leg||!storyFlag(s,site.requires))return {ok:false,reason:'Discover and restore this station first.'};
 if(!r||!storyOwns(s,id)||storyStation(s,id)||r.system.mode!=='DOCK'||hasLiveTask(r)||carriedPack(s,r))return {ok:false,reason:'Select an owned, docked drone without an active job or carried pack.'};
 if(s.mode==='drone'||Math.abs(s.speed)>.5||Math.hypot(operator[0]-site.x,operator[2]-site.z)>18||Math.hypot(home[0]-site.x,home[2]-site.z)>24)return {ok:false,reason:'Stop with your bike beside this station to place a drone.'};
 const occupied=new Set(Object.values(c.stations).filter(p=>p.site===siteId).map(p=>Math.round((p.pos[0]-site.x)/1.6))),slot=Array.from({length:8},(_,i)=>i).find(i=>!occupied.has(i)),pos=[site.x+slot*1.6,terrain(site.x+slot*1.6,site.z)+.7,site.z];
 c.stations[id]={kind:'site',site:site.id,leg:site.leg,pos,name:site.name};r.task=null;r.swarmOrder=null;r.system.mode='LANDED';r.system.pos=[...pos];r.system.hold=[...pos];r.system.velocity=[0,0,0];r.system.speed=0;r.system.reason='Stationed at '+site.name;
 return {ok:true,reason:'Drone placed at '+site.name+'. Its battery draws from this station’s finite reserve.'};
}
export function stageStoryCharger(s){
 const r=s.squad?.engineer,c=syncStoryCampaign(s);
 if(!r||r.system.mode!=='PERCHED'||r.task?.kind!=='LINE'||carriedPack(s,r))return {ok:false,reason:'Perch Charger on a conductor without a delivery pack first.'};
 c.stations.engineer={kind:'line',leg:1,pos:[...r.system.pos],name:'Conductor '+r.task.anchor.spanId,spanId:r.task.anchor.spanId};
 r.task=null;r.swarmOrder=null;r.system.mode='LANDED';r.system.perch=null;r.system.hold=[...r.system.pos];r.system.velocity=[0,0,0];r.system.reason='Charger stationed on conductor';c.charger.stage='staged';c.charger.perched=true;
 return {ok:true,reason:'Charger will stay on this line. Return to this sector to recall it.'};
}
export function recallStoryDrone(s,id,{operator,home,solids=[]}={}){
 const p=storyStation(s,id),r=s.squad?.[id];if(!p||!r)return {ok:false,reason:'Aircraft is already with the travelling fleet.'};
 if(p.leg!==s.leg)return {ok:false,reason:'Return to sector '+p.leg+' to collect this aircraft.'};
 if(p.kind==='site'){
  if(distance([operator[0],p.pos[1],operator[2]],p.pos)>18||distance([home[0],p.pos[1],home[2]],p.pos)>24||Math.abs(s.speed)>.5||s.mode==='drone')return {ok:false,reason:'Stop beside the station with your bike to retrieve this drone.'};
  const hp=r.system.hp;r.system=createDrone();r.system.hp=hp;r.system.pos=[...home];
 }else{
  if(distance(home,p.pos)>240||r.battery<12||r.system.hp<20)return {ok:false,reason:'Bring the bike within 240 m; Charger needs 12% charge and 20% hull.'};
  const before=JSON.parse(JSON.stringify(r.system));r.system.mode='HOLD';r.system.pos=[p.pos[0]-3,p.pos[1]+2,p.pos[2]];r.system.hold=[...r.system.pos];
  if(!commandDrone(r.system,'RETURN HOME',home,r.battery,solids)){Object.assign(r.system,before);return {ok:false,reason:'Return path unavailable.'};}
 }
 delete s.story.stations[id];r.task=null;if(id===s.droneType){s.droneSystem=r.system;s.drone=r.battery;}if(id==='engineer')s.story.charger.stage='idle';
 return {ok:true,reason:p.kind==='site'?'Drone secured to your rig.':'Charger released the line and is returning.'};
}
export function dispatchStoryCharger(s,context){
 const c=syncStoryCampaign(s),r=s.squad?.engineer;
 if(!s.engineerBuilt||!r)return {ok:false,reason:'Build the engineer module in the Workshop first.'};
 if(!s.relayHouse?.discovered)return {ok:false,reason:'Decode the Relay House carrier first.'};
 if(storyStation(s,'engineer'))return {ok:false,reason:'Recall stationed Charger before assigning a new search.'};
 const result=assignLineHarvest(r,{...context,state:s,deliver:!!carriedPack(s,r)});
 if(result.ok){c.charger.stage='identified';c.charger.source=r.task.anchor.spanId;r.swarmOrder=null;}
 return result;
}
export function advanceStoryOperations(s,dt){
 const c=syncStoryCampaign(s);dt=Math.min(.05,Math.max(0,dt));
 for(const [id,p]of Object.entries(c.stations)){
  const r=s.squad?.[id];if(!r||r.system.hp<=0)continue;
  // Only the active world advances. Pausing, closing the game and other sectors earn no charge.
  if(p.leg!==s.leg)continue;
  const capacity=id==='engineer'?UTILITY_BATTERY_WH:120,room=(100-r.battery)/100*capacity;
  let gain=0;
  if(p.kind==='site'){const site=FIELD_STATIONS.find(t=>t.id===p.site);if(storyFlag(s,site.requires)){gain=Math.min(room,c.reserves[p.site],dt*.6);c.reserves[p.site]-=gain;}}
  else {const status=lineStatus(s,p.spanId);if(status.live){gain=Math.min(room,status.remainingWh,dt*LINE_RATE_WH);s.lineGrid.remainingWh[spanById(p.spanId).circuit]-=gain;}}
  r.battery=Math.min(100,r.battery+gain/capacity*100);if(id===s.droneType)s.drone=r.battery;
 }
 const r=s.squad?.engineer,t=r?.task;if(storyStation(s,'engineer'))return;
 if(t?.kind!=='LINE')return;
 if(r.system.mode==='PERCHED')c.charger.perched=true;
 if(t.state==='COMPLETED'){c.charger.stage='complete';c.charger.delivered ||= !!t.packId;return;}
 if(['FAILED','CANCELLED','PAUSED'].includes(t.state)){c.charger.stage='interrupted';return;}
 c.charger.stage=({APPROACH:'approach',ALIGN:'approach',PERCH:'perched',COUPLING:'perched',CHARGING:'charging',STANDBY:'staged',DELIVER:'delivering',UNLOAD:'delivering'})[t.stage]||'searching';
}
export function prepareStoryTravel(s){
 // Preserve every stationed aircraft exactly. Travelling aircraft must already be docked.
 const held={};for(const [id]of Object.entries(s.story?.stations||{}))held[id]=JSON.parse(JSON.stringify(s.squad[id]));return held;
}
export function restoreStoryStations(s,held){for(const [id,r]of Object.entries(held))s.squad[id]=r;if(held[s.droneType]){s.droneType='scout';s.droneSystem=s.squad.scout.system;s.drone=s.squad.scout.battery;}}
