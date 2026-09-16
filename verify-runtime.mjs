import {verifyPersonalFleet} from './verify-personal-fleet-integration.mjs';
import {PresenceComposer} from './dist/presence-composer.js';
import {ImportedProps} from './dist/imported-props.js';
import {setFieldAction,updateFieldRig} from './dist/presence-rig.js';
import {verifyMenuRepair} from './verify-menu-repair-integration.mjs';
import {verifySwarmSensorsIntegration} from './verify-swarm-sensors-integration.mjs';
import * as sensorLabModule from './dist/sensor-lab.js';
import * as swarmSteering from './dist/swarm-steering.js';
import * as sensorPackages from './dist/sensor-packages.js';
import * as surveillance from './dist/surveillance.js';
import * as openingRoute from './dist/opening-route.js';
import {OpeningWorld} from './dist/opening-world.js';
import {verifyPhase4Integration} from './verify-phase4-integration.mjs';
import * as fieldFlow from './dist/field-flow.js';
import {verifyPackIntegration} from './verify-pack-integration.mjs';
import * as batteryPacks from './dist/battery-packs.js';
import * as batteryPackUI from './dist/battery-pack-ui.js';
import * as relayOutpost from './dist/relay-outpost.js';
import {verifyLineHarvestIntegration} from './verify-line-harvest-integration.mjs';
import {verifyRelayOutpostIntegration,verifyTutorialRecovery} from './verify-relay-outpost-integration.mjs';
import * as powerLines from './dist/power-lines.js';
import * as lineHarvest from './dist/line-harvest.js';
import * as lineHarvestUI from './dist/line-harvest-ui.js';
import * as campaignProgress from './dist/campaign-progress.js';
import * as fleetPolicy from './dist/fleet-policy.js';
import * as fleetPolicyUI from './dist/fleet-policy-ui.js';
import * as fleetTasks from './dist/fleet-tasks.js';
import * as fleetTaskUI from './dist/fleet-task-ui.js';
import {riderGradeAllowed} from './dist/collision-shapes.js'; import {VisionDetector} from './dist/vision-detector.js'; import {beamSolids} from './dist/world-collision.js'; import {GamePhysics} from './dist/physics-world.js';
import {verifyFlightIntegration} from './verify-flight-integration.mjs';
import {verifyFleetTaskIntegration} from './verify-fleet-task-integration.mjs';
import * as droneControls from './dist/drone-controls.js';
import {AmbientResidents} from './dist/ambient-residents.js';
import {buildCampRoutes} from './dist/camp-navigation.js';
import * as onboarding from './dist/onboarding.js';
import {SpatialIndex} from './dist/spatial-index.js';
import {Sensors} from './dist/sensors.js';
import * as fieldUpgrade from './dist/field-upgrade.js';
import * as squadron from './dist/squadron.js';
import {SurfaceMaterials} from './dist/surface-shaders.js';
import * as fieldBook from './dist/field-book.js';
import * as backpack from './dist/backpack.js';
import * as fieldInterface from './dist/interface.js';
import * as sceneLayout from './dist/scene-layout.js';
import {verifyIntroIntegration} from './verify-intro.mjs';
import * as intro from './dist/intro.js';
import * as weather from './dist/weather-system.js';
import * as yard from './dist/flight-yard.js';
import * as fleetModule from './dist/drone-fleet.js';
import {EnvironmentDetail} from './dist/environment-detail.js';
import * as relay from './dist/relay-house.js';
import * as relayWorldModule from './dist/relay-world.js';
import * as relayUI from './dist/relay-ui.js';
import {machineSettings} from './dist/control-settings.js';
import {drawInstruments} from './dist/instruments.js';
import {ControllerBridge,menuControls} from './dist/controller-bridge.js';
import * as experience from './dist/experience.js';
import {CameraManager} from './dist/camera-manager.js';
import * as settlements from './dist/settlements.js';
import * as survival from './dist/survival.js';
// Full module/DOM integration with real Three.js scene objects. WebGL is stubbed;
// this suite does NOT claim GPU, screenshot, pointer-lock or audio listening QA.
import {JSDOM} from 'jsdom';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import * as Three from './dist/three.js';
import * as drone from './dist/drone-system.js';import * as immersion from './dist/immersion.js';
import * as leg2 from './dist/leg2.js';import * as leg3 from './dist/leg3.js';import * as expedition from './dist/expedition.js';import * as visuals from './dist/visuals.js';import {FieldAudio} from './dist/audio.js';
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'http://gridrunner.test/'}),w=dom.window;globalThis.devicePixelRatio=1;globalThis.document=w.document;globalThis.window=w;
const context2d=new Proxy({measureText:()=>({width:50}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});
const playedNarration=[];w.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.paused=true;}play(){this.paused=false;playedNarration.push(this.src);return Promise.resolve();}pause(){this.paused=true;}};
w.HTMLCanvasElement.prototype.getContext=()=>context2d;
w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};w.document.exitPointerLock=()=>{};w.HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.resolve();
let frames=0;class NullRenderer{constructor(){this.shadowMap={};this.info={render:{calls:0}};}setPixelRatio(){}setSize(){}render(scene,camera){assert(scene.isScene&&camera.isPerspectiveCamera);frames++;}}
const ctx=vm.createContext({...sensorPackages,...fieldFlow,...onboarding,Sensors,...fieldUpgrade,...squadron,SurfaceMaterials:class extends SurfaceMaterials{constructor(){super({textures:false});}},...fieldBook,...backpack,...fieldInterface,...sceneLayout,...intro,...weather,...yard,...fleetModule,DroneFleet:class extends fleetModule.DroneFleet{constructor(scene){super(scene,{assets:false});}},EnvironmentDetail:class extends EnvironmentDetail{constructor(scene){super(scene,{textures:false});}},...relay,...relayWorldModule,...relayUI,makeRelayHouseWorld:(scene,solids)=>relayWorldModule.makeRelayHouseWorld(scene,solids,{assets:false}),machineSettings,drawInstruments,ControllerBridge,menuControls,...experience,CameraManager,augmentPOVPanel(){},...settlements,...survival,T:{...Three,WebGLRenderer:NullRenderer},...drone,...immersion,...leg2,...leg3,...expedition,...visuals,FieldAudio,console,performance,Math,Date,JSON,Number,Map,Set,Float32Array,window:w,document:w.document,localStorage:w.localStorage,matchMedia:()=>({matches:false}),devicePixelRatio:1,innerWidth:1280,innerHeight:800,requestAnimationFrame(){},setTimeout(){},URL,Blob,location:{reload(){}},confirm:()=>true});
Object.assign(ctx,{VisionDetector,beamSolids,riderGradeAllowed,PresenceComposer,ImportedProps,setFieldAction,updateFieldRig},batteryPacks,batteryPackUI,campaignProgress,fleetPolicy,fleetPolicyUI,droneControls,fleetTasks,fleetTaskUI,relayOutpost,powerLines,lineHarvest,lineHarvestUI);ctx.SpatialIndex=SpatialIndex;ctx.GamePhysics=GamePhysics;ctx.AmbientResidents=class extends AmbientResidents{constructor(mara,settlements,solids){super(mara,settlements,solids,{build:buildCampRoutes});}};
const source=fs.readFileSync('dist/game.js','utf8').replace(/^import .*;\n/gm,'');
Object.assign(ctx,sensorLabModule,swarmSteering,surveillance,openingRoute,{OpeningWorld:class extends OpeningWorld{constructor(scene,solids){super(scene,solids,{assets:false});}}});
vm.runInContext(source,ctx);const run=code=>vm.runInContext(code,ctx);
await run('spatial.ready');await run('ambientResidents.ready');assert.equal(run('spatial.status'),'ready');assert.equal(run('ambientResidents.status'),'ready');
const tick=(seconds)=>{for(let i=0;i<seconds*50;i++)run('update(.02)');run('hud();loop(performance.now()+20)');};
vm.runInContext(`function newCampaign(){newExpedition();s.intro=completedIntro();s.mode='bike';s.pos.set(bike.position.x,1.7,bike.position.z);hud();}`,ctx);
if(process.argv.includes('--personal-fleet')){verifyPersonalFleet({run,tick,w});process.exit(0);}
if(process.argv.includes('--menu-repair')){verifyMenuRepair({run,tick,w});process.exit(0);}
if(process.argv.includes('--swarm-sensors')){verifySwarmSensorsIntegration({run,tick,w});process.exit(0);}
if(process.argv.includes('--phase4')){verifyPhase4Integration({run,tick,w});process.exit(0);}
assert.equal(run('screen'),'prologue');assert.equal(run('started'),false);w.document.querySelector('[data-story-action=next]').click();assert.equal(run('storyPage'),1);w.document.querySelector('[data-story-action=next]').click();w.document.querySelector('[data-story-action=finish]').click();assert.equal(run('screen'),'start');assert.equal(run('started'),false);assert(w.document.querySelector('#panel').textContent.includes('v7'));
verifyIntroIntegration({run,tick,w});
run('newCampaign()');assert.equal(run('s.mode'),'bike');run("keys.w=true");tick(2);run('keys={}');assert(run('s.pos.z')<15,'Bike advances');
run("action('drone');keys.w=true;keys[' ']=true");tick(2);run('keys={}');assert.equal(run('s.mode'),'drone');assert(run('s.droneSystem.altitude')>5);const alt=run('s.pos.y');run('keys.shift=true');tick(3);run('keys={}');assert(run('s.pos.y')<alt,'Shift descends');run("action('scan')");assert(run('s.discoveries.length')>0,'Scan tags saved');
run("issueDrone('FOLLOW');keys.w=true");tick(4);run('keys={}');assert.equal(run('s.mode'),'bike');assert.equal(run('s.droneSystem.mode'),'FOLLOW');run("issueDrone('HOLD')");tick(15);assert.equal(run('s.droneSystem.mode'),'HOLD');run("issueDrone('DOCK')");tick(30);assert.equal(run('s.droneSystem.mode'),'DOCK');
assert(run("writeSave('manual1')"));const saved=run('s.discoveries.length');run("s.discoveries=[];restore(getSave('manual1'))");assert.equal(run('s.discoveries.length'),saved);run("open('settings')");assert.equal(w.document.querySelectorAll('[data-setting=graphics] option').length,4);
for(const preset of ['LOW','MEDIUM','HIGH','ULTRA'])run(`settings.graphics='${preset}';applySettings();loop(performance.now()+30)`);
for(const screen of ['start','pause','quick','saves','settings','controls','rig','drones','journal','guide','reference','inventory','map']){run(`open('${screen}')`);assert(!w.document.querySelector('#panel').textContent.includes('undefined'),screen);}
// Fixture positioning tests the real interaction and mission chain without a manual ride.
function at(x,y,z){run(`s.pos.set(${x},${y},${z});s.speed=0;keys={};`);tick(.02);}
run('newCampaign()');at(54,1.7,-94);run('interact();play()');assert(run('s.met'));at(79,1.7,-408);run('interact();takeLoot("all");play()');assert(run('s.towerCode'));at(0,1.7,-1435);run('interact()');assert(run('s.won'));run('startLegTwo(false)');assert.equal(run('s.leg'),2);
at(45,1.7,-1810);run('interact();play()');assert(run('s.calMet'));run("issueDrone('MANUAL');s.droneSystem.pos=[118,22,-2380];s.pos.set(118,22,-2380)");tick(.02);run('interact()');assert(run('s.intakeCleared'));run("issueDrone('DOCK')");
at(70,1.7,-2260);run('interact()');assert(run('s.phaseNote'));at(65,1.7,-2355);run("interact();operatePhase('B');operatePhase('A');operatePhase('C');play()");assert(run('s.hydroRestored'));
run('s.battery=45');at(0,1.7,-3020);run('interact();interact()');assert(run('s.leg2Won'));run('startLegThree(false)');assert.equal(run('s.leg'),3);
run("s.engineerBuilt=true;s.droneType='engineer';issueDrone('MANUAL');s.droneSystem.pos=[65,20,-3510];s.pos.set(65,20,-3510)");tick(.02);run('interact()');assert(run('s.securityOff'));run("issueDrone('DOCK')");at(-55,1.7,-3780);run('interact()');assert(run('s.archiveKey'));at(50,1.7,-3980);run('interact();s.dialA=3;s.dialB=1;s.dialC=4;alignAntenna();play()');assert(run('s.antennaAligned'));run('s.battery=60');at(60,1.7,-4310);run('interact()');assert(run('s.capacitorReady'));at(0,1.7,-4590);run("interact();finishLegThree('restore')");assert(run('s.leg3Won'));assert(run("writeSave('manual2')"));run("s.ending='';restore(getSave('manual2'))");assert.equal(run('s.ending'),'restore');
// Existing v6 record missing all new fields migrates; invalid optional data fails.
const legacy=run('snapshot()');delete legacy.state.droneSystem;delete legacy.state.discoveries;delete legacy.state.fleetFormation;expedition.validateSave(legacy);assert.equal(legacy.state.droneSystem.mode,'DOCK');assert.equal(legacy.state.fleetFormation,'WEDGE');
// Check live scene numbers; shader compilation is deliberately outside this test.
run('scene.updateMatrixWorld(true)');const stats=run('(()=>{let meshes=0,triangles=0;scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);if(o.matrixWorld.elements.some(n=>!Number.isFinite(n)))throw Error("Invalid transform");}});return {meshes,triangles};})()');
console.log('PASS: full startup, actual DOM menus, input-driven bike/drone updates, commands, scan persistence, save/restore, presets, all three real mission chains and final save. Render stub frames:',frames,stats);
// Fieldwork: real DOM events, transactions, mining and persistent depleted state.
run('newCampaign();s.inv.toaster=1;open("supplies")');
w.document.querySelector('[data-pack-item=toaster]').click();w.document.querySelector('[data-field=salvage][data-item=toaster]').click();assert.equal(run('s.inv.toaster'),0);assert.equal(run('s.inv.copper'),1);
run('s.pos.copy(bike.position);open("supplies")');w.document.querySelector('[data-pack-item=copper]').click();w.document.querySelector('[data-field=store][data-item=copper][data-storage=bike]').click();assert.equal(run('s.field.storage.bike.copper'),1);assert.equal(run('s.inv.copper'),0);
w.document.querySelector('[data-pack-source=bike]').click();w.document.querySelector('[data-pack-item=copper]').click();w.document.querySelector('[data-field=retrieve][data-item=copper][data-storage=bike]').click();w.document.querySelector('[data-pack-source=pack]').click();assert.equal(run('s.inv.copper'),1);
run('s.inv.steel=4;s.inv.rubber=1;s.pos.copy(trailer.position);open("workshop")');w.document.querySelector('[data-field=craft][data-item=pickaxe]').click();assert.equal(run('s.inv.pickaxe'),1);
run('activeField=s.field.world.find(p=>p.kind==="node").id;s.pos.set(s.field.world[5].x,1.7,s.field.world[5].z);open("supplies")');w.document.querySelector('[data-field=mine]').click();tick(4.2);assert.equal(run('s.field.world[5].left'),3);assert.equal(run('fieldJob'),null);
run('s.inv.fuel=1;s.fuel=0;s.pos.copy(trailer.position);open("supplies")');w.document.querySelector('[data-pack-item=fuel]').click();w.document.querySelector('[data-field=refuel]').click();assert.equal(run('s.fuel'),1);assert.equal(run('s.inv.fuel'),0);
assert(run('writeSave("manual1")'));run('s.field.storage.bike={};s.field.world[5].left=4;restore(getSave("manual1"))');assert.equal(run('s.field.world[5].left'),3);
const old=run('snapshot()');delete old.state.field;assert.equal(expedition.validateSave(old).state.field.world.length,144);
run('newCampaign();s.pos.set(54,1.7,-94);s.inv.steel=20');for(let i=0;i<3;i++){run('open("rig")');w.document.querySelector('[data-ui=fuel]').click();}assert.equal(run('s.field.fuelTrades'),2);assert.equal(run('s.inv.steel'),12);
const inaccessible=run('s.field.world.filter(p=>solids.some(b=>Math.abs(p.x-b.x)<b.w+2&&Math.abs(p.z-b.z)<b.d+2)).map(p=>p.id)');console.log('Field sites near solid infrastructure:',inaccessible);
console.log('PASS: DOM salvage, cargo transfer, fabrication, timed mining, fuel pour, finite trade, depletion save/reload and legacy field migration.');
run('open("controls")');const launchSelect=w.document.querySelector('[data-remap=q]');launchSelect.value='z';launchSelect.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(run('mappedKey("z")'),'q');assert.equal(run('mappedKey("q")'),'');run('play()');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'z'}));assert.equal(run('s.mode'),'drone');assert.equal(JSON.parse(w.localStorage.getItem('gridrunner.keys')).q,'z');
console.log('PASS: visible rebind UI, persisted launch mapping, old key disabled and real remapped launch event.');
// Settlements: proximity-gated real interaction, finite barter and save migration.
run('newCampaign();s.pos.set(-123,1.7,-146);s.inv.steel=4');tick(.02);assert.equal(run('nearest.id'),'riggs');run('interact()');assert(w.document.querySelector('#panel').textContent.includes('Riggs'));w.document.querySelector('[data-resident-trade=riggs]').click();assert.equal(run('s.inv.cutters'),1);assert.equal(run('s.inv.steel'),2);assert.equal(run('s.residents.riggs.trades'),1);assert(w.document.querySelector('[data-resident-trade=riggs]').disabled);
assert(run('writeSave("manual1")'));run('s.residents={};restore(getSave("manual1"))');assert.equal(run('s.residents.riggs.trades'),1);run('open("journal")');assert(w.document.querySelector('#panel').textContent.includes('Seized motors'));
const noResidents=run('snapshot()');delete noResidents.state.residents;assert.deepEqual(expedition.validateSave(noResidents).state.residents,{});const badResidents=run('snapshot()');badResidents.state.residents.riggs.trades=999;assert.throws(()=>expedition.validateSave(badResidents));
run('s.pos.set(-126,1.7,-160)');const beforeZ=run('s.pos.z');run('move(0,-1)');assert(run('s.pos.z')<beforeZ,'Open front is walkable');
for(const leg of [1,2,3]){run(`s.leg=${leg};settlementWorld.update(s,0,"LOW")`);assert.equal(run('settlementWorld.groups.filter(p=>p.g.visible&&p.site.leg!==s.leg).length'),0);}
// Crossing Drywell's culling boundary must not change shader light counts.
const lightCounts=[];for(const z of [15,-25,-600]){run(`s.leg=1;s.pos.set(0,1.7,${z});settlementWorld.update(s,0,'HIGH')`);lightCounts.push(run('(()=>{let n=0;scene.traverseVisible(o=>{if(o.isPointLight)n++;});return n;})()'));}
assert(lightCounts.every(n=>n===lightCounts[0]),'Settlement culling keeps the visible point-light count stable');
console.log('PASS: resident interaction, finite trade, journal, save/reload/migration, malformed stock rejection, walkable interior and settlement Leg culling.');
run('newCampaign();settings.autosave=false');for(let i=0;i<8;i++){run('changePOV();loop(performance.now()+20)');assert.equal(run('s.mode'),'bike');}run('s.experience.preferred.bike="wide";s.mode="foot";changePOV();loop(performance.now()+20)');assert.equal(run('s.experience.preferred.walking'),'shoulder');assert.equal(run('s.experience.preferred.bike'),'wide');assert(run('walkingBody.visible'));
run('s.mode="bike";issueDrone("MANUAL");s.experience.preferred.drone="chase";loop(performance.now()+20)');assert.equal(run('s.mode'),'drone');assert(run('scoutMesh.visible'));run('issueDrone("FOLLOW");loop(performance.now()+20)');assert.equal(run('s.mode'),'bike');assert.equal(run('s.experience.preferred.bike'),'wide');
assert(run('writeSave("manual1")'));run('s.experience=createExperience();restore(getSave("manual1"))');assert.equal(run('s.experience.preferred.drone'),'chase');assert.equal(run('s.experience.preferred.walking'),'shoulder');const oldPOV=run('snapshot()');delete oldPOV.state.experience;assert.equal(expedition.validateSave(oldPOV).state.experience.preferred.bike,'helmet');
run('open("settings")');assert.equal(w.document.querySelectorAll('[data-pov-state]').length,6);run('settings.reduceMotion=true;loop(performance.now()+20)');assert.equal(run('povCamera.transition'),0);
console.log('PASS: repeated POV cycles, walking body, drone chase/return, independent view persistence, old-save defaults, settings UI and reduced-motion transitions.');
// Relay House: traverse actual porch and stair collision geometry, then solve
// through the same DOM/interaction adapters used by players.
run('newCampaign();settings.reduceMotion=false;s.mode="foot";s.pos.set(-86,1.7,-55);keys={};');
function walkTo(x,z){for(let i=0;i<1400;i++){const p=run('s.pos.toArray()'),dx=x-p[0],dz=z-p[2],length=Math.hypot(dx,dz);if(length<.12)return;const step=Math.min(.08,length);run(`move(${dx/length*step},${dz/length*step});update(.02);`);}throw Error('Walking route blocked toward '+x+','+z+' at '+run('s.pos.toArray()'));}
walkTo(-86,-76);assert(Math.abs(run('s.pos.y')-4.7)<.1,'Porch ramp reaches raised main floor');walkTo(-84,-86);walkTo(-84,-90);walkTo(-90,-90);walkTo(-98,-91.5);walkTo(-98,-103);assert(run('s.pos.y')<2.1,'Stairs descend to cellar');walkTo(-96.5,-103);walkTo(-94,-104);walkTo(-93,-102);
assert.equal(run('nearest.id'),'toolbox');run('interact()');assert.equal(run('s.inv.fuse'),1);walkTo(-94,-104);walkTo(-96.5,-103);walkTo(-98,-103);walkTo(-98,-91.5);walkTo(-90,-90);walkTo(-84,-90);walkTo(-84,-86);walkTo(-77,-76);assert.equal(run('nearest.id'),'cook');run('interact()');assert(run('s.relayHouse.fuseSeated'));
// Fixture positions below test machinery adapters after proving the walk route.
function relayAt(id,mode='foot'){run(`s.mode='${mode}';s.pos.set(...(()=>{const p=RELAY_HOTSPOTS.find(p=>p.id==='${id}');return [p.x,p.y,p.z]})());keys={};s.speed=0;`);if(mode==='drone')run('s.droneSystem.pos=s.pos.toArray()');tick(.02);assert.equal(run('nearest?.id'),id,'Reachable '+id);}
relayAt('generator');run('interact()');assert(run('s.relayHouse.power'));relayAt('board');run('interact()');relayAt('bunk');run('interact()');relayAt('terminal');run('interact()');assert.equal(run('screen'),'relayTerminal');assert(!run('paused'),'Diegetic terminal leaves world ticking');const elapsed=run('s.elapsed');tick(.1);assert(run('s.elapsed')>elapsed);
run('relayTerminal.run("login GHOST-147");relayTerminal.run("tune 147.20");relayTerminal.run("exit")');assert(run('s.relayHouse.loggedIn'));
relayAt('bench');run('interact()');w.document.querySelector('[data-field=craft][data-item=radioCoil]').click();assert.equal(run('s.inv.radioCoil'),1);w.document.querySelector('[data-field=craft][data-item=signalFilter]').click();assert.equal(run('s.inv.signalFilter'),1);run('play()');
relayAt('radio');run('interact()');assert(run('s.relayHouse.filterInstalled'));run('issueDrone("MANUAL")');relayAt('dish','drone');run('interact()');assert(run('s.relayHouse.dishAligned'));run('issueDrone("HOLD")');relayAt('radio');run('interact()');assert(!run('s.relayHouse.discovered'),'Distribution bus must be commissioned');relayAt('terminal');run('interact()');
function circuitRoute(branch,load){const el=w.document.querySelector('[data-circuit-branch='+branch+']');el.value=load;el.dispatchEvent(new w.Event('change',{bubbles:true}));}
circuitRoute('A','fan');circuitRoute('B','transmitter');circuitRoute('C','receiver');w.document.querySelector('[data-circuit-test]').click();assert(!run('s.relayHouse.circuits.running'),'Startup surge trips full load');circuitRoute('A','off');w.document.querySelector('[data-circuit-test]').click();assert(run('s.relayHouse.circuits.running'));assert(run('writeSave("manual2")'));run('restore(getSave("manual2"));relayTerminal.open()');assert(run('s.relayHouse.circuits.running'),'Intermediate startup survives reload');circuitRoute('A','fan');w.document.querySelector('[data-circuit-test]').click();assert(run('s.relayHouse.circuits.solved'));run('relayTerminal.run("exit")');relayAt('radio');run('interact()');assert(run('s.relayHouse.discovered'));assert(run('s.towerCode'));assert.equal(run('s.relay'),false,'Original campaign relay flag remains distinct');assert(run('writeSave("manual1")'));run('s.relayHouse=createRelayHouse();restore(getSave("manual1"))');assert(run('s.relayHouse.discovered'));run('open("journal")');assert(w.document.querySelector('#panel').textContent.includes('Someone changed the message'));
// Roof volume blocks the real simulation below the dish instead of a visual-only slab.
run('newCampaign();issueDrone("MANUAL");s.droneSystem.pos=[-82,6,-96];s.droneSystem.velocity=[0,12,0];s.pos.fromArray(s.droneSystem.pos);keys[" "]=true;');tick(2);assert(run('s.droneSystem.pos[1]')<8.1,'Cannot fly through the cabin roof');
const oldHouse=run('snapshot()');delete oldHouse.state.relayHouse;assert.equal(expedition.validateSave(oldHouse).state.relayHouse.discovered,false);
console.log('PASS: walkable raised porch and cellar stair, real machinery/terminal/crafting/dish adapters, live terminal clock, roof collision, distinct campaign flags and mystery save/reload.');
// Real controller bridge with fresh polled device objects and DOM selection.
let stubPads=[];Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>stubPads}});globalThis.Event=w.Event;
const stubPad={index:0,id:'Xbox runtime stub',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};stubPads=[stubPad];
run('newCampaign();s.mode="foot";s.pos.set(54,1.7,-94);update(.02);');stubPad.buttons[0]={value:1,pressed:true};run('controller.poll(.02)');assert(run('s.met'),'Xbox A reaches actual interact adapter');stubPad.buttons[0]={value:0,pressed:false};run('controller.poll(.02);play();');
stubPad.axes[1]=-1;run('controller.poll(.02);update(.02)');assert.equal(run('controller.device'),'gamepad');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'w'}));assert.equal(run('controller.device'),'keyboard','Latest keyboard activity wins');run('keys={};issueDrone("MANUAL")');stubPads=[];run('controller.poll(.02)');assert(run('paused'));assert.equal(run('s.droneSystem.mode'),'HOLD');assert.equal(run('s.mode'),'foot','Rider restored after controller loss');assert(w.document.querySelector('#toast').textContent.includes('Controller lost'));
console.log('PASS: Xbox A interaction, last-device ownership, mid-FPV disconnect HOLD/pause and stationary rider restoration.');
// v7.6: new modules through real menu, settings, simulation and save adapters.
run('newCampaign();s.inv.steel=7;s.battery=38;s.pos.set(7,1.7,-40);s.yaw=.4;');
const held=JSON.parse(run('JSON.stringify(snapshot())'));const autoBefore=w.localStorage.getItem('gridrunner.save.auto');
run("open('flightyard')");assert.equal(w.document.querySelectorAll('[data-yard-drone]').length,4);w.document.querySelector('[data-yard-drone=cargo]').click();w.document.querySelector('[data-yard-job=cargo]').click();assert.equal(run('s.droneType'),'cargo');assert.equal(run('s.mode'),'drone');assert(run('flightSession'));assert.equal(run('writeSave("auto",true)'),false);assert.equal(w.localStorage.getItem('gridrunner.save.auto'),autoBefore);
tick(.2);run('s.droneSystem.pos=[170,4,52];s.droneSystem.speed=0;interact()');assert(run('flightSession.carrying'));run('s.droneSystem.pos=[104,4,84];s.droneSystem.speed=0;interact()');assert(run('flightSession.complete'));
const cargoBest=Number(w.localStorage.getItem('gridrunner.flightBest.cargo.cargo'));assert(cargoBest>0);assert.equal(cargoBest,run('flightSession.elapsed'));run('flightSession.elapsed+=10;interact()');assert.equal(Number(w.localStorage.getItem('gridrunner.flightBest.cargo.cargo')),cargoBest,'Repeated delivery cannot overwrite best time');
run('leaveFlightYard()');assert.equal(run('s.inv.steel'),7);assert.equal(run('s.battery'),38);assert.deepEqual(Array.from(run('s.pos.toArray()')),held.state.pos);assert.equal(run('s.yaw'),held.state.yaw);
run("action('scan');const discoveredBefore=s.discoveries.length;action('scanHUD');hud()");assert.equal(w.document.querySelector('#scanTags').innerHTML,'');assert.equal(run('s.discoveries.length'),run('discoveredBefore'));assert.equal(w.document.querySelector('#scanToggle').getAttribute('aria-pressed'),'false');run("action('scanHUD');action('nightVision');loop(performance.now()+20)");assert(w.document.body.classList.contains('night-vision'));
run("settings.sensorMode='visible';settings.nightVision=false;settings.weather='blackout';applySettings();loop(performance.now()+20)");assert.equal(run('sun.intensity'),0);assert.equal(run('scene.environmentIntensity'),0);assert(run('atmosphere.hemi.every(h=>h.intensity===0)'));run("settings.nightVision=true;loop(performance.now()+20)");assert(run('sun.intensity')>0);assert(run('scene.environmentIntensity')>0);
run("settings.sensorMode='visible';settings.nightVision=false;settings.weather='rain';settings.movingSun=true;applySettings();loop(performance.now()+20)");assert(run('atmosphere.rain.visible'));const sunBefore=Array.from(run('sun.position.toArray()'));run('s.elapsed+=80;loop(performance.now()+20)');assert.notDeepEqual(Array.from(run('sun.position.toArray()')),sunBefore);
for(const type of ['scout','engineer','cargo','relay']){run(`s.droneType='${type}'`);assert(run('writeSave("manual2")'));assert.equal(run('getSave("manual2").state.droneType'),type);}
run("open('locations')");assert.equal(w.document.querySelectorAll('[data-location]').length,3);assert(!w.document.querySelector('#panel').textContent.includes('undefined'));
console.log('PASS: four-airframe hangar, cargo attach/drop, campaign restoration and autosave isolation, scan hide/preserved discoveries, true blackout/vision, moving sun/rain and four class save round-trips.');
// Field menu behavior: one shell, native keyboard access, and mode-specific HUD.
run("started=false;open('settings')");
assert.equal(w.document.querySelectorAll('.field-shell').length,1);
assert.equal(w.document.querySelectorAll('[data-menu-group]').length,5);
assert.equal(w.document.querySelectorAll('.menu-pane:not([hidden])').length,1);
const navButton=w.document.querySelector('[data-menu-group="system"]');navButton.focus();
const tabKey=new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});navButton.dispatchEvent(tabKey);assert(!tabKey.defaultPrevented,'Tab retains native menu traversal');
const spaceKey=new w.KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true});navButton.dispatchEvent(spaceKey);assert(!spaceKey.defaultPrevented,'Space retains native button behavior');
const closedRange=w.document.querySelector('.menu-pane[hidden] input');
assert(closedRange&&!run('menuControls(document.querySelector("#panel"))').includes(closedRange),'Hidden branch controls are excluded from controller and keyboard navigation');
w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(run('screen'),'locations','Escape restores the actual parent page');assert(run('paused'));assert(!run('started'));
run("newCampaign();open('supplies')");assert.equal(w.document.querySelectorAll('.field-shell').length,1);assert(w.document.body.classList.contains('menu-open'));
run('play();hud()');assert(!w.document.body.classList.contains('menu-open'));
run("open('flightyard')");w.document.querySelector('[data-yard-drone=relay]').click();assert.equal(w.document.querySelectorAll('.field-shell').length,1);
run("settings.weather='dusk';settings.sunHour=13.5;settings.nightVision=false;applySettings();loop(performance.now()+20)");assert(run('atmosphere.hemi[0].intensity')>1.6);
console.log('PASS: single menu shell, five tree categories, native Tab/Space, hidden branch focus exclusion, prestart Escape safety, specialized rerenders and bright daylight integration.');

