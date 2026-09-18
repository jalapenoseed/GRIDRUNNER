// Layered, original transient textures share the existing audio graph and limiter.
export function noiseBurst(audio,{duration=.3,volume=.035,frequency=900,pan=0,delay=0,lowpass=false}={}){
 const c=audio.ctx;if(!c||!audio.noiseBuffer||audio.oneShots.size>24)return;
 const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),panner=c.createStereoPanner(),at=c.currentTime+delay;source.buffer=audio.noiseBuffer;source.loop=true;filter.type=lowpass?'lowpass':'bandpass';filter.frequency.value=frequency;filter.Q.value=.7;panner.pan.value=pan;
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.018);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(audio.fx);audio.oneShots.add(source);source.onended=()=>{audio.oneShots.delete(source);source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};source.start(at);source.stop(at+duration+.03);
}
export function layeredEvent(audio,name){
 const impacts={shot:[.24,.13,950],hit:[.15,.08,440],damage:[.3,.06,650],landing:[.45,.035,240],craft:[.16,.035,2200],dock:[.18,.02,1600],generatorCrank:[.8,.06,480],generatorStop:[.6,.025,230],radio:[.15,.012,1900],padConnect:[.12,.02,1800]};
 const event=impacts[name];if(event){const [duration,volume,frequency]=event;noiseBurst(audio,{duration,volume,frequency});if(['craft','dock','padConnect'].includes(name))noiseBurst(audio,{duration:.1,volume:volume*.45,frequency:frequency*1.7,delay:.1,pan:.12});}
}
