import {STORY_SIGNALS} from './story-discoveries.js';
import * as T from './three.js';
import {FIELD_STATIONS,storyFlag} from './story-campaign.js';
export class StoryStationsWorld{
 constructor(scene,terrain){
  this.caches=STORY_SIGNALS.map(site=>{const group=new T.Group();group.name=site.id;group.position.set(site.x,terrain(site.x,site.z),site.z);scene.add(group);const box=new T.Mesh(new T.BoxGeometry(.75,.4,.55),new T.MeshStandardMaterial({color:0x526362,roughness:.8,metalness:.4}));box.position.y=.2;group.add(box);const stripe=new T.Mesh(new T.BoxGeometry(.55,.015,.04),new T.MeshBasicMaterial({color:site.sensor==='uv'?0xb29bff:site.sensor==='thermal'?0xffd887:0x99e7e4}));stripe.position.set(0,.408,.05);group.add(stripe);return {site,group,stripe};});
  this.sites=FIELD_STATIONS.map(site=>{
   const group=new T.Group();group.name='field-station-'+site.id;group.position.set(site.x,terrain(site.x,site.z),site.z);scene.add(group);
   const metal=new T.MeshStandardMaterial({color:0x293c3e,roughness:.72,metalness:.58}),rim=new T.MeshStandardMaterial({color:0x99cfc2,roughness:.45,metalness:.5}),light=new T.MeshBasicMaterial({color:0x49796b});
   const add=(w,h,d,x,y,z,material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);return mesh;};
   // Low charging mats leave walking and aircraft approach space open.
   for(let i=0;i<8;i++){add(1.25,.06,1.25,i*1.6,.03,0,metal);add(.9,.015,.045,i*1.6,.069,-.48,rim);add(.9,.015,.045,i*1.6,.069,.48,rim);}
   add(.38,.04,.8,-1.2,.025,0,metal);const indicator=add(.25,.03,.48,-1.2,.066,0,light);
   return {site,group,indicator};
  });
 }
 update(s,sensor='visible'){for(const {site,group,stripe}of this.caches){group.visible=site.leg===s.leg;stripe.visible=sensor===site.sensor;}for(const {site,group,indicator}of this.sites){group.visible=site.leg===s.leg;indicator.material.color.setHex(storyFlag(s,site.requires)&&s.story?.reserves[site.id]>0?0x9ae4ca:0x725848);}}
}
