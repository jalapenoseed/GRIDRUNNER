const AIRFRAMES=Object.freeze({
 scout:{label:'Scout',color:'#70d6ff',speed:2.45,size:4},
 cargo:{label:'Cargo',color:'#ffd27a',speed:1.05,size:7},
 engineer:{label:'Utility',color:'#9ee6a5',speed:1.35,size:6},
 relay:{label:'Relay',color:'#c0a9ff',speed:1.7,size:5}
});
export const SWARM_FORMATIONS=Object.freeze(['wedge','line','trail','grid','orbit','double-orbit','scatter']);
const DEFAULT_COUNTS=Object.freeze({scout:4,cargo:0,engineer:0,relay:2});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nextFrame=globalThis.requestAnimationFrame?.bind(globalThis)||(()=>0),cancelFrame=globalThis.cancelAnimationFrame?.bind(globalThis)||(()=>{});
const label=s=>s.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase());

export function buildSwarmDrones(counts=DEFAULT_COUNTS,origin={x:130,y:275}){
 const drones=[];let id=0;
 for(const [type,spec] of Object.entries(AIRFRAMES))for(let i=0;i<Math.floor(clamp(Number(counts[type])||0,0,12));i++)drones.push({id:id++,type,speed:spec.speed,size:spec.size,x:origin.x+(id%5)*4,y:origin.y+Math.floor(id/5)*4,vx:0,vy:0,active:false});
 return drones;
}

export function createSwarmState(overrides={}){
 const state={width:720,height:390,origin:{x:130,y:275},objective:{x:545,y:155},editMode:'objective',running:true,launched:false,time:0,formation:'wedge',pattern:'hold',spacing:48,intelligence:'cooperative',team:'mesh',originLogic:'fixed',mission:'survey',counts:{...DEFAULT_COUNTS},drones:[]};
 Object.assign(state,overrides);state.origin={...state.origin};state.objective={...state.objective};state.counts={...DEFAULT_COUNTS,...state.counts};state.drones=overrides.drones||buildSwarmDrones(state.counts,state.origin);return state;
}

function activeOrigin(state){
 const active=state.drones.filter(d=>d.active);
 if(state.originLogic==='objective')return state.objective;
 if(state.originLogic==='leader'&&active[0])return active[0];
 if(state.originLogic==='centroid'&&active.length)return {x:active.reduce((n,d)=>n+d.x,0)/active.length,y:active.reduce((n,d)=>n+d.y,0)/active.length};
 return state.origin;
}

export function formationSlots(state,seconds=state.time){
 const n=state.drones.length,s=Number(state.spacing),slots=[],origin=activeOrigin(state),goal=state.objective;
 for(let i=0;i<n;i++){
  let x=0,y=0;
  if(state.formation==='wedge'){if(i){const row=Math.ceil(i/2),side=i%2?1:-1;x=-row*s*.72;y=side*row*s*.46;}}
  if(state.formation==='line')y=(i-(n-1)/2)*s*.48;
  if(state.formation==='trail')x=-i*s*.52;
  if(state.formation==='grid'){const cols=Math.max(3,Math.ceil(Math.sqrt(n)));x=-Math.floor(i/cols)*s*.64;y=((i%cols)-(Math.min(cols,n)-1)/2)*s*.56;}
  if(state.formation==='orbit'){const a=i/Math.max(1,n)*Math.PI*2;x=Math.cos(a)*s*2;y=Math.sin(a)*s*1.35;}
  if(state.formation==='double-orbit'){const ring=i%2?1.35:2.25,a=i/Math.max(1,n)*Math.PI*4;x=Math.cos(a)*s*ring;y=Math.sin(a)*s*ring*.72;}
  if(state.formation==='scatter'){const a=i*2.399963,r=s*(.65+Math.sqrt(i+1)*.5);x=Math.cos(a)*r;y=Math.sin(a)*r*.72;}
  if(state.pattern==='orbit'){const a=seconds*.38,nx=x*Math.cos(a)-y*Math.sin(a);y=x*Math.sin(a)+y*Math.cos(a);x=nx;}
  if(state.pattern==='weave')y+=Math.sin(seconds*1.8+i*.8)*s*.28;
  if(state.pattern==='pulse'){const p=.78+.22*(1+Math.sin(seconds*2))/2;x*=p;y*=p;}
  if(state.pattern==='search'){x+=((i%3)-1)*s*.32;y+=Math.sin(seconds*1.1+i)*s*.52;}
  let cx=goal.x,cy=goal.y;
  if(state.mission==='escort'){cx=(origin.x+goal.x)/2;cy=(origin.y+goal.y)/2;}
  if(state.mission==='relay'){const t=n<2?1:i/(n-1);slots.push({x:origin.x+(goal.x-origin.x)*t,y:origin.y+(goal.y-origin.y)*t});continue;}
  if(state.mission==='perimeter'){const a=i/Math.max(1,n)*Math.PI*2;slots.push({x:goal.x+Math.cos(a)*s*2.5,y:goal.y+Math.sin(a)*s*1.65});continue;}
  if(state.mission==='intercept'){cx=goal.x+Math.cos(seconds*.45)*s;cy=goal.y+Math.sin(seconds*.45)*s*.65;}
  if(state.mission==='harvest'&&state.drones[i].type==='engineer'){slots.push({x:goal.x+(i%2?38:-38),y:goal.y-52});continue;}
  slots.push({x:cx+x,y:cy+y});
 }
 return slots;
}

