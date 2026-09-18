// Original game implementation of Reynolds-style local steering.
// References and simulator tradeoffs: SWARM-SENSORS-v7.26.md.
// This is bounded game steering, not an ORCA solver or a real-aircraft controller.
import {droneHull} from './collision-shapes.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const length=v=>Math.hypot(...v);
const formation=m=>['FOLLOW','ORBIT','SCOUT AHEAD'].includes(m);
export function swarmSnapshot(squad){
 return Object.entries(squad).sort(([a],[b])=>a.localeCompare(b)).filter(([,r])=>r.system.mode!=='DOCK').map(([id,r])=>({id,pos:[...r.system.pos],velocity:[...r.system.velocity],mode:r.system.mode,radius:length(droneHull(r.type||id)),task:!!(r.task?.state==='RUNNING')}));
}
export function launchCorridorClear(peers,home,type){
 const radius=length(droneHull(type));
 return peers.every(p=>{const closest=[home[0],clamp(p.pos[1],home[1],home[1]+4),home[2]];return length(p.pos.map((v,i)=>v-closest[i]))>radius+p.radius+1.2;});
}
export function swarmVelocity(d,desired,{id,type=id,peers=[],taskTarget=null,speed=30,climb=10,social=true}={}){
 // Precision approaches, returns and pilot inputs retain full authority.
 if(!formation(d.mode)||taskTarget||!peers.length)return desired;
 const radius=length(droneHull(type)),avoid=[0,0,0],align=[0,0,0],center=[0,0,0];let count=0,danger=0;
 for(const p of peers){
  if(p.id===id)continue;
  const dx=d.pos[0]-p.pos[0],dy=d.pos[1]-p.pos[1],dz=d.pos[2]-p.pos[2],distance=Math.hypot(dx,dy,dz);if(distance>65)continue;
  const rx=d.velocity[0]-p.velocity[0],ry=d.velocity[1]-p.velocity[1],rz=d.velocity[2]-p.velocity[2],vv=rx*rx+ry*ry+rz*rz,time=vv>.01?clamp(-(dx*rx+dy*ry+dz*rz)/vv,0,2.5):0;
  const miss=Math.hypot(dx+rx*time,dy+ry*time,dz+rz*time),safe=radius+p.radius+2.5;
  if(distance<safe*2||time>0&&miss<safe){
   const urgency=Math.max(clamp((safe*2-distance)/(safe*2),0,1),time>0&&miss<safe?(1-miss/safe)*(1-time/3.5):0);
   // Reciprocal passing, including the deterministic exact-overlap tie break.
   let sx=-rz,sz=rx,sideLength=Math.hypot(sx,sz);if(sideLength<.01){sx=id<p.id?-1:1;sz=0;sideLength=1;}
   const ax=distance>.01?dx/distance:sx/sideLength,ay=distance>.01?dy/distance:0,az=distance>.01?dz/distance:sz/sideLength;
   avoid[0]+=(ax*5+sx/sideLength*7)*urgency;avoid[1]+=ay*5*urgency;avoid[2]+=(az*5+sz/sideLength*7)*urgency;
   danger=Math.max(danger,urgency);
  }
  if(distance<32&&formation(p.mode)&&!p.task){count++;for(let i=0;i<3;i++){align[i]+=p.velocity[i];center[i]+=p.pos[i];}}

 }
 const out=desired.map((v,i)=>v*(1-danger*.65)+avoid[i]);
 // Small social terms smooth a moving formation without collapsing its slots.
 if(social&&count&&length(desired)>2)for(let i=0;i<3;i++)out[i]+=clamp((align[i]/count-d.velocity[i])*.08,-.6,.6)+clamp((center[i]/count-d.pos[i])*.015,-.35,.35);
 const horizontal=Math.hypot(out[0],out[2]),scale=Math.min(1,speed/Math.max(.001,horizontal));out[0]*=scale;out[2]*=scale;out[1]=clamp(out[1],-climb,climb);return out;
}
