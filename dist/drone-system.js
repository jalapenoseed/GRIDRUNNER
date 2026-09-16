// Drone 2.0: renderer-independent vehicle simulation. Distances are world metres.
import {validLineAnchor,lineBody,lineRelease} from './power-lines.js';
import {solidList,segmentCandidates} from './spatial-index.js';
export const DRONE_CLASSES = Object.freeze({
 scout: {name:'Scout',massKg:.95,payloadKg:.3,speed:48,climb:14,acceleration:18,drag:2.6,range:420,scan:150,drain:.12,abilities:['scan','relay'],available:true},
 engineer: {name:'UTILITY-01',massKg:3.4,payloadKg:2,speed:32,climb:10,acceleration:10,drag:2.8,range:340,scan:115,drain:.16,abilities:['scan','relay','perch','security'],available:true},
 cargo: {name:'CARGO-01',massKg:8.4,payloadKg:8,speed:26,climb:7,acceleration:7,drag:3,range:320,scan:80,drain:.2,abilities:['scan','transport'],available:true},
 relay: {name:'RELAY-01',massKg:1.25,payloadKg:.25,speed:44,climb:13,acceleration:16,drag:2.7,range:620,scan:180,drain:.14,abilities:['scan','relay'],available:true},
 interceptor: {name:'Interceptor',massKg:1.1,payloadKg:0,speed:52,climb:16,acceleration:19,drag:2.3,range:500,scan:130,drain:.22,abilities:['scan','intercept'],available:false}
});
export const COMMANDS=['DOCK','FOLLOW','HOLD','SCOUT AHEAD','ORBIT','RETURN HOME'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
// Gameplay tuning, not manufacturer specifications. Dry mass includes the
// aircraft's own battery. Payload is real attached cargo, never rider inventory.
export function dronePerformance(type='scout',payloadKg=0){
 const base=DRONE_CLASSES[type]||DRONE_CLASSES.scout;
 const payload=clamp(Number.isFinite(payloadKg)?payloadKg:0,0,base.payloadKg),massKg=base.massKg+payload,ratio=massKg/base.massKg;
 return {...base,dryMassKg:base.massKg,massKg,loadKg:payload,
  speed:base.speed/Math.sqrt(ratio),climb:base.climb/Math.sqrt(ratio),acceleration:base.acceleration/ratio,
  braking:base.acceleration*1.1/ratio,drag:base.drag/Math.sqrt(ratio),drain:base.drain*ratio**1.35,
  angularResponse:12/Math.sqrt(massKg),angularRate:2.1/massKg**.2,windResponse:1/Math.sqrt(massKg),loadRatio:ratio};
}
export function createDrone(pos=[0,2,15]) {return {version:1,mode:'DOCK',pos:[...pos],velocity:[0,0,0],pitch:0,yaw:0,roll:0,rates:[0,0,0],thrust:0,hp:100,signal:100,range:0,altitude:2,speed:0,travel:0,hold:[...pos],cooldown:0,linkLost:0,reason:'Docked',scanCooldown:0};}
export function migrateDrone(value,pos,manual=false){
 const d=createDrone(pos);
 if(!value){if(manual){d.mode='MANUAL';d.pos=[...pos];}return d;}
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000);
 if(value.version!==1||![...COMMANDS,'MANUAL','LANDED','RELAY','PERCHED','RELEASE'].includes(value.mode)||!vec(value.pos)||!vec(value.velocity)||!vec(value.hold))throw Error('Invalid drone record');
 for(const k of ['hp','signal'])if(!Number.isFinite(value[k])||value[k]<0||value[k]>100)throw Error('Invalid drone telemetry');
 if(!Number.isFinite(value.travel)||value.travel<0||value.travel>1e10)throw Error('Invalid drone distance');
 for(const k of ['mode','pos','velocity','hold','hp','signal','travel'])d[k]=Array.isArray(value[k])?[...value[k]]:value[k];
 for(const k of ['pitch','yaw','roll']){if(value[k]!==undefined&&(!Number.isFinite(value[k])||Math.abs(value[k])>Math.PI*2))throw Error('Invalid drone attitude');d[k]=value[k]??0;}
 if(value.rates!==undefined){if(!vec(value.rates)||value.rates.some(n=>Math.abs(n)>5))throw Error('Invalid drone rates');d.rates=[...value.rates];}
 if(['PERCHED','RELEASE'].includes(d.mode)){
  if(!validLineAnchor(value.perch)||d.mode==='PERCHED'&&distance(d.pos,lineBody(value.perch))>.22)throw Error('Invalid conductor attachment');
  d.perch={spanId:value.perch.spanId,u:value.perch.u};
  if(d.mode==='RELEASE'){if(!COMMANDS.includes(value.releaseOrder)||value.releaseOrder==='DOCK')throw Error('Invalid release order');d.releaseOrder=value.releaseOrder;}
 }else if(value.perch)throw Error('Unexpected conductor attachment');
 d.reason=d.mode==='DOCK'?'Docked':d.mode==='PERCHED'?'Perched; checking line state':'Link restored';return d;
}
export function commandDrone(d,command,home,battery,solids=[]){
 if(![...COMMANDS,'MANUAL'].includes(command))return false;
 if(d.mode==='LANDED'&&distance(d.pos,home)>9)return false;
 if(['PERCHED','RELEASE'].includes(d.mode)&&command==='MANUAL'){d.reason='Release the conductor before entering FPV';return false;}
 if(!['DOCK','RETURN HOME'].includes(command)&&(battery<5||d.hp<10))return false;
 if(d.perch&&['PERCHED','RELEASE'].includes(d.mode)){
  d.mode='RELEASE';d.releaseOrder=command==='DOCK'?'RETURN HOME':command;d.returnPlan=null;d.reason='RELEASE / clearing conductor';return true;
 }
 if(d.mode==='DOCK'||d.mode==='LANDED'){
  const clearance=solidList(solids).filter(b=>b.drone!==false).map(padded),launch=[...home];
  // A covered parking bay launches below its roof; deployment must never move
  // the aircraft through a solid canopy before physics gets its first frame.
  for(let rise=.15;rise<=3.001;rise+=.15){const next=[home[0],home[1]+rise,home[2]];if(obstruction(home,next,clearance))break;launch[1]=next[1];}
  d.pos=launch;d.velocity=[0,0,0];
 }
 d.returnPlan=null;d.mode=command==='DOCK'?'RETURN HOME':command;d.hold=[...d.pos];d.linkLost=0;d.reason=command==='DOCK'?'Dock requested':command;return true;
}
const padded=b=>({...b,w:b.w+.55,d:b.d+.55,minY:(b.minY??0)-.55,maxY:(b.maxY??12)+.55});
export function obstruction(a,b,solids){
 // Slab intersection: bounded CPU cost, true 3D roofs rather than infinite walls.
 let count=0;
 for(const s of segmentCandidates(solids,a,b)){if(s.drone===false)continue;let lo=0,hi=1;
  const min=[s.x-s.w,s.minY??0,s.z-s.d],max=[s.x+s.w,s.maxY??12,s.z+s.d];
  for(let axis=0;axis<3;axis++){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-8){if(a[axis]<min[axis]||a[axis]>max[axis]){hi=-1;break;}}else{const u=(min[axis]-a[axis])/delta,v=(max[axis]-a[axis])/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
  if(hi>=lo&&hi>0&&lo<1)count++;
 }return count;
}
function coveredReturnPlan(pos,home,solids){
 const list=solidList(solids),roofs=list.filter(b=>b.drone!==false&&(b.minY??0)>home[1]+.6),covers=roofs.filter(b=>Math.abs(home[0]-b.x)<b.w+.55&&Math.abs(home[2]-b.z)<b.d+.55);
 if(!covers.length)return null;
 const obstacles=list.filter(b=>b.drone!==false).map(padded),clear=(a,b)=>!obstruction(a,b,obstacles);
 // Manual flight may stop 0.4 m from a ceiling, inside the planner's larger
 // 0.55 m comfort margin. The first retreat uses the actual collision shell,
 // otherwise a safe descent is incorrectly classified as starting in a wall.
 const physical=list.filter(b=>b.drone!==false).map(b=>({...b,w:b.w+.4,d:b.d+.4,minY:(b.minY??0)-.4,maxY:(b.maxY??12)+.4}));
 const clearStart=(a,b)=>!obstruction(a,b,physical);
 if(clearStart(pos,home))return {home:[...home],points:[[...home]]};
 // Combine touching roof strips so the approach is outside the whole canopy,
 // not outside only the one strip directly above the docking point.
 const connected=new Set(covers);let growing=true;
 while(growing){growing=false;for(const b of roofs)if(!connected.has(b)&&[...connected].some(a=>Math.abs(a.x-b.x)<=a.w+b.w+.05&&Math.abs(a.z-b.z)<=a.d+b.d+.05&&(a.minY??0)<(b.maxY??12)+.5&&(b.minY??0)<(a.maxY??12)+.5)){connected.add(b);growing=true;}}
 const all=[...connected],left=Math.min(...all.map(b=>b.x-b.w))-1.6,right=Math.max(...all.map(b=>b.x+b.w))+1.6,back=Math.min(...all.map(b=>b.z-b.d))-1.6,front=Math.max(...all.map(b=>b.z+b.d))+1.6,top=Math.max(...all.map(b=>b.maxY??12)),cruise=Math.max(pos[1],top+2,home[1]+3),options=[];
 for(const door of [[left,home[1],home[2]],[right,home[1],home[2]],[home[0],home[1],back],[home[0],home[1],front]]){
  const high=[door[0],pos[1],door[2]],above=[door[0],cruise,door[2]];
  for(const points of [[high,door,[...home]],[[pos[0],cruise,pos[2]],above,door,[...home]]]){
   let from=pos,length=0,valid=true;for(const [i,p] of points.entries()){if(!(i===0?clearStart(from,p):clear(from,p))){valid=false;break;}length+=distance(from,p);from=p;}
   if(valid)options.push({points,length});
  }
 }
 options.sort((a,b)=>a.length-b.length);return {home:[...home],points:options[0]?.points||[],blocked:!options.length};
}
export function updateDrone(d,dt,{home,yaw=0,input=[0,0,0],attitude=[0,0,0],flight='stabilized',battery,type='scout',payloadKg=0,terrain=()=>0,solids=[],storm=false,jammed=false,difficulty=1,wind=0,elapsed=0,floorZ=-1600,formationOffset=null,taskTarget=null,relayNodes=[]}){
 dt=clamp(dt,0,.05);const homeVelocity=d.lastHome?home.map((v,i)=>clamp((v-d.lastHome[i])/Math.max(dt,.001),-40,40)):[0,0,0];d.lastHome=[...home];const spec=dronePerformance(type,payloadKg),events=[];d.cooldown=Math.max(0,d.cooldown-dt);d.scanCooldown=Math.max(0,d.scanCooldown-dt);
 if(d.mode==='DOCK'){d.pos=[...home];d.velocity=[0,0,0];d.rates=[0,0,0];d.pitch=d.roll=d.thrust=0;d.yaw=wrapAngle(yaw);d.speed=0;d.altitude=home[1]-terrain(home[0],home[2]);d.range=0;d.signal=100;d.linkVia=null;return {battery,events};}
 d.range=distance(d.pos,home);d.altitude=d.pos[1]-terrain(d.pos[0],d.pos[2]);
 const link=droneLink(d.pos,home,{type,solids,terrain,storm,jammed,relayNodes});
 d.linkVia=link.via;d.signal+=(link.signal-d.signal)*(1-Math.exp(-dt*3));
 d.linkLost=d.signal<4?d.linkLost+dt:0;
 const reserve=4+d.range/spec.speed*spec.drain*2.8*difficulty;
 if(!['RETURN HOME','LANDED'].includes(d.mode)&&!(d.mode==='RELEASE'&&d.releaseOrder==='RETURN HOME')&&(battery<Math.max(10,reserve)||d.linkLost>1.2||d.hp<20)){
  if(d.perch)commandDrone(d,'RETURN HOME',home,battery,solids);else d.mode='RETURN HOME';d.reason=battery<Math.max(10,reserve)?'Battery reserve':d.hp<20?'Hull damage':'Link lost';events.push('return');
 }
 if((battery<=0||d.hp<=0)&&d.mode!=='LANDED'){d.reason='Emergency landing';d.mode='LANDED';d.perch=null;d.releaseOrder=null;events.push('landing');}
 if(d.mode==='PERCHED'){
  if(!validLineAnchor(d.perch)||distance(d.pos,lineBody(d.perch))>.22){d.perch=null;d.mode='HOLD';d.hold=[...d.pos];d.reason='Conductor contact lost';}
  else{d.velocity=[0,0,0];d.rates=[0,0,0];d.pitch=d.roll=d.thrust=d.speed=0;return {battery:Math.max(0,battery-.006*difficulty*dt),events,auto:true};}
 }
 // A deliberate outpost is distinct from an emergency landing. Radio power is
 // finite; failsafes above can launch a physical return from this position.
 if(d.mode==='RELAY'){
  if(Math.abs(d.altitude-.65)>.2){d.mode='HOLD';d.hold=[...d.pos];d.reason='Outpost lost ground contact';}
  else{d.velocity=[0,0,0];d.rates=[0,0,0];d.pitch=d.roll=d.thrust=d.speed=0;return {battery:Math.max(0,battery-.012*difficulty*dt),events,auto:true};}
 }
 const auto=d.mode!=='MANUAL',target=[...d.pos];let desired=[0,0,0];
 if(d.mode==='MANUAL'){
  let [f,t,v]=input;const l=Math.max(1,Math.hypot(f,t));f/=l;t/=l;
  desired=[(-Math.sin(yaw)*f+Math.cos(yaw)*t)*spec.speed,v*spec.climb,(-Math.cos(yaw)*f-Math.sin(yaw)*t)*spec.speed];
 }else if(d.mode==='LANDED')desired=[0,d.altitude>.65?-2:0,0];
 else{
  if(d.mode==='RELEASE')target.splice(0,3,...lineRelease(d.perch));
  else if(d.mode==='HOLD')target.splice(0,3,...d.hold);
  else if(d.mode==='ORBIT'){if(formationOffset)target.splice(0,3,home[0]+formationOffset[0],home[1]+formationOffset[1],home[2]+formationOffset[2]);else{const angle=d.travel*.035;target.splice(0,3,home[0]+Math.sin(angle)*14,home[1]+12,home[2]+Math.cos(angle)*14);}}
  else if(d.mode==='SCOUT AHEAD'&&taskTarget)target.splice(0,3,...taskTarget);
  else if(d.mode==='FOLLOW'||d.mode==='SCOUT AHEAD'){const ahead=d.mode==='SCOUT AHEAD'?58:0,slot=formationOffset||[4,7,-7];target.splice(0,3,home[0]+slot[0]-Math.sin(yaw)*ahead,home[1]+slot[1]+(d.mode==='SCOUT AHEAD'?10:0),home[2]+slot[2]-Math.cos(yaw)*ahead);}
  else {
   if(!d.returnPlan||distance(d.returnPlan.home,home)>1)d.returnPlan=coveredReturnPlan(d.pos,home,solids)||{home:[...home],open:true};
   if(!d.returnPlan.open){
    const points=d.returnPlan.points;while(points.length>1&&distance(d.pos,points[0])<.45&&Math.hypot(...d.velocity)<1.1)points.shift();
    target.splice(0,3,...(points[0]||d.pos));if(d.returnPlan.blocked)d.reason='Return path blocked · move the bike into the open';
   }else{target.splice(0,3,...home);if(Math.hypot(d.pos[0]-home[0],d.pos[2]-home[2])>5)target[1]=Math.max(home[1]+10,d.pos[1]);}
  }
  // Climb above an obstructing volume before proceeding. Never teleport across it.
  if((d.mode!=='RETURN HOME'||d.returnPlan?.open)&&obstruction(d.pos,target,solids)){let top=12;for(const b of segmentCandidates(solids,d.pos,target))if(b.drone!==false&&obstruction(d.pos,target,[b]))top=Math.max(top,b.maxY??12);target[1]=Math.max(target[1],top+5);if(d.pos[1]<top+3){target[0]=d.pos[0];target[2]=d.pos[2];}}
  const delta=target.map((v,i)=>v-d.pos[i]),horizontal=Math.hypot(delta[0],delta[2]),speed=Math.min(spec.speed,horizontal*1.3,Math.sqrt(2*spec.acceleration*horizontal)*.72);
  desired=[horizontal?delta[0]/horizontal*speed:0,clamp(delta[1]*1.8,-spec.climb,spec.climb),horizontal?delta[2]/horizontal*speed:0];if(['FOLLOW','SCOUT AHEAD','RETURN HOME'].includes(d.mode)&&!(d.mode==='SCOUT AHEAD'&&taskTarget)){desired[0]+=homeVelocity[0];desired[2]+=homeVelocity[2];const factor=Math.min(1,spec.speed/Math.max(.001,Math.hypot(desired[0],desired[2])));desired[0]*=factor;desired[2]*=factor;}
 }
 // Ground outpost approaches brake well before contact; the normal cruise
 // controller can overshoot a near-ground target at full climb/descent speed.
 if(d.mode==='SCOUT AHEAD'&&taskTarget&&taskTarget[1]-terrain(taskTarget[0],taskTarget[2])<.85){
  desired[1]=Math.max(desired[1],-Math.min(2,Math.max(.15,(d.altitude-.65)*.7)));
 }
 const old=[...d.pos];
 if(!auto&&flight==='acro'){
  // Simplified vectored-thrust FPV model: nose drive, body-up rotor lift,
  // gravity, angular response and aerodynamic drag. Neutral sticks do not level.
  d.rates??=[0,0,0];
  for(let i=0;i<3;i++)d.rates[i]+=(clamp(attitude[i]||0,-1,1)*spec.angularRate-d.rates[i])*(1-Math.exp(-dt*spec.angularResponse));
  d.pitch=clamp(d.pitch+d.rates[0]*dt,-1.48,1.48);d.yaw=wrapAngle(d.yaw+d.rates[1]*dt);d.roll=wrapAngle(d.roll+d.rates[2]*dt);
  const {nose,up}=droneAxes(d),lift=9.81*clamp(1+input[2]*.95/spec.loadRatio,0,2),drive=input[0]*spec.acceleration;
  d.thrust=Math.hypot(lift,drive)/9.81;
  const airspeed=Math.hypot(...d.velocity),drag=.22+airspeed*.008;
  for(let i=0;i<3;i++)d.velocity[i]+=(nose[i]*drive+up[i]*lift-(i===1?9.81:0)-d.velocity[i]*drag)*dt;
 }else{
  const accelWorld=[0,0,0];
  for(let i=0;i<3;i++){const slowing=d.velocity[i]*(desired[i]-d.velocity[i])<0,limit=slowing?spec.braking:spec.acceleration,accel=i===1?limit*.85:limit;const change=clamp((desired[i]-d.velocity[i])*spec.drag,-accel,accel);d.velocity[i]+=change*dt;accelWorld[i]=change;}
  const sy=Math.sin(yaw),cy=Math.cos(yaw),a=1-Math.exp(-dt*6);
  d.yaw=wrapAngle(yaw);d.pitch+= (clamp((accelWorld[0]*sy+accelWorld[2]*cy)/18,-.4,.4)-d.pitch)*a;
  d.roll+=(clamp((-accelWorld[0]*cy+accelWorld[2]*sy)/18,-.4,.4)-d.roll)*a;d.rates=[0,0,0];d.thrust=d.mode==='LANDED'?0:1+Math.max(0,accelWorld[1])/9.81;
 }
 if(d.mode==='MANUAL'&&wind>0){d.velocity[0]+=Math.sin(elapsed*.7)*wind*dt*1.6*spec.windResponse;d.velocity[2]+=Math.cos(elapsed*.43)*wind*dt*.8*spec.windResponse;}
 const horizontalSpeed=Math.hypot(d.velocity[0],d.velocity[2]);if(horizontalSpeed>spec.speed){const scale=spec.speed/horizontalSpeed;d.velocity[0]*=scale;d.velocity[2]*=scale;}d.velocity[1]=clamp(d.velocity[1],-spec.climb,spec.climb);
 let proposed=d.pos.map((v,i)=>v+d.velocity[i]*dt);proposed[0]=clamp(proposed[0],-600,600);proposed[2]=clamp(proposed[2],floorZ,230);
 const ground=terrain(proposed[0],proposed[2])+.65;
 const collision=proposed[1]<ground||proposed[1]>200||(solids?.sweepDrone?.(old,proposed)??segmentCandidates(solids,old,proposed,.4).some(b=>b.drone!==false&&obstruction(old,proposed,[{...b,w:b.w+.4,d:b.d+.4,minY:(b.minY??0)-.4,maxY:(b.maxY??12)+.4}])>0));
 if(collision){const impact=Math.hypot(...d.velocity);if(d.cooldown===0&&impact>3){d.hp=clamp(d.hp-(impact-3)*1.2,0,100);d.cooldown=.8;events.push('damage');}d.velocity=d.velocity.map(v=>v*-.12);proposed=[...d.pos];proposed[1]=clamp(proposed[1],ground,200);}d.pos=proposed;
 d.speed=distance(d.pos,old)/Math.max(.001,dt);d.travel+=distance(d.pos,old);d.altitude=d.pos[1]-terrain(d.pos[0],d.pos[2]);
 if(d.mode==='RETURN HOME'&&distance(d.pos,home)<1.3&&Math.hypot(...d.velocity.map((v,i)=>v-homeVelocity[i]))<4){d.mode='DOCK';d.pos=[...home];d.velocity=[0,0,0];d.reason='Docked';events.push('dock');}
 if(d.mode==='RELEASE'&&distance(d.pos,lineRelease(d.perch))<.35&&d.speed<1){const order=d.releaseOrder;d.perch=null;d.releaseOrder=null;commandDrone(d,order,home,battery,solids);events.push('release');}
 const airborne=d.mode!=='DOCK'&&(d.mode!=='LANDED'||d.altitude>.8);
 battery=Math.max(0,battery-(airborne?spec.drain*(1+d.speed/spec.speed*.55+Math.max(0,d.velocity[1])*.04+Math.max(0,d.thrust-1)*.3)*(storm?1.35:1)*difficulty*dt:0));
 return {battery,events,auto};
}
// Each hop is constrained by its own radio range, terrain and solid occlusion.
// The weaker hop limits the route. Only game-owned active outposts are supplied.
export function radioQuality(a,b,range,{solids=[],terrain=()=>0,storm=false,jammed=false}={}){
 const effective=range*(storm?.62:1)*(jammed?.65:1);
 let blocked=obstruction(a,b,solids);
 const steps=Math.max(2,Math.ceil(distance(a,b)/8));
 for(let i=1;i<steps;i++){const t=i/steps,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;
  if(terrain(x,z)>a[1]+(b[1]-a[1])*t-.15){blocked+=4;break;}
 }
 return clamp(100-100*(distance(a,b)/effective)**1.65-blocked*24,0,100);
}
export function droneLink(pos,home,{type='scout',relayNodes=[],...environment}={}){
 const spec=DRONE_CLASSES[type]||DRONE_CLASSES.scout;
 let signal=radioQuality(home,pos,spec.range,environment),via=null;
 for(const node of relayNodes){
  if(type==='relay'||node.battery<10||node.hp<20)continue;
  const signalAtRelay=radioQuality(home,node.pos,DRONE_CLASSES.relay.range,environment);
  const hop=radioQuality(node.pos,pos,spec.range,environment),candidate=Math.min(signalAtRelay,hop)*.95;
  if(candidate>signal){signal=candidate;via=node.id;}
 }
 return {signal,via};
}
export const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function droneAxes({pitch=0,yaw=0,roll=0}){const sp=Math.sin(pitch),cp=Math.cos(pitch),sy=Math.sin(yaw),cy=Math.cos(yaw),sr=Math.sin(roll),cr=Math.cos(roll);return {nose:[-sy*cp,sp,-cy*cp],up:[-cy*sr+sy*sp*cr,cp*cr,sy*sr+cy*sp*cr]};}
export function scanEntities(d,entities,{type='scout',solids=[],elapsed=0,leg=1}){
 if(d.scanCooldown>0)return [];d.scanCooldown=5;const radius=DRONE_CLASSES[type].scan;
 return entities.filter(e=>distance(d.pos,[e.x,e.y,e.z])<=radius&&obstruction(d.pos,[e.x,e.y+1,e.z],solids)<2).map(e=>({...e,at:elapsed,leg}));
}
