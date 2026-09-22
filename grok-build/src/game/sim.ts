import { sfx, setRotorLevel, setBikeAudio } from "./audio";
import { spellSlots } from "./glyphs";
import { briefingDef } from "./ops";
import { recordScore } from "./save";
import {
  BEACON,
  DRILL_SEQUENCE,
  FIELD_WAVES,
  SPECS,
  type Airframe,
  type Briefing,
  type DroneTask,
  type FleetOp,
  type Focus,
  type Formation,
  type EscortStance,
  type CamView,
} from "./types";

export type DroneState = {
  id: number;
  kind: Airframe;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  beacon: string;
  battery: number;
  airborne: boolean;
  task: DroneTask;
  hull: number;
  tx: number;
  ty: number;
  tz: number;
};

export type HostileState = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  yaw: number;
  alive: boolean;
  tagged: boolean;
};

export type Pickup = { x: number; z: number; taken: boolean };
export type HuntPad = { id: string; kind: Airframe; x: number; z: number; scored: number };
export type RelayPad = { id: number; x: number; z: number; online: boolean; occupant: number | null };

type Hud = {
  speed: number;
  yaw: number;
  battery: number;
  salvage: number;
  suspicion: number;
  wave: number;
  waveNeed: number;
  dropReady: boolean;
  x: number;
  z: number;
  rallyX: number;
  rallyZ: number;
  watchX: number;
  watchZ: number;
  won: boolean;
  stalled: boolean;
  observed: boolean;
  failed: boolean;
  score: number;
  timer: number;
  cohesion: number;
  airborne: number;
  fleet: number;
  prompt: string;
  goal: string;
  briefing: Briefing;
  drillStage: number;
  huntNeed: Airframe;
  relays: number;
  juice: number;
  tagged: number;
  breaches: number;
  hostiles: number;
  focus: Focus;
  stance: EscortStance;
  wheelie: number;
  cam: CamView;
};

const MIX16: Airframe[] = [
  "scout",
  "scout",
  "relay",
  "utility",
  "scout",
  "cargo",
  "scout",
  "relay",
  "utility",
  "cargo",
  "scout",
  "relay",
  "scout",
  "utility",
  "cargo",
  "scout",
  "relay",
  "utility",
  "scout",
  "cargo",
  "scout",
  "relay",
  "utility",
  "cargo",
];

const keys = new Set<string>();
let injectedKeys: string[] | null = null;
let injectedSteer: number | null = null;
let touchSteer = 0;
let touchThrottle = 0;
let scoredLock = false;

function held() {
  return injectedKeys ? new Set(injectedKeys) : keys;
}

function makeBike() {
  return {
    x: 0,
    y: 0.1,
    z: 12,
    yaw: 0,
    speed: 0,
    battery: 100,
    steer: 0,
    lean: 0,
    wheel: 0,
    vx: 0,
    vz: 0,
    wheelie: 0,
    pitch: 0,
  };
}

function roster(count: number, briefing: Briefing = "free"): Airframe[] {
  if (briefing === "intercept") {
    return Array.from({ length: count }, (_, i) => (i % 5 === 4 ? "relay" : "scout"));
  }
  if (count <= 6) {
    const six: Airframe[] = ["scout", "scout", "scout", "scout", "relay", "relay"];
    return six.slice(0, count);
  }
  return Array.from({ length: count }, (_, i) => MIX16[i % MIX16.length]);
}

function padPos(i: number, count: number) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(count)));
  const row = Math.floor(i / cols);
  const col = i % cols;
  return {
    x: (col - (cols - 1) / 2) * 2.35,
    z: -2 + row * 2.2,
  };
}

function makeDrones(count: number, briefing: Briefing = "free"): DroneState[] {
  return roster(count, briefing).map((kind, i) => {
    const p = padPos(i, count);
    return {
      id: i,
      kind,
      x: p.x,
      y: 0.45,
      z: p.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      beacon: BEACON[kind],
      battery: 100,
      airborne: false,
      task: "form" as DroneTask,
      hull: 100,
      tx: p.x,
      ty: 3.1,
      tz: p.z,
    };
  });
}

function makeWavePickups(waveIndex: number): Pickup[] {
  const spec = FIELD_WAVES[waveIndex] ?? FIELD_WAVES[0];
  const list: Pickup[] = [];
  for (let i = 0; i < spec.need; i++) {
    const z = spec.z0 - i * spec.gap;
    const x = (i % 2 === 0 ? -1 : 1) * (3.8 + (i % 3) * 0.55);
    list.push({ x, z, taken: false });
  }
  return list;
}

function makeFleetHarvest(): Pickup[] {
  const spots = [
    [8, -6],
    [-10, -4],
    [14, -16],
    [-6, -18],
    [4, -28],
    [-16, -22],
    [18, -32],
    [-2, -38],
  ];
  return spots.map(([x, z]) => ({ x, z, taken: false }));
}

function makeHunt(): HuntPad[] {
  return [
    { id: "alpha", kind: "scout", x: -16, z: -8, scored: 0 },
    { id: "bravo", kind: "relay", x: 16, z: -8, scored: 0 },
    { id: "charlie", kind: "utility", x: -16, z: -28, scored: 0 },
    { id: "delta", kind: "cargo", x: 16, z: -28, scored: 0 },
  ];
}

function makeRelays(): RelayPad[] {
  return [
    { id: 0, x: 0, z: -12, online: false, occupant: null },
    { id: 1, x: 6, z: -28, online: false, occupant: null },
    { id: 2, x: -4, z: -46, online: false, occupant: null },
  ];
}

