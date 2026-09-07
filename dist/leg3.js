import * as T from './three.js';
export const leg3Defaults={securityOff:false,archiveKey:false,antennaAligned:false,capacitorReady:false,leg3Won:false,leg3Supply:false,ending:'',dialA:0,dialB:0,dialC:0,puzzleLock:0,towerCode:false};
export const leg3Sites=[{id:'l3security',name:'DRONE / SECURITY RELAY',x:65,z:-3510,y:20},{id:'l3key',name:'TECHNICIAN ARCHIVE',x:-55,z:-3780,y:2},{id:'l3antenna',name:'ANTENNA CONTROL',x:50,z:-3980,y:2},{id:'l3supply',name:'RESERVE BATTERY STATION',x:-35,z:-4120,y:2},{id:'l3capacitor',name:'CAPACITOR BANK',x:60,z:-4310,y:2},{id:'l3core',name:'BLACK START / CORE',x:0,z:-4590,y:2}];
export function objective3(s){if(!s.securityOff)return ['l3security','Use the engineer drone to disable the security relay.'];if(!s.archiveKey)return ['l3key','Recover the technician’s archive key and antenna bearing.'];if(!s.antennaAligned)return ['l3antenna','Align the antenna using the technician’s three dial values.'];if(!s.capacitorReady)return ['l3capacitor','Charge the capacitor bank: 15% bike energy.'];return ['l3core',s.leg3Won?'Leg 3 complete. Your decision is recorded.':'Reach the core and choose where the remaining power goes.'];}
export function antennaCorrect(s){return s.archiveKey&&s.dialA===3&&s.dialB===1&&s.dialC===4;}
export function endingCost(choice){return choice==='restore'?20:choice==='transmit'?8:Infinity;}
export function makeLegThreeWorld(scene){const g=new T.Group(),materials=new Map();function box(x,y,z,w,h,d,c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(c));m.position.set(x,y,z);g.add(m);return m;}
 box(0,.02,-3940,24,.1,1580,0x303941);for(let z=-3200;z>-4710;z-=50){box(0,.1,z,.2,.02,20,0xa8b4a5);for(const x of [-13,13])box(x,.45,z,.2,.8,40,0x647074);}
 for(const p of leg3Sites){box(p.x,1,p.z-3,3,2,3,0x42666b);box(p.x,2,p.z-1.4,1,.5,.1,0x62d8d0);box(p.x,p.y/2,p.z-5,2,p.y,2,0x556165);if(p.y<5){box(p.x+12,5,p.z-15,18,10,14,0x46545b);}}
 for(let z=-3350;z>-4620;z-=140){for(const x of [-100,100]){box(x,20,z,1,40,1,0x667576);box(x,34,z,22,.6,.6,0x667576);box(x,27,z,15,.5,.5,0x667576);}}
 // Antenna dish and capacitor cylinders identify the two different facilities.
 const dish=new T.Mesh(new T.SphereGeometry(7,16,12,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:0x98a8a5,side:T.DoubleSide}));dish.rotation.x=-Math.PI/3;dish.position.set(65,18,-3990);g.add(dish);
 for(let i=0;i<5;i++){const m=new T.Mesh(new T.CylinderGeometry(2,2,8,12),new T.MeshStandardMaterial({color:0x526a69}));m.position.set(70+i*5,4,-4320);g.add(m);}
 box(0,18,-4620,45,36,20,0x273c45);box(0,13,-4609,7,16,.5,0x416e71);
 for(let i=0;i<12;i++){const m=new T.Mesh(new T.ConeGeometry(30,55,5),new T.MeshStandardMaterial({color:0x686766}));m.position.set((i%2?1:-1)*190,17,-3260-i*120);g.add(m);}
 const batches=new Map();for(const m of [...g.children]){if(!m.isMesh||!m.material.isMeshStandardMaterial)continue;m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(geo);g.remove(m);m.geometry.dispose();}
 for(const [material,parts]of batches){const count=parts.reduce((n,p)=>n+p.attributes.position.array.length,0),pos=new Float32Array(count),norm=new Float32Array(count);let offset=0;for(const p of parts){pos.set(p.attributes.position.array,offset);norm.set(p.attributes.normal.array,offset);offset+=p.attributes.position.array.length;p.dispose();}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(norm,3));g.add(new T.Mesh(geo,material));}
 scene.add(g);return g;
}
