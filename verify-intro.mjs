import assert from 'node:assert/strict';
import {introState,completedIntro,migrateIntro,introQuiet,introAllows,markIntro} from './dist/intro.js';

// Legacy and partial records must normalize identically in validation and restore.
for(const old of [undefined,null,42,[],{stage:'line'},{talked:true}])assert.deepEqual(migrateIntro(old),completedIntro());
assert.deepEqual(migrateIntro(introState()),introState());
assert.equal(migrateIntro({stage:'yard'}).mounted,true);
assert.equal(migrateIntro({scouted:true}).salvaged,true);
assert.equal(introQuiet({leg:2,intro:introState()}),false);
assert.equal(introAllows({},'drone'),true);
const isolated={intro:introState()};markIntro(isolated,'mounted');
assert.equal(introState().mounted,false);
markIntro(isolated,'unexpected');assert.equal(Object.hasOwn(isolated.intro,'unexpected'),false);

export function verifyIntroIntegration({run,tick,w}){
 const click=selector=>{const button=w.document.querySelector(selector);assert(button,selector);assert(!button.disabled,selector);button.click();};
 const key=value=>w.dispatchEvent(new w.KeyboardEvent('keydown',{key:value}));
 const record=()=>JSON.parse(run('JSON.stringify(snapshot())'));
 const resume=()=>run('play();keys={}');
 const at=(x,z)=>{run(`s.pos.set(${x},1.7,${z});s.speed=0;keys={}`);tick(.02);};
 const saveRoundTrip=()=>{const before=record();run('restore(JSON.parse(JSON.stringify(snapshot())))');assert.deepEqual(record().state.intro,before.state.intro);};
 const launch=type=>{click(`[data-yard-drone=${type}]`);click('[data-yard-job=circuit]');assert.equal(run('s.mode'),'drone');assert.equal(run('s.droneSystem.mode'),'MANUAL');assert(run('droneOrigin'));assert(!w.document.body.classList.contains('intro-quiet'));assert.equal(w.document.querySelector('#flightStrip').hidden,false);assert.equal(w.document.querySelector('#yardProgress').hidden,false);};

 // Boot -> main menu -> each airframe, including repeated G and physical recall.
 assert.equal(run('started'),false);
 const autoAtBoot=w.localStorage.getItem('gridrunner.save.auto');
 click('[data-nav=flightyard]');
 for(const type of ['scout','cargo','engineer','relay']){
  launch(type);run('keys.w=true;keys[" "]=true');tick(1);run('keys={}');
  assert(run('flightSession.elapsed')>0);assert(run('s.droneSystem.travel')>0);
  assert.equal(run('writeSave("auto",true)'),false);
  key('g');assert.equal(run('screen'),'flightyard');
 }
 assert.equal(w.localStorage.getItem('gridrunner.save.auto'),autoAtBoot);
 resume();key('q');tick(25);assert.equal(run('s.droneSystem.mode'),'DOCK');
 key('q');assert.equal(run('s.mode'),'drone');key('g');click('[data-yard-return]');
 assert.equal(run('flightSession'),null);assert.equal(run('s.intro.stage'),'approach');

 // The actual New Expedition button starts on foot, looking toward the bike.
 run('open("chapters")');click('[data-ui=new]');click('[data-ui=confirmNew]');
 assert.equal(run('s.mode'),'foot');assert(run('s.pos.z>bike.position.z'));
 assert(w.document.body.classList.contains('intro-quiet'));
 assert.equal(w.document.querySelector('#quest h2').textContent,'Find the motorcycle.');
 assert(w.document.querySelector('#objective').textContent.includes('motorcycle'));
 assert(w.document.querySelector('#questDistance').textContent.includes('AHEAD'));
 run('controller.other("gamepad");hud()');assert(w.document.querySelector('#objective').textContent.includes('B mounts'));
 run('controller.other("touch");hud()');assert(w.document.querySelector('#objective').textContent.includes('BIKE mounts'));
 run('controller.other("keyboard");remap.f="z";hud()');assert(w.document.querySelector('#objective').textContent.includes('Z mounts'));run('remap={};hud()');
 const launchCommands=['MANUAL','FOLLOW','HOLD','SCOUT AHEAD','ORBIT'];
 for(const command of launchCommands){run(`issueDrone('${command}')`);assert.equal(run('s.droneSystem.mode'),'DOCK',command+' cannot bypass salvage');}
 const ammo=run('s.ammo'),battery=run('s.battery');run('fire();fire(true)');
 assert.equal(run('s.ammo'),ammo);assert.equal(run('s.battery'),battery);
 for(const menu of ['map','journal','inventory','supplies']){run(`open('${menu}')`);assert.equal(run('paused'),false,menu+' must use the same tutorial gate');}
 at(38,-94);run('interact()');assert.equal(run('crates[0].done'),false);
 at(2.5,26);run('keys.w=true');tick(1.4);run('keys={}');key('f');
 assert.equal(run('s.mode'),'bike');assert.equal(run('screen'),'bikeintro');for(let i=0;i<4;i++)click('[data-brief=next]');assert.equal(run('s.intro.stage'),'yard');saveRoundTrip();
 run('open("inventory")');assert.equal(run('screen'),'inventory');resume();

 // Practice is independent even midway through onboarding, without advancing it.
 const beforePractice=record(),autoBefore=w.localStorage.getItem('gridrunner.save.auto');
 key('g');launch('cargo');tick(.5);key('g');launch('scout');tick(.2);key('g');click('[data-yard-return]');
 const afterPractice=record();
 assert.deepEqual(afterPractice.state,beforePractice.state);
 for(const name of ['bike','trailer','origin','crates','enemies'])assert.deepEqual(afterPractice[name],beforePractice[name]);
 assert.equal(w.localStorage.getItem('gridrunner.save.auto'),autoBefore);
 assert.equal(w.localStorage.getItem('gridrunner.yardReturn'),null);
 assert(w.document.body.classList.contains('intro-quiet'));

 at(38,-94);assert.equal(run('nearest.kind'),'crate');run('interact()');assert.equal(run('screen'),'loot');click('[data-loot=all]');resume();
 assert(run('s.intro.salvaged'));assert(run('crates[0].done'));saveRoundTrip();
 at(54,-94);run('interact()');assert.equal(run('s.met'),false,'Mara waits for the scout');
 key('q');assert.equal(run('screen'),'scoutintro');click('[data-brief=next]');click('[data-brief=next]');assert.equal(run('s.intro.scoutBriefed'),true);assert.equal(run('s.mode'),'drone');run('keys[" "]=true');tick(1.2);run('keys={}');saveRoundTrip();
 key('q');assert.equal(run('s.intro.scouted'),false,'A return request is not a completed docking');
 saveRoundTrip();tick(25);assert.equal(run('s.droneSystem.mode'),'DOCK');assert(run('s.intro.scouted'));saveRoundTrip();
 // Other residents cannot accidentally complete Mara's final step.
 at(-123,-146);run('interact()');assert.equal(run('s.intro.talked'),false);
 at(54,-94);run('interact()');assert(run('s.met'));assert.equal(run('s.intro.stage'),'line');
 resume();run('hud()');assert(!w.document.body.classList.contains('intro-quiet'));saveRoundTrip();
 key('m');assert.equal(run('screen'),'map');resume();

 // Missing/null/stage-only legacy data stays unlocked on both validation passes.
 for(const form of ['delete r.state.intro','r.state.intro=null','r.state.intro={stage:"line"}']){
  run(`{const r=JSON.parse(JSON.stringify(snapshot()));${form};restore(validateSave(r));}`);
  assert.equal(run('s.intro.stage'),'line');resume();key('q');assert.equal(run('s.mode'),'drone');
  run('issueDrone("DOCK")');tick(25);
 }
 // Supplied later chapters never strand a player in the first camp's tutorial.
 for(const fn of ['startLegTwo','startLegThree']){
  run(`${fn}(true);hud()`);assert.equal(run('s.intro.stage'),'line');
  assert(!w.document.body.classList.contains('intro-quiet'));key('q');assert.equal(run('s.mode'),'drone');
  saveRoundTrip();const campaignType=run('s.droneType');resume();key('g');launch('engineer');key('g');click('[data-yard-return]');
  assert.equal(run('s.mode'),'drone');assert.equal(run('s.droneType'),campaignType);assert(run('droneOrigin'));
 }
 run('newExpedition();settings.autosave=true');
 console.log('PASS: four-airframe boot/relaunch, tutorial input gates, real docking, Mara-only completion, every-stage saves, mid-tutorial practice isolation, legacy migration and supplied chapters.');
}