export const sim = {
  bike: makeBike(),
  drones: makeDrones(16),
  hostiles: [] as HostileState[],
  pickups: makeWavePickups(0),
  hunt: makeHunt(),
  hops: makeRelays(),
  watch: { x: 16, z: -88, yaw: 0, suspicion: 0 },
  rally: { x: 0, z: 0 },
  time: 0,
  salvage: 0,
  wave: 1,
  waveIndex: 0,
  waveNeed: FIELD_WAVES[0].need as number,
  dropZ: FIELD_WAVES[0].dropZ as number,
  won: false,
  stalled: false,
  observed: false,
  failed: false,
  formation: "wedge" as Formation,
  boids: true,
  fleetCount: 16,
  mode: "hangar" as "hangar" | "field" | "fleet" | "library",
  briefing: "harvest" as Briefing,
  op: "form" as FleetOp,
  paused: false,
  score: 0,
  timer: 120,
  cohesion: 0,
  drillStage: 0,
  drillHold: 0,
  huntIndex: 0,
  juice: 0,
  prompt: "Tap the yard to rally.",
  focus: "all" as Focus,
  tagged: 0,
  breaches: 0,
  spawnT: 0,
  rosterId: 0,
  stance: "escort" as EscortStance,
  cam: "chase" as CamView,

  resetField() {
    this.bike = makeBike();
    const kinds: Airframe[] = ["scout", "scout", "relay", "utility", "cargo", "scout"];
    this.drones = makeDrones(6).map((d, i) => {
      const a = (i / 6) * Math.PI * 2;
      d.kind = kinds[i] ?? "scout";
      d.beacon = BEACON[d.kind];
      d.x = Math.cos(a) * 3.2;
      d.z = 12 + Math.sin(a) * 3.2;
      d.y = 3.6;
      d.airborne = true;
      d.task = "form";
      d.battery = 100;
      return d;
    });
    this.waveIndex = 0;
    this.wave = 1;
    this.waveNeed = FIELD_WAVES[0].need;
    this.dropZ = FIELD_WAVES[0].dropZ;
    this.pickups = makeWavePickups(0);
    this.watch = { x: 28, z: -118, yaw: 0, suspicion: 0 };
    this.rally = { x: 0, z: 8 };
    this.salvage = 0;
    this.won = false;
    this.stalled = false;
    this.observed = false;
    this.failed = false;
    this.time = 0;
    this.score = 0;
    this.juice = 0;
    this.briefing = "free";
    this.prompt = "Ride north. Sweep cells, bank the cyan gates, finish at the substation.";
    this.hostiles = [];
    this.stance = "escort";
    this.spawnT = 2;
    this.tagged = 0;
    this.formation = "wedge";
    this.rosterId += 1;
    scoredLock = false;
  },

  resetFleet(count = 16, briefing: Briefing = "harvest") {
    this.fleetCount = count;
    this.briefing = briefing;
    this.drones = makeDrones(count, briefing);
    this.rally = { x: 0, z: -4 };
    this.pickups = briefing === "harvest" ? makeFleetHarvest() : [];
    this.hunt = briefing === "hunt" ? makeHunt() : [];
    this.hops = briefing === "relay" ? makeRelays() : [];
    this.hostiles = [];
    this.tagged = 0;
    this.breaches = 0;
    this.spawnT = 0.6;
    this.watch = { x: 22, z: -24, yaw: 0, suspicion: 0 };
    this.time = 0;
    this.salvage = 0;
    this.won = false;
    this.failed = false;
    this.observed = false;
    this.stalled = false;
    this.score = 0;
    this.timer = briefingDef(briefing).time;
    this.cohesion = 0;
    this.drillStage = 0;
    this.drillHold = 0;
    this.huntIndex = 0;
    this.juice = 0;
    this.op = "form";
    this.focus = "all";
    this.prompt = briefingDef(briefing).blurb;
    this.rosterId += 1;
    scoredLock = false;
    launchAll(this);
    if (briefing === "harvest") this.setOp("harvest");
    else if (briefing === "relay") this.setOp("relay");
  },

  setRally(x: number, z: number) {
    this.rally.x = x;
    this.rally.z = z;
    sfx("ping");
    this.juice = Math.min(0.4, this.juice + 0.12);
    for (const d of this.drones) {
      if (this.focus === "all" || d.kind === this.focus) {
        if (d.task === "hold" || d.task === "form" || d.task === "intercept") d.task = "form";
      } else if (d.task === "form") {
        d.task = "hold";
      }
    }
  },

  setFocus(focus: Focus) {
    this.focus = focus;
    if (focus === "all") {
      for (const d of this.drones) {
        if (d.task === "hold") d.task = "form";
      }
    } else {
      for (const d of this.drones) {
        if (d.kind === focus && d.task === "hold") d.task = "form";
        else if (d.kind !== focus && d.task === "form") d.task = "hold";
      }
    }
  },

  setOp(op: FleetOp) {
    this.op = op;
    if (op === "recall") {
      sfx("recall");
      for (const d of this.drones) d.task = "recall";
    } else if (op === "harvest") {
      sfx("launch");
      for (const d of this.drones) {
        if (d.kind === "utility" || d.kind === "cargo") d.task = "harvest";
        else if (this.focus === "all" || d.kind === this.focus) d.task = "form";
      }
    } else if (op === "relay") {
      sfx("launch");
      assignRelays(this);
    } else {
      sfx("launch");
      for (const d of this.drones) {
        if (this.focus === "all" || d.kind === this.focus) d.task = "form";
      }
    }
  },

  launch() {
    launchAll(this);
    sfx("launch");
  },

  recall() {
    this.setOp("recall");
  },

  getHud(): Hud {
    const airborne = this.drones.filter((d) => d.airborne).length;
    const batt =
      this.mode === "field"
        ? this.bike.battery
        : this.drones.length
          ? this.drones.reduce((a, d) => a + d.battery, 0) / this.drones.length
          : 0;
    const huntNeed = this.hunt[this.huntIndex]?.kind ?? "scout";
    const relays = this.hops.filter((h) => h.online).length;
    const dropReady = this.mode === "field" && this.salvage >= this.waveNeed && !this.won;
    let goal = "";
    if (this.mode === "field") {
      goal = dropReady
        ? `Bank wave ${this.wave}`
        : `Wave ${this.wave}/3 · ${this.salvage}/${this.waveNeed}`;
    } else if (this.briefing === "harvest") goal = `${this.salvage} / 6 cells`;
    else if (this.briefing === "drill")
      goal = `${DRILL_SEQUENCE[this.drillStage] ?? "done"} · ${(this.cohesion * 100).toFixed(0)}%`;
    else if (this.briefing === "hunt") goal = `Pad ${this.hunt[this.huntIndex]?.id ?? "—"}`;
    else if (this.briefing === "relay") goal = `${relays} / 3 hops`;
    else if (this.briefing === "intercept") goal = `${this.tagged} / 6 tags`;
    else goal = `${airborne}/${this.drones.length} air`;
    return {
      speed: this.bike.speed,
      yaw: this.bike.yaw,
      battery: batt,
      salvage: this.salvage,
      suspicion: this.watch.suspicion,
      wave: this.wave,
      waveNeed: this.waveNeed,
      dropReady,
      x: this.bike.x,
      z: this.bike.z,
      rallyX: this.rally.x,
      rallyZ: this.rally.z,
      watchX: this.watch.x,
      watchZ: this.watch.z,
      won: this.won,
      stalled: this.stalled,
      observed: this.observed,
      failed: this.failed,
      score: this.score,
      timer: this.timer,
      cohesion: this.cohesion,
      airborne,
      fleet: this.drones.length,
      prompt: this.prompt,
      goal,
      briefing: this.briefing,
      drillStage: this.drillStage,
      huntNeed,
      relays,
      juice: this.juice,
      tagged: this.tagged,
      breaches: this.breaches,
      hostiles: this.hostiles.filter((h) => h.alive).length,
      focus: this.focus,
      stance: this.stance,
      wheelie: this.bike.wheelie,
      cam: this.cam,
    };
  },

  getYaw() {
    return this.bike.yaw;
  },
  getSpeed() {
    return this.bike.speed;
  },
  setSteer(v: number) {
    injectedSteer = v;
  },
  setKeys(codes: string[]) {
    injectedKeys = codes.length ? codes : null;
  },
  setTouch(steer: number, throttle: number) {
    touchSteer = steer;
    touchThrottle = throttle;
  },
  setStance(stance: EscortStance) {
    this.stance = stance;
    if (stance === "harvest") this.setOp("harvest");
    else {
      for (const d of this.drones) {
        if (d.task === "harvest") d.task = "form";
      }
    }
  },
  cycleCam() {
    const order: CamView[] = ["chase", "hood", "shoulder", "drone", "orbit"];
    this.cam = order[(order.indexOf(this.cam) + 1) % order.length];
    return this.cam;
  },
  setCam(view: CamView) {
    this.cam = view;
  },
};

