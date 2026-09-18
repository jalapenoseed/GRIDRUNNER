import * as T from './three.js';
import {fieldMaterial,fieldBox} from './field-fabrication.js';
import {makePerson,combineStatic} from './visuals.js';
export const SERVICE_DISTRICTS=[{id:'east-service',name:'EAST SERVICE / STORES',x:180,z:-180,leg:1,roadX:145,roadZ:-110},{id:'west-depot',name:'WEST DEPOT / SORTING',x:-176,z:-234,leg:1,roadX:-115,roadZ:-141},{id:'drywell-annex',name:'DRYWELL / SERVICE ANNEX',x:177,z:-596,leg:1,roadX:115,roadZ:-551}];
export function fieldSign(title,subtitle='',width=6,height=1.25){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#c4b694';c.fillRect(0,0,1024,256);c.fillStyle='#26352f';c.fillRect(0,0,24,256);c.strokeStyle='#756e57';c.lineWidth=3;c.strokeRect(35,16,973,224);c.textAlign='left';let size=74;c.font='700 '+size+'px sans-serif';while(c.measureText(title).width>916&&size>24){size-=2;c.font='700 '+size+'px sans-serif';}c.fillStyle='#24362f';c.fillText(title,55,116);c.font='500 29px monospace';c.fillText(subtitle.toUpperCase(),58,194);for(const x of [44,980])for(const y of [25,231]){c.fillStyle='#4b4f44';c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();}const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map:texture,roughness:.86,metalness:.05,side:T.DoubleSide}));}
export class ServiceDistrict{
 constructor(scene,solids,kit,settlements){this.groups=[];this.colliderCount=0;const wall=fieldMaterial('concrete',0xb0a693),metal=fieldMaterial('metal',0x718078),paint=fieldMaterial('paint',0x7f7860),road=new T.MeshStandardMaterial({color:0x777567,roughness:1});
  for(const site of SERVICE_DISTRICTS){const group=new T.Group();group.name=site.name;group.position.set(site.x,0,site.z);scene.add(group);this.groups.push({site,group});const solid=(x,y,z,w,h,d,material,kind='service-prop')=>{const mesh=fieldBox(group,x,y,z,w,h,d,material);solids.push({id:site.id+'-'+this.colliderCount++,x:site.x+x,z:site.z+z,w:w/2+.12,d:d/2+.12,minY:y-h/2,maxY:y+h/2,kind});return mesh;};
   // Open south faces and separate roofs preserve real interiors and clear doors.
   for(const x of [-9,9]){fieldBox(group,x,.045,-4,15,.09,14,road);solid(x,2.6,-11,15,5.2,.3,wall,'service-building');solid(x-7.5,2.6,-4,.3,5.2,14,wall,'service-building');solid(x+7.5,2.6,-4,.3,5.2,14,wall,'service-building');solid(x,5.3,-4,16,.22,15,metal,'service-roof');solid(x,4.6,4,15,.18,3,paint,'service-awning');for(const side of [-1,1])solid(x+side*7.1,2.25,5.3,.12,4.5,.12,metal,'pole');
    for(let n=0;n<8;n++)fieldBox(group,x-6.8+n*1.9,2.6,-10.81,.025,5.1,.04,metal);
    for(const wx of [-4,4]){fieldBox(group,x+wx,2.9,-10.76,2.3,1.35,.035,new T.MeshStandardMaterial({color:0x243638,roughness:.3,metalness:.25}));fieldBox(group,x+wx,2.9,-10.71,.06,1.35,.06,metal);fieldBox(group,x+wx,2.9,-10.71,2.3,.045,.06,metal);}
    const sign=fieldSign(x<0?'FIELD STORES':'SERVICE BAY',x<0?'sort • repair • reuse':'keep the access clear',6,1.25);sign.position.set(x,3.55,3.1);group.add(sign);
   }
   // Colliders match the kit props even before detailed assets finish loading.
   const props=[['GR_Workbench_02.glb',-11,-7,1.2,3.2,1.4],['GR_SupplyCrate_02.glb',-14,-4,1.1,1.2,1.2],['GR_WaterBarrel_02.glb',14,-7,1.55,1.1,1.1],['GR_CableSpool_01.glb',12,-4,1.4,1.8,1.8],['GR_BreakerPanel_01.glb',5,-10.6,1.4,.8,.3]];
   for(const [file,x,z,height,w,d]of props){const proxy=solid(x,height/2,z,w,height,d,paint,/Breaker/.test(file)?'electrical':'service-equipment');if(kit){group.remove(proxy);const localProxy=proxy.clone();localProxy.position.set(0,height/2,0);kit.place(group,file,[x,0,z],height,localProxy);}}
   // Gravel lane joins the existing approach, with no collider over the road.
   const bend=[site.x,site.roadZ];for(const [a,b]of [[[site.roadX,site.roadZ],bend],[bend,[site.x,site.z+8]]]){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),mesh=fieldBox(group,(a[0]+b[0])/2-site.x,.055,(a[1]+b[1])/2-site.z,6,.08,length,road);mesh.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}
   for(const x of [-16,16]){solid(x,.5,8,.45,1,.45,paint,'bollard');solid(x,.88,8,.47,.12,.47,metal,'bollard');}
   const way=fieldSign(site.name.split(' / ')[0],site.name.split(' / ')[1]+' / SOUTH ENTRANCE',10,2);way.position.set(0,6,1);group.add(way);solid(0,4.2,.8,.16,3.8,.16,metal,'pole');
   for(const [i,x]of [-9,9].entries()){const actor=makePerson(x,4,i?0x686454:0x737d62);group.add(actor);settlements.actors.push({n:{id:site.id+'-worker-'+i,stops:[[x,4],[x,-3],[x+2,5],[x-2,5]]},site,actor});}
   combineStatic(group);for(const mesh of group.children)if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;}
  }
 }
 update(state){for(const {site,group}of this.groups)group.visible=state.leg===site.leg&&Math.hypot(state.pos.x-site.x,state.pos.z-site.z)<650;}
}