// Inspect the new interaction model through DOM events, including filter/focus state.
run('newCampaign();s.inv.toaster=1;s.inv.copper=2;open("inventory")');
assert.equal(w.document.querySelectorAll('.pack-view').length,1);
w.document.querySelector('[data-pack-category=junk]').click();
assert.equal(w.document.querySelectorAll('[data-pack-item]').length,1);
w.document.querySelector('[data-pack-item=toaster]').click();
assert(w.document.querySelector('#packInspector').textContent.includes('Recovery per item'));
assert(w.document.querySelector('[data-field=salvage][data-item=toaster]'));
w.document.querySelector('[data-pack-category=all]').click();
let search=w.document.querySelector('[data-pack-search]');search.value='copper';search.dispatchEvent(new w.Event('input',{bubbles:true}));
assert(w.document.querySelector('[data-pack-item=copper]'));
assert.equal(w.document.activeElement,w.document.querySelector('[data-pack-search]'),'Searching retains input focus');
search=w.document.querySelector('[data-pack-search]');search.value='nothing-has-this-name';search.dispatchEvent(new w.Event('input',{bubbles:true}));
assert.equal(w.document.querySelectorAll('[data-pack-item]').length,0);
assert.equal(w.document.querySelectorAll('[data-field=salvage]').length,0,'Empty search cannot leave stale item actions');
search=w.document.querySelector('[data-pack-search]');search.value='';search.dispatchEvent(new w.Event('input',{bubbles:true}));
run('s.pos.set(400,1.7,100);open("inventory")');w.document.querySelector('[data-pack-item=copper]').click();
assert(w.document.querySelector('[data-field=store][data-storage=bike]').disabled,'Storage actions respect actual vehicle proximity');
run('open("workshop")');assert.equal(w.document.querySelectorAll('[data-field=craft]').length,Object.keys(survival.FIELD_RECIPES).length);
assert(w.document.querySelector('[data-field=craft][data-item=signalFilter]').disabled,'Knowledge and station gates remain visible');
run('newCampaign();s.inv=Object.fromEntries(Object.keys(ITEMS).map(id=>[id,1]));s.mode="foot";s.pos.set(0,1.7,160);open("inventory")');
assert.equal(w.document.querySelectorAll('[data-pack-item]').length,Object.keys(survival.ITEMS).length);
assert.equal(w.document.querySelectorAll('.pack-item .itemGlyph').length,Object.keys(survival.ITEMS).length,'Every item gets an explicit symbol');
if(process.env.GRIDRUNNER_QA_SAVE)fs.writeFileSync(process.env.GRIDRUNNER_QA_SAVE,JSON.stringify(run('snapshot()')));
console.log('PASS: 32 item symbols, category filtering, search focus, empty results, selected-item salvage, storage proximity and workshop gates.');

