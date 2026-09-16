import {transfer} from './survival.js';

export const ROUTE_POINTS=Object.freeze({
 notice:{x:-31,y:1.7,z:-187,title:'Maintenance cut · route board',text:'The carriageway is quick but exposed. Follow the amber posts west into the covered service bay, then south to the stranded EV. WATCH-01 follows its camera, not a magic tracker. Solid walls and roofs break its view.'},
 log:{x:-65,y:1.7,z:-222,title:'Night-shift ledger',text:'“The watcher keeps circling even with the crews gone. Wait under the bay roof until the red lens turns away. It searches where it last saw you, then returns to the marked pad south of the EV. That charger will run dry too.”'},
 repair:{x:-57,y:1.7,z:-251,title:'Service locker · damaged latch',text:'The latch wiring has been stripped. Spend 1 wire and 1 electronics from your backpack to repair it. This opens the supply locker; it does not recharge the bike or disable the watcher.'},
 locker:{x:-62,y:1.7,z:-332,title:'Maintenance supply locker',text:'A sealed shift-replacement kit. Repair the latch panel up the path before collecting. Anything your backpack cannot carry remains here.'}
});
export const ROUTE_STOCK=Object.freeze({cells:1,steel:2,rubber:1,wire:2});
export const createOpeningRoute=()=>({version:1,repaired:false,read:[],stock:{...ROUTE_STOCK}});
export function validateOpeningRoute(raw){
 if(raw===undefined)return createOpeningRoute();
 const bad=()=>{throw Error('Invalid maintenance-route record');};
 if(!raw||raw.version!==1||typeof raw.repaired!=='boolean'||!Array.isArray(raw.read)||raw.read.length>4||new Set(raw.read).size!==raw.read.length||raw.read.some(id=>!Object.hasOwn(ROUTE_POINTS,id))||!raw.stock||Object.keys(raw.stock).length!==Object.keys(ROUTE_STOCK).length)bad();
 for(const [id,max]of Object.entries(ROUTE_STOCK))if(!Number.isInteger(raw.stock[id])||raw.stock[id]<0||raw.stock[id]>max||!raw.repaired&&raw.stock[id]!==max)bad();
 return {version:1,repaired:raw.repaired,read:[...raw.read],stock:{...raw.stock}};
}
export function useOpeningRoute(s,id,{position,capacity=40,enabled=false}={}){
 const point=ROUTE_POINTS[id],route=s.openingRoute;
 if(!enabled||!point||!position||s.mode!=='foot'||Math.hypot(position[0]-point.x,position[1]-point.y,position[2]-point.z)>3.7)return {ok:false,message:'Dismount and approach the maintenance marker on foot.'};
 if(!route.read.includes(id))route.read.push(id);
 if(id==='repair'){
  if(route.repaired)return {ok:true,message:'Latch repaired. The supply locker farther south is open.'};
  if((s.inv.wire||0)<1||(s.inv.electronics||0)<1)return {ok:false,message:'Needs 1 wire and 1 electronics in your backpack.'};
  s.inv.wire--;s.inv.electronics--;route.repaired=true;
  return {ok:true,message:'Latch repaired. Follow the amber posts to the supply locker near the EV.'};
 }
 if(id==='locker'){
  if(!route.repaired)return {ok:false,message:'Locker locked. Repair the panel farther up the service path.'};
  let taken=0;for(const item of Object.keys(ROUTE_STOCK))while(route.stock[item]>0){if(transfer(route.stock,s.inv,item,1,capacity))break;taken++;}
  return {ok:taken>0,message:taken?'Recovered '+taken+' supply items. Untaken items remain in the locker.':Object.values(route.stock).some(n=>n>0)?'Your backpack is full. Supplies remain in the locker.':'The locker is empty.'};
 }
 return {ok:true,message:point.text};
}
export function openingRouteTargets(){return Object.entries(ROUTE_POINTS).map(([id,p])=>({...p,id,kind:'openingRoute',label:p.title}));}
export function openingRoutePanel(route,id){const p=ROUTE_POINTS[id];return `<div class="panelTop"><div><div class="eyebrow">MAINTENANCE CUT / OPTIONAL ROUTE</div><h2>${p.title}</h2></div><button data-back>← Back</button></div><p>${p.text}</p>${id==='repair'?'<p>'+(route.repaired?'LATCH REPAIRED':'Cost: 1 wire + 1 electronics')+'</p><button data-route-use="repair">'+(route.repaired?'CHECK LATCH':'REPAIR LATCH')+'</button>':id==='locker'?'<p>'+Object.entries(route.stock).map(([k,n])=>n+' '+k).join(' · ')+'</p><button data-route-use="locker" '+(!route.repaired?'disabled':'')+'>COLLECT AVAILABLE SUPPLIES</button>':''}`;}
