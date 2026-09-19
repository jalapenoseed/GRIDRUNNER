import assert from 'node:assert/strict';
import * as T from './dist/three.js';
import {createCommanderFleet} from './dist/fleet-commander-core.js';
import {commanderPreset} from './dist/commander-presets.js';
import {sampleSwarmProgram,compileProgram,programOptions} from './dist/swarm-program.js';
import {clearProgramEffects} from './dist/fleet-effects.js';
import {FleetScore,parseFleetSong} from './dist/fleet-score.js';
import {CinematicCamera} from './dist/cinematic-camera.js';
import {StormController,lightningPath} from './dist/storm-controller.js';
import {THERMAL_PALETTES,Sensors,thermalColor} from './dist/sensors.js';
import {SERVICE_DISTRICTS} from './dist/service-district.js';
import {bikeEnergyPerUnit,bikeRangeKm} from './dist/bike-energy.js';

const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label+': '+a+' versus '+b);
function verifyLayers(){
 const config=commanderPreset(createCommanderFleet(12),'none'),p=config.program,id=p.ids[4];
 Object.assign(p.settings,{countIn:0,morph:0,offset:0,field:'wave',strength:3,field2:'vortex',strength2:2,field3:'spiral',strength3:1,field4:'lissajous',strength4:1});
 const at=settings=>sampleSwarmProgram({...p,settings},id,{time:7}).target;
 const baseline=at(clearProgramEffects(p.settings)),stacked=at(p.settings),singles=[];
 for(let slot=1;slot<=4;slot++){const opts={...p.settings};for(let other=1;other<=4;other++)if(other!==slot)opts['field'+(other===1?'':other)]='none';singles.push(at(opts));}
 for(let axis=0;axis<3;axis++)near(stacked[axis]-baseline[axis],singles.reduce((sum,v)=>sum+v[axis]-baseline[axis],0),'four independently additive fields');
 const noY=at({...p.settings,axisY:0});near(noY[1],baseline[1],'Y mix removes only Y displacement');near(noY[0],stacked[0],'X remains independent');
 const zero=at({...p.settings,pattern:'orbit',patternAmount:0,show:'corkscrew',showAmount:0});zero.forEach((v,i)=>near(v,stacked[i],'zero amount mutes a layer'));
 const cleared=clearProgramEffects({...p.settings,pattern:'orbit',show:'dance',variance:4,phaseVariance:2,speedVariance:.2});
 assert.deepEqual(at(cleared),sampleSwarmProgram({...p,settings:cleared},id,{time:27}).target,'None removes time-dependent displacement');
 const changed=commanderPreset({...config,program:{...p,settings:{...p.settings,pattern:'orbit',variance:4}}},'none');assert.equal(changed.program.settings.field2,'none');assert.equal(changed.program.settings.variance,0);
 const varied={...cleared,variance:3,seed:73},whole=at(varied),subset=sampleSwarmProgram({...p,ids:[id],settings:varied},id,{time:7}),singleBase=sampleSwarmProgram({...p,ids:[id],settings:cleared},id,{time:7});
 whole.forEach((v,i)=>near(v-baseline[i],subset.target[i]-singleBase.target[i],'variation follows aircraft identity across group edits'));
 const scripted={...p,mode:'script',source:'select '+id+'\nlayer 2 wave 8 0.6\nwait 2\nlayer 2 none\nwait 2\nreset effects'};
 compileProgram(scripted.source,{aircraft:p.fleetIds,groups:p.groups});assert.equal(programOptions(scripted,id,1).field2,'wave');assert.equal(programOptions(scripted,id,3).field2,'none');assert.equal(programOptions(scripted,id,5).field,'none');assert.equal(programOptions(scripted,p.ids[0],5).field,'wave','selected-group reset does not alter other groups');
 assert.throws(()=>compileProgram('layer 5 wave 8 0.6'),/Line 1/);
}

