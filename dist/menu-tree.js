// Presentation only. Move existing controls; their gameplay handlers and gates stay intact.
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=t=>t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let activeTree;

function sectionsFor(content,screen){
 const sections=[];
 const add=(id,label,nodes)=>{nodes=nodes.filter(Boolean);if(!nodes.length)return;const pane=content.ownerDocument.createElement('section');pane.className='menu-pane';pane.dataset.menuPane=id;pane.setAttribute('aria-label',label);pane.id='menu-pane-'+id;nodes.forEach(n=>pane.append(n));content.append(pane);sections.push({id,label,pane});return pane;};
 if(screen==='drones'){
  const ops=content.querySelector('.droneOps'),formation=ops?.querySelector('.sectionHeading');
  if(ops){const after=[];if(formation){let n=formation;while(n){after.push(n);n=n.nextSibling;}}const repair=ops.querySelector('[data-repair-drone]');if(repair)ops.insertBefore(repair,formation);add('commands','Flight commands',[ops]);add('formations','Formations',after.filter(n=>n!==repair));}
  add('tasks','Survey & harvesting',[...content.querySelectorAll(':scope > .fleetTask')].filter(n=>['Selected aircraft task','Conductor harvesting'].includes(n.getAttribute('aria-label'))));
  add('packs','Battery packs',[content.querySelector('[aria-label="Harvest battery packs"]')]);
  add('automation','Reserve automation',[content.querySelector('[aria-label="Autonomous reserve policy"]')]);
  const cards=content.querySelector('.fleetCards');add('airframes','Airframe details',[cards,cards?.nextElementSibling?.matches('p')?cards.nextElementSibling:null]);
  const sensor=Array.from(content.children).find(n=>n.matches('[data-sensor-heading]')||(n.tagName==='H3'&&n.textContent==='Sensor payload'));
  if(sensor){const nodes=[];let n=sensor;while(n&&!n.classList?.contains('menu-pane')){nodes.push(n);n=n.nextSibling;}add('sensors','Sensors & optics',nodes);}
 }else if(screen==='settings'||screen==='controls'){
  const details=[...content.querySelectorAll(':scope > .settingDetails')];
  const general=[...content.children].filter(n=>!n.matches('.panelTop,.firstUse,.settingDetails,.interactionLessons')&&!n.querySelector('.interactionLessons'));
  if(screen==='controls'&&general.length)add('overview','Overview',general);
  for(const d of details){const summary=d.querySelector(':scope > summary'),label=summary?.textContent||'Options';summary?.remove();add(slug(label),label,[...d.childNodes]);d.remove();}
  if(screen==='settings'&&general.length)add('preferences','Reset & hints',general);
  const guides=content.querySelector('.interactionLessons');if(guides){const wrapper=guides.parentElement;add('guides','Interaction guides',[guides]);if(wrapper!==content&&!wrapper.childElementCount)wrapper.remove();}
 }else if(screen==='rig'){
  const source=content.querySelector('.sourceCards'),recipes=[...content.querySelectorAll(':scope > .recipe')];
  const ledger=Array.from(content.children).find(n=>n.tagName==='H3'&&n.textContent==='Energy ledger');
  const ledgerNodes=[];if(ledger){let n=ledger;while(n){ledgerNodes.push(n);n=n.nextSibling;}}
  const generation=source?[source.previousElementSibling?.matches('p')?source.previousElementSibling:null,source]:[];
  const reserved=new Set([...generation,...recipes,...ledgerNodes]);
  add('overview','Rig overview',[...content.children].filter(n=>!n.matches('.panelTop,.firstUse,.menuNotice')&&!reserved.has(n)));
  add('generation','Generation',generation);add('transfers','Transfers & hitch',recipes);add('ledger','Energy ledger',ledgerNodes);
 }
 return sections;
}

