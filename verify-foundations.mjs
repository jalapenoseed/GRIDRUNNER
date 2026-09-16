import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as ort from './dist/vendor/vision/ort.wasm.min.mjs';
import {YOLO_SIZE,letterbox,bgrTensor,decodeYolo} from './dist/yolo-core.js';
import {VisionDetector} from './dist/vision-detector.js';
import {MenuMemory} from './dist/menu-memory.js';
import {GamePhysics} from './dist/physics-world.js';
import {SpatialIndex} from './dist/spatial-index.js';
import {moveRiderFallback,droneHull,riderGradeAllowed} from './dist/collision-shapes.js';
import {createDrone,updateDrone,commandDrone} from './dist/drone-system.js';
import {heightAt} from './dist/visuals.js';
import {JSDOM} from 'jsdom';

const rgba=new Uint8ClampedArray(YOLO_SIZE*YOLO_SIZE*4);rgba.set([12,34,56,255]);const tensor=bgrTensor(rgba);assert.equal(tensor[0],56);assert.equal(tensor[416*416],34);assert.equal(tensor[2*416*416],12);
assert.deepEqual(letterbox(800,400),{ratio:.52,width:416,height:208});assert.deepEqual(letterbox(400,800),{ratio:.52,width:208,height:416});
const raw=new Float32Array(3549*85);raw.set([2,2,1,1,.8,.9],0);raw.set([1,2,1,1,.7,.9],85);const boxes=decodeYolo(raw,[1,3549,85],416,416);assert.equal(boxes.length,1);assert.equal(boxes[0].label,'person');assert(Math.abs(boxes[0].score-.72)<1e-6);assert.throws(()=>decodeYolo(raw,[1,85,3549],416,416));
// Execute the actual committed model and matching committed CPU/WASM runtime.
ort.env.wasm.numThreads=1;const bytes=await readFile('dist/vendor/vision/yolox_nano.onnx'),session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
const input=new ort.Tensor('float32',new Float32Array(3*416*416).fill(114),[1,3,416,416]),start=performance.now();const output=await session.run({[session.inputNames[0]]:input});const result=output[session.outputNames[0]];assert.deepEqual(result.dims,[1,3549,85]);assert(result.data.every(Number.isFinite));assert.equal(decodeYolo(result.data,result.dims,416,416).length,0);console.log('YOLOX actual WASM inference',Math.round(performance.now()-start)+' ms; SHA-256',createHash('sha256').update(bytes).digest('hex'));input.dispose();Object.values(output).forEach(t=>t.dispose());await session.release();

const dom=new JSDOM('<body><div id="panel"><div id="fieldContent"><button data-action="a">A</button><button data-action="b">B</button><details><summary>More</summary></details></div></div></body>',{url:'http://test.local'}),doc=dom.window.document;
let worker;const detector=new VisionDetector({document:doc,workerFactory:()=>worker={postMessage(){},terminate(){this.terminated=true;}}});
assert(detector.toggle());worker.onmessage({data:{kind:'ready'}});detector.pending={id:1,width:800,height:400,pose:[0,0,0,0,0,0]};detector.busy=true;worker.onmessage({data:{kind:'result',id:1,boxes:[{label:'person',score:.8,x1:80,y1:40,x2:160,y2:200}],ms:50}});detector.update(null,performance.now(),{pose:[0,0,0,0,0,0]});assert.equal(doc.querySelectorAll('.visionBox').length,1);detector.update(null,performance.now(),{pose:[10,0,0,0,0,0]});assert.equal(doc.querySelectorAll('.visionBox').length,0,'camera movement clears stale boxes');detector.update(null,performance.now(),{active:false});assert(detector.readout.hidden);detector.toggle();assert(worker.terminated);assert(!detector.enabled);
detector.toggle();worker.onmessage({data:{kind:'error',message:'test failure'}});assert.equal(detector.state,'error');assert.equal(doc.querySelectorAll('.visionBox').length,0);detector.toggle();
const panel=doc.querySelector('#panel'),memory=new MenuMemory(dom.window.localStorage);memory.attach(panel);memory.restore(panel,'inventory',{id:'equipment'});panel.querySelector('[data-action=b]').focus();panel.querySelector('#fieldContent').scrollTop=80;memory.capture(panel);memory.current='';panel.querySelector('[data-action=a]').focus();const copy=new MenuMemory(dom.window.localStorage);copy.restore(panel,'inventory',{id:'equipment'});assert.equal(doc.activeElement.dataset.action,'b');assert.equal(panel.querySelector('#fieldContent').scrollTop,80);assert.equal(copy.children.equipment,'inventory');copy.lesson(panel.querySelector('#fieldContent'),'drones');panel.querySelector('.firstUse button').click();assert(copy.dismissed.drones);assert(!panel.querySelector('.firstUse'));copy.lesson(panel.querySelector('#fieldContent'),'rig',false);assert(!panel.querySelector('.firstUse'));

