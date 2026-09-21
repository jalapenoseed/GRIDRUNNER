let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let rotorGain: GainNode | null = null;
let rotor: OscillatorNode | null = null;
let unlocked = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC({ latencyHint: "interactive" });
  master = ctx.createGain();
  sfxBus = ctx.createGain();
  rotorGain = ctx.createGain();
  master.gain.value = 0.55;
  sfxBus.gain.value = 0.7;
  rotorGain.gain.value = 0;
  sfxBus.connect(master);
  rotorGain.connect(master);
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const ac = ensure();
  if (ac.state === "suspended") void ac.resume();
  unlocked = true;
  if (!rotor && ctx && rotorGain) {
    rotor = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 420;
    rotor.type = "sawtooth";
    rotor.frequency.value = 72;
    rotor.connect(filt);
    filt.connect(rotorGain);
    rotor.start();
  }
}

export function setRotorLevel(airborne: number, total: number) {
  if (!ctx || !rotorGain || !rotor || !unlocked) return;
  const t = ctx.currentTime;
  const k = total <= 0 ? 0 : airborne / total;
  rotorGain.gain.setTargetAtTime(k * 0.045, t, 0.08);
  rotor.frequency.setTargetAtTime(64 + k * 48, t, 0.12);
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

export function sfx(kind: "ping" | "collect" | "launch" | "recall" | "warn" | "win" | "miss") {
  if (!unlocked) return;
  if (kind === "ping") beep(880, 0.09, 0.08, "triangle");
  else if (kind === "collect") {
    beep(620, 0.08, 0.1, "sine");
    beep(1240, 0.16, 0.07, "sine");
  } else if (kind === "launch") beep(240, 0.22, 0.1, "square");
  else if (kind === "recall") beep(180, 0.28, 0.09, "sawtooth");
  else if (kind === "warn") beep(160, 0.18, 0.12, "square");
  else if (kind === "miss") beep(140, 0.12, 0.08, "triangle");
  else {
    beep(520, 0.12, 0.1);
    beep(780, 0.22, 0.08);
    beep(1040, 0.32, 0.06);
  }
}

export function isAudioUnlocked() {
  return unlocked;
}