function launchAll(s: typeof sim) {
  for (const d of s.drones) {
    if (d.battery < 4) continue;
    d.airborne = true;
    if (d.task === "recall" || d.task === "hold") d.task = "form";
    if (d.y < 2.2) d.y = 2.6;
  }
  s.op = "form";
}

function assignRelays(s: typeof sim) {
  const busy = new Set(s.hops.filter((h) => h.occupant != null).map((h) => h.occupant));
  const relays = s.drones.filter((d) => d.kind === "relay" && !busy.has(d.id));
  for (const hop of s.hops) {
    if (hop.online || hop.occupant != null) continue;
    const d = relays.shift();
    if (!d) break;
    hop.occupant = d.id;
    d.task = "relay";
    d.airborne = true;
  }
  for (const d of s.drones) if (d.kind !== "relay") d.task = "form";
}

function slots(
  formation: Formation,
  n: number,
  origin: { x: number; z: number },
  heading: number,
  t: number,
) {
  const out: { x: number; y: number; z: number }[] = [];
  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  const rx = Math.cos(heading);
  const rz = -Math.sin(heading);
  if (formation === "grid" || formation === "run" || formation === "ops") {
    const word = formation === "grid" ? "GRID" : formation === "run" ? "RUN" : "OPS";
    const pts = spellSlots(word, origin, formation === "grid" ? 1.55 : 1.8);
    for (let i = 0; i < n; i++) {
      const p = pts[i % Math.max(1, pts.length)] ?? { x: origin.x, y: 3.4, z: origin.z };
      out.push({ x: p.x, y: p.y + (i % 4) * 0.12, z: p.z });
    }
    return out;
  }
  for (let i = 0; i < n; i++) {
    let lx = 0;
    let lz = 0;
    let y = 3.1 + (i % 4) * 0.18;
    if (sim.mode === "field") y += 1.4;
    if (formation === "wedge") {
      const row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
      const start = (row * (row + 1)) / 2;
      const col = i - start;
      const width = row + 1;
      lx = (col - (width - 1) / 2) * (sim.mode === "field" ? 1.55 : 2.4);
      lz = row * (sim.mode === "field" ? 1.55 : 2.6) + (sim.mode === "field" ? 3.2 : 0);
    } else if (formation === "trail") {
      lx = (i % 2 === 0 ? -0.7 : 0.7) * 0.55;
      lz = i * (sim.mode === "field" ? 1.35 : 2.2) + (sim.mode === "field" ? 2.8 : 0);
    } else if (formation === "line") {
      lx = (i - (n - 1) / 2) * (sim.mode === "field" ? 1.7 : 2.6);
      lz = sim.mode === "field" ? 3.4 : 0;
    } else if (formation === "orbit") {
      const a = t * 0.55 + (i / n) * Math.PI * 2;
      lx = Math.cos(a) * (sim.mode === "field" ? 5.4 : 10);
      lz = Math.sin(a) * (sim.mode === "field" ? 5.4 : 10);
      y = 3.4 + Math.sin(a * 2) * 0.3;
    } else {
      const a = (i / n) * Math.PI * 2;
      lx = Math.cos(a) * (sim.mode === "field" ? 6.5 : 14);
      lz = Math.sin(a) * (sim.mode === "field" ? 6.5 : 14);
    }
    out.push({
      x: origin.x + rx * lx + fx * -lz,
      y,
      z: origin.z + rz * lx + fz * -lz,
    });
  }
  return out;
}

