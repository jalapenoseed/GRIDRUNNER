import { create } from "zustand";
import { unlockAudio } from "./audio";
import { loadSave, writeSave } from "./save";
import { sim } from "./sim";
import { FOCUSES, type Briefing, type Focus, type Formation, type Mode, type Sensor } from "./types";

export type GameStore = {
  mode: Mode;
  playing: boolean;
  paused: boolean;
  showDream: boolean;
  showHelp: boolean;
  formation: Formation;
  boids: boolean;
  sensor: Sensor;
  libraryId: string;
  fleetCount: number;
  briefing: Briefing;
  focus: Focus;
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
};

const SENSORS: Sensor[] = ["off", "thermal", "uv", "nv"];
const saved =
  typeof window !== "undefined"
    ? loadSave()
    : { best: {}, lastSize: 16, lastBriefing: "harvest" as Briefing };

export const useGame = create<GameStore>((set, get) => ({
  mode: "hangar",
  playing: false,
  paused: false,
  showDream: false,
  showHelp: true,
  formation: "wedge",
  boids: true,
  sensor: "off",
  libraryId: "scout",
  fleetCount: saved.lastSize ?? 16,
  briefing: saved.lastBriefing ?? "harvest",
  focus: "all",
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
    if (mode === "field") sim.resetField();
    if (mode === "fleet") {
      sim.resetFleet(count, brief);
      writeSave({ lastSize: count, lastBriefing: brief });
    }
    set({
      mode,
      briefing: brief,
      focus: "all",
      playing: mode === "field" || mode === "fleet",
      paused: false,
      showHelp: false,
      showDream: false,
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
  setLibraryId: (libraryId) => set({ libraryId, mode: "library", playing: false, showHelp: false }),
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
}));
