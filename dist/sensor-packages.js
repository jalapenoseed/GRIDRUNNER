import {aircraftType} from './fleet-manifest.js';
// Authored world measurements. Pixel detections remain exclusively in vision-detector.
export const SENSOR_PACKAGES={personal:['visible','night','thermal','uv','rf'],scout:['visible','night','uv','acoustic'],cargo:['visible','depth'],engineer:['visible','thermal','uv','depth'],relay:['visible','rf']};
export const SENSOR_SPECS={
 visible:{name:'RGB survey',range:1,cost:3,kinds:null},night:{name:'Low-light survey',range:.8,cost:4,kinds:null},
 uv:{name:'Ultraviolet / fluorescence',range:.3,cost:3,kinds:['OBJECTIVE','SALVAGE']},
 thermal:{name:'Thermal',range:.7,cost:4,kinds:['HOSTILE','ENERGY']},rf:{name:'EM / RF',range:1.4,cost:5,kinds:['SIGNAL','ENERGY']},
 acoustic:{name:'Acoustic',range:.55,cost:2,kinds:['HOSTILE']},depth:{name:'Range / depth',range:.6,cost:2,kinds:null}
};
export function availableSensors(type='scout'){return SENSOR_PACKAGES[aircraftType(type)]||SENSOR_PACKAGES.scout;}
export function sensorFor(type,mode){return availableSensors(type).includes(mode)?mode:'visible';}
export function nextSensor(type,mode){const modes=availableSensors(type);return modes[(modes.indexOf(mode)+1)%modes.length];}
// Visor and each remote camera retain independent selections across view switches.
export function syncSensorSelection(settings,owner){
 if(!settings.sensorMemory||typeof settings.sensorMemory!=='object'||Array.isArray(settings.sensorMemory))settings.sensorMemory={};
 if(settings.sensorOwner!==owner){
  if(SENSOR_PACKAGES[aircraftType(settings.sensorOwner)])settings.sensorMemory[settings.sensorOwner]=sensorFor(settings.sensorOwner,settings.sensorMode);
  settings.sensorMode=sensorFor(owner,settings.sensorMemory[owner]??settings.sensorMode);
  settings.sensorOwner=owner;
 }
 settings.sensorMode=sensorFor(owner,settings.sensorMode);
 settings.sensorMemory[owner]=settings.sensorMode;
 settings.nightVision=settings.sensorMode==='night';
 return settings.sensorMode;
}
export function sensorReading(mode,entity,distance,radius,blocked=0){
 const confidence=Math.max(.35,Math.min(.97,.97-distance/radius*.4-blocked*.15));
 const reading=entity.readings?.[mode]||(mode==='uv'?'Fluorescent maintenance marking':mode==='depth'?`${distance.toFixed(1)} m range`:mode==='thermal'?(entity.kind==='HOSTILE'?'Warm moving body':'Warm equipment surface'):mode==='rf'?`Emitter strength ${Math.round(100/(1+(distance/80)**2))}%`:mode==='acoustic'?'Rotor / movement sound':mode==='night'?'Low-light silhouette':'Optical classification');
 return {sensor:mode,source:'world-simulation',confidence,reading};
}
export function sensorPanel(type,active='visible'){return `<h3 data-sensor-heading>${{personal:'Personal visor',scout:'Scout',cargo:'Cargo',engineer:'Utility',relay:'Relay'}[aircraftType(type)]||'Scout'} sensor payload</h3><p class="hint">${type==='personal'?'Visor optics work on foot and on the bike. Your visor selection returns after FPV. Aircraft payloads apply while piloting. ':''}Thermal: Utility · RF: Relay · UV: Scout or Utility. Select the matching aircraft above to use its payload.</p><p>B changes sensor · R measures · Y toggles independent pixel detection.</p><div class="commandGrid sensorButtons">${availableSensors(type).map(k=>`<button data-sensor-mode="${k}" aria-pressed="${active===k}">${SENSOR_SPECS[k].name}<small>${type==='personal'?1:SENSOR_SPECS[k].cost} charge / scan</small></button>`).join('')}</div><p class="hint">UV reveals authored fluorescent paint at short range. Thermal and acoustic readings identify authored heat and sound sources. RF detects authored emitters. Try Flight Yard → Sensor / YOLO Lab to compare all three. Depth measures contact distance. These sensors do not reveal puzzle answers or infer hidden items from YOLO.</p>`;}
export function droneLifecycle(d,task){if(d.hp<=0)return 'FAILURE';if(d.mode==='DOCK')return 'DOCKED';if(d.mode==='RETURN HOME'||d.mode==='RELEASE')return 'RETURN';if(d.mode==='LANDED')return 'LANDING';if(task?.state==='RUNNING')return 'TASK';if(d.mode==='MANUAL')return 'PILOT';if(d.mode==='HOLD'||d.mode==='RELAY'||d.mode==='PERCHED')return 'IDLE';if(d.altitude<3)return 'LAUNCH';return d.mode==='FOLLOW'?'FORMATION':d.mode==='ORBIT'?'FORMATION':'FOLLOW';}
export function idleOffset(type,t){const profiles={scout:[.7,.22,.8],cargo:[.12,.06,.3],engineer:[.25,.1,.5],relay:[.15,.3,.2]},[a,h,f]=profiles[type]||profiles.scout;return [Math.sin(t*f)*a,Math.sin(t*f*.7)*h,Math.cos(t*f)*a];}
