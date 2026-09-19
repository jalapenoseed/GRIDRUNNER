import * as T from './three.js';
import {makePerson,makeBike,heightAt} from './visuals.js';
import {obstruction} from './drone-system.js';

// Authored sensor signals are deliberately separate from pixel inference.
export const LAB_CONTACTS=[
 {id:'lab-uv',name:'Fluorescent inspection stripe',kind:'OBJECTIVE',x:154,y:.12,z:98,sensors:['uv'],readings:{uv:'Fluorescent test stripe · coating confirmed'}},
 {id:'lab-thermal',name:'Warm calibration housing',kind:'ENERGY',x:169,y:1.4,z:95,sensors:['thermal'],readings:{thermal:'Warm test housing · inspect before handling'}},
 {id:'lab-rf',name:'Calibration transmitter',kind:'SIGNAL',x:148,y:2.4,z:94,sensors:['rf'],readings:{rf:'Local test beacon · steady carrier'}}
];
export const FIELD_UV=[
 {id:'uv-maintenance-entry',name:'Maintenance bypass paint',kind:'OBJECTIVE',x:-28,y:.12,z:-200,sensors:['uv'],readings:{uv:'Fluorescent route paint · maintenance access continues west of the road'}},
 {id:'uv-maintenance-bay',name:'Service inspection mark',kind:'OBJECTIVE',x:-58,y:.12,z:-241,sensors:['uv'],readings:{uv:'Fluorescent service mark · inspect the nearby latch panel'}}
];
export function recordLabScan(session,tags,mode){
 if(session?.job!=='sensors'||!['uv','thermal','rf'].includes(mode))return false;
 if(!tags.some(t=>t.id==='lab-'+mode&&t.sensor===mode))return false;
 session.sensorReadings||=[];if(!session.sensorReadings.includes(mode))session.sensorReadings.push(mode);
 if(session.sensorReadings.length===3&&!session.complete){session.complete=true;return true;}return false;
}
export function detectionIoU(a,b){const w=Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1)),h=Math.max(0,Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1)),area=w*h;return area/Math.max(1,(a.x2-a.x1)*(a.y2-a.y1)+(b.x2-b.x1)*(b.y2-b.y1)-area);}
export function compareLabDetections(predictions,references){
 const unused=new Set(references.map((_,i)=>i));let matches=0;
 for(const p of [...predictions].sort((a,b)=>b.score-a.score)){
  let best=-1,overlap=.3;for(const i of unused){const r=references[i],v=p.label===r.label?detectionIoU(p,r):0;if(v>overlap){overlap=v;best=i;}}
  if(best>=0){unused.delete(best);matches++;}
 }
 return {matches,missed:unused.size,extra:predictions.length-matches,total:references.length};
}
export class SensorLabWorld{
 constructor(scene,solids){
  this.root=new T.Group();scene.add(this.root);this.marks=[];this.targets=[];this.hotRoots=[];
  for(const c of [...LAB_CONTACTS.filter(c=>c.sensors.includes('uv')),...FIELD_UV]){
   const mesh=new T.Mesh(new T.PlaneGeometry(1.8,.45),new T.MeshBasicMaterial({color:0xb7ff75,side:T.DoubleSide,toneMapped:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(c.x,heightAt(c.x,c.z)+.12,c.z);mesh.visible=false;this.root.add(mesh);this.marks.push(mesh);
  }
  const person=makePerson(158,97,0xc4a779);this.root.add(person);this.targets.push({object:person,label:'person'});this.hotRoots.push(person);
  const bike=makeBike();bike.position.set(164,heightAt(164,97),97);bike.rotation.y=Math.PI/2;this.root.add(bike);this.targets.push({object:bike,label:'bicycle'});
  const housing=new T.Mesh(new T.BoxGeometry(1.2,1.4,1),new T.MeshStandardMaterial({color:0x8c7955,roughness:.7}));housing.position.set(169,.7,95);this.root.add(housing);this.hotRoots.push(housing);solids.push({x:169,z:95,w:.6,d:.5,minY:0,maxY:1.4});
  const mast=new T.Mesh(new T.CylinderGeometry(.045,.045,2.4,8),new T.MeshStandardMaterial({color:0x829fa1}));mast.position.set(148,1.2,94);this.root.add(mast);
  const lamp=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:0x76ccc3}));lamp.position.set(148,2.4,94);this.root.add(lamp);
 }
 update(leg,mode,camera){this.root.visible=leg===1;for(const m of this.marks)m.visible=leg===1&&mode==='uv'&&camera.position.distanceTo(m.position)<45;}
 references(camera,solids,width,height){
  this.root.updateMatrixWorld(true);camera.updateMatrixWorld();const from=camera.position.toArray(),view=camera.matrixWorldInverse,refs=[];
  for(const {object,label} of this.targets){
   const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3());
   if(center.distanceTo(camera.position)>60||center.clone().applyMatrix4(view).z>=-camera.near||obstruction(from,center.toArray(),solids))continue;
   const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z);if(p.clone().applyMatrix4(view).z>=-camera.near)continue;corners.push(p.project(camera));}
   if(corners.length!==8)continue;
   const x1=Math.max(0,Math.min(...corners.map(p=>(p.x+1)/2*width))),x2=Math.min(width,Math.max(...corners.map(p=>(p.x+1)/2*width))),y1=Math.max(0,Math.min(...corners.map(p=>(1-p.y)/2*height))),y2=Math.min(height,Math.max(...corners.map(p=>(1-p.y)/2*height)));
   if(x2-x1>4&&y2-y1>4)refs.push({label,x1,y1,x2,y2});
  }return refs;
 }
}