function harvestTarget(d: DroneState) {
  let best: Pickup | null = null;
  let bestD = 1e9;
  for (const p of sim.pickups) {
    if (p.taken) continue;
    const dist = Math.hypot(d.x - p.x, d.z - p.z);
    if (dist < bestD) {
      bestD = dist;
      best = p;
    }
  }
  return best;
}

function stepBoids(dt: number) {
  const list = sim.drones;
  const n = list.length;
  const origin =
    sim.mode === "field"
      ? { x: sim.bike.x, z: sim.bike.z }
      : sim.rally;
  const heading = sim.mode === "field" ? sim.bike.yaw : 0;
  const targets = slots(sim.formation, n, origin, heading, sim.time);
  let onSlot = 0;

  for (let i = 0; i < n; i++) {
    const d = list[i];
    let tgt = targets[i];
    if (d.task === "recall") {
      if (sim.mode === "field") {
        tgt = { x: sim.bike.x, y: 0.9, z: sim.bike.z + 2 };
      } else {
        const p = padPos(i, n);
        tgt = { x: p.x, y: 0.45, z: p.z };
      }
    } else if (d.task === "harvest") {
      const cell = harvestTarget(d);
      if (cell) tgt = { x: cell.x, y: 1.6, z: cell.z };
    } else if (d.task === "relay") {
      const pad = sim.hops.find((h) => h.occupant === d.id) ?? sim.hops.find((h) => !h.online);
      if (pad) tgt = { x: pad.x, y: pad.online ? 0.5 : 1.4, z: pad.z };
    } else if (d.task === "intercept" || d.task === "guard") {
      tgt = { x: d.tx, y: d.ty, z: d.tz };
    } else if (d.task === "hold") {
      tgt = { x: d.x, y: d.airborne ? Math.max(d.y, 2.6) : 0.45, z: d.z };
    }
    if (!d.airborne && d.task !== "recall") {
      tgt = { x: d.x, y: 0.45, z: d.z };
    }

    let ax = (tgt.x - d.x) * (sim.mode === "field" ? 5.4 : 1.6);
    let ay = (tgt.y - d.y) * 2.4;
    let az = (tgt.z - d.z) * (sim.mode === "field" ? 5.4 : 1.6);

    if (sim.boids && d.airborne && d.task !== "hold") {
      let sx = 0,
        sy = 0,
        sz = 0,
        cx = 0,
        cy = 0,
        cz = 0,
        hx = 0,
        hy = 0,
        hz = 0,
        neighbors = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const o = list[j];
        const dx = d.x - o.x;
        const dy = d.y - o.y;
        const dz = d.z - o.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist < 6 && dist > 0.001) {
          neighbors++;
          cx += o.x;
          cy += o.y;
          cz += o.z;
          hx += o.vx;
          hy += o.vy;
          hz += o.vz;
          if (dist < 1.8) {
            const w = (1.8 - dist) / 1.8;
            sx += (dx / dist) * w * 6;
            sy += (dy / dist) * w * 6;
            sz += (dz / dist) * w * 6;
          }
        }
      }
      if (neighbors > 0) {
        cx = cx / neighbors - d.x;
        cy = cy / neighbors - d.y;
        cz = cz / neighbors - d.z;
        hx = hx / neighbors - d.vx;
        hy = hy / neighbors - d.vy;
        hz = hz / neighbors - d.vz;
        ax += sx * 1.1 + cx * 0.35 + hx * 0.5;
        ay += sy * 1.1 + cy * 0.35 + hy * 0.5;
        az += sz * 1.1 + cz * 0.35 + hz * 0.5;
      }
    }

    const max = SPECS[d.kind].speed * (d.battery < 12 ? 0.45 : 1) * (sim.mode === "field" ? 1.4 : 1);
    d.vx += ax * dt;
    d.vy += ay * dt;
    d.vz += az * dt;
    d.vx *= 1 - 2.4 * dt;
    d.vy *= 1 - 2.8 * dt;
    d.vz *= 1 - 2.4 * dt;
    const sp = Math.hypot(d.vx, d.vy, d.vz);
    if (sp > max) {
      const k = max / sp;
      d.vx *= k;
      d.vy *= k;
      d.vz *= k;
    }
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.z += d.vz * dt;
    if (Math.hypot(d.vx, d.vz) > 0.15) d.yaw = Math.atan2(-d.vx, -d.vz);

    if (d.airborne) {
      const drain = 0.55 + sp * 0.18;
      d.battery = Math.max(0, d.battery - drain * dt);
      if (d.battery <= 0) {
        d.airborne = false;
        d.task = "recall";
        d.y = Math.max(0.45, d.y);
      } else if (d.battery < 12 && d.task === "form") {
        d.task = "recall";
      }
    } else {
      d.battery = Math.min(100, d.battery + 18 * dt);
      d.y += (0.45 - d.y) * Math.min(1, 4 * dt);
    }

    if (d.task === "recall" && Math.hypot(d.x - tgt.x, d.z - tgt.z) < 1.1 && d.y < 1.1) {
      d.airborne = false;
      d.vx = d.vz = 0;
    }

    if (Math.hypot(d.x - targets[i].x, d.z - targets[i].z) < 3.8) {
      onSlot++;
    }
  }

  sim.cohesion = n ? onSlot / n : 0;
}