export function stepSwarm(state,dt){
 if(!state.running||!state.launched)return state;state.time+=dt;const targets=formationSlots(state),active=state.drones.filter(d=>d.active);
 for(const [i,d] of state.drones.entries()){
  if(!d.active)continue;const target=targets[i]||state.objective;let ax=(target.x-d.x)*.012,ay=(target.y-d.y)*.012;
  const neighbors=state.intelligence==='distributed'?active.filter(o=>o!==d).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y)).slice(0,3):active;
  if(state.intelligence!=='scripted')for(const o of neighbors){if(o===d)continue;const dx=d.x-o.x,dy=d.y-o.y,dd=dx*dx+dy*dy;if(dd>1&&dd<1600){const force=state.intelligence==='reactive'?7:5;ax+=dx/dd*force;ay+=dy/dd*force;if(state.intelligence!=='reactive'){ax+=(o.vx-d.vx)*.002;ay+=(o.vy-d.vy)*.002;}}}
  if(state.team==='leader'&&active[0]!==d){ax+=(active[0].x-d.x)*.0007;ay+=(active[0].y-d.y)*.0007;}
  if(state.team==='pairs'){const j=i%2?i-1:i+1,b=state.drones[j];if(b?.active){ax+=(b.x-d.x)*.0014;ay+=(b.y-d.y)*.0014;}}
  if(state.team==='nearest'){let near=null,best=Infinity;for(const o of active){if(o===d)continue;const q=(d.x-o.x)**2+(d.y-o.y)**2;if(q<best){best=q;near=o;}}if(near){ax+=(near.x-d.x)*.0008;ay+=(near.y-d.y)*.0008;}}
  if(state.team==='mesh'&&active.length>1){const cx=active.reduce((v,o)=>v+o.x,0)/active.length,cy=active.reduce((v,o)=>v+o.y,0)/active.length;ax+=(cx-d.x)*.00045;ay+=(cy-d.y)*.00045;}
  d.vx=(d.vx+ax*dt*60)*.93;d.vy=(d.vy+ay*dt*60)*.93;const vmax=d.speed*2.55,vm=Math.hypot(d.vx,d.vy);if(vm>vmax){d.vx=d.vx/vm*vmax;d.vy=d.vy/vm*vmax;}d.x=clamp(d.x+d.vx*dt*60,8,state.width-8);d.y=clamp(d.y+d.vy*dt*60,8,state.height-8);
 }
 return state;
}

export function swarmCohesion(state){
 const active=state.drones.filter(d=>d.active);if(!active.length)return null;const slots=formationSlots(state);let error=0;for(const d of active)error+=Math.hypot(d.x-slots[d.id].x,d.y-slots[d.id].y);return clamp(Math.round(100-error/active.length/2),0,100);
}

