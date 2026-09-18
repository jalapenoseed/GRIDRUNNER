import * as T from './three.js';
// Shared spatial strike data: origin, conductor hit, branching path, thunder cue.
export function lightningPath(start,end,seed=1){let n=seed>>>0;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};const points=[];for(let i=0;i<=24;i++){const t=i/24,w=Math.sin(t*Math.PI)*11;points.push(start.map((v,j)=>v+(end[j]-v)*t+(j===1?0:(random()-.5)*w)));}const segments=[];for(let i=1;i<points.length;i++)segments.push(...points[i-1],...points[i]);for(let b=0;b<4;b++){const i=6+b*4,from=points[i],to=[from[0]+(random()-.5)*22,from[1]-14-random()*18,from[2]+(random()-.5)*22];segments.push(...from,...to);}return segments;}
export class StormController{
 constructor(scene,audio){this.audio=audio;this.time=0;this.next=18;this.strike=null;this.pending=[];this.seed=739;this.events=[];this.root=new T.Group();this.root.name='Storm / branching electrical discharge';scene.add(this.root);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(28*6),3));this.bolt=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xd4e6ff,toneMapped:false,transparent:true,opacity:0}));this.bolt.frustumCulled=false;this.root.add(this.bolt);this.light=new T.PointLight(0xcbdfff,0,100,2);scene.add(this.light);}
 trigger(position,solids=[],{reducedMotion=false}={}){
  const candidates=(Array.isArray(solids)?solids:solids.solids||[]).filter(b=>/pole|tower|transform|electri|metal/i.test(b.kind||b.id||'')&&Math.hypot(b.x-position[0],b.z-position[2])<220);
  const target=candidates[this.seed%candidates.length],end=target?[target.x,target.maxY||12,target.z]:[position[0]+90+Math.sin(this.seed)*45,0,position[2]-100];
  const start=[end[0]+Math.sin(this.seed)*30,end[1]+130,end[2]-16],path=lightningPath(start,end,++this.seed);this.bolt.geometry.attributes.position.array.set(path);this.bolt.geometry.attributes.position.needsUpdate=true;this.light.position.fromArray(end).y+=4;this.strike={at:this.time,end,reducedMotion};
  const distance=Math.hypot(...position.map((v,i)=>v-end[i]));this.pending.push({at:this.time+Math.min(4,distance/170),distance,pan:Math.max(-1,Math.min(1,(end[0]-position[0])/100))});this.pending=this.pending.slice(-4);
  const event={id:this.seed,at:this.time,position:end,kind:target?'conductor':'ground',target:target?.id||null};this.events.push(event);this.events=this.events.slice(-8);return event;
 }
 update(dt,{weather,paused,position,solids,reducedMotion=false,enabled=true}){
  if(paused){this.light.intensity=0;this.bolt.material.opacity=0;return;}this.time+=Math.max(0,Math.min(.1,dt));
  if(enabled&&weather==='storm'&&this.time>=this.next){this.trigger(position,solids,{reducedMotion});this.next=this.time+18+(this.seed%17);}
  else if(weather!=='storm')this.next=Math.max(this.next,this.time+8);
  const age=this.strike?this.time-this.strike.at:99,flash=enabled&&!reducedMotion&&!this.strike?.reducedMotion&&age<.3?Math.exp(-age*14):0;
  this.bolt.material.opacity=flash;this.light.intensity=flash*380;for(const cue of this.pending)if(!cue.done&&cue.at<=this.time){cue.done=true;this.audio?.thunder?.(cue.distance,cue.pan);}this.pending=this.pending.filter(c=>!c.done);
 }
}
