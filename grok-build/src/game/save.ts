import type { Briefing, CamView } from "./types";

const KEY = "gridrunner.ops.v2";
const SAVE_VERSION = 2;

export type OpsSave = {
  version: number;
  best: Partial<Record<Briefing, number>>;
  lastSize: number;
  lastBriefing: Briefing;
  seenIntro: boolean;
  cam: CamView;
  volMaster: number;
  volSfx: number;
  volMusic: number;
};

const DEFAULTS: OpsSave = {
  version: SAVE_VERSION,
  best: {},
  lastSize: 16,
  lastBriefing: "harvest",
  seenIntro: false,
  cam: "chase",
  volMaster: 0.7,
  volSfx: 0.75,
  volMusic: 0.45,
};

function migrate(raw: Partial<OpsSave>): OpsSave {
  const s = { ...DEFAULTS, ...raw, best: { ...DEFAULTS.best, ...raw.best } };
  s.version = SAVE_VERSION;
  if (![6, 16, 24].includes(s.lastSize)) s.lastSize = 16;
  return s;
}

export function loadSave(): OpsSave {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("gridrunner.ops.v1");
    if (!raw) return { ...DEFAULTS, best: {} };
    return migrate(JSON.parse(raw) as Partial<OpsSave>);
  } catch {
    return { ...DEFAULTS, best: {} };
  }
}

export function writeSave(patch: Partial<OpsSave>) {
  try {
    const next = migrate({ ...loadSave(), ...patch });
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadSave();
  }
}

export function recordScore(briefing: Briefing, score: number) {
  const cur = loadSave();
  const best = { ...cur.best };
  best[briefing] = Math.max(best[briefing] ?? 0, Math.round(score));
  return writeSave({ best });
}
