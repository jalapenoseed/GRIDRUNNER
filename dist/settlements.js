import * as T from './three.js';
import {makePerson} from './visuals.js';
import {SETTLEMENT_LAYOUT} from './scene-layout.js';
export const SETTLEMENTS=SETTLEMENT_LAYOUT;
export const RESIDENTS=[
 {id:'riggs',name:'Riggs',site:'milepost',role:'Mechanic',color:0x976345,cost:{steel:2},reward:{cutters:1},limit:1,line:'Most of this road died one bearing at a time. Bring me steel and I will put cutters in your hand.',rumor:'Keep a wrench. Seized motors still hold copper, magnets and bearings.'},
 {id:'vee',name:'Vee',site:'drywell',role:'Night rider',color:0x526c78,cost:{wire:2},reward:{cells:1},limit:2,line:'I ride when the towers stop humming. Nobody owns the shoulder. Trade wire for a working cell?',rumor:'Fuel is worth stopping for. Search maintenance yards, but save room in the trailer.'},
 {id:'inez',name:'Inez',site:'riverward',role:'River keeper',color:0x657958,cost:{steel:1},reward:{rubber:2},limit:3,line:'We patch the pipes before we patch the roofs. The river keeps us here. I can spare rubber for steel.',rumor:'Cal knows the intake. If the breakers refuse you, find the maintenance note before trying again.'},
 {id:'sol',name:'Sol',site:'ferry',role:'Camp electrician',color:0x9b8451,cost:{copper:2},reward:{electronics:2},limit:2,line:'Every working board here came out of something someone threw away. Copper buys you two assemblies.',rumor:'A dead laptop is a battery and a control board waiting for a screwdriver.'},
 {id:'ada',name:'Ada',site:'switchyard',role:'Grid technician',color:0x688891,cost:{electronics:2},reward:{cells:2},limit:1,line:'The security relays never got the shutdown order. I keep one reserve for riders heading north.',rumor:'Scout the security corridor. The engineer drone can reach switches a rider cannot.'},
 {id:'kip',name:'Kip',site:'quarters',role:'Signal watcher',color:0x85805f,cost:{wire:1},reward:{steel:2},limit:3,line:'There is a person behind that transmission. I heard them stop to breathe. Spare wire? I have scrap.',rumor:'The last bank can light the camps or carry a message farther. That choice belongs to whoever gets there.'}
];
export function residentState(raw){if(raw===undefined)return {};if(!raw||Array.isArray(raw)||typeof raw!=='object'||Object.keys(raw).some(k=>!RESIDENTS.some(n=>n.id===k)))throw Error('Invalid residents');for(const [id,r]of Object.entries(raw)){const n=RESIDENTS.find(n=>n.id===id);if(!r||typeof r.met!=='boolean'||!Number.isInteger(r.trades)||r.trades<0||r.trades>n.limit)throw Error('Invalid resident record');}return raw;}
export function makeSettlements(scene,solids){const groups=[],actors=[],lamps=[];const material=new Map();const mat=(c,glow=false)=>{const key=c+':'+glow;if(!material.has(key))material.set(key,new T.MeshStandardMaterial({color:c,roughness:.86,metalness:.12,emissive:glow?c:0,emissiveIntensity:glow?.8:0}));return material.get(key);};
 const geometry=new T.BoxGeometry(1,1,1);
 for(const site of SETTLEMENTS){const g=new T.Group();g.position.set(site.x,0,site.z);scene.add(g);groups.push({site,g});const wall=site.leg===1?0x9b8062:site.leg===2?0x67766b:0x606e77,trim=site.leg===1?0xaf784b:site.leg===2?0x85afa0:0x98afb1,glow=site.leg===3?0x7ddcdd:0xffc886;
 const box=(x,y,z,w,h,d,c,solid=false,emissive=false)=>{const m=new T.Mesh(geometry,mat(c,emissive));m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;g.add(m);if(solid)solids.push({x:site.x+x,z:site.z+z,w:w/2+.45,d:d/2+.45,minY:y-h/2,maxY:y+h/2});return m;};
 // Open-front rooms with separate walls: genuinely enterable, no invisible box collider.
 for(let j=0;j<2;j++){const x=j*22-11,h=site.style==='garage'?6:4.5;box(x,.12,-7,18,.24,16,0x55554e);box(x,h/2,-15,18,h,.45,wall,true);box(x-9,h/2,-7,.4,h,16,wall,true);box(x+9,h/2,-7,.4,h,16,wall,true);box(x,h+.12,-7,19,.35,17,0x343e40,true);box(x,h-.35,1,18,.65,.4,trim,true);box(x,h-1.1,.85,4,.18,.2,glow,false,true);
 for(let k=0;k<4;k++){box(x-6+k*4,h*.55,-14.72,2.2,1.5,.08,0x263f45);box(x-6+k*4,h*.55,-14.64,2.35,.12,.08,trim);}
 if(site.style==='garage'){box(x-5,1,-11,5,2,1.6,0x394847,true);for(let k=0;k<4;k++)box(x-6.7+k,2.1,-11,.4,.2,.4,trim);box(x+5,1.3,-10,2.5,2.6,1.8,0x566268,true);}else if(site.style==='diner'){box(x,1.05,-9,12,.2,2,0x8d7660,true);for(let k=-1;k<=1;k++){box(x+k*4,.6,-5,2,.3,1,0x59594d);box(x+k*4,1.05,-4.5,2,.8,.2,trim);}}else{box(x-4,.5,-10,3,.7,5,0x69736b);box(x-4,.95,-11.5,2.6,.2,1,0xb8b39a);box(x+5,1.4,-11,2.5,2.8,1.3,0x645c4e,true);}
 // Wall seams, patched planks, roof vents and a shaded entrance awning.
 for(let k=0;k<6;k++)box(x-8+k*3,h/2,-15.3,.06,h,.08,0x514d44);
 box(x+4,h+.7,-9,1.7,1,1.7,0x49555a);box(x,h-.9,3,18,.15,4,0x5c6256,true);for(const dx of [-8,8])box(x+dx,(h-1)/2,4.7,.15,h-1,.15,trim,true);
 }
 // Service details follow the same industrial material language and batch below.
 for(const x of [-11,11]){const h=site.style==='garage'?6:4.5;
  for(const side of [-1,1]){box(x+side*8.8,h/2,1,.18,h,.25,0x34464a);for(let k=0;k<5;k++){const patch=box(x+side*8.82,.7+k*.5,1.16,.19,.18,.025,k%2?0x2a3335:0xba914c);patch.rotation.z=side*.4;}}
  box(x+7,h*.55,-14.4,.08,h-.6,.08,0x7e8881);box(x+6.4,1.4,-14.32,1.1,1.5,.16,0x425352);box(x+6.4,1.8,-14.2,.25,.13,.04,glow,false,true);
  for(let k=0;k<7;k++)box(x+4,h+.72,-9.65+k*.2,1.5,.13,.06,0x202e32);
  box(x-5,h-.4,-14.5,3.8,.04,.3,0x999d83);box(x-5,h-.5,-14.45,3.5,.07,.2,glow,false,true);
  box(x+2,.067,3,5,.014,.14,0xa99a67);box(x+2,.067,5,5,.014,.14,0xa99a67);
 }
 // Shared forecourt: service equipment and warm lamps, kept clear for bikes.
 box(-24,.45,7,2,.9,3,0x665645);box(25,.7,8,2,1.4,2,0x4d625b);box(25,2.4,8,.1,2.1,.1,trim);box(25,3.5,8,.55,.4,.55,glow,false,true);
 box(0,.025,4,48,.05,12,site.leg===2?0x555e50:0x555049);
 for(let k=0;k<10;k++){const debris=box(-23+k*5,.18,12+(k%3),.6,.35,.8,k%2?0x697477:0x867354);debris.rotation.y=k*.73;}
 // The name board has visible brackets tied to the awnings, rather than a
 // freestanding label hovering above the forecourt. Keep the entry gap clear.
 const awningHeight=site.style==='garage'?5.1:3.6;
 for(const x of [-9,9])box(x,(awningHeight+7.75)/2,1.85,.15,7.75-awningHeight,.15,0x65736a);
 box(0,7.7,1.85,20.3,.12,.15,0x65736a);
 const lamp=new T.PointLight(glow,18,24,2);lamp.position.set(0,4,2);g.add(lamp);lamps.push(lamp);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#182a2b';ctx.fillRect(0,0,1024,128);ctx.strokeStyle='#bca57e';ctx.lineWidth=8;ctx.strokeRect(8,8,1008,112);ctx.fillStyle='#ece1c2';ctx.font='bold 42px monospace';ctx.textAlign='center';ctx.fillText(site.name,512,80);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(20,2.5),new T.MeshBasicMaterial({map:tex}));sign.position.set(0,6.6,2);g.add(sign);
 for(const n of RESIDENTS.filter(n=>n.site===site.id)){const actor=makePerson(-8,4,n.color);g.add(actor);actors.push({n,site,actor});}
 }
 // Batch static architecture by material within each settlement.
 for(const {g} of groups){const batches=new Map();for(const m of [...g.children])if(m.isMesh&&m.geometry===geometry){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m);}for(const [material,list]of batches){const batch=new T.InstancedMesh(geometry,material,list.length);for(let i=0;i<list.length;i++){list[i].updateMatrix();batch.setMatrixAt(i,list[i].matrix);g.remove(list[i]);}batch.receiveShadow=true;g.add(batch);}}
 return {groups,actors,update(s,time,quality){for(const lamp of lamps)lamp.visible=quality!=='LOW';for(const {site,g}of groups)g.visible=site.leg===s.leg&&Math.hypot(site.x-s.pos.x,site.z-s.pos.z)<550;for(const {actor,site}of actors){const close=Math.hypot(s.pos.x-site.x+8,s.pos.z-site.z-4)<18;const target=close?Math.atan2(s.pos.x-site.x+8,s.pos.z-site.z-4):Math.sin(time*.08)*.35;actor.rotation.y+=Math.atan2(Math.sin(target-actor.rotation.y),Math.cos(target-actor.rotation.y))*.06;actor.position.y=Math.sin(time*1.3)*.015;if(actor.userData.head)actor.userData.head.rotation.x=close?Math.sin(time*.9)*.035:.08;for(const [i,arm]of (actor.userData.arms||[]).entries())arm.rotation.x=Math.sin(time*1.2+i)*.045;}},near(s){return SETTLEMENTS.filter(p=>p.leg===s.leg).map(p=>({...p,d:Math.hypot(s.pos.x-p.x,s.pos.z-p.z)})).sort((a,b)=>a.d-b.d)[0];}};
}
