import assert from 'node:assert/strict';

export function verifyRelayOutpostIntegration({run,tick,w}){
 run("newCampaign();settings.weather='heat';settings.randomEnvironment=false;settings.movingSun=false;settings.sunHour=12;remap={};applySettings();open('drones')");
 const button=w.document.querySelector('[data-formation="RELAY OUTPOST"]');assert(button);button.click();
 assert.equal(run('s.fleetFormation'),'RELAY OUTPOST');assert.equal(run('s.squad.scout.task.stage'),'WAIT');assert.equal(run('s.squad.relay.task.kind'),'RELAY');
 assert(w.document.querySelector('[data-formation=ORBIT]').textContent.startsWith('0 '),'Orbit button shows the real hotkey');
 const elapsed=run('s.squad.relay.task.elapsed');run('loop(performance.now()+200)');assert.equal(run('s.squad.relay.task.elapsed'),elapsed,'Paused Fleet menu cannot advance deployment');
 assert(run('writeSave("manual2")'));run('restore(getSave("manual2"));play()');
 run("for(let i=0;i<3000&&s.squad.relay.system.mode!=='RELAY';i++)update(.02);hud()");
 assert.equal(run('s.squad.relay.system.mode'),'RELAY');assert(run('s.squad.relay.system.altitude')<.85);assert.equal(run('s.squad.relay.system.hp'),100);
 assert(run('writeSave("manual2")'));const held=Array.from(run('s.squad.relay.system.pos')),battery=run('s.squad.relay.battery');run('restore(getSave("manual2"));play()');assert.equal(run('s.squad.relay.battery'),battery);tick(.1);assert.deepEqual(Array.from(run('s.squad.relay.system.pos')),held);
 run('let relayQAMax=0,relayQAVia=false;for(let i=0;i<3500&&s.squad.scout.task.state==="RUNNING";i++){update(.02);relayQAMax=Math.max(relayQAMax,s.squad.scout.system.range);relayQAVia||=!!s.squad.scout.system.linkVia;}hud()');
 assert.equal(run('s.squad.scout.task.state'),'COMPLETED');assert(run('relayQAMax')>440);assert(run('relayQAVia'));assert(run('s.squad.scout.task.contacts')>0);assert.equal(run('s.squad.scout.system.hp'),100);assert.equal(run('s.met'),false);
 run("selectFleetAircraft('relay');open('drones')");assert(w.document.querySelector('.fleetTask').textContent.includes('Relay outpost'));assert.equal(run('s.droneSystem.mode'),'RELAY');
 const pos=Array.from(run('s.droneSystem.pos'));run("issueDrone('RETURN HOME');play()");assert.deepEqual(Array.from(run('s.droneSystem.pos')),pos);tick(45);assert.equal(run('s.droneSystem.mode'),'DOCK');
 // Real shifted key values are punctuation on a US keyboard, not digits.
 run('newCampaign();play()');w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'$',code:'Digit4',shiftKey:true}));assert.equal(run('s.droneType'),'relay');
 w.dispatchEvent(new w.KeyboardEvent('keydown',{key:')',code:'Digit0',shiftKey:true}));assert.equal(run('s.fleetFormation'),'RELAY OUTPOST');assert.equal(run('s.squad.scout.task.stage'),'WAIT');
 const flying=run('JSON.stringify(s.squad)');run('startLegTwo(false);startLegThree(false)');assert.equal(run('JSON.stringify(s.squad)'),flying,'Unavailable chapters must not reset active aircraft or cancel their jobs');
 run('s.drone=5;update(.02)');assert.equal(run('s.squad.relay.task.state'),'FAILED');tick(.1);assert.equal(run('s.squad.scout.task.state'),'FAILED');
 run('settings.tutorialEnabled=true;newExpedition()');assert.equal(run("setFormation('RELAY OUTPOST')"),false,'Outpost cannot bypass onboarding');
 console.log('PASS: actual outpost Fleet button/hotkey, paused menus, world landing and distant survey with real Rapier terrain/solids, persisted parked relay, selected-aircraft recall, low-power dependency failure and tutorial gates.');
}

export function verifyTutorialRecovery({run,w}){
 run('settings.tutorialEnabled=true;applySettings();beginPrologue("new")');w.document.querySelector('[data-tutorial=skipStoryTutorial]').click();assert.equal(run('s.intro.stage'),'line');assert.equal(run('settings.tutorialEnabled'),true);assert.equal(JSON.parse(w.localStorage.getItem('gridrunner.settings')).tutorialEnabled,true,'One-time intro skip never disables future tutorials');
 run('newExpedition()');assert.equal(run('s.intro.stage'),'approach');
 run('settings.tutorialEnabled=false;applySettings();started=false;open("start")');w.document.querySelector('[data-ui=guided]').click();assert.equal(run('s.intro.stage'),'approach','Guided start recovers even an old saved OFF preference');assert.equal(run('settings.tutorialEnabled'),false,'An explicit new-game choice does not overwrite Settings');
 run('s.intro=completedIntro();open("pause")');const state=run('JSON.stringify(s.intro)');w.document.querySelector('[data-tutorial=equipment]').click();assert.equal(run('screen'),'bikeintro');assert.equal(run('JSON.stringify(s.intro)'),state,'Replaying equipment does not reset progression');
 for(const device of ['touch','gamepad']){
  run(`controller.other('${device}');settings.droneStickLayout='mode2';settings.droneFlight='stabilized';briefPage=1;open('scoutintro')`);assert(w.document.querySelector('.equipmentLesson aside').textContent.includes('LEFT · lift / yaw'));assert(w.document.querySelector('.equipmentLesson aside').textContent.includes('RIGHT · forward / strafe'));
  run('settings.droneFlight="acro";renderPanel()');assert(w.document.querySelector('.equipmentLesson aside').textContent.includes('pitch / roll'));
 }
 run('controller.other("keyboard");settings.tutorialEnabled=true;settings.droneFlight="stabilized";applySettings();newExpedition()');
 console.log('PASS: one-time intro skip, persisted preferences, visible guided-start recovery, progress-preserving equipment replay and current Mode 2/Acro narration captions.');
}
