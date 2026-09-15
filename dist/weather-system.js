import * as T from './three.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const WEATHER_OPTIONS=[['dusk','Clear daylight'],['heat','Dry heat'],['night','Moonlit night'],['blackout','Pitch black'],['rain','Rain'],['storm','Heavy rain / wind'],['sandstorm','Sandstorm']];
export function environmentState(settings,elapsed=0){
 const cycle=clamp(Number(settings.dayMinutes)||12,2,60)*60;
 const input=Number(settings.sunHour),start=settings.sunHour!==null&&settings.sunHour!==''&&Number.isFinite(input)?input:13.5;
 const hour=settings.weather==='blackout'||settings.weather==='night'?0:((start+(settings.movingSun?elapsed/cycle*24:0))%24+24)%24;
 const height=Math.sin((hour-6)/24*Math.PI*2),daylight=clamp(height*3,0,1);
 const weather=settings.autoWeather&&!['blackout','night'].includes(settings.weather)?['dusk','rain','storm','rain'][Math.floor(elapsed/120)%4]:settings.weather;
 const rain=weather==='storm'?1:weather==='rain'?.55:0,black=settings.weather==='blackout';
 return {hour,height,daylight,weather,rain,black,wet:rain*.85,wind:weather==='storm'?1:weather==='sandstorm'?.7:.08,nightVision:!!settings.nightVision};
}
// Direct sun may fade under clouds; diffuse sky/ground fill must remain readable.
// Keeping these separate also preserves true blackout and deliberate moonlight.
export function environmentLighting(e){
 if(e.nightVision)return {sun:.8,sky:1.25,bounce:.36,environment:.55,exposure:1.45};
 if(e.black)return {sun:0,sky:0,bounce:0,environment:0,exposure:1.12};
 const fill=T.MathUtils.smoothstep(e.height,-.1,.32),diffuse=1-e.rain*.12;
 return {sun:(.04+e.daylight*3.15)*(1-e.rain*.72),sky:(.07+fill*1.65)*diffuse,
  bounce:(.025+fill*.45)*diffuse,environment:(.045+fill*.95)*(1-e.rain*.16),exposure:1.12+fill*.08};
}
export function environmentSettings(s){return `<div class="sectionHeading"><span>LIGHT & WEATHER</span><b>World settings</b></div>
 <div class="settingsGrid"><label class="settingRow">Scan labels & overlay<input type="checkbox" data-setting="scanOverlay" ${s.scanOverlay?'checked':''}></label><label class="settingRow">Night vision<input type="checkbox" data-setting="nightVision" ${s.nightVision?'checked':''}></label></div>
 <label class="settingRow">Weather<select data-setting="weather">${WEATHER_OPTIONS.map(([id,label])=>`<option value="${id}" ${s.weather===id?'selected':''}>${label}</option>`).join('')}</select></label>
 <label class="settingRow">Sun time<input type="range" data-setting="sunHour" min="0" max="23.9" step=".1" value="${s.sunHour}"><output>${Number(s.sunHour).toFixed(1)} h</output></label>
 <div class="settingsGrid"><label class="settingRow">Moving sun / day cycle<input type="checkbox" data-setting="movingSun" ${s.movingSun?'checked':''}></label><label class="settingRow">Changing weather<input type="checkbox" data-setting="autoWeather" ${s.autoWeather?'checked':''}></label></div>
 <label class="settingRow">Full day duration<input type="range" data-setting="dayMinutes" min="2" max="60" step="1" value="${s.dayMinutes}"><output>${s.dayMinutes} min</output></label>
 <p class="hint">K hides scan labels without losing discoveries. N toggles night vision. Night and Pitch black lock the sun below the horizon. Pitch black removes ambient light; lamps still work. Pause freezes the day. Controller: View + X scan HUD; View + Y night vision.</p>`;}
