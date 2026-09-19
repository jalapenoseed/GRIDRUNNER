// Device-local presentation preferences, never campaign unlocks or save state.
export const FIRST_USE={
 drones:['Your fleet','Select an unlocked aircraft before issuing a command. Manual control pauses its task. Recall or cancel suspends reserve automation; re-arm it deliberately. Y enables local YOLO pixel detection in the visible sensor; R is the separate field scanner.'],
 inventory:['Your backpack','Select an item to inspect its weight and actions. Search and category filters narrow the list. Stored cargo stays on the bike or trailer until retrieved nearby.'],
 workshop:['Field fabrication','Recipes show their ingredients and prerequisites. Quest and puzzle discoveries unlock equipment; practice in Flight Yard does not unlock campaign gear.'],
 rig:['Bike and trailer','Stored charge is finite. Stop beside the trailer to move battery packs or transfer reserve. Grass and shallow road edges are rideable; barriers, trunks and crates are solid.']
};
const signature=el=>JSON.stringify([el.tagName,el.id||'',...Object.entries(el.dataset).sort().flat(),Object.keys(el.dataset).length?'':(el.textContent||'').slice(0,80)]);
export class MenuMemory{
 constructor(storage){this.storage=storage;this.pages={};this.dismissed={};this.children={};this.current='';try{const v=JSON.parse(storage?.getItem('gridrunner.menu.v1')||'{}');for(const key of ['pages','dismissed','children'])if(v?.[key]&&typeof v[key]==='object'&&!Array.isArray(v[key]))this[key]=v[key];}catch{} }
 save(){try{this.storage?.setItem('gridrunner.menu.v1',JSON.stringify({pages:this.pages,dismissed:this.dismissed,children:this.children}));}catch{} }
 capture(panel){if(!this.current)return;const content=panel.querySelector('#fieldContent');if(!content)return;const focused=panel.ownerDocument.activeElement;this.pages[this.current]={scroll:content.scrollTop,focus:content.contains(focused)?signature(focused):this.pages[this.current]?.focus,details:[...content.querySelectorAll('details')].map(d=>d.open)};this.save();}
 attach(panel){if(this.panel===panel)return;this.panel=panel;for(const event of ['click','focusin','scroll','toggle'])panel.addEventListener(event,()=>this.capture(panel),true);}
 restore(panel,screen,group){this.current=screen;if(group)this.children[group.id]=screen;const saved=this.pages[screen],content=panel.querySelector('#fieldContent');if(!content||!saved)return;
  if(Array.isArray(saved.details))content.querySelectorAll('details').forEach((d,i)=>{if(typeof saved.details[i]==='boolean')d.open=saved.details[i];});
  const target=[...content.querySelectorAll('button,input,select,summary')].find(el=>signature(el)===saved.focus&&!el.disabled&&!el.closest('[hidden]')&&![...content.querySelectorAll('details:not([open])')].some(d=>d.contains(el)&&el!==d.querySelector('summary')));target?.focus({preventScroll:true});content.scrollTop=Math.max(0,Math.min(Number(saved.scroll)||0,100000));
 }
 lesson(content,screen,enabled=true){const lesson=FIRST_USE[screen];if(!enabled||!lesson||this.dismissed[screen])return;const card=content.ownerDocument.createElement('aside');card.className='firstUse';const heading=content.ownerDocument.createElement('strong'),p=content.ownerDocument.createElement('p'),button=content.ownerDocument.createElement('button');heading.textContent=lesson[0];p.textContent=lesson[1];button.textContent='GOT IT';button.onclick=()=>{this.dismissed[screen]=true;this.save();card.remove();content.querySelector('button:not(:disabled),summary')?.focus({preventScroll:true});};card.append(heading,p,button);content.prepend(card);}
}
