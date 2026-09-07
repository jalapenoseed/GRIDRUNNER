import * as T from './three.js';
import {heightAt} from './visuals.js';
export const PRESETS={LOW:{ratio:1,clutter:.25,particles:64,shadows:0,lights:false},MEDIUM:{ratio:1.25,clutter:.5,particles:180,shadows:0,lights:true},HIGH:{ratio:1.7,clutter:.8,particles:380,shadows:1024,lights:true},ULTRA:{ratio:2,clutter:1,particles:650,shadows:2048,lights:true}};
const palettes={1:{top:0x354b60,horizon:0xd8aa83,fog:0xa79782,ground:0x4e4035,density:.0013},2:{top:0x283e4e,horizon:0x95b3ab,fog:0x809f96,ground:0x293f37,density:.00165},3:{top:0x121d34,horizon:0x877170,fog:0x555b66,ground:0x302e36,density:.0021}};
export class Immersion{
 constructor(scene,renderer,camera,sun,bike,drone){
  Object.assign(this,{scene,renderer,camera,sun,bike,drone});this.instances=[];this.phase=0;this.impact=0;this.lastSpeed=0;this.lean=0;this.pitch=0;this.lastLeg=0;
  // One sky draw; the dome follows the viewer so the horizon has no hard edge.
  this.sky=new T.Mesh(new T.SphereGeometry(2800,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color()},bottom:{value:new T.Color()}},vertexShader:'varying vec3 v; void main(){v=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 v;void main(){float h=clamp(normalize(v).y,0.,1.);vec3 c=mix(bottom,top,pow(h,.48));float sun=pow(max(0.,dot(normalize(v),normalize(vec3(-.5,.3,-.7)))),350.);gl_FragColor=vec4(c+vec3(1.,.65,.28)*sun*.5,1.);}'}));this.sky.frustumCulled=false;scene.add(this.sky);
  const lamp=new T.SpotLight(0xd5f5f0,75,100,.42,.7,1.4);this.headlight=lamp;scene.add(lamp,lamp.target);this.droneLight=new T.PointLight(0x61e4e2,9,24,1.6);scene.add(this.droneLight);
  const fill=new T.HemisphereLight(0x9db5c5,0x3e352e,.5);scene.add(fill);this.fill=fill;
  sun.castShadow=true;sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;sun.shadow.camera.near=1;sun.shadow.camera.far=500;sun.shadow.bias=-.0003;sun.shadow.normalBias=.12;scene.add(sun.target);
  scene.traverse(o=>{if(o.isMesh&&o!==this.sky){o.receiveShadow=true;if(o.geometry?.attributes.position?.count<25000)o.castShadow=true;}});
  // Reproducible instancing: vegetation, gravel, road wear and collapsed infrastructure.
  let seed=701;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const dummy=new T.Object3D();
  const batch=(geometry,color,count,place,roughness=.94)=>{const m=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({color,roughness}),count);for(let i=0;i<count;i++){place(dummy,i);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.instanceMatrix.needsUpdate=true;m.castShadow=false;m.receiveShadow=true;m.userData.maxCount=count;m.frustumCulled=false;scene.add(m);this.instances.push(m);return m;};
  for(let leg=1;leg<=3;leg++){
   const start=leg===1?170:leg===2?-1740:-3240,length=leg===1?1730:leg===2?1410:1450;
   batch(new T.IcosahedronGeometry(1,0),leg===2?0x526d54:leg===3?0x4a4748:0x82705a,leg===2?650:440,(o,i)=>{const x=(rand()<.5?-1:1)*(25+rand()*370),z=start-rand()*length;const size=.25+rand()*2;o.position.set(x,heightAt(x,z)+size*.25,z);o.scale.set(size*1.8,size*(leg===2?2:.6),size);o.rotation.set(rand(),rand()*6,rand()*.5);});
   batch(new T.ConeGeometry(1,3,5),leg===2?0x3c5848:0x6c7050,leg===2?340:140,(o)=>{const x=(rand()<.5?-1:1)*(32+rand()*240),z=start-rand()*length;const size=.3+rand()*(leg===2?3:1);o.position.set(x,heightAt(x,z)+size,z);o.scale.set(size,size,size);o.rotation.set(0,rand()*6,rand()*.1);});
   batch(new T.BoxGeometry(1,1,1),0x232d31,180,(o)=>{const z=start-rand()*length;o.position.set((rand()-.5)*18,.13,z);o.scale.set(.06+rand()*.15,.015,1+rand()*5);o.rotation.set(0,rand()*1.1,0);});
   batch(new T.BoxGeometry(1,1,1),leg===3?0x645550:0x6c6857,85,(o)=>{const z=start-rand()*length,x=(rand()<.5?-1:1)*(15+rand()*7);o.position.set(x,.3,z);o.scale.set(.3+rand()*.8,.2+rand()*.5,1+rand()*3);o.rotation.set(rand()*.4,rand()*6,rand()*.2);});
   batch(new T.ConeGeometry(1,1,6),leg===2?0x4a6059:0x625b59,60,(o)=>{const x=(rand()<.5?-1:1)*(650+rand()*450),z=start-rand()*length;o.position.set(x,10,z);o.scale.set(100+rand()*160,70+rand()*180,100+rand()*130);o.rotation.set(0,rand()*6,0);});
  }
  // Small emissive fixtures: cyan restored grid; amber damaged infrastructure.
  this.fixtures=[];for(const [x,z]of [[54,-94],[155,-733],[0,-1439],[45,-1810],[65,-2355],[0,-3020],[65,-3510],[50,-3980],[60,-4310],[0,-4590]]){
   const g=new T.Group();const post=new T.Mesh(new T.CylinderGeometry(.09,.13,5,6),new T.MeshStandardMaterial({color:0x48535a,metalness:.65,roughness:.6}));post.position.y=2.5;g.add(post);
   const lens=new T.Mesh(new T.BoxGeometry(.7,.13,.35),new T.MeshStandardMaterial({color:0xffc680,emissive:0xffa24a,emissiveIntensity:2}));lens.position.y=5;g.add(lens);g.position.set(x+7,0,z+9);scene.add(g);this.fixtures.push(lens);
  }
  const count=650,pos=new Float32Array(count*3);this.particles=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0xd7c5a0,size:.16,transparent:true,opacity:.45,depthWrite:false,sizeAttenuation:true}));this.particles.geometry.setAttribute('position',new T.BufferAttribute(pos,3));this.particles.frustumCulled=false;scene.add(this.particles);this.particleData=Array.from({length:count},()=>({x:(rand()-.5)*90,y:rand()*26,z:(rand()-.5)*90}));
  this.sparks=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0x8ffff0,size:.2,transparent:true,opacity:.8,depthWrite:false}));this.sparks.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(36*3),3));scene.add(this.sparks);
 }
 apply(settings,leg=1){
  const preset=PRESETS[settings.graphics]||PRESETS.MEDIUM;this.preset=preset;this.renderer.setPixelRatio(Math.min(devicePixelRatio,preset.ratio));this.renderer.shadowMap.enabled=!!preset.shadows;
  if(this.sun.shadow.mapSize.x!==(preset.shadows||512)){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.setScalar(preset.shadows||512);}
  for(const m of this.instances)m.count=Math.floor(m.userData.maxCount*preset.clutter);this.particles.geometry.setDrawRange(0,preset.particles);
  const p=palettes[leg],night=settings.weather==='night',storm=settings.weather==='sandstorm';this.sky.material.uniforms.top.value.setHex(night?0x040914:p.top);this.sky.material.uniforms.bottom.value.setHex(night?0x1b3445:storm?0x9b8162:p.horizon);
  this.scene.fog.color.setHex(night?0x122330:storm?0x9b8162:p.fog);this.scene.fog.density=storm?.008:p.density;this.scene.background.copy(this.scene.fog.color);this.fill.groundColor.setHex(p.ground);this.fill.intensity=night?.22:.5;this.lastLeg=leg;
 }
 feedback(amount=1){this.impact=Math.min(.11,this.impact+amount*.018);}
 update(dt,s,settings,keys,paused){
  if(this.lastLeg!==s.leg)this.apply(settings,s.leg);this.sky.position.copy(this.camera.position);if(!paused)this.phase+=dt;
  const level=Math.max(0,Math.min(1,settings.cameraMotion)),road=Math.abs(s.pos.x)<12,speed=Math.abs(s.speed),accel=paused?0:(s.speed-this.lastSpeed)/Math.max(.001,dt);this.lastSpeed=s.speed;
  const damping=1-Math.exp(-dt*(settings.stabilization?7:11)),turn=(keys.d?1:0)-(keys.a?1:0);
  this.lean+=(-turn*Math.min(speed*.0016,.042)-this.lean)*damping;this.pitch+=(Math.max(-.022,Math.min(.022,-accel*.0012))-this.pitch)*damping;
  this.impact*=Math.exp(-dt*8);
  if(s.mode==='bike'){
   const vibration=Math.sin(this.phase*(road?11:23))*Math.min(speed,30)*(road?.0003:.00085);
   this.camera.position.y+=level*(vibration+Math.sin(this.phase*4)*Math.min(speed,30)*.0005-this.impact);
   this.camera.rotation.x+=level*this.pitch;this.camera.rotation.z=level*this.lean;
  }
  const fov=settings.fov+(s.mode==='bike'?Math.min(speed/30,1)*8*settings.speedFov:0);this.camera.fov+=(fov-this.camera.fov)*(1-Math.exp(-dt*4));this.camera.updateProjectionMatrix();
  const x=this.bike.position.x,z=this.bike.position.z,y=heightAt(x,z);this.headlight.position.set(x,y+1.4,z);this.headlight.target.position.set(x-Math.sin(this.bike.rotation.y)*45,y+.3,z-Math.cos(this.bike.rotation.y)*45);this.headlight.visible=this.preset.lights&&settings.headlights;this.headlight.intensity=settings.weather==='night'?110:40;
  this.sun.position.set(x-100,y+190,z-130);this.sun.target.position.set(x,0,z-25);this.droneLight.position.fromArray(s.droneSystem.pos);this.droneLight.visible=this.preset.lights&&s.droneSystem.mode!=='DOCK';
  const a=this.particles.geometry.attributes.position;for(let i=0;i<this.preset.particles;i++){const p=this.particleData[i];if(i<60&&s.mode==='bike'&&speed>4&&!road){const life=(this.phase+i*.07)%1;a.setXYZ(i,s.pos.x+Math.sin(s.yaw)*(4+life*10)+Math.sin(i*37)*life*2,heightAt(s.pos.x,s.pos.z)+.3+life*1.8,s.pos.z+Math.cos(s.yaw)*(4+life*10)+Math.cos(i*23)*life*2);}else a.setXYZ(i,s.pos.x+(p.x+this.phase*2)%90-15,heightAt(s.pos.x,s.pos.z)+(p.y+Math.sin(this.phase+i)*.1),s.pos.z+p.z);}a.needsUpdate=true;this.particles.material.opacity=settings.weather==='sandstorm'?.6:s.mode==='bike'&&speed>8&&!road?.5:.18;
  const sp=this.sparks.geometry.attributes.position;const source=s.harvesting?{x:s.harvesting.x,y:s.harvesting.y,z:s.harvesting.z}:s.leg===3?{x:60,y:3,z:-4310}:{x:155,y:4,z:-765};this.sparks.visible=this.preset.particles>64&&Math.hypot(source.x-s.pos.x,source.z-s.pos.z)<120;for(let i=0;i<36;i++){const life=(this.phase*1.5+i*.071)%1;sp.setXYZ(i,source.x+Math.sin(i*43)*life*2,source.y+life*2-life*life*4,source.z+Math.cos(i*31)*life*2);}sp.needsUpdate=true;
  for(const lens of this.fixtures)lens.material.emissiveIntensity=(s.leg===2&&s.hydroRestored||s.leg===3&&s.leg3Won)?2.5:1.4+Math.sin(this.phase*2)*.3;
 }
}
