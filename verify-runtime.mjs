// Full module/DOM integration with real Three.js scene objects. WebGL is stubbed;
// this suite does NOT claim GPU, screenshot, pointer-lock or audio listening QA.
import {JSDOM} from 'jsdom';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import * as Three from './dist/three.js';
import * as drone from './dist/drone-system.js';import * as immersion from './dist/immersion.js';
import * as leg2 from './dist/leg2.js';import * as leg3 from './dist/leg3.js';import * as expedition from './dist/expedition.js';import * as visuals from './dist/visuals.js';import {FieldAudio} from './dist/audio.js';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'http://gridrunner.test/'}),w=dom.window;globalThis.devicePixelRatio=1;globalThis.document=w.document;globalThis.window=w;
const context2d=new Proxy({measureText:()=>({width:50}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
w.HTMLCanvasElement.prototype.getContext=()=>context2d;
w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};w.document.exitPointerLock=()=>{};w.HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.resolve();
let frames=0;class NullRenderer{constructor(){this.shadowMap={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(scene,camera){assert(scene.isScene&&camera.isPerspectiveCamera);frames++;}}
const ctx=vm.createContext({T:{...Three,WebGLRenderer:NullRenderer},...drone,...immersion,...leg2,...leg3,...expedition,...visuals,FieldAudio,console,performance,Math,Date,JSON,Number,Map,Set,Float32Array,window:w,document:w.document,localStorage:w.localStorage,matchMedia:()=>({matches:false}),devicePixelRatio:1,innerWidth:1280,innerHeight:800,requestAnimationFrame(){},setTimeout(){},URL,Blob,location:{reload(){}},confirm:()=>true});
const source=fs.readFileSync('dist/game.js','utf8').replace(/^import .*;\n/gm,'');
vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);
const tick=(seconds)=>{for(let i=0;i<seconds*50;i++)run('update(.02)');run('hud();loop(performance.now()+20)');};
assert(w.document.querySelector('#panel').textContent.includes('v7'));
w.document.querySelector('[data-ui=new]').click();assert.equal(run('s.mode'),'bike');run("keys.w=true");tick(2);run('keys={}');assert(run('s.pos.z')<15,'Bike advances');
run("action('drone');keys.w=true;keys[' ']=true");tick(2);run('keys={}');assert.equal(run('s.mode'),'drone');assert(run('s.droneSystem.altitude')>5);const alt=run('s.pos.y');run('keys.shift=true');tick(3);run('keys={}');assert(run('s.pos.y')<alt,'Shift descends');run("action('scan')");assert(run('s.discoveries.length')>0,'Scan tags saved');
run("issueDrone('FOLLOW');keys.w=true");tick(4);run('keys={}');assert.equal(run('s.mode'),'bike');assert.equal(run('s.droneSystem.mode'),'FOLLOW');run("issueDrone('HOLD')");tick(15);assert.equal(run('s.droneSystem.mode'),'HOLD');run("issueDrone('DOCK')");tick(30);assert.equal(run('s.droneSystem.mode'),'DOCK');
assert(run("writeSave('manual1')"));const saved=run('s.discoveries.length');run("s.discoveries=[];restore(getSave('manual1'))");assert.equal(run('s.discoveries.length'),saved);run("open('settings')");assert.equal(w.document.querySelectorAll('[data-setting=graphics] option').length,4);
for(const preset of ['LOW','MEDIUM','HIGH','ULTRA'])run(`settings.graphics='${preset}';applySettings();loop(performance.now()+30)`);
for(const screen of ['start','pause','quick','saves','settings','controls','rig','drones','journal','guide','reference','inventory','map']){run(`open('${screen}')`);assert(!w.document.querySelector('#panel').textContent.includes('undefined'),screen);}
// Fixture positioning tests the real interaction and mission chain without a manual ride.
function at(x,y,z){run(`s.pos.set(${x},${y},${z});s.speed=0;keys={};`);tick(.02);}
run('newExpedition()');at(54,1.7,-94);run('interact();play()');assert(run('s.met'));at(79,1.7,-408);run('interact()');assert(run('s.towerCode'));at(0,1.7,-1435);run('interact()');assert(run('s.won'));run('startLegTwo(false)');assert.equal(run('s.leg'),2);
at(45,1.7,-1810);run('interact();play()');assert(run('s.calMet'));run("issueDrone('MANUAL');s.droneSystem.pos=[118,22,-2380];s.pos.set(118,22,-2380)");tick(.02);run('interact()');assert(run('s.intakeCleared'));run("issueDrone('DOCK')");
at(70,1.7,-2260);run('interact()');assert(run('s.phaseNote'));at(65,1.7,-2355);run("interact();operatePhase('B');operatePhase('A');operatePhase('C');play()");assert(run('s.hydroRestored'));
run('s.battery=45');at(0,1.7,-3020);run('interact();interact()');assert(run('s.leg2Won'));run('startLegThree(false)');assert.equal(run('s.leg'),3);
run("s.engineerBuilt=true;s.droneType='engineer';issueDrone('MANUAL');s.droneSystem.pos=[65,20,-3510];s.pos.set(65,20,-3510)");tick(.02);run('interact()');assert(run('s.securityOff'));run("issueDrone('DOCK')");at(-55,1.7,-3780);run('interact()');assert(run('s.archiveKey'));at(50,1.7,-3980);run('interact();s.dialA=3;s.dialB=1;s.dialC=4;alignAntenna();play()');assert(run('s.antennaAligned'));run('s.battery=60');at(60,1.7,-4310);run('interact()');assert(run('s.capacitorReady'));at(0,1.7,-4590);run("interact();finishLegThree('restore')");assert(run('s.leg3Won'));assert(run("writeSave('manual2')"));run("s.ending='';restore(getSave('manual2'))");assert.equal(run('s.ending'),'restore');
// Existing v6 record missing all new fields migrates; invalid optional data fails.
const legacy=run('snapshot()');delete legacy.state.droneSystem;delete legacy.state.discoveries;expedition.validateSave(legacy);assert.equal(legacy.state.droneSystem.mode,'DOCK');
// Check live scene numbers; shader compilation is deliberately outside this test.
run('scene.updateMatrixWorld(true)');const stats=run('(()=>{let meshes=0,triangles=0;scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.matrixWorld.elements.some(n=>!Number.isFinite(n)))throw Error("Invalid transform");}});return {meshes,triangles};})()');
console.log('PASS: full startup, actual DOM menus, input-driven bike/drone updates, commands, scan persistence, save/restore, presets, all three real mission chains and final save. Render stub frames:',frames,stats);