function pollGamepad(steer: number, throttle: number) {
  const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
  if (!pads) return { steer, throttle };
  for (const pad of pads) {
    if (!pad) continue;
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const m = Math.hypot(ax, ay);
    const dz = 0.15;
    if (m >= dz) {
      const scale = ((m - dz) / (1 - dz)) / m;
      const gx = ax * scale;
      const gy = ay * scale;
      steer += -gx;
      throttle += -gy;
    }
    if (pad.buttons[12]?.pressed) throttle += 1;
    if (pad.buttons[13]?.pressed) throttle -= 1;
    if (pad.buttons[14]?.pressed) steer += 1;
    if (pad.buttons[15]?.pressed) steer -= 1;
  }
  return { steer, throttle };
}

function collectCell(p: Pickup, via: "bike" | "drone") {
  p.taken = true;
  sim.salvage += 1;
  sim.score += via === "bike" ? 100 : 80;
  sim.juice = 0.16;
  sfx("collect");
  if (via === "bike") {
    sim.bike.battery = Math.min(100, sim.bike.battery + 22);
    sim.stalled = false;
  }
}

function bankWave() {
  sim.score += 280 + sim.salvage * 40;
  sim.bike.battery = Math.min(100, sim.bike.battery + 38);
  sim.juice = 0.22;
  sfx("collect");
  if (sim.waveIndex >= FIELD_WAVES.length - 1) {
    finish(true, sim.score + 520);
    sim.prompt = "Substation live. Northern feed is yours — hangar before WATCH vectors.";
    return;
  }
  sim.waveIndex += 1;
  sim.wave = sim.waveIndex + 1;
  const spec = FIELD_WAVES[sim.waveIndex];
  sim.waveNeed = spec.need;
  sim.dropZ = spec.dropZ;
  sim.pickups = makeWavePickups(sim.waveIndex);
  sim.salvage = 0;
  sim.prompt =
    sim.wave === 2
      ? "Wave two. Deeper grid — sweep five, bank the next gate. Hostiles inbound."
      : "Last wave. Bank at the substation ring. Hold the corridor.";
}

function stepField(dt: number) {
  const h = held();
  let steerIn = injectedSteer ?? touchSteer;
  if (injectedSteer == null) {
    if (h.has("KeyA") || h.has("ArrowLeft")) steerIn += 1;
    if (h.has("KeyD") || h.has("ArrowRight")) steerIn -= 1;
  }
  let throttle = touchThrottle;
  if (h.has("KeyW") || h.has("ArrowUp")) throttle += 1;
  if (h.has("KeyS") || h.has("ArrowDown")) throttle -= 1;
  const pad = pollGamepad(steerIn, throttle);
  steerIn = Math.max(-1, Math.min(1, pad.steer));
  throttle = Math.max(-1, Math.min(1, pad.throttle));

  sim.bike.steer += (steerIn - sim.bike.steer) * Math.min(1, 16 * dt);
  const s = sim.bike.steer;

  const onRoad = Math.abs(sim.bike.x) < 8.2;
  const surface = onRoad ? 1 : 0.92;
  if (sim.stalled) throttle = Math.min(throttle, 0.2);

  const wheelieWant =
    (h.has("Space") || h.has("ShiftLeft") || h.has("ShiftRight")) &&
    sim.bike.speed > 2.2 &&
    throttle >= 0;
  if (wheelieWant) sim.bike.wheelie = Math.min(1, sim.bike.wheelie + 2.8 * dt);
  else sim.bike.wheelie = Math.max(0, sim.bike.wheelie - 4.2 * dt);
  sim.bike.pitch = sim.bike.wheelie * 0.48;

  const maxFwd = 14.2;
  const maxRev = 4.4;
  if (throttle > 0.04) sim.bike.speed += throttle * 11.2 * surface * dt;
  else if (throttle < -0.04) sim.bike.speed += throttle * 14 * dt;
  else sim.bike.speed *= 1 - 1.15 * dt;
  if (sim.bike.wheelie > 0.4) sim.bike.speed += 1.6 * dt;
  sim.bike.speed *= 1 - Math.abs(s) * 0.18 * dt;
  if (!onRoad) sim.bike.speed *= 1 - 0.22 * dt;
  sim.bike.speed = Math.max(-maxRev, Math.min(maxFwd * surface, sim.bike.speed));

  const speedAbs = Math.abs(sim.bike.speed);
  const low = Math.min(1, 0.55 + speedAbs / 2.8);
  const highDamp = 1 / (1 + speedAbs * 0.018);
  const reverse = sim.bike.speed >= 0 ? 1 : -1;
  sim.bike.yaw += s * 2.85 * low * highDamp * reverse * dt;

  const fx = -Math.sin(sim.bike.yaw);
  const fz = -Math.cos(sim.bike.yaw);
  const rx = Math.cos(sim.bike.yaw);
  const rz = -Math.sin(sim.bike.yaw);
  const wantVx = fx * sim.bike.speed + rx * s * Math.max(speedAbs, 2.4) * 0.82;
  const wantVz = fz * sim.bike.speed + rz * s * Math.max(speedAbs, 2.4) * 0.82;
  const grip = onRoad ? 14 : 9.5;
  sim.bike.vx += (wantVx - sim.bike.vx) * Math.min(1, grip * dt);
  sim.bike.vz += (wantVz - sim.bike.vz) * Math.min(1, grip * dt);
  const fwd = sim.bike.vx * fx + sim.bike.vz * fz;
  let lat = sim.bike.vx * rx + sim.bike.vz * rz;
  lat *= 1 - (onRoad ? 4.4 : 2.6) * dt;
  sim.bike.vx = fx * fwd + rx * lat;
  sim.bike.vz = fz * fwd + rz * lat;
  sim.bike.x += sim.bike.vx * dt;
  sim.bike.z += sim.bike.vz * dt;
  sim.bike.y = 0.1 + sim.bike.wheelie * 0.24;

  if (Math.abs(sim.bike.x) > 18) {
    sim.bike.x += -Math.sign(sim.bike.x) * 6 * dt;
    sim.bike.vx *= 0.4;
  }

  const leanTarget = s * Math.min(1, speedAbs / 6.5) * 0.38;
  sim.bike.lean += (leanTarget - sim.bike.lean) * Math.min(1, 10 * dt);
  sim.bike.wheel += (sim.bike.speed / 0.28) * dt;

  const drain = 0.035 + Math.abs(sim.bike.speed) * 0.045 + sim.bike.wheelie * 0.12;
  sim.bike.battery = Math.max(0, sim.bike.battery - drain * dt);
  if (sim.bike.battery <= 0) {
    sim.stalled = true;
    sim.bike.speed *= 1 - 1.6 * dt;
  } else {
    sim.stalled = false;
  }

  setBikeAudio(sim.bike.speed, throttle, sim.bike.wheelie, onRoad);
  setRotorLevel(
    sim.drones.filter((d) => d.airborne).length,
    sim.drones.length,
  );

  for (const p of sim.pickups) {
    if (p.taken) continue;
    if (Math.hypot(sim.bike.x - p.x, sim.bike.z - p.z) < 2.8) collectCell(p, "bike");
  }
  for (const p of sim.pickups) {
    if (p.taken) continue;
    for (const d of sim.drones) {
      if (d.kind !== "utility" && d.kind !== "cargo") continue;
      if (Math.hypot(d.x - sim.bike.x, d.z - sim.bike.z) > 22) continue;
      if (Math.hypot(d.x - p.x, d.z - p.z) < 1.7) {
        collectCell(p, "drone");
        d.battery = Math.min(100, d.battery + 6);
        break;
      }
    }
  }

  if (sim.salvage >= sim.waveNeed && !sim.won) {
    sim.prompt = "Gate is live. Ride the cyan arch and bank.";
    if (Math.hypot(sim.bike.x, sim.bike.z - sim.dropZ) < 7.4) bankWave();
  }

  stepFieldThreats(dt);

  const wx = 34 + Math.sin(sim.time * 0.12) * 16;
  const wz = -130 + Math.cos(sim.time * 0.1) * 22;
  sim.watch.x = wx;
  sim.watch.z = wz;
  sim.watch.yaw = Math.atan2(sim.bike.x - wx, sim.bike.z - wz);
  const toBikeX = sim.bike.x - wx;
  const toBikeZ = sim.bike.z - wz;
  const dist = Math.hypot(toBikeX, toBikeZ);
  const facing =
    -Math.sin(sim.watch.yaw) * (toBikeX / Math.max(dist, 0.01)) +
    -Math.cos(sim.watch.yaw) * (toBikeZ / Math.max(dist, 0.01));
  const inCone = dist < 20 && facing > 0.72;
  if (inCone) sim.watch.suspicion = Math.min(100, sim.watch.suspicion + 8 * dt);
  else sim.watch.suspicion = Math.max(0, sim.watch.suspicion - 12 * dt);
  sim.observed = sim.watch.suspicion >= 88;

  stepBoids(dt);
}