export function installMenuTree({shell,body,content,screen,group,groups,home,started,icon,memory}){
 const doc=content.ownerDocument,sections=sectionsFor(content,screen);
 const title=content.querySelector(':scope > .panelTop');if(title)content.prepend(title);
 // Hints stay available without pushing the actual commands below the fold.
 content.querySelectorAll('.firstUse').forEach(card=>{const detail=doc.createElement('details');detail.className='menu-help';const summary=doc.createElement('summary');summary.textContent='Guide · '+(card.querySelector('strong')?.textContent||'Help');card.before(detail);detail.append(summary,card);});
 let prefs={};try{prefs=JSON.parse(window.localStorage.getItem('gridrunner.menu.tree.v1')||'{}')||{};}catch{}
 if(typeof prefs!=='object'||Array.isArray(prefs))prefs={};
 const save=()=>{try{window.localStorage.setItem('gridrunner.menu.tree.v1',JSON.stringify(prefs));}catch{}};
 shell.classList.add('compact-menu');
 const rail=doc.createElement('nav');rail.className='menu-tree';rail.id='menu-tree';rail.setAttribute('aria-label','Field unit navigation');
 rail.innerHTML=`<span class="tree-label">FIELD DIRECTORY</span>${groups.map(g=>{
  const expanded=!home&&g===group;
  return `<div class="menu-group"><button data-menu-group="${g.id}" aria-expanded="${expanded}" aria-controls="menu-group-${g.id}">${icon(g.icon)}<span>${g.label}</span><span class="tree-chevron" aria-hidden="true">›</span></button><div class="menu-group-pages" id="menu-group-${g.id}" ${expanded?'':'hidden'}>${g.pages.map(([id,label])=>`<button class="tree-page" data-nav="${id}" ${screen===id?'aria-current="page"':''}>${esc(label)}</button>${screen===id&&sections.length?`<div class="tree-sections">${sections.map(p=>`<button data-menu-section="${p.id}" aria-controls="${p.pane.id}">${esc(p.label)}</button>`).join('')}</div>`:''}`).join('')}</div></div>`;
 }).join('')}`;
 body.prepend(rail);
 const bar=doc.createElement('div');bar.className='menu-path';
 const page=group.pages.find(p=>p[0]===screen)?.[1]||(home?'Home':screen==='adminFleet'?'In-game fleet test':screen);
 bar.innerHTML=`<button class="tree-toggle" aria-expanded="false" aria-controls="menu-tree">DIRECTORY</button><button data-back aria-label="Back to parent menu">← Back</button><span class="menu-breadcrumb">${home?'Field unit':esc(group.label)+' / '+esc(page)}<b></b></span>`;
 shell.insertBefore(bar,body);
 content.querySelectorAll('.panelTop > button').forEach(b=>b.remove());
 if(home){content.querySelectorAll('.mainMenu [data-nav="guide"],.mainMenu [data-nav="story"],.mainMenu [data-nav="settings"],.mainMenu [data-nav="chapters"]').forEach(b=>b.remove());}
 const toggle=bar.querySelector('.tree-toggle');
 const setMobile=open=>{shell.classList.toggle('tree-visible',open);toggle.setAttribute('aria-expanded',String(open));};
 toggle.onclick=()=>setMobile(!shell.classList.contains('tree-visible'));
 // Common fleet actions stay discoverable even when the mobile directory is closed.
 let shortcuts;
 if(screen==='drones'){
  shortcuts=doc.createElement('nav');shortcuts.className='fleet-section-shortcuts';shortcuts.setAttribute('aria-label','Fleet pages');
  shortcuts.innerHTML=[['commands','Commands'],['formations','Formations'],['sensors','Sensors & optics']].filter(([id])=>sections.some(p=>p.id===id)).map(([id,label])=>`<button data-menu-jump="${id}" aria-controls="menu-pane-${id}">${label}</button>`).join('');
  if(title)title.after(shortcuts);else content.prepend(shortcuts);
  shortcuts.addEventListener('click',e=>{const b=e.target.closest('[data-menu-jump]');if(b)select(b.dataset.menuJump,{focus:false});});
 }
 let current;
 const select=(id,{focus=false,capture=true}={})=>{
  const section=sections.find(p=>p.id===id)||sections[0];if(!section)return;
  if(capture)memory.capture(doc.getElementById('panel'));
  sections.forEach(p=>p.pane.hidden=p!==section);
  rail.querySelectorAll('[data-menu-section]').forEach(b=>{b.setAttribute('aria-current',b.dataset.menuSection===section.id?'true':'false');});
  shortcuts?.querySelectorAll('[data-menu-jump]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.menuJump===section.id)));
  current=section; prefs[screen]=section.id;save();
  bar.querySelector('.menu-breadcrumb b').textContent=' / '+section.label;
  memory.current='';content.scrollTop=0;
  memory.restore(doc.getElementById('panel'),screen+':'+section.id);
  setMobile(false);
  if(focus){
   if(window.getComputedStyle(rail).display==='none'){section.pane.tabIndex=-1;section.pane.focus({preventScroll:true});}
   else rail.querySelector(`[data-menu-section="${section.id}"]`)?.focus({preventScroll:true});
  }
 };
 rail.addEventListener('click',e=>{
  const branch=e.target.closest('[data-menu-group]');
  if(branch){const wasOpen=branch.getAttribute('aria-expanded')==='true';rail.querySelectorAll('[data-menu-group]').forEach(b=>{const open=b===branch&&!wasOpen;b.setAttribute('aria-expanded',String(open));doc.getElementById(b.getAttribute('aria-controls')).hidden=!open;});return;}
  const leaf=e.target.closest('[data-menu-section]');if(leaf)select(leaf.dataset.menuSection,{focus:true});
 });
 rail.addEventListener('keydown',e=>{
  const b=e.target.closest('button');if(!b||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();
  const visible=[...rail.querySelectorAll('button')].filter(n=>!n.closest('[hidden]'));
  if(e.key==='ArrowLeft'){const branch=b.matches('[data-menu-group]')?b:b.closest('.menu-group').querySelector('[data-menu-group]');if(branch.getAttribute('aria-expanded')==='true')branch.click();branch.focus();}
  else if(e.key==='ArrowRight'){if(b.matches('[data-menu-group]')&&b.getAttribute('aria-expanded')==='false')b.click();else visible[visible.indexOf(b)+1]?.focus();}
  else{const i=e.key==='Home'?0:e.key==='End'?visible.length-1:(visible.indexOf(b)+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;visible[i]?.focus();}
 });
 select(prefs[screen],{capture:false});
 activeTree={shell,back(){if(shell.classList.contains('tree-visible')){setMobile(false);toggle.focus();return true;}if(current&&current!==sections[0]){select(sections[0].id,{focus:true});return true;}return false;}};
 return {sections,restore(){if(current)memory.restore(doc.getElementById('panel'),screen+':'+current.id);}};
}

export function backWithinMenu(panel){return !!(activeTree&&panel?.contains(activeTree.shell)&&activeTree.back());}
