import {DRONE_CLASSES,obstruction,radioQuality,droneLink} from './drone-system.js';
import {solidList} from './spatial-index.js';
import {assignSurvey,hasLiveTask} from './fleet-tasks.js';

// A fixed two-aircraft operation. This is terrain landing, not line harvesting.
export function planRelayOutpost({home,yaw=0,leg=1,terrain=()=>0,solids=[],storm=false,jammed=false}){
 const floor=leg===3?-4720:leg===2?-3200:-1600,environment={terrain,solids,storm,jammed};
 const point=(forward,right=0)=>[home[0]-Math.sin(yaw)*forward+Math.cos(yaw)*right,home[2]-Math.cos(yaw)*forward-Math.sin(yaw)*right];
 const inside=(x,z)=>x>-590&&x<590&&z>floor+10&&z<220;
 const obstacles=solidList(solids).filter(b=>b.drone!==false).map(b=>({...b,w:b.w+2,d:b.d+2,minY:(b.minY??0)-.5,maxY:(b.maxY??12)+.5}));
 for(const forward of [240,220,260])for(const right of [0,12,-12,24,-24,40,-40]){
  const [x,z]=point(forward,right);if(!inside(x,z))continue;
  const y=terrain(x,z)+.68,landing=[x,y,z],above=[x,y+12,z];
  if(y<.65||y>170||[[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dz])=>Math.abs(terrain(x+dx,z+dz)+.68-y)>.25))continue;
  if(obstruction(landing,above,obstacles)||radioQuality(home,landing,DRONE_CLASSES.relay.range,environment)<15)continue;
  const [sx,sz]=point(460,right);if(!inside(sx,sz))continue;
  const survey=[sx,Math.max(home[1]+20,terrain(sx,sz)+20),sz];
  if(survey[1]>190||obstruction(survey,[sx,survey[1]+1,sz],obstacles))continue;
  const link=droneLink(survey,home,{...environment,type:'scout',relayNodes:[{id:'planned-relay',pos:landing,battery:100,hp:100}]});
  if(link.via&&link.signal>12)return {landing,survey};
 }
 return null;
}

export function deployRelayOutpost(squad,options){
 const pair=[squad.relay,squad.scout];
 if(pair.some(r=>!r||hasLiveTask(r)))return {ok:false,reason:'Cancel or finish Scout and Relay jobs before deploying an outpost.'};
 if(pair.some(r=>r.battery<40||r.system.hp<30||r.system.mode==='LANDED'))return {ok:false,reason:'Scout and Relay need 40% battery, 30% hull and recoverable flight.'};
 const plan=planRelayOutpost(options);if(!plan)return {ok:false,reason:'No clear outpost and onward link ahead. Reposition the bike or change heading.'};
 // Prepare both orders on copies; refusal must not leave half a formation flying.
 const [relay,scout]=pair.map(r=>JSON.parse(JSON.stringify(r)));
 let result=assignSurvey(relay,{...options,destination:plan.landing});if(!result.ok)return result;
 result=assignSurvey(scout,{...options,destination:plan.survey});if(!result.ok)return result;
 relay.task.kind='RELAY';relay.task.reason='Establishing a landed relay outpost';
 scout.task.stage='WAIT';scout.task.relayId=relay.id;scout.task.reason='Waiting for landed relay';
 // Keep the holding Scout clear of its sibling's launch and the terrain.
 scout.system.hold[1]=Math.max(scout.system.hold[1],options.home[1]+10);
 for(const [live,draft] of [[squad.relay,relay],[squad.scout,scout]]){
  Object.assign(live.system,draft.system);live.task=draft.task;live.taskSerial=draft.taskSerial;
 }
 return {ok:true,reason:'Relay deploying ~240 m ahead; Scout waits, surveys ~460 m ahead, then returns.'};
}
