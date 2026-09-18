import {SERVICE_DISTRICTS} from './service-district.js';
// Shared authoring bounds. Decorative scatter must respect the full object radius,
// so a clear centre cannot put a tree crown through a wall or an NPC's head.
// These are scenery exclusions, not collision volumes: gameplay paths stay open.
export const SETTLEMENT_LAYOUT=[
 {id:'milepost',name:'MILEPOST 09 / REPAIR',leg:1,x:-115,z:-150,style:'garage'},
 {id:'drywell',name:'DRYWELL / LAST STOP',leg:1,x:115,z:-560,style:'diner'},
 {id:'relaycottages',name:'RELAY WORKERS / VACANT',leg:1,x:-115,z:-1160,style:'homes'},
 {id:'riverward',name:'RIVERWARD / COOPERATIVE',leg:2,x:-120,z:-1890,style:'homes'},
 {id:'pumpworks',name:'PUMP WORKS / SERVICE',leg:2,x:-115,z:-2470,style:'garage'},
 {id:'ferry',name:'FERRY ROAD / SHELTER',leg:2,x:160,z:-2830,style:'diner'},
 {id:'switchyard',name:'SWITCHYARD / MAINTENANCE',leg:3,x:-125,z:-3380,style:'garage'},
 {id:'canteen',name:'NIGHT SHIFT / CANTEEN',leg:3,x:120,z:-3860,style:'diner'},
 {id:'quarters',name:'OPERATOR QUARTERS',leg:3,x:-125,z:-4390,style:'homes'}
];
const rect=(id,x,z,w,d)=>({id,x,z,w,d}); // w/d are HALF extents, in world metres.
export const AUTHORED_FOOTPRINTS=[
 ...SERVICE_DISTRICTS.map(p=>rect(p.id,p.x,p.z-3,18,15)),
 rect('opening-bike',0,24,23,28),
 rect('maintenance-cut',-60,-265,12,78),rect('maintenance-entry',-38,-192,15,10),rect('watch-charger',-24,-352,7,8),
 rect('mara-shelter',54,-100,11,15),rect('mara-workshop',65,-125,17,13),rect('mara-store',107,-148,12,14),
 rect('first-salvage',38,-94,4,4),
 rect('relay-house-and-service-yard',-78,-83,33,32),
 rect('flight-yard',139,66,51,67),
 rect('ev-harvest',-84,-285,13,15),rect('solar-yard',94,-441,31,35),
 rect('substation',153,-764,39,49),rect('substation-salvage',136,-716,5,5),
 rect('relay-tower',8,-1456,28,28),
 rect('cal-camp',46,-1812,17,16),rect('maintenance-note',70,-2260,6,6),
 rect('waterworks',64,-2348,20,23),rect('spillway-channel',117,-2380,27,285),
 rect('service-cache',-35,-2720,6,6),rect('north-archive',8,-3027,25,21),
 ...[[65,-3510],[-55,-3780],[50,-3980],[-35,-4120],[60,-4310],[0,-4590]].map(([x,z],i)=>rect('leg3-facility-'+i,x+10,z-10,29,28)),
 rect('black-start-core',0,-4620,26,14),
 ...SETTLEMENT_LAYOUT.map(p=>rect(p.id,p.x,p.z-1,29,20)),
 // The fieldwork coordinates are a save-game contract. Preserve them and keep
 // decorative geometry outside the interaction / collection area instead.
 ...Array.from({length:144},(_,n)=>{const leg=Math.floor(n/48),i=n%48;return rect('field-'+(leg+1)+'-'+i,(i%2?1:-1)*(18+(i%4)*11),10-leg*1600-i*30,2.6,2.6);})
];
export const AUTHORED_PATHS=[
 ...SERVICE_DISTRICTS.flatMap(p=>[rect(p.id+'-lane',(p.x+p.roadX)/2,p.roadZ,Math.abs(p.x-p.roadX)/2+4,5),rect(p.id+'-forecourt',p.x,(p.roadZ+p.z+8)/2,5,Math.abs(p.roadZ-p.z-8)/2+4)]),
 rect('main-carriageway',0,-2200,14,2500),
 rect('mara-approach',28,-91,28,5),rect('camp-service-road',67,-110,69,6),
 rect('relay-approach',-47,-58,39,5),
 rect('ev-approach',-40,-284,42,5),rect('solar-approach',45,-411,48,6),
 rect('substation-approach',105,-755,108,6),
 ...[-1810,-2340,-2720].map(z=>rect('spillway-access-'+z,30,z,48,5)),
 ...SETTLEMENT_LAYOUT.map(p=>rect(p.id+'-access',p.x/2,p.z+9,Math.abs(p.x)/2+1,4))
];
export function intersectsFootprint(x,z,radius,b){
 return Math.abs(x-b.x)<b.w+radius&&Math.abs(z-b.z)<b.d+radius;
}
export function sceneryAllowed(x,z,radius=0){
 if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(radius)||radius<0)return false;
 return !AUTHORED_FOOTPRINTS.some(b=>intersectsFootprint(x,z,radius,b))&&!AUTHORED_PATHS.some(b=>intersectsFootprint(x,z,radius,b));
}
export function placeScenery(candidate,radius=0,maxAttempts=32){
 for(let i=0;i<maxAttempts;i++){const p=candidate(),r=typeof radius==='function'?radius(p):radius;if(p&&sceneryAllowed(p.x,p.z,r))return p;}
 return null;
}
