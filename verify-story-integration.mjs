import assert from 'node:assert/strict';
export function verifyStoryIntegration({run,tick,w}){
 run('newExpedition(false,true);s.mode="bike";s.pos.set(0,1.7,15);syncSquad(s)');
 assert.equal(run('s.story.mode'),'story');assert.deepEqual(Array.from(run('AIRCRAFT.filter(fleetAvailable)')),['scout']);
 run('launchAllDrones()');assert.deepEqual(Array.from(run('fleetLaunchQueue')),['scout']);
 run('open("fieldLink")');assert(w.document.querySelector('.codec'));assert(w.document.querySelector('#panel').textContent.includes('Charger, find me a power source.'));
 w.document.querySelector('[data-story-op=read]').click();assert(run('s.story.read.includes("wake")'));
 w.document.querySelector('[data-panel=play]').click();assert(!run('paused'),'Field link resumes');
 run('open("swarmProgram")');assert.equal(run('screen'),'fieldLink','Campaign programming is earned');
 run('s.met=true;open("fieldBench")');const value=w.document.querySelector('#benchValue');value.value='3';w.document.querySelector('[data-story-op=solve]').click();assert(!run('s.story.lessons.includes("circuit")'));
 w.document.querySelector('#benchValue').value='2';w.document.querySelector('[data-story-op=solve]').click();assert(run('s.story.lessons.includes("circuit")'));
 run('s.pos.copy(trailer.position);s.mode="foot";s.speed=0;s.inv.steel=8;s.inv.electronics=8;s.inv.wire=8;open("fieldBench")');
 w.document.querySelector('[data-story-op=rebuild][data-aircraft="scout-02"]').click();assert(run('fleetAvailable("scout-02")'));assert.equal(run('s.inv.steel'),6);
 run('open("fieldBench")');assert(w.document.querySelector('[data-story-op=rebuild][data-aircraft="scout-02"]').disabled);
 run('s.droneSystem.mode="DOCK";s.squad.scout.system=s.droneSystem;s.squad.scout.battery=s.drone=35;s.pos.set(46,1.7,-86);bike.position.set(45,0,-86);s.speed=0;open("fleetNetwork")');
 w.document.querySelector('[data-story-op=place][data-site=mara]').click();assert(run('!!s.story.stations.scout'));assert(!run('fleetAvailable("scout")'));
 const pos=Array.from(run('s.squad.scout.system.pos')),energy=run('s.story.reserves.mara');run('play()');tick(2);assert(run('s.drone')>35);assert(run('s.story.reserves.mara')<energy);assert.deepEqual(Array.from(run('s.squad.scout.system.pos')),pos);
 assert(run('writeSave("manual1")'),'Station save valid');run('restore(getSave("manual1"))');assert.deepEqual(Array.from(run('s.story.stations.scout.pos')),pos);
 run('s.won=true;startLegTwo(false)');assert.equal(run('s.leg'),2);assert.deepEqual(Array.from(run('s.squad.scout.system.pos')),pos,'No station teleport');
 const charge=run('s.squad.scout.battery');tick(2);assert.equal(run('s.squad.scout.battery'),charge,'Off-sector station does not mint energy');assert(run('writeSave("manual2")'));run('restore(getSave("manual2"))');assert.deepEqual(Array.from(run('s.squad.scout.system.pos')),pos);
 run('s.calMet=true;s.pos.set(35,1.7,-1800);s.mode="foot";s.battery=40;s.speed=0;travelStorySector(1)');assert.equal(run('s.leg'),1);assert.equal(run('s.battery'),32);
 run('s.pos.set(46,1.7,-86);bike.position.set(45,0,-86);open("fleetNetwork")');w.document.querySelector('[data-story-op=recall][data-aircraft=scout]').click();assert(!run('s.story.stations.scout'));assert.equal(run('s.droneSystem.mode'),'DOCK');
 // Use the real Charger dispatcher, aircraft controller and conductor task.
 run('s.engineerBuilt=true;Object.assign(s.relayHouse,{discovered:true,radioTuned:true,power:true,generatorFixed:true,fuseSeated:true,dishAligned:true,filterInstalled:true,frequency:147.2,circuits:undefined});s.droneSystem.mode="DOCK";s.pos.set(0,1.7,15);bike.position.set(0,0,15);s.squad.engineer.battery=45;settings.weather="dusk";settings.randomEnvironment=false;open("fieldLink")');
 w.document.querySelector('[data-story-op=charger]').click();assert.equal(run('s.squad.engineer.task.kind'),'LINE');assert(!run('paused'));tick(65);
 assert(run('s.story.charger.perched'),'Charger physically perches');assert.equal(run('s.squad.engineer.system.mode'),'PERCHED');
 run('open("fieldLink")');w.document.querySelector('[data-story-op=stage-line]').click();assert.equal(run('s.story.stations.engineer.kind'),'line');run('validateSave(snapshot())');assert(run('writeSave("manual1")'));run('restore(getSave("manual1"))');assert.equal(run('s.story.stations.engineer.kind'),'line');
 // Finale eligibility uses the saved fleet, excluding stations and damaged/unowned aircraft.
 run('s.leg3Won=true;s.hydroRestored=true;s.squad["scout-02"].system.hp=0;s.squad.scout.battery=s.drone=70;open("fleetFinale")');
 w.document.querySelector('[data-story-op=finale]').click();assert.equal(run('s.story.finale.runs'),1);assert(!run('s.story.finale.participants.includes("engineer")'));assert(!run('s.story.finale.participants.includes("scout-02")'));assert(!run('s.story.finale.participants.includes("scout-03")'));assert(run('s.story.finale.participants.includes("scout")'));
 tick(2);assert(run('s.squad.scout.system.mode!=="DOCK"'));assert.equal(run('worldCommander.drones.length'),0,'Finale creates no admin copies');assert(run('writeSave("manual3")'));run('restore(getSave("manual3"));open("swarmProgram")');assert(w.document.querySelector('[data-program-id=engineer]'),'Real specialist airframes can be choreographed');
 run('newCampaign();syncSquad(s)');assert(run('fleetAvailable("scout-04")'));assert(run('fleetAvailable("relay-02")'),'Existing test start remains accessible');
 // Exercise the real scanner: incorrect optics reveal no evidence; movement matters for RF.
 run('newExpedition(false,true);s.mode="foot";s.inv={};s.pos.set(-38,heightAt(-38,-253)+1.7,-253);settings.sensorMode="visible";s.droneSystem.scanCooldown=0;scanDrone()');
 assert.equal(run('s.storyDiscoveries.signals["story-uv"].samples.length'),0);
 run('settings.sensorMode="uv";s.droneSystem.scanCooldown=0;scanDrone()');
 assert.equal(run('s.storyDiscoveries.signals["story-uv"].samples.length'),1);
 assert(!run('collectStoryCache(s,"story-uv",{position:[0,0,0]}).ok'));
 run('s.mode="drone"');assert(!run('collectStoryCache(s,"story-uv",{position:[-42,0,-253]}).ok'));run('s.mode="foot"');
 assert(run('collectStoryCache(s,"story-uv",{position:s.pos.toArray(),capacity:0}).ok'));
 assert.equal(run('s.storyDiscoveries.signals["story-uv"].items.wire'),2,'A full pack leaves loot in place');
 run('open("fieldDiscoveries")');w.document.querySelector('[data-story-cache="story-uv"]').click();
 assert.equal(run('s.inv.wire'),2);w.document.querySelector('[data-story-cache="story-uv"]').click();assert.equal(run('s.inv.wire'),2,'Loot is finite');
 run('s.pos.set(-66,heightAt(-66,-320)+1.7,-320);settings.sensorMode="thermal";s.droneSystem.scanCooldown=0;scanDrone()');
 assert.equal(run('s.storyDiscoveries.signals["story-thermal"].samples.length'),1);
 run('s.pos.set(55,heightAt(55,-475)+1.7,-475);settings.sensorMode="rf";s.droneSystem.scanCooldown=0;scanDrone();s.droneSystem.scanCooldown=0;scanDrone()');
 assert.equal(run('s.storyDiscoveries.signals["story-rf"].samples.length'),1,'Same-position RF samples are not counted twice');
 run('s.pos.set(75,heightAt(75,-495)+1.7,-495);s.droneSystem.scanCooldown=0;scanDrone();s.pos.set(55,heightAt(55,-515)+1.7,-515);s.droneSystem.scanCooldown=0;scanDrone()');
 assert.equal(run('s.storyDiscoveries.signals["story-rf"].samples.length'),3);
 assert(run('writeSave("manual1")'));run('restore(getSave("manual1"))');assert.equal(run('s.storyDiscoveries.signals["story-rf"].samples.length'),3,'Evidence persists');
 // Recorder bounds and scrubbing must never mutate the live aircraft.
 run('s.droneSystem.mode="HOLD";s.droneSystem.pos=[0,20,0];syncSquad(s);for(let i=0;i<125;i++){s.elapsed+=2;s.droneSystem.pos[0]=i;advanceStoryLog(s)}');
 assert.equal(run('s.storyDiscoveries.log.length'),120);assert(run('writeSave("manual2")'));run('restore(getSave("manual2"));open("fleetNetwork")');
 const livePos=Array.from(run('s.droneSystem.pos')),slider=w.document.querySelector('[data-story-replay]');slider.value='0';slider.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.deepEqual(Array.from(run('s.droneSystem.pos')),livePos);assert(!w.document.querySelector('.storyLog').innerHTML.includes('NaN'));
 assert.throws(()=>run('validateStoryDiscoveries({...s.storyDiscoveries,log:[{at:0,leg:1,aircraft:[]}]})'));
 run('s.droneSystem.mode="DOCK";s.met=true;s.pos.set(46,1.7,-86);bike.position.set(45,0,-86);s.speed=0;placeStoryDrone(s,"scout","mara",storyContext())');
 run('s.drone=s.squad.scout.battery=50;open("rig")');const bikeBefore=run('s.battery'),droneBefore=run('s.drone');w.document.querySelector('[data-panel=transfer]').click();assert.equal(run('s.battery'),bikeBefore);assert.equal(run('s.drone'),droneBefore,'Stationed aircraft cannot be charged remotely from the bike');
 run('bike.position.set(35,0,-86);launchAllDrones();play()');tick(2);assert(run('s.squad.cargo.system.mode!=="DOCK"'),'A stationed selected drone does not block other launches');
 assert.throws(()=>run('const badStation=snapshot();badStation.state.story.stations.scout.pos[0]+=1;validateSave(badStation)'));
 console.log('PASS: one-drone story start, earned tools, actual Field link/bench/rebuild UI, finite station charging, persisted positions through travel/reload, no off-sector income, real Charger flight/perch, and finale using actual surviving available aircraft.');
 console.log('PASS: actual UV/thermal/RF scan paths, separated RF observations, finite cache contents with capacity checks, saved evidence, bounded flight recorder, non-mutating replay and corrupt station rejection.');
}
