import * as T from './three.js';
import {DroneFleet} from './drone-fleet.js';
import {makeDrone,makeBike} from './visuals.js';
import {COMMANDER_TYPES,COMMANDER_OBSTACLES} from './fleet-commander-core.js';
import {beaconColor} from './beacon-palette.js';

// Reuse the reference airframes. Every mesh part is drawn once per airframe type,
// with instance transforms, rather than cloning a whole model for each drone.
export function instanceParts(model,scene,capacity=100){
 model.updateMatrixWorld(true);const parts=[];
 model.traverse(source=>{if(!source.isMesh)return;const mesh=new T.InstancedMesh(source.geometry,source.material,capacity);mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);parts.push({mesh,local:source.matrixWorld.clone()});});return parts;
}
const vector=new T.Vector3(),transform=new T.Matrix4(),combined=new T.Matrix4(),rotation=new T.Quaternion(),angles=new T.Euler(0,0,0,'YXZ'),unit=new T.Vector3(1,1,1);
function fillInstances(parts,drones){for(const part of parts){part.mesh.count=drones.length;drones.forEach((d,i)=>{vector.fromArray(d.pos);angles.set(d.attitude.pitch,d.yaw,d.attitude.roll,'YXZ');rotation.setFromEuler(angles);transform.compose(vector,rotation,unit);combined.multiplyMatrices(transform,part.local);part.mesh.setMatrixAt(i,combined);});part.mesh.instanceMatrix.needsUpdate=true;}}
export class CommanderRenderer{
 constructor(host,{onObjective=()=>{},onStatus=()=>{}}={}){
  this.host=host;this.onObjective=onObjective;this.onStatus=onStatus;this.view='orbit';this.azimuth=.25;this.elevation=.63;this.distance=240;this.center=new T.Vector3(0,12,0);this.selected='drone-001';this.detail={};this.proxy={};this.failed=new Set();this.disposed=false;this.lastFleet=null;
  const canvas=document.createElement('canvas');canvas.tabIndex=0;canvas.setAttribute('aria-label','Fleet practice field. Click to place the objective; use view controls to inspect the swarm.');
  try{this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.setup3D();this.canvas=canvas;this.kind='3D field';}
  catch{this.renderer?.dispose();this.renderer=null;this.canvas=document.createElement('canvas');this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Fleet tactical field. Click to place the objective.');this.ctx=this.canvas.getContext('2d');this.kind='Tactical view · WebGL unavailable';}
  host.append(this.canvas);this.onStatus(this.kind);this.bindControls();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
 }
 setup3D(){
  this.scene=new T.Scene();this.scene.background=new T.Color('#111e23');this.scene.fog=new T.Fog('#111e23',380,820);this.camera=new T.PerspectiveCamera(50,1,.1,1200);
  this.renderer.setPixelRatio(Math.min(1.75,devicePixelRatio||1));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
  this.scene.add(new T.HemisphereLight(0xd9ebed,0x4a4437,2.5));const sun=new T.DirectionalLight(0xffdfb2,2.2);sun.position.set(-80,160,70);this.scene.add(sun);
  const floor=new T.Mesh(new T.PlaneGeometry(1000,1000),new T.MeshStandardMaterial({color:0x1b292b,roughness:1}));floor.rotation.x=-Math.PI/2;this.scene.add(floor);
  const grid=new T.GridHelper(440,44,0x546260,0x2d3c3e);grid.position.y=.02;this.scene.add(grid);
  this.boxes=new T.Group();for(const box of COMMANDER_OBSTACLES){const body=new T.Mesh(new T.BoxGeometry(box.w*2,box.h,box.d*2),new T.MeshStandardMaterial({color:0x43514e,roughness:.95}));body.position.set(box.x,box.h/2,box.z);this.boxes.add(body);const edge=new T.LineSegments(new T.EdgesGeometry(body.geometry),new T.LineBasicMaterial({color:0x7e897b}));edge.position.copy(body.position);this.boxes.add(edge);}this.scene.add(this.boxes);
  const pad=new T.Mesh(new T.PlaneGeometry(55,55),new T.MeshStandardMaterial({color:0x39433c,roughness:1}));pad.rotation.x=-Math.PI/2;pad.position.set(0,.03,88);this.scene.add(pad);
  const bike=makeBike();bike.position.set(12,0,62);this.scene.add(bike);
  const cover=new T.Mesh(new T.ConeGeometry(4,2.2,4),new T.MeshStandardMaterial({color:0x59634a,roughness:1}));cover.position.set(0,1.1,62);cover.rotation.y=Math.PI/4;this.scene.add(cover);
  this.objective=new T.Group();const ring=new T.Mesh(new T.TorusGeometry(11,.18,6,64),new T.MeshBasicMaterial({color:0xf5e6a7}));ring.rotation.x=Math.PI/2;this.objective.add(ring);const ring2=ring.clone();ring2.rotation.x=0;this.objective.add(ring2);this.scene.add(this.objective);
  this.selectedRing=new T.Mesh(new T.TorusGeometry(2,.08,5,24),new T.MeshBasicMaterial({color:0xffffff}));this.selectedRing.rotation.x=Math.PI/2;this.scene.add(this.selectedRing);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(300),3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(300),3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('alive',new T.BufferAttribute(new Float32Array(100),1).setUsage(T.DynamicDrawUsage));
  this.beaconMaterial=new T.ShaderMaterial({uniforms:{size:{value:9}},vertexShader:'attribute vec3 color; attribute float alive; varying vec3 beaconColor; varying float brightness; uniform float size; void main(){beaconColor=color; brightness=alive; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_PointSize=size;}',fragmentShader:'varying vec3 beaconColor; varying float brightness; void main(){float r=length(gl_PointCoord-vec2(0.5)); if(r>0.5)discard; vec3 col=mix(beaconColor,vec3(1.0),1.0-smoothstep(0.08,0.22,r)); gl_FragColor=vec4(col*brightness,1.0-smoothstep(0.40,0.5,r));}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
  this.beacons=new T.Points(geometry,this.beaconMaterial);this.beacons.frustumCulled=false;this.beacons.renderOrder=2;this.scene.add(this.beacons);
  for(const [type,def]of Object.entries(COMMANDER_TYPES)){const proxy=makeDrone(0x929c8f);proxy.scale.setScalar(def.span/1.8);this.proxy[type]=instanceParts(proxy,this.scene);}
  this.loader=new DroneFleet(new T.Scene());this.loader.setQuality('MEDIUM');
 }
 async loadType(type){
  if(this.detail[type]||this.failed.has(type))return;if(this.loading?.has(type))return;this.loading??=new Set();this.loading.add(type);
  const ok=await this.loader.load(type);if(this.disposed)return;if(ok){const model=this.loader.records[type].model.clone();model.updateMatrixWorld(true);model.traverse(o=>{if(o.isMesh&&o.material.emissiveIntensity>0)o.material.emissiveIntensity=Math.min(.35,o.material.emissiveIntensity);});this.detail[type]=instanceParts(model,this.scene);}else this.failed.add(type);
  this.onStatus(this.kind+(this.failed.size?' · simplified airframes':''));
 }
 resize(){const rect=this.host.getBoundingClientRect();this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);if(this.renderer){this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();}else{const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=this.width*dpr;this.canvas.height=this.height*dpr;this.ctx?.setTransform(dpr,0,0,dpr,0,0);}}
 setView(view){this.view=view;this.distance=view==='follow'?20:240;this.center.set(0,12,0);}
 bindControls(){
  let drag=null;this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};this.canvas.setPointerCapture(e.pointerId);});
  this.canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;drag.moved||=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6;if(drag.moved&&this.view==='orbit'){this.azimuth-=dx*.005;this.elevation=Math.max(.18,Math.min(1.45,this.elevation+dy*.004));}drag.lastX=e.clientX;drag.lastY=e.clientY;});
  this.canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const rect=this.canvas.getBoundingClientRect();this.onObjective(this.worldPoint(e.clientX-rect.left,e.clientY-rect.top));}drag=null;});this.canvas.addEventListener('pointercancel',()=>drag=null);
  this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(12,Math.min(520,this.distance*Math.exp(e.deltaY*.001)));},{passive:false});
  this.canvas.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')this.distance=Math.max(12,this.distance*.85);else if(e.key==='-')this.distance=Math.min(520,this.distance/ .85);else return;e.preventDefault();});
 }
 worldPoint(x,y){
  const altitude=this.lastFleet?.objective?.[1]||28;
  if(this.renderer){const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/this.width*2-1,1-y/this.height*2),this.camera);const point=new T.Vector3();if(ray.ray.intersectPlane(this.view==='front'?new T.Plane(new T.Vector3(0,0,1),-(this.lastFleet?.objective[2]||0)):new T.Plane(new T.Vector3(0,1,0),-altitude),point))return point.toArray();return this.lastFleet?.objective||[0,28,0];}
  const scale=this.mapScale();if(this.view==='front')return [(x-this.width/2)/scale,Math.max(8,(this.height*.75-y)/scale),this.lastFleet?.objective[2]||0];return [(x-this.width/2)/scale,altitude,(y-this.height*.5)/scale];
 }
 mapScale(){return Math.min(this.width,this.height)/(this.distance*1.2);}
 project(p){const s=this.mapScale();return this.view==='front'?[this.width/2+p[0]*s,this.height*.75-p[1]*s]:[this.width/2+p[0]*s,this.height*.5+p[2]*s];}
 render(sim){
  this.lastFleet=sim.fleet;if(!this.renderer){this.drawMap(sim);return;}
  const selected=sim.drones.find(d=>d.id===this.selected)||sim.drones[0];
  if(this.view==='follow'){this.center.fromArray(selected.pos);this.camera.position.copy(this.center).add(new T.Vector3(0,8,this.distance));}
  else if(this.view==='top')this.camera.position.set(0,this.distance,1);
  else if(this.view==='front')this.camera.position.set(0,30,this.distance);
  else this.camera.position.copy(this.center).add(new T.Vector3(Math.sin(this.azimuth)*Math.cos(this.elevation)*this.distance,Math.sin(this.elevation)*this.distance,Math.cos(this.azimuth)*Math.cos(this.elevation)*this.distance));
  this.camera.lookAt(this.view==='top'?new T.Vector3():this.view==='front'?new T.Vector3(0,30,0):this.center);this.boxes.visible=sim.fleet.options.obstacles;this.objective.position.fromArray(sim.fleet.objective);this.selectedRing.position.fromArray(selected.pos);this.selectedRing.visible=this.view==='follow';
  for(const type of Object.keys(COMMANDER_TYPES)){const drones=sim.drones.filter(d=>d.type===type);if(drones.length)this.loadType(type);const near=[],far=[];for(const d of drones)(this.detail[type]&&this.camera.position.distanceTo(vector.fromArray(d.pos))<48?near:far).push(d);fillInstances(this.proxy[type],far);if(this.detail[type])fillInstances(this.detail[type],near);}
  const attrs=this.beacons.geometry.attributes;sim.drones.forEach((d,i)=>{attrs.position.setXYZ(i,d.pos[0],d.pos[1]+.4,d.pos[2]);const color=new T.Color(beaconColor(d.color).hex).convertLinearToSRGB();attrs.color.setXYZ(i,color.r,color.g,color.b);attrs.alive.setX(i,['DOCK','QUEUED'].includes(d.mode)?.4:1);});for(const attr of Object.values(attrs))attr.needsUpdate=true;this.beacons.geometry.setDrawRange(0,sim.drones.length);this.beaconMaterial.uniforms.size.value=sim.fleet.options.beaconSize*this.renderer.getPixelRatio();this.renderer.render(this.scene,this.camera);
 }
 drawMap(sim){
  const c=this.ctx;if(!c)return;const w=this.width,h=this.height,s=this.mapScale();c.clearRect(0,0,w,h);c.fillStyle='#132126';c.fillRect(0,0,w,h);c.lineWidth=1;c.strokeStyle='#243339';
  const line=(a,b)=>{const p=this.project(a),q=this.project(b);c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke();};
  for(let v=-220;v<=220;v+=20){if(this.view==='front'){line([v,0,0],[v,100,0]);line([-220,v,0],[220,v,0]);}else{line([v,0,-220],[v,0,220]);line([-220,0,v],[220,0,v]);}}
  c.strokeStyle='#52635e';if(this.view!=='front')for(const box of sim.fleet.options.obstacles?COMMANDER_OBSTACLES:[]){const [x,y]=this.project([box.x,0,box.z]);c.fillStyle='#35453f';c.fillRect(x-box.w*s,y-box.d*s,box.w*2*s,box.d*2*s);c.strokeRect(x-box.w*s,y-box.d*s,box.w*2*s,box.d*2*s);}
  const text=(p,label,color='#9eafaa')=>{const [x,y]=this.project(p);c.fillStyle=color;c.font='11px monospace';c.fillText(label,x+9,y-9);};
  if(this.view!=='front'){text([0,0,62],'OPERATOR / COVER');text([12,0,78],'BIKE');const [px,py]=this.project([-24,0,70]);c.strokeStyle='#566754';c.strokeRect(px,py,48*s,45*s);}
  const [ox,oy]=this.project(sim.fleet.objective);c.strokeStyle=sim.challenge?.color?beaconColor(sim.challenge.color).hex:'#e5dbaa';c.lineWidth=1.5;c.beginPath();c.arc(ox,oy,Math.max(11,11*s),0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(ox-5,oy);c.lineTo(ox+5,oy);c.moveTo(ox,oy-5);c.lineTo(ox,oy+5);c.stroke();text(sim.fleet.objective,'OBJECTIVE',c.strokeStyle);
  for(const d of sim.drones){const [x,y]=this.project(d.pos),active=['FLY','RETURN'].includes(d.mode),size=sim.fleet.options.beaconSize*.46;c.globalAlpha=active?1:.3;
   if(active){const angle=d.yaw;c.strokeStyle=beaconColor(d.color).hex;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.sin(angle)*size*2,y-Math.cos(angle)*size*2);c.stroke();}
   c.fillStyle=beaconColor(d.color).hex;c.beginPath();c.ellipse(x,y,size,Math.max(1,size*Math.abs(Math.cos(d.attitude.roll))),d.attitude.pitch,0,Math.PI*2);c.fill();c.fillStyle='#fffef3';c.beginPath();c.arc(x,y,Math.max(1,size*.26),0,Math.PI*2);c.fill();c.globalAlpha=1;
   if(d.id===this.selected){c.strokeStyle='#d9e2da';c.lineWidth=1;c.beginPath();c.arc(x,y,size+4,0,Math.PI*2);c.stroke();}
  }
  c.fillStyle='#92a4a5';c.font='11px monospace';c.fillText(this.view==='front'?'FRONT ELEVATION / 20 m GRID':'N ↑    20 m GRID',18,h-18);
 }
 dispose(){this.disposed=true;this.resizeObserver.disconnect();this.renderer?.dispose();this.canvas.remove();}
}
