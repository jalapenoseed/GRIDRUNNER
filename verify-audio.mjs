import assert from 'node:assert/strict';
import {FieldAudio} from './dist/audio.js';
let count=0;
function param(){return {value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}};}
function node(){return {gain:param(),frequency:param(),pan:param(),Q:param(),threshold:param(),ratio:param(),connect(){},disconnect(){},start(){},stop(){this.onended?.();}};}
globalThis.AudioContext=class{constructor(){count++;this.currentTime=1;this.sampleRate=8000;this.destination={};}createStereoPanner(){return node();}createDynamicsCompressor(){return node();}createGain(){return node();}createOscillator(){return node();}createBufferSource(){return node();}createBiquadFilter(){return node();}createBuffer(a,n){return {getChannelData(){return new Float32Array(n);}};}resume(){return Promise.resolve();}};
const audio=new FieldAudio();assert.equal(count,0);audio.start();audio.start();assert.equal(count,1);audio.setLevels({master:.4,effects:.6,music:.2});
const state={speed:20,mode:'bike',battery:50,powerMode:'FULL',generator:'off',pos:{x:0,z:0},leg:1,drone:100};audio.update(state,false,false);assert(audio.voices.motor.g.gain.value>0);assert.equal(audio.master.gain.value,.4);
audio.update({...state,powerMode:'HUMAN'},false,false);assert.equal(audio.voices.motor.g.gain.value,0);audio.update({...state,mode:'drone'},false,false);assert(audio.voices.rotor.g.gain.value>0);
audio.update(state,true,false);assert.equal(audio.voices.motor.g.gain.value,0);assert.equal(audio.music.gain.value,0);assert.equal(audio.master.gain.value,.4,'Menu effects remain audible');
for(const effect of ['ui','scan','drone','use','craft','shot','pulse','hit','save','radio','fail','success'])audio.event(effect);
audio.setLevels({master:0});audio.update(state,false,false);assert.equal(audio.master.gain.value,0);
console.log('PASS: gesture-only audio initialization, one context, effect synthesis, gameplay loops, menu pause behavior, volume and mute.');
audio.ctx.currentTime=10;audio.setFrame({generatorNear:1,terminal:true,carrier:true,radioNear:1,threat:true,cargo:35});audio.update(state,false,false);assert(audio.voices.generator.g.gain.value>0);assert(audio.voices.crt.g.gain.value>0);assert(audio.voices.carrier.g.gain.value>0);const quiet=audio.music.gain.value;audio.event('radio');audio.update(state,false,false);assert(audio.music.gain.value<quiet,'Radio ducks music');
for(const name of ['padConnect','generatorCrank','generatorRun','generatorStop','fridge','terminal','carrierLock','evidence'])audio.event(name);
const voiceCount=Object.keys(audio.voices).length;for(let i=0;i<100;i++){audio.pause(true);audio.update(state,true,false);audio.pause(false);audio.update(state,false,false);}audio.pause(true);assert.equal(audio.oneShots.size,0,'Short-lived nodes are disconnected on completion/pause');assert.equal(Object.keys(audio.voices).length,voiceCount,'Pause cycles do not allocate extra loop nodes');for(const v of Object.values(audio.voices))assert.equal(v.g.gain.value,0,'All loops fade on pause');
console.log('PASS: generator/CRT/carrier buses, radio ducking, new one-shots, pause/resume node bounds and silence.');