const option=(value,text=value)=>`<option value="${value}">${label(text)}</option>`;
export function renderSwarmCommand(){return `<div class="panelTop"><div><div class="eyebrow">BLACKLINE / DISTRIBUTED FLIGHT LAB</div><h2>2D Formation Lab</h2></div><button data-back>← Back</button></div><p class="lead">Program a virtual fleet, move its home point and objective, then watch the team solve the order.</p><section class="swarm-command" data-swarm-root>
 <div class="swarm-stage"><div class="swarm-toolbar"><button class="primary" data-swarm-action="launch">LAUNCH ALL</button><button data-swarm-action="pause">PAUSE</button><button data-swarm-action="reset">RESET</button><span data-swarm-status>PROGRAM READY</span></div><canvas data-swarm-canvas aria-label="Interactive drone swarm command field"></canvas><div class="swarm-metrics"><span><small>ACTIVE</small><b data-swarm-active>0 / 6</b></span><span><small>FORMATION</small><b data-swarm-formation>Wedge</b></span><span><small>COHESION</small><b data-swarm-cohesion>—</b></span><span><small>MISSION</small><b data-swarm-mission>Survey</b></span></div></div>
 <aside class="swarm-program"><details open><summary>Formation program</summary><label>Formation<select data-swarm-setting="formation">${SWARM_FORMATIONS.map(v=>option(v)).join('')}</select></label><label>Pattern<select data-swarm-setting="pattern">${['hold','orbit','weave','pulse','search'].map(v=>option(v)).join('')}</select></label><label>Spacing <output data-swarm-spacing>48 m</output><input data-swarm-setting="spacing" type="range" min="24" max="90" value="48"></label></details>
 <details><summary>Swarm intelligence</summary><label>Object intelligence<select data-swarm-setting="intelligence">${['scripted','reactive','cooperative','distributed'].map(v=>option(v)).join('')}</select></label><label>Teammate logic<select data-swarm-setting="team">${[['leader','leader + wingmen'],['pairs','locked pairs'],['nearest','nearest neighbor'],['mesh','mesh network']].map(([v,t])=>option(v,t)).join('')}</select></label><label>Origin logic<select data-swarm-setting="originLogic">${[['fixed','fixed home point'],['leader','swarm leader'],['centroid','swarm centroid'],['objective','objective relative']].map(([v,t])=>option(v,t)).join('')}</select></label></details>
 <details><summary>Mission & points</summary><label>Objective<select data-swarm-setting="mission">${[['survey','survey area'],['escort','escort asset'],['relay','build relay mesh'],['perimeter','guard perimeter'],['intercept','intercept contact'],['harvest','energy harvest']].map(([v,t])=>option(v,t)).join('')}</select></label><div class="swarm-point-mode"><button data-swarm-point="objective" aria-pressed="true">EDIT OBJECTIVE</button><button data-swarm-point="origin" aria-pressed="false">EDIT ORIGIN</button></div><p>Tap the field to place the selected point.</p></details>
 <details><summary>Virtual fleet</summary><div class="swarm-counts">${Object.entries(AIRFRAMES).map(([id,s])=>`<label><i style="--swarm-color:${s.color}"></i>${s.label}<input type="number" min="0" max="12" value="${DEFAULT_COUNTS[id]}" data-swarm-count="${id}"></label>`).join('')}</div><p>Training copies only. Expedition aircraft, charge, hull and tasks are untouched.</p></details></aside>
</section>`;}

