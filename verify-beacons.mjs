import assert from 'node:assert/strict';
import * as T from './dist/three.js';
import {BEACONS,beaconScale} from './dist/drone-beacons.js';
import {DroneFleet} from './dist/drone-fleet.js';
import {Sensors} from './dist/sensors.js';
import {createDrone} from './dist/drone-system.js';
import {syncSquad} from './dist/squadron.js';
const scene=new T.Scene(),camera=new T.PerspectiveCamera(75,1.6,.1,2000);camera.updateMatrixWorld();
const fleet=new DroneFleet(scene,{assets:false}),bike=new T.Group(),trailer=new T.Group();
const s={droneType:'scout',droneSystem:createDrone(),drone:100,mode:'foot',elapsed:1};syncSquad(s);
assert.equal(new Set(Object.values(BEACONS).map(b=>b.color)).size,4);
for(const [i,r]of Object.values(s.squad).entries()){r.system.mode=['HOLD','RETURN HOME','PERCHED','RELAY'][i%4];r.system.pos=[(i-1)*8,3,-[20,150,460,900][i%4]];}
fleet.update(.02,s,trailer,bike,camera);
for(const [id,r]of Object.entries(fleet.records)){assert(r.root.visible);const b=r.root.userData.beacon;assert(b.visible);assert.equal(b.material.color.getHex(),BEACONS[id].color);assert(b.material.depthTest&&!b.material.depthWrite&&!b.material.fog&&!b.material.toneMapped);assert(b.material.opacity>.9);assert(r.root.userData.neon.visible);const halo=r.root.userData.beaconHalo;assert(halo.scale.x<=b.scale.x*1.6);assert(halo.material.opacity<=.15);const core=r.root.userData.beaconCore;assert(core.visible);assert(core.material.depthTest&&!core.material.depthWrite);assert.equal(core.material.color.getHex(),0xffffff);assert(core.scale.x<b.scale.x);assert.equal(halo.material.blending,T.AdditiveBlending);assert(halo.material.depthTest&&!halo.material.depthWrite);assert.equal(halo.material.color.getHex(),BEACONS[id].color);}
for(const h of [390,800,1440])for(const distance of [150,460,900]){const p=new T.Vector3(0,0,-distance),size=beaconScale(camera,p,h),pixels=size/distance/(2*Math.tan(camera.fov*Math.PI/360))*h;assert(Math.abs(pixels-10)<1e-6);}
const sensors=new Sensors(),wall=new T.Mesh(new T.BoxGeometry(3,3,1),new T.MeshStandardMaterial({color:'blue'}));scene.add(wall);scene.background=new T.Color('gray');scene.fog=new T.FogExp2('gray',.01);
const before=new Map();scene.traverse(o=>{if(o.isMesh)before.set(o,o.material);});const bg=scene.background,fog=scene.fog;
const renderer={render(){for(const r of Object.values(fleet.records)){r.proxy.traverse(o=>{if(o.isMesh)assert.equal(o.material,sensors.hot);});assert.equal(r.root.userData.beacon.material.color.getHex(),BEACONS[r.id].color);}assert.notEqual(wall.material,sensors.hot);assert(sensors.hot.depthTest&&!sensors.hot.fog);}};
sensors.render(renderer,scene,camera,'thermal',Object.values(fleet.meshes));before.forEach((m,o)=>assert.equal(o.material,m));assert.equal(scene.background,bg);assert.equal(scene.fog,fog);
assert.throws(()=>sensors.render({render(){throw Error('GPU failure');}},scene,camera,'thermal',Object.values(fleet.meshes)));before.forEach((m,o)=>assert.equal(o.material,m));
s.mode='drone';fleet.update(.02,s,trailer,bike,camera);assert(!fleet.records.scout.root.visible,'FPV hides only own aircraft');assert(fleet.records.relay.root.visible);
console.log('PASS: four permanent beacon identities, restrained halos and white cores, compact 10px projection at 150/460/900m across viewport heights, occlusion flags, thermal deployed/perched/relay heat and material restoration. GPU appearance remains a playtest.');