function stepFieldThreats(dt: number) {
  if (sim.wave >= 2 && sim.hostiles.filter((h) => h.alive).length < 3 && sim.time > 6) {
    sim.spawnT += dt;
    if (sim.spawnT > 5.2) {
      spawnHostile();
      const last = sim.hostiles[sim.hostiles.length - 1];
      if (last) {
        last.x = sim.bike.x + (Math.random() > 0.5 ? 20 : -20);
        last.z = sim.bike.z - 16;
        last.y = 4.2;
      }
      sim.spawnT = 0;
    }
  }

  for (const h of sim.hostiles) {
    if (!h.alive) continue;
    const dx = sim.bike.x - h.x;
    const dz = sim.bike.z - h.z;
    const dist = Math.hypot(dx, dz) || 1;
    h.vx += (dx / dist) * 3.2 * dt;
    h.vz += (dz / dist) * 3.2 * dt;
    const sp = Math.hypot(h.vx, h.vz);
    if (sp > 6) {
      h.vx *= 6 / sp;
      h.vz *= 6 / sp;
    }
    h.x += h.vx * dt;
    h.z += h.vz * dt;
    h.yaw = Math.atan2(-h.vx, -h.vz);
    if (dist < 2.4) {
      sim.bike.battery = Math.max(0, sim.bike.battery - 14 * dt);
      sim.prompt = "Contact on you. Guard stance — G — and let the scouts work.";
    }
  }

  const prey = sim.hostiles.filter((h) => h.alive);
  if (sim.stance === "guard" || sim.stance === "escort") {
    const hunters = sim.drones.filter((d) => d.kind === "scout" && d.airborne);
    hunters.forEach((d, i) => {
      if (!prey.length) {
        if (d.task === "intercept" || d.task === "guard") d.task = "form";
        return;
      }
      if (sim.stance === "escort" && i > 1) {
        if (d.task === "intercept") d.task = "form";
        return;
      }
      const tgt = prey[i % prey.length];
      d.task = "intercept";
      d.tx = tgt.x;
      d.ty = tgt.y;
      d.tz = tgt.z;
    });
  }

  for (const h of sim.hostiles) {
    if (!h.alive || h.tagged) continue;
    for (const d of sim.drones) {
      if (!d.airborne) continue;
      if (d.task !== "intercept" && d.task !== "guard") continue;
      if (Math.hypot(d.x - h.x, d.y - h.y, d.z - h.z) < 2.6) {
        h.tagged = true;
        h.alive = false;
        sim.tagged += 1;
        sim.score += 160;
        sim.juice = 0.2;
        sfx("tag");
        sim.prompt = `Contact down. ${sim.tagged} tagged.`;
        break;
      }
    }
  }

  if (sim.stance === "harvest") {
    for (const d of sim.drones) {
      if (d.kind === "utility" || d.kind === "cargo") d.task = "harvest";
    }
  } else if (sim.stance === "escort") {
    for (const d of sim.drones) {
      if (d.task === "harvest") d.task = "form";
    }
  }
}