async function verifyScore(){
 near(parseFleetSong('A4:1 R:1 C4+E4+G4:2').events[0].frequencies[0],440,'concert pitch');assert.equal(parseFleetSong('C4:1 R:1').beats,2);assert.throws(()=>parseFleetSong('play some music'),/Note/);assert.throws(()=>parseFleetSong('C4:999'),/lengths/);
 class Param{value=0;setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}}
 class Node{gain=new Param();frequency=new Param();connect(){}disconnect(){}start(...args){this.started=args;}stop(at){this.stopped=at??true;if(at===undefined)this.onended?.();}}
 class Context{currentTime=0;destination={};created=[];resume(){return Promise.resolve();}createGain(){return new Node();}createOscillator(){const n=new Node();this.created.push(n);return n;}createBufferSource(){const n=new Node();this.created.push(n);return n;}decodeAudioData(){return Promise.resolve({duration:20});}close(){}}
 const previous=globalThis.AudioContext;globalThis.AudioContext=Context;
 try{const score=new FleetScore(),p=createCommanderFleet(6).program;Object.assign(p,{running:true,enabled:true,time:1});Object.assign(p.settings,{countIn:0,bpm:60,song:'A4:16'});await score.enable();score.update(p,true,{gain:.5});assert.equal(score.voices.size,1);near(score.bus.gain.value,.15,'music follows master mix');assert(score.ctx.created[0].stopped>14,'long notes sustain for their written duration');score.update(p,false);assert.equal(score.voices.size,0,'pause immediately silences voices');score.update(p,true,{gain:0});assert.equal(score.voices.size,0,'muted master cannot start notes');score.update(p,true);assert.equal(score.voices.size,1,'resume restarts the current note');
  const file={size:100,type:'audio/wav',name:'owned.wav',arrayBuffer:async()=>new ArrayBuffer(1)};assert(await score.upload(file));p.time=25;score.update(p,true);assert.equal(score.uploadSource.started[1],5,'uploaded track follows program offset');score.stop();assert.equal(score.voices.size,0);
  let finish;score.ctx.decodeAudioData=()=>new Promise(resolve=>finish=resolve);const pending=score.upload(file);for(let i=0;i<5&&!finish;i++)await Promise.resolve();assert(finish);score.stop();finish({duration:10});assert.equal(await pending,false,'muting cancels a pending attachment');assert(!score.enabled);score.dispose();
 }finally{if(previous===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=previous;}
}

function verifyPresentation(){
 const drones=Array.from({length:2000},(_,i)=>({system:{pos:[(i%45-22)*4,.7,(Math.floor(i/45)-22)*4]}})),state={pos:new T.Vector3(),yaw:0},rig=new T.Group();
 for(const aspect of [16/9,390/844])for(const shot of ['orbit','tracking','overhead']){const camera=new T.PerspectiveCamera(72,aspect,.15,3500),cinema=new CinematicCamera();cinema.subject='fleet';cinema.shot=shot;cinema.start(state);const options={bike:rig,fleet:{drones},solids:[],ground:()=>0,dt:1};assert(cinema.update(camera,state,options));for(const d of drones){const pixel=new T.Vector3(...d.system.pos).project(camera);assert(Math.abs(pixel.x)<1&&Math.abs(pixel.y)<.84&&pixel.z<1,'all 2,000 grounded aircraft fit the letterboxed '+shot+' frame at '+aspect);}const time=cinema.time;cinema.update(camera,state,{...options,paused:true});assert.equal(cinema.time,time);assert(!cinema.update(camera,{...state},options),'replacing an expedition exits cinematic');}
 const scene=new T.Scene(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({color:0xb8aaa0}));scene.add(mesh);const source=mesh.material,sensors=new Sensors(),camera=new T.PerspectiveCamera(),colors=[];
 for(const palette of Object.keys(THERMAL_PALETTES)){sensors.render({render(){assert(mesh.material.userData.sensorHeat>=.7);colors.push(mesh.material.color.getHex());}},scene,camera,'thermal',[mesh],null,{palette});assert.equal(mesh.material,source,'thermal restores original materials');}
 assert.equal(new Set(colors).size,4,'four distinct palettes');assert(thermalColor(.1,'spectrum').b>thermalColor(.1,'spectrum').r);assert(thermalColor(.85,'spectrum').r>thermalColor(.85,'spectrum').b);
 mesh.userData.fluorescent=true;sensors.render({render(){assert.equal(mesh.material.color.getHex(),0x8effdc);}},scene,camera,'uv');assert.equal(mesh.material,source);
 const thunder=[],storm=new StormController(new T.Scene(),{thunder:(...args)=>thunder.push(args)}),solids=[{id:'test-pole',kind:'pole',x:20,z:0,maxY:10}];const event=storm.trigger([0,0,0],solids);assert.equal(event.target,'test-pole');assert.deepEqual(event.position,[20,10,0]);const data=lightningPath([0,100,0],[20,10,0],22);assert.deepEqual(data.slice(0,3),[0,100,0]);data.slice(141,144).forEach((v,i)=>near(v,[20,10,0][i],'lightning ends on its conductor'));
 const opts={weather:'storm',position:[0,0,0],solids,paused:true};storm.update(.1,opts);assert.equal(storm.time,0);assert.equal(storm.light.intensity,0);for(let i=0;i<20;i++)storm.update(.1,{...opts,paused:false,reducedMotion:true});assert.equal(thunder.length,1,'one delayed thunder cue');assert.equal(storm.light.intensity,0,'reduced motion suppresses the flash');
}

