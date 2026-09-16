import {ENERGY,mass} from './survival.js';
import {dronePerformance} from './drone-system.js';

export const PACK_WH=120,PACK_KG=1.2,RESERVE_UNIT_WH=ENERGY.unitKWh*1000;
export const PACK_COST={cells:1,wire:2,electronics:1,rubber:1};
export const createBatteryPacks=()=>({serial:0,packs:[]});
export const carriedPack=(s,r)=>s.batteryPacks?.packs.find(p=>p.owner===r.id)||null;
export const packPayload=(s,type)=>s.batteryPacks?.packs.filter(p=>p.owner==='aircraft-'+type+'-01').length*PACK_KG||0;
export const storedPackMass=s=>(s.batteryPacks?.packs.filter(p=>p.owner==='trailer').length||0)*PACK_KG;
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const live=r=>r.task&&['RUNNING','PAUSED'].includes(r.task.state);
export function validateBatteryPacks(s){
 const b=s.batteryPacks??createBatteryPacks();
 if(!Number.isSafeInteger(b.serial)||b.serial<0||b.serial>8||!Array.isArray(b.packs)||b.packs.length!==b.serial)throw Error('Invalid battery pack manifest');
 const ids=new Set(),owners=new Set();
 for(const p of b.packs){
  const n=Number(p.id?.replace('pack-',''));
  if(!Number.isInteger(n)||n<1||n>b.serial||p.id!=='pack-'+n||ids.has(p.id)||p.capacityWh!==PACK_WH||p.massKg!==PACK_KG||!Number.isFinite(p.chargeWh)||p.chargeWh<0||p.chargeWh>PACK_WH||!['trailer','aircraft-engineer-01','aircraft-cargo-01'].includes(p.owner)||p.owner!=='trailer'&&owners.has(p.owner))throw Error('Invalid battery pack ownership or charge');
  ids.add(p.id);owners.add(p.owner);
 }
 for(const r of Object.values(s.squad||{}))if(live(r)&&r.task?.packId&&!b.packs.some(p=>p.id===r.task.packId&&p.owner===r.id))throw Error('Delivery job does not own its pack');
 s.batteryPacks=b;return b;
}
export function buildBatteryPack(s,{near=false,stopped=false}={}){
 const b=s.batteryPacks;
 if(!near||!stopped)return {ok:false,reason:'Stop beside the trailer to assemble a pack.'};
 if(b.serial>=8)return {ok:false,reason:'Eight pack slots already assembled.'};
 if(mass(s.field.storage.trailer)+storedPackMass(s)+PACK_KG>60)return {ok:false,reason:'Trailer cargo is full.'};
 if(Object.entries(PACK_COST).some(([k,n])=>(s.inv[k]||0)<n))return {ok:false,reason:'Needs 1 cell, 2 wire, 1 electronics and 1 rubber in your backpack.'};
 for(const [k,n]of Object.entries(PACK_COST))s.inv[k]-=n;
 b.packs.push({id:'pack-'+(++b.serial),capacityWh:PACK_WH,chargeWh:0,massKg:PACK_KG,owner:'trailer'});
 return {ok:true,reason:'Empty 120 Wh pack assembled in the trailer.'};
}
export function loadBatteryPack(s,r,{near=false,stopped=false,trailerHome=null}={}){
 if(!trailerHome||distance(r.system.pos,trailerHome)>8||!near||!stopped||r.system.mode!=='DOCK'||live(r))return {ok:false,reason:'Dock the aircraft beside the stopped trailer before loading.'};
 if(carriedPack(s,r)||dronePerformance(r.type).payloadKg<PACK_KG)return {ok:false,reason:'A free Utility or Cargo payload mount is required.'};
 const p=s.batteryPacks.packs.filter(p=>p.owner==='trailer').sort((a,b)=>a.chargeWh-b.chargeWh)[0];
 if(!p)return {ok:false,reason:'Assemble a pack in the trailer first.'};
 p.owner=r.id;return {ok:true,reason:p.id.toUpperCase()+' secured to '+r.type+'.'};
}
export function unloadBatteryPack(s,r,{trailerHome,stopped=false,manual=false}={}){
 const p=carriedPack(s,r);
 if(!p||!stopped||distance(r.system.pos,trailerHome)>(manual?8:1)||r.system.speed>.6||manual&&(r.system.mode!=='DOCK'||live(r)))return {ok:false,reason:'Bring the pack to the stopped trailer before unloading.'};
 if(mass(s.field.storage.trailer)+storedPackMass(s)+PACK_KG>60)return {ok:false,reason:'Trailer cargo full; pack remains on aircraft.'};
 p.owner='trailer';const wh=drainStoredPacks(s,p.id);
 return {ok:true,reason:p.id.toUpperCase()+' unloaded / '+wh.toFixed(1)+' Wh delivered; excess remains in pack.'};
}
export function drainStoredPacks(s,id=null){
 let total=0;for(const p of s.batteryPacks.packs){if(p.owner!=='trailer'||id&&p.id!==id)continue;const wh=Math.min(p.chargeWh,Math.max(0,40-s.trailer)*RESERVE_UNIT_WH);s.trailer+=wh/RESERVE_UNIT_WH;p.chargeWh-=wh;total+=wh;}return total;
}
export function preparePackDelivery(r,trailerHome){if(r.task?.packId&&['DELIVER','UNLOAD'].includes(r.task.stage))r.task.deliveryTarget=[...trailerHome];}
