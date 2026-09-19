import assert from 'node:assert/strict';
import * as T from './dist/three.js';
import {makePerson} from './dist/visuals.js';
import {attachFieldRig,setFieldAction,updateFieldRig,fieldRigStats} from './dist/presence-rig.js';
import {PresenceComposer} from './dist/presence-composer.js';
import {Sensors} from './dist/sensors.js';
import {remeshPositions,colliderToSolid} from './dist/remesh-gltf.js';
import {ImportedProps,IMPORTED_MANIFEST} from './dist/imported-props.js';
import {roadsideCover} from './dist/foliage.js';
import {FieldAudio} from './dist/audio.js';
import {AmbientResidents} from './dist/ambient-residents.js';

const person=makePerson(0,0,0x9ca78b);
assert(person.userData.rig,'makePerson ships a skeleton');
const stats=fieldRigStats(person);
assert.equal(stats.bones,8);
assert.deepEqual(stats.clips.sort(),['idle','walk','watch','work'].sort());
const hip0=person.userData.legs[0].quaternion.clone();
setFieldAction(person,'walk',0);
for(let i=0;i<12;i++)updateFieldRig(person,.08);
assert(person.userData.legs[0].quaternion.angleTo(hip0)>0.05,'Walk clip drives visual legs');
setFieldAction(person,'idle',0);
assert.equal(fieldRigStats(person).clip,'idle');

class StubRenderer{constructor(){this.shadowMap={};this.calls=0;}render(){this.calls++;}getSize(v){return v.set(64,64);}setRenderTarget(){}getRenderTarget(){return null;}}
const scene=new T.Scene(),camera=new T.PerspectiveCamera();
const stub=new StubRenderer();
const composer=new PresenceComposer(stub,scene,camera);
composer.apply({graphics:'LOW',sensorMode:'visible'});
assert.equal(composer.enabled,false);
composer.render();assert.equal(stub.calls,1,'LOW falls back to a single scene render');
composer.apply({graphics:'HIGH',sensorMode:'visible'});
assert.equal(composer.enabled,true);
assert.equal(composer.ao,true,'HIGH enables contact AO');
composer._boot(64,64);
assert(composer.sceneTarget?.depthTexture,'Scene target keeps a depth texture for contact shadows');
composer.apply({graphics:'ULTRA',sensorMode:'thermal'});
assert.equal(composer.enabled,false,'Thermal keeps the sensor path');
assert.equal(composer.ao,false);
composer.apply({graphics:'HIGH',nightVision:true});
assert.equal(composer.enabled,false);
composer.apply({graphics:'LOW',sensorMode:'visible'});
assert.equal(composer.ao,false,'LOW skips contact AO');

const sensors=new Sensors();
const before=stub.calls;
sensors.render(stub,scene,camera,'visible',[],composer);
assert(stub.calls>before,'Sensors can delegate to the composer');
sensors.render(stub,scene,camera,'thermal',[]);
assert(stub.calls>before+1,'Thermal still uses the renderer directly');

const mesh=new Float32Array([0,0,0, 1,0,0, 0,1,0,  0,0,0, 1,0,0, 0,1,0,  .01,0,0, 1.01,0,0, .01,1,0]);
const welded=remeshPositions(mesh,{grid:.05});
assert(welded.positions.length<mesh.length,'Weld collapses duplicate TRELLIS verts');
assert.equal(welded.collider.kind,'imported');
assert(welded.collider.w>0&&welded.collider.maxY>welded.collider.minY);
const solid=colliderToSolid(welded.collider,{x:10,z:-20});
assert.equal(solid.x,10+welded.collider.x);
assert.equal(IMPORTED_MANIFEST.length,0,'No generated mesh is required to boot');
const props=new ImportedProps(scene,[],{manifest:[],assets:false});
assert.equal(props.slots.length,0);

const cover=roadsideCover(new T.Scene(),new T.MeshStandardMaterial(),[]);
assert(cover.batches.some(b=>b.mesh.name==='Roadside / oak crowns'));
assert(cover.batches.find(b=>b.mesh.name==='Roadside / oak crowns').mesh.geometry.type==='IcosahedronGeometry');

globalThis.AudioContext=class{constructor(){this.currentTime=1;this.sampleRate=8000;this.destination={};this.listener={setPosition(){},setOrientation(){}};}
  createStereoPanner(){return this._n();}createDynamicsCompressor(){return this._n();}createGain(){return this._n();}createOscillator(){return this._n();}createBufferSource(){return this._n();}createBiquadFilter(){return this._n();}
  createPanner(){const n=this._n();n.panningModel='HRTF';n.distanceModel='inverse';n.refDistance=8;n.maxDistance=140;n.rolloffFactor=1;n.setPosition=()=>{};return n;}
  createBuffer(a,n){return {getChannelData(){return new Float32Array(n);}};}resume(){return Promise.resolve();}
  _n(){const p={value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}};return {gain:p,frequency:p,pan:p,Q:p,threshold:p,ratio:p,connect(){return this;},disconnect(){},start(){},stop(){}};}
};
const audio=new FieldAudio();audio.start();
assert(audio.presence.ready,'Spatial panners attach when the context supports them');
assert(audio.presence.panners.generator);

const mara=makePerson(54,-94,0x9ca78b);
const residents=new AmbientResidents(mara,{actors:[]},[],{build:async()=>[{id:'mara',routes:[[{x:54,z:-94},{x:56,z:-96}]],error:null}]});
await residents.ready;
const world={leg:1,pos:{x:54,y:1.7,z:-20},mode:'bike'};
residents.update(.02,world);
residents.actors[0].wait=0;
residents.update(.02,world);
assert.equal(residents.actors[0].state,'WALK');
assert.equal(fieldRigStats(mara).clip,'walk');
world.pos.z=-94;
residents.update(.02,world);
assert.equal(residents.actors[0].state,'WATCH');
assert.equal(fieldRigStats(mara).clip,'watch');

console.log('PASS: skeletal mixer, quality-gated bloom+contact AO, TRELLIS remesh collider, volume foliage, spatial audio, Recast-driven NPC clips.');
