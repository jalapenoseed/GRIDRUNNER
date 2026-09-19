import * as T from './three.js';
export class IntroDirector{
 constructor(){this.page=-1;this.time=0;}
 update(camera,page,dt,{bike,reducedMotion=false}){if(page!==this.page){this.page=page;this.time=0;}this.time+=dt;const travel=reducedMotion?0:Math.min(1,this.time/24),rig=bike.position;
  const shots=[{from:[18,11,75],to:[8,9,58],aim:[12,2,-74]},{from:[rig.x+7,rig.y+2.9,rig.z+7],to:[rig.x+5,rig.y+2.3,rig.z+5],aim:[rig.x,rig.y+1,rig.z+1]},{from:[43,3.1,-85],to:[46,2.8,-87],aim:[54,1.6,-97]}],shot=shots[page]||shots[0];
  camera.position.fromArray(shot.from.map((v,i)=>v+(shot.to[i]-v)*travel));camera.lookAt(new T.Vector3().fromArray(shot.aim));camera.fov=48;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
}
