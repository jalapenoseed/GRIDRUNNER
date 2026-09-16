// Spatial beds on top of the existing procedural FieldAudio.
// Howler is the recorded-file path later; this keeps motors/rotors authored here.
export function attachPresenceAudio(audio){
  if(!audio||audio.presence)return audio;
  audio.presence={listener:null,panners:{},ready:false};
  return audio;
}

export function startPresenceAudio(audio){
  const c=audio?.ctx;if(!c||audio.presence?.ready)return audio;
  attachPresenceAudio(audio);
  if(typeof c.createPanner!=='function'||typeof c.listener?.setPosition!=='function'&&!c.listener?.positionX){
    audio.presence.ready=false;return audio;
  }
  const listener=c.listener;
  const pan=(name,x,y,z)=>{
    const p=c.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';
    p.refDistance=8;p.maxDistance=140;p.rolloffFactor=1.1;
    if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;}
    else p.setPosition?.(x,y,z);
    const voice=audio.voices[name];
    if(voice?.p){try{voice.p.disconnect();}catch{} voice.g.connect(p);p.connect(audio.ambient);}
    audio.presence.panners[name]={p,x,y,z};
  };
  pan('generator',54,1.2,-100);
  pan('carrier',0,18,-1439);
  pan('workshop',90,1,-416);
  pan('shelter',54,1.4,-94);
  audio.presence.listener=listener;audio.presence.ready=true;
  return audio;
}

export function updatePresenceAudio(audio,s,camera){
  const p=audio?.presence;if(!p?.ready||!audio.ctx)return;
  const listener=p.listener,pos=camera?.position||s.pos,yaw=s.yaw||0;
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw);
  if(listener.positionX){
    listener.positionX.value=pos.x;listener.positionY.value=pos.y;listener.positionZ.value=pos.z;
    listener.forwardX.value=fx;listener.forwardY.value=0;listener.forwardZ.value=fz;
    listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;
  }else{
    listener.setPosition?.(pos.x,pos.y,pos.z);
    listener.setOrientation?.(fx,0,fz,0,1,0);
  }
}
