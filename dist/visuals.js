import * as T from './three.js';
import {attachFieldRig} from './presence-rig.js';
const palette={black:0x171d20,rubber:0x101315,edge:0x424e51,steel:0x768184,tan:0x756349,cyan:0x4ce3e3,green:0x53e79a,amber:0xe2ad51};
const materialCache=new Map();function material(color,glow=false){const key=color+':'+glow;if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,roughness:glow?.35:.76,metalness:glow?.15:.4,emissive:glow?color:0,emissiveIntensity:glow?1.4:0}));return materialCache.get(key);}
function mesh(g,geometry,x,y,z,color,glow=false){const m=new T.Mesh(geometry,material(color,glow));m.position.set(x,y,z);g.add(m);return m;}
function box(g,x,y,z,w,h,d,c){return mesh(g,new T.BoxGeometry(w,h,d),x,y,z,c);}
function rod(g,a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(g,new T.CylinderGeometry(r,r,d.length(),8),...(av.add(bv).multiplyScalar(.5).toArray()),c);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function ring(g,x,y,z,r,t,c){const m=mesh(g,new T.TorusGeometry(r,t,6,24),x,y,z,c);m.rotation.y=Math.PI/2;return m;}
function wheel(g,x,y,z,r=.48){const parent=g;g=new T.Group();g.position.set(x,y,z);parent.add(g);(parent.userData.wheels??=[]).push(g);x=y=z=0;ring(g,x,y,z,r,.12,palette.rubber);ring(g,x,y,z,r*.69,.025,palette.steel);for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(g,[x,y,z],[x,y+Math.cos(a)*r*.7,z+Math.sin(a)*r*.7],.008,palette.steel);}for(let i=0;i<24;i++){const a=i*Math.PI/12;const tread=box(g,x,y+Math.cos(a)*r,z+Math.sin(a)*r,.26,.075,.095,0x222829);tread.rotation.x=-a;}combine(g);}
function crate(g,x,y,z,w,h,d){box(g,x,y,z,w,h,d,palette.black);for(const dx of [-w*.46,w*.46])for(const dz of [-d*.46,d*.46])box(g,x+dx,y,z+dz,.07,h+.03,.07,palette.edge);for(const zz of [-d*.27,d*.27]){box(g,x,y+h/2+.016,z+zz,w,.032,.045,0x5a6461);box(g,x+w/2+.018,y,z+zz,.035,h,.05,0x5a6461);}for(const dx of [-w*.25,w*.25])box(g,x+dx,y+h*.15,z+d*.51,.08,.12,.03,palette.steel);box(g,x,y+h/2+.035,z,w*.27,.04,.055,palette.edge);}
function combine(group){group.updateMatrixWorld(true);const groups=new Map();for(const m of [...group.children]){if(!m.isMesh)continue;m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(g);group.remove(m);m.geometry.dispose();}for(const [mat,parts]of groups){const n=parts.reduce((n,p)=>n+p.attributes.position.array.length,0),pos=new Float32Array(n),norm=new Float32Array(n);let o=0;for(const p of parts){pos.set(p.attributes.position.array,o);norm.set(p.attributes.normal.array,o);o+=p.attributes.position.array.length;p.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(norm,3));group.add(new T.Mesh(g,mat));}return group;}
export function makeBike(){const g=new T.Group();wheel(g,0,.58,-1);wheel(g,0,.58,1);for(const x of [-.18,.18]){rod(g,[x,.58,1],[x,1.23,.1],.045,palette.steel);rod(g,[x,1.23,.1],[x,.65,-.6],.045,palette.black);rod(g,[x,.65,-.6],[x,.7,.7],.055,palette.black);rod(g,[x,.58,-1],[x,1.5,-.6],.045,palette.steel);rod(g,[x,1.35,.3],[x,.68,.9],.04,palette.amber);}box(g,0,1.02,0,.42,.65,.64,palette.black);box(g,0,1.44,.35,.46,.14,.9,palette.rubber);box(g,0,.72,-.04,.46,.12,.8,palette.edge);rod(g,[-.65,1.65,-.65],[.65,1.65,-.65],.045,palette.black);box(g,0,1.42,-.8,.4,.28,.16,palette.edge);mesh(g,new T.CircleGeometry(.11,12),0,1.42,-.891,0xe9f5da,true).rotation.y=Math.PI;crate(g,-.48,1.15,.75,.4,.48,.55);crate(g,.48,1.15,.75,.4,.48,.55);box(g,0,1.1,1.3,.25,.08,.045,0xc44933);return combine(g);}
export function makeTrailer(){
 const g=new T.Group();wheel(g,-.7,.52,0,.43);wheel(g,.7,.52,0,.43);box(g,0,.46,0,1.3,.12,1.65,palette.edge);crate(g,0,.97,0,1.18,.89,1.5);
 // Ventilated generator housing, fuel can and protected battery controller.
 box(g,0,1.51,.25,.94,.24,.85,palette.edge);for(let z=-.05;z<.6;z+=.09)box(g,.48,1.51,z,.035,.14,.035,palette.black);
 crate(g,-.36,1.63,-.51,.27,.48,.3);box(g,-.36,1.9,-.51,.1,.045,.11,palette.amber);box(g,.27,1.48,-.55,.35,.2,.2,palette.black);
 rod(g,[0,.45,-.85],[0,.55,-2],.06,palette.edge);for(const x of [-.53,.53]){box(g,x,.57,.78,.14,.15,.06,0xe04435);box(g,x,.92,.78,.045,.46,.04,palette.steel);}combine(g);
 const panels=[];for(const side of [-1,1]){const hinge=new T.Group();hinge.position.set(side*.58,1.45,0);box(hinge,side*.43,0,0,.85,.045,1.35,palette.edge);box(hinge,side*.43,.027,0,.79,.012,1.27,0x193956);for(let z=-.5;z<=.5;z+=.25)box(hinge,side*.43,.037,z,.79,.005,.012,0x7091a0);box(hinge,side*.43,.037,0,.012,.005,1.27,0x7091a0);combine(hinge);hinge.rotation.z=-side*Math.PI/2;g.add(hinge);panels.push({hinge,side});}
 const indicator=mesh(g,new T.SphereGeometry(.04,8,6),.29,1.52,-.66,palette.green,true);g.userData.panels=panels;g.userData.indicator=indicator;return g;
}
export function makeDrone(color=palette.green){const g=new T.Group();box(g,0,0,0,.44,.18,.56,palette.black);box(g,0,.11,0,.28,.07,.34,palette.edge);mesh(g,new T.SphereGeometry(.12,12,8),0,-.13,-.27,palette.black);mesh(g,new T.CircleGeometry(.055,12),0,-.13,-.375,0x376b77,true).rotation.y=Math.PI;const rotors=[];for(const x of [-.55,.55])for(const z of [-.5,.5]){rod(g,[x*.22,0,z*.22],[x,0,z],.04,palette.edge);mesh(g,new T.CylinderGeometry(.08,.06,.16,10),x,.06,z,palette.black);rod(g,[x,-.02,z],[x,-.2,z],.022,palette.black);mesh(g,new T.SphereGeometry(.028,6,4),x,-.12,z,color,true);const guard=mesh(g,new T.TorusGeometry(.39,.016,5,20),x,.13,z,palette.edge);guard.rotation.x=Math.PI/2;const rotor=new T.Group();rotor.position.set(x,.17,z);box(rotor,0,0,0,.67,.014,.048,palette.black);g.add(rotor);rotors.push(rotor);}rod(g,[.12,.12,0],[.12,.44,.08],.012,palette.steel);mesh(g,new T.SphereGeometry(.032,8,6),.12,.44,.08,color,true);if(color===0xffbd54){for(const side of [-1,1]){rod(g,[side*.16,-.1,0],[side*.23,-.4,-.05],.028,palette.amber);box(g,side*.18,-.41,-.05,.16,.045,.16,palette.steel);}}combine(g);g.userData.rotors=rotors;return g;}
export function makeCockpit(){
 const g=new T.Group();g.name='BLACKLINE / machined cockpit';
 const curve=(points,r,c)=>mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),0,0,0,c);
 // Bent alloy riser, clamped stem, fork crowns and independent hydraulic lines.
 curve([[-.77,-.39,-.69],[-.5,-.42,-.77],[-.25,-.49,-.86],[0,-.5,-.87],[.25,-.49,-.86],[.5,-.42,-.77],[.77,-.39,-.69]],.029,palette.edge);
 for(const side of [-1,1]){
  const x=side*.59;
  rod(g,[side*.13,-.55,-.88],[side*.13,-.78,-.62],.045,palette.steel);
  box(g,side*.13,-.5,-.86,.1,.07,.13,palette.black);
  for(const z of [-.81,-.9])mesh(g,new T.CylinderGeometry(.019,.019,.02,6),side*.13,-.455,z,palette.steel);
  rod(g,[side*.51,-.4,-.74],[side*.78,-.39,-.69],.048,palette.rubber);
  for(let i=0;i<13;i++){const t=i/12;const m=mesh(g,new T.TorusGeometry(.049,.0035,4,12),side*(.52+t*.24),-.399+t*.009,-.74+t*.05,palette.edge);m.rotation.y=Math.PI/2;}
  box(g,side*.475,-.39,-.76,.085,.1,.09,palette.black);
  box(g,side*.475,-.343,-.704,.048,.026,.016,side>0?0xbb4435:palette.amber);
  const reservoir=box(g,side*.39,-.33,-.82,.13,.09,.13,palette.black);reservoir.rotation.y=side*.12;
  box(g,side*.39,-.28,-.82,.14,.016,.14,palette.edge);
  mesh(g,new T.SphereGeometry(.011,6,4),side*.475,-.316,-.77,palette.green,true);
  curve([[side*.48,-.4,-.79],[side*.59,-.405,-.83],[side*.73,-.405,-.8]],.013,palette.steel);
  curve([[side*.4,-.37,-.84],[side*.33,-.51,-1.03],[side*.07,-.67,-1.04],[side*.14,-.8,-.78]],.007,palette.rubber);
  // Soft glove silhouettes, rounded knuckles, stitched cuffs; no box fingers.
  const palm=mesh(g,new T.SphereGeometry(.085,12,8),x,-.374,-.655,palette.black);palm.scale.set(1.25,.68,1.25);
  for(let i=0;i<4;i++){const finger=mesh(g,new T.CapsuleGeometry(.018,.054,3,6),x+side*(i-1.5)*.033,-.383,-.727,palette.rubber);finger.rotation.x=.85;}
  const sleeve=mesh(g,new T.CapsuleGeometry(.085,.27,4,10),side*.74,-.55,-.4,0x343a37);sleeve.rotation.set(-.75,0,side*-.42);
  box(g,side*.663,-.46,-.546,.145,.025,.085,palette.edge);
 }
 box(g,0,-.72,-.67,.3,.22,.46,palette.black);crate(g,0,-.57,-1.4,.66,.28,.44);
 // Sun hood, chamfer impression, rubber gasket and captive fasteners.
 box(g,0,-.395,-.859,.442,.254,.074,palette.edge);box(g,0,-.391,-.815,.405,.218,.024,palette.rubber);
 box(g,0,-.257,-.82,.47,.025,.12,palette.black);
 for(const x of [-.22,.22])box(g,x,-.36,-.818,.025,.21,.08,palette.black);
 for(const x of [-.207,.207])for(const y of [-.49,-.29]){const screw=mesh(g,new T.CircleGeometry(.008,6),x,y,-.812,palette.steel);screw.rotation.z=.5;}
 // Small radio to the left of the cluster, speaker grille and squelch knob.
 box(g,-.31,-.5,-.76,.15,.2,.075,palette.black);
 for(let i=0;i<6;i++)box(g,-.31,-.49+i*.011,-.716,.108,.003,.002,palette.edge);
 const knob=mesh(g,new T.CylinderGeometry(.023,.023,.025,12),-.31,-.558,-.713,palette.steel);knob.rotation.x=Math.PI/2;
 combine(g);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
 const display=new T.Mesh(new T.PlaneGeometry(.384,.193),new T.MeshBasicMaterial({map:tex,toneMapped:false}));display.position.set(0,-.391,-.8);g.add(display);
 g.userData.display={canvas,tex};return g;
}
export function makeWeapon(){const g=new T.Group();box(g,.28,-.3,-.67,.1,.13,.4,palette.black);box(g,.28,-.23,-.69,.045,.02,.32,palette.steel);box(g,.28,-.39,-.53,.07,.19,.08,palette.rubber);rod(g,[.28,-.28,-.85],[.28,-.28,-1.14],.025,palette.edge);box(g,.32,-.285,-.72,.015,.035,.1,palette.cyan);return combine(g);}
export function makePerson(x,z,c){
 const g=new T.Group(),head=new T.Group(),arms=[],legs=[];
 const torso=mesh(g,new T.CapsuleGeometry(.24,.42,3,10),0,1.4,0,c);torso.scale.set(1.2,1,.72);
 box(g,0,1.46,.18,.49,.5,.12,0x394442);box(g,0,1.09,0,.55,.09,.32,0x222c2b);
 for(const side of [-1,1]){box(g,side*.18,1.42,.265,.13,.18,.06,0x727b66);box(g,side*.18,1.24,.255,.15,.14,.06,0x494c3e);box(g,side*.15,1.69,.15,.035,.2,.04,0xb2a88b);
  const pivot=new T.Group();pivot.position.set(side*.16,1.0,0);const leg=mesh(pivot,new T.CapsuleGeometry(.115,.54,3,9),0,-.33,0,0x3b413c);leg.rotation.z=side*.035;
  box(pivot,0,-.76,.09,.25,.19,.43,0x17201f);box(pivot,0,-.42,.12,.19,.21,.08,0x555b4b);combine(pivot);g.add(pivot);legs.push(pivot);
  const arm=new T.Group();arm.position.set(side*.33,1.66,0);rod(arm,[0,0,0],[side*.08,-.35,.04],.09,c);rod(arm,[side*.08,-.35,.04],[side*.08,-.62,.19],.08,c);mesh(arm,new T.SphereGeometry(.088,8,6),side*.08,-.67,.2,0x282e29);combine(arm);g.add(arm);arms.push(arm);
 }
 head.position.set(0,1.96,0);const face=mesh(head,new T.SphereGeometry(.215,14,10),0,0,0,0x8a745a);face.scale.set(.86,1.08,.9);
 mesh(head,new T.SphereGeometry(.222,12,8,0,Math.PI*2,0,Math.PI*.48),0,.025,-.02,c===0x9ca78b?0x5b4937:0x343b35);if(c===0x855844){box(head,0,.015,.172,.31,.085,.05,0x233e43);box(head,0,-.102,.16,.22,.12,.07,0x51584b);}else{for(const side of [-1,1]){mesh(head,new T.SphereGeometry(.027,7,5),side*.078,.025,.179,0x202d2c);box(head,side*.075,.065,.178,.066,.012,.016,0x413e34);}const nose=mesh(head,new T.SphereGeometry(.043,7,5),0,-.016,.188,0x9e8064);nose.scale.set(.7,1,1);box(head,0,-.1,.173,.083,.015,.014,0x6a4b3b);box(head,0,-.185,.075,.24,.045,.14,0x677165);}for(const side of [-1,1])mesh(head,new T.SphereGeometry(.045,8,6),side*.21,0,0,0x242c2c);
 combine(head);g.add(head);box(g,0,1.44,-.24,.45,.58,.21,0x303b37);box(g,0,1.55,-.36,.28,.13,.03,0xa79668);g.userData.head=head;g.userData.arms=arms;g.userData.legs=legs;g.position.set(x,0,z);return attachFieldRig(combine(g));
}
export function heightAt(x,z){const edge=Math.max(0,Math.abs(x)-210);return edge*(.17+.13*Math.sin(z*.005+x*.01)**2)+Math.max(0,edge-75)*(.25+.19*Math.sin(z*.012+x*.019)*Math.cos(x*.017));}
export function makeTerrain(scene,mobile){const group=new T.Group();scene.add(group);const loader=new T.TextureLoader();const texture=loader.load('./assets/desert-ground.png');texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(130,180);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;const geo=new T.PlaneGeometry(3000,7600,mobile?110:180,mobile?150:240);geo.rotateX(-Math.PI/2);geo.translate(0,0,-1500);const a=geo.attributes.position;const colors=[];for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),h=heightAt(x,z);a.setY(i,h-.04);const basin=new T.Color(.79,.73,.63),river=new T.Color(.51,.64,.53),industrial=new T.Color(.47,.49,.5);const c=basin.lerp(river,T.MathUtils.smoothstep(-z,1700,1860)).lerp(industrial,T.MathUtils.smoothstep(-z,3150,3330));c.multiplyScalar(Math.max(.45,1-h*.0008));colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const terrainMaterial=new T.MeshStandardMaterial({map:texture,roughness:.98,vertexColors:true,normalScale:new T.Vector2(.55,.55)});for(const [key,file]of [['normalMap','Ground037_NormalGL.jpg'],['roughnessMap','Ground037_Roughness.jpg']]){const detail=loader.load('./assets/kit/'+file);detail.wrapS=detail.wrapT=T.RepeatWrapping;detail.repeat.set(500,1267);detail.anisotropy=8;terrainMaterial[key]=detail;}terrainMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=max(.78,roughnessFactor);');};terrainMaterial.customProgramCacheKey=()=>"matte-ground-1";const terrain=new T.Mesh(geo,terrainMaterial);terrain.name='Basin terrain / PBR ground';terrain.receiveShadow=true;group.add(terrain);
return group;}
export function makeMaraShelter(solids=[]){
 const g=new T.Group();g.name='Mara / single clear-span field shelter';
 // One continuous roof replaces the two intersecting legacy canopies. Mara
 // stays at the existing tutorial coordinate (54,-94), with over 1.6 m headroom.
 const roof=box(g,54,3.8,-100,15,.12,21,0x8c846b);roof.rotation.x=-.04;
 for(const x of [47,61]){
  rod(g,[x,.02,-90],[x,4.18,-90],.075,palette.steel);
  rod(g,[x,.02,-110],[x,3.38,-110],.075,palette.steel);
  rod(g,[x,4.12,-90],[x,3.32,-110],.065,palette.edge);
  for(const z of [-90,-110])box(g,x,.06,z,.34,.12,.34,palette.edge);
  for(const z of [-90,-110])solids.push({x,z,w:.32,d:.32,minY:0,maxY:z===-90?4.18:3.38,maraShelter:true});
 }
 // Short roof strips track the slope without an invisible solid box filling
 // the shelter. Walking and jumping still have full clearance beneath it.
 for(let i=0;i<7;i++){const z=-109+i*3,y=3.8+(z+100)*Math.tan(.04);solids.push({x:54,z,w:7.5,d:1.5,minY:y-.13,maxY:y+.13,maraShelter:true});}
 rod(g,[47,4.1,-90],[61,4.1,-90],.065,palette.edge);
 rod(g,[47,3.3,-110],[61,3.3,-110],.065,palette.edge);
 // The service equipment sits at the rear; the front bay is clear for talk,
 // walking and parking. Lower silhouettes leave the NPC legible at a glance.
 crate(g,49,.7,-106,2,1.4,1.5);crate(g,58,.45,-106,1.5,.9,1);
 box(g,53,1,-104,3,.13,1,palette.edge);
 for(const x of [51.7,54.3])for(const z of [-104.35,-103.65])rod(g,[x,.02,z],[x,.95,z],.04,palette.edge);
 box(g,53,1.13,-104.1,.7,.12,.4,palette.tan);
 box(g,60.35,3.7,-94,.55,.1,.3,palette.edge);
 mesh(g,new T.SphereGeometry(.09,8,6),60.35,3.62,-94,0xffddb1,true);
 // Restrained field trim is part of the structure, with no extra floating UI.
 box(g,54,4.02,-89.96,4,.16,.07,palette.black);
 box(g,54,4.02,-89.91,2.8,.038,.018,palette.cyan);
 for(const x of [47,61])box(g,x,2.5,-89.91,.15,.4,.018,palette.amber);
 g.userData.mara={x:54,z:-94};return combine(g);
}
export function detailWorld(scene,solids=[]){const g=new T.Group();scene.add(g);for(const [x,z]of [[90,-416],[155,-733]]){crate(g,x+3,1,z,1.3,2,1);solids.push({x:x+3,z,w:.65,d:.5,minY:0,maxY:2,kind:'cabinet'});for(let i=0;i<3;i++)mesh(g,new T.CircleGeometry(.12,10),x+2.7+i*.3,1.4,z+.51,i===0?palette.green:palette.amber,true);rod(g,[x+3,2,z],[x+3,3,z],.03,palette.steel);}
g.add(makeMaraShelter(solids));
for(const [x,z]of [[-85,-290],[90,-416],[155,-733]]){rod(g,[x+4,0,z+4],[x+4,3.7,z+4],.055,palette.steel);box(g,x+4,3.4,z+4,1.8,.6,.12,0x25383a);mesh(g,new T.SphereGeometry(.14,8,6),x+4,4,z+4,palette.cyan,true);}return combine(g);}
