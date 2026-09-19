import * as T from './three.js';

// Quality-gated bloom + FXAA + vignette + half-res contact AO.
// N8AO 2.0.1 is r169-legal but not vendored: it replaces RenderPass, requires
// three/examples Pass, and its fog compositor uses world-space camera distance
// (issue #54) which erases AO after leaving the opening compound. This pass
// samples view-space depth instead so FogExp2 still fades contact shadows.
const bright=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const extract=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform float threshold;
void main(){vec4 c=texture2D(tDiffuse,vUv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));
gl_FragColor=vec4(c.rgb*smoothstep(threshold,threshold+.35,l),1.);}`;
const blur=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform vec2 direction;
void main(){vec2 px=direction;vec4 s=texture2D(tDiffuse,vUv)*0.227027;
s+=texture2D(tDiffuse,vUv+px)*0.1945946;s+=texture2D(tDiffuse,vUv-px)*0.1945946;
s+=texture2D(tDiffuse,vUv+px*2.)*0.1216216;s+=texture2D(tDiffuse,vUv-px*2.)*0.1216216;
s+=texture2D(tDiffuse,vUv+px*3.)*0.054054;s+=texture2D(tDiffuse,vUv-px*3.)*0.054054;
s+=texture2D(tDiffuse,vUv+px*4.)*0.016216;s+=texture2D(tDiffuse,vUv-px*4.)*0.016216;
gl_FragColor=s;}`;
const ao=`varying vec2 vUv;uniform sampler2D tDepth;uniform mat4 projectionInverse;uniform vec2 resolution;
uniform float radius;uniform float intensity;uniform float bias;uniform float fogDensity;
vec3 viewPos(vec2 uv){float d=texture2D(tDepth,uv).x;vec4 clip=vec4(uv*2.-1.,d*2.-1.,1.);vec4 view=projectionInverse*clip;return view.xyz/view.w;}
void main(){float depth=texture2D(tDepth,vUv).x;if(depth>0.999){gl_FragColor=vec4(1.);return;}
vec3 origin=viewPos(vUv);vec3 normal=normalize(cross(dFdx(origin),dFdy(origin)));
float occ=0.;const int N=8;for(int i=0;i<N;i++){float fi=float(i);float a=fi*2.399963;float r=(fi+.5)/float(N);
vec2 offset=vec2(cos(a),sin(a))*r;float scale=radius/max(-origin.z,.2);vec2 uv=vUv+offset*scale*vec2(resolution.y/max(resolution.x,1.),1.)*.45;
uv=clamp(uv,0.,1.);vec3 samplePos=viewPos(uv);vec3 dir=samplePos-origin;float dist=length(dir);
float atten=1.-smoothstep(0.,radius,dist);occ+=atten*max(0.,dot(normal,dir/(dist+.0001))-bias);}
float shade=1.-intensity*occ/float(N);float fog=1.-exp(-fogDensity*max(-origin.z,0.));
gl_FragColor=vec4(vec3(mix(shade,1.,clamp(fog*1.25,0.,1.))),1.);}`;
const composite=`varying vec2 vUv;uniform sampler2D tDiffuse;uniform sampler2D tBloom;uniform sampler2D tAO;uniform float bloom;uniform float vignette;uniform float aoAmount;uniform vec2 resolution;
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float ao=mix(1.,texture2D(tAO,vUv).r,aoAmount);c*=ao;c+=texture2D(tBloom,vUv).rgb*bloom;
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
    uniforms:{
      tDiffuse:{value:null},tBloom:{value:null},tAO:{value:null},tDepth:{value:null},
      direction:{value:new T.Vector2()},threshold:{value:.72},bloom:{value:.42},vignette:{value:.38},
      aoAmount:{value:.85},resolution:{value:new T.Vector2(1,1)},
      projectionInverse:{value:new T.Matrix4()},radius:{value:1.4},intensity:{value:.85},bias:{value:.04},fogDensity:{value:.001}
    },
    vertexShader:bright,fragmentShader:fragment});
}

export class PresenceComposer{
  constructor(renderer,scene,camera){
    this.renderer=renderer;this.scene=scene;this.camera=camera;
    this.enabled=false;this.ao=false;this.quality='HIGH';
    this.available=typeof renderer?.setRenderTarget==='function'&&typeof T.WebGLRenderTarget==='function'&&typeof T.DepthTexture==='function';
    this.quad=null;this.targets=null;
  }
  _boot(w,h){
    if(!this.available||this.targets)return;
    const opts={minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true,type:T.HalfFloatType};
    const depth=new T.DepthTexture(w,h);depth.minFilter=T.NearestFilter;depth.magFilter=T.NearestFilter;
    this.sceneTarget=new T.WebGLRenderTarget(w,h,{...opts,depthTexture:depth});
    this.aoTarget=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false});
    this.aoBlur=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false});
    this.brightTarget=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{...opts,depthBuffer:false});
    this.blurTarget=new T.WebGLRenderTarget(Math.max(2,w>>1),Math.max(2,h>>1),{...opts,depthBuffer:false});
    this.extract=pass(extract);this.blur=pass(blur);this.aoPass=pass(ao);this.compose=pass(composite);
    // Tone-map linear HDR and convert to display color exactly once.
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
    this.ao=this.enabled;
    this.strength=this.quality==='ULTRA'?.58:.38;
    this.aoRadius=this.quality==='ULTRA'?1.8:1.35;
    this.aoIntensity=this.quality==='ULTRA'?1.05:.8;
  }
  setSize(w,h){
    if(!this.targets)return;
    this.sceneTarget.setSize(w,h);
    this.aoTarget.setSize(Math.max(2,w>>1),Math.max(2,h>>1));
    this.aoBlur.setSize(Math.max(2,w>>1),Math.max(2,h>>1));
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
    this.quad.material=this.aoPass;
    this.aoPass.uniforms.tDepth.value=this.sceneTarget.depthTexture;
    this.aoPass.uniforms.projectionInverse.value.copy(this.camera.projectionMatrixInverse);
    this.aoPass.uniforms.resolution.value.set(this.aoTarget.width,this.aoTarget.height);
    this.aoPass.uniforms.radius.value=this.aoRadius;
    this.aoPass.uniforms.intensity.value=this.aoIntensity;
    this.aoPass.uniforms.fogDensity.value=this.scene.fog?.density||0;
    r.setRenderTarget(this.aoTarget);r.render(this.passScene,this.passCamera);
    this.quad.material=this.blur;this.blur.uniforms.tDiffuse.value=this.aoTarget.texture;
    this.blur.uniforms.direction.value.set(1/(this.aoTarget.width||1),0);
    r.setRenderTarget(this.aoBlur);r.render(this.passScene,this.passCamera);
    this.blur.uniforms.tDiffuse.value=this.aoBlur.texture;
    this.blur.uniforms.direction.value.set(0,1/(this.aoBlur.height||1));
    r.setRenderTarget(this.aoTarget);r.render(this.passScene,this.passCamera);
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
    this.compose.uniforms.tAO.value=this.aoTarget.texture;
    this.compose.uniforms.bloom.value=this.strength;this.compose.uniforms.vignette.value=.34;
    this.compose.uniforms.aoAmount.value=this.ao?1:0;
    this.compose.uniforms.resolution.value.set(this.sceneTarget.width,this.sceneTarget.height);
    r.setRenderTarget(prior);r.render(this.passScene,this.passCamera);
  }
}
