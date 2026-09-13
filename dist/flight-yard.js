import * as T from './three.js';
export const YARD={x:160,z:90,home:[160,2,115]};
export const GATES=[[160,9,83],[160,13,52],[136,18,24],[104,12,18],[98,9,57],[126,7,85]];
export const INSPECTIONS=[[132,9,52],[102,13,52],[122,17,22]];
export const JOBS={circuit:{name:'Circuit / precision flight',hint:'Fly through the illuminated gates in order.'},inspect:{name:'Scout / inspection',hint:'Hold a steady hover near each amber inspection node.'},cargo:{name:'Cargo / recovery',hint:'Use at PICKUP to attach the crate; deliver it to DROP.'},repair:{name:'Utility / field repair',hint:'Hover by the breaker bank and hold position while the tool works.'},relay:{name:'Relay / uplink',hint:'Climb above the mast and hold a stable relay position.'}};
export function createFlightSession(){return {job:'circuit',gate:0,elapsed:0,hold:0,carrying:false,complete:false,inspected:0,collisions:0,lastHP:100,previous:null};}
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
export function stepFlightSession(f,d,dt,type){if(f.complete)return '';f.elapsed+=dt;if(d.hp<f.lastHP)f.collisions++;f.lastHP=d.hp;
 let message='';const p=d.pos;
 if(f.job==='circuit'){
  const target=GATES[f.gate],a=f.previous||p,v=p.map((n,i)=>n-a[i]),len=v.reduce((n,q)=>n+q*q,0),t=len?Math.max(0,Math.min(1,target.reduce((n,q,i)=>n+(q-a[i])*v[i],0)/len)):0;
  if(distance(a.map((n,i)=>n+v[i]*t),target)<3.3){f.gate++;message='GATE '+f.gate+' / '+GATES.length;if(f.gate===GATES.length)f.complete=true;}
 }else if(f.job==='inspect'){const target=INSPECTIONS[f.inspected];if(distance(p,target)<6&&d.speed<3){f.hold+=dt;if(f.hold>=2.5){f.inspected++;f.hold=0;message='Inspection recorded';if(f.inspected===3)f.complete=true;}}else f.hold=0;
 }else if(f.job==='repair'||f.job==='relay'){
  const repair=f.job==='repair',target=repair?[132,9,52]:[122,29,22],right=repair?type==='engineer':type==='relay';
  if(right&&distance(p,target)<5&&d.speed<2.5){f.hold+=dt;if(f.hold>=5)f.complete=true;}else f.hold=0;
 }
 f.previous=[...p];return f.complete?'FLIGHT COMPLETE · '+f.elapsed.toFixed(1)+' s':message;
}
export function useFlightCargo(f,d,type){if(f.job!=='cargo'||f.complete)return 'Select a mission from Flight Yard.';if(type!=='cargo')return 'CARGO-01 is required for the recovery clamp.';if(d.speed>3)return 'Slow to a hover before operating the clamp.';
 const target=f.carrying?[104,4,84]:[170,4,52];if(distance(d.pos,target)>6)return f.carrying?'Carry the crate to DROP.':'Approach PICKUP to attach the crate.';
 if(f.carrying){f.carrying=false;f.complete=true;return 'DELIVERY COMPLETE · '+f.elapsed.toFixed(1)+' s';}f.carrying=true;return 'LOAD SECURED · fly to DROP';}
