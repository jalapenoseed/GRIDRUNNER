import * as T from './three.js';
import {aircraftCode} from './fleet-manifest.js';

export function mountSwarmMap(root,{program,squad,operator,bike,onObjective}){
 const canvas=root.querySelector('#swarmOpsMap');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=Math.max(240,canvas.clientWidth||680),h=w*360/680,dpr=Math.min(2,globalThis.devicePixelRatio||1),scale=w/360;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const at=p=>[w/2+(p[0]-operator[0])*scale,h/2+(p[2]-operator[2])*scale];
 const dot=(p,color,label,r=4)=>{const [x,y]=at(p);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.font='12px monospace';ctx.fillText(label,x+8,y-6);};
 const draw=()=>{
  ctx.fillStyle='#0b181d';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#20363d';ctx.lineWidth=1;
  for(let x=0;x<w;x+=scale*20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=scale*20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.fillStyle='#abc1bd';ctx.font='13px monospace';ctx.fillText('N ↑   ·   20 m grid   ·   FIELD PAUSED',16,24);
  if(program.objective){const [x,y]=at(program.objective);ctx.strokeStyle='#92f7e4';ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.stroke();}
  dot(bike,'#e5b763','BIKE',5);dot(operator,'#fff3ce','YOU',5);
  for(const [id,r] of Object.entries(squad)){if(r.system.mode==='DOCK')continue;dot(r.system.pos,r.type==='relay'?'#f46bff':'#22efff',aircraftCode(id));}
 };
 const set=(x,z)=>{program.objective=[Math.max(-550,Math.min(550,x)),operator[1],Math.max(-4710,Math.min(210,z))];onObjective(program.objective);draw();};
 canvas.addEventListener('pointerdown',event=>{const rect=canvas.getBoundingClientRect();set(operator[0]+((event.clientX-rect.left)/rect.width*w-w/2)/scale,operator[2]+((event.clientY-rect.top)/rect.height*h-h/2)/scale);});
 canvas.addEventListener('keydown',event=>{const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[event.key];if(!delta)return;event.preventDefault();event.stopPropagation();const p=program.objective||operator;set(p[0]+delta[0],p[2]+delta[1]);});
 draw();
}

// A small authored cloth mesh: pitched fabric, repair patches and four supports.
// No collision volume: it offers visual concealment, never ballistic shelter.
export class FieldCoverWorld{
 constructor(scene){
  this.root=new T.Group();this.root.name='Workshop camouflage cloth';this.root.visible=false;scene.add(this.root);
  const cloth=new T.PlaneGeometry(7.6,7.6,14,14);cloth.rotateX(-Math.PI/2);
  const positions=cloth.attributes.position;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,2.65-Math.abs(x)*.28-Math.abs(z)*.05+Math.sin(x*2+z)*.035);}
  const fabric=cloth.toNonIndexed(),colors=[],palette=[0x59644a,0x353f32,0x7a7860,0x4a5748].map(c=>new T.Color(c));
  for(let i=0;i<fabric.attributes.position.count;i++){const face=Math.floor(i/6),c=palette[(face*7+Math.floor(face/14)*3)%4];colors.push(c.r,c.g,c.b);}
  fabric.setAttribute('color',new T.Float32BufferAttribute(colors,3));fabric.computeVertexNormals();cloth.dispose();
  const mesh=new T.Mesh(fabric,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}));mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);
  for(const x of [-3.6,3.6])for(const z of [-3.6,3.6]){const pole=new T.Mesh(new T.CylinderGeometry(.025,.035,1.45,5),new T.MeshStandardMaterial({color:0x474b41,roughness:.8}));pole.position.set(x,.725,z);this.root.add(pole);}
 }
 update(camo){this.root.visible=!!camo?.deployed;if(!this.root.visible)return;this.root.position.fromArray(camo.position);this.root.rotation.y=camo.yaw;}
}
