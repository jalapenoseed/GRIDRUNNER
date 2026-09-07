// Drone 2.0: renderer-independent vehicle simulation. Distances are world metres.
export const DRONE_CLASSES = Object.freeze({
 scout: {name:'Scout',speed:38,climb:12,acceleration:13,drag:2.6,range:420,scan:150,drain:.12,abilities:['scan','relay'],available:true},
 engineer: {name:'Engineering',speed:34,climb:10,acceleration:10,drag:2.8,range:340,scan:115,drain:.16,abilities:['scan','relay','perch','security'],available:true},
 cargo: {name:'Cargo',speed:26,climb:7,acceleration:7,drag:3,range:320,scan:80,drain:.2,abilities:['scan','transport'],available:false},
 interceptor: {name:'Interceptor',speed:48,climb:16,acceleration:19,drag:2.3,range:500,scan:130,drain:.22,abilities:['scan','intercept'],available:false}
});
export const COMMANDS=['DOCK','FOLLOW','HOLD','SCOUT AHEAD','ORBIT','RETURN HOME'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function createDrone(pos=[0,2,15]) {return {version:1,mode:'DOCK',pos:[...pos],velocity:[0,0,0],hp:100,signal:100,range:0,altitude:2,speed:0,travel:0,hold:[...pos],cooldown:0,linkLost:0,reason:'Docked',scanCooldown:0};}
export function migrateDrone(value,pos,manual=false){
 const d=createDrone(pos);
 if(!value){if(manual){d.mode='MANUAL';d.pos=[...pos];}return d;}
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000);
 if(value.version!==1||![...COMMANDS,'MANUAL','LANDED'].includes(value.mode)||!vec(value.pos)||!vec(value.velocity)||!vec(value.hold))throw Error('Invalid drone record');
 for(const k of ['hp','signal'])if(!Number.isFinite(value[k])||value[k]<0||value[k]>100)throw Error('Invalid drone telemetry');
 if(!Number.isFinite(value.travel)||value.travel<0||value.travel>1e10)throw Error('Invalid drone distance');
 for(const k of ['mode','pos','velocity','hold','hp','signal','travel'])d[k]=Array.isArray(value[k])?[...value[k]]:value[k];
 d.reason=d.mode==='DOCK'?'Docked':'Link restored';return d;
}
export function commandDrone(d,command,home,battery){
 if(![...COMMANDS,'MANUAL'].includes(command))return false;
 if(d.mode==='LANDED'&&distance(d.pos,home)>9)return false;
 if(!['DOCK','RETURN HOME'].includes(command)&&(battery<5||d.hp<10))return false;
 if(d.mode==='DOCK'||d.mode==='LANDED'){d.pos=[home[0],home[1]+3,home[2]];d.velocity=[0,0,0];}
 d.mode=command==='DOCK'?'RETURN HOME':command;d.hold=[...d.pos];d.linkLost=0;d.reason=command==='DOCK'?'Dock requested':command;return true;
}
export function obstruction(a,b,solids){
 // Slab intersection: bounded CPU cost, true 3D roofs rather than infinite walls.
 let count=0;
 for(const s of solids){if(s.drone===false)continue;let lo=0,hi=1;
  const min=[s.x-s.w,s.minY??0,s.z-s.d],max=[s.x+s.w,s.maxY??12,s.z+s.d];
  for(let axis=0;axis<3;axis++){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-8){if(a[axis]<min[axis]||a[axis]>max[axis]){hi=-1;break;}}else{const u=(min[axis]-a[axis])/delta,v=(max[axis]-a[axis])/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
  if(hi>=lo&&hi>0&&lo<1)count++;
 }return count;
}
export function updateDrone(d,dt,{home,yaw=0,input=[0,0,0],battery,type='scout',terrain=()=>0,solids=[],storm=false,jammed=false,difficulty=1,floorZ=-1600}){
 dt=clamp(dt,0,.05);const homeVelocity=d.lastHome?home.map((v,i)=>clamp((v-d.lastHome[i])/Math.max(dt,.001),-40,40)):[0,0,0];d.lastHome=[...home];const spec=DRONE_CLASSES[type]||DRONE_CLASSES.scout,events=[];d.cooldown=Math.max(0,d.cooldown-dt);d.scanCooldown=Math.max(0,d.scanCooldown-dt);
 if(d.mode==='DOCK'){d.pos=[...home];d.velocity=[0,0,0];d.speed=0;d.altitude=home[1]-terrain(home[0],home[2]);d.range=0;d.signal=100;return {battery,events};}
 d.range=distance(d.pos,home);d.altitude=d.pos[1]-terrain(d.pos[0],d.pos[2]);
 const blocked=obstruction(home,d.pos,solids),effectiveRange=spec.range*(storm?.62:1)*(jammed?.65:1);
 const desiredSignal=clamp(100-100*(d.range/effectiveRange)**1.65-blocked*24,0,100);d.signal+=(desiredSignal-d.signal)*(1-Math.exp(-dt*3));
 d.linkLost=d.signal<4?d.linkLost+dt:0;
 const reserve=4+d.range/spec.speed*spec.drain*2.8*difficulty;
 if(!['RETURN HOME','LANDED'].includes(d.mode)&&(battery<Math.max(10,reserve)||d.linkLost>1.2||d.hp<20)){
  d.mode='RETURN HOME';d.reason=battery<Math.max(10,reserve)?'Battery reserve':d.hp<20?'Hull damage':'Link lost';events.push('return');
 }
 if((battery<=0||d.hp<=0)&&d.mode!=='LANDED'){d.reason='Emergency landing';d.mode='LANDED';events.push('landing');}
 const auto=d.mode!=='MANUAL',target=[...d.pos];let desired=[0,0,0];
 if(d.mode==='MANUAL'){
  let [f,t,v]=input;const l=Math.max(1,Math.hypot(f,t));f/=l;t/=l;
  desired=[(-Math.sin(yaw)*f+Math.cos(yaw)*t)*spec.speed,v*spec.climb,(-Math.cos(yaw)*f-Math.sin(yaw)*t)*spec.speed];
 }else if(d.mode==='LANDED')desired=[0,d.altitude>.65?-2:0,0];
 else{
  if(d.mode==='HOLD')target.splice(0,3,...d.hold);
  else if(d.mode==='ORBIT'){const angle=d.travel*.035;target.splice(0,3,home[0]+Math.sin(angle)*14,home[1]+12,home[2]+Math.cos(angle)*14);}
  else if(d.mode==='FOLLOW'||d.mode==='SCOUT AHEAD'){const ahead=d.mode==='SCOUT AHEAD'?65:7;target.splice(0,3,home[0]-Math.sin(yaw)*ahead+Math.cos(yaw)*4,home[1]+(d.mode==='SCOUT AHEAD'?22:7),home[2]-Math.cos(yaw)*ahead-Math.sin(yaw)*4);}
  else {target.splice(0,3,...home);if(Math.hypot(d.pos[0]-home[0],d.pos[2]-home[2])>5)target[1]=Math.max(home[1]+10,d.pos[1]);}
  // Climb above an obstructing volume before proceeding. Never teleport across it.
  if(obstruction(d.pos,target,solids)){let top=12;for(const b of solids)if(b.drone!==false&&obstruction(d.pos,target,[b]))top=Math.max(top,b.maxY??12);target[1]=Math.max(target[1],top+5);if(d.pos[1]<top+3){target[0]=d.pos[0];target[2]=d.pos[2];}}
  const delta=target.map((v,i)=>v-d.pos[i]),horizontal=Math.hypot(delta[0],delta[2]),speed=Math.min(spec.speed,horizontal*1.3,Math.sqrt(2*spec.acceleration*horizontal)*.72);
  desired=[horizontal?delta[0]/horizontal*speed:0,clamp(delta[1]*1.8,-spec.climb,spec.climb),horizontal?delta[2]/horizontal*speed:0];if(['FOLLOW','SCOUT AHEAD','RETURN HOME'].includes(d.mode)){desired[0]+=homeVelocity[0];desired[2]+=homeVelocity[2];const factor=Math.min(1,spec.speed/Math.max(.001,Math.hypot(desired[0],desired[2])));desired[0]*=factor;desired[2]*=factor;}
 }
 const old=[...d.pos];
 for(let i=0;i<3;i++){const accel=i===1?spec.acceleration*.85:spec.acceleration;const change=clamp((desired[i]-d.velocity[i])*spec.drag,-accel,accel);d.velocity[i]+=change*dt;}
 let proposed=d.pos.map((v,i)=>v+d.velocity[i]*dt);proposed[0]=clamp(proposed[0],-600,600);proposed[2]=clamp(proposed[2],floorZ,230);
 const ground=terrain(proposed[0],proposed[2])+.65;
 const collision=proposed[1]<ground||proposed[1]>200||solids.some(b=>b.drone!==false&&Math.abs(proposed[0]-b.x)<b.w+.4&&Math.abs(proposed[2]-b.z)<b.d+.4&&proposed[1]<(b.maxY??12)+.4&&proposed[1]>(b.minY??0)-.4);
 if(collision){const impact=Math.hypot(...d.velocity);if(d.cooldown===0&&impact>3){d.hp=clamp(d.hp-(impact-3)*1.2,0,100);d.cooldown=.8;events.push('damage');}d.velocity=d.velocity.map(v=>v*-.12);proposed=[...d.pos];proposed[1]=clamp(proposed[1],ground,200);}d.pos=proposed;
 d.speed=distance(d.pos,old)/Math.max(.001,dt);d.travel+=distance(d.pos,old);d.altitude=d.pos[1]-terrain(d.pos[0],d.pos[2]);
 if(d.mode==='RETURN HOME'&&distance(d.pos,home)<1.3&&Math.hypot(...d.velocity.map((v,i)=>v-homeVelocity[i]))<4){d.mode='DOCK';d.pos=[...home];d.velocity=[0,0,0];d.reason='Docked';events.push('dock');}
 const airborne=d.mode!=='DOCK'&&(d.mode!=='LANDED'||d.altitude>.8);
 battery=Math.max(0,battery-(airborne?spec.drain*(1+d.speed/spec.speed*.55+Math.max(0,d.velocity[1])*.04)*(storm?1.35:1)*difficulty*dt:0));
 return {battery,events,auto};
}
export function scanEntities(d,entities,{type='scout',solids=[],elapsed=0,leg=1}){
 if(d.scanCooldown>0)return [];d.scanCooldown=5;const radius=DRONE_CLASSES[type].scan;
 return entities.filter(e=>distance(d.pos,[e.x,e.y,e.z])<=radius&&obstruction(d.pos,[e.x,e.y+1,e.z],solids)<2).map(e=>({...e,at:elapsed,leg}));
}