export function flightProgress(f){if(f.complete)return 'COMPLETE · '+f.elapsed.toFixed(1)+' s · '+f.collisions+' impacts';return f.job==='circuit'?'GATE '+(f.gate+1)+' / '+GATES.length:f.job==='inspect'?'INSPECTION '+(f.inspected+1)+' / 3 · '+Math.floor(f.hold/2.5*100)+'%':f.job==='cargo'?f.carrying?'LOAD SECURED → DROP':'PICKUP → E / A / USE':'STABLE HOVER · '+Math.min(100,Math.floor(f.hold/5*100))+'%';}
export class FlightYardWorld{
 constructor(scene,solids){this.root=new T.Group();scene.add(this.root);this.gates=[];const mats={};const mat=c=>mats[c]||(mats[c]=new T.MeshStandardMaterial({color:c,roughness:.75,metalness:.25}));
  const box=(p,size,c,solid=false)=>{const m=new T.Mesh(new T.BoxGeometry(...size),mat(c));m.position.set(...p);m.castShadow=m.receiveShadow=true;this.root.add(m);if(solid)solids.push({x:p[0],z:p[2],w:size[0]/2,d:size[2]/2,minY:p[1]-size[1]/2,maxY:p[1]+size[1]/2});return m;};
  box([139,.06,66],[96,.12,126],0x35403f);for(const x of [92,186])box([x,.14,66],[.15,.02,124],0xb29c60);for(const z of [4,128])box([139,.14,z],[94,.02,.15],0xb29c60);
  box([160,7,124],[33,.6,12],0x242e31);for(const x of [144,176])box([x,3.5,124],[.4,7,10],0x4c5857,true);
  for(const [i,p]of GATES.entries()){const g=new T.Group();g.position.set(...p);const next=GATES[(i+1)%GATES.length];g.lookAt(next[0],p[1],next[2]);const metal=new T.Mesh(new T.TorusGeometry(3.8,.12,6,32),mat(0x414e50));const light=new T.Mesh(new T.TorusGeometry(3.65,.055,5,32),new T.MeshBasicMaterial({color:0x526265}));g.add(metal,light);this.root.add(g);this.gates.push(light);box([p[0],p[1]/2,p[2]],[.15,p[1],.15],0x384549);this.label(String(i+1).padStart(2,'0'),[p[0],p[1]+5,p[2]],3);}
  for(const x of [129,132,135]){box([x,3,52],[2,6,3],0x596564,true);for(let i=0;i<5;i++)box([x,2+i*.6,53.55],[1.7,.12,.15],0x293336);box([x,6.6,52],[.4,1.2,.4],0xb4a994);}
  box([102,6,52],[10,12,6],0x485254,true);box([122,11,22],[.4,22,.4],0x637575,true);box([122,20,22],[9,.3,.3],0x637575);this.label('UPLINK / 29 m',[122,32,22],8);
  this.payload=box([170,.8,52],[1.8,1.3,1.4],0x9c753c);this.payloadHome=this.payload.position.clone();for(const [label,p]of [['PICKUP',[170,.2,52]],['DROP',[104,.2,84]],['FLIGHT YARD / 07',[160,8.5,123]]])this.label(label,p, label.length>10?24:8);
  // A mission's hover point must be visible from the aircraft, including at night.
  this.inspections=INSPECTIONS.map((p,i)=>{const m=new T.Mesh(new T.OctahedronGeometry(.42),new T.MeshBasicMaterial({color:0xeab86f}));m.position.set(...p);this.root.add(m);this.label('INSPECT '+(i+1),[p[0],p[1]+2,p[2]],5);return m;});
  this.targetHalo=new T.Mesh(new T.TorusGeometry(2.4,.07,6,32),new T.MeshBasicMaterial({color:0xeab86f,depthTest:false}));this.targetHalo.rotation.x=Math.PI/2;this.targetHalo.renderOrder=2;this.targetHalo.visible=false;this.root.add(this.targetHalo);
  this.root.visible=false;
 }
 label(text,pos,width){const c=document.createElement('canvas');c.width=768;c.height=96;const x=c.getContext('2d');x.fillStyle='#102225';x.fillRect(0,0,768,96);x.strokeStyle='#77c4c6';x.strokeRect(4,4,760,88);x.fillStyle='#d2ded8';x.font='bold 42px monospace';x.textAlign='center';x.fillText(text,384,64);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width/8),new T.MeshStandardMaterial({map:tex,roughness:.8,emissive:0x213337,emissiveIntensity:.15,side:T.DoubleSide}));m.position.set(...pos);if(pos[1]<1)m.rotation.x=-Math.PI/2;this.root.add(m);}
 update(active,f,d){this.root.visible=active;this.gates.forEach((m,i)=>m.material.color.setHex(f?.job==='circuit'&&i===f.gate?0x70ede5:i<(f?.gate||0)?0x7eab84:0x344849));if(f?.carrying)this.payload.position.set(d.pos[0],d.pos[1]-1.2,d.pos[2]);else if(f?.job==='cargo'&&f.complete)this.payload.position.set(104,.8,84);else this.payload.position.copy(this.payloadHome);
  const target=!f||f.complete?null:f.job==='inspect'?INSPECTIONS[f.inspected]:f.job==='repair'?INSPECTIONS[0]:f.job==='relay'?[122,29,22]:f.job==='cargo'?(f.carrying?[104,4,84]:[170,4,52]):null;
  this.targetHalo.visible=!!target;if(target)this.targetHalo.position.set(...target);this.inspections.forEach((m,i)=>m.material.color.setHex(f?.job==='inspect'&&i<f.inspected?0x659887:0xeab86f));
 }
}
