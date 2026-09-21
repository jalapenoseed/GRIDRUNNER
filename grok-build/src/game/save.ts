import type { Briefing } from "./types";

const KEY = "gridrunner.ops.v1";
const SAVE_VERSION = 1;

export type OpsSave = {
  version: number;
  best: Partial<Record<Briefing, number>>;
  lastSize: number;
  lastBriefing: Briefing;
};

const DEFAULTS: OpsSave = {
  version: SAVE_VERSION,
  best: {},
  lastSize: 16,
  lastBriefing: "harvest",
};

function migrate(raw: OpsSave): OpsSave {
  const s = { ...DEFAULTS, ...raw, best: { ...DEFAULTS.best, ...raw.best } };
  s.version = SAVE_VERSION;
  if (![6, 16, 24].includes(s.lastSize)) s.lastSize = 16;
  return s;
}

export function loadSave(): OpsSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, best: {} };
    return migrate(JSON.parse(raw) as OpsSave);
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
