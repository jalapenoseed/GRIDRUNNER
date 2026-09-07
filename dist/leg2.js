import * as T from './three.js';
export const leg2Defaults={leg:1,calMet:false,intakeCleared:false,phaseNote:false,phaseStep:0,hydroRestored:false,relayPowered:false,leg2Won:false,leg2Cache:false};
export const leg2Sites=[
 {id:'l2cal',name:'CAL / SPILLWAY CAMP',x:45,z:-1810,y:2},
 {id:'l2note',name:'MAINTENANCE LUNCHBOX',x:70,z:-2260,y:2},
 {id:'l2intake',name:'DRONE / INTAKE RELEASE',x:118,z:-2380,y:22},
 {id:'l2phase',name:'WATERWORKS BREAKERS',x:65,z:-2355,y:2},
 {id:'l2hydro',name:'RIVER / TURBINE DOCK',x:60,z:-2340,y:2},
 {id:'l2cache',name:'SERVICE CACHE',x:-35,z:-2720,y:2},
 {id:'l2archive',name:'NORTH RELAY / ARCHIVE',x:0,z:-3020,y:2}
];
export function leg2Objective(s){
 if(!s.calMet)return ['l2cal','Meet Cal at the spillway camp.'];
 if(!s.intakeCleared)return ['l2intake','Fly to the elevated intake release. SPACE rises; E releases.'];
 if(!s.phaseNote)return ['l2note','Find the maintenance lunchbox beside the waterworks.'];
 if(!s.hydroRestored)return ['l2phase','Restore the waterworks using the maintenance sequence.'];
 if(!s.relayPowered)return ['l2archive','Charge at the river, then supply 12% bike energy to the north relay.'];
 if(!s.leg2Won)return ['l2archive','Decode the archive. Keep 8% bike energy available.'];
 return ['l2archive','Leg 2 complete. The spillway is alive; the northern route is recorded.'];
}
export function phaseInput(s,phase){
 if(!s.intakeCleared)return {step:s.phaseStep,restored:false,message:'The intake is still locked. Release it with the drone first.'};
 if(!s.phaseNote)return {step:s.phaseStep,restored:false,message:'Read the maintenance note in the lunchbox first.'};
 if(s.hydroRestored)return {step:3,restored:true,message:'Waterworks already restored.'};
 const step=['B','A','C'][s.phaseStep]===phase?s.phaseStep+1:0;
 return {step,restored:step===3,message:step===3?'Waterworks restored. River turbine charging is available.':step===0?'Sequence rejected. Breakers reset; check your note.':'Feed '+phase+' latched. Continue the sequence.'};
}
export function hydroAvailable(s,trailer){return s.leg===2&&s.calMet&&s.intakeCleared&&Math.hypot(trailer.x-60,trailer.z+2340)<85;}
export function makeLegTwoWorld(scene,makePerson){
 const g=new T.Group(),mats=new Map();const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);};
 function box(x,y,z,w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);g.add(m);return m;}
 function sign(x,z,text){const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d');a.fillStyle='#11252a';a.fillRect(0,0,512,128);a.strokeStyle='#66c9c9';a.lineWidth=6;a.strokeRect(3,3,506,122);a.fillStyle='#d5e7df';a.font='bold 30px monospace';a.textAlign='center';a.fillText(text,256,75);const tex=new T.CanvasTexture(c),m=new T.Mesh(new T.PlaneGeometry(8,2),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));m.position.set(x,3,z);g.add(m);box(x-3.5,1.2,z,.12,2.5,.12,0x505e5f);box(x+3.5,1.2,z,.12,2.5,.12,0x505e5f);}
 box(0,.03,-2450,24,.12,1450,0x333c3c);for(let z=-1750;z>-3190;z-=35){box(0,.105,z,.24,.025,15,0xb7a16a);for(const x of [-10.6,10.6])box(x,.11,z,.17,.02,32,0xbbbdac);}
 for(const z of [-1810,-2340,-2720])box(30,.055,z,90,.13,7,0x61594c);
 // A flowing spillway channel remains off the rideable road. The turbine dock is on the bank.
 box(117,-.15,-2380,42,.35,560,0x284e57);for(const x of [94,140])box(x,.55,-2380,4,1.2,565,0x737366);
 const water=new T.Group();for(let i=0;i<22;i++){const stripe=new T.Mesh(new T.PlaneGeometry(35,.8),new T.MeshBasicMaterial({color:0x96c5ba,transparent:true,opacity:.3}));stripe.rotation.x=-Math.PI/2;stripe.position.set(117,.07,-2115-i*24);water.add(stripe);}g.add(water);
 box(117,7,-2379,44,14,5,0x626e6d);box(118,19,-2380,3,6,3,0x45585b);box(118,22,-2377.9,2,1,.2,0x61dcce);box(62,.65,-2340,24,1.3,14,0x7a7c70);
 for(let i=0;i<3;i++){box(60+i*5,1.6,-2358,3,3.2,2,0x405153);box(60+i*5,2,-2356.9,1.7,.7,.1,0xc4a661);}box(70,.6,-2260,2,1.2,2,0x8b6746);
 box(47,2,-1818,15,4,8,0x585b4e);box(45,.5,-1810,2,1,2,0x747b63);g.add(makePerson(49,-1810,0x72806b));
 box(-35,.7,-2720,3,1.4,2,0x846c42);box(14,5,-3035,24,10,18,0x505e61);box(0,1.5,-3024,3,3,2,0x3d555b);
 const lights=[];for(const z of [-1817,-2348,-3030]){box(22,6,z,.16,12,.16,0x556464);const lamp=new T.Mesh(new T.SphereGeometry(.4,8,6),new T.MeshBasicMaterial({color:0x223b3a}));lamp.position.set(22,12,z);g.add(lamp);lights.push(lamp);}
 for(let i=0;i<18;i++){const x=(i%2?1:-1)*(175+(i%3)*30),z=-1800-i*75;const rock=new T.Mesh(new T.ConeGeometry(30+i%4*7,45+i%3*12,5),mat(0x81705c));rock.position.set(x,14,z);rock.rotation.y=i;g.add(rock);}
 sign(0,-1720,'LEG 2 / THE SPILLWAY');sign(38,-1800,'CAL / FIELD CAMP');sign(60,-2324,'TURBINE DOCK');sign(-9,-3000,'NORTH RELAY');
 // Merge static untextured geometry to keep the extended route inexpensive to draw.
 const batches=new Map();for(const m of [...g.children]){if(!m.isMesh||!m.material.isMeshStandardMaterial)continue;m.updateMatrix();const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geo.applyMatrix4(m.matrix);if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(geo);g.remove(m);m.geometry.dispose();}
 for(const [material,parts]of batches){const count=parts.reduce((n,p)=>n+p.attributes.position.array.length,0),pos=new Float32Array(count),norm=new Float32Array(count);let offset=0;for(const p of parts){pos.set(p.attributes.position.array,offset);norm.set(p.attributes.normal.array,offset);offset+=p.attributes.position.array.length;p.dispose();}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(norm,3));g.add(new T.Mesh(geo,material));}
 scene.add(g);return {group:g,water,lights};
}
