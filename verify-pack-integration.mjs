import assert from 'node:assert/strict';

export function verifyPackIntegration({run,tick,w}){
 run("newCampaign();settings.randomEnvironment=false;settings.weather='heat';settings.movingSun=false;settings.sunHour=12;applySettings();s.engineerBuilt=true;selectFleetAircraft('engineer');s.drone=65;s.inv.cells=2;s.inv.wire=4;s.inv.electronics=2;s.inv.rubber=2;open('drones')");
 const click=id=>{const b=w.document.querySelector('[data-pack-op='+id+']');assert(b&&!b.disabled,id+' available');b.click();};
 click('build');assert.equal(run('s.batteryPacks.serial'),1);assert.equal(run('s.inv.cells'),1);click('load');assert.equal(run('aircraftPayload("engineer")'),1.2);assert.equal(run('aircraftPayload("cargo")'),0);
 click('harvest');assert.equal(run('s.squad.engineer.task.packId'),'pack-1');
 // A parked trailer is the delivery point, independent from the bike/radio.
 run("s.trailerAttached=false;trailer.position.set(16,0,10);play();selectFleetAircraft('scout');for(let i=0;i<10000&&s.squad.engineer.task.stage!=='DELIVER';i++)update(.02)");
 assert.equal(run('s.squad.engineer.task.stage'),'DELIVER');assert.equal(run('s.squad.engineer.system.mode'),'RELEASE');assert(run('s.squad.engineer.system.hp')===100);assert(Math.abs(run('s.batteryPacks.packs[0].chargeWh')-108)<1e-7);assert.equal(run('s.trailer'),24.8);
 assert(run('writeSave("manual1")'));const bank=run('s.lineGrid.remainingWh.south');run('restore(getSave("manual1"));play()');assert.equal(run('s.lineGrid.remainingWh.south'),bank);assert.equal(run('s.batteryPacks.packs[0].owner'),'aircraft-engineer-01');
 run('for(let i=0;i<5000&&s.squad.engineer.task.state!=="COMPLETED";i++)update(.02)');
 assert.equal(run('s.squad.engineer.task.state'),'COMPLETED');assert.equal(run('s.batteryPacks.packs[0].owner'),'trailer');assert(Math.abs(run('s.trailer')-30.2)<1e-8);assert.equal(run('s.batteryPacks.packs[0].chargeWh'),0);assert.equal(run('aircraftPayload("engineer")'),0);
 const loc=Array.from(run('s.squad.engineer.system.pos'));assert(Math.hypot(loc[0]-16,loc[1]-2.4,loc[2]-10)<.7,'Unloads at real parked trailer');assert.equal(run('s.lineGrid.remainingWh.south'),bank,'Return leg cannot debit a circuit');
 const delivered=run('s.trailer');assert(run('writeSave("manual2")'));run('restore(getSave("manual2"));play()');tick(20);assert.equal(run('s.trailer'),delivered,'Reload cannot duplicate delivery');assert.equal(run('s.squad.engineer.system.mode'),'DOCK');
 const before=run('JSON.stringify(s.batteryPacks)');run("yardChoice='engineer';startFlightYard('repair')");assert.equal(run("operatePack('build')"),false);assert.equal(run('aircraftPayload("engineer")'),0);run('leaveFlightYard()');assert.equal(run('JSON.stringify(s.batteryPacks)'),before);
 // Reject duplicate identity / active jobs borrowing someone else's pack.
 assert.throws(()=>run('{const r=JSON.parse(JSON.stringify(snapshot()));r.state.batteryPacks.packs.push({...r.state.batteryPacks.packs[0]});r.state.batteryPacks.serial++;validateSave(r);}'));
 run('restore(getSave("manual1"))');assert.throws(()=>run('{const r=JSON.parse(JSON.stringify(snapshot()));r.state.batteryPacks.packs[0].owner="trailer";validateSave(r);}'));
 run("selectFleetAircraft('engineer');operateFleetTask('cancel');play()");tick(40);assert.equal(run('s.batteryPacks.packs[0].owner'),'aircraft-engineer-01');assert.equal(run('s.trailer'),24.8,'Recall retains cargo without remote credit');
 run("s.trailerAttached=true;trailer.position.set(0,0,18.4);s.pos.set(0,1.7,15);s.speed=0;s.trailer=39;open('drones')");click('unload');assert.equal(run('s.trailer'),40);assert(Math.abs(run('s.batteryPacks.packs[0].chargeWh')-88)<1e-8,'Full trailer retains excess');assert.equal(run('s.batteryPacks.packs[0].owner'),'trailer');
 run("s.trailer=35;open('drones')");click('drain');assert.equal(run('s.batteryPacks.packs[0].chargeWh'),0);assert(Math.abs(run('s.trailer')-39.4)<1e-8);
 assert.equal(run('{const r=JSON.parse(JSON.stringify(snapshot()));delete r.state.batteryPacks;r.state.squad.engineer.task=null;validateSave(r).state.batteryPacks.packs.length;}'),0);
 console.log('PASS: build/load via Fleet, loaded physical wire flight, saved release, parked-trailer delivery, exact pack/reserve accounting, excess retention, recall ownership, migration, duplicate rejection and practice isolation.');
}