// Reading and replay are presentation only; the expedition and saves stay intact.
run('newCampaign();s.met=false;s.won=false;s.leg=1;open("story")');
assert(!w.document.querySelector('.story-book').textContent.includes('147 km'));
const bookSnapshot=JSON.parse(run('JSON.stringify(snapshot())')).state;
w.document.querySelector('[data-story-action=replay]').click();assert.equal(run('screen'),'prologue');
w.document.querySelector('[data-story-action=next]').click();w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
assert.equal(run('screen'),'story');assert.deepEqual(JSON.parse(run('JSON.stringify(snapshot())')).state,bookSnapshot);
run('remap.f="z";open("guide")');assert(w.document.querySelector('.folio-sheet').textContent.includes('Z'));
for(const id of ['ride','scout','salvage','explore','controls']){w.document.querySelector('[data-manual="'+id+'"]').click();assert(w.document.querySelector('[aria-current="page"][data-manual="'+id+'"]'));assert(!w.document.querySelector('.folio-sheet').textContent.includes('undefined'));}
run('remap={};storyReadThisSession=false;open("confirmNew")');w.document.querySelector('[data-ui=confirmNew]').click();assert.equal(run('screen'),'prologue');assert.equal(run('paused'),true);
w.document.querySelector('[data-story-action=skip]').click();assert.equal(run('paused'),false);assert.equal(run('s.intro.stage'),'approach');assert.equal(run('s.elapsed'),0);
console.log('PASS: opening pages, skip/new expedition, replay without state changes, spoiler-gated story and all manual sections with remapped keys.');
// Selective legacy and procedural loot must survive real save/restore cycles.
run('newCampaign();s.pos.set(38,1.7,-94);nearest={kind:"crate",index:0};interact();takeLoot("wire")');
assert.equal(run('s.inv.wire'),1);assert.equal(run('crates[0].items.wire'),1);assert.equal(run('crates[0].done'),false);
run('restore(JSON.parse(JSON.stringify(snapshot())));play();nearest={kind:"crate",index:0};interact()');
assert.equal(run('crates[0].items.wire'),1);assert.equal(w.document.querySelectorAll('[data-loot]').length,3);
run('takeLoot("all");play()');assert.equal(run('s.inv.wire'),2);assert.equal(run('crates[0].done'),true);
run('newCampaign();s.met=true;s.pos.set(0,1.7,180);bike.position.set(0,0,180);issueDrone("SCOUT AHEAD")');tick(3);
run('open("drones")');w.document.querySelector('[data-drone=cargo]').click();run('issueDrone("FOLLOW");play()');tick(3);
assert.equal(run('s.droneType'),'cargo');assert.equal(run('s.squad.scout.system.mode'),'SCOUT AHEAD');assert.equal(run('s.droneSystem.mode'),'FOLLOW');
assert(run('s.squad.scout.battery')<100);assert(run('s.drone')<100);assert(run('fleet.meshes.scout.visible&&fleet.meshes.cargo.visible'));
const scoutPosition=run('JSON.stringify(s.squad.scout.system.pos)');run('restore(JSON.parse(JSON.stringify(snapshot())))');assert.equal(run('JSON.stringify(s.squad.scout.system.pos)'),scoutPosition);
run('open("drones")');w.document.querySelector('[data-drone=scout]').click();assert.equal(run('s.droneSystem.mode'),'SCOUT AHEAD');run('issueDrone("RETURN HOME");play()');tick(25);
assert.equal(run('s.droneSystem.mode'),'DOCK');assert.equal(run('s.squad.cargo.system.mode'),'FOLLOW');
run('newCampaign();s.met=true;s.progression.relayHouseSolved=true;play()');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'5',shiftKey:true}));assert.equal(run('fleetAll'),true);w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'1'}));assert.equal(run('s.squad.scout.system.mode'),'FOLLOW');assert.equal(run('s.squad.cargo.system.mode'),'FOLLOW');assert.equal(run('s.squad.relay.system.mode'),'FOLLOW');assert.equal(run('s.squad.engineer.system.mode'),'DOCK','Locked utility aircraft stays docked');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'8'}));assert.equal(run('s.fleetFormation'),'TRAIL');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'2',shiftKey:true}));assert.equal(run('s.droneType'),'cargo');assert.equal(run('fleetAll'),false);
run("yardChoice='scout';startFlightYard('sensors')");
for(const mode of ['visible','night','thermal','rf','acoustic','depth']){run(`selectFleetAircraft('${{visible:'scout',night:'scout',thermal:'engineer',rf:'relay',acoustic:'scout',depth:'cargo'}[mode]}');issueDrone('MANUAL');settings.sensorMode='${mode}';settings.nightVision=${mode==='night'};applySettings();loop(performance.now()+40)`);assert.equal(w.document.body.dataset.sensor,mode);}
run('leaveFlightYard()');
run('settings.sensorMode="visible";settings.nightVision=false;applySettings();action("droneLamp");loop(performance.now()+40)');assert.equal(run('settings.droneLamp'),true);
const rngSettings={randomEnvironment:true};fieldUpgrade.randomEnvironment(rngSettings,()=>0);assert.equal(rngSettings.sunHour,0);fieldUpgrade.randomEnvironment(rngSettings,()=>.999);assert.equal(rngSettings.sunHour,23.9);assert.equal(rngSettings.weather,'sandstorm');
console.log('PASS: selective loot persistence, two independently flying aircraft, per-aircraft saves and return, sensor rendering/restoration, light toggle, randomized day/night endpoints.');
// Narration, acquisition, replay and opt-out remain independent of campaign rewards.
run('settings.tutorialEnabled=true;settings.narration=true;newExpedition();narrator.unlocked=true;s.pos.set(0,1.7,18);action("bike")');
assert.equal(run('screen'),'bikeintro');run('loop(performance.now()+30)');assert.equal(run('camera.view.enabled'),true);
for(let i=0;i<4;i++)w.document.querySelector('[data-brief=next]').click();assert(run('s.intro.trailerBriefed'));run('loop(performance.now()+30)');assert.equal(run('camera.view.enabled'),false);
run('s.mode="foot";s.pos.set(38,1.7,-90);nearest={kind:"crate",index:0};interact();takeLoot("wire")');assert(w.document.querySelector('.scoutAcquisition').textContent.includes('RECOVERED'));
w.document.querySelector('.lootActions [data-panel=play]').click();assert.equal(run('screen'),'scoutintro');assert(playedNarration.some(url=>url.endsWith('scout-0.wav')));
w.document.querySelector('[data-tutorial=mute]').click();assert.equal(run('settings.narration'),false);assert.equal(run('narrator.audio'),null);
w.document.querySelector('[data-tutorial=skip]').click();assert.equal(run('s.intro.stage'),'line');assert.equal(run('s.inv.wire'),1);
run('open("rig")');w.document.querySelector('[data-rig-focus=cargo]').click();assert(w.document.querySelector('.rigExplanation').textContent.includes('60 kg'));
run('settings.tutorialEnabled=false;newExpedition()');assert.equal(run('s.intro.stage'),'line');run('open("npc")');assert(w.document.querySelector('.maraDialogue'));assert(w.document.querySelector('.contactPortrait'));
run('settings.graphics="LOW";applySettings()');assert.equal(run('fleet.quality'),'LOW');assert.equal(run('fleet.shouldStream("scout",s)'),false);
console.log('PASS: four equipment lessons, camera framing/restoration, scout acquisition guide, recorded narration/mute, skip without loot duplication, trailer feature inspector and low-quality streaming gate.');
verifyFlightIntegration({run,w});
verifyFleetTaskIntegration({run,tick,w});
verifyRelayOutpostIntegration({run,tick,w});
verifyTutorialRecovery({run,w});
verifyLineHarvestIntegration({run,tick,w});