export async function verifyQAUpdate({run,tick,w}){
 verifyLayers();await verifyScore();verifyPresentation();
 const doc=w.document,click=selector=>{const el=doc.querySelector(selector);assert(el,selector);el.click();},input=(selector,value)=>{const el=doc.querySelector(selector);assert(el,selector);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
 assert(bikeEnergyPerUnit()/.065<.28,'base riding cost is more than 72% lower');near(bikeRangeKm(27)*1000/2*bikeEnergyPerUnit(),27,'displayed range conserves battery');assert(bikeRangeKm(27,{road:false,weight:30})<bikeRangeKm(27),'terrain and cargo still affect range');
 run('newCampaign();settings.graphics="LOW";open("tutorials")');const campaign=run('JSON.stringify(snapshot().state)');assert.equal(doc.querySelectorAll('[data-learning-card]').length,20);click('[data-learning-queue="camo"]');click('[data-learning-queue="music"]');click('[data-learning-open="camo"]');assert(doc.querySelector('.lessonReader').textContent.includes('begins packed'));click('[data-learning-done="camo"]');assert(doc.querySelector('.lessonReader').textContent.includes('Write or upload'));assert.deepEqual(JSON.parse(w.localStorage.getItem('gridrunner.learning')).queue,['music']);assert.equal(run('JSON.stringify(snapshot().state)'),campaign,'browsing and queueing never mutate campaign progress');
 run('open("rig")');assert(doc.querySelector('[data-swarm-cover]'));click('[data-learning-jump="camo"]');assert.equal(run('screen'),'tutorials');
 run('open("adminFleet")');input('[data-admin-count]','6');input('[data-admin-setting="pattern"]','orbit');input('[data-admin-setting="field2"]','vortex');input('[data-admin-mode]','script');input('[data-admin-script]','bad program');input('[data-admin-formula="formulaX"]','bad formula');click('[data-admin-action="none"]');assert.equal(run('adminFleetDraft.program.mode'),'manual');assert.equal(run('adminFleetDraft.program.settings.pattern'),'none');assert.equal(run('adminFleetDraft.program.settings.field2'),'none');click('[data-admin-action="spawn"]');tick(14);const ids=run('JSON.stringify(worldCommander.drones.map(d=>d.id))');assert.equal(run('worldCommander.stats().active'),6);run('open("adminFleet")');click('[data-admin-action="recall"]');tick(90);assert.equal(run('worldCommander.stats().landed'),6);assert.equal(run('worldCommanderVisuals.beacons.geometry.drawRange.count'),6,'landed fleet remains rendered');run('open("adminFleet")');click('[data-admin-action="launch"]');tick(14);assert.equal(run('worldCommander.stats().active'),6);assert.equal(run('JSON.stringify(worldCommander.drones.map(d=>d.id))'),ids,'launch parked fleet preserves identities');
 run('open("cinematic")');input('[data-cinema-setting="subject"]','fleet');click('[data-cinema-start]');assert(run('cinema.active'));assert(!run('paused'));tick(.1);assert(doc.body.classList.contains('cinematic-active'));click('#cinemaExit');assert(!run('cinema.active'));assert(!doc.body.classList.contains('cinematic-active'));
 assert.equal(run('serviceDistrict.groups.length'),3);assert.equal(run('settlementWorld.actors.length'),30);assert.equal(run('ambientResidents.status'),'ready','all named and added NPC routes bake');
 for(const site of SERVICE_DISTRICTS){for(const x of [-9,9])for(const z of [10,7,4,0,-3])assert(!run(`solids.some(b=>Math.abs(${site.x+x}-b.x)<b.w+.4&&Math.abs(${site.z+z}-b.z)<b.d+.4&&b.minY<2.2&&b.maxY>.15)`),'open building entrance '+site.id);assert(run(`solids.some(b=>b.id?.startsWith('${site.id}')&&b.kind==='service-roof'&&b.minY>5)`),'solid roof '+site.id);}
 run('settings.autoWeather=true;settings.weather="dusk";s.elapsed=240;loop(performance.now()+20)');assert.equal(run('sound.frame.weather'),'storm','audio follows changing weather, not only the menu preset');
 console.log('PASS: four independent fields, selected-group resets, identity-stable variance, soundtrack pitch/clock/mute/upload cancellation, 2,000-aircraft portrait/landscape framing, sensor palettes/restore, paused lightning/thunder, battery/range, queued tutorials without progression mutation, invalid-script None recovery, grounded relaunch, cinematic exit and clear populated service interiors. GPU and audio listening remain device QA.');
}
