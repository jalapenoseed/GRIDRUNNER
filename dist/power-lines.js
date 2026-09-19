// Fictional game circuits. The same sampled spans drive rendering and docking.
export const LINE_SPANS=Object.freeze(Array.from({length:8},(_,i)=>[-13,0,13].map((offset,wire)=>Object.freeze({id:`line-${i}-${wire}`,x:95+offset,z:120-i*210,length:210,height:43,sag:7,circuit:i<3?'south':'north',leg:1}))).flat());
export const LINE_BANK_LIMITS=Object.freeze({south:500,north:1200}); // watt-hours
export const UTILITY_BATTERY_WH=180;
export const LINE_RATE_WH=1.2; // game-time Wh per second, not a hardware rating
export function createLineGrid(){return {version:1,remainingWh:{...LINE_BANK_LIMITS}};}
export function validateLineGrid(value){
 if(value===undefined)return createLineGrid();
 if(!value||value.version!==1||!value.remainingWh||Object.keys(value.remainingWh).some(k=>!Object.hasOwn(LINE_BANK_LIMITS,k)))throw Error('Invalid line energy ledger');
 const grid=createLineGrid();for(const [id,limit] of Object.entries(LINE_BANK_LIMITS)){const n=value.remainingWh[id];if(!Number.isFinite(n)||n<0||n>limit)throw Error('Invalid line reserve');grid.remainingWh[id]=n;}return grid;
}
export const spanById=id=>LINE_SPANS.find(s=>s.id===id);
export function linePoint(span,u){
 if(typeof span==='string')span=spanById(span);
 if(!span||!Number.isFinite(u)||u<0||u>1)return null;
 const a=Math.min(13,Math.floor(u*14)),t=u*14-a;
 const y0=span.height-Math.sin(a/14*Math.PI)*span.sag,y1=span.height-Math.sin((a+1)/14*Math.PI)*span.sag;
 return [span.x,y0+(y1-y0)*t,span.z-span.length*u];
}
export function validLineAnchor(a){return !!a&&!!spanById(a.spanId)&&Number.isFinite(a.u)&&a.u>=.06&&a.u<=.94;}
export function lineBody(a){const p=linePoint(a?.spanId,a?.u);return p?[p[0],p[1]-.35,p[2]]:null;}
export function lineApproach(a){const p=lineBody(a);return p?[p[0]-4,p[1]+2,p[2]]:null;}
export function lineRelease(a){const p=lineBody(a);return p?[p[0]-3,p[1]+2,p[2]]:null;}
export function lineStatus(state,span){
 if(typeof span==='string')span=spanById(span);if(!span)return {live:false,reason:'Unknown conductor',remainingWh:0};
 const remainingWh=state.lineGrid?.remainingWh?.[span.circuit]??0;
 const connected=span.circuit==='south'||state.relay&&state.interface;
 return {live:!!connected&&remainingWh>0,remainingWh,reason:!connected?'DEAD / restore substation relay and coupler':remainingWh<=0?'DEPLETED':'ENERGIZED'};
}
