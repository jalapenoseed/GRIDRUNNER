type Bus = "master" | "sfx" | "music";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let engineGain: GainNode | null = null;
let tireGain: GainNode | null = null;
let windGain: GainNode | null = null;
let engineOsc: OscillatorNode | null = null;
let engineOsc2: OscillatorNode | null = null;
let rotorGain: GainNode | null = null;
let rotor: OscillatorNode | null = null;
let unlocked = false;
let noiseBuf: AudioBuffer | null = null;
let ambienceStarted = false;

const levels = { master: 0.78, sfx: 0.8, music: 0.5 };

function ac() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC({ latencyHint: "interactive" });
  master = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus = ctx.createGain();
  engineGain = ctx.createGain();
  tireGain = ctx.createGain();
  windGain = ctx.createGain();
  rotorGain = ctx.createGain();
  master.gain.value = levels.master;
  sfxBus.gain.value = levels.sfx;
  musicBus.gain.value = levels.music;
  engineGain.gain.value = 0;
  tireGain.gain.value = 0;
  windGain.gain.value = 0;
  rotorGain.gain.value = 0;
  sfxBus.connect(master);
  musicBus.connect(master);
  engineGain.connect(master);
  tireGain.connect(master);
  windGain.connect(master);
  rotorGain.connect(master);
  master.connect(ctx.destination);
  return ctx;
}

function makeNoise(seconds = 1.6) {
  const c = ac();
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
    data[i] = last;
  }
  return buf;
}

function loopNoise(dest: AudioNode, filterHz: number, type: BiquadFilterType = "lowpass") {
  if (!ctx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filterHz;
  src.connect(f);
  f.connect(dest);
  src.start();
}

function startAmbience() {
  if (!ctx || !musicBus || !windGain || ambienceStarted) return;
  ambienceStarted = true;
  noiseBuf ??= makeNoise();
  loopNoise(windGain, 420);
  loopNoise(tireGain!, 280);
  const hum = ctx.createOscillator();
  const hum2 = ctx.createOscillator();
  const hg = ctx.createGain();
  hum.type = "sine";
  hum2.type = "sine";
  hum.frequency.value = 46;
  hum2.frequency.value = 69;
  hg.gain.value = 0.05;
  hum.connect(hg);
  hum2.connect(hg);
  hg.connect(musicBus);
  hum.start();
  hum2.start();
  const pad = ctx.createOscillator();
  const pg = ctx.createGain();
  pad.type = "triangle";
  pad.frequency.value = 98;
  pg.gain.value = 0.028;
  pad.connect(pg);
  pg.connect(musicBus);
  pad.start();
}

function startEngine() {
  if (!ctx || !engineGain || engineOsc) return;
  engineOsc = ctx.createOscillator();
  engineOsc2 = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 640;
  engineOsc.type = "sawtooth";
  engineOsc2.type = "square";
  engineOsc.frequency.value = 48;
  engineOsc2.frequency.value = 96;
  engineOsc.connect(f);
  engineOsc2.connect(f);
  f.connect(engineGain);
  engineOsc.start();
  engineOsc2.start();
}

function startRotor() {
  if (!ctx || !rotorGain || rotor) return;
  rotor = ctx.createOscillator();
  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 480;
  rotor.type = "sawtooth";
  rotor.frequency.value = 72;
  rotor.connect(filt);
  filt.connect(rotorGain);
  rotor.start();
}

export function unlockAudio() {
  const c = ac();
  if (c.state === "suspended") void c.resume();
  if (unlocked) {
    if (c.state === "suspended") void c.resume();
    return;
  }
  unlocked = true;
  startAmbience();
  startEngine();
  startRotor();
  if (windGain) windGain.gain.setTargetAtTime(0.045, c.currentTime, 0.35);
}

export function setVolumes(next: Partial<typeof levels>) {
  Object.assign(levels, next);
  if (!ctx) return;
  const t = ctx.currentTime;
  master?.gain.setTargetAtTime(levels.master, t, 0.05);
  sfxBus?.gain.setTargetAtTime(levels.sfx, t, 0.05);
  musicBus?.gain.setTargetAtTime(levels.music, t, 0.05);
}

export function getVolumes() {
  return { ...levels };
}

export function setRotorLevel(airborne: number, total: number) {
  if (!ctx || !rotorGain || !rotor || !unlocked) return;
  const t = ctx.currentTime;
  const k = total <= 0 ? 0 : airborne / total;
  rotorGain.gain.setTargetAtTime(k * 0.07, t, 0.08);
  rotor.frequency.setTargetAtTime(64 + k * 52, t, 0.12);
}

export function setBikeAudio(speed: number, throttle: number, wheelie: number, onRoad: boolean) {
  if (!ctx || !engineGain || !engineOsc || !engineOsc2 || !tireGain || !windGain || !unlocked) return;
  const t = ctx.currentTime;
  const sp = Math.abs(speed);
  const moving = sp > 0.12;
  const idle = 0.028;
  const roar = moving ? idle + sp * 0.014 + Math.max(0, throttle) * 0.05 + wheelie * 0.03 : idle;
  engineGain.gain.setTargetAtTime(roar, t, 0.05);
  engineOsc.frequency.setTargetAtTime(38 + sp * 11 + wheelie * 22 + Math.max(0, throttle) * 8, t, 0.07);
  engineOsc2.frequency.setTargetAtTime(76 + sp * 16 + wheelie * 28, t, 0.07);
  const grit = onRoad ? 0.018 : 0.046;
  tireGain.gain.setTargetAtTime(moving ? grit + sp * 0.006 : 0.004, t, 0.08);
  windGain.gain.setTargetAtTime(0.032 + sp * 0.01 + (onRoad ? 0 : 0.016), t, 0.1);
}

function beep(freq: number, dur: number, gain = 0.12, type: OscillatorType = "sine") {
  if (!ctx || !sfxBus || !unlocked) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq * (0.97 + Math.random() * 0.06);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(sfxBus);
  o.start();
  o.stop(ctx.currentTime + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

export function sfx(
  kind: "ping" | "collect" | "launch" | "recall" | "warn" | "win" | "miss" | "tag",
) {
  if (!unlocked) return;
  if (kind === "ping") beep(880, 0.08, 0.08, "triangle");
  else if (kind === "collect") {
    beep(620, 0.07, 0.09, "sine");
    beep(1240, 0.12, 0.06, "sine");
  } else if (kind === "tag") {
    beep(340, 0.08, 0.1, "square");
    beep(880, 0.14, 0.06, "triangle");
  } else if (kind === "launch") beep(240, 0.18, 0.1, "square");
  else if (kind === "recall") beep(180, 0.22, 0.09, "sawtooth");
  else if (kind === "warn") beep(160, 0.16, 0.12, "square");
  else if (kind === "miss") beep(140, 0.1, 0.07, "triangle");
  else {
    beep(520, 0.1, 0.1);
    beep(780, 0.18, 0.08);
    beep(1040, 0.26, 0.06);
  }
}

export function isAudioUnlocked() {
  return unlocked;
}

export type { Bus };
