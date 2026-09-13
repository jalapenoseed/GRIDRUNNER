import * as T from './three.js';
import {AssetKit} from './asset-kit.js';
import {RELAY_SITE,RELAY_HOTSPOTS} from './relay-house.js';
import {makePerson} from './visuals.js';
// A raised cabin gives the cellar real space below the floor. The service stair
// is a ramp under visible treads so walking never needs teleports or new controls.
export function relayFloor(x,z,eyeY=1.7){
 if(x>=-90&&x<=-82&&z>=-70&&z<=-57)return (-57-z)/13*3;
 if(x>=-101&&x<=-95&&z>=-104&&z<=-92)return (z+104)/12*3;
 if(x>-103&&x<-69&&z>-106&&z<-70&&eyeY>3.1)return 3;
 return 0;
}
export function relayInside(x,z){return x>-103&&x<-69&&z>-106&&z<-70;}
export function makeRelayHouseWorld(scene,solids,{assets=true}={}){
 const root=new T.Group();root.name='Relay House / explorable compound';scene.add(root);const mats=new Map(),staticParts=new Map(),unit=new T.BoxGeometry(1,1,1),kit=new AssetKit(assets),details=[];
 const mat=(color,emissive=0)=>{const key=color+':'+emissive;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:.84,metalness:.2,emissive,emissiveIntensity:emissive?1:0}));return mats.get(key);};
 const shape=(geometry,x,y,z,c,parent=root)=>{const m=new T.Mesh(geometry,mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const box=(x,y,z,w,h,d,c,solid=false,staticMesh=true)=>{const m=new T.Mesh(unit,mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);if(staticMesh){if(!staticParts.has(m.material))staticParts.set(m.material,[]);m.updateMatrix();staticParts.get(m.material).push(m.matrix.clone());}else root.add(m);if(solid)solids.push({x,z,w:w/2+.22,d:d/2+.22,minY:y-h/2,maxY:y+h/2,relayHouse:true});return m;};
 const sign=(text,x,y,z,w=3,h=.6,color='#eac993',rotation=0)=>{const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#152426';c.fillRect(0,0,768,160);c.strokeStyle=color;c.lineWidth=3;c.strokeRect(9,9,750,142);c.fillStyle=color;c.font='bold 45px monospace';c.textAlign='center';c.fillText(text,384,99,720);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,toneMapped:false}));m.position.set(x,y,z);m.rotation.y=rotation;root.add(m);return m;};
 // Footpath from the road, gate and retaining walls guide the player to the porch.
 box(-47,.04,-58,70,.08,7,0x756f5b);box(-86,.04,-64,8,.08,16,0x777769);
 for(const x of [-106,-66])for(let z=-111;z<=-55;z+=7)box(x,.6,z,.25,1.2,.25,0x615e4c);
 for(const x of [-106,-66])box(x,.75,-83,.09,.08,56,0x6c705d);
 sign('RELAY HOUSE  /  SERVICE 07',-57,2.5,-58,7,.9);box(-60,1.2,-58,.14,2.4,.14,0x434d49);box(-54,1.2,-58,.14,2.4,.14,0x434d49);
 // Cellar walls, light wells and headroom. Basement floor remains ground level.
 box(-86,.01,-88,34,.08,36,0x383f3e);
 box(-103,1.5,-88,.45,3,36,0x555b56,true);box(-69,1.5,-88,.45,3,36,0x555b56,true);box(-86,1.5,-106,34,3,.45,0x555b56,true);box(-86,1.5,-70,34,3,.45,0x555b56,true);
 // Main floor split around the stair opening at the northwest corner.
 box(-82,2.9,-88,26,.2,36,0x716851,true);box(-99,2.9,-81,8,.2,22,0x716851,true);box(-99,2.9,-105,8,.2,2,0x716851,true);box(-102,2.9,-98,2,.2,12,0x716851,true);
 // Front door is open; walls use separate collision volumes, including lintels.
 box(-96.5,5.5,-70,13,5,.45,0x9a8466,true);box(-75.5,5.5,-70,13,5,.45,0x9a8466,true);box(-86,7.55,-70,8,.9,.45,0x776f59,true);
 box(-103,5.5,-88,.45,5,36,0x9a8466,true);box(-69,5.5,-88,.45,5,36,0x9a8466,true);box(-86,5.5,-106,34,5,.45,0x9a8466,true);
 box(-95,5.5,-88,16,5,.25,0x79785f,true);box(-74,5.5,-88,10,5,.25,0x79785f,true);box(-84,7.55,-88,6,.9,.25,0x79785f,true);
 box(-86,5.5,-100,.22,5,12,0x79785f,true);
 // A collidable roof; FPV cannot clip through to reach the dish.
 box(-86,8.28,-88,36,.5,38,0x374440,true);
 for(let x=-103;x<=-69;x+=1.7)box(x,8.56,-88,.12,.04,37,0x68716a);
 for(const x of [-102.7,-69.3])for(let z=-103;z<=-74;z+=4){box(x,5.4,z,.05,3.8,.07,0x625b4c);}
 // Broad entry ramp with weathered plank treads and rails.
 for(let i=0;i<26;i++){const z=-57-(i+.5)*.5,y=(i+.5)/26*3;box(-86,y-.06,z,8,.12,.53,0x7e735c);}
 for(let i=0;i<8;i++){const z=-58-i*1.5,y=(-57-z)/13*3;for(const x of [-90,-82])box(x,y+.65,z,.12,1.3,.12,0x606b60);}
 sign('PORCH / KITCHEN',-86,7,-69.7,5,.7);sign('OFFICE →',-83.2,6.9,-87.8,3.4,.55);sign('CELLAR ↓',-97.8,5,-91.6,3,.6);
 // Interior stair descends three metres; collider floor split leaves real access.
 for(let i=0;i<24;i++){const z=-104+(i+.5)*.5,y=(i+.5)/24*3;box(-98,y-.07,z,6,.14,.52,0x525e56);}
 box(-94.8,3.65,-98,.12,1.3,12,0x59675f,true);
 // Kitchen counter, sink, stove, refrigerator, office desk and CRT.
 box(-75,3.55,-85,8,1.1,1.6,0x657970,true);box(-75,4.16,-85,8,.12,1.8,0xa4a792);
 box(-76,4.25,-85,1.7,.12,1.2,0x3b5356);shape(new T.TorusGeometry(.4,.032,6,16,Math.PI),-76,4.7,-85,0x9ca49b).rotation.y=Math.PI/2;
 for(const x of [-73,-72])shape(new T.CylinderGeometry(.24,.24,.03,16),x,4.25,-85,0x202b2a);
 box(-72,4.2,-81,1.5,2.4,1.3,0x98a69a,true);box(-72,4.6,-80.33,1.35,1.38,.04,0xb1bca7);box(-72,3.62,-80.33,1.35,.48,.04,0x83988d);box(-72.48,4.42,-80.27,.06,.5,.08,0x394d46);
 box(-76,3.85,-97,4,1.7,1.8,0x62694f,true);box(-76,4.75,-97,4.2,.14,2,0x8d7a55);
 box(-76,5.26,-97.1,1.3,.95,.8,0x283b37);box(-76,5.3,-96.67,1.13,.72,.04,0x4b6555);
 const crt=sign('NO CARRIER',-76,5.3,-96.63,1.05,.55,'#96c98a');
 box(-76,4.87,-96.4,1.15,.08,.4,0x48594f);
 sign('147.20 MHz / NORTH',-78,5.3,-105.73,3.8,.85);box(-78,5.3,-105.8,4.2,1.8,.12,0x79674a);
 sign('OPERATOR / NIGHT SHIFT',-90,6.7,-105.72,5,.65);
 // Hero generator: cage, alternator, fuel tank, fins, exhaust and start panel.
 const generator=new T.Group();root.add(generator);generator.position.set(-59,0,-75);
 const gb=(x,y,z,w,h,d,color)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);generator.add(m);return m;};
 gb(0,.32,0,2.5,.18,1.7,0x273b39);gb(0,1.45,0,2.3,.55,1.5,0x667d68);gb(.48,.8,0,1.05,.95,1.2,0x48504a);gb(-.7,.77,0,.7,.8,1,0xa78952);
 for(const x of [-1.2,1.2])for(const z of [-.8,.8])gb(x,.83,z,.07,1.2,.07,0x708176);
 for(let i=0;i<9;i++)gb(.12+i*.08,.9,.64,.032,.6,.04,0x78837c);
 const alternator=shape(new T.CylinderGeometry(.43,.43,.7,16),-.7,.75,0,0x4d5e55,generator);alternator.rotation.z=Math.PI/2;
 gb(.9,1.22,-.6,.14,.8,.14,0x323d39);gb(-.3,1.27,.79,.4,.27,.04,0x1a302c);
 sign('GOVERNOR / WRENCH',-59,2.1,-74.9,3.5,.45);
 const glowMat=mat(0x67e4c4,0x67e4c4),indicator=new T.Mesh(new T.SphereGeometry(.06,8,6),glowMat);indicator.position.set(-59.25,1.3,-74.17);root.add(indicator);
 // Authored equipment packs, with readable low-detail stand-ins on LOW.
 const proxy=(w,h,d,color)=>{const g=new T.Group(),m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.y=h/2;g.add(m);return g;};
 kit.place(root,'GR_Workbench_02.glb',[-59,0,-89],1.3,proxy(3.5,1.3,1.3,0x736850));
 kit.place(root,'GR_FieldRadio_02.glb',[-77,.78,-102],.8,proxy(1.2,.8,.6,0x486a5b));box(-77,.39,-102,3,.78,1.4,0x39463b,true);
 kit.place(root,'GR_SupplyCrate_02.glb',[-93,0,-102],.85,proxy(1.5,.85,1,0x7e754f));
 kit.place(root,'GR_BreakerPanel_01.glb',[-72,1,-105],1.5,proxy(.9,1.5,.25,0x526d5c));
 kit.place(root,'GR_CampCot_02.glb',[-90,3,-101],.65,proxy(2.5,.65,4,0x647660));
 kit.place(root,'GR_WaterBarrel_02.glb',[-63,0,-93],1.6,proxy(1,1.6,1,0x667767));
 kit.place(root,'GR_CableSpool_01.glb',[-64,0,-85],1,proxy(1.3,1,1.3,0x807558));
 kit.place(root,'GR_TarpShelter_02.glb',[-59,0,-89],3.8,null);
 kit.place(root,'GR_UtilityPole_01.glb',[-47,0,-83],10,null);
 kit.place(root,'GR_PadTransformer_01.glb',[-52,0,-84],1.7,proxy(2,1.7,1.5,0x4c695e));
 sign('POWERED WORKBENCH',-59,2,-90.7,4,.6);sign('FILTER / RADIO RACK',-77,2.4,-105.7,4,.6,'#91c8b0');
 const cook=makePerson(-77,-75,0x8d7755);cook.position.y=3;cook.name='Len / relay caretaker';root.add(cook);
 const notebook=box(-89,3.76,-98.5,.55,.05,.8,0xc5b587,false,false);notebook.rotation.y=.3;
 // Articulated dish and physical roof beacon.
 const dishPivot=new T.Group();dishPivot.position.set(-78,9,-94);root.add(dishPivot);
 const mast=shape(new T.CylinderGeometry(.14,.22,1.1,10),-78,8.95,-94,0x697c70);
 const bowl=shape(new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.3,.02),new T.Vector2(.8,.15),new T.Vector2(1.3,.44),new T.Vector2(1.7,.85)],24),0,.7,0,0x98a99a,dishPivot);bowl.material=new T.MeshStandardMaterial({color:0x98a99a,side:T.DoubleSide,metalness:.5,roughness:.45});bowl.rotation.x=.9;
 shape(new T.CylinderGeometry(.025,.025,2,8),0,1.7,0,0x536b65,dishPivot);const lens=shape(new T.SphereGeometry(.09,8,6),0,2.5,0,0xd5aa6a,dishPivot);lens.material=glowMat;
 // Practical lights guide the stairwell and make restored rooms readable.
 const lights=[];for(const [x,y,z,color,intensity]of [[-86,6.8,-76,0xffc789,40],[-77,6.9,-99,0x85e5c8,30],[-98,2.35,-103,0xeac385,30],[-80,2.3,-100,0x84c9b1,28],[-59,3,-87,0xffc789,40]]){const l=new T.PointLight(color,intensity,13,1.5);l.position.set(x,y,z);root.add(l);lights.push(l);box(x,y+.07,z,.45,.08,.3,0x777d69);}
 for(const [material,matrices]of staticParts){const m=new T.InstancedMesh(unit,material,matrices.length);matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;m.castShadow=m.receiveShadow=true;m.computeBoundingSphere();root.add(m);}
 const halo=new T.Mesh(new T.TorusGeometry(.35,.018,4,24),new T.MeshBasicMaterial({color:0xa8e8c2,depthTest:false,transparent:true,opacity:.65}));halo.visible=false;root.add(halo);
 return {root,kit,lights,dishPivot,crt,hotspots:RELAY_HOTSPOTS,update(s,time,quality,nearest){const r=s.relayHouse,distance=Math.hypot(s.pos.x-RELAY_SITE.x,s.pos.z-RELAY_SITE.z);root.visible=s.leg===1&&distance<(quality==='LOW'?300:650);kit.update(root.visible&&distance<180,quality);for(const l of lights){l.visible=root.visible&&quality!=='LOW';l.intensity=r.power?(l.position.y<3?28:35):l.position.x===-98?8:1.2;}glowMat.emissiveIntensity=r.power?2:.05;dishPivot.rotation.y+=( (r.dishAligned?Math.PI:.55)-dishPivot.rotation.y)*.08;generator.rotation.z=r.power?Math.sin(time*27)*.003:0;crt.material.color.setHex(r.power?0xffffff:0x28382f);cook.rotation.y=Math.atan2(s.pos.x-cook.position.x,s.pos.z-cook.position.z);halo.visible=nearest?.kind==='relayHouse';if(halo.visible){halo.position.set(nearest.x,nearest.y+.45,nearest.z);halo.lookAt(s.pos);halo.scale.setScalar(.9+Math.sin(time*3)*.05);}}};
}
