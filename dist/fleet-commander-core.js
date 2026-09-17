import {createSwarmProgram,validateSwarmProgram,sampleSwarmProgram,initialProgramOrders,advanceSwarmProgram} from './swarm-program.js';
import {BEACON_PALETTE,beaconColor} from './beacon-palette.js';

export const COMMANDER_TYPES={scout:{name:'Scout',speed:24,span:.52},relay:{name:'Relay',speed:22,span:.68},cargo:{name:'Cargo',speed:13,span:1.9},engineer:{name:'Utility',speed:16,span:.7}};
export const COMMANDER_TEAMS=['alpha','bravo','charlie','delta'];
export const COMMANDER_MODES={sandbox:'Free flight',formation:'Formation drill',hunt:'Beacon hunt',party:'Party relay'};
export const COMMANDER_OBSTACLES=[{x:-76,z:-32,w:12,d:16,h:17},{x:78,z:-58,w:10,d:14,h:30},{x:62,z:66,w:13,d:10,h:13}];
export const COMMANDER_EXAMPLES={
 'Beat dance':'select all\nformation grid\nheight 28\nshow dance\nbeat on\nbpm 120\noffset 0\nrepeat 32',
 'Hundred-drone bloom':'select all\nformation ring\nspacing 14\nheight 32\npattern orbit\ninfluence riemann 14 0.5\nwait 12\ninfluence wave 8 0.7\nshow dance\nwait 12\nshow flyby\nrepeat 40',
 'Color wave':'select all\nformation grid\nheight 28\ninfluence wave 8 0.6\nshow dance\nselect cyan\nheight 40\nselect pink\nheight 22\nrepeat 32',
 'Write HELLO':'select all\nformation word\nword HELLO\nplane sky\nheight 35\nscale 3\ntrace off\nwait 16\nword GRID\nwait 16\nword RUN\nrepeat 48',
 'Guard and scout':'select alpha\nassign operator\nselect bravo\nassign bike\nselect charlie\nassign scout\nselect delta\nassign formation\nformation ring\ninfluence vortex 8 0.4\nrepeat 24'
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const validPoint=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&Math.abs(p[0])<=220&&p[1]>=0&&p[1]<=90&&Math.abs(p[2])<=220;
export function commanderGroups(roster){
 const groups={};for(const key of ['scouts','relays','cargo','engineers',...COMMANDER_TEAMS,...BEACON_PALETTE.map(c=>c.id)])groups[key]=[];
 const types={scout:'scouts',relay:'relays',cargo:'cargo',engineer:'engineers'};
 for(const drone of roster){groups[types[drone.type]].push(drone.id);groups[drone.team].push(drone.id);groups[drone.color].push(drone.id);}return groups;
}
export function createCommanderFleet(count=100,mix='recon'){
 count=clamp(Math.round(Number(count)||6),1,100);
 const roster=Array.from({length:count},(_,i)=>({id:'drone-'+String(i+1).padStart(3,'0'),name:'DRONE '+String(i+1).padStart(3,'0'),type:mix==='mixed'?['scout','scout','relay','cargo','engineer'][i%5]:mix==='relay'?'relay':i%3===2?'relay':'scout',color:BEACON_PALETTE[i%9].id,team:COMMANDER_TEAMS[i%4]}));
 const program=createSwarmProgram();program.ids=roster.map(r=>r.id);program.settings={...program.settings,shape:'grid',height:28,origin:'fixed',moveZ:-25,offset:.04,morph:3,trace:false};program.source=COMMANDER_EXAMPLES['Hundred-drone bloom'];
 return validateCommanderFleet({kind:'gridrunner-commander-fleet',version:1,name:count+' drone field kit',roster,program,objective:[0,28,-70],options:{unlimited:true,reducedMotion:false,obstacles:true,beaconSize:9}});
}
export function validateCommanderFleet(raw){
 if(!raw||raw.kind!=='gridrunner-commander-fleet'||raw.version!==1||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>48)throw Error('Choose a named Commander fleet file.');
 if(!Array.isArray(raw.roster)||raw.roster.length<1||raw.roster.length>100)throw Error('Fleet size must be 1–100 drones.');
 const ids=new Set(),roster=raw.roster.map(drone=>{
  if(!drone||typeof drone.id!=='string'||!/^drone-\d{3}$/.test(drone.id)||ids.has(drone.id)||!Object.hasOwn(COMMANDER_TYPES,drone.type)||!COMMANDER_TEAMS.includes(drone.team)||!BEACON_PALETTE.some(c=>c.id===drone.color)||typeof drone.name!=='string'||!drone.name.trim()||drone.name.length>30)throw Error('Fleet contains an invalid or duplicate drone.');
  ids.add(drone.id);return {id:drone.id,name:drone.name,type:drone.type,color:drone.color,team:drone.team};
 });
 if(!raw.program)throw Error('Fleet program is missing.');
 const groups=commanderGroups(roster),program=validateSwarmProgram(raw.program,{reset:true,aircraft:[...ids],groups});
 if(!validPoint(raw.objective))throw Error('Objective must be inside the practice field.');
 const o=raw.options;if(!o||['unlimited','reducedMotion','obstacles'].some(key=>typeof o[key]!=='boolean')||!Number.isFinite(o.beaconSize)||o.beaconSize<4||o.beaconSize>14)throw Error('Invalid practice options.');
 return {kind:raw.kind,version:1,name:raw.name.trim(),roster,program,objective:[...raw.objective],options:{unlimited:o.unlimited,reducedMotion:o.reducedMotion,obstacles:o.obstacles,beaconSize:o.beaconSize}};
}
export function resolveCommanderGroup(fleet,group){return group==='all'?fleet.roster.map(r=>r.id):commanderGroups(fleet.roster)[group]||fleet.roster.filter(r=>r.id===group).map(r=>r.id);}
const pad=(i,n)=>{const width=Math.ceil(Math.sqrt(n));return [(i%width-(width-1)/2)*4,1,72+Math.floor(i/width)*4];};
const length=v=>Math.hypot(...v);
export class CommanderSimulation{
 constructor(config=createCommanderFleet()){this.load(config);}
 load(config){
  this.fleet=validateCommanderFleet(config);this.program=this.fleet.program;this.drones=this.fleet.roster.map((r,i)=>({...r,pos:pad(i,this.fleet.roster.length),velocity:[0,0,0],home:pad(i,this.fleet.roster.length),target:pad(i,this.fleet.roster.length),battery:100,mode:'DOCK',order:'formation',delay:0,attitude:{pitch:0,roll:0},yaw:0,override:''}));
  this.elapsed=0;this.running=true;this.launchClock=0;this.challenge=null;this.lastResult=null;this.targetErrors=0;this.checks=0;this.separations=0;this.targetClamps=0;this.notice='Fleet ready. Launch to begin.';this.program.enabled=false;this.program.running=false;
 }
 snapshot(){const config={...this.fleet,roster:this.drones.map(({id,name,type,color,team})=>({id,name,type,color,team})),program:this.program};return validateCommanderFleet(config);}
 apply(config){
  const next=validateCommanderFleet(config);
  if(next.roster.length!==this.drones.length||next.roster.some((r,i)=>r.id!==this.drones[i].id)){this.load(next);return;}
  this.fleet=next;this.program=next.program;const orders=initialProgramOrders(this.program);
  this.drones.forEach((d,i)=>{Object.assign(d,next.roster[i]);if(this.program.ids.includes(d.id)&&!['RETURN','DOCK'].includes(d.mode)){d.order=orders[d.id];if(d.order==='standby')this.recall([d.id]);}else if(d.order==='formation')d.order='hold';});
  this.program.enabled=this.drones.some(d=>['FLY','QUEUED'].includes(d.mode));this.program.running=this.program.enabled;this.program.activeIds=this.program.ids.filter(id=>['FLY','QUEUED'].includes(this.drones.find(d=>d.id===id)?.mode));
  this.notice='Program applied. '+this.program.ids.length+' drones addressed.';
 }
 launch(){
  const orders=initialProgramOrders(this.program);let queued=0;
  for(const d of this.drones)if(d.mode==='DOCK'&&d.battery>=20){d.mode='QUEUED';d.delay=this.elapsed+queued*.035;d.order=orders[d.id]||'formation';queued++;}
  this.program.enabled=true;this.program.running=true;this.program.activeIds=[...this.program.ids];this.running=true;this.notice=queued?'Launching '+queued+' drones.':'Fleet is already airborne, or needs a recharge.';
 }
 recall(ids=this.drones.map(d=>d.id)){for(const d of this.drones)if(ids.includes(d.id)){if(d.mode==='QUEUED')d.mode='DOCK';else if(d.mode==='FLY')d.mode='RETURN';d.override='Returning to launch pad';}this.program.activeIds=this.program.activeIds.filter(id=>!ids.includes(id));if(!this.program.activeIds.length)this.program.running=false;this.notice='Return ordered. Launch pads remain reserved for each drone.';}
 assign(ids,order){if(!['scout','operator','bike','relay','hold'].includes(order))throw Error('Unknown group assignment.');let assigned=0;for(const d of this.drones)if(ids.includes(d.id)&&['FLY','QUEUED'].includes(d.mode)){d.order=order;d.override='';if(order==='hold')d.target=[d.pos[0],Math.max(12,d.pos[1]),d.pos[2]];this.program.activeIds=this.program.activeIds.filter(id=>id!==d.id);assigned++;}this.notice=assigned+' drones assigned to '+order+'.'+(!assigned?' Launch the group first.':'');}
 send(ids){this.assign(ids,'scout');}
 setObjective(point){if(this.challenge)throw Error('Challenge objectives are set by the course.');this.fleet.objective=[clamp(point[0],-180,180),clamp(point[1],8,75),clamp(point[2],-180,180)];}
 recharge(){for(const d of this.drones)if(d.mode==='DOCK')d.battery=100;this.notice='Docked drones recharged.';}
 startChallenge(mode,players=['Pilot 1','Pilot 2']){
  if(!Object.hasOwn(COMMANDER_MODES,mode))throw Error('Unknown exercise.');
  if(mode==='sandbox'){this.challenge=null;this.lastResult=null;this.notice='Free flight. Click the field to move the objective.';return;}
  const seed=this.snapshot();this.load(seed);this.challenge={mode,seed,players:players.slice(0,4).map(v=>String(v).slice(0,24)),turn:0,scores:[],score:0,elapsed:0,stage:0,dwell:0,delivered:new Set(),wrong:new Set(),finished:false,roundOver:false};this.launch();if(mode!=='formation'){this.assign(this.drones.map(d=>d.id),'hold');this.program.running=false;this.program.enabled=false;}this.nextChallengeTarget();
 }
 nextChallengeTarget(){
  const c=this.challenge;if(!c)return;c.delivered.clear();c.wrong.clear();c.dwell=0;
  if(c.mode==='formation'){c.shape=['ring','line','grid','wedge'][c.stage%4];c.instruction='Form a '+c.shape.toUpperCase()+' with all drones; settle above 80% cohesion for 3 seconds.';return;}
  const present=BEACON_PALETTE.filter(color=>this.drones.some(d=>d.color===color.id));c.color=present[c.stage%present.length].id;
  const a=c.stage*2.399963;this.fleet.objective=[Math.sin(a)*58,24,Math.cos(a)*38-28];c.instruction='Send the '+beaconColor(c.color).name.toUpperCase()+' group into the target beacon. Other colors lose points.';
 }
 finishRound(){const c=this.challenge;if(!c||c.roundOver)return;c.roundOver=true;this.running=false;const result={player:c.players[c.turn]||'Pilot 1',score:c.score,mode:c.mode};c.scores.push(result);c.finished=c.mode!=='party'||c.turn>=c.players.length-1;this.lastResult={...result,scores:c.scores.map(s=>({...s})),finished:c.finished};this.notice=c.finished?'Exercise complete. Start another round when ready.':'Round complete. Pass the controls to the next pilot.';}
 nextPlayer(){
  const c=this.challenge;if(!c?.roundOver||c.finished)return false;const scores=c.scores,players=c.players,turn=c.turn+1,seed=c.seed;
  this.load(seed);this.startChallenge('party',players);Object.assign(this.challenge,{scores,turn});this.notice=players[turn]+' / your turn.';return true;
 }
 metrics(){const active=this.drones.filter(d=>d.mode==='FLY'),error=active.reduce((n,d)=>n+length(d.pos.map((v,j)=>v-d.target[j])),0)/Math.max(1,active.length);return {active:active.length,total:this.drones.length,cohesion:active.length?Math.round(clamp(100-error*2,0,100)):0,battery:Math.round(this.drones.reduce((n,d)=>n+d.battery,0)/this.drones.length),checks:this.checks,separations:this.separations,clamps:this.targetClamps};}
 step(dt){
  if(!this.running)return;dt=clamp(dt,0,.05);this.elapsed+=dt;this.checks=0;this.separations=0;this.targetClamps=0;
  for(const cue of advanceSwarmProgram(this.program,dt))for(const d of this.drones)if(cue.ids.includes(d.id)&&this.program.activeIds.includes(d.id)&&d.mode==='FLY'){if(cue.assignment==='standby')this.recall([d.id]);else d.order=cue.assignment;}
  const buckets=new Map(),cell=p=>p.map(v=>Math.floor(v/6));
  for(const d of this.drones){if(d.mode==='QUEUED'&&this.elapsed>=d.delay)d.mode=d.order==='standby'?'DOCK':'FLY';if(['FLY','RETURN'].includes(d.mode)){const key=cell(d.pos).join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(d);}}
  const orderPeers={};for(const d of this.drones)if(d.mode==='FLY'){if(!orderPeers[d.order])orderPeers[d.order]=[];orderPeers[d.order].push(d);}
  const accelerations=new Map();
  for(const d of this.drones){
   d.attitude={pitch:0,roll:0};if(!['FLY','RETURN'].includes(d.mode))continue;
   if(!this.fleet.options.unlimited){d.battery=Math.max(0,d.battery-dt*(.06+length(d.velocity)*.003));if(d.battery<12&&d.mode==='FLY'){d.mode='RETURN';d.override='Battery reserve return';this.program.activeIds=this.program.activeIds.filter(id=>id!==d.id);}}
   let target=[...d.home];d.override=d.mode==='RETURN'?d.override:'';
   if(d.mode==='RETURN'){if(Math.hypot(d.pos[0]-d.home[0],d.pos[2]-d.home[2])>3)target[1]=Math.max(12,d.pos[1]);}
   else{
    const peers=orderPeers[d.order]||[d],index=peers.indexOf(d),n=peers.length,angle=index/n*Math.PI*2,objective=this.fleet.objective;
    if(d.order==='operator'||d.order==='bike'){const cx=d.order==='bike'?12:0;target=[cx+Math.cos(angle+this.elapsed*.15)*14,14+Math.floor(index/12)*4,62+Math.sin(angle+this.elapsed*.15)*14];}
    else if(d.order==='scout')target=[objective[0]+Math.cos(angle)*Math.min(7,Math.sqrt(n)),objective[1]+(index%3-1)*2,objective[2]+Math.sin(angle)*Math.min(7,Math.sqrt(n))];
    else if(d.order==='relay'){const f=(index+1)/(n+1);target=[objective[0]*f,20+(index%3)*3,62+(objective[2]-62)*f];}
    else if(d.order==='hold'||!this.program.ids.includes(d.id))target=[...d.target];
    else{const sample=sampleSwarmProgram(this.program,d.id,{reducedMotion:this.fleet.options.reducedMotion});target=sample.target;d.attitude=sample.attitude;if(sample.error)d.override=sample.error;
     const anchor=sample.opts.origin==='objective'?objective:sample.opts.origin==='operator'?[0,0,62]:sample.opts.origin==='bike'?[12,0,62]:[0,0,0];target=target.map((v,j)=>v+anchor[j]);}
   }
   if(d.mode==='FLY'&&d.order!=='formation'&&this.program.enabled&&this.program.activeIds.includes(d.id)){const sample=sampleSwarmProgram(this.program,d.id,{reducedMotion:this.fleet.options.reducedMotion});target=target.map((v,j)=>v+clamp(sample.field[j],-4,4));if(sample.error)d.override=sample.error;}
   const bounded=[clamp(target[0],-210,210),clamp(target[1],d.mode==='RETURN'?1:6,88),clamp(target[2],-210,210)];if(target.some((v,j)=>v!==bounded[j])){this.targetClamps++;d.override='Field boundary / altitude limit';}d.target=bounded;
   const acceleration=bounded.map((v,j)=>(v-d.pos[j])*1.7-d.velocity[j]*2.6),[cx,cy,cz]=cell(d.pos);
   for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(let z=cz-1;z<=cz+1;z++)for(const peer of buckets.get([x,y,z].join(','))||[]){
    if(peer===d)continue;this.checks++;const delta=d.pos.map((v,j)=>v-peer.pos[j]),dist=length(delta),safe=1.7+(COMMANDER_TYPES[d.type].span+COMMANDER_TYPES[peer.type].span)*.5;
    if(dist<safe){this.separations++;if(dist<.001){delta[0]=d.id<peer.id?1:-1;delta[1]=0;delta[2]=0;}for(let j=0;j<3;j++)acceleration[j]+=delta[j]/Math.max(.001,dist)*(safe-dist)*12;d.override='Spacing correction';}
   }
   if(this.fleet.options.obstacles)for(const box of COMMANDER_OBSTACLES)if(d.pos[1]<box.h+5&&Math.abs(d.pos[0]-box.x)<box.w+7&&Math.abs(d.pos[2]-box.z)<box.d+7){acceleration[1]+=28;d.override='Obstacle clearance';}
   const mag=length(acceleration);if(mag>28)for(let j=0;j<3;j++)acceleration[j]*=28/mag;accelerations.set(d,acceleration);
  }
  for(const [d,acceleration]of accelerations){
   const old=[...d.pos];d.velocity=d.velocity.map((v,j)=>v+acceleration[j]*dt);const speed=length(d.velocity),max=COMMANDER_TYPES[d.type].speed;if(speed>max)d.velocity=d.velocity.map(v=>v*max/speed);
   d.pos=d.pos.map((v,j)=>v+d.velocity[j]*dt);d.pos[0]=clamp(d.pos[0],-220,220);d.pos[2]=clamp(d.pos[2],-220,220);d.pos[1]=clamp(d.pos[1],1,90);
   if(this.fleet.options.obstacles)for(const box of COMMANDER_OBSTACLES)if(d.pos[1]<box.h+1&&Math.abs(d.pos[0]-box.x)<box.w+1&&Math.abs(d.pos[2]-box.z)<box.d+1){d.pos=[old[0],Math.max(old[1],d.pos[1]),old[2]];d.velocity[0]=d.velocity[2]=0;d.velocity[1]=Math.max(3,d.velocity[1]);d.override='Obstacle clearance';}
   if(speed>.2)d.yaw=Math.atan2(d.velocity[0],d.velocity[2]);
   if(d.mode==='RETURN'&&length(d.pos.map((v,j)=>v-d.home[j]))<.6&&speed<1){d.mode='DOCK';d.pos=[...d.home];d.velocity=[0,0,0];d.override='';}
  }
  const c=this.challenge;if(!c||c.roundOver)return;c.elapsed+=dt;
  if(c.mode==='formation'){
   const metrics=this.metrics(),allShape=this.program.ids.length===this.drones.length&&this.drones.every(d=>sampleSwarmProgram(this.program,d.id).opts.shape===c.shape);
   c.dwell=allShape&&metrics.active===metrics.total&&metrics.cohesion>=80?c.dwell+dt:0;
   if(c.dwell>=3){c.score+=100+Math.max(0,Math.round(60-c.elapsed/4));c.stage++;if(c.stage===4)this.finishRound();else this.nextChallengeTarget();}
  }else{
   const target=this.fleet.objective;
   for(const d of this.drones)if(d.mode==='FLY'&&length(d.pos.map((v,j)=>v-target[j]))<11){if(d.color===c.color&&!c.delivered.has(d.id)){c.delivered.add(d.id);c.score+=10;}else if(d.color!==c.color&&!c.wrong.has(d.id)){c.wrong.add(d.id);c.score=Math.max(0,c.score-2);}}
   const needed=Math.max(1,Math.ceil(this.drones.filter(d=>d.color===c.color).length*.8));if(c.delivered.size>=needed){c.score+=25;c.stage++;this.nextChallengeTarget();}
  }
  if(c.elapsed>=(c.mode==='formation'?180:90))this.finishRound();
 }
}
