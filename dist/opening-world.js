import * as T from './three.js';
import {makeDrone} from './visuals.js';
import {AssetKit} from './asset-kit.js';

// Authored cover, not decorative scatter. Geometry and colliders use identical
// dimensions. Main road, EV approach and saved field pickups remain clear.
export class OpeningWorld{
 constructor(scene,solids,{assets=true}={}){
  this.root=new T.Group();this.root.name='Maintenance cut / optional opening route';scene.add(this.root);
  this.kit=new AssetKit(assets);const unit=new T.BoxGeometry(1,1,1),batches=new Map(),materials=new Map();
  const mat=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.82,metalness:.24}));return materials.get(color);};
  const box=(x,y,z,w,h,d,color,solid=false)=>{
   const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion(),new T.Vector3(w,h,d)),material=mat(color);
   if(!batches.has(material))batches.set(material,[]);batches.get(material).push(matrix);
   if(solid)solids.push({x,z,w:w/2,d:d/2,minY:y-h/2,maxY:y+h/2,kind:'maintenance-cover',openingRoute:true});
  };
  const sign=(text,x,y,z,width=6)=>{
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d');
   c.fillStyle='#16292b';c.fillRect(0,0,1024,128);c.strokeStyle='#d9b16b';c.lineWidth=6;c.strokeRect(5,5,1014,118);c.fillStyle='#f3d7a2';c.font='bold 42px monospace';c.textAlign='center';c.fillText(text,512,81,985);
   const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width/8),new T.MeshBasicMaterial({map,toneMapped:false,side:T.DoubleSide}));m.position.set(x,y,z);this.root.add(m);
  };
  // Amber stakes lead off the exposed carriageway to the covered service bay.
  const route=[[-31,-187],[-46,-199],[-60,-207],[-60,-239],[-57,-264],[-60,-305],[-62,-325]];
  for(let i=0;i<route.length-1;i++){
   const a=route[i],b=route[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
   const mesh=new T.Mesh(new T.BoxGeometry(5,.035,length+1),mat(0x756d53));mesh.position.set((a[0]+b[0])/2,.025,(a[1]+b[1])/2);mesh.rotation.y=yaw;this.root.add(mesh);
  }
  for(const [x,z]of route){box(x+3,.6,z,.15,1.2,.15,0x6f7465);box(x+3,1.1,z,.3,.24,.24,0xd8a95c);}
  sign('MAINTENANCE CUT  /  COVER + EV',-31,2.5,-189,8);box(-34.7,1.2,-189,.18,2.4,.18,0x687568,true);
  // North and south ends stay open; roof and side walls genuinely occlude.
  box(-60,4.15,-222,16,.3,22,0x3a4c4d,true);
  for(const x of [-67.5,-52.5])box(x,1.9,-222,.4,3.8,20,0x68756b,true);
  for(let z=-231;z<=-213;z+=3)box(-67.23,2,z,.09,3.65,.13,0x8b8f77);
  for(let x=-67;x<=-53;x+=1.8)box(x,4.33,-222,.08,.04,21,0x9a9c85);
  sign('SERVICE BAY  /  WAIT OUT THE LENS',-60,3.5,-210.9,11);
  sign('NIGHT-SHIFT LEDGER',-65,2,-223,4);
  box(-65,.75,-224,2,1.5,1,0x646b57,true);box(-65,1.54,-223.85,.8,.05,.7,0xcdc1a3);
  box(-60,1.1,-251,1.3,2.2,1,0x516b67,true);box(-59.32,1.35,-251,.035,.85,.65,0x263c3f);
  sign('LOCKER LATCH  /  1 WIRE + 1 ELECTRONICS',-57,3,-253,9);
  const lens=new T.Mesh(new T.SphereGeometry(.09,8,6),new T.MeshBasicMaterial({color:0xeaa36e,toneMapped:false}));lens.position.set(-59.25,1.9,-251);this.root.add(lens);this.latchLamp=lens;
  // Existing approved kit asset, with an equivalent low-detail shell.
  const proxy=new T.Group(),shell=new T.Mesh(new T.BoxGeometry(2,1.4,1.2),mat(0x70816c));shell.position.y=.7;proxy.add(shell);
  this.kit.place(this.root,'GR_SupplyCrate_02.glb',[-64,0,-332],1.4,proxy);solids.push({x:-64,z:-332,w:1,d:.65,minY:0,maxY:1.5,kind:'maintenance-locker',openingRoute:true});
  sign('SHIFT SUPPLIES  /  LATCH REMOTE',-62,2.8,-334,7);
  box(-24,.15,-352,5,.3,5,0x68776c,true);box(-24,.34,-352,3.5,.08,3.5,0x243d40);
  for(const x of [-26,-22])box(x,.33,-352,.16,.07,4.1,0xd5ac6c);
  sign('WATCH-01  /  FINITE CHARGE STATION',-24,2.8,-355,7);
  for(const [material,matrices]of batches){const mesh=new T.InstancedMesh(unit,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();this.root.add(mesh);}
  this.aircraft=new T.Group();this.aircraft.name='WATCH-01 / non-weaponized surveillance';scene.add(this.aircraft);
  this.proxy=makeDrone(0xff6255);this.proxy.scale.setScalar(.52/1.8);this.aircraft.add(this.proxy);this.rotors=this.proxy.userData.rotors;
  this.lens=new T.Mesh(new T.SphereGeometry(.055,8,6),new T.MeshBasicMaterial({color:0xff6255,toneMapped:false}));this.lens.position.set(0,-.04,-.13);this.aircraft.add(this.lens);
  const line=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);this.sight=new T.Line(line,new T.LineBasicMaterial({color:0xf09c5d,transparent:true,opacity:.23,depthWrite:false}));scene.add(this.sight);
 }
 update(s,{active=false,quality='HIGH',dt=0,approvedModel=null}={}){
  this.root.visible=s.leg===1;this.kit.update(this.root.visible&&Math.hypot(s.pos.x+60,s.pos.z+250)<100,quality);
  this.latchLamp.material.color.setHex(s.openingRoute.repaired?0x83dfc3:0xeaa36e);
  const w=s.surveillance,d=w.system;this.aircraft.visible=active;this.sight.visible=active&&!['DOCK','LANDED'].includes(d.mode)&&['INVESTIGATE','OBSERVE'].includes(w.phase)&&w.lostFor<.15;
  if(!active)return;
  if(approvedModel&&!this.model){this.model=approvedModel.clone(true);this.aircraft.add(this.model);const rotors=[];this.model.traverse(o=>{if(o.userData.rotor&&!o.isMesh)rotors.push(o);});this.approvedRotors=rotors;}
  if(this.model)this.model.visible=quality!=='LOW';this.proxy.visible=!this.model||quality==='LOW';
  this.aircraft.position.fromArray(d.pos);this.aircraft.rotation.set(d.pitch,d.yaw,d.roll,'YXZ');
  this.lens.material.color.setHex(w.phase==='OBSERVE'?0xff514b:w.phase==='SEARCH'?0xeac371:0xf19760);
  if(!['DOCK','LANDED'].includes(d.mode))for(const [i,r]of [...this.rotors,...(this.approvedRotors||[])].entries())r.rotation.y+=dt*65*(i%2?1:-1);
  if(this.sight.visible){const a=this.sight.geometry.attributes.position;a.setXYZ(0,...d.pos);a.setXYZ(1,...w.lastSeen);a.needsUpdate=true;this.sight.geometry.computeBoundingSphere();}
 }
}
