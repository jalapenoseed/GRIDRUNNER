import * as T from './three.js';
import {beaconColor} from './beacon-palette.js';
import {MAX_COMMANDER_DRONES} from './fleet-commander-core.js';

// Optical point-spread function: a tiny emitter, faint glare and a brief white
// identification strobe. Nearby lamps also illuminate actual scene surfaces.
export class AircraftBeacons{
 constructor(root){
  this.colors=new Map();const geometry=new T.BufferGeometry();
  for(const [name,size]of [['position',3],['color',3],['power',1],['phase',1]])geometry.setAttribute(name,new T.BufferAttribute(new Float32Array(MAX_COMMANDER_DRONES*size),size).setUsage(T.DynamicDrawUsage));
  geometry.setDrawRange(0,0);
  const material=new T.ShaderMaterial({uniforms:{size:{value:9},time:{value:0},steady:{value:0}},vertexShader:`
   attribute vec3 color; attribute float power; attribute float phase;
   uniform float size; uniform float time; uniform float steady;
   varying vec3 lampColor; varying float lampPower; varying float flash;
   void main(){vec4 view=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*view;
    float distanceToEye=max(1.0,-view.z);
    gl_PointSize=clamp(size*(0.72+14.0/distanceToEye),3.0,28.0);
    lampColor=color;lampPower=power*clamp(1.2-distanceToEye/1500.0,0.2,1.0);
    float cycle=fract(time*0.7+phase);flash=(1.0-steady)*(1.0-smoothstep(0.015,0.07,cycle));
   }`,fragmentShader:`
   varying vec3 lampColor; varying float lampPower; varying float flash;
   void main(){vec2 p=(gl_PointCoord-0.5)*2.0;float r2=dot(p,p);
    float core=exp(-r2*115.0),halo=exp(-r2*11.0)*0.16;
    float rays=exp(-min(p.x*p.x,p.y*p.y)*850.0)*exp(-r2*14.0)*0.045;
    float light=(core+halo+rays)*lampPower;if(light<0.002)discard;
    vec3 color=mix(lampColor,vec3(1.0,0.98,0.91),clamp(core*0.82+flash*0.5,0.0,1.0));
    gl_FragColor=vec4(color*(1.0+flash*0.65),light);
   }`,transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,toneMapped:false});
  this.points=new T.Points(geometry,material);this.points.frustumCulled=false;this.points.renderOrder=2;root.add(this.points);
  this.lights=Array.from({length:8},()=>{const light=new T.PointLight(0xffffff,0,9,2);light.castShadow=false;root.add(light);return light;});
 }
 update(drones,camera,{time=0,size=9,pixelRatio=1,reducedMotion=false}={}){
  const a=this.points.geometry.attributes,closest=[];
  for(let i=0;i<drones.length;i++){
   const d=drones[i],pos=d.pos,active=!['DOCK','QUEUED'].includes(d.mode);a.position.setXYZ(i,pos[0],pos[1]+.22,pos[2]);
   if(!this.colors.has(d.color))this.colors.set(d.color,new T.Color(beaconColor(d.color).hex));const color=this.colors.get(d.color);
   a.color.setXYZ(i,color.r,color.g,color.b);a.power.setX(i,active?1:.16);a.phase.setX(i,(Number(d.id.slice(6))*.618034)%1);
   const distance=(pos[0]-camera.position.x)**2+(pos[1]-camera.position.y)**2+(pos[2]-camera.position.z)**2;
   if(active&&distance<35*35){closest.push({d,color,distance});}
  }
  for(const attr of Object.values(a))attr.needsUpdate=true;this.points.geometry.setDrawRange(0,drones.length);
  Object.assign(this.points.material.uniforms.size,{value:size*pixelRatio});this.points.material.uniforms.time.value=time;this.points.material.uniforms.steady.value=reducedMotion?1:0;
  closest.sort((a,b)=>a.distance-b.distance);this.lights.forEach((light,i)=>{const item=closest[i];light.intensity=item?5:0;if(item){light.color.copy(item.color);light.position.fromArray(item.d.pos);light.position.y+=.22;}});
 }
 clear(){this.points.geometry.setDrawRange(0,0);this.lights.forEach(light=>light.intensity=0);}
 dispose(){this.points.geometry.dispose();this.points.material.dispose();this.points.removeFromParent();this.lights.forEach(light=>{light.dispose();light.removeFromParent();});}
}
