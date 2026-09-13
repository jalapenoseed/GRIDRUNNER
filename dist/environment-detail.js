import * as T from './three.js';
import {heightAt} from './visuals.js';
import {PRESETS} from './immersion.js';
// Reuses the supplied Godot/Blender material exports and original oak cutout.
// Fixed instance buffers, no per-frame textures or random geometry allocations.
export class EnvironmentDetail{
 constructor(scene,{textures=true}={}){
  this.scene=scene;this.batches=[];this.loaded=false;this.textures=textures;this.materials={};
  const pixels=new Uint8Array(64*32*4);for(let y=0;y<32;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,t=y/31,sun=Math.max(0,1-Math.hypot((x-19)/3,(y-12)/3));pixels[i]=80+t*55+sun*95;pixels[i+1]=104+t*16+sun*70;pixels[i+2]=125-t*28+sun*38;pixels[i+3]=255;}
  this.env=new T.DataTexture(pixels,64,32,T.RGBAFormat);this.env.mapping=T.EquirectangularReflectionMapping;this.env.colorSpace=T.SRGBColorSpace;this.env.needsUpdate=true;scene.environment=this.env;
  let seed=7551;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},dummy=new T.Object3D();
  const batch=(geometry,material,count,leg,place)=>{const m=new T.InstancedMesh(geometry,material,count);for(let i=0;i<count;i++){place(dummy,i);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();m.receiveShadow=true;scene.add(m);this.batches.push({mesh:m,max:count,leg});return m;};
  this.materials.rock=new T.MeshStandardMaterial({color:0x9b9982,roughness:.96});this.materials.ground=new T.MeshStandardMaterial({color:0x989479,roughness:.9});this.materials.wood=new T.MeshStandardMaterial({color:0x80745b,roughness:.88});
  const leaf=this.materials.leaf=new T.MeshStandardMaterial({color:0x7f8e68,side:T.DoubleSide,alphaTest:.58,roughness:1,transparent:false}),bark=new T.MeshStandardMaterial({color:0x4b5141,roughness:.97});
  const patch=new T.MeshStandardMaterial({color:0x172522,roughness:.27,metalness:.25,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(let leg=1;leg<=3;leg++){
   const start=leg===1?100:leg===2?-1760:-3300;
   batch(new T.IcosahedronGeometry(1,1),this.materials.rock,130,leg,(o)=>{const x=(random()<.5?-1:1)*(15+random()*8),z=start-random()*1400;o.position.set(x,heightAt(x,z)+.18,z);o.scale.set(.25+random()*.9,.16+random()*.35,.3+random());o.rotation.set(random(),random()*6,random());});
   batch(new T.CircleGeometry(1,12),patch,55,leg,(o)=>{const z=start-random()*1400;o.position.set((random()-.5)*17,.102,z);o.rotation.set(-Math.PI/2,0,random()*6);o.scale.set(1+random()*2,.25+random()*1.3,1);});
   // Oaks stay off the carriageway and out of authored encounter footprints.
   const trees=Array.from({length:leg===2?36:leg===1?16:8},()=>({x:(random()<.5?-1:1)*(185+random()*45),z:start-random()*1400,h:3.5+random()*3}));
   if(leg===1)trees.push({x:-112,z:-55,h:5},{x:-109,z:-117,h:6},{x:-54,z:-108,h:4.5});
   batch(new T.CylinderGeometry(.1,.25,1,7),bark,trees.length,leg,(o,i)=>{const t=trees[i];o.position.set(t.x,heightAt(t.x,t.z)+t.h*.45,t.z);o.scale.set(1,t.h*.9,1);o.rotation.set(0,0,.05);});
   batch(new T.PlaneGeometry(1,1),leaf,trees.length*3,leg,(o,i)=>{const t=trees[Math.floor(i/3)];o.position.set(t.x,heightAt(t.x,t.z)+t.h,t.z);o.scale.set(t.h*2.3,t.h*1.6,1);o.rotation.set(0,(i%3)*Math.PI/3,0);});
  }
 }
 load(){if(this.loaded||!this.textures)return;this.loaded=true;const loader=new T.TextureLoader();const set=(material,key,file,srgb=false,repeat=1)=>{loader.load('./assets/kit/'+file,t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;material[key]=t;material.needsUpdate=true;},undefined,()=>{});};
  for(const [id,name]of [['rock','Rock030'],['ground','Ground037'],['wood','Wood051']]){set(this.materials[id],'map',name+'_Color.jpg',true,2);set(this.materials[id],'normalMap',name+'_NormalGL.jpg',false,2);set(this.materials[id],'roughnessMap',name+'_Roughness.jpg',false,2);this.materials[id].normalScale=new T.Vector2(.6,.6);}
  set(this.materials.leaf,'map','oak.png',true);this.materials.leaf.color.setHex(0xc1cab0);
 }
 update(s,settings){const quality=PRESETS[settings.graphics]||PRESETS.HIGH;if(settings.graphics!=='LOW')this.load();this.scene.environmentIntensity=settings.weather==='night'?.16:.55;for(const b of this.batches){b.mesh.visible=b.leg===s.leg&&!(settings.graphics==='LOW'&&b.mesh.material===this.materials.leaf);b.mesh.count=Math.floor(b.max*quality.clutter);}}
}
