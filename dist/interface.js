import {glyph} from './item-icons.js';
// Field unit UI: one menu surface, contextual instruments, original supplied atlas.
// The atlas stays unmodified. Coordinates are icon centers on its 1536 x 1024 plate.
export const ICONS = Object.freeze({
  play:[70,198], settings:[175,198], saves:[283,198], new:[390,198],
  guide:[176,293], stats:[282,292], exit:[386,292],
  foot:[518,199], bike:[623,200], drones:[731,198], camp:[837,200], map:[941,200],
  display:[1167,198], audio:[1267,198], controls:[1360,198], accessibility:[1463,198],
  compass:[502,342], waypoint:[568,342], objective:[634,342], tower:[698,342],
  inventory:[1054,342], supplies:[1120,342], loot:[1183,342], key:[1310,341], journal:[1487,343],
  health:[62,448], stamina:[146,448], battery:[623,483], speed:[516,483],
  repair:[516,571], trailer:[624,571], warning:[940,571], scan:[1068,571],
  craft:[54,695], upgrade:[185,695], power:[376,695], interact:[587,695],
  day:[422,832], night:[369,832], weather:[480,832], friendly:[568,831],
  electronics:[1182,831], parts:[1118,831], medical:[1488,831]
});

export function icon(name, extra='') {
  if(['inventory','supplies','craft'].includes(name))return glyph({inventory:'Backpack',supplies:'Container',craft:'Hammer'}[name],extra);
  const [x,y]=ICONS[name]||ICONS.objective;
  return `<span class="atlasIcon ${extra}" aria-hidden="true" style="background-position:${-(x-32)*.375}px ${-(y-32)*.375}px"></span>`;
}

export const MENU_GROUPS = Object.freeze([
  {id:'expedition',label:'Expedition',icon:'compass',target:'quick',pages:[['quick','Field overview','objective'],['journal','Journal','journal'],['saves','Save / load','saves'],['chapters','Chapters','guide']]},
  {id:'equipment',label:'Equipment',icon:'inventory',target:'inventory',pages:[['inventory','Backpack','inventory'],['workshop','Workshop','craft'],['supplies','Cargo & recovery','supplies'],['rig','Bike & trailer','bike']]},
  {id:'fleet',label:'Drones',icon:'drones',target:'drones',pages:[['drones','Airframes','drones'],['flightyard','Flight Yard','tower']]},
  {id:'world',label:'World',icon:'map',target:'map',pages:[['map','Sector map','map'],['locations','Settlements','camp']]},
  {id:'system',label:'System',icon:'settings',target:'settings',pages:[['settings','Settings','settings'],['environment','Light & weather','day'],['controls','Controls','controls'],['guide','Field manual','guide'],['reference','Reference archive','journal']]}
]);

const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const contexts=new Set(['resident','npc','cal','relayTerminal','phase','antenna','core','confirmNew','dead','win','leg2brief','leg2win','leg3brief','leg3win']);
const buttonIcons={flightyard:'drones',quick:'compass',inventory:'inventory',supplies:'supplies',rig:'bike',drones:'drones',map:'map',locations:'camp',settings:'settings',environment:'day',saves:'saves',controls:'controls',guide:'guide',reference:'journal',journal:'journal',chapters:'guide',play:'play',new:'new',continue:'play'};

