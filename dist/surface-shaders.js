import * as T from './three.js';
// World-space textures survive merged geometry without UVs. Uses the project's
// existing material exports, shared samplers and a single weather uniform.
const roads=new Set([0x343c3d,0x484b41,0x353e3e,0x30383c]);
const metals=new Set([0x4e5c57,0x455651,0x455651,0x52615b,0x74887a,0x546d69,0x687d70,0x798c79,0x87928a,0x717f78,0x667d70]);
export class SurfaceMaterials{
 constructor({textures=true}={}){this.textures=textures;this.loaded=false;this.cache=new Map();this.wet={value:0};this.detail={value:0};this.time={value:0};this.records=[];
  const pixel=new T.DataTexture(new Uint8Array([190,190,190,255]),1,1,T.RGBAFormat);pixel.needsUpdate=true;
  this.maps={concrete:{color:{value:pixel},rough:{value:pixel}},metal:{color:{value:pixel},rough:{value:pixel}}};
 }
 material(color){if(this.cache.has(color))return this.cache.get(color);const road=roads.has(color),metal=metals.has(color),m=new T.MeshStandardMaterial({color,roughness:road?.94:metal?.7:.88,metalness:metal?.65:0});m.name='Field surface / '+(road?'asphalt':metal?'galvanized':'mineral')+' / '+color.toString(16);this.decorate(m,{kind:metal?'metal':'concrete',scale:road?.48:.32,weather:road,strength:road?.54:.3,bump:road?.025:.012});this.cache.set(color,m);return m;}
 decorate(material,{kind='concrete',scale=.4,weather=false,strength=.35,bump=.018}={}){
  if(material.userData.fieldSurface)return;material.userData.fieldSurface=true;
  const maps=this.maps[kind],wet=this.wet,detail=this.detail,time=this.time;
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,{fieldAlbedo:maps.color,fieldRoughness:maps.rough,fieldWet:wet,fieldDetail:detail,fieldTime:time});
   shader.vertexShader='varying vec3 fieldPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 fieldLocal=vec4(transformed,1.);
    #ifdef USE_INSTANCING
     fieldLocal=instanceMatrix*fieldLocal;
    #endif
    fieldPosition=(modelMatrix*fieldLocal).xyz;`);
   shader.fragmentShader=`varying vec3 fieldPosition;
    uniform sampler2D fieldAlbedo;uniform sampler2D fieldRoughness;
    uniform float fieldWet;uniform float fieldDetail;uniform float fieldTime;
    float fieldHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float fieldNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(fieldHash(i),fieldHash(i+vec2(1.,0.)),f.x),mix(fieldHash(i+vec2(0.,1.)),fieldHash(i+vec2(1.)),f.x),f.y);}
    vec3 fieldTri(sampler2D tex,vec3 p,vec3 weights){return texture2D(tex,p.yz).rgb*weights.x+texture2D(tex,p.xz).rgb*weights.y+texture2D(tex,p.xy).rgb*weights.z;}
   `+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 fieldWorldNormal=normalize(cross(dFdx(fieldPosition),dFdy(fieldPosition)));
    vec3 fieldWeights=pow(abs(fieldWorldNormal),vec3(4.));fieldWeights/=max(dot(fieldWeights,vec3(1.)),.001);
    float fieldMacro=fieldNoise(fieldPosition.xz*.075);
    float fieldHeight=0.;float fieldSurfaceRough=1.;
    if(fieldDetail>.5){
     vec3 fieldTex=fieldTri(fieldAlbedo,fieldPosition*${scale.toFixed(3)},fieldWeights);
     fieldHeight=dot(fieldTex,vec3(.299,.587,.114));
     fieldSurfaceRough=fieldTri(fieldRoughness,fieldPosition*${scale.toFixed(3)},fieldWeights).g;
     diffuseColor.rgb*=mix(vec3(1.),fieldTex*.7+.55,${strength.toFixed(3)});
    }
    diffuseColor.rgb*=.93+.1*fieldMacro;
    float fieldPuddle=${weather?'fieldWet*fieldWeights.y*smoothstep(.38,.72,fieldMacro)':'0.'};
    diffuseColor.rgb*=1.-fieldPuddle*.21;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor*=mix(1.,.6+fieldSurfaceRough*.4,fieldDetail);
    roughnessFactor=mix(roughnessFactor,.18,fieldPuddle);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    if(fieldDetail>.5){
     float fieldRelief=fieldHeight*${bump.toFixed(4)};
     fieldRelief+=fieldPuddle*.0006*sin(fieldPosition.x*23.+fieldTime*2.7)*sin(fieldPosition.z*29.-fieldTime*3.1);
     vec3 fieldDx=dFdx(-vViewPosition),fieldDy=dFdy(-vViewPosition);
     vec3 fieldR1=cross(fieldDy,normal),fieldR2=cross(normal,fieldDx);
     float fieldDet=dot(fieldDx,fieldR1);
     vec3 fieldGradient=sign(fieldDet)*(dFdx(fieldRelief)*fieldR1+dFdy(fieldRelief)*fieldR2);
     normal=normalize(abs(fieldDet)*normal-fieldGradient);
    }`);
  };
  material.customProgramCacheKey=()=>`field-surface-1:${kind}:${scale}:${weather}:${strength}:${bump}`;material.needsUpdate=true;this.records.push(material);
 }
 load(){if(this.loaded||!this.textures)return;this.loaded=true;const loader=new T.TextureLoader();
  for(const [kind,prefix] of [['concrete','GR_08_damp_concrete'],['metal','GR_07_galvanized']])for(const [key,suffix]of [['color','albedo'],['rough','rough']])loader.load('./assets/drones/textures/'+prefix+'_'+suffix+'.png',t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(key==='color')t.colorSpace=T.SRGBColorSpace;this.maps[kind][key].value=t;},undefined,()=>{});
 }
 update(settings,frame,elapsed=0){const full=settings.graphics!=='LOW';if(full)this.load();this.detail.value=full?1:0;this.wet.value=frame?.wet||0;this.time.value=elapsed;}
}
