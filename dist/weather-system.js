import * as T from './three.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const WEATHER_OPTIONS=[['dusk','Clear / time of day'],['heat','Dry heat'],['night','Moonlit night'],['blackout','Pitch black'],['rain','Rain'],['storm','Heavy rain / wind'],['sandstorm','Sandstorm']];
export function environmentState(settings,elapsed=0){
 const cycle=clamp(Number(settings.dayMinutes)||12,2,60)*60;
 const hour=settings.weather==='blackout'||settings.weather==='night'?0:((Number(settings.sunHour)||0)+(settings.movingSun?elapsed/cycle*24:0))%24;
 const height=Math.sin((hour-6)/24*Math.PI*2),daylight=clamp(height*3,0,1);
 const weather=settings.autoWeather&&!['blackout','night'].includes(settings.weather)?['dusk','rain','storm','rain'][Math.floor(elapsed/120)%4]:settings.weather;
 const rain=weather==='storm'?1:weather==='rain'?.55:0,black=settings.weather==='blackout';
 return {hour,height,daylight,weather,rain,black,wet:rain*.85,wind:weather==='storm'?1:weather==='sandstorm'?.7:.08,nightVision:!!settings.nightVision};
}
export function environmentSettings(s){return `<div class="sectionHeading"><span>OPTICS / ATMOSPHERE</span><b>Live environment</b></div>
 <div class="settingsGrid"><label class="settingRow">Scan labels & overlay<input type="checkbox" data-setting="scanOverlay" ${s.scanOverlay?'checked':''}></label><label class="settingRow">Night vision<input type="checkbox" data-setting="nightVision" ${s.nightVision?'checked':''}></label></div>
 <label class="settingRow">Weather<select data-setting="weather">${WEATHER_OPTIONS.map(([id,label])=>`<option value="${id}" ${s.weather===id?'selected':''}>${label}</option>`).join('')}</select></label>
 <label class="settingRow">Sun time<input type="range" data-setting="sunHour" min="0" max="23.9" step=".1" value="${s.sunHour}"><output>${Number(s.sunHour).toFixed(1)} h</output></label>
 <div class="settingsGrid"><label class="settingRow">Moving sun / day cycle<input type="checkbox" data-setting="movingSun" ${s.movingSun?'checked':''}></label><label class="settingRow">Changing weather<input type="checkbox" data-setting="autoWeather" ${s.autoWeather?'checked':''}></label></div>
 <label class="settingRow">Full day duration<input type="range" data-setting="dayMinutes" min="2" max="60" step="1" value="${s.dayMinutes}"><output>${s.dayMinutes} min</output></label>
 <p class="hint">K hides scan labels without losing discoveries. N toggles night vision. Night and Pitch black lock the sun below the horizon. Pitch black removes ambient light; lamps still work. Pause freezes the day. Controller: View + X scan HUD; View + Y night vision.</p>`;}
export class Atmosphere{
 constructor(scene,renderer,camera,sun,immersion){Object.assign(this,{scene,renderer,camera,sun,immersion});this.hemi=[];scene.traverse(o=>{if(o.isHemisphereLight)this.hemi.push(o);});
  const u=immersion.sky.material.uniforms;u.sunDirection={value:new T.Vector3()};u.sunStrength={value:1};
  immersion.sky.material.fragmentShader=immersion.sky.material.fragmentShader.replace('uniform vec3 top;','uniform vec3 sunDirection;uniform float sunStrength;uniform vec3 top;').replace('normalize(vec3(-.5,.3,-.7))','normalize(sunDirection)').replace('sun*.5','sun*.5*sunStrength');immersion.sky.material.needsUpdate=true;
  const geom=new T.BufferGeometry();this.coords=new Float32Array(420*6);geom.setAttribute('position',new T.BufferAttribute(this.coords,3));this.rain=new T.LineSegments(geom,new T.LineBasicMaterial({color:0x90a9b3,transparent:true,opacity:.2,depthWrite:false}));this.rain.frustumCulled=false;scene.add(this.rain);this.phase=0;this.frame=environmentState({sunHour:17.5});
 }
 update(dt,s,settings,paused){if(!paused)this.phase+=dt;const e=this.frame=environmentState(settings,s.elapsed),nv=e.nightVision,cloud=1-e.rain*.7,dark=e.black?0:e.daylight;
  const sky=this.immersion.sky.material.uniforms,dir=sky.sunDirection.value.set(Math.cos((e.hour-6)/24*Math.PI*2)*.8,e.height,-.6).normalize();sky.sunStrength.value=e.black?0:dark*cloud;
  sky.top.value.setHex(e.black?0x000000:e.weather==='sandstorm'?0x665546:e.rain?0x26353f:0x344e66).multiplyScalar(e.black?0:.06+.94*dark);
  sky.bottom.value.setHex(e.black?0x000000:e.weather==='sandstorm'?0x9a7c5b:e.rain?0x6e8087:e.daylight>.8?0xaebbc0:0xaf7960).multiplyScalar(e.black?0:.055+.945*dark);
  this.scene.fog.color.copy(sky.bottom.value);this.scene.background.copy(this.scene.fog.color);this.scene.fog.density=e.weather==='sandstorm'?.008:e.rain?.003+e.rain*.002:.00135;
  this.sun.intensity=nv?.65:e.black?0:(dark*2.8+.035)*cloud;this.sun.color.setHex(e.height<.2?0xffc299:0xfff0d9);
  const anchor=this.camera.position;this.sun.position.copy(anchor).addScaledVector(dir,220);this.sun.target.position.copy(anchor);this.sun.target.updateMatrixWorld();
  this.hemi.forEach((h,i)=>{h.intensity=nv?(i===0?.8:.2):e.black?0:(i===0?.05+.85*dark:.015+.2*dark)*cloud;});
  this.scene.environmentIntensity=nv?.25:e.black?0:.035+.45*dark*cloud;this.renderer.toneMappingExposure=nv?1.55:1.05;
  this.rain.visible=e.rain>0&&!e.black;const count=settings.graphics==='LOW'?70:settings.graphics==='MEDIUM'?180:420;this.rain.geometry.setDrawRange(0,count*2);
  if(this.rain.visible){for(let i=0;i<count;i++){const x=anchor.x+((i*17.731+this.phase*e.wind*7)%60)-30,y=anchor.y+18-((i*7.13+this.phase*(18+e.rain*10))%36),z=anchor.z+((i*27.29)%60)-30,j=i*6;this.coords.set([x,y,z,x-.15-e.wind*.5,y-1.1-e.rain,z+.1],j);}this.rain.geometry.attributes.position.needsUpdate=true;this.rain.material.opacity=(nv?.4:.1+dark*.2)*e.rain;}
  document.body.classList.toggle('night-vision',nv);document.body.classList.toggle('scan-hidden',!settings.scanOverlay);
 }
}