function finish(win: boolean, score: number) {
  if (scoredLock) return;
  scoredLock = true;
  sim.won = win;
  sim.failed = !win;
  sim.score = Math.max(0, Math.round(score));
  if (win) {
    sfx("win");
    if (sim.mode === "fleet") recordScore(sim.briefing, sim.score);
    if (sim.mode === "field") recordScore("free", sim.score);
  } else sfx("warn");
}

function spawnHostile() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let z = 0;
  if (side === 0) {
    x = -38;
    z = -6 - Math.random() * 28;
  } else if (side === 1) {
    x = 38;
    z = -6 - Math.random() * 28;
  } else if (side === 2) {
    x = (Math.random() - 0.5) * 28;
    z = -46;
  } else {
    x = (Math.random() - 0.5) * 28;
    z = 16;
  }
  const sp = 4.4 + Math.random() * 1.1;
  const dx = 0 - x;
  const dz = -6 - z;
  const dist = Math.hypot(dx, dz) || 1;
  sim.hostiles.push({
    id: sim.hostiles.length,
    x,
    y: 3.8 + Math.random() * 1.4,
    z,
    vx: (dx / dist) * sp,
    vz: (dz / dist) * sp,
    yaw: Math.atan2(-dx, -dz),
    alive: true,
    tagged: false,
  });
}

function stepIntercept(dt: number) {
  const live = sim.hostiles.filter((h) => h.alive).length;
  sim.spawnT += dt;
  if (
    live < 5 &&
    sim.tagged < 6 &&
    !sim.won &&
    !sim.failed &&
    sim.spawnT > 1.8 &&
    sim.hostiles.length < 12
  ) {
    spawnHostile();
    sim.spawnT = 0;
  }

  for (const h of sim.hostiles) {
    if (!h.alive) continue;
    h.x += h.vx * dt;
    h.z += h.vz * dt;
    if (Math.hypot(h.vx, h.vz) > 0.1) h.yaw = Math.atan2(-h.vx, -h.vz);
    if (Math.hypot(h.x, h.z + 6) < 4.4) {
      h.alive = false;
      sim.breaches += 1;
      sim.juice = 0.22;
      sfx("warn");
      sim.prompt = `Breach ${sim.breaches} / 3. Keep them off the pad.`;
      if (sim.breaches >= 3) finish(false, sim.score);
    }
  }

  for (const h of sim.hostiles) {
    if (!h.alive || h.tagged) continue;
    for (const d of sim.drones) {
      if (!d.airborne) continue;
      if (Math.hypot(d.x - h.x, d.y - h.y, d.z - h.z) < 2.5) {
        h.tagged = true;
        h.alive = false;
        sim.tagged += 1;
        sim.score += 180;
        sim.juice = 0.18;
        sfx("collect");
        d.battery = Math.min(100, d.battery + 5);
        sim.prompt = `Contact ${sim.tagged} / 6 tagged.`;
        break;
      }
    }
  }

  const prey = sim.hostiles.filter((h) => h.alive);
  const hunters = sim.drones.filter((d) => d.kind === "scout" && d.airborne);
  if (prey.length && hunters.length) {
    hunters.forEach((d, i) => {
      if (d.task === "recall") return;
      const tgt = prey[i % prey.length];
      d.task = "intercept";
      d.tx = tgt.x;
      d.ty = tgt.y;
      d.tz = tgt.z;
    });
  }

  if (!sim.won && !sim.failed && sim.tagged >= 6) finish(true, sim.score + sim.timer * 5);
}

