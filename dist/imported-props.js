import * as T from './three.js';
import {GLTFLoader} from './GLTFLoader.js';
import {colliderToSolid} from './remesh-gltf.js';

// Remeshed TRELLIS / CC0 GLBs live under assets/imported/. Missing files stay silent;
// the campaign never depends on a generated mesh being present.
export const IMPORTED_MANIFEST=[
  // {file:'relay-shed.glb', x:62, z:-108, height:3.4, collider:{x:0,z:0,w:1.6,d:2.1,minY:0,maxY:3.4,kind:'imported'}}
];

export class ImportedProps{
  constructor(scene,solids=[],{manifest=IMPORTED_MANIFEST,assets=true}={}){
    this.scene=scene;this.assets=assets;this.slots=[];this.errors=[];
    for(const item of manifest){
      const slot=new T.Group();slot.name='Imported / '+item.file;slot.position.set(item.x,0,item.z);slot.rotation.y=item.yaw||0;scene.add(slot);
      if(item.collider)solids.push(colliderToSolid(item.collider,{x:item.x,z:item.z}));
      this.slots.push({item,slot,loaded:false});
    }
  }
  update(visible,quality){
    if(!this.assets||!visible||quality==='LOW')return;
    for(const r of this.slots){
      if(r.loaded||r.requested)continue;r.requested=true;
      new GLTFLoader().loadAsync('./assets/imported/'+r.item.file).then(gltf=>{
        const model=gltf.scene,bounds=new T.Box3().setFromObject(model),size=new T.Vector3(),center=new T.Vector3();
        bounds.getSize(size);bounds.getCenter(center);
        const scale=r.item.height/Math.max(.01,size.y);
        model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
        r.slot.add(model);r.loaded=true;
      }).catch(()=>{this.errors.push(r.item.file);});
    }
  }
}