import * as T from './three.js';

// Quality-gated bloom + FXAA + vignette. Thermal / NV / LOW / MEDIUM keep the
// existing Sensors path. No extra npm runtime; Three r169 WebGLRenderTarget only.
const bright=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const extract=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform float threshold;
void main(){vec4 c=texture2D(tDiffuse,vUv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));
gl_FragColor=vec4(c.rgb*smoothstep(threshold,threshold+.35,l),1.);}`;
const blur=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform vec2 direction;
void main(){vec2 px=direction;vec4 s=texture2D(tDiffuse,vUv)*0.227027;
s+=texture2D(tDiffuse,vUv+px)*0.1945946;s+=texture2D(tDiffuse,vUv-px)*0.1945946;
s+=texture2D(tDiffuse,vUv+px*2.)*0.1216216;s+=texture2D(tDiffuse,vUv-px*2.)*0.1216216;
s+=texture2D(tDiffuse,vUv+px*3.)*0.054054;s+=texture2D(tDiffuse,vUv-px*3.)*0.054054;
gl_FragColor=s;}`;
const composite=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform sampler2D tBloom;uniform float bloom;uniform float vignette;uniform vec2 resolution;
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb+texture2D(tBloom,vUv).rgb*bloom;
vec2 uv=vUv*2.-1.;float v=1.-smoothstep(.35,1.15,dot(uv,uv));c*=mix(1.,v,vignette);
vec2 inv=1./max(resolution,vec2(1.));
float luma=dot(c,vec3(.299,.587,.114));
vec3 n=texture2D(tDiffuse,vUv+vec2(inv.x,0.)).rgb;float edge=abs(luma-dot(n,vec3(.299,.587,.114)));
c=mix(c,(c+n)*.5,smoothstep(.04,.16,edge)*.35);
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

function pass(fragment){
  return new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{tDiffuse:{value:null},tBloom:{value:null},direction:{value:new T.Vector2()},threshold:{value:.72},bloom:{value:.42},vignette:{value:.38},resolution:{value:new T.Vector2(1,1)}},
    vertexShader:bright,fragmentShader:fragment});
}

export class PresenceComposer{
  constructor(renderer,scene,camera){
    this.renderer=renderer;this.scene=scene;this.camera=camera;
    this.enabled=false;this.quality='HIGH';
    this.available=typeof renderer?.setRenderTarget==='function'&&typeof T.WebGLRenderTarget==='function';
    this.quad=null;this.targets=null;
  }
  _boot(w,h){
    if(!this.available||this.targets)return;
    const opts={minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true,type:T.HalfFloatType};
    this.sceneTarget=new T.WebGLRenderTarget(w,h,opts);
    this.brightTarget=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{...opts,depthBuffer:false});
    this.blurTarget=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{...opts,depthBuffer:false});
    this.extract=pass(extract);this.blur=pass(blur);this.compose=pass(composite);
    // Scene targets contain linear HDR. Apply exposure/tone mapping and display
    // conversion exactly once, at the final output (also preserves neon color).
    this.compose.toneMapped=true;
    this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.extract);
    this.quad.frustumCulled=false;
    this.passScene=new T.Scene();this.passScene.add(this.quad);
    this.passCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
    this.targets=true;
  }
  apply(settings={}){
    this.quality=settings.graphics||'HIGH';
    const optics=settings.sensorMode&&settings.sensorMode!=='visible'||settings.nightVision;
    this.enabled=this.available&&['HIGH','ULTRA'].includes(this.quality)&&!optics;
    this.strength=this.quality==='ULTRA'?.58:.38;
  }
  setSize(w,h){
    if(!this.targets)return;
    this.sceneTarget.setSize(w,h);
    this.brightTarget.setSize(Math.max(2,w>>1),Math.max(2,h>>1));
    this.blurTarget.setSize(Math.max(2,w>>1),Math.max(2,h>>1));
  }
  render(){
    const r=this.renderer;
    if(!this.enabled){r.render(this.scene,this.camera);return;}
    const size=r.getDrawingBufferSize?.(new T.Vector2())||r.getSize?.(new T.Vector2())||{x:innerWidth,y:innerHeight};
    this._boot(size.x||innerWidth,size.y||innerHeight);
    if(!this.targets){r.render(this.scene,this.camera);return;}
    if(this.sceneTarget.width!==size.x||this.sceneTarget.height!==size.y)this.setSize(size.x,size.y);
    const prior=r.getRenderTarget?.()??null;
    r.setRenderTarget(this.sceneTarget);r.render(this.scene,this.camera);
    this.quad.material=this.extract;this.extract.uniforms.tDiffuse.value=this.sceneTarget.texture;
    r.setRenderTarget(this.brightTarget);r.render(this.passScene,this.passCamera);
    this.quad.material=this.blur;this.blur.uniforms.tDiffuse.value=this.brightTarget.texture;
    this.blur.uniforms.direction.value.set(1/(this.brightTarget.width||1),0);
    r.setRenderTarget(this.blurTarget);r.render(this.passScene,this.passCamera);
    this.blur.uniforms.tDiffuse.value=this.blurTarget.texture;
    this.blur.uniforms.direction.value.set(0,1/(this.blurTarget.height||1));
    r.setRenderTarget(this.brightTarget);r.render(this.passScene,this.passCamera);
    this.quad.material=this.compose;this.compose.uniforms.tDiffuse.value=this.sceneTarget.texture;
    this.compose.uniforms.tBloom.value=this.brightTarget.texture;
    this.compose.uniforms.bloom.value=this.strength;this.compose.uniforms.vignette.value=.34;
    this.compose.uniforms.resolution.value.set(this.sceneTarget.width,this.sceneTarget.height);
    r.setRenderTarget(prior);r.render(this.passScene,this.passCamera);
  }
}
