import * as T from './three.js';
import {heightAt} from './visuals.js';
import {placeScenery} from './scene-layout.js';

// Fixed, seeded batches: patchy road verges and groves, with authored paths clear.
// Crown cards reuse the existing oak cutout; grass is real tapered blade geometry.
export function roadsideCover(scene,leaf,solids=[]){
 let seed=79010;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const dummy=new T.Object3D(),color=new T.Color(),batches=[],time={value:0},wind={value:.1};
 const grass=new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:1});
 grass.onBeforeCompile=shader=>{shader.uniforms.coverTime=time;shader.uniforms.coverWind=wind;shader.vertexShader='uniform float coverTime;uniform float coverWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
   float phase=instanceMatrix[3].x*.31+instanceMatrix[3].z*.19;
   float sway=sin(coverTime*1.3+phase)*(.045+coverWind*.09)*position.y*position.y;
   transformed.x+=sway;transformed.z+=sway*.4;
  #endif`);};
 grass.customProgramCacheKey=()=> 'gridrunner-grass-1';
 const positions=[];
 for(let b=0;b<9;b++){
  const a=random()*Math.PI*2,r=random()*.62,x=Math.cos(a)*r,z=Math.sin(a)*r,h=.45+random()*.65,w=.025+random()*.035,lean=(random()-.5)*.4,dx=Math.cos(a)*w,dz=Math.sin(a)*w;
  const a0=[x-dx,0,z-dz],b0=[x+dx,0,z+dz],a1=[x-dx*.5+lean*.35,h*.55,z-dz*.5],b1=[x+dx*.5+lean*.35,h*.55,z+dz*.5],tip=[x+lean,h,z+.1];
  positions.push(...a0,...b0,...a1,...b0,...b1,...a1,...a1,...b1,...tip);
 }
 const blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute(positions,3));blade.computeVertexNormals();blade.computeBoundingSphere();
 const add=(name,geometry,material,items,leg,place,leafCards=false)=>{
  const mesh=new T.InstancedMesh(geometry,material,items.length);mesh.name=name;mesh.userData.cover=true;mesh.userData.leafCards=leafCards;
  items.forEach((p,i)=>{place(dummy,p,i);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);color.setHex(leg===2?0x9eb58b:0xc0b483).multiplyScalar(.7+random()*.4);mesh.setColorAt(i,color);});
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;scene.add(mesh);batches.push({mesh,max:items.length,leg});
 };
 for(let leg=1;leg<=3;leg++){
  const start=leg===1?210:leg===2?-1680:-3230;
  const patches=Array.from({length:100},()=>({x:(random()<.5?-1:1)*(24+random()*140),z:start-random()*1500,r:7+random()*16}));
  const clumps=Array.from({length:leg===2?1600:1250},()=>placeScenery(()=>{const c=patches[Math.floor(random()*patches.length)],a=random()*6.283,r=Math.sqrt(random())*c.r;return {x:c.x+Math.cos(a)*r,z:c.z+Math.sin(a)*r,h:.45+random()*.8,yaw:random()*6.283};},1.7)).filter(Boolean);
  add('Roadside / wind grass',blade,grass,clumps,leg,(o,p)=>{o.position.set(p.x,heightAt(p.x,p.z),p.z);o.scale.set(p.h*1.3,p.h, p.h*1.3);o.rotation.set(0,p.yaw,0);});
  const shrubs=Array.from({length:leg===2?360:260},()=>placeScenery(()=>{const c=patches[Math.floor(random()*patches.length)],a=random()*6.283,r=random()*c.r;return {x:c.x+Math.cos(a)*r,z:c.z+Math.sin(a)*r,w:2.3+random()*3.6,h:.85+random()*1.7,yaw:random()*6.283};},p=>p.w*.5+.15)).filter(Boolean);
  const cards=shrubs.flatMap(p=>[p,{...p,yaw:p.yaw+Math.PI/2}]);
  add('Roadside / scrub clusters',new T.PlaneGeometry(1,1),leaf,cards,leg,(o,p)=>{o.position.set(p.x,heightAt(p.x,p.z)+p.h*.5,p.z);o.scale.set(p.w,p.h,1);o.rotation.set(0,p.yaw,0);},true);
  const trees=Array.from({length:leg===2?82:55},()=>placeScenery(()=>({x:(random()<.5?-1:1)*(34+random()*130),z:start-random()*1500,h:3.3+random()*3.8,yaw:random()*6.283}),p=>p.h*.95+.2)).filter(Boolean);
  for(const p of trees)solids.push({x:p.x,z:p.z,w:.34,d:.34,minY:heightAt(p.x,p.z),maxY:heightAt(p.x,p.z)+p.h*.82,kind:'tree'});
  const trunk=new T.MeshStandardMaterial({color:0x695e47,roughness:1});
  add('Roadside / oak trunks',new T.CylinderGeometry(.1,.23,1,6),trunk,trees,leg,(o,p)=>{o.position.set(p.x,heightAt(p.x,p.z)+p.h*.4,p.z);o.scale.set(1,p.h*.8,1);o.rotation.set(0,p.yaw,.035);});
  add('Roadside / oak crowns',new T.PlaneGeometry(1,1),leaf,trees.flatMap(p=>[p,{...p,yaw:p.yaw+Math.PI/2}]),leg,(o,p)=>{o.position.set(p.x,heightAt(p.x,p.z)+p.h*.85,p.z);o.scale.set(p.h*1.9,p.h*1.3,1);o.rotation.set(0,p.yaw,0);},true);
 }
 return {batches,update(s,settings){time.value=s.elapsed||0;wind.value=settings.weather==='storm'?1:settings.weather==='rain'?.45:.15;}};
}
