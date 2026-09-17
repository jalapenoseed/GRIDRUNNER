import * as T from './three.js';
import {instanceParts,fillInstances} from './fleet-commander-renderer.js';
import {beaconColor} from './beacon-palette.js';
export class InWorldCommanderVisuals{
 constructor(scene,fleet){this.fleet=fleet;this.root=new T.Group();this.root.name='Admin fleet / world-space test aircraft';scene.add(this.root);this.proxy={};this.detail={};this.colors=new Map();
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(300),3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(300),3).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
  this.beacons=new T.Points(geometry,new T.ShaderMaterial({uniforms:{size:{value:10}},vertexShader:'attribute vec3 color; varying vec3 beaconColor; uniform float size; void main(){beaconColor=color; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=size;}',fragmentShader:'varying vec3 beaconColor; void main(){float r=length(gl_PointCoord-vec2(0.5)); if(r>0.5)discard; gl_FragColor=vec4(mix(beaconColor,vec3(1.0),1.0-smoothstep(0.08,0.22,r)),1.0-smoothstep(0.40,0.5,r));}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false}));this.beacons.frustumCulled=false;this.beacons.renderOrder=2;this.root.add(this.beacons);
 }
 update(test,camera,{quality='HIGH',pixelRatio=1,reducedMotion=false}={}){
  this.root.visible=!!test.program;if(!this.root.visible)return;const drones=test.drones.filter(d=>!d.queued&&d.system.mode!=='DOCK').map(d=>({...d,pos:d.system.pos,yaw:d.system.yaw,attitude:{pitch:d.system.pitch+(reducedMotion||test.config.options.reducedMotion?0:d.attitude.pitch),roll:d.system.roll+(reducedMotion||test.config.options.reducedMotion?0:d.attitude.roll)}}));
  for(const type of ['scout','relay','cargo','engineer']){const records=drones.filter(d=>d.type===type),reference=this.fleet.records[type];if(records.length){if(!this.proxy[type]){const proxy=reference.proxy.clone(true);proxy.parent=null;this.proxy[type]=instanceParts(proxy,this.root);}if(quality!=='LOW')this.fleet.load(type);if(reference.model&&!this.detail[type]){const model=reference.model.clone(true);model.parent=null;this.detail[type]=instanceParts(model,this.root);}}
   const near=[],far=[];for(const d of records)(quality!=='LOW'&&this.detail[type]&&camera.position.distanceTo(new T.Vector3(...d.pos))<36?near:far).push(d);if(this.proxy[type])fillInstances(this.proxy[type],far);if(this.detail[type])fillInstances(this.detail[type],near);
  }
  const attrs=this.beacons.geometry.attributes;drones.forEach((d,i)=>{attrs.position.setXYZ(i,d.pos[0],d.pos[1]+.4,d.pos[2]);if(!this.colors.has(d.color))this.colors.set(d.color,new T.Color(beaconColor(d.color).hex).convertLinearToSRGB());const color=this.colors.get(d.color);attrs.color.setXYZ(i,color.r,color.g,color.b);});attrs.position.needsUpdate=attrs.color.needsUpdate=true;this.beacons.geometry.setDrawRange(0,drones.length);this.beacons.material.uniforms.size.value=test.config.options.beaconSize*pixelRatio;
 }
 clear(){this.root.visible=false;for(const parts of [...Object.values(this.proxy),...Object.values(this.detail)])for(const part of parts)part.mesh.count=0;this.beacons.geometry.setDrawRange(0,0);}
}
