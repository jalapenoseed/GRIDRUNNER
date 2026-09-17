import {FRAME_TYPES,STARTER_AIRCRAFT,EXTRA_AIRCRAFT,aircraftType,aircraftCode} from './fleet-manifest.js';
import {BEACONS,beaconScale} from './drone-beacons.js';
import {carriedPack} from './battery-packs.js';
import {taskStatusText} from './fleet-task-ui.js';
import {dronePerformance} from './drone-system.js';
import {syncSquad} from './squadron.js';
import * as T from './three.js';
import {GLTFLoader} from './GLTFLoader.js';
import {makeDrone} from './visuals.js';
export const FLEET=[
 {id:'scout',code:'SCOUT-01',file:'SCOUT',role:'Recon',span:.52,description:'Ultralight scout. Quick acceleration and fast survey passes; more sensitive to wind.'},
 {id:'cargo',code:'CARGO-01',file:'CARGO',role:'Salvage',span:1.9,description:'Heavy lift frame with a protected cargo cage and recovery clamp.'},
 {id:'engineer',code:'UTILITY-01',file:'UTILITY',role:'Repair',span:.7,description:'Articulated service tools, cable reels and field-maintenance fittings.'},
 {id:'relay',code:'RELAY-01',file:'RELAY',role:'Comms',span:.68,description:'Lightweight, high-speed relay. Extended link range; fast redeployment between signal positions.'}
];
for(const id of EXTRA_AIRCRAFT)FLEET.push({...FLEET.find(r=>r.id===aircraftType(id)),id,code:aircraftCode(id)});
export function fleetCards(selected,{yard=false,engineerBuilt=false,docked=true,squad={},available=null,actions=true}={}){return `<div class="fleetCards">${FLEET.filter(d=>!yard||FRAME_TYPES.includes(d.id)).map(d=>{const locked=!yard&&(available?available[aircraftType(d.id)]===false:d.id==='engineer'&&!engineerBuilt),perf=dronePerformance(d.id);return `<article class="fleetCard ${selected===d.id?'selected':''} ${locked?'locked':''}"><img src="assets/drones/${d.file.toLowerCase()}.webp" alt="${d.code} Blender source preview" loading="lazy"><div class="fleetInfo"><span>${d.role.toUpperCase()} / ${Math.round(d.span*1000)} mm</span><h3>${d.code}</h3><span class="beaconIdentity" style="--beacon:#${BEACONS[d.id].color.toString(16).padStart(6,'0')}">${BEACONS[d.id].name} BEACON</span><p>${d.description}</p><p class="airframeSpecs">${perf.dryMassKg.toFixed(2)} kg · ${perf.speed} m/s<br>${perf.acceleration} m/s² · payload ≤ ${perf.payloadKg} kg</p><p class="aircraftStatus">${squad[d.id]?squad[d.id].system.mode+' · BAT '+Math.round(squad[d.id].battery)+'% · HULL '+Math.round(squad[d.id].system.hp)+'%':'READY'}</p><p class="taskBadge">${taskStatusText(squad[d.id])}</p>${actions?`<button data-drone="${d.id}" ${!docked||locked?'disabled':''}>${selected===d.id&&!locked?'SELECTED':locked?'QUEST LOCKED':!docked?'DOCK TO CHANGE':'SELECT / COMMAND'}</button>`:''}</div></article>`;}).join('')}</div>`;}
const texNames=['01_painted_alum','02_machined_alum','03_black_anodized','04_weave','05_rubber','06_aged_copper','07_galvanized','08_damp_concrete','09_camera_glass'];
const LOD={high:18,mid:42};
const idle=()=>new Promise(resolve=>globalThis.requestIdleCallback?requestIdleCallback(resolve,{timeout:500}):setTimeout(resolve,0));
function beaconTexture(){const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot(x-15.5,y-15.5)/16;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*(r<.42?1:Math.max(0,1-(r-.42)/.58)**2));}const map=new T.DataTexture(data,32,32);map.needsUpdate=true;return map;}
const beaconMap=beaconTexture();
// Visible at LOW too: glow sprites require no bloom, dynamic lights or shadows.
function neonAirframe(root,id,span){
 const color=BEACONS[id].color,rig=new T.Group();rig.name='Neon identification / '+id;
 const halo=new T.Sprite(new T.SpriteMaterial({map:beaconMap,color,blending:T.AdditiveBlending,transparent:true,opacity:.5,depthWrite:false,toneMapped:false,fog:false}));
 halo.position.y=.4;rig.add(halo);
 const material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(3),toneMapped:false,fog:false});
 for(const side of [-1,1]){
  const strip=new T.Mesh(new T.BoxGeometry(span*.045,.035,span*.7),material);
  strip.position.set(side*span*.3,-.04,0);rig.add(strip);
  for(const end of [-1,1]){
   const lamp=new T.Sprite(new T.SpriteMaterial({map:beaconMap,color,blending:T.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false,fog:false}));
   lamp.position.set(side*span*.35,.025,end*span*.32);lamp.scale.setScalar(.24);rig.add(lamp);
  }
 }
 const ring=new T.Mesh(new T.TorusGeometry(span*.2,.02,5,24),material);ring.rotation.x=Math.PI/2;ring.position.y=-.16;rig.add(ring);
 root.add(rig);root.userData.neon=rig;root.userData.beaconHalo=halo;
}
export class DroneFleet{
 constructor(scene,{assets=true}={}){this.enabled=assets;this.quality='HIGH';this.meshes={};this.records={};this.materials=new Map();this.textures=new Map();this.errors=[];this.wet=0;
  for(const d of FLEET){const root=new T.Group();root.name=d.code;const proxy=makeDrone();proxy.scale.setScalar(d.span/1.8);root.add(proxy);const beacon=new T.Sprite(new T.SpriteMaterial({map:beaconMap,blending:T.NormalBlending,fog:false,color:BEACONS[d.id].color,transparent:true,opacity:.95,depthWrite:false,toneMapped:false}));beacon.position.y=.4;root.add(beacon);root.userData.beacon=beacon;neonAirframe(root,d.id,d.span);const clamp=new T.Mesh(new T.TorusGeometry(.14,.025,6,12),new T.MeshBasicMaterial({color:0xd5f9e9}));clamp.position.y=.35;clamp.visible=false;root.add(clamp);root.userData.lineClamp=clamp;const pack=new T.Mesh(new T.BoxGeometry(.24,.14,.38),new T.MeshStandardMaterial({color:0xc3a254,roughness:.65,metalness:.3}));pack.position.y=-.2;pack.visible=false;root.add(pack);root.userData.batteryPack=pack;root.visible=false;root.userData.rotors=proxy.userData.rotors;scene.add(root);this.meshes[d.id]=root;this.records[d.id]={...d,root,proxy,loading:false,loaded:false};}
 }
 setQuality(q){this.quality=q||'HIGH';const low=this.quality==='LOW';for(const t of this.textures.values())t.anisotropy=low?1:4;}
 shouldStream(id,s){if(!this.enabled)return false;if(this.quality==='LOW')return false;return true;}
 detail(id,camera){const r=this.records[id];if(!r?.model)return 'proxy';if(this.quality==='LOW')return 'proxy';const d=r.root.position.distanceTo(camera.position);if(d>LOD.mid)return 'proxy';if(d>LOD.high&&this.quality!=='HIGH'&&this.quality!=='ULTRA')return 'proxy';return 'glb';}
 texture(name,channel){const key=name+'_'+channel;if(this.textures.has(key))return this.textures.get(key);const t=new T.TextureLoader().load('./assets/drones/textures/GR_'+key+'.png',undefined,undefined,()=>this.errors.push(key));t.colorSpace=channel==='albedo'?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=name==='09_camera_glass'?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=this.quality==='LOW'?1:4;t.flipY=false;this.textures.set(key,t);return t;}
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
 load(id){const r=this.records[id];if(!r||r.failed||!this.enabled)return Promise.resolve(false);if(r.loaded)return Promise.resolve(true);if(r.promise)return r.promise;r.loading=true;
  const type=aircraftType(id);if(id!==type){r.promise=this.load(type).then(ok=>{if(!ok){r.failed=true;r.loading=false;return false;}r.model=this.records[type].model.clone(true);r.root.add(r.model);r.root.userData.rotors=[];r.model.traverse(o=>{if(o.userData.rotor&&!o.isMesh)r.root.userData.rotors.push(o);});r.loaded=true;r.loading=false;return true;});return r.promise;}
  r.promise=fetch('./assets/drones/GR_'+r.file+'_01.glb.gz').then(async response=>{if(!response.ok)throw Error('Drone download '+response.status);if(!globalThis.DecompressionStream)throw Error('This browser needs gzip stream support');const data=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();await idle();return new GLTFLoader().parseAsync(data,'');}).then(gltf=>{const model=gltf.scene;model.rotation.y=Math.PI;model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),center=new T.Vector3();b.getCenter(center);model.position.y=-center.y;
   const rotors=[];model.traverse(o=>{if(o.userData.rotor&&!o.isMesh)rotors.push(o);if(!o.isMesh)return;const name=o.userData.sourceMaterial||o.material.name.replace(/^RUNTIME_/,'');o.material=this.material(name);o.castShadow=o.receiveShadow=this.quality==='HIGH'||this.quality==='ULTRA';if(o.geometry.attributes.uv&&!o.geometry.attributes.uv1)o.geometry.setAttribute('uv1',o.geometry.attributes.uv);});
   r.root.add(model);r.model=model;r.loaded=true;r.loading=false;r.root.userData.rotors=rotors.length?rotors:r.root.userData.rotors;r.root.userData.source='Blender reference pack 02';return true;
  }).catch(error=>{r.loading=false;r.failed=true;this.errors.push(id+': '+error.message);return false;});return r.promise;
 }
 prepare(ids=['scout']){return Promise.all(ids.map(id=>this.load(id)));}
 update(dt,s,trailer,bike,camera,{reducedMotion=false}={}){const squad=syncSquad(s);const active=this.records[s.droneType]||this.records.scout;if(this.shouldStream(active.id,s))this.load(active.id);
  for(const r of Object.values(this.records)){const selected=r===active,d=squad[r.id].system,flying=d.mode!=='DOCK';const onboard=selected&&s.mode==='drone'&&!['chase','overhead'].includes(s.experience?.preferred?.drone);r.root.visible=flying?!onboard:STARTER_AIRCRAFT.includes(r.id)||selected&&s.mode!=='drone';if(flying&&this.shouldStream(r.id,s))this.load(r.id);const beacon=r.root.userData.beacon;beacon.visible=flying;r.root.userData.lineClamp.visible=!!d.perch;beacon.material.color.setHex(BEACONS[r.id].color);beacon.material.opacity=.94+.06*Math.pow(Math.sin((s.elapsed||0)*4+FLEET.findIndex(f=>f.id===r.id)),8);const size=beaconScale(camera,new T.Vector3(...d.pos),globalThis.innerHeight||800);beacon.scale.set(size,size,1);const neon=r.root.userData.neon,halo=r.root.userData.beaconHalo;neon.visible=flying;halo.scale.set(size*3.4,size*3.4,1);halo.material.opacity=.46+.07*Math.sin((s.elapsed||0)*1.4);r.root.userData.batteryPack.visible=!!carriedPack(s,squad[r.id]);
   const displayed=selected||flying||STARTER_AIRCRAFT.includes(r.id);const useGlb=displayed&&camera&&this.detail(r.id,camera)==='glb';
   if(r.model)r.model.visible=!!useGlb;if(r.proxy)r.proxy.visible=displayed&&!useGlb;
   if(flying){r.root.position.fromArray(d.pos);const show=!reducedMotion&&s.swarmOps?.program?.enabled&&s.swarmOps.program.activeIds.includes(r.id)&&['FOLLOW','ORBIT'].includes(d.mode)&&squad[r.id].swarmOrder==='formation'?squad[r.id].showAttitude:null;r.root.rotation.set(d.pitch+(show?.pitch||0),d.yaw,d.roll+(show?.roll||0),'YXZ');}else{const i=STARTER_AIRCRAFT.indexOf(r.id),rack=i<0?new T.Vector3(0,1.8,0):new T.Vector3((i%3-1)*.82,1.8,(Math.floor(i/3)-.5)*.85).applyAxisAngle(new T.Vector3(0,1,0),bike.rotation.y);r.root.position.copy(trailer.position).add(rack);r.root.rotation.set(0,bike.rotation.y,0);}for(const [i,rotor]of r.root.userData.rotors.entries()){const speed=flying&&!['LANDED','RELAY','PERCHED'].includes(d.mode)?dt*65*(i%2?1:-1):0;rotor.rotation.y+=speed;}}
 }
 setWet(wet){if(Math.abs(wet-this.wet)<.01)return;this.wet=wet;for(const m of this.materials.values()){m.roughness=m.userData.baseRoughness*(1-wet*.27);if(m.isMeshPhysicalMaterial){m.clearcoat=Math.max(m.userData.baseCoat,wet*.45);m.clearcoatRoughness=.12;}}}
}
