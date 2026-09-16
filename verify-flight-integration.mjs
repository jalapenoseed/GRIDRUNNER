import assert from 'node:assert/strict';

export function verifyFlightIntegration({run,w}){
 run("newCampaign();yardChoice='scout';settings.droneFlight='stabilized';settings.droneStickLayout='mode2';settings.weather='heat';settings.movingSun=false;applySettings();startFlightYard('circuit');s.droneSystem.pos=[160,30,111];s.pos.fromArray(s.droneSystem.pos);controller.other('touch');hud()");
 const left=w.document.querySelector('#joystick'),right=w.document.querySelector('#lookJoystick');
 left.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});right.getBoundingClientRect=()=>({left:200,top:0,width:100,height:100});
 const pointer=(element,type,id,x,y)=>element.dispatchEvent(Object.assign(new w.Event(type,{bubbles:true,cancelable:true}),{pointerId:id,pointerType:'touch',clientX:x,clientY:y}));
 pointer(left,'pointerdown',11,65,20);pointer(right,'pointerdown',22,250,10);
 assert.equal(run('controller.device'),'touch');run('update(.02)');
 assert(run('s.droneSystem.velocity[1]')>0,'Left stick really raises the selected drone');
 assert(run('s.droneSystem.velocity[2]')<0,'Right stick really flies forward');assert(run('s.yaw')<0,'Left stick really turns yaw');
 pointer(right,'pointercancel',22,250,10);assert.equal(run('rightStick.y'),0);assert(run('leftStick.y')<0);
 run("open('pause')");assert.equal(run('leftStick.y'),0);assert.equal(run('rightStick.y'),0);pointer(left,'pointermove',11,65,0);assert.equal(run('stickY'),0);
 run("open('settings')");const selector=w.document.querySelector('[data-setting=droneStickLayout]');assert(selector);
 selector.value='classic';selector.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(JSON.parse(w.localStorage.getItem('gridrunner.settings')).droneStickLayout,'classic');
 run("settings.droneStickLayout='bad';applySettings()");assert.equal(run('settings.droneStickLayout'),'mode2');
 run("play();controller.other('touch');hud()");assert.equal(left.getAttribute('aria-label'),'Drone lift and yaw');
 assert(w.document.querySelector('#droneHUD').textContent.includes('0.95 kg'),'Mass appears in the existing HUD');
 pointer(left,'pointerdown',33,50,10);w.document.querySelector('#droneHold').click();assert.equal(run('s.droneSystem.mode'),'HOLD');assert.equal(run('stickY'),0);assert.equal(run('s.mode'),'foot');
 run("issueDrone('MANUAL');settings.droneFlight='acro';applySettings();controller.other('touch')");
 pointer(right,'pointerdown',44,270,20);run('update(.02)');assert(run('flightRates[0]')<0&&run('flightRates[2]')<0,'Acro right stick pitches nose down and rolls right');
 run("issueDrone('HOLD');settings.droneFlight='stabilized';applySettings();leaveFlightYard()");

 // The crate stays with CARGO-01 when another aircraft is selected.
 run("yardChoice='cargo';startFlightYard('cargo');s.droneSystem.pos=[170,4,52];s.droneSystem.speed=0;interact();s.droneSystem.pos=[160,30,100];s.droneSystem.velocity=[0,0,0];hud()");
 assert(run('flightSession.carrying'));assert(w.document.querySelector('#droneHUD').textContent.includes('14.40 kg'));
 run('tickDrone(.02,[1,0,0])');const cargoAcceleration=-run('s.droneSystem.velocity[2]')/.02;assert(cargoAcceleration<5,'Real payload reaches selected aircraft physics');
 run("releaseDroneView();selectAircraft(s,'scout');issueDrone('MANUAL');s.squad.cargo.system.mode='HOLD';s.squad.cargo.system.hold=[...s.squad.cargo.system.pos];s.squad.cargo.system.velocity=[0,0,0]");
 const before=run('s.squad.cargo.battery');run('tickSquad(.02)');assert(before-run('s.squad.cargo.battery')>.007,'Unselected cargo keeps its payload draw');
 run('loop(performance.now()+20)');assert(Math.abs(run('yardWorld.payload.position.x-s.squad.cargo.system.pos[0]'))<.001,'Crate mesh follows cargo, not the selected Scout');
 run("releaseDroneView();selectAircraft(s,'cargo');issueDrone('MANUAL');s.droneSystem.pos=[104,4,84];s.droneSystem.speed=0;interact();hud()");
 assert(!run('flightSession.carrying'));assert(w.document.querySelector('#droneHUD').textContent.includes('8.40 kg'));run('leaveFlightYard()');
 assert(!run('flightSession'),'Practice payload never leaks into campaign');
 console.log('PASS: real two-stick input routing, pause/reset, HOLD recovery, Acro axes, layout persistence, HUD mass, cargo attach/drop and independent fleet load/mesh ownership.');
}