export class Atmosphere{
 constructor(scene,renderer,camera,sun,immersion){Object.assign(this,{scene,renderer,camera,sun,immersion});this.hemi=[];scene.traverse(o=>{if(o.isHemisphereLight)this.hemi.push(o);});
  this.keyDirection=new T.Vector3();this.twilightColor=new T.Color(0xeeb796);
  const geom=new T.BufferGeometry();this.coords=new Float32Array(420*6);geom.setAttribute('position',new T.BufferAttribute(this.coords,3));this.rain=new T.LineSegments(geom,new T.LineBasicMaterial({color:0x90a9b3,transparent:true,opacity:.2,depthWrite:false}));this.rain.frustumCulled=false;scene.add(this.rain);this.phase=0;this.frame=environmentState({sunHour:13.5});
 }
 update(dt,s,settings,paused){
  if(!paused)this.phase+=dt;
  const e=this.frame=environmentState(settings,s.elapsed),nv=e.nightVision,light=environmentLighting(e),dark=e.black?0:e.daylight;
  const sky=this.immersion.sky.material.uniforms,dir=sky.sunDirection.value.set(Math.cos((e.hour-6)/24*Math.PI*2)*.8,e.height,-.6).normalize();
  const fill=e.black?0:T.MathUtils.smoothstep(e.height,-.1,.32),twilight=(1-dark)*fill;
  sky.sunStrength.value=e.black?0:dark*(1-e.rain*.8);
  sky.sunColor.value.setHex(e.height<.25?0xffd2a0:0xfff2dc);
  sky.top.value.setHex(e.black?0x000000:e.weather==='sandstorm'?0x9b8c75:e.rain?0x829baa:0x659bc5).multiplyScalar(e.black?0:.016+.984*fill);
  sky.bottom.value.setHex(e.black?0x000000:e.weather==='sandstorm'?0xcebb95:e.rain?0xbfced1:0xdce5e3).lerp(this.twilightColor,twilight*.65).multiplyScalar(e.black?0:.012+.988*fill);
  sky.cloudCover.value=e.black||settings.graphics==='LOW'?0:(.17+e.rain*.68)*fill;
  sky.cloudLight.value=fill*(1-e.rain*.35);sky.time.value=this.phase;
  this.scene.fog.color.copy(sky.bottom.value);this.scene.background.copy(this.scene.fog.color);
  this.scene.fog.density=e.weather==='sandstorm'?.008:e.rain?.0033+e.rain*.0019:e.black?.0028:.0028;
  this.sun.intensity=light.sun;this.sun.color.setHex(e.height<=0?0xc2d5f2:e.height<.2?0xffd0a6:0xfff3df);
  // The moon/intensifier illuminates from above when the actual sun is below ground.
  this.keyDirection.copy(dir);if(e.height<=0)this.keyDirection.set(.45,.7,-.55).normalize();
  const anchor=this.camera.position;this.sun.position.copy(anchor).addScaledVector(this.keyDirection,220);this.sun.target.position.copy(anchor);this.sun.target.updateMatrixWorld();
  this.hemi.forEach((h,i)=>{h.intensity=i===0?light.sky:light.bounce;h.color.setHex(e.height<=0?0xa5bdd8:e.rain?0xd6e1e5:0xdcecff);h.groundColor.setHex(e.height<=0?0x5c6774:0xaaa393);});
  this.scene.environmentIntensity=light.environment;this.renderer.toneMappingExposure=light.exposure;
  this.rain.visible=e.rain>0&&!e.black;const count=settings.graphics==='LOW'?70:settings.graphics==='MEDIUM'?180:420;this.rain.geometry.setDrawRange(0,count*2);
  if(this.rain.visible){for(let i=0;i<count;i++){const x=anchor.x+((i*17.731+this.phase*e.wind*7)%60)-30,y=anchor.y+18-((i*7.13+this.phase*(18+e.rain*10))%36),z=anchor.z+((i*27.29)%60)-30,j=i*6;this.coords.set([x,y,z,x-.15-e.wind*.5,y-1.1-e.rain,z+.1],j);}this.rain.geometry.attributes.position.needsUpdate=true;this.rain.material.opacity=(nv?.4:.1+dark*.2)*e.rain;}
  document.body.classList.toggle('night-vision',nv);document.body.classList.toggle('scan-hidden',!settings.scanOverlay);
 }
}
