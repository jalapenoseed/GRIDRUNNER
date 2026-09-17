const MILESTONES=['firstSalvage','metMara','relayHouseSolved','firstPackBuilt','firstPackDelivered'];

export function createCampaignProgress(){return {version:1,...Object.fromEntries(MILESTONES.map(k=>[k,false]))};}

export function migrateCampaignProgress(value){
 const next=createCampaignProgress();
 if(value&&typeof value==='object')for(const k of MILESTONES)next[k]=value[k]===true;
 return next;
}

export function syncCampaignProgress(s){
 const p=s.progression=migrateCampaignProgress(s.progression);
 p.firstSalvage ||= !!s.intro?.salvaged;
 p.metMara ||= !!s.met;
 p.relayHouseSolved ||= !!s.relayHouse?.discovered;
 p.firstPackBuilt ||= (s.batteryPacks?.serial||0)>0;
 p.firstPackDelivered ||= Object.values(s.squad||{}).some(r=>r.task?.kind==='LINE'&&r.task.packId&&r.task.state==='COMPLETED'&&r.task.stage==='DONE');
 return p;
}

export function campaignUnlocks(s){
 const p=syncCampaignProgress(s),later=(s.leg||1)>1;
 return {
  airframes:{scout:true,cargo:p.metMara||later,engineer:!!s.engineerBuilt||later,relay:true},
  relayOutpost:p.relayHouseSolved||!!s.won||later,
  packFabrication:!!s.relayHouse?.schematicRead||later,
  lineHarvest:p.relayHouseSolved||later,
  reservePolicy:p.firstPackDelivered,
  chapters:{leg1:true,leg2:!!s.won||later,leg3:!!s.leg2Won||s.leg===3}
 };
}

export function unlockReason(id){return ({
 cargo:'Meet Mara at the first camp.',
 engineer:'Fabricate the engineer module at a workbench.',
 relayOutpost:'Decode the Relay House hidden carrier to unlock a landed outpost.',
 packFabrication:'Read the operator notebook in the Relay House.',
 lineHarvest:'Solve the Relay House and decode its carrier.',
 reservePolicy:'Complete one manual Harvest & Deliver run.'
})[id]||'Complete the previous field objective.';}

export function progressionRows(s){
 const p=syncCampaignProgress(s),u=campaignUnlocks(s);
 return [
  {id:'scout',title:'SCOUT-01–04',done:true,detail:'Four workshop-built Scouts / starter cluster'},
  {id:'cargo',title:'CARGO-01',done:u.airframes.cargo,detail:'Meet Mara at the first camp'},
  {id:'engineer',title:'UTILITY-01',done:u.airframes.engineer,detail:'Fabricate the engineer module'},
  {id:'packs',title:'Removable packs',done:u.packFabrication,detail:'Recover the Relay House schematic'},
  {id:'line',title:'Conductor harvesting',done:u.lineHarvest,detail:'Decode the hidden carrier'},
  {id:'policy',title:'Reserve automation',done:u.reservePolicy,detail:'Deliver the first charged pack'},
  {id:'relay',title:'RELAY-01–02',done:true,detail:'Two workshop-built Relays / starter cluster'},
  {id:'leg2',title:'Leg 2 / The Spillway',done:u.chapters.leg2,detail:'Decode the northern radio tower'},
  {id:'leg3',title:'Leg 3 / Black Start',done:u.chapters.leg3,detail:'Restore the Spillway'}
 ];
}
