import {STARTER_AIRCRAFT,aircraftCode} from './fleet-manifest.js';
import {commandAircraft,hasLiveTask} from './fleet-tasks.js';
import {createSwarmProgram,validateSwarmProgram,applySwarmProgramTarget} from './swarm-program.js';

export const SWARM_ORDERS={formation:'Formation',operator:'Guard operator',bike:'Guard bike',scout:'Scout area',relay:'Relay link',standby:'Stand by'};
export const SWARM_PATTERNS=['Hold','Orbit','Weave','Pulse','Search'];
export function createSwarmOps(){return {version:1,origin:'operator',pattern:'Hold',spacing:14,objective:null,fixed:null,contacts:0,program:createSwarmProgram()};}
export function createCamo(){return {version:1,deployed:false,position:null,yaw:0};}
const point=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&Math.abs(p[0])<=600&&p[1]>=0&&p[1]<=200&&p[2]>=-4720&&p[2]<=230;
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function validateSwarmOps(raw){
 if(raw===undefined)return createSwarmOps();
 if(!raw||raw.version!==1||!['operator','bike','fixed','objective'].includes(raw.origin)||!SWARM_PATTERNS.includes(raw.pattern)||!Number.isFinite(raw.spacing)||raw.spacing<8||raw.spacing>30||raw.objective!==null&&!point(raw.objective)||raw.fixed!==null&&!point(raw.fixed)||!Number.isSafeInteger(raw.contacts)||raw.contacts<0)throw Error('Invalid swarm program');
 return {...createSwarmOps(),...raw,program:validateSwarmProgram(raw.program)};
}
export function validateCamo(raw){
 if(raw===undefined)return createCamo();
 if(!raw||raw.version!==1||typeof raw.deployed!=='boolean'||raw.position!==null&&!point(raw.position)||raw.deployed&&!raw.position||!Number.isFinite(raw.yaw)||Math.abs(raw.yaw)>Math.PI*2)throw Error('Invalid field cover');
 return {...createCamo(),...raw};
}
export function coverActive(camo,operator,bike){
 return !!(camo?.deployed&&camo.position&&Math.hypot(operator[0]-camo.position[0],operator[2]-camo.position[2])<4&&Math.hypot(bike[0]-camo.position[0],bike[2]-camo.position[2])<4);
}
export function deployCover(camo,{operator,bike,speed=0,generator='off',yaw=0}){
 if(camo.deployed){camo.deployed=false;return {ok:true,reason:'Camouflage cloth packed.'};}
 if(Math.abs(speed)>.5||Math.hypot(operator[0]-bike[0],operator[2]-bike[2])>4)return {ok:false,reason:'Stop beside the bike to spread the camouflage cloth.'};
 if(generator==='fuel')return {ok:false,reason:'Switch off the fuel generator before covering the rig.'};
 camo.deployed=true;camo.position=[bike[0],Math.max(0,bike[1]-2),bike[2]];camo.yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
 return {ok:true,reason:'Field cover deployed. Stay beside the parked bike while your drones work.'};
}
export function assignSwarmOrder(record,order,context){
 if(!Object.hasOwn(SWARM_ORDERS,order))return {ok:false,reason:'Choose a valid assignment.'};
 if(hasLiveTask(record))return {ok:false,reason:'Finish or cancel this aircraft’s current job first.'};
 if(record.system.mode==='MANUAL')return {ok:false,reason:'Leave this aircraft’s FPV view before assigning it.'};
 if(order==='standby'){
  if(record.system.mode!=='DOCK'&&!commandAircraft(record,'RETURN HOME',context.home,context.solids))return {ok:false,reason:'Recover the landed aircraft first.'};
  record.swarmOrder=null;return {ok:true,reason:'Stand by / returning to bike.'};
 }
 if(['RETURN HOME','LANDED','PERCHED','RELEASE'].includes(record.system.mode)||record.battery<20||record.system.hp<30)return {ok:false,reason:'Dock, recharge and repair this aircraft before assigning it.'};
 if(order==='relay'&&record.type!=='relay')return {ok:false,reason:'Relay link requires a Relay airframe.'};
 if(record.system.mode!=='DOCK'&&!commandAircraft(record,'FOLLOW',context.home,context.solids))return {ok:false,reason:'Aircraft unavailable.'};
 record.swarmOrder=order;return {ok:true,reason:SWARM_ORDERS[order]+' assigned.'};
}
export function splitStarterOrders(squad,context){
 const plan={scout:'operator','scout-02':'bike','scout-03':'scout','scout-04':'scout',relay:'relay','relay-02':'relay'};
 return STARTER_AIRCRAFT.map(id=>({id,...assignSwarmOrder(squad[id],plan[id],context)}));
}
export function swarmOrigin(program,{operator,bike}){
 return program.origin==='bike'?bike:program.origin==='fixed'?(program.fixed||bike):program.origin==='objective'?(program.objective||operator):operator;
}
// Assignment targets are offsets passed into the regular flight controller.
// Physics, obstacle avoidance, finite batteries and emergency returns still own motion.
export function swarmOffset(record,program,{operator,bike,yaw=0,elapsed=0,squad,slot,terrain=()=>0,floor=-1600,reducedMotion=false}){
 record.showAttitude={pitch:0,roll:0};record.programStatus='';
 const order=record.swarmOrder;if(!order||hasLiveTask(record)||!['FOLLOW','ORBIT'].includes(record.system.mode))return null;
 const peers=Object.values(squad).filter(r=>r.swarmOrder===order),index=Math.max(0,peers.indexOf(record)),n=Math.max(1,peers.length),spacing=program.spacing;
 const base=swarmOrigin(program,{operator,bike}),objective=program.objective||[base[0]-Math.sin(yaw)*85,base[1],base[2]-Math.cos(yaw)*85];
 let target;
 if(order==='operator'||order==='bike'){
  const center=order==='bike'?bike:operator,angle=elapsed*.22+index*Math.PI*2/n;
  target=[center[0]+Math.sin(angle)*10,center[1]+6+index*3,center[2]+Math.cos(angle)*10];
 }else if(order==='relay'){
  const t=(index+1)/(n+1);target=[bike[0]+(objective[0]-bike[0])*t,bike[1]+19+index*5,bike[2]+(objective[2]-bike[2])*t];
 }else if(order==='scout'){
  const t=elapsed*.12+index*Math.PI,targetRadius=spacing*1.6;
  target=[objective[0]+Math.sin(t)*targetRadius,objective[1]+14+index*5,objective[2]+Math.sin(t*.5)*targetRadius];
 }else{
  let [x,y,z]=slot.map(v=>v*spacing/14);const t=elapsed*.24;
  if(program.pattern==='Orbit'){const a=x*Math.cos(t)-z*Math.sin(t);z=x*Math.sin(t)+z*Math.cos(t);x=a;}
  if(program.pattern==='Weave')x+=Math.sin(t*3+index)*spacing*.4;
  if(program.pattern==='Pulse'){const scale=1+Math.sin(t*2)*.25;x*=scale;z*=scale;}
  if(program.pattern==='Search'){x+=Math.sin(t)*spacing*2;z+=Math.sin(t*.5)*spacing;}
  target=[base[0]+x,base[1]+y,base[2]+z];
 }
 const id=Object.keys(squad).find(key=>squad[key]===record),authored=applySwarmProgramTarget(program.program,{id,order,assignmentTarget:target,operator,bike,objective:program.objective,fixed:program.fixed,squad,reducedMotion});
 target=authored.target;record.showAttitude=authored.attitude;record.programStatus=authored.error;
 const before=[...target];target[0]=Math.max(-550,Math.min(550,target[0]));target[2]=Math.max(floor+10,Math.min(210,target[2]));target[1]=Math.max(terrain(target[0],target[2])+5,Math.min(175,target[1]));
 if(before.some((v,i)=>v!==target[i]))record.programStatus='Terrain / sector clearance overrides target';
 return target.map((v,i)=>v-operator[i]);
}
export function nearbyGuards(squad,position){return Object.values(squad).filter(r=>['operator','bike'].includes(r.swarmOrder)&&['FOLLOW','ORBIT'].includes(r.system.mode)&&r.battery>=10&&r.system.hp>=20&&r.system.signal>8&&distance(r.system.pos,position)<30);}
export function guardDamageScale(squad,position){return Math.max(.55,1-nearbyGuards(squad,position).length*.2);}
export function airborneRelays(squad){return Object.values(squad).filter(r=>r.type==='relay'&&r.swarmOrder==='relay'&&['FOLLOW','ORBIT'].includes(r.system.mode)&&r.battery>=10&&r.system.hp>=20&&r.system.signal>8).map(r=>({id:r.id,pos:r.system.pos,battery:r.battery,hp:r.system.hp}));}

