import * as T from './three.js';
export const THERMAL_PALETTES={ironbow:'Ironbow',spectrum:'Spectrum',whitehot:'White hot',blackhot:'Black hot'};
const STOPS={ironbow:[0x07051b,0x361063,0x962766,0xe66035,0xffc557,0xffffec],spectrum:[0x05052c,0x1239a8,0x11b6dd,0x55d569,0xffe650,0xeb3928,0xfff5f3],whitehot:[0x08090d,0xffffff],blackhot:[0xffffff,0x08090d]};
export function thermalColor(value,palette='ironbow'){const stops=STOPS[palette]||STOPS.ironbow,p=Math.max(0,Math.min(.999999,value))*(stops.length-1),i=Math.floor(p);return new T.Color(stops[i]).lerp(new T.Color(stops[i+1]),p-i);}
function lookup(palette){const data=new Uint8Array(256*4);for(let i=0;i<256;i++){const c=thermalColor(i/255,palette);data.set([c.r*255,c.g*255,c.b*255,255],i*4);}const texture=new T.DataTexture(data,256,1,T.RGBAFormat);texture.minFilter=texture.magFilter=T.LinearFilter;texture.needsUpdate=true;return texture;}
// Authored heat / fluorescence, depth tested against real geometry.
export class Sensors{
 constructor(){this.cold=new WeakMap();this.materials=new Set();this.lookups=Object.fromEntries(Object.keys(THERMAL_PALETTES).map(k=>[k,lookup(k)]));this.palette='ironbow';this.background=new T.Color(0x050614);this.hot=this.material(new T.MeshBasicMaterial(),true);}
 material(source,hot=false,mode='thermal'){
  let variants=this.cold.get(source);if(!variants){variants=new Map();this.cold.set(source,variants);}const key=mode+':'+hot;if(variants.has(key))return variants.get(key);
  const brightness=source.color?source.color.r*.2126+source.color.g*.7152+source.color.b*.0722:.35,heat=hot?.7+brightness*.15:.12+brightness*.22;
  const material=new T.MeshBasicMaterial({color:mode==='uv'?(hot?0x8effdc:0x171329):thermalColor(heat,this.palette),map:source.map,alphaMap:source.alphaMap,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,side:source.side,depthWrite:source.depthWrite,toneMapped:false,fog:false});
  material.userData.sensorHeat=heat;material.userData.sensorMode=mode;material.userData.palette={value:this.lookups[this.palette]};
  if(mode==='thermal')material.onBeforeCompile=shader=>{shader.uniforms.sensorHeat={value:heat};shader.uniforms.sensorPalette=material.userData.palette;shader.vertexShader='varying float vSensorFacing;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSensorFacing = abs(normalize(normalMatrix * normal).z);');shader.fragmentShader='uniform float sensorHeat; uniform sampler2D sensorPalette; varying float vSensorFacing;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat detail = dot(diffuseColor.rgb, vec3(0.2126,0.7152,0.0722));\ndiffuseColor.rgb = texture2D(sensorPalette, vec2(clamp(sensorHeat + (detail - 0.5) * 0.08 + vSensorFacing * 0.08,0.0,1.0),0.5)).rgb;');};
  material.customProgramCacheKey=()=>mode;this.materials.add(material);variants.set(key,material);return material;
 }
 render(renderer,scene,camera,mode,hotRoots=[],composer=null,options={}){
  if(!['thermal','uv'].includes(mode)){if(composer)composer.render();else renderer.render(scene,camera);return;}
  this.palette=THERMAL_PALETTES[options.palette]?options.palette:'ironbow';for(const m of this.materials){m.userData.palette.value=this.lookups[this.palette];if(m.userData.sensorMode==='thermal')m.color.copy(thermalColor(m.userData.sensorHeat,this.palette));}
  const hot=new Set();if(mode==='thermal')for(const root of hotRoots)root?.traverse(o=>{if(o.isMesh)hot.add(o);});
  const changes=[],hidden=[],background=scene.background,fog=scene.fog;scene.background=mode==='thermal'?thermalColor(.05,this.palette):this.background;scene.fog=null;
  try{scene.traverseVisible(o=>{if(!o.isMesh)return;if(o.material?.isShaderMaterial){hidden.push(o);o.visible=false;return;}changes.push([o,o.material]);const fluorescent=o.userData.fluorescent||/fluorescen|UV mark|inspection stripe/i.test(o.name),warm=mode==='uv'?!!fluorescent:hot.has(o);o.material=Array.isArray(o.material)?o.material.map(m=>this.material(m,warm,mode)):this.material(o.material,warm,mode);});renderer.render(scene,camera);}
  finally{for(const [o,m]of changes)o.material=m;for(const o of hidden)o.visible=true;scene.background=background;scene.fog=fog;}
 }
}
export function sensorPaletteControls(palette='ironbow'){return `<details class="settingDetails"><summary>Thermal & UV appearance</summary><label class="settingRow">Thermal palette<select data-setting="thermalPalette">${Object.entries(THERMAL_PALETTES).map(([id,label])=>`<option value="${id}" ${id===palette?'selected':''}>${label}</option>`).join('')}</select></label><p>Thermal maps authored relative heat from cool to warm; it is not a temperature measurement. Spectrum uses blue → cyan → green → yellow → red → white. UV uses a dark violet view with fluorescent inspection paint glowing mint. Solid objects still block both views.</p><button data-nav="flightyard">OPEN SENSOR PRACTICE</button></details>`;}