let cleanupActive=()=>{};
export function unmountSwarmCommand(){cleanupActive();cleanupActive=()=>{};}
export function mountSwarmCommand(scope=document){
 unmountSwarmCommand();const root=scope.querySelector?.('[data-swarm-root]');if(!root)return null;const canvas=root.querySelector('[data-swarm-canvas]'),ctx=canvas.getContext('2d'),state=createSwarmState();let raf=0,last=performance.now(),dead=false;
 const resize=()=>{const box=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);const width=Math.max(300,box.width||720),height=360,sx=width/state.width,sy=height/state.height;for(const p of [state.origin,state.objective,...state.drones]){p.x*=sx;p.y*=sy;}state.width=width;state.height=height;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
 const targets=()=>formationSlots(state);const draw=()=>{ctx.clearRect(0,0,state.width,state.height);ctx.strokeStyle='#88a5aa1c';ctx.lineWidth=1;for(let x=0;x<state.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.height);ctx.stroke();}for(let y=0;y<state.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.width,y);ctx.stroke();}ctx.setLineDash([6,7]);ctx.strokeStyle='#9db6b850';ctx.beginPath();ctx.moveTo(state.origin.x,state.origin.y);ctx.lineTo(state.objective.x,state.objective.y);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#58dce6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(state.objective.x,state.objective.y,20,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(state.objective.x,state.objective.y,6,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#e6eee6bb';ctx.beginPath();ctx.moveTo(state.origin.x-12,state.origin.y);ctx.lineTo(state.origin.x+12,state.origin.y);ctx.moveTo(state.origin.x,state.origin.y-12);ctx.lineTo(state.origin.x,state.origin.y+12);ctx.stroke();ctx.fillStyle='#b6c5c533';for(const p of targets()){ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}for(const d of state.drones){ctx.globalAlpha=d.active?1:.25;ctx.fillStyle=AIRFRAMES[d.type].color;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.atan2(d.vy,d.vx));ctx.beginPath();ctx.moveTo(d.size+4,0);ctx.lineTo(-d.size,-d.size*.72);ctx.lineTo(-d.size*.35,0);ctx.lineTo(-d.size,d.size*.72);ctx.closePath();ctx.fill();ctx.restore();}ctx.globalAlpha=1;};
 const metrics=()=>{const active=state.drones.filter(d=>d.active).length;root.querySelector('[data-swarm-active]').textContent=`${active} / ${state.drones.length}`;root.querySelector('[data-swarm-formation]').textContent=label(state.formation);root.querySelector('[data-swarm-mission]').textContent=label(state.mission);const c=swarmCohesion(state);root.querySelector('[data-swarm-cohesion]').textContent=c==null?'—':c+'%';root.querySelector('[data-swarm-spacing]').textContent=state.spacing+' m';};
 const loop=now=>{if(dead)return;const dt=Math.min(.033,(now-last)/1000);last=now;stepSwarm(state,dt);draw();metrics();raf=nextFrame(loop);};resize();raf=nextFrame(loop);
 const saveProgram=()=>{try{localStorage.setItem('gridrunner.swarm.command.v1',JSON.stringify({formation:state.formation,pattern:state.pattern,spacing:state.spacing,intelligence:state.intelligence,team:state.team,originLogic:state.originLogic,mission:state.mission,counts:state.counts}));}catch{}};
 try{const saved=JSON.parse(localStorage.getItem('gridrunner.swarm.command.v1')||'null');if(saved&&typeof saved==='object'){
  for(const el of root.querySelectorAll('select[data-swarm-setting]')){const key=el.dataset.swarmSetting;if([...el.options].some(o=>o.value===saved[key]))state[key]=saved[key];}
  if(Number.isFinite(saved.spacing))state.spacing=clamp(saved.spacing,24,90);
  for(const key of Object.keys(AIRFRAMES))if(Number.isFinite(saved.counts?.[key]))state.counts[key]=Math.floor(clamp(saved.counts[key],0,12));
  state.drones=buildSwarmDrones(state.counts,state.origin);
 }}catch{}
 for(const el of root.querySelectorAll('[data-swarm-setting]'))el.value=state[el.dataset.swarmSetting];
 for(const el of root.querySelectorAll('[data-swarm-count]'))el.value=state.counts[el.dataset.swarmCount];
 if(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){state.running=false;root.querySelector('[data-swarm-action="pause"]').textContent='RESUME';}
 root.addEventListener('input',e=>{const k=e.target.dataset.swarmSetting;if(k){state[k]=k==='spacing'?Number(e.target.value):e.target.value;saveProgram();metrics();}const type=e.target.dataset.swarmCount;if(type){state.counts[type]=Math.floor(clamp(Number(e.target.value)||0,0,12));state.drones=buildSwarmDrones(state.counts,state.origin);state.launched=false;saveProgram();metrics();}});
 root.addEventListener('click',e=>{const action=e.target.closest('[data-swarm-action]')?.dataset.swarmAction;if(action==='launch'){state.launched=true;state.running=true;state.drones.forEach((d,i)=>{d.active=true;d.x=state.origin.x+(i%5)*4;d.y=state.origin.y+Math.floor(i/5)*4;d.vx=d.vy=0;});root.querySelector('[data-swarm-action="launch"]').textContent='REDEPLOY ALL';root.querySelector('[data-swarm-action="pause"]').textContent='PAUSE';root.querySelector('[data-swarm-status]').textContent='PROGRAM RUNNING';}if(action==='pause'){state.running=!state.running;e.target.textContent=state.running?'PAUSE':'RESUME';root.querySelector('[data-swarm-status]').textContent=state.running?'PROGRAM RUNNING':'PROGRAM HELD';}if(action==='reset'){Object.assign(state,{origin:{x:state.width*.18,y:state.height*.7},objective:{x:state.width*.76,y:state.height*.4},launched:false,running:true,time:0});state.drones=buildSwarmDrones(state.counts,state.origin);root.querySelector('[data-swarm-action="launch"]').textContent='LAUNCH ALL';root.querySelector('[data-swarm-action="pause"]').textContent='PAUSE';root.querySelector('[data-swarm-status]').textContent='PROGRAM READY';}const point=e.target.closest('[data-swarm-point]')?.dataset.swarmPoint;if(point){state.editMode=point;root.querySelectorAll('[data-swarm-point]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.swarmPoint===point)));}});
 canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left)/r.width*state.width,y:(e.clientY-r.top)/r.height*state.height};state[state.editMode]=p;});window.addEventListener('resize',resize);cleanupActive=()=>{dead=true;cancelFrame(raf);window.removeEventListener('resize',resize);};return state;
}
