// Story state is saved with the expedition. Training and pre-v7.37 saves retain their fleet.
export const STORY_IDS=['scout','cargo','engineer','relay','scout-02','scout-03','scout-04','relay-02'];
export const FIELD_STATIONS=[
 {id:'mara',name:'Mara’s camp',leg:1,x:46,z:-86,capacity:180,requires:'met'},
 {id:'relay-house',name:'Relay House',leg:1,x:-66,z:-73,capacity:240,requires:'relayHouse'},
 {id:'cal',name:'Cal’s camp',leg:2,x:35,z:-1800,capacity:180,requires:'calMet'},
 {id:'waterworks',name:'Spillway depot',leg:2,x:49,z:-2330,capacity:360,requires:'hydroRestored'},
 {id:'archive',name:'Technician’s refuge',leg:3,x:-40,z:-3765,capacity:180,requires:'archiveKey'},
 {id:'core',name:'Black Start apron',leg:3,x:26,z:-4568,capacity:480,requires:'leg3Won'}
];
export const REBUILDS=[
 {id:'scout-02',name:'SCOUT-02 / Wayfinder',flag:'met',lesson:'circuit',cost:{steel:2,electronics:1,wire:1},clue:'Mara’s recovered frame; diagnose the board in Field bench.'},
 {id:'scout-03',name:'SCOUT-03 / Creek',flag:'hydroRestored',lesson:'energy',cost:{steel:2,cells:1,wire:1},clue:'Restore the waterworks; size the pack in Field bench.'},
 {id:'scout-04',name:'SCOUT-04 / Lumen',flag:'archiveKey',lesson:'vectors',cost:{steel:2,electronics:2},clue:'Recover the technician’s archive; solve the navigation vector.'},
 {id:'relay-02',name:'RELAY-02 / Chorus',flag:'antennaAligned',lesson:'radio',cost:{steel:2,electronics:2,wire:2},clue:'Align the antenna; tune the practice carrier.'}
];
export const STORY_BEATS=[
 {id:'wake',name:'A voice in the dead grid',speaker:'Charger',when:()=>true,text:'One Scout, one rig, and a radio that should be silent. Start with the bike. Find Mara. The signal changed because somebody is still there.',task:'Mount the bike, recover the first crate, make a Scout flight and meet Mara.'},
 {id:'mara',name:'The things we keep',speaker:'Mara',when:s=>s.met,text:'A fleet is a collection of things you chose to repair. I can give you a Cargo frame. The Relay House west of here has the notebook you need. Leave a charged drone with us when you can.',task:'Explore the Relay House; diagnose a spare Scout at the Field bench.'},
 {id:'carrier',name:'Charger, find me a power source.',speaker:'Charger',when:s=>s.relayHouse?.discovered,text:'Carrier decoded. I can put a utility frame on that line and wait with the batteries. Build the engineer module, bring me into range, and give the word.',task:'Build Utility, then use Field link → Charger → Find me a power source.'},
 {id:'line',name:'A place to come back to',speaker:'Mara',when:s=>s.story?.charger.perched,text:'There. Your first light left out in the world. It stays where you put it. Charge a removable pack, or leave Charger clamped and come back for it.',task:'Fabricate a removable pack at the trailer and complete Harvest & Deliver.'},
 {id:'tower',name:'Beyond the first horizon',speaker:'Charger',when:s=>s.won,text:'The tower is pointing us toward the waterworks. This is a network of people and places. Each restored stop can hold aircraft, energy and a way home.',task:'Continue to The Spillway and meet Cal.'},
 {id:'water',name:'Water remembers',speaker:'Cal',when:s=>s.hydroRestored,text:'We have flow. We have light. Your spare frame is on the bench. Give the swarm a path now; let the river teach you what a changing field looks like.',task:'Rebuild Creek, try a live swarm program, then power the northern relay.'},
 {id:'archive',name:'The network was never empty',speaker:'Mara',when:s=>s.archiveKey,text:'These logs are maintenance reports. The repeating signal was people leaving a route for whoever came next. Bring their work back into the light.',task:'Align the antenna, prime the capacitor and reach the Black Start core.'},
 {id:'return',name:'All the lights we carried',speaker:'Charger',when:s=>s.leg3Won,text:'We spent the whole journey finding enough power to leave. Now we can spend some just to be here. Bring the fleet you kept alive. Draw something worth looking up for.',task:'Recall your stationed fleet, open the Finale, and fly your own show.'}
];
export const BENCH_LESSONS=[
 {id:'circuit',name:'Repair / diagnose the board',requires:'met',question:'The practice board applies 12 V across a 6 Ω resistor. Enter the expected current in amperes.',answer:2,unit:'A',hint:'Ohm’s law: I = V / R. Divide 12 by 6.',explain:'2 A is the expected current for this ohmic load. Compare a measured value to the expected one before replacing a component. A real circuit may include non-ohmic parts.',source:'https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits'},
 {id:'energy',name:'Energy / size the mission pack',requires:'met',question:'A nominal 24 V, 5 Ah pack stores approximately how many watt-hours?',answer:120,unit:'Wh',hint:'Energy estimate = nominal volts × ampere-hours. Mission reserve comes out of that total.',explain:'24 × 5 = 120 Wh nominal. Usable energy is lower once discharge limits, conversion losses and reserve are included.',source:'https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy'},
 {id:'radio',name:'Radio / tune an authorized beacon',requires:'relayHouse',question:'Your own test beacon is centered at 147.20 MHz. The receiver reads 147.05 MHz. How many kHz upward reaches the beacon?',answer:150,unit:'kHz',hint:'Subtract the MHz values, then multiply by 1,000.',explain:'0.15 MHz = 150 kHz. This isolated field-tool exercise changes only your own in-game beacon; it does not transmit to real equipment.',source:'https://www.nist.gov/pml/owm/metric-si-prefixes'},
 {id:'vectors',name:'Navigation / recover the bearing',requires:'hydroRestored',question:'A waypoint lies 30 m east and 40 m north. What is the horizontal straight-line distance?',answer:50,unit:'m',hint:'Distance = √(30² + 40²). The vector direction is separate from its length.',explain:'The displacement has length 50 m. Fleet navigation uses vectors for direction and separation; the later field editor adds time-varying influences.',source:'https://openstax.org/books/college-physics-2e/pages/3-2-vector-addition-and-subtraction-graphical-methods'},
 {id:'chemistry',name:'Chemistry / what carries charge?',requires:'met',question:'Count the types of moving charge carrier in this model: electrons in the external wire, and ions in the electrolyte.',answer:2,unit:'types',hint:'One kind moves through the external circuit; another moves through the electrolyte.',explain:'Electrons move through the external circuit while ions move through the electrolyte. Rechargeable batteries store energy chemically; cycling can change their materials.',source:'https://www.energy.gov/science/doe-explainsbatteries'},
 {id:'history',name:'Archive / the first motor',requires:'relayHouse',question:'Faraday demonstrated electromagnetic rotation in 1821. The surviving Royal Institution apparatus was made the following year. Enter its year.',answer:1822,unit:'year',hint:'The demonstration and the surviving object have different dates: 1821 + 1.',explain:'Faraday’s 1821 work showed continuous electromagnetic rotation. The Royal Institution preserves an apparatus he made in 1822. Historical records distinguish an experiment from the surviving object.',source:'https://www.rigb.org/explore-science/explore/collection/michael-faradays-electric-magnetic-rotation-apparatus-motor'}
];
const clone=v=>JSON.parse(JSON.stringify(v));
export function createStoryCampaign(mode='legacy'){return {version:1,mode,owned:mode==='story'?['scout']:STORY_IDS.filter(id=>!['cargo','engineer'].includes(id)),rebuilt:[],read:[],lessons:[],stations:{},reserves:Object.fromEntries(FIELD_STATIONS.map(p=>[p.id,p.capacity])),charger:{stage:'idle',perched:false,delivered:false,source:null},finale:{runs:0,participants:[],active:false}};}
export function storyFlag(s,key){return key==='relayHouse'?!!s.relayHouse?.discovered:!!s[key];}
export function syncStoryCampaign(s){
 s.story ||= createStoryCampaign();const c=s.story;
 if((s.met||(s.leg||1)>1)&&!c.owned.includes('cargo'))c.owned.push('cargo');
 if(s.engineerBuilt&&!c.owned.includes('engineer'))c.owned.push('engineer');
 if((s.relayHouse?.discovered||(s.leg||1)>1)&&!c.owned.includes('relay'))c.owned.push('relay');
 return c;
}
export function storyOwns(s,id){return s.story?.mode!=='story'||syncStoryCampaign(s).owned.includes(id);}
export function storyCapability(s,key){if(s.story?.mode!=='story')return true;return ({formations:!!s.met,survey:!!s.relayHouse?.discovered||(s.leg||1)>1,program:!!s.hydroRestored||!!s.leg2Won||s.leg===3,finale:!!s.leg3Won})[key]??true;}
export function storyStation(s,id){return s.story?.stations?.[id]||null;}
export function storyCurrent(s){return [...STORY_BEATS].reverse().find(b=>b.when(s))||STORY_BEATS[0];}
export function solveBench(s,id,value){const lesson=BENCH_LESSONS.find(l=>l.id===id);if(!lesson||!storyFlag(s,lesson.requires))return {ok:false,reason:'Recover this lesson in the field first.'};if(String(value).trim()===''||!Number.isFinite(Number(value))||Math.abs(Number(value)-lesson.answer)>.001)return {ok:false,reason:'Reading does not match. '+lesson.hint};const c=syncStoryCampaign(s);if(!c.lessons.includes(id))c.lessons.push(id);return {ok:true,reason:lesson.explain};}
export function rebuildStoryFrame(s,id,{near=false}={}){const c=syncStoryCampaign(s),r=REBUILDS.find(r=>r.id===id);if(!r||c.owned.includes(id))return {ok:false,reason:'This airframe is already in your fleet.'};if(!near)return {ok:false,reason:'Stop beside your trailer or an unlocked field station.'};if(!storyFlag(s,r.flag)||!c.lessons.includes(r.lesson))return {ok:false,reason:r.clue};if(Object.entries(r.cost).some(([k,n])=>(s.inv[k]||0)<n))return {ok:false,reason:'Recover the listed parts first.'};for(const [k,n]of Object.entries(r.cost))s.inv[k]-=n;c.owned.push(id);c.rebuilt.push(id);return {ok:true,reason:r.name+' rebuilt. Its own battery, hull and history now travel with your save.'};}
export function finaleRoster(s){const c=syncStoryCampaign(s);return STORY_IDS.filter(id=>c.owned.includes(id)&&!storyStation(s,id)&&s.squad?.[id]?.system.hp>=30&&s.squad[id].battery>=20&&!s.squad[id].task?.state?.match(/^(RUNNING|PAUSED)$/));}
export function validateStoryCampaign(value){
 if(value===undefined)return createStoryCampaign();
 const v=clone(value),bad=()=>{throw Error('Invalid story campaign record');};
 if(!v||v.version!==1||!['story','legacy'].includes(v.mode))bad();
 for(const [key,allowed]of [['owned',STORY_IDS],['rebuilt',REBUILDS.map(r=>r.id)],['read',STORY_BEATS.map(b=>b.id)],['lessons',BENCH_LESSONS.map(l=>l.id)]])if(!Array.isArray(v[key])||v[key].length>allowed.length||new Set(v[key]).size!==v[key].length||v[key].some(id=>!allowed.includes(id)))bad();
 if(!v.owned.includes('scout')||v.rebuilt.some(id=>!v.owned.includes(id)))bad();
 if(!v.stations||typeof v.stations!=='object'||Array.isArray(v.stations)||Object.keys(v.stations).some(id=>!STORY_IDS.includes(id)||!v.owned.includes(id)))bad();
 for(const [id,p] of Object.entries(v.stations)){if(!p||!['site','line'].includes(p.kind)||![1,2,3].includes(p.leg)||!Array.isArray(p.pos)||p.pos.length!==3||!p.pos.every(n=>Number.isFinite(n)&&Math.abs(n)<10000)||typeof p.name!=='string'||p.name.length>100)bad();if(p.kind==='site'&&!FIELD_STATIONS.some(t=>t.id===p.site&&t.leg===p.leg&&Math.hypot(p.pos[0]-t.x,p.pos[2]-t.z)<13))bad();if(p.kind==='line'&&(id!=='engineer'||p.leg!==1||!/^line-[0-7]-[0-2]$/.test(p.spanId)))bad();}
 if(!v.reserves||typeof v.reserves!=='object')bad();for(const p of FIELD_STATIONS)if(!Number.isFinite(v.reserves[p.id])||v.reserves[p.id]<0||v.reserves[p.id]>p.capacity)bad();
 if(!v.charger||!['idle','searching','identified','approach','perched','charging','staged','delivering','complete','interrupted'].includes(v.charger.stage)||typeof v.charger.perched!=='boolean'||typeof v.charger.delivered!=='boolean'||!(v.charger.source===null||typeof v.charger.source==='string'&&v.charger.source.length<100))bad();
 if(!v.finale||!Number.isSafeInteger(v.finale.runs)||v.finale.runs<0||typeof v.finale.active!=='boolean'||!Array.isArray(v.finale.participants)||v.finale.participants.length>8||v.finale.participants.some(id=>!v.owned.includes(id)))bad();
 v.finale.active=false;return v;
}
export function validateStoryStations(s){
 for(const [id,p]of Object.entries(s.story.stations)){
  const r=s.squad[id];
  if(!r||r.system.mode!=='LANDED'||['RUNNING','PAUSED'].includes(r.task?.state)||r.system.pos.some((n,i)=>Math.abs(n-p.pos[i])>.01))throw Error('Stationed aircraft does not match its saved location');
 }
}
