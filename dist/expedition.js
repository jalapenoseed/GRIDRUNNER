// Portable expedition records. No rendering or browser dependencies.
export const SAVE_VERSION=1;
export function pedalStep({battery,stamina,speed,forward,pedaling,road,weight,regen},dt){
 const human=battery<=0||pedaling;
 const effort=human&&forward>0;
 const target=forward>0?(human?(stamina>0?(road?5:3.5)/(1+weight/65):1.2):(road?30:20))*forward:forward<0?-4:0;
 return {target,stamina:Math.max(0,Math.min(100,stamina+dt*(effort?-6*(1+weight/65):9))),human,mode:forward<0&&speed>1&&regen?'REGEN':human?'HUMAN':battery<40?'ASSIST':'FULL'};
}
export function generationStep(mode,{fuel,reserve,daylight,stopped},dt){
 if(!stopped||reserve>=40)return {gain:0,fuelUsed:0};
 const rate=mode==='fuel'&&fuel>0?.65:mode==='solar'&&daylight?.13:0;
 const gain=Math.min(40-reserve,rate*dt,mode==='fuel'?fuel*12:Infinity);
 return {gain,fuelUsed:mode==='fuel'?gain/12:0};
}
export function validateSave(r){
 const bad=()=>{throw Error('This save is incomplete or belongs to another game version.');};
 if(!r||r.version!==SAVE_VERSION||!r.state||!Number.isFinite(r.savedAt))bad();
 const s=r.state,number=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(n=>number(n,-10000,10000));
 if(!vec(s.pos)||!vec(r.bike)||!vec(r.trailer)||!['bike','foot','drone'].includes(s.mode))bad();
 for(const [k,a,b]of [['battery',0,100],['trailer',0,40],['drone',0,100],['hp',0,100],['stamina',0,100],['fuel',0,20],['elapsed',0,1e10],['yaw',-1e10,1e10],['pitch',-2,2],['ammo',0,100000],['ev',0,36],['solarEnergy',0,48],['gridEnergy',0,70],['lineEnergy',0,48]])if(!number(s[k],a,b))bad();
 if(!s.inv||Object.keys(s.inv).length!==4||!['wire','cells','electronics','steel'].every(k=>number(s.inv[k],0,100000)))bad();
 if(s.powerTarget!==null&&!['ev','solar','grid','line'].includes(s.powerTarget))bad();
 if(!number(s.temp,0,1000)||!number(s.chargeHeat,0,200))bad();
 if(!['scout','engineer'].includes(s.droneType)||!['off','fuel','solar'].includes(s.generator))bad();
 for(const k of ['trailerAttached','engineerBuilt','controller','interface','upgrade','solar','relay','met','scanned','won','dead','regenBuilt'])if(typeof s[k]!=='boolean')bad();
 if(!Array.isArray(r.crates)||r.crates.length!==4||r.crates.some(x=>typeof x!=='boolean'))bad();
 if(!Array.isArray(r.enemies)||r.enemies.length!==2||r.enemies.some(e=>!number(e.x,-2000,2000)||!number(e.z,-3000,3000)||!number(e.hp,-100,75)))bad();
 if(s.mode==='drone'&&(!r.origin||!vec(r.origin.pos)||!['bike','foot'].includes(r.origin.mode)||!number(r.origin.yaw,-1e10,1e10)))bad();
 return r;
}
