// Both touch sticks and standard controllers use this renderer-free mapping.
// Mode 2 uses spring-centered lift: center = hover thrust, NOT a full RC sim.
const axis=v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
export function droneSticks({move=[0,0],look=[0,0],vertical=0}={}, {layout='mode2',flight='stabilized',sensitivity=1,invert=false}={}){
 const [lx,ly]=move.map(axis),[rx,ry]=look.map(axis),gain=Number.isFinite(sensitivity)?Math.max(.25,Math.min(2.5,sensitivity)):1,flip=invert?-1:1;
 if(layout==='classic')return {input:[-ly,lx,axis(vertical)],attitude:[-ry*gain*flip,-rx*gain,-lx],look:[-rx*gain,-ry*gain*flip]};
 const yaw=-lx*gain;
 return flight==='acro'
  ?{input:[0,0,-ly],attitude:[ry*gain*flip,yaw,-rx*gain],look:[0,0]}
  :{input:[-ry,rx,-ly],attitude:[0,0,0],look:[yaw,0]};
}

// One owner per stick; cancellation and menu entry must never leave thrust held.
export class TouchStick{
 constructor(element,knob,{enabled=()=>true,changed=()=>{}}={}){
  this.element=element;this.knob=knob;this.enabled=enabled;this.changed=changed;this.pointer=null;this.x=this.y=0;
  element.addEventListener('pointerdown',e=>{if(!this.enabled()||this.pointer!==null)return;e.preventDefault();this.pointer=e.pointerId;element.setPointerCapture?.(e.pointerId);this.update(e);});
  element.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){e.preventDefault();this.update(e);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===this.pointer)this.reset();});
 }
 update(e){const r=this.element.getBoundingClientRect(),radius=Math.max(1,r.width*.33);let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  const magnitude=Math.hypot(x,y),scale=magnitude>.12?(magnitude-.12)/(.88*magnitude):0;this.x=x*scale;this.y=y*scale;
  this.knob.style.transform=`translate(calc(-50% + ${x*radius}px),calc(-50% + ${y*radius}px))`;this.changed(this.x,this.y);
 }
 reset(){const pointer=this.pointer;this.pointer=null;this.x=this.y=0;this.knob.style.transform='translate(-50%,-50%)';if(pointer!==null&&this.element.hasPointerCapture?.(pointer))this.element.releasePointerCapture(pointer);this.changed(0,0);}
}
