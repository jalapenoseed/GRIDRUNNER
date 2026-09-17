// Navigation is session state; lesson progress belongs to the expedition save.
export class MenuTrail {
 constructor(){this.path=[];}
 enter(page,current,started){const root=started?'pause':'start';if(page===root){this.path=[];return;}if(page===current)return;if(current&&current!==page)this.path.push(current);else this.path=[root];this.path=this.path.slice(-24);}
 back(started){return this.path.pop()||(started?'pause':'start');}
 clear(){this.path=[];}
}
export const menuTrail=new MenuTrail();
export const LESSONS=Object.freeze({
 scan:{title:'Read a field scan',page:'quick',anchor:'[data-nav="map"]',text:'R spends charge and records nearby contacts. Check the map or journal. A field scan uses world sensors; Y runs separate YOLO pixel detection.',ready:s=>!!s.intro?.maraMet||s.intro?.stage==='line'},
 sensor:{title:'Choose a sensor',page:'drones',anchor:'[data-command="MANUAL"]',text:'B cycles the selected airframe’s sensors. R measures with that sensor. UV reveals fluorescent marks, thermal finds heat, RF finds transmitters, and depth measures distance. Evidence is a simulated reading, not a quest solution.',ready:s=>true},
 repair:{title:'Repair an airframe',page:'drones',anchor:'[data-repair-drone]',text:'Dock the selected drone, then spend one steel to restore up to 40 hull. Inspect hull before launching; low hull triggers a return.',ready:s=>s.droneSystem?.hp<100},
 load:{title:'Load a battery pack',page:'drones',anchor:'[data-pack-op]',text:'Stop beside the trailer. Load an available pack on the Utility drone before assigning a conductor harvest. Added mass changes flight.',ready:s=>!!s.engineerBuilt},
 perch:{title:'Perch on a conductor',page:'drones',anchor:'[data-fleet-task]',text:'Select Utility and assign a line task. It approaches, aligns and latches physically. Watch contact and reserve; HOLD interrupts the job safely.',ready:s=>!!s.engineerBuilt},
 delivery:{title:'Deliver stored power',page:'drones',anchor:'[data-pack-op]',text:'Send a charged pack home. Delivery credits reserve only after arrival and transfer; issuing the command does not create energy.',ready:s=>!!s.engineerBuilt},
 arm:{title:'Arm reserve automation',page:'drones',anchor:'[data-fleet-policy-toggle]',text:'Choose the reserve target, then arm. Cancel, recall or failure suspends automation. Review the reason before deliberately re-arming.',ready:s=>!!s.engineerBuilt}
});
export function lessonState(raw={}){const out={};for(const id of Object.keys(LESSONS)){const v=raw?.[id];if(v!==undefined&&!['seen','done','skipped'].includes(v))throw Error('Invalid interaction lesson');if(v)out[id]=v;}return out;}
export function completeLesson(s,id){if(LESSONS[id]){s.lessons||={};s.lessons[id]='done';}}
export function rankedFieldPages(s,{nearTrailer=false}={}){const pages=[['map','Map','Route & power sites'],['inventory','Backpack','Items, tools & recovery'],['drones','Drones','Airframes & commands'],['swarm','Swarm Command','Guard, scout, relay & field cover'],['journal','Journal','Clues & discoveries'],['rig','Mobile power','Bike, trailer & charging']];const rank={map:10,inventory:s.hp<50?60:20,drones:s.mode==='drone'?80:s.droneSystem?.hp<40?65:25,swarm:22,journal:s.relayHouse?.visited&&!s.relayHouse.discovered?50:15,rig:s.battery<25?70:nearTrailer?55:5};if(nearTrailer&&s.relayHouse?.schematicRead){pages.push(['workshop','Workshop','Known recipes & required parts']);rank.workshop=s.relayHouse.filterInstalled?30:75;}return pages.sort((a,b)=>rank[b[0]]-rank[a[0]]);}
export function interactionGuide(panel,s,screen,enabled){
 if(!enabled)return;const entry=Object.entries(LESSONS).find(([id,l])=>l.page===screen&&l.ready(s)&&!s.lessons?.[id]);if(!entry)return;const [id,l]=entry,card=panel.ownerDocument.createElement('aside');card.className='firstUse';card.innerHTML=`<strong>${l.title}</strong><p>${l.text}</p><button data-lesson-dismiss>GOT IT</button> <button data-lesson-skip>SKIP THIS HINT</button>`;const anchor=panel.querySelector(l.anchor);(anchor?.closest('article')||panel).prepend(card);card.querySelector('[data-lesson-dismiss]').onclick=()=>{s.lessons||={};s.lessons[id]='seen';card.remove();anchor?.focus();};card.querySelector('[data-lesson-skip]').onclick=()=>{s.lessons||={};s.lessons[id]='skipped';card.remove();};
}
export function guideLibrary(s){return `<section class="interactionLessons"><h3>Interaction guides</h3><p>Replay a hint without resetting your expedition. Narration and hints are separate settings.</p>${Object.entries(LESSONS).map(([id,l])=>`<details><summary>${l.title} · ${s.lessons?.[id]||'not seen'}</summary><p>${l.text}</p><button data-lesson-replay="${id}">SHOW NEXT TIME</button></details>`).join('')}</section>`;}