verifyPackIntegration({run,tick,w});

// Policy must tick even when its docked Utility is not the selected aircraft.
run(`newCampaign();s.engineerBuilt=true;s.progression.relayHouseSolved=true;s.progression.firstPackDelivered=true;s.trailer=0;settings.weather='clear';s.batteryPacks.serial=1;s.batteryPacks.packs=[{id:'pack-1',capacityWh:120,chargeWh:0,massKg:1.2,owner:'trailer'}];configureFleetPolicy(s,{enabled:true,targetPercent:60});`);
tick(.1);assert.equal(run('s.droneType'),'scout');assert.equal(run('s.squad.engineer.task?.state'),'RUNNING','Unselected docked Utility dispatches policy');
run("issueFleet('DOCK')");assert.equal(run('s.fleetPolicy.enabled'),false,'Fleet recall disarms repeat dispatch');
run(`newCampaign();setFormation('RELAY OUTPOST')`);assert.notEqual(run('s.squad.relay.task?.state'),'RUNNING','Locked outpost cannot bypass campaign gate');
assert(run("solids.some(b=>b.x===65&&b.z===-2358)"),'Spillway breaker cabinet registered');
assert(run("solids.some(b=>b.kind==='capacitor'&&b.z===-4320)"),'Black Start capacitors registered');
assert.equal(run("spatial.moveRider({x:0,y:1.7,z:-3500},0,-20,{mode:'bike'}).hit"),false,'Main later-chapter road remains rideable');
run("newCampaign();settings.tutorialEnabled=false;open('rig')");assert(!w.document.querySelector('.firstUse'),'Tutorial OFF suppresses first-use cards');
console.log('PASS: background docked policy scheduling, operator recall disarm, locked outpost protection, later-chapter solid props, clear road and tutorial preference.');

