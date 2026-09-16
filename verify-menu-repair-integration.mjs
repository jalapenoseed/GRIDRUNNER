import assert from 'node:assert/strict';

export function verifyMenuRepair({run,tick,w}){
 const click=selector=>{const b=w.document.querySelector(selector);assert(b,selector+' exists');assert(!b.closest('[hidden]'),selector+' is reachable');assert(!b.disabled,selector+' is enabled');b.click();};
 run('newCampaign();yardChoice="scout";startFlightYard("sensors");open("drones")');
 for(const [id,mode] of [['engineer','thermal'],['relay','rf'],['scout','uv']]){
  click('[data-quick-aircraft="'+id+'"]');
  click('[data-menu-jump="sensors"]');
  click('[data-sensor-mode="'+mode+'"]');
  assert.equal(run('settings.sensorMode'),mode);
  assert.equal(w.document.body.dataset.sensor,mode);
  assert.equal(w.document.querySelector('.menu-pane:not([hidden])').dataset.menuPane,'sensors');
 }
 click('[data-menu-jump="formations"]');
 assert.equal(w.document.querySelectorAll('[data-formation]').length,11,'ten flight patterns and relay outpost remain');
 // Applying a pattern is a real order: free HOLD / ORBIT aircraft join, DOCK queues.
 run('selectFleetAircraft("scout");issueDrone("HOLD");s.squad.cargo.system.mode="ORBIT";open("drones")');
 click('[data-menu-jump="formations"]');click('[data-formation="TRAIL"]');
 assert.equal(run('s.fleetFormation'),'TRAIL');
 assert.equal(run('s.droneSystem.mode'),'FOLLOW');
 assert.equal(run('s.squad.cargo.system.mode'),'FOLLOW');
 assert(run('fleetLaunchQueue.includes("engineer")'));
 run('play()');tick(8);assert.notEqual(run('s.squad.engineer.system.mode'),'DOCK');
 // Dedicated jobs, FPV and safety returns must not be overwritten by a pattern.
 run('issueDrone("MANUAL");s.squad.cargo.system.mode="RETURN HOME";s.squad.relay.task={state:"RUNNING"};s.squad.relay.system.mode="HOLD";setFormation("LINE")');
 assert.equal(run('s.droneSystem.mode'),'MANUAL');
 assert.equal(run('s.squad.cargo.system.mode'),'RETURN HOME');
 assert.equal(run('s.squad.relay.system.mode'),'HOLD');
 assert.equal(run('s.squad.relay.task.state'),'RUNNING');
 run('s.squad.relay.task=null;issueFleet("DOCK")');assert.equal(run('fleetLaunchQueue.length'),0);
 run('leaveFlightYard();newCampaign();setFormation("WEDGE")');
 assert(!run('fleetLaunchQueue.includes("engineer")'),'campaign locks respected');
 run('s.intro=introState()');assert.equal(run('setFormation("ORBIT")'),false,'tutorial gate respected');
 console.log('PASS: visible fleet shortcuts, actual sensor clicks and mode persistence, all 11 options, formation orders and staged takeoff, FPV/job/return protection and campaign gates.');
}