export function finishInterface({screen,started=false,state={}}={}) {
  const panel=document.getElementById('panel');
  if(!panel||panel.querySelector(':scope > .field-shell'))return;
  document.body.classList.add('interface-ready','menu-open');
  const overlay=document.getElementById('overlay');
  overlay.dataset.screen=screen||'';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label',screen==='start'?'GRIDRUNNER main menu':`GRIDRUNNER ${screen||'field unit'}`);
  panel.querySelectorAll('.fieldNav').forEach(n=>n.remove());
  const home=screen==='start'||screen==='pause';
  const context=contexts.has(screen);
  const group=MENU_GROUPS.find(g=>g.pages.some(p=>p[0]===screen))||MENU_GROUPS[0];
  const content=document.createElement('div');content.className='field-content';content.id='fieldContent';
  while(panel.firstChild)content.appendChild(panel.firstChild);
  content.querySelectorAll('.mainMenu button, .quickGrid button').forEach(b=>{
    const type=b.dataset.nav||b.dataset.panel||b.dataset.ui;
    if(buttonIcons[type]&&!b.querySelector('.atlasIcon'))b.insertAdjacentHTML('afterbegin',icon(buttonIcons[type]));
  });
  const shell=document.createElement('div');
  shell.className=`field-shell${home?' field-home':''}${context?' field-context':''}`;
  shell.innerHTML=`<div class="field-mast"><button class="field-brand" data-nav="${started?'pause':'start'}" aria-label="GRIDRUNNER home"><span class="field-mark" aria-hidden="true">⌁</span> GRIDRUNNER <small>FIELD UNIT / 07</small></button><div class="field-link"><i></i> ${started?'EXPEDITION HELD':'SYSTEM READY'}</div>${started?`<button class="field-resume" data-panel="play">${icon('play')}<span>RESUME</span><kbd>ESC</kbd></button>`:''}</div>`;
  if(!home&&!context){
    shell.insertAdjacentHTML('beforeend',`<nav class="field-primary" aria-label="Menu categories">${MENU_GROUPS.map(g=>`<button data-nav="${g.target}" ${g===group?'aria-current="true"':''}>${icon(g.icon)}<span>${g.label}</span></button>`).join('')}</nav>`);
  }
  const body=document.createElement('div');body.className='field-body';
  if(!home&&!context){
    const rail=document.createElement('nav');rail.className='field-secondary';rail.setAttribute('aria-label',group.label+' pages');
    rail.innerHTML=`<span class="field-section-label">${group.label}</span>${group.pages.map(([id,label,i],index)=>`<button data-nav="${id}" ${screen===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span><small>0${index+1}</small></button>`).join('')}<div class="field-rail-bottom"><span>BLACKLINE / PERSONAL SYSTEM</span><b>FURTHER<br>HORIZONS<br>STILL AWAIT.</b><i></i></div>`;
    body.appendChild(rail);
  }
  body.appendChild(content);shell.appendChild(body);
  const foot=document.createElement('div');foot.className='field-bottom';
  foot.innerHTML=`<span>${started?'SECTOR '+String(state.leg||1).padStart(2,'0')+' / '+Math.floor((state.elapsed||0)/60)+' MIN':'RIDE / SCOUT / SCAVENGE / SURVIVE'}</span><span>${context?'LOCAL INTERFACE':home?'GHOST SIGNAL':'FIELD UNIT'}<i>●</i></span>`;
  shell.appendChild(foot);panel.appendChild(shell);panel.scrollTop=0;
  content.querySelector('.primary:not(:disabled),button:not(:disabled),summary')?.focus({preventScroll:true});
}

let lastVitals='';
export function updateInterfaceHUD({state={},paused=false,started=false,settings={},nearestPowerDistance=Infinity}={}) {
  const body=document.body;
  body.classList.add('interface-ready');
  body.classList.toggle('menu-open',paused);
  body.classList.toggle('expedition-live',started);
  body.classList.toggle('power-near',!!state.harvesting||nearestPowerDistance<18);
  body.classList.toggle('power-active',!!state.harvesting);
  body.classList.toggle('drone-remote',state.mode!=='drone'&&!!state.droneSystem&&state.droneSystem.mode!=='DOCK');
  body.classList.toggle('low-energy',state.battery<18);
  const hp=Math.max(0,Math.round(Number(state.hp)||0)),stamina=Math.round(Number(state.stamina)||0);
  const signature=[hp,stamina,state.mode,settings.hudIntensity].join(':');
  const vitals=document.getElementById('fieldVitals');
  if(vitals&&signature!==lastVitals){
    lastVitals=signature;
    vitals.innerHTML=`<div class="field-vital${hp<30?' is-low':''}">${icon('health')}<div><small>CONDITION</small><b>${hp}<em>%</em></b></div><i style="--vital:${hp}%"></i></div><div class="field-vital${stamina<20?' is-low':''}">${icon('stamina')}<div><small>STAMINA</small><b>${stamina}<em>%</em></b></div><i style="--vital:${stamina}%"></i></div>`;
  }
}
