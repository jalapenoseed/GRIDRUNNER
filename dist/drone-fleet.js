import * as T from './three.js';
import {GLTFLoader} from './GLTFLoader.js';
import {makeDrone} from './visuals.js';
export const FLEET=[
 {id:'scout',code:'SCOUT-01',file:'SCOUT',role:'Recon',span:.52,description:'Light scout. Fast survey passes and close optical inspection.'},
 {id:'cargo',code:'CARGO-01',file:'CARGO',role:'Salvage',span:1.9,description:'Heavy lift frame with a protected cargo cage and recovery clamp.'},
 {id:'engineer',code:'UTILITY-01',file:'UTILITY',role:'Repair',span:.7,description:'Articulated service tools, cable reels and field-maintenance fittings.'},
 {id:'relay',code:'RELAY-01',file:'RELAY',role:'Comms',span:.68,description:'Antenna array and radio modules. Extended link range and stable station keeping.'}
];
export function fleetCards(selected,{yard=false,engineerBuilt=false,docked=true}={}){return `<div class="fleetCards">${FLEET.map(d=>{const locked=d.id==='engineer'&&!engineerBuilt&&!yard;return `<article class="fleetCard ${selected===d.id?'selected':''}"><img src="assets/drones/${d.file.toLowerCase()}.webp" alt="${d.code} Blender source preview" loading="lazy"><div class="fleetInfo"><span>${d.role.toUpperCase()} / ${Math.round(d.span*1000)} mm</span><h3>${d.code}</h3><p>${d.description}</p><button data-drone="${d.id}" ${!docked||locked?'disabled':''}>${selected===d.id?'EQUIPPED':locked?'FIT ENGINEER MODULE':!docked?'DOCK TO CHANGE':'SELECT AIRFRAME'}</button></div></article>`;}).join('')}</div>`;}
const texNames=['01_painted_alum','02_machined_alum','03_black_anodized','04_weave','05_rubber','06_aged_copper','07_galvanized','08_damp_concrete','09_camera_glass'];
export class DroneFleet{
 constructor(scene,{assets=true}={}){this.enabled=assets;this.meshes={};this.records={};this.materials=new Map();this.textures=new Map();this.errors=[];this.wet=0;
  for(const d of FLEET){const root=new T.Group();root.name=d.code;const proxy=makeDrone();proxy.scale.setScalar(d.span/1.8);root.add(proxy);root.visible=false;root.userData.rotors=proxy.userData.rotors;scene.add(root);this.meshes[d.id]=root;this.records[d.id]={...d,root,proxy,loading:false,loaded:false};}
 }
 texture(name,channel){const key=name+'_'+channel;if(this.textures.has(key))return this.textures.get(key);const t=new T.TextureLoader().load('./assets/drones/textures/GR_'+key+'.png',undefined,undefined,()=>this.errors.push(key));t.colorSpace=channel==='albedo'?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=name==='09_camera_glass'?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=4;t.flipY=false;this.textures.set(key,t);return t;}
 material(name){if(this.materials.has(name))return this.materials.get(name);let index=texNames.findIndex(n=>name.toLowerCase().includes(n));
  const offWhite=/OffWhite/.test(name),ochre=/Ochre/.test(name),glass=/Glass|Lens|camera_glass/i.test(name),emission=/LED|Indicator/.test(name);
  if(offWhite||ochre)index=0;if(glass)index=8;
  let m;if(emission)m=new T.MeshStandardMaterial({color:/Amber/.test(name)?0xc28830:0x458990,emissive:/Amber/.test(name)?0xffae45:0x4ad5db,emissiveIntensity:2.7,roughness:.3});
  else if(index>=0){const stem=texNames[index];m=new T.MeshPhysicalMaterial({map:this.texture(stem,'albedo'),normalMap:this.texture(stem,'normal'),roughnessMap:this.texture(stem,'rough'),metalnessMap:this.texture(stem,'metal'),aoMap:this.texture(stem,'ao'),roughness:1,metalness:1,normalScale:new T.Vector2(index===3?.45:.6,index===3?.45:.6),clearcoat:glass?.6:.05,clearcoatRoughness:glass?.04:.2});
   if(offWhite||ochre){m.map=this.texture(offWhite?'paint_offwhite':'paint_ochre','albedo');m.metalness=.1;m.roughness=.95;}
   if(index===1){m.anisotropy=.45;m.roughness=.9;}if(index===3){m.metalness=0;m.clearcoat=.14;}if(index===4||index===7)m.metalness=0;
   if(glass){m.color.setHex(0xc0ccd0);m.transmission=.9;m.ior=1.5;m.thickness=.006;m.metalness=0;m.roughness=.3;m.envMapIntensity=1.1;}
  }else if(/trim/i.test(name))m=new T.MeshStandardMaterial({map:this.texture('trim','albedo'),roughnessMap:this.texture('trim','rough'),metalnessMap:this.texture('trim','metal'),normalMap:this.texture('trim','normal'),roughness:1,metalness:1});
  else m=new T.MeshStandardMaterial({color:/WarmWhite/.test(name)?0xc6c5b7:/Copper/.test(name)?0x68422b:0x11191d,roughness:.55,metalness:/Copper/.test(name)?1:.1});
  m.name=name;m.userData.baseRoughness=m.roughness;m.userData.baseCoat=m.clearcoat||0;this.materials.set(name,m);return m;
 }
 load(id){const r=this.records[id];if(!r||r.loading||r.loaded||r.failed||!this.enabled)return;r.loading=true;
  fetch('./assets/drones/GR_'+r.file+'_01.glb.gz').then(async response=>{if(!response.ok)throw Error('Drone download '+response.status);if(!globalThis.DecompressionStream)throw Error('This browser needs gzip stream support');const data=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return new GLTFLoader().parseAsync(data,'');}).then(gltf=>{const model=gltf.scene;model.rotation.y=Math.PI;model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),center=new T.Vector3();b.getCenter(center);model.position.y=-center.y;
   const rotors=[];model.traverse(o=>{if(o.userData.rotor&&!o.isMesh)rotors.push(o);if(!o.isMesh)return;const name=o.userData.sourceMaterial||o.material.name.replace(/^RUNTIME_/,'');o.material=this.material(name);o.castShadow=o.receiveShadow=true;if(o.geometry.attributes.uv&&!o.geometry.attributes.uv1)o.geometry.setAttribute('uv1',o.geometry.attributes.uv);});
   r.root.add(model);r.root.remove(r.proxy);r.model=model;r.loaded=true;r.loading=false;r.root.userData.rotors=rotors;r.root.userData.source='Blender reference pack 02';
  }).catch(error=>{r.loading=false;r.failed=true;this.errors.push(id+': '+error.message);});
 }
 update(dt,s,trailer,bike){const active=this.records[s.droneType]||this.records.scout;this.load(active.id);
  for(const r of Object.values(this.records)){const selected=r===active,flying=selected&&s.droneSystem.mode!=='DOCK';r.root.visible=selected&&s.mode!=='drone';if(flying){r.root.position.fromArray(s.droneSystem.pos);r.root.rotation.set(s.droneSystem.pitch,s.droneSystem.yaw,s.droneSystem.roll,'YXZ');}else{r.root.position.copy(trailer.position).add(new T.Vector3(0,1.8,0));r.root.rotation.set(0,bike.rotation.y,0);}for(const [i,rotor]of r.root.userData.rotors.entries()){const speed=flying&&s.droneSystem.mode!=='LANDED'?dt*65*(i%2?1:-1):0;rotor.rotation.y+=speed;}}
 }
 setWet(wet){if(Math.abs(wet-this.wet)<.01)return;this.wet=wet;for(const m of this.materials.values()){m.roughness=m.userData.baseRoughness*(1-wet*.27);if(m.isMeshPhysicalMaterial){m.clearcoat=Math.max(m.userData.baseCoat,wet*.45);m.clearcoatRoughness=.12;}}}
}