const wall={x:0,z:0,w:.1,d:5,minY:0,maxY:5};const index=new SpatialIndex([wall,{...wall,w:Infinity}]);assert.equal(index.queryPoint(0,0).length,1);assert.deepEqual(index.queryPoint(Infinity,0),[]);
const moved=moveRiderFallback(index,{x:-3,y:1.7,z:0},20,0);assert(moved.hit&&moved.x<-.2,'fallback cannot tunnel');
const physics=new GamePhysics([wall,{x:0,z:20,w:4,d:4,minY:0,maxY:.4,surface:'rideable'}]);await physics.ready;assert(!physics.moveRider({x:-6,y:1.7,z:20},12,0,{mode:'bike'}).hit,'rideable slab does not snag bike');assert(physics.moveRider({x:-6,y:1.7,z:0},12,0,{mode:'bike'}).hit);
const hullTest=new GamePhysics([{x:0,z:0,w:5,d:5,minY:3,maxY:3.2}]);await hullTest.ready;assert(!hullTest.sweepDrone([-7,2.6,0],[7,2.6,0],'scout'));assert(hullTest.sweepDrone([-7,2.6,0],[7,2.6,0],'cargo'));assert(droneHull('cargo',6)[1]>droneHull('cargo')[1]);
let d=createDrone([-.6,2,0]);d.mode='RETURN HOME';updateDrone(d,.05,{home:[.6,2,0],battery:100,solids:[wall]});assert.notEqual(d.mode,'DOCK','docking cannot snap through a wall');
d=createDrone([0,2,0]);d.mode='MANUAL';d.velocity=[10,0,0];updateDrone(d,.05,{home:[0,2,0],battery:100,terrain:x=>x>.1?10:0});assert(d.pos[1]<3,'rejected high terrain cannot lift drone at old position');
physics.dispose();hullTest.dispose();console.log('PASS: YOLO preprocessing/decode/NMS/actual inference, honest failure/stale boxes, persistent menu hints/focus/scroll, finite collision indexing, swept fallback, rideable surfaces, class/load hulls, wall-safe docking and terrain rollback.');

const canopy=[{x:0,z:0,w:3,d:3,minY:3.8,maxY:4}],loaded=createDrone([0,2,0]);commandDrone(loaded,'MANUAL',[0,2,0],100,canopy,{type:'cargo',payloadKg:6});assert(loaded.pos[1]+droneHull('cargo',6)[1]<3.8,'loaded takeoff remains below canopy');
const offsetWall=[{x:1.4,z:-5,w:.5,d:1,minY:0,maxY:15}],cargo=createDrone([0,10,0]);cargo.mode='SCOUT AHEAD';for(let i=0;i<800;i++)updateDrone(cargo,.05,{home:[0,10,0],battery:100,type:'cargo',solids:offsetWall,taskTarget:[0,10,-15]});assert(cargo.pos[2]<-10,'autopilot routes its hull past an offset obstacle');
assert(!riderGradeAllowed(heightAt,{x:450,z:-1350},.1,0,'bike'),'creeping cannot bypass steep grade');assert(riderGradeAllowed(x=>x>.1?.15:0,{x:0,z:0},.1,0,'bike'),'small curb tolerated');
const side=moveRiderFallback(index,{x:-3,y:1.7,z:0},20,0,{mode:'bike',yaw:Math.PI/2});assert(side.x<=-.95,'sideways fallback protects bike length');
console.log('PASS: loaded canopy launch, hull-aware autopilot, speed-independent steep-grade rejection and rotated bike fallback.');
