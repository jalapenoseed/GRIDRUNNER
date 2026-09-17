import {storyOwns,syncStoryCampaign} from './story-campaign.js';
import {transfer} from './survival.js';
export const STORY_SIGNALS=[
 {id:'story-uv',title:'The maintenance trail',name:'Fluorescent cache seal',kind:'SALVAGE',sensor:'uv',leg:1,x:-42,z:-253,y:.5,samples:1,clue:'Old service paint west of the highway, beyond the maintenance bypass.',text:'The UV seal matches the Relay House maintenance mark. Someone stocked this box for the next rider.',items:{wire:2,electronics:2,steel:2}},
 {id:'story-thermal',title:'Warmth in the wreckage',name:'Warm backup controller',kind:'ENERGY',sensor:'thermal',leg:1,x:-70,z:-320,y:1,samples:1,clue:'The ground west of the road, just beyond the stranded EV. Switch your personal visor to thermal.',text:'A small backup controller was still regulating its load. The warmth was evidence of operation, not proof of unlimited energy.',items:{cells:2,rubber:2,electronics:1}},
 {id:'story-rf',title:'A voice with no speaker',name:'Hidden maintenance beacon',kind:'SIGNAL',sensor:'rf',leg:1,x:55,z:-495,y:1.4,samples:3,clue:'A weak carrier near the solar yard. Sample it from three positions at least 12 m apart.',text:'Three separated observations narrowed the search. The beacon belonged to the same maintenance network that rerouted the tower.',items:{wire:2,electronics:3,steel:2}}
];
export function createStoryDiscoveries(){return {version:1,signals:Object.fromEntries(STORY_SIGNALS.map(p=>[p.id,{samples:[],opened:false,items:{...p.items}}])),log:[],nextSample:0};}
export function storyScanContacts(s){return STORY_SIGNALS.filter(p=>p.leg===s.leg).map(p=>({...p,sensors:[p.sensor],readings:{[p.sensor]:p.name+' / '+p.title}}));}
export function recordStoryScans(s,tags,origin){
 const d=s.storyDiscoveries||=createStoryDiscoveries(),messages=[];
 for(const p of STORY_SIGNALS){const record=d.signals[p.id];if(record.samples.length>=p.samples||!tags.some(t=>t.id===p.id&&t.sensor===p.sensor))continue;
  if(record.samples.some(a=>Math.hypot(a[0]-origin[0],a[2]-origin[2])<12))continue;
  record.samples.push(origin.map(n=>Math.round(n*100)/100));messages.push(p.title+' · '+record.samples.length+'/'+p.samples+' readings'+(record.samples.length===p.samples?' · cache located':''));
 }return messages;
}
export function collectStoryCache(s,id,{position,capacity=40}={}){
 const p=STORY_SIGNALS.find(p=>p.id===id),d=s.storyDiscoveries||=createStoryDiscoveries(),r=d.signals[id];
 if(!p||p.leg!==s.leg||s.mode==='drone'||Math.hypot(position[0]-p.x,position[2]-p.z)>5)return {ok:false,reason:'Walk within 5 m of the recovered signal.'};
 if(r.samples.length<p.samples)return {ok:false,reason:p.sensor==='rf'?'Take three RF readings from separate positions first.':'Scan with '+p.sensor.toUpperCase()+' to identify the latch.'};
 let count=0;for(const [key,n]of Object.entries(r.items))for(let i=0;i<n;i++){const error=transfer(r.items,s.inv,key,1,capacity);if(error)break;count++;}
 r.opened=true;return {ok:true,reason:count?count+' parts recovered. '+p.text:Object.values(r.items).some(n=>n>0)?'Pack full. Remaining parts stay in this cache.':'Cache empty. The record remains in Field discoveries.'};
}
export function advanceStoryLog(s){
 const d=s.storyDiscoveries||=createStoryDiscoveries();if(s.elapsed<d.nextSample)return;d.nextSample=s.elapsed+2;
 syncStoryCampaign(s);const fleet=Object.entries(s.squad||{}).filter(([id,r])=>storyOwns(s,id)&&r.system.mode!=='DOCK'&&(!s.story.stations[id]||s.story.stations[id].leg===s.leg));
 if(!fleet.length)return;
 d.log.push({at:Math.round(s.elapsed),leg:s.leg,aircraft:fleet.map(([id,r])=>({id,x:Math.round(r.system.pos[0]*10)/10,y:Math.round(r.system.pos[1]*10)/10,z:Math.round(r.system.pos[2]*10)/10,battery:Math.round(r.battery),hull:Math.round(r.system.hp),mode:r.system.mode}))});
 if(d.log.length>120)d.log.shift();
}
export function validateStoryDiscoveries(value){
 if(value===undefined)return createStoryDiscoveries();const d=JSON.parse(JSON.stringify(value)),bad=()=>{throw Error('Invalid field discovery record');};
 if(!d||d.version!==1||!d.signals||!Array.isArray(d.log)||d.log.length>120||!Number.isFinite(d.nextSample)||d.nextSample<0)bad();
 for(const p of STORY_SIGNALS){const r=d.signals[p.id];if(!r||!Array.isArray(r.samples)||r.samples.length>p.samples||r.samples.some(v=>!Array.isArray(v)||v.length!==3||!v.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000))||typeof r.opened!=='boolean'||!r.items||Object.keys(r.items).some(k=>!Object.hasOwn(p.items,k)))bad();for(const [k,n]of Object.entries(p.items))if(!Number.isInteger(r.items[k]??0)||(r.items[k]??0)<0||(r.items[k]??0)>n)bad();if(r.opened&&r.samples.length<p.samples)bad();}
 const ids=['scout','cargo','engineer','relay','scout-02','scout-03','scout-04','relay-02'];
 for(const p of d.log){if(!p||!Number.isFinite(p.at)||p.at<0||![1,2,3].includes(p.leg)||!Array.isArray(p.aircraft)||p.aircraft.length<1||p.aircraft.length>8||new Set(p.aircraft.map(a=>a.id)).size!==p.aircraft.length)bad();for(const a of p.aircraft)if(!ids.includes(a.id)||![a.x,a.y,a.z].every(n=>Number.isFinite(n)&&Math.abs(n)<=10000)||![a.battery,a.hull].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||!['DOCK','MANUAL','FOLLOW','HOLD','ORBIT','SCOUT AHEAD','RETURN HOME','LANDED','RELAY','PERCHED','RELEASE'].includes(a.mode))bad();}
 return d;
}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderStoryDiscoveries(s){
 const d=s.storyDiscoveries||=createStoryDiscoveries();return `<div class="panelTop"><div><div class="eyebrow">SENSOR EVIDENCE / FIELD RECOVERY</div><h2>Look again.</h2></div></div><p class="lead">The same road carries three different trails. Change your sensor, scan, then recover what you find.</p><div class="signalMissions">${STORY_SIGNALS.map(p=>{const r=d.signals[p.id],ready=r.samples.length>=p.samples;return `<article><span class="eyebrow">${p.sensor.toUpperCase()} / ${r.opened?'RECOVERED':ready?'LOCATED':'SEARCHING'}</span><h3>${esc(p.title)}</h3><p>${esc(r.opened?p.text:p.clue)}</p><p>${r.samples.length} / ${p.samples} observations · ${ready?p.x+' E / '+Math.abs(p.z)+' N':'exact location not yet resolved'}</p><small>${Object.entries(r.items).filter(([,n])=>n).map(([k,n])=>n+' '+k).join(' · ')||'All parts recovered'}</small><button data-story-cache="${p.id}" ${ready?'':'disabled'}>RECOVER CACHE / ON FOOT</button></article>`;}).join('')}</div><p class="hint">B cycles supported sensors; R takes a reading. Thermal is also available on your personal visor. RF observations require movement; repeated scans at one position do not count. Cache contents and evidence stay in your save.</p>`;
}
export function renderStoryLog(s,index=-1){
 const log=s.storyDiscoveries?.log||[],i=index<0?log.length-1:Math.max(0,Math.min(log.length-1,index)),frame=log[i];
 if(!frame)return '<section class="storyLog"><h3>Fleet flight recorder</h3><p>Launch a drone to record its route. Up to 120 samples are retained with your expedition.</p></section>';
 const points=log.slice(0,i+1).filter(p=>p.leg===frame.leg),all=points.flatMap(p=>p.aircraft),xs=all.map(a=>a.x),zs=all.map(a=>a.z),minX=Math.min(...xs)-16,minZ=Math.min(...zs)-16,width=Math.max(80,Math.max(...xs)-minX+16),depth=Math.max(80,Math.max(...zs)-minZ+16),scale=Math.min(580/width,240/depth),px=x=>30+(x-minX)*scale,pz=z=>25+(z-minZ)*scale;
 const colors=['#89ecd7','#ffc473','#a9db72','#dfa6ff','#8ac4ff','#ffadbe','#faf5cb','#b6b9ff'];
 return `<section class="storyLog"><h3>Fleet flight recorder</h3><p>Sector ${frame.leg} · ${frame.at}s elapsed · Recorded positions</p><svg viewBox="0 0 640 300" role="img" aria-label="Recorded fleet paths, north at the top">${frame.aircraft.map((a,n)=>`<polyline points="${points.flatMap(p=>p.aircraft.filter(v=>v.id===a.id).map(v=>px(v.x).toFixed(1)+','+pz(v.z).toFixed(1))).join(' ')}" fill="none" stroke="${colors[n]}" stroke-width="2" opacity=".65"/><circle cx="${px(a.x)}" cy="${pz(a.z)}" r="5" fill="${colors[n]}"/>`).join('')}<text x="605" y="20" fill="#bbd9d9" font-size="14">N ↑</text></svg><label>Replay sample <input data-story-replay type="range" min="0" max="${log.length-1}" value="${i}" aria-label="Replay fleet flight log"></label><div class="flightLogReadout">${frame.aircraft.map((a,n)=>`<span style="border-left:3px solid ${colors[n]}">${esc(a.id.toUpperCase())} · ${a.battery}% · ${a.y.toFixed(1)} m · ${esc(a.mode)}</span>`).join('')}</div><p class="hint">Scrubbing the recorder does not move aircraft or rewind the expedition. Samples are recorded every two seconds while aircraft are deployed, up to four minutes of continuous activity.</p></section>`;
}
