import {roadsideCover} from './foliage.js';
import * as T from './three.js';
import {heightAt} from './visuals.js';
import {PRESETS} from './immersion.js';
import {placeScenery} from './scene-layout.js';
// Reuses the supplied Godot/Blender material exports and original oak cutout.
// Fixed instance buffers, no per-frame textures or random geometry allocations.
export class EnvironmentDetail{
 constructor(scene,{textures=true,solids=[]}={}){
  this.scene=scene;this.batches=[];this.loaded=false;this.textures=textures;this.materials={};
  // One shared, renderer-prefiltered sky map supplies rough PBR reflections.
  // Equirectangular data rows ascend from ground (-Y) to sky (+Y).
  const width=256,height=128,pixels=new Uint8Array(width*height*4);
  const soil=new T.Color(0x898375),horizon=new T.Color(0xdbe3e4),zenith=new T.Color(0x94b4cc),sample=new T.Color();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y*width+x)*4,t=y/(height-1);
   if(t<.5)sample.copy(soil).lerp(horizon,Math.pow(t*2,3));else sample.copy(horizon).lerp(zenith,Math.pow((t-.5)*2,.65));
   const sun=Math.exp(-(((x/width-.2)/.035)**2+((t-.8)/.055)**2));
   sample.r+=sun*.42;sample.g+=sun*.37;sample.b+=sun*.25;sample.convertLinearToSRGB();
   pixels[i]=Math.min(255,Math.round(sample.r*255));pixels[i+1]=Math.min(255,Math.round(sample.g*255));pixels[i+2]=Math.min(255,Math.round(sample.b*255));pixels[i+3]=255;
  }
  this.env=new T.DataTexture(pixels,width,height,T.RGBAFormat);this.env.mapping=T.EquirectangularReflectionMapping;this.env.colorSpace=T.SRGBColorSpace;this.env.needsUpdate=true;scene.environment=this.env;
  let seed=7551;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},dummy=new T.Object3D();
  const batch=(geometry,material,count,leg,place)=>{const m=new T.InstancedMesh(geometry,material,count);let accepted=0;for(let i=0;i<count;i++){if(place(dummy,i)===false)continue;dummy.updateMatrix();m.setMatrixAt(accepted++,dummy.matrix);}m.count=accepted;m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;scene.add(m);this.batches.push({mesh:m,max:accepted,leg});return m;};
  this.materials.rock=new T.MeshStandardMaterial({color:0x9b9982,roughness:.96});this.materials.ground=new T.MeshStandardMaterial({color:0x989479,roughness:.9});this.materials.wood=new T.MeshStandardMaterial({color:0x80745b,roughness:.88});
  const leaf=this.materials.leaf=new T.MeshStandardMaterial({color:0x7f8e68,side:T.DoubleSide,alphaTest:.58,roughness:1,transparent:false}),bark=new T.MeshStandardMaterial({color:0x4b5141,roughness:.97});
  const patch=new T.MeshStandardMaterial({color:0x172522,roughness:.27,metalness:.25,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(let leg=1;leg<=3;leg++){
   const start=leg===1?100:leg===2?-1760:-3300;
   batch(new T.IcosahedronGeometry(1,1),this.materials.rock,130,leg,(o)=>{const p=placeScenery(()=>({x:(random()<.5?-1:1)*(16+random()*9),z:start-random()*1400}),1.4);if(!p)return false;const {x,z}=p,sx=.25+random()*.9,sy=.16+random()*.35,sz=.3+random();o.position.set(x,heightAt(x,z)+.18,z);o.scale.set(sx,sy,sz);o.rotation.set(random(),random()*6,random());if(Math.max(sx,sz)>.72)solids.push({x,z,w:sx*.72,d:sz*.72,minY:heightAt(x,z),maxY:heightAt(x,z)+Math.max(.45,sy*1.7),kind:'rock',surface:sy<.25?'soft':'solid'});});
   batch(new T.CircleGeometry(1,12),patch,55,leg,(o)=>{const z=start-random()*1400;o.position.set((random()-.5)*17,.102,z);o.rotation.set(-Math.PI/2,0,random()*6);o.scale.set(1+random()*2,.25+random()*1.3,1);});
   // Oaks stay off the carriageway and out of authored encounter footprints.
   const trees=Array.from({length:leg===2?36:leg===1?16:8},()=>placeScenery(()=>({x:(random()<.5?-1:1)*(175+random()*65),z:start-random()*1400,h:3.5+random()*3}),t=>t.h*1.15)).filter(Boolean);
   // Frame the opening compound from outside its fence and service equipment.
   if(leg===1)trees.push({x:-121,z:-47,h:5},{x:-126,z:-115,h:5},{x:-40,z:-121,h:4.5});
   for(const t of trees)solids.push({x:t.x,z:t.z,w:.34,d:.34,minY:heightAt(t.x,t.z),maxY:heightAt(t.x,t.z)+t.h*.9,kind:'tree'});
   batch(new T.CylinderGeometry(.1,.25,1,7),bark,trees.length,leg,(o,i)=>{const t=trees[i];o.position.set(t.x,heightAt(t.x,t.z)+t.h*.45,t.z);o.scale.set(1,t.h*.9,1);o.rotation.set(0,0,.05);});
   batch(new T.PlaneGeometry(1,1),leaf,trees.length*3,leg,(o,i)=>{const t=trees[Math.floor(i/3)];o.position.set(t.x,heightAt(t.x,t.z)+t.h,t.z);o.scale.set(t.h*2.3,t.h*1.6,1);o.rotation.set(0,(i%3)*Math.PI/3,0);});
  }
  this.cover=roadsideCover(scene,leaf,solids);this.batches.push(...this.cover.batches);
 }
 load(){if(this.loaded||!this.textures)return;this.loaded=true;const loader=new T.TextureLoader();const set=(material,key,file,srgb=false,repeat=1)=>{loader.load('./assets/kit/'+file,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;material[key]=t;material.needsUpdate=true;},undefined,()=>{});};
  for(const [id,name]of [['rock','Rock030'],['ground','Ground037'],['wood','Wood051']]){set(this.materials[id],'map',name+'_Color.jpg',true,2);set(this.materials[id],'normalMap',name+'_NormalGL.jpg',false,2);set(this.materials[id],'roughnessMap',name+'_Roughness.jpg',false,2);this.materials[id].normalScale=new T.Vector2(.6,.6);}
  set(this.materials.leaf,'map','oak.png',true);this.materials.leaf.color.setHex(0xc1cab0);
 }
 update(s,settings){this.cover.update(s,settings);const quality=PRESETS[settings.graphics]||PRESETS.HIGH;if(settings.graphics!=='LOW')this.load();for(const b of this.batches){b.mesh.visible=b.leg===s.leg&&!(settings.graphics==='LOW'&&(b.mesh.material===this.materials.leaf||b.mesh.name==='Roadside / oak trunks'));b.mesh.count=Math.floor(b.max*quality.clutter);}}
}