function stepFleet(dt: number) {
  if (sim.briefing === "intercept") stepIntercept(dt);
  stepBoids(dt);

  if (sim.briefing === "harvest" || sim.briefing === "free") {
    const wx = 18 + Math.sin(sim.time * 0.28) * 16;
    const wz = -22 + Math.cos(sim.time * 0.21) * 14;
    sim.watch.x = wx;
    sim.watch.z = wz;
    const cx = sim.drones.reduce((a, d) => a + d.x, 0) / Math.max(1, sim.drones.length);
    const cz = sim.drones.reduce((a, d) => a + d.z, 0) / Math.max(1, sim.drones.length);
    sim.watch.yaw = Math.atan2(cx - wx, cz - wz);
    const dist = Math.hypot(cx - wx, cz - wz);
    if (dist < 22) sim.watch.suspicion = Math.min(100, sim.watch.suspicion + 16 * dt);
    else sim.watch.suspicion = Math.max(0, sim.watch.suspicion - 7 * dt);
    if (sim.watch.suspicion >= 100) sim.observed = true;
  }

  if (sim.briefing === "harvest" || sim.mode === "fleet") {
    for (const p of sim.pickups) {
      if (p.taken) continue;
      for (const d of sim.drones) {
        if (!(d.kind === "utility" || d.kind === "cargo")) continue;
        if (Math.hypot(d.x - p.x, d.z - p.z) < 1.8 && d.y < 2.4) {
          p.taken = true;
          sim.salvage += 1;
          sim.score += 120;
          sim.juice = 0.18;
          sfx("collect");
          d.battery = Math.min(100, d.battery + 8);
          break;
        }
      }
    }
  }

  if (sim.briefing === "relay") {
    for (const hop of sim.hops) {
      if (hop.online) continue;
      for (const d of sim.drones) {
        if (d.kind !== "relay") continue;
        if (Math.hypot(d.x - hop.x, d.z - hop.z) < 1.6 && d.y < 1.8) {
          hop.online = true;
          d.airborne = false;
          d.task = "form";
          d.x = hop.x;
          d.z = hop.z;
          sim.score += 220;
          sim.juice = 0.22;
          sfx("collect");
          sim.prompt = `Hop ${hop.id + 1} live.`;
        }
      }
    }
  }

  if (sim.briefing === "hunt" && sim.hunt.length) {
    const pad = sim.hunt[sim.huntIndex];
    if (pad) {
      sim.prompt = `Send ${SPECS[pad.kind].label}s to ${pad.id.toUpperCase()}.`;
      let good = 0;
      let bad = 0;
      for (const d of sim.drones) {
        const dist = Math.hypot(d.x - pad.x, d.z - pad.z);
        if (dist < 3.4) {
          if (d.kind === pad.kind) good += 1;
          else bad += 1;
        }
      }
      if (good >= 2) {
        pad.scored = 1;
        sim.score += Math.max(0, 25 + good * 10 - bad * 2);
        sim.huntIndex += 1;
        sim.juice = 0.18;
        sfx("collect");
      }
    }
  }

  if (sim.briefing === "drill") {
    const need = DRILL_SEQUENCE[sim.drillStage];
    if (need) {
      sim.prompt = `Hold ${need} · cohesion ${(sim.cohesion * 100).toFixed(0)}%`;
      if (sim.formation === need && sim.cohesion >= 0.8) {
        sim.drillHold += dt;
        if (sim.drillHold >= 3) {
          sim.drillStage += 1;
          sim.drillHold = 0;
          sim.score += 250;
          sim.juice = 0.18;
          sfx("collect");
        }
      } else {
        sim.drillHold = Math.max(0, sim.drillHold - dt * 0.6);
      }
    }
  }

  if (sim.timer > 0 && sim.briefing !== "free" && !sim.won && !sim.failed) {
    sim.timer = Math.max(0, sim.timer - dt);
    if (sim.timer <= 0) {
      const ok =
        (sim.briefing === "harvest" && sim.salvage >= 6) ||
        (sim.briefing === "drill" && sim.drillStage >= 3) ||
        (sim.briefing === "hunt" && sim.huntIndex >= sim.hunt.length) ||
        (sim.briefing === "relay" && sim.hops.every((h) => h.online)) ||
        (sim.briefing === "intercept" && sim.tagged >= 6);
      finish(ok, sim.score + (ok ? sim.timer : 0));
    }
  }

  if (!sim.won && !sim.failed) {
    if (sim.briefing === "harvest" && sim.salvage >= 6) finish(true, sim.score + sim.timer * 4);
    if (sim.briefing === "drill" && sim.drillStage >= 3) finish(true, sim.score + sim.timer * 5);
    if (sim.briefing === "hunt" && sim.huntIndex >= sim.hunt.length && sim.hunt.length > 0)
      finish(true, sim.score + sim.timer * 6);
    if (sim.briefing === "relay" && sim.hops.length > 0 && sim.hops.every((h) => h.online))
      finish(true, sim.score + sim.timer * 5);
  }

  setRotorLevel(
    sim.drones.filter((d) => d.airborne).length,
    sim.drones.length,
  );
}

let acc = 0;
const FIXED = 1 / 60;

export function stepSim(delta: number) {
  if (sim.paused) {
    setBikeAudio(0, 0, 0, true);
    setRotorLevel(0, 1);
    return;
  }
  const d = Math.min(delta, 0.1);
  sim.time += d;
  sim.juice = Math.max(0, sim.juice - d * 4.2);
  acc += d;
  while (acc >= FIXED) {
    if (sim.mode === "field") stepField(FIXED);
    else if (sim.mode === "fleet") stepFleet(FIXED);
    else if (sim.mode === "hangar" || sim.mode === "library") {
      sim.rally.x = 0;
      sim.rally.z = 0;
      stepBoids(FIXED * 0.35);
    }
    acc -= FIXED;
  }
}

export function attachInput() {
  const down = (e: KeyboardEvent) => {
    keys.add(e.code);
    if (
      e.code === "ArrowUp" ||
      e.code === "ArrowDown" ||
      e.code === "ArrowLeft" ||
      e.code === "ArrowRight" ||
      e.code === "Space"
    ) {
      e.preventDefault();
    }
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  const blur = () => keys.clear();
  window.addEventListener("keydown", down, { passive: false });
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", blur);
    keys.clear();
  };
}

export function bindControlsTest() {
  window.__controlsTest = {
    getYaw: () => sim.getYaw(),
    getSpeed: () => sim.getSpeed(),
    setSteer: (v) => sim.setSteer(v),
    setKeys: (codes) => sim.setKeys(codes),
    getFleet: () => ({
      mode: sim.mode,
      paused: sim.paused,
      n: sim.drones.length,
      air: sim.drones.filter((d) => d.airborne).length,
      x: sim.drones[0]?.x,
      y: sim.drones[0]?.y,
      z: sim.drones[0]?.z,
      task: sim.drones[0]?.task,
      cohesion: sim.cohesion,
      rally: { ...sim.rally },
      briefing: sim.briefing,
    }),
    getField: () => ({
      x: sim.bike.x,
      z: sim.bike.z,
      speed: sim.bike.speed,
      yaw: sim.bike.yaw,
      steer: sim.bike.steer,
      salvage: sim.salvage,
      wave: sim.wave,
    }),
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
      getFleet?: () => {
        mode: string;
        paused: boolean;
        n: number;
        air: number;
        x: number;
        y: number;
        z: number;
        task: string;
        cohesion: number;
        rally: { x: number; z: number };
        briefing: string;
      };
      getField?: () => {
        x: number;
        z: number;
        speed: number;
        yaw: number;
        steer: number;
        salvage: number;
        wave: number;
      };
    };
  }
}