export function renderSwarmOps({state:s,started=false,available=()=>true,notice='',covered=false}={}){
 const p=s.swarmOps||createSwarmOps(),sq=s.squad||{};
 return `<div class="swarmOps"><div class="panelTop"><div><div class="eyebrow">BLACKLINE / LIVE FLEET</div><h2>Swarm Command</h2></div><button data-back>← Back</button></div><p class="lead">Your workshop-built cluster: four Scouts, two Relays, one rider.</p>
 <p>Guard your body and bike while other aircraft scout. Orders take effect when you resume the world.</p><button class="primary" data-nav="swarmProgram">PROGRAM SWARM · WORDS / DRAW / MATH</button><button data-nav="fleetCommander">FLEET COMMANDER · INDEPENDENT ARENA / 100 DRONES</button>
 ${!started?'<button class="primary" data-swarm-start>PLAY SWARM START</button><p>Start a new expedition with the six-drone kit ready to fly. Continue an existing save from the main menu to add it to that expedition.</p>':`<div class="commandGrid"><button class="primary" data-swarm-split>PROTECT + SCOUT</button><button data-swarm-resume>RESUME FIELD RUN →</button><button data-swarm-recall>RECALL CLUSTER</button></div><p class="hint">Protect + Scout: Scout 01 guards you, Scout 02 guards the bike, Scouts 03–04 survey, and both Relays maintain airborne links. Active jobs and FPV pilots keep control.</p>`}
 <p role="status" class="swarmNotice">${notice}</p>
 <div class="swarmOpsGrid"><section><h3>Operations map</h3><canvas id="swarmOpsMap" width="680" height="360" tabindex="0" aria-label="Swarm map. Click to set the scout objective; arrow keys move it by ten metres."></canvas><p class="hint">Cyan: Scouts · magenta: Relays · white: operator · gold: bike · ring: objective. Click or tap to place a scout objective. Keyboard: arrow keys.</p><button data-swarm-ahead>OBJECTIVE 85 m AHEAD</button>
 <div class="swarmProgram"><label>Formation<select data-swarm-config="formation">${['WEDGE','TRAIL','LINE','ORBIT','PROTECTIVE RING','SEARCH GRID','OVERWATCH'].map(v=>`<option ${s.fleetFormation===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Pattern<select data-swarm-config="pattern">${SWARM_PATTERNS.map(v=>`<option ${p.pattern===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Formation origin<select data-swarm-config="origin">${[['operator','Operator'],['bike','Bike'],['fixed','Fixed field point'],['objective','Objective']].map(([v,l])=>`<option value="${v}" ${p.origin===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Spacing <output>${p.spacing} m</output><input aria-label="Formation spacing" data-swarm-config="spacing" type="range" min="8" max="30" value="${p.spacing}"></label></div><button data-swarm-form ${!started?'disabled':''}>FORM UP AVAILABLE DRONES</button><p class="hint">Formation and pattern apply to aircraft assigned “Formation”. Guards, scouts and links keep their separate jobs.</p>
 </section><section><h3>Aircraft assignments</h3><div class="swarmRoster">${STARTER_AIRCRAFT.map(id=>{const r=sq[id],locked=!started||!available(id);return `<article><div><b>${aircraftCode(id)}</b><small>${r?`${Math.round(r.battery)}% · ${r.system.mode}`:'Ready at the rig'}</small></div><label><span class="sr-only">${aircraftCode(id)} assignment</span><select aria-label="${aircraftCode(id)} assignment" data-swarm-order="${id}" ${locked?'disabled':''}>${Object.entries(SWARM_ORDERS).filter(([k])=>k!=='relay'||r?.type==='relay'||id.startsWith('relay')).map(([k,v])=>`<option value="${k}" ${(r?.swarmOrder||'standby')===k?'selected':''}>${v}</option>`).join('')}</select></label><button data-swarm-fpv="${id}" ${locked?'disabled':''}>FLY</button></article>`;}).join('')}</div>
 <article class="fieldCover"><h3>Operator field cover</h3><b>${covered?'CONCEALED · VISUAL COVER':s.camo?.deployed?'CLOTH DEPLOYED · OUTSIDE COVER':'CLOTH PACKED'}</b><p>A patched camouflage cloth from your original build kit. Spread it beside the stopped bike, then fly from cover.</p><button data-swarm-cover ${!started?'disabled':''}>${s.camo?.deployed?'PACK CAMOUFLAGE CLOTH':'DEPLOY CAMOUFLAGE CLOTH'}</button><p class="hint">Visual detection range is reduced by 60% while you stay within 4 m. Moving the bike packs it. It does not block shots, close observers or thermal sensors.</p></article></section></div>
 <details><summary>The kit you built before the road</summary><p>Before the signal returned, you rebuilt four survey Scouts and two signal Relays on the same workshop bench. The bike carries their charging rack, patched field cloth and the controller you wired yourself. Mara’s salvage box supplies replacement parts for a fleet that is already yours.</p></details><button data-nav="swarmLab">OPEN 2D FORMATION LAB</button></div>`;
}
