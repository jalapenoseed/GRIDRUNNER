import {carriedPack,loadBatteryPack} from './battery-packs.js';
import {assignLineHarvest} from './line-harvest.js';
import {campaignUnlocks,syncCampaignProgress} from './campaign-progress.js';

export const POLICY_TARGETS=[40,60,80,100];
export function createFleetPolicy(){return {version:1,enabled:false,targetPercent:60,cycles:0,lastCompletedTaskId:'',retryAt:0,status:'Complete one manual delivery to unlock reserve automation.'};}

export function validateFleetPolicy(value){
 const p=createFleetPolicy();if(value===undefined)return p;
 if(!value||value.version!==1||typeof value.enabled!=='boolean'||!POLICY_TARGETS.includes(value.targetPercent)||!Number.isSafeInteger(value.cycles)||value.cycles<0||value.cycles>1e9||typeof value.lastCompletedTaskId!=='string'||value.lastCompletedTaskId.length>80||!Number.isFinite(value.retryAt)||value.retryAt<0||value.retryAt>1e10||typeof value.status!=='string'||value.status.length>180)throw Error('Invalid fleet power policy');
 return {...p,...value};
}

export function configureFleetPolicy(s,{enabled,targetPercent}={}){
 const p=s.fleetPolicy=validateFleetPolicy(s.fleetPolicy);
 if(targetPercent!==undefined){if(!POLICY_TARGETS.includes(targetPercent))return {ok:false,reason:'Unsupported reserve target.'};p.targetPercent=targetPercent;p.retryAt=0;}
 if(enabled!==undefined){if(enabled&&!campaignUnlocks(s).reservePolicy)return {ok:false,reason:'Complete one manual Harvest & Deliver run first.'};p.enabled=!!enabled;p.retryAt=0;p.status=p.enabled?'Reserve automation armed.':'Reserve automation off; active flights continue safely.';}
 return {ok:true,reason:p.status};
}

export function advanceFleetPolicy(s,record,{elapsed=0,nearTrailer=false,trailerStopped=false,trailerHome,home,solids=[],terrain=()=>0,storm=false,jammed=false}={}){
 const p=s.fleetPolicy=validateFleetPolicy(s.fleetPolicy),events=[],task=record?.task;
 if(task?.kind==='LINE'&&task.packId&&task.state==='COMPLETED'&&task.stage==='DONE'&&task.id!==p.lastCompletedTaskId){
  p.lastCompletedTaskId=task.id;p.cycles++;syncCampaignProgress(s).firstPackDelivered=true;events.push('policy-unlocked');
 }
 const unlocked=campaignUnlocks(s).reservePolicy;
 if(!unlocked){p.enabled=false;p.status='Complete one manual Harvest & Deliver run to unlock automation.';return events;}
 if(!p.enabled){p.status='Unlocked / manual control.';return events;}
 const target=p.targetPercent/100*40;
 if(s.trailer>=target-.01){p.status='Target reached / trailer '+Math.round(s.trailer/40*100)+'%.';return events;}
 if(storm||jammed){p.status='Holding policy / weather or interference unsafe.';p.retryAt=Math.max(p.retryAt,elapsed+15);return events;}
 if(record?.task&&['RUNNING','PAUSED'].includes(record.task.state)){p.status='Active / '+record.task.stage+' · trailer '+Math.round(s.trailer/40*100)+'% → '+p.targetPercent+'%.';return events;}
 if(!record||record.type!=='engineer'||!s.engineerBuilt||s.leg!==1){p.status='Utility with engineer module is required in Ghost Signal.';return events;}
 if(record.system.mode!=='DOCK'){p.status='Waiting for Utility to return and dock.';return events;}
 if(!nearTrailer||!trailerStopped){p.status='Park the bike beside the stopped trailer to redeploy.';return events;}
 if(elapsed<p.retryAt)return events;
 if(record.battery<25||record.system.hp<30){p.status='Utility needs 25% battery and 30% hull.';p.retryAt=elapsed+15;return events;}
 let pack=carriedPack(s,record);
 if(!pack){
  const load=loadBatteryPack(s,record,{near:true,stopped:true,trailerHome});
  if(!load.ok){p.status=load.reason;p.retryAt=elapsed+15;return events;}
  pack=carriedPack(s,record);events.push('policy-loaded');
 }
 const result=assignLineHarvest(record,{state:s,deliver:true,trailerHome,home,solids,terrain,storm,jammed});
 if(!result.ok){p.status=result.reason;p.retryAt=elapsed+15;return events;}
 p.status='Redeployed '+pack.id.toUpperCase()+' / trailer target '+p.targetPercent+'%.';p.retryAt=0;events.push('policy-dispatched');return events;
}
