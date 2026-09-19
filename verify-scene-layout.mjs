import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from './dist/three.js';
import {AUTHORED_FOOTPRINTS,SETTLEMENT_LAYOUT,sceneryAllowed,placeScenery} from './dist/scene-layout.js';
import {makeMaraShelter,makePerson} from './dist/visuals.js';
import {EnvironmentDetail} from './dist/environment-detail.js';
import {Immersion} from './dist/immersion.js';
import {makeSettlements} from './dist/settlements.js';
const {window}=new JSDOM('<!doctype html><canvas/>');globalThis.document=window.document;globalThis.window=window;globalThis.devicePixelRatio=1;
const context=new Proxy({measureText:()=>({width:50})},{get:(o,k)=>k in o?o[k]:()=>{}});window.HTMLCanvasElement.prototype.getContext=()=>context;

// Use real geometry and raycasting: the roof must be above the entire NPC,
// and moving through the entrance must not intersect a post or roof collider.
const scene=new T.Scene(),solids=[],shelter=makeMaraShelter(solids),mara=makePerson(54,-94,0x9ca78b);scene.add(shelter,mara);scene.updateMatrixWorld(true);
const actorBounds=new T.Box3().setFromObject(mara);
const up=new T.Raycaster(new T.Vector3(54,actorBounds.max.y+.01,-94),new T.Vector3(0,1,0));
const overhead=up.intersectObject(shelter,true);
assert(overhead.length>0,'Mara has a real roof above her');
assert(overhead[0].point.y-actorBounds.max.y>1.6,'Mara has at least 1.6m head clearance');
for(const z of [-86,-90,-94,-98,-102])assert(!solids.some(b=>Math.abs(54-b.x)<b.w&&Math.abs(z-b.z)<b.d&&b.minY<2.2&&b.maxY>.15),'Clear walk/talk bay at '+z);
assert(solids.some(b=>b.minY>3&&Math.abs(b.z+94)<2),'Roof has overhead-only collision');

// Test the real instanced transforms after all rejection sampling. This catches
// off-by-one instance counts that otherwise leave a stack at the world origin.
const scenerySolids=[],environment=new EnvironmentDetail(new T.Scene(),{textures:false,solids:scenerySolids});let checked=0;
assert(scenerySolids.filter(b=>b.kind==='tree').length>100,'Generated oak trunks register physical collision');
assert(scenerySolids.some(b=>b.kind==='rock'),'Large roadside rocks register physical collision');
assert(scenerySolids.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&b.w>0&&b.d>0&&b.maxY>b.minY),'Generated collision volumes are valid');
const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion();
for(const {mesh,max} of environment.batches){
 if(mesh.geometry.type==='CircleGeometry')continue; // Flush road-surface wear.
 for(let i=0;i<max;i++){
  mesh.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  const radius=mesh.geometry.type==='PlaneGeometry'?scale.x/2:mesh.geometry.type==='CylinderGeometry'?.5:/oak crowns/.test(mesh.name||'')?Math.max(scale.x,scale.z)*.6:Math.max(scale.x,scale.y,scale.z);
  assert(sceneryAllowed(position.x,position.z,radius),`Environment ${mesh.geometry.type} intersects authored site at ${position.x},${position.z}`);checked++;
 }
}
const decorScene=new T.Scene(),camera=new T.PerspectiveCamera(),sun=new T.DirectionalLight();decorScene.add(camera,sun);
const immersion=new Immersion(decorScene,{shadowMap:{}},camera,sun,new T.Group(),new T.Group());
for(const mesh of immersion.instances){
 if(!mesh.userData.sceneryClearance)continue;
 mesh.geometry.computeBoundingSphere();
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  const radius=mesh.geometry.boundingSphere.radius*Math.max(scale.x,scale.z);
  assert(sceneryAllowed(position.x,position.z,Math.max(0,radius-.001)),`Immersion ${mesh.geometry.type} intersects authored site at ${position.x},${position.z}`);checked++;
 }
}

const townScene=new T.Scene(),townSolids=[],town=makeSettlements(townScene,townSolids);townScene.updateMatrixWorld(true);
for(const {actor,site} of town.actors){
 const bounds=new T.Box3().setFromObject(actor),p=actor.getWorldPosition(new T.Vector3());
 const hits=new T.Raycaster(new T.Vector3(p.x,bounds.max.y+.01,p.z),new T.Vector3(0,1,0)).intersectObjects(town.groups.map(q=>q.g),true);
 assert(hits.length&&hits[0].point.y-bounds.max.y>1.2,'Resident roof clearance: '+site.id);
 assert(!townSolids.some(b=>Math.abs(p.x-b.x)<b.w&&Math.abs(p.z-b.z)<b.d&&b.minY<bounds.max.y&&b.maxY>bounds.min.y),'Resident clear of physical posts: '+site.id);
}
assert.equal(SETTLEMENT_LAYOUT.length,9);
assert.equal(placeScenery(()=>({x:54,z:-94}),2,3),null,'No unsafe fallback after rejected samples');
assert.equal(sceneryAllowed(NaN,0),false);
for(const b of AUTHORED_FOOTPRINTS)assert(!sceneryAllowed(b.x,b.z,1),'Authored footprint excluded: '+b.id);
console.log(`PASS: real Mara and resident roof/head clearance, traversable camp, ${checked} actual scenery transforms clear of authored footprints, roads and saved pickups; bounded sampling has no origin fallback.`);
