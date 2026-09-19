import assert from 'node:assert/strict';
export function verifySwarmSensorsIntegration({run,tick,w}){
 run('newCampaign();open("drones")');
 const content=w.document.querySelector('#fieldContent'),quick=content.querySelector('.fleetQuick');assert(quick);assert.equal(quick.querySelectorAll('[data-quick-aircraft]').length,8);assert(content.innerHTML.indexOf('fleetQuick')<content.innerHTML.indexOf('droneOps'));
 assert(w.document.querySelector('[data-quick-aircraft="cargo"]').disabled,'campaign locks remain');
 run('launchAllDrones();play()');tick(3);assert.equal(run('s.droneSystem.mode'),'FOLLOW');assert.equal(run('s.squad.cargo.system.mode'),'DOCK');assert(run('s.drone<100'));
 run('newCampaign();s.intro=introState()');assert.equal(run('launchAllDrones()'),false,'onboarding cannot be bypassed');
 run('newCampaign();yardChoice="scout";startFlightYard("sensors");open("drones")');
 w.document.querySelector('[data-quick-aircraft="engineer"]').click();assert.equal(run('s.droneType'),'engineer');
 run('s.squad.cargo.battery=8;open("drones")');w.document.querySelector('[data-launch-all]').click();assert(!run('fleetLaunchQueue.includes("cargo")'),'low battery omitted');
 run('play()');tick(8);assert.notEqual(run('s.squad.relay.system.mode'),'DOCK');assert.equal(run('s.squad.cargo.system.mode'),'DOCK');
 run('issueFleet("DOCK")');assert.equal(run('fleetLaunchQueue.length'),0,'recall cancels staged launches');
 // The real scene must let all three calibration targets be read from the pad.
 for(const [id,mode]of [['scout','uv'],['engineer','thermal'],['relay','rf']]){
  run(`selectFleetAircraft('${id}');issueDrone('MANUAL');s.droneSystem.pos=[160,7,111];s.pos.fromArray(s.droneSystem.pos);s.droneSystem.scanCooldown=0;settings.sensorMode='${mode}';applySettings();scanDrone()`);
  assert(run(`flightSession.sensorReadings.includes('${mode}')`),mode+' physical lab scan');
 }
 assert(run('flightSession.complete'));run('open("journal")');assert(w.document.querySelector('#panel').textContent.includes('world-simulation'));
 run('leaveFlightYard()');assert.equal(run('flightSession'),null);assert.equal(run('s.droneType'),'scout');assert(!run('s.discoveries.some(t=>t.id.startsWith("lab-"))'),'practice readings do not leak into campaign');
 run('issueDrone("MANUAL");s.droneSystem.pos=[-28,4,-199];s.pos.fromArray(s.droneSystem.pos);s.droneSystem.scanCooldown=0;settings.sensorMode="uv";applySettings();scanDrone()');assert(run('s.discoveries.some(t=>t.id==="uv-maintenance-entry")'),'campaign UV marking recorded');
 run('restore(validateSave(JSON.parse(JSON.stringify(snapshot()))))');assert(run('s.discoveries.some(t=>t.sensor==="uv")'),'UV evidence survives save round trip');
 run('yardChoice="scout";startFlightYard("sensors");camera.position.set(160,4,111);camera.lookAt(161,1,97);camera.updateMatrixWorld()');assert(run('sensorLab.references(camera,spatial,1280,800).length')>=1,'lab model reference projects into view');
 run('sensorLab.update(1,"uv",camera)');assert(run('sensorLab.marks[0].visible'));run('sensorLab.update(1,"visible",camera)');assert(!run('sensorLab.marks[0].visible'));run('sensorLab.update(2,"uv",camera)');assert(!run('sensorLab.root.visible'));
 run('leaveFlightYard()');console.log('PASS: top fleet picker, campaign/tutorial gates, staged launch/recall, low charge exclusion, real-scene UV/thermal/RF scans, practice isolation, UV saves and lab projection.');
}
