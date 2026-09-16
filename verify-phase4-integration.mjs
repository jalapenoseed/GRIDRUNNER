import assert from 'node:assert/strict';

export function verifyPhase4Integration({run,tick,w}){
 run('newCampaign();s.mode="foot";s.pos.set(-57,1.7,-251);s.inv.wire=1;s.inv.electronics=1');tick(.02);
 assert.equal(run('nearest.kind'),'openingRoute');assert.equal(run('nearest.id'),'repair');
 const scanned=run('s.scanned'),scanTime=run('s.scanTime');
 run('interact()');assert.equal(run('screen'),'openingRoute');
 assert.equal(run('s.scanned'),scanned);assert.equal(run('s.scanTime'),scanTime,'Reading a note does not grant a paid global scan');
 const phase=run('JSON.stringify(s.surveillance)');run('loop(performance.now()+1000)');assert.equal(run('JSON.stringify(s.surveillance)'),phase,'Menus pause the patrol');
 w.document.querySelector('[data-route-use=repair]').click();assert(run('s.openingRoute.repaired'));assert.equal(run('s.inv.wire'),0);assert.equal(run('s.inv.electronics'),0);
 w.document.querySelector('[data-route-use=repair]').click();assert.equal(run('s.inv.wire'),0);
 run('play();s.pos.set(-62,1.7,-332)');tick(.02);assert.equal(run('nearest.id'),'locker');run('interact()');
 w.document.querySelector('[data-route-use=locker]').click();assert.equal(run('s.openingRoute.stock.cells'),0);assert.equal(run('s.inv.cells'),1);
 const cargo=run('JSON.stringify(s.inv)');w.document.querySelector('[data-route-use=locker]').click();assert.equal(run('JSON.stringify(s.inv)'),cargo);
 assert(run('writeSave("manual3")'));const before=run('JSON.stringify(s.openingRoute)');run('restore(getSave("manual3"))');assert.equal(run('JSON.stringify(s.openingRoute)'),before);
 run('s.pos.set(-60,1.7,-207);s.mode="foot";s.yaw=0;play();keys.w=true');tick(5.8);run('keys={}');assert(run('s.pos.z')<-234,'Covered route can be walked end to end');
 assert(run('spatial.sweepDrone([-60,9,-222],[-60,2,-222],"scout")'),'Roof is a physical drone obstruction');
 assert(run('spatial.sweepDrone([-45,2,-222],[-60,2,-222],"scout")'),'Side wall is solid');
 assert(!run('watchCanSee([0,12,-222],Math.PI/2,[-60,1.7,-222],{solids:spatial,terrain:heightAt})'),'Actual cover breaks perception');
 assert(run('solids.filter(b=>b.openingRoute).every(b=>Math.abs(b.x)-b.w>14)'),'Main carriageway remains clear');
 assert(!run('s.field.world.some(p=>solids.some(b=>b.openingRoute&&b.minY<2&&Math.abs(p.x-b.x)<b.w+1&&Math.abs(p.z-b.z)<b.d+1))'),'Saved field pickups are clear');
 // Drive the real patrol through the actual world for a full circuit.
 run('s.surveillance=createSurveillance();s.pos.set(-150,1.7,-180);s.hp=100;play()');tick(65);
 assert(run('s.surveillance.system.travel')>100);assert.equal(run('s.surveillance.system.hp'),100,'No collision damage on authored patrol');assert(run('s.surveillance.battery')<100);assert.equal(run('s.hp'),100,'Prototype adds no weapon damage');
 run('s.surveillance.battery=18');tick(35);assert.equal(run('s.surveillance.phase'),'RECHARGE','Real-world charger can be reached without clipping');assert.equal(run('s.surveillance.system.hp'),100);
 run('s.surveillance=createSurveillance();s.surveillance.system.mode="SCOUT AHEAD";s.surveillance.system.pos=[0,12,-220];s.surveillance.waypoint=2;s.mode="drone";droneOrigin={pos:new T.Vector3(0,1.7,-250),mode:"foot",yaw:0};s.pos.set(130,20,-400);for(let i=0;i<100;i++)tickSurveillance(.02)');
 assert.equal(run('JSON.stringify(s.surveillance.lastSeen)'),'[0,1.7,-250]','Surveillance observes the rider, not the FPV camera');
 run('droneOrigin=null;s.mode="foot"');
 run('s.mode="foot";s.pos.set(0,1.7,-250);s.surveillance.system.pos=[0,12,-220];s.surveillance.system.yaw=0;s.surveillance.waypoint=2');tick(4);
 assert.equal(run('s.surveillance.phase'),'OBSERVE');run('hud()');assert.match(w.document.querySelector('#objective').textContent,/TRACKING/);
 run('s.pos.set(-60,1.7,-222)');tick(3);assert.equal(run('s.surveillance.phase'),'SEARCH');
 const known=run('JSON.stringify(s.surveillance.lastSeen)');run('s.pos.set(-120,1.7,-200)');tick(1);assert.equal(run('JSON.stringify(s.surveillance.lastSeen)'),known);
 assert(run('writeSave("manual3")'));const energy=run('s.surveillance.battery');run('restore(getSave("manual3"))');assert.equal(run('s.surveillance.battery'),energy);
 const state=run('JSON.stringify(s.surveillance)');run('s.leg=2');tick(2);assert.equal(run('JSON.stringify(s.surveillance)'),state,'Other chapters do not run or refill the watcher');
 run('s.leg=1;startFlightYard("inspect")');const yard=run('JSON.stringify(s.surveillance)');tick(2);assert.equal(run('JSON.stringify(s.surveillance)'),yard,'Practice cannot progress the campaign patrol');
 run('leaveFlightYard()');assert.equal(run('JSON.stringify(s.surveillance)'),state,'Campaign patrol is restored after practice');
 const legacy=run('snapshot()');delete legacy.state.surveillance;delete legacy.state.openingRoute;
 run('restore('+JSON.stringify(legacy)+')');assert.equal(run('s.openingRoute.repaired'),false);assert.equal(run('s.surveillance.battery'),100);
 run('newExpedition(true)');const quiet=run('JSON.stringify(s.surveillance)');tick(2);assert.equal(run('JSON.stringify(s.surveillance)'),quiet,'Guided opening stays quiet');
 console.log('PASS: real route interactions/saves, duplicate prevention, walkable cover and Rapier roof/walls, pickup clearance, full patrol, visible tracking/search, pause/chapter/practice isolation and old saves.');
}
