// Conservative axis-aligned shells matched to the rendered airframe spans.
export function droneHull(type='scout',payloadKg=0){const sizes={scout:[.3,.18,.3],relay:[.38,.22,.38],engineer:[.4,.25,.4],cargo:[1,.55,1]};const h=[...(sizes[type]||sizes.scout)];if(payloadKg>0)h[1]+=.15;return h;}
export function validSolid(b){return b&&[b.x,b.z,b.w,b.d,b.minY??0,b.maxY??12].every(Number.isFinite)&&b.w>0&&b.d>0&&b.w<10000&&b.d<10000&&Math.abs(b.x)<100000&&Math.abs(b.z)<100000&&(b.maxY??12)>(b.minY??0);}
export function blocksRider(b){return b.rider!==false&&b.surface!=='rideable'&&b.surface!=='soft';}
export function hullIntersectsSegment(a,b,box,h=[0,0,0]){
 let entry=0,exit=1;const min=[box.x-box.w-h[0],(box.minY??0)-h[1],box.z-box.d-h[2]],max=[box.x+box.w+h[0],(box.maxY??12)+h[1],box.z+box.d+h[2]];
 for(let i=0;i<3;i++){const delta=b[i]-a[i];if(Math.abs(delta)<1e-9){if(a[i]<=min[i]||a[i]>=max[i])return false;continue;}let near=(min[i]-a[i])/delta,far=(max[i]-a[i])/delta;if(near>far)[near,far]=[far,near];entry=Math.max(entry,near);exit=Math.min(exit,far);if(entry>=exit)return false;}return exit>0&&entry<1;
}
export function terrainSweep(a,b,terrain,clearance=.65){const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.25));for(let i=1;i<=steps;i++){const t=i/steps,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;if(a[1]+(b[1]-a[1])*t<terrain(x,z)+clearance)return true;}return false;}
export function riderGradeAllowed(terrain,p,dx,dz,mode='foot'){
 const distance=Math.hypot(dx,dz);if(distance<.001)return true;
 const look=Math.max(.8,distance),rise=Math.abs(terrain(p.x+dx/distance*look,p.z+dz/distance*look)-terrain(p.x,p.z));
 return rise<=(mode==='bike'?.28:.35)||rise/look<=(mode==='bike'?.58:1.05);
}
export function moveRiderFallback(index,p,dx,dz,{mode='foot',yaw=0}={}){
 const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),h=mode==='bike'?[.38*c+.85*s,.65,.85*c+.38*s]:[.12,.82,.12],base=[p.x,p.y-.55,p.z];let point=[...base];
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));
 for(let i=0;i<steps;i++)for(const axis of [0,2]){const next=[...point];next[axis]+=(axis===0?dx:dz)/steps;const boxes=index.querySegment(point,next,Math.max(h[0],h[2]));if(!boxes.some(b=>blocksRider(b)&&hullIntersectsSegment(point,next,b,h)))point=next;}
 return {x:point[0],z:point[2],hit:Math.hypot(point[0]-p.x-dx,point[2]-p.z-dz)>.005};
}
