import assert from 'node:assert/strict';

export function verifyFleetTaskIntegration({run,tick,w}){
 run("newCampaign();settings.weather='heat';settings.movingSun=false;settings.randomEnvironment=false;settings.droneFlight='stabilized';applySettings();open('drones')");
 const firstButton=w.document.querySelector('[data-fleet-task=assign]');assert(firstButton&&!firstButton.disabled);firstButton.click();
 assert.equal(run('s.squad.scout.task.state'),'RUNNING');assert.equal(run('s.mode'),'bike');const firstJob=run('s.squad.scout.task.id');
 const elapsed=run('s.squad.scout.task.elapsed');run('loop(performance.now()+100)');assert.equal(run('s.squad.scout.task.elapsed'),elapsed,'Menus do not simulate jobs');
 run("play()");tick(.6);
 run("selectFleetAircraft('relay');open('drones')");w.document.querySelector('[data-fleet-task=assign]').click();
 assert.equal(run('s.squad.relay.task.state'),'RUNNING');assert.notEqual(run('s.squad.scout.task.id'),run('s.squad.relay.task.id'));
 assert.notEqual(run('s.squad.scout.task.batteryId'),run('s.squad.relay.task.batteryId'));
 assert(run('writeSave("manual2")'));const before=JSON.parse(run('JSON.stringify(snapshot())'));
 run('restore(getSave("manual2"));play()');assert.equal(run('s.squad.scout.task.id'),firstJob);
 assert.equal(run('s.squad.scout.battery'),before.state.squad.scout.battery);assert.equal(run('s.squad.relay.battery'),before.state.squad.relay.battery);
 run('const taskQAOriginalScan=surveyScan;const taskQACalls={};surveyScan=record=>{taskQACalls[record.id]=(taskQACalls[record.id]||0)+1;return taskQAOriginalScan(record);};');
 // Take over, save while in FPV, then resume without moving the rider or waypoint.
 run("selectFleetAircraft('scout');issueDrone('MANUAL')");assert.equal(run('s.squad.scout.task.state'),'PAUSED');
 const rider=Array.from(run('droneOrigin.pos.toArray()')),droneBefore=Array.from(run('s.droneSystem.pos'));
 assert(run('writeSave("manual3")'));run('restore(getSave("manual3"))');assert.equal(run('s.mode'),'drone');assert.equal(run('s.squad.scout.task.state'),'PAUSED');
 assert.deepEqual(Array.from(run('s.droneSystem.pos')),droneBefore);assert(run("operateFleetTask('resume')"));assert.equal(run('s.mode'),'bike');assert.deepEqual(Array.from(run('s.pos.toArray()')),rider);
 run("play();for(let i=0;i<3000&&(s.squad.scout.task.state==='RUNNING'||s.squad.relay.task.state==='RUNNING');i++)update(.02);hud()");
 for(const type of ['scout','relay']){assert.equal(run(`s.squad.${type}.task.state`),'COMPLETED',type+' returns through real world physics');assert.equal(run(`s.squad.${type}.system.mode`),'DOCK');assert.equal(run(`taskQACalls[s.squad.${type}.id]`),1);assert(run(`s.squad.${type}.task.contacts`)>0,'Survey discovers actual scene contacts');}
 assert(run('s.discoveries.length')>0);assert.equal(run('s.met'),false,'Autonomy does not complete Mara dialogue');assert.equal(run('s.towerCode'),false,'Autonomy does not loot quest items');
 assert.equal(run('s.drone'),run('s.squad.scout.battery'));assert(run('writeSave("manual2")'));run('restore(getSave("manual2"));play()');tick(.5);assert.equal(run('taskQACalls[s.squad.scout.id]'),1);

 // Recall cancels the work, but still uses physical flight to recover the aircraft.
 assert(run("operateFleetTask('assign')"));tick(1);const airborne=Array.from(run('s.droneSystem.pos'));run("issueDrone('DOCK')");assert.equal(run('s.squad.scout.task.state'),'CANCELLED');assert.deepEqual(Array.from(run('s.droneSystem.pos')),airborne);tick(30);assert.equal(run('s.droneSystem.mode'),'DOCK');
 // Unselected aircraft gets the same task/failsafe reconciliation as FPV.
 run("selectFleetAircraft('relay');s.drone=80;operateFleetTask('assign');selectFleetAircraft('scout');s.squad.relay.battery=5;update(.02)");assert.equal(run('s.squad.relay.task.state'),'FAILED');assert.equal(run('s.squad.relay.system.mode'),'RETURN HOME');
 const reserve=run('s.squad.relay.battery');assert(run('writeSave("manual3")'));run('restore(getSave("manual3"))');assert.equal(run('s.squad.relay.battery'),reserve);assert.equal(run('s.squad.relay.task.state'),'FAILED');
 assert(run("operateFleetTask('assign')"));run('s.won=true;startLegTwo(false)');assert.equal(run('s.squad.scout.task.state'),'CANCELLED');assert(run('writeSave("manual1")'),'Cancelled old-region jobs remain valid history');

 // Practice owns a separate manifest; restore exactly the held expedition.
 run("newCampaign();operateFleetTask('assign');play()");tick(.4);const campaign=JSON.parse(run('JSON.stringify(snapshot())'));
 run("yardChoice='cargo';startFlightYard('cargo')");assert.equal(run("operateFleetTask('assign')"),false);assert.equal(run('s.squad.cargo.task'),null);tick(.2);run('leaveFlightYard()');
 assert.equal(run('s.squad.scout.task.id'),campaign.state.squad.scout.task.id);assert.equal(run('s.squad.scout.task.elapsed'),campaign.state.squad.scout.task.elapsed);assert.equal(run('s.squad.scout.battery'),campaign.state.squad.scout.battery);
 run("selectFleetAircraft('relay');operateFleetTask('assign');issueFleet('HOLD')");for(const type of ['scout','relay'])assert.equal(run(`s.squad.${type}.task.state`),'PAUSED','Fleet HOLD pauses each owned job');
 run("issueFleet('RETURN HOME')");for(const type of ['scout','relay'])assert.equal(run(`s.squad.${type}.task.state`),'CANCELLED','Fleet recall cancels each owned job');
 const malformed=JSON.parse(run('JSON.stringify(snapshot())'));malformed.state.squad.scout.task.batteryId='battery-cargo-01';w.localStorage.setItem('gridrunner.taskQA.bad',JSON.stringify(malformed));assert.throws(()=>run('validateSave(JSON.parse(localStorage.getItem("gridrunner.taskQA.bad")))'));w.localStorage.removeItem('gridrunner.taskQA.bad');
 run('surveyScan=taskQAOriginalScan;settings.tutorialEnabled=true;newExpedition();open("drones")');assert(w.document.querySelector('[data-fleet-task=assign]').disabled);assert.equal(run("operateFleetTask('assign')"),false,'New jobs cannot bypass the tutorial');
 console.log('PASS: real Fleet menu dispatch, paused menus, independent selected/background jobs, FPV-origin save/resume, actual discoveries without quest rewards, physical recall, safety persistence, chapter cancellation and Flight Yard isolation.');
}
