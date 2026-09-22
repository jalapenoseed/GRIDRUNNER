import { create } from "zustand";
import { setVolumes } from "./audio";
import { unlockAudio } from "./audio";
import { loadSave, writeSave } from "./save";
import { sim } from "./sim";
import {
  CAM_VIEWS,
  FOCUSES,
  STANCES,
  type Briefing,
  type CamView,
  type EscortStance,
  type Focus,
  type Formation,
  type Mode,
  type Sensor,
} from "./types";

export type GameStore = {
  mode: Mode;
  playing: boolean;
  paused: boolean;
  showDream: boolean;
  showHelp: boolean;
  showIntro: boolean;
  formation: Formation;
  boids: boolean;
  sensor: Sensor;
  libraryId: string;
  fleetCount: number;
  briefing: Briefing;
  focus: Focus;
  camView: CamView;
  stance: EscortStance;
  volMaster: number;
  volSfx: number;
  volMusic: number;
  best: Partial<Record<Briefing, number>>;
  setMode: (mode: Mode) => void;
  play: (mode: Mode, briefing?: Briefing) => void;
  hangar: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  toggleDream: () => void;
  toggleHelp: () => void;
  setFormation: (formation: Formation) => void;
  toggleBoids: () => void;
  cycleSensor: () => void;
  setSensor: (sensor: Sensor) => void;
  setLibraryId: (libraryId: string) => void;
  setFleetCount: (n: number) => void;
  setBriefing: (briefing: Briefing) => void;
  setFocus: (focus: Focus) => void;
  cycleFocus: () => void;
  launch: () => void;
  recall: () => void;
  harvest: () => void;
  hop: () => void;
  setCamView: (cam: CamView) => void;
  cycleCam: () => void;
  setStance: (stance: EscortStance) => void;
  cycleStance: () => void;
  setVolume: (bus: "master" | "sfx" | "music", value: number) => void;
  dismissIntro: () => void;
  replayIntro: () => void;
};

const SENSORS: Sensor[] = ["off", "thermal", "uv", "nv"];
const saved =
  typeof window !== "undefined"
    ? loadSave()
    : {
        best: {},
        lastSize: 16,
        lastBriefing: "harvest" as Briefing,
        seenIntro: false,
        cam: "chase" as CamView,
        volMaster: 0.78,
        volSfx: 0.8,
        volMusic: 0.5,
      };

if (typeof window !== "undefined") {
  setVolumes({
    master: saved.volMaster ?? 0.78,
    sfx: saved.volSfx ?? 0.8,
    music: saved.volMusic ?? 0.5,
  });
  sim.cam = saved.cam ?? "chase";
}

export const useGame = create<GameStore>((set, get) => ({
  mode: "hangar",
  playing: false,
  paused: false,
  showDream: false,
  showHelp: true,
  showIntro: !(saved.seenIntro ?? false),
  formation: "wedge",
  boids: true,
  sensor: "off",
  libraryId: "scout",
  fleetCount: saved.lastSize ?? 16,
  briefing: saved.lastBriefing ?? "harvest",
  focus: "all",
  camView: saved.cam ?? "chase",
  stance: "escort",
  volMaster: saved.volMaster ?? 0.78,
  volSfx: saved.volSfx ?? 0.8,
  volMusic: saved.volMusic ?? 0.5,
  best: saved.best ?? {},
  setMode: (mode) => set({ mode }),
  play: (mode, briefing) => {
    unlockAudio();
    const brief = briefing ?? get().briefing;
    const count = get().fleetCount;
    sim.mode = mode;
    sim.formation = get().formation;
    sim.boids = get().boids;
    sim.focus = "all";
    sim.cam = get().camView;
    sim.stance = "escort";
    if (mode === "field") sim.resetField();
    if (mode === "fleet") {
      sim.resetFleet(count, brief);
      writeSave({ lastSize: count, lastBriefing: brief });
    }
    set({
      mode,
      briefing: brief,
      focus: "all",
      stance: "escort",
      playing: mode === "field" || mode === "fleet",
      paused: false,
      showHelp: false,
      showDream: false,
      showIntro: false,
    });
  },
  hangar: () => {
    sim.resetFleet(4, "free");
    sim.mode = "hangar";
    set({
      mode: "hangar",
      playing: false,
      paused: false,
      showHelp: true,
      sensor: "off",
      focus: "all",
      stance: "escort",
      best: loadSave().best,
    });
  },
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (paused) => set({ paused }),
  toggleDream: () => set((s) => ({ showDream: !s.showDream })),
  toggleHelp: () => set((s) => ({ showHelp: !s.showHelp })),
  setFormation: (formation) => {
    sim.formation = formation;
    set({ formation });
  },
  toggleBoids: () =>
    set((s) => {
      sim.boids = !s.boids;
      return { boids: !s.boids };
    }),
  cycleSensor: () =>
    set((s) => ({ sensor: SENSORS[(SENSORS.indexOf(s.sensor) + 1) % SENSORS.length] })),
  setSensor: (sensor) => set({ sensor }),
  setLibraryId: (libraryId) => set({ libraryId, mode: "library", playing: false, showHelp: false, showIntro: false }),
  setFleetCount: (n) => {
    writeSave({ lastSize: n });
    set({ fleetCount: n });
  },
  setBriefing: (briefing) => {
    writeSave({ lastBriefing: briefing });
    set({ briefing });
  },
  setFocus: (focus) => {
    sim.setFocus(focus);
    set({ focus });
  },
  cycleFocus: () => {
    const cur = get().focus;
    const next = FOCUSES[(FOCUSES.indexOf(cur) + 1) % FOCUSES.length];
    sim.setFocus(next);
    set({ focus: next });
  },
  launch: () => sim.launch(),
  recall: () => sim.recall(),
  harvest: () => sim.setOp("harvest"),
  hop: () => sim.setOp("relay"),
  setCamView: (cam) => {
    sim.setCam(cam);
    writeSave({ cam });
    set({ camView: cam });
  },
  cycleCam: () => {
    const next = sim.cycleCam();
    writeSave({ cam: next });
    set({ camView: next });
    return next;
  },
  setStance: (stance) => {
    sim.setStance(stance);
    set({ stance });
  },
  cycleStance: () => {
    const cur = get().stance;
    const next = STANCES[(STANCES.indexOf(cur) + 1) % STANCES.length];
    sim.setStance(next);
    set({ stance: next });
  },
  setVolume: (bus, value) => {
    const v = Math.max(0, Math.min(1, value));
    const patch =
      bus === "master"
        ? { volMaster: v }
        : bus === "sfx"
          ? { volSfx: v }
          : { volMusic: v };
    writeSave(patch);
    const next = { ...get(), ...patch };
    setVolumes({ master: next.volMaster, sfx: next.volSfx, music: next.volMusic });
    set(patch);
  },
  dismissIntro: () => {
    writeSave({ seenIntro: true });
    set({ showIntro: false });
  },
  replayIntro: () => {
    set({ showIntro: true, showHelp: true, playing: false, paused: false, mode: "hangar" });
    sim.mode = "hangar";
  },
}));
