import assert from 'node:assert/strict';
import {PROFILES,createExperience,migrateExperience,experienceState,cyclePOV,clipCamera} from './dist/experience.js';
import {CameraManager} from './dist/camera-manager.js';
import * as T from './dist/three.js';
const pref=createExperience();cyclePOV(pref,'bike');assert.equal(pref.preferred.bike,'bars');assert.equal(pref.preferred.walking,'eyes');assert.deepEqual(migrateExperience(JSON.parse(JSON.stringify(pref))),pref);assert.throws(()=>migrateExperience({version:1,preferred:{bike:'invalid'}}));
const wall={x:0,z:3,w:2,d:.3,minY:0,maxY:5};assert(clipCamera([0,1,0],[0,1,6],[wall])[2]<2.7);assert.equal(clipCamera([0,8,0],[0,8,6],[wall])[2],6);
const s={mode:'bike',pos:new T.Vector3(0,1.7,0),yaw:0,pitch:0,speed:10,experience:pref,droneSystem:{velocity:[1,1,1]}};const camera=new T.PerspectiveCamera(72,1,.1,1000),manager=new CameraManager(),settings={chaseDistance:1,chaseHeight:1,cameraSmoothing:8,reduceMotion:false,leanInfluence:.5,speedFov:.6,fov:72};
for(const [state,list]of Object.entries(PROFILES))for(const profile of list){s.mode=state==='walking'?'foot':state==='drone'?'drone':'bike';s.experience.preferred[state]=profile.id;const screen={inspection:'supplies',power:'rig',camp:'resident'}[state]||'';const before=s.pos.clone();const v=manager.update(camera,s,screen,settings,[wall],()=>0,.016);assert.equal(v.state,state);assert.deepEqual(s.pos,before);assert(camera.position.toArray().every(Number.isFinite));assert(Number.isFinite(camera.fov));}
assert.equal(experienceState({...s,mode:'drone',harvesting:{}}),'power');
console.log('PASS: every experience/POV, independent preferences, migration rejection, wall clipping, finite camera poses and unchanged player position.');
