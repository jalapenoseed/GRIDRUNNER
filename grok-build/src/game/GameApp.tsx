import { useEffect, useState, type ComponentType } from "react";
import { setVolumes, unlockAudio } from "./audio";
import { Overlay } from "./overlay";
import { attachInput, bindControlsTest, sim } from "./sim";
import { useGame } from "./store";
import { FORMATIONS, SPELLS } from "./types";
import type { Mode } from "./types";

export function GameApp() {
  const [CanvasRoot, setCanvasRoot] = useState<ComponentType<{ mode: Mode }> | null>(null);
  const mode = useGame((s) => s.mode);
  const playing = useGame((s) => s.playing);
  const hangar = useGame((s) => s.hangar);
  const togglePause = useGame((s) => s.togglePause);
  const setFormation = useGame((s) => s.setFormation);
  const toggleBoids = useGame((s) => s.toggleBoids);
  const cycleSensor = useGame((s) => s.cycleSensor);
  const toggleDream = useGame((s) => s.toggleDream);
  const paused = useGame((s) => s.paused);
  const launch = useGame((s) => s.launch);
  const recall = useGame((s) => s.recall);
  const harvest = useGame((s) => s.harvest);
  const hop = useGame((s) => s.hop);
  const cycleFocus = useGame((s) => s.cycleFocus);
  const cycleCam = useGame((s) => s.cycleCam);
  const cycleStance = useGame((s) => s.cycleStance);
  const volMaster = useGame((s) => s.volMaster);
  const volSfx = useGame((s) => s.volSfx);
  const volMusic = useGame((s) => s.volMusic);
  const showIntro = useGame((s) => s.showIntro);

  useEffect(() => {
    void import("./CanvasRoot").then((m) => setCanvasRoot(() => m.CanvasRoot));
  }, []);

  useEffect(() => attachInput(), []);

  useEffect(() => {
    bindControlsTest();
  }, []);

  useEffect(() => {
    setVolumes({ master: volMaster, sfx: volSfx, music: volMusic });
  }, [volMaster, volSfx, volMusic]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const vis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (showIntro) return;
      if (e.code === "Escape") {
        if (playing) togglePause();
        else hangar();
      }
      if (e.code === "KeyH") toggleDream();
      if (e.code === "KeyK") cycleSensor();
      if (e.code === "KeyB") toggleBoids();
      if (e.code === "KeyV") cycleFocus();
      if (e.code === "KeyC") cycleCam();
      if (e.code === "KeyG" && (mode === "field" || mode === "fleet")) cycleStance();
      if (e.code === "Space" && playing && mode === "fleet") {
        e.preventDefault();
        if (sim.drones.some((d) => d.airborne)) recall();
        else launch();
      }
      if (e.code === "KeyL") recall();
      if (e.code === "KeyF") harvest();
      if (e.code === "KeyR" && mode === "fleet") hop();
      const idx = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(e.code);
      if (idx >= 0) setFormation(FORMATIONS[idx]);
      const sp = ["Digit6", "Digit7", "Digit8"].indexOf(e.code);
      if (sp >= 0) setFormation(SPELLS[sp]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    playing,
    togglePause,
    hangar,
    toggleDream,
    cycleSensor,
    toggleBoids,
    setFormation,
    launch,
    recall,
    harvest,
    hop,
    cycleFocus,
    cycleCam,
    cycleStance,
    mode,
    showIntro,
  ]);

  useEffect(() => {
    sim.paused = paused;
  }, [paused]);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      {CanvasRoot ? (
        <div className="absolute inset-0 touch-none">
          <CanvasRoot key={mode} mode={mode} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-bg" />
      )}
      <Overlay />
    </main>
  );
}