run("open('drones')");w.document.querySelector('[data-menu-section="formations"]').click();const remembered=w.document.querySelector('[data-formation=TRAIL]');remembered.focus();run("open('rig');open('drones')");assert.equal(w.document.activeElement.dataset.formation,'TRAIL','real menu render retains the focused formation');
console.log('PASS: actual rendered Fleet page restores focus without an unconditional focus override.');

run("newCampaign();play();open('quick');open('drones')");
w.document.querySelector('[data-formation=TRAIL]').focus();run("open('settings');backMenu()");
assert.equal(run('screen'),'drones');assert.equal(w.document.activeElement.dataset.formation,'TRAIL');
run("controller.menu({menu:[],actions:['cancel']})");assert.equal(run('screen'),'drones');assert.equal(w.document.querySelector('.menu-pane:not([hidden])').dataset.menuPane,'commands');run("controller.menu({menu:[],actions:['cancel']})");assert.equal(run('screen'),'quick');
w.document.querySelector('[data-back]').click();assert.equal(run('screen'),'pause');run('backMenu()');assert(!run('paused'));
run("settings.tutorialEnabled=true;s.lessons={};s.droneSystem.scanCooldown=0;action('scan')");assert.equal(run('s.lessons.scan'),'done');
assert(run('writeSave("manual1")'));run('restore(getSave("manual1"))');assert.equal(run('s.lessons.scan'),'done');
run("open('guide')");w.document.querySelector('[data-lesson-replay=scan]').click();assert.equal(run('s.lessons.scan'),undefined);assert.equal(run('s.intro.stage'),'line');
run("s.met=true;settings.sensorMode='night';open('drones')");w.document.querySelector('[data-drone=cargo]').click();assert.equal(run('settings.sensorMode'),'night','Selecting aircraft preserves personal visor optics');
run("selectFleetAircraft('scout');open('drones')");
w.document.querySelector('[data-menu-section="sensors"]').click();
assert(run('menuControls(document.querySelector("#panel"))').includes(w.document.querySelector('[data-sensor-mode="uv"]')));
w.document.querySelector('[data-sensor-mode="uv"]').click();assert.equal(run('settings.sensorMode'),'uv');
assert.equal(w.document.querySelector('.menu-pane:not([hidden])').dataset.menuPane,'sensors','changing sensor retains active branch');
assert.equal(w.document.querySelector('[data-sensor-mode="uv"]').getAttribute('aria-pressed'),'true');
run("selectFleetAircraft('cargo');renderPanel()");assert.equal(run('settings.sensorMode'),'uv');assert(w.document.querySelector('[data-sensor-mode="uv"]'),'personal UV remains available');
console.log('PASS: keyboard/controller/touch parent history and focus, first scan completion/save/replay, campaign preservation and class sensor fallback.');
verifyPhase4Integration({run,tick,w});

verifySwarmSensorsIntegration({run,tick,w});

verifyMenuRepair({run,tick,w});

verifyPersonalFleet({run,tick,w});
