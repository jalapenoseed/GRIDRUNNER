import * as T from './three.js';
import {instanceParts,fillInstances} from './fleet-commander-renderer.js';
import {AircraftBeacons} from './aircraft-beacons.js';
export class InWorldCommanderVisuals{
 constructor(scene,fleet){this.fleet=fleet;this.root=new T.Group();this.root.name='Admin fleet / world-space test aircraft';scene.add(this.root);this.proxy={};this.detail={};this.colors=new Map();
  this.lamps=new AircraftBeacons(this.root);this.beacons=this.lamps.points;
 }
 update(test,camera,{quality='HIGH',pixelRatio=1,reducedMotion=false}={}){
  this.root.visible=!!test.program;if(!this.root.visible)return;const drones=test.drones.map(d=>({...d,pos:d.previousPos&&d.system.mode!=='DOCK'?d.previousPos.map((v,j)=>v+(d.system.pos[j]-v)*test.renderAlpha):d.system.pos,mode:d.system.mode,yaw:d.system.yaw,attitude:{pitch:d.system.pitch+(reducedMotion||test.config.options.reducedMotion?0:d.attitude.pitch),roll:d.system.roll+(reducedMotion||test.config.options.reducedMotion?0:d.attitude.roll)}}));
  for(const type of ['scout','relay','cargo','engineer']){const records=drones.filter(d=>d.type===type),reference=this.fleet.records[type];if(records.length){if(!this.proxy[type]){const proxy=reference.proxy.clone(true);proxy.parent=null;this.proxy[type]=instanceParts(proxy,this.root);}if(quality!=='LOW')this.fleet.load(type);if(reference.model&&!this.detail[type]){const model=reference.model.clone(true);model.parent=null;this.detail[type]=instanceParts(model,this.root,100);}}
   const near=[],far=[],large=drones.length>256;for(const d of records){const distance=Math.hypot(d.pos[0]-camera.position.x,d.pos[1]-camera.position.y,d.pos[2]-camera.position.z);if(quality!=='LOW'&&this.detail[type]&&distance<36&&near.length<(large?12:100))near.push(d);else if(d.system.mode==='DOCK'||d.queued||!large||distance<110&&far.length<(quality==='LOW'?64:128))far.push(d);}if(this.proxy[type])fillInstances(this.proxy[type],far);if(this.detail[type])fillInstances(this.detail[type],near);
  }
  this.lamps.update(drones,camera,{time:test.elapsed,size:test.config.options.beaconSize,pixelRatio,reducedMotion:reducedMotion||test.config.options.reducedMotion});
 }
 clear(){this.root.visible=false;for(const parts of [...Object.values(this.proxy),...Object.values(this.detail)])for(const part of parts)part.mesh.count=0;this.lamps.clear();}
}
