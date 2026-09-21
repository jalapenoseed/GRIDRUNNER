import { useEffect, useState, type PointerEvent } from "react";
import {
  Crosshair,
  Minus,
  Pause,
  Plus,
  Radio,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATALOG, catalogById } from "./catalog";
import { briefingDef, BRIEFING_DEFS } from "./ops";
import { sim } from "./sim";
import { fleetCam } from "./cam";
import { useGame } from "./store";
import { FLEET_SIZES, FOCUSES, FORMATIONS, type Briefing } from "./types";
import { cn } from "@/lib/utils";

export function Overlay() {
  const mode = useGame((s) => s.mode);
  const playing = useGame((s) => s.playing);
  const paused = useGame((s) => s.paused);
  const showHelp = useGame((s) => s.showHelp);
  const showDream = useGame((s) => s.showDream);

  return (
    <div className="pointer-events-none absolute inset-0 text-fg">
      {mode === "hangar" && showHelp && <HangarMenu />}
      {mode === "library" && <LibraryPanel />}
      {mode === "field" && playing && <FieldHud />}
      {mode === "fleet" && playing && <FleetHud />}
      {paused && playing && <PauseMenu />}
      {showDream && <DreamPanel />}
      <TopBar />
      {mode === "field" && <TouchPad />}
      {mode === "fleet" && playing && !paused && <FleetTouch />}
      <SensorWash />
    </div>
  );
}

function TopBar() {
  const mode = useGame((s) => s.mode);
  const hangar = useGame((s) => s.hangar);
  const toggleDream = useGame((s) => s.toggleDream);
  const togglePause = useGame((s) => s.togglePause);
  const playing = useGame((s) => s.playing);
  const briefing = useGame((s) => s.briefing);

  return (
    <div className="pointer-events-auto absolute top-0 right-0 left-0 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="hud-panel rounded-[var(--radius-lg)] px-3 py-2">
        <p className="font-display text-lg leading-none tracking-[0.18em] text-fg md:text-2xl">
          GRIDRUNNER
        </p>
        {mode !== "hangar" && (
          <p className="mt-1 text-[10px] tracking-[0.22em] text-muted uppercase">
            {mode === "field"
              ? "Field Run"
              : mode === "fleet"
                ? briefingDef(briefing).title
                : "Asset Library"}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={toggleDream}>
          Dream
        </Button>
        {playing && (
          <Button variant="secondary" size="sm" onClick={togglePause} aria-label="Pause">
            <Pause className="size-4" />
          </Button>
        )}
        {mode !== "hangar" && (
          <Button variant="secondary" size="sm" onClick={hangar}>
            Hangar
          </Button>
        )}
      </div>
    </div>
  );
}

function HangarMenu() {
  const play = useGame((s) => s.play);
  const setLibraryId = useGame((s) => s.setLibraryId);
  const briefing = useGame((s) => s.briefing);
  const setBriefing = useGame((s) => s.setBriefing);
  const fleetCount = useGame((s) => s.fleetCount);
  const setFleetCount = useGame((s) => s.setFleetCount);
  const best = useGame((s) => s.best);
  const def = briefingDef(briefing);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 max-h-[72%] overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:max-w-xl">
      <div className="hud-panel rounded-[var(--radius-xl)] p-4 md:p-6">
        <p className="text-[10px] tracking-[0.24em] text-muted uppercase">Night operations</p>
        <h1 className="font-display mt-1 text-3xl leading-none tracking-wide md:text-4xl">
          Fleet on the line.
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Two games, one yard. Fleet Commander runs the airframes. Field Run rides the grid —
          three salvage waves, bank the cyan gates.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {BRIEFING_DEFS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBriefing(b.id)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-2 text-left text-xs tracking-wide uppercase",
                briefing === b.id
                  ? "border-fg bg-fg text-accent-fg"
                  : "border-border bg-surface text-muted",
              )}
            >
              {b.title}
              {best[b.id] ? (
                <span className="mt-0.5 block text-[10px] tracking-normal normal-case opacity-70">
                  best {best[b.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-subtle">{def.blurb}</p>

        <div className="mt-3 flex items-center gap-2">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Roster</p>
          {FLEET_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setFleetCount(n)}
              className={cn(
                "size-10 rounded-[var(--radius-sm)] border text-sm tabular-nums",
                fleetCount === n
                  ? "border-fg bg-fg text-accent-fg"
                  : "border-border bg-surface text-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => play("fleet", briefing)}>
            Engage Fleet
          </Button>
          <Button size="lg" variant="secondary" onClick={() => play("field")}>
            Start Field Run
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setLibraryId("scout")}>
            Library
          </Button>
        </div>
        <p className="mt-3 text-xs text-subtle">
          Tap yard to rally · V filter airframe · 1–5 formations · Space launch · L recall · F
          harvest · R hop · WASD ride
        </p>
      </div>
    </div>
  );
}

function useHud() {
  const [hud, setHud] = useState(() => sim.getHud());
  useEffect(() => {
    const id = window.setInterval(() => setHud(sim.getHud()), 80);
    return () => window.clearInterval(id);
  }, []);
  return hud;
}

function FieldHud() {
  const hud = useHud();
  const formation = useGame((s) => s.formation);
  const boids = useGame((s) => s.boids);
  const setFormation = useGame((s) => s.setFormation);
  const toggleBoids = useGame((s) => s.toggleBoids);
  const cycleSensor = useGame((s) => s.cycleSensor);
  const sensor = useGame((s) => s.sensor);

  return (
    <>
      <div className="pointer-events-none absolute top-20 left-3 space-y-2 md:top-24 md:left-4">
        <div className="hud-panel w-40 rounded-[var(--radius-md)] p-2.5 md:w-52 md:p-3">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Battery</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full", hud.battery < 20 ? "bg-danger" : "bg-beacon")}
              style={{ width: `${hud.battery}%` }}
            />
          </div>
          <p className="mt-1 font-display text-lg tabular-nums">{hud.battery.toFixed(0)}%</p>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-muted uppercase">Speed</p>
          <p className="font-display text-lg tabular-nums">
            {(Math.abs(hud.speed) * 4.2).toFixed(0)}
            <span className="ml-1 text-xs tracking-wide text-subtle">km/h</span>
          </p>
        </div>
        <div className="hud-panel rounded-[var(--radius-md)] p-2.5 md:p-3">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
            Wave {hud.wave} / 3
          </p>
          <p className="font-display text-2xl tabular-nums">
            {hud.salvage} / {hud.waveNeed}
          </p>
          <p className="mt-1 text-xs leading-snug text-subtle">{hud.prompt}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute top-20 right-3 text-right md:top-24 md:right-4">
        {hud.suspicion > 4 && (
          <div className="hud-panel rounded-[var(--radius-md)] px-3 py-2">
            <p className="text-[10px] tracking-[0.2em] text-danger uppercase">WATCH-01</p>
            <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-danger" style={{ width: `${hud.suspicion}%` }} />
            </div>
          </div>
        )}
      </div>

      <FormationDock
        formation={formation}
        boids={boids}
        sensor={sensor}
        onFormation={setFormation}
        onBoids={toggleBoids}
        onSensor={cycleSensor}
      />

      {hud.won && (
        <CenterCard
          title="Substation live"
          body={`Three waves banked. Score ${hud.score}. The northern feed can take the next hop.`}
          action="Return to hangar"
          restart
        />
      )}
      {hud.stalled && !hud.won && (
        <CenterCard title="Stalled" body="Battery empty. Sweep a salvage cell or limp home." restart />
      )}
      {hud.observed && !hud.won && (
        <CenterCard title="Observed" body="WATCH-01 logged the bike. Ride on — this prototype does not fire." />
      )}
    </>
  );
}

function FleetHud() {
  const hud = useHud();
  const formation = useGame((s) => s.formation);
  const boids = useGame((s) => s.boids);
  const setFormation = useGame((s) => s.setFormation);
  const toggleBoids = useGame((s) => s.toggleBoids);
  const cycleSensor = useGame((s) => s.cycleSensor);
  const sensor = useGame((s) => s.sensor);
  const launch = useGame((s) => s.launch);
  const recall = useGame((s) => s.recall);
  const harvest = useGame((s) => s.harvest);
  const hop = useGame((s) => s.hop);
  const play = useGame((s) => s.play);
  const briefing = useGame((s) => s.briefing);
  const focus = useGame((s) => s.focus);
  const setFocus = useGame((s) => s.setFocus);
  const def = briefingDef(briefing as Briefing);

  return (
    <>
      <div className="pointer-events-none absolute top-20 left-3 space-y-2 md:top-24">
        <div className="hud-panel w-44 rounded-[var(--radius-md)] p-2.5 md:w-52">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Air</p>
            <p className="font-display text-xl tabular-nums leading-none">
              {hud.airborne}/{hud.fleet}
            </p>
          </div>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-muted uppercase">Cohesion</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full", hud.cohesion >= 0.8 ? "bg-beacon" : "bg-amber")}
              style={{ width: `${Math.round(hud.cohesion * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] tracking-[0.2em] text-muted uppercase">Battery</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full", hud.battery < 20 ? "bg-danger" : "bg-beacon")}
              style={{ width: `${hud.battery}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-snug text-subtle">{hud.prompt}</p>
          {briefing === "intercept" && (
            <p className="mt-2 text-[10px] tracking-[0.2em] text-danger uppercase">
              Breach {hud.breaches} / 3
            </p>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute top-20 right-3 text-right md:top-24">
        <div className="hud-panel rounded-[var(--radius-md)] px-3 py-2">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Score</p>
          <p className="font-display text-3xl tabular-nums leading-none">{hud.score}</p>
          {hud.timer > 0 && (
            <p className="mt-1 font-display text-lg tabular-nums text-muted">
              {fmtTime(hud.timer)}
            </p>
          )}
          <p className="mt-1 text-[11px] text-subtle">{hud.goal}</p>
        </div>
        {hud.suspicion > 4 && (
          <div className="hud-panel mt-2 rounded-[var(--radius-md)] px-3 py-2">
            <p className="text-[10px] tracking-[0.2em] text-danger uppercase">WATCH-01</p>
            <div className="mt-1 ml-auto h-1 w-24 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full bg-danger" style={{ width: `${hud.suspicion}%` }} />
            </div>
          </div>
        )}
        <Radar />
      </div>

      <div className="pointer-events-auto absolute right-3 bottom-36 hidden flex-col gap-2 md:bottom-40 md:flex">
        <ZoomBtns />
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(100%-1rem,42rem)] -translate-x-1/2 pb-[max(0px,env(safe-area-inset-bottom))]">
        <div className="hud-panel rounded-[var(--radius-xl)] px-2 py-2 md:px-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {FORMATIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFormation(f)}
                className={cn(
                  "min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide uppercase",
                  formation === f ? "bg-fg text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {f}
              </button>
            ))}
            <button
              onClick={toggleBoids}
              className={cn(
                "min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide uppercase",
                boids ? "text-beacon" : "text-muted",
              )}
            >
              Boids {boids ? "on" : "off"}
            </button>
            <button
              onClick={cycleSensor}
              className="min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide text-muted uppercase hover:text-fg"
            >
              {sensor === "off" ? "Sensors" : sensor}
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
            {FOCUSES.map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={cn(
                  "min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide uppercase",
                  focus === f ? "bg-fg text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
            <Button size="sm" onClick={launch}>
              Launch
            </Button>
            <Button size="sm" variant="secondary" onClick={recall}>
              Recall
            </Button>
            {(briefing === "harvest" || briefing === "free") && (
              <Button size="sm" variant="secondary" onClick={harvest}>
                Harvest
              </Button>
            )}
            {(briefing === "relay" || briefing === "free") && (
              <Button size="sm" variant="secondary" onClick={hop}>
                <Radio className="size-3.5" />
                Hop
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => play("fleet", briefing)}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {hud.won && (
        <CenterCard
          title={def.win}
          body={`Score ${hud.score}. ${def.blurb}`}
          action="Return to hangar"
          restart
        />
      )}
      {hud.failed && !hud.won && (
        <CenterCard
          title={briefing === "intercept" ? "Pad breached" : "Clock expired"}
          body={`Score ${hud.score}. Reset from the dock or return to hangar.`}
          restart
        />
      )}
    </>
  );
}

function fmtTime(t: number) {
  const s = Math.max(0, Math.ceil(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function ZoomBtns() {
  return (
    <>
      <button
        aria-label="Zoom in"
        className="hud-panel flex size-11 items-center justify-center rounded-[var(--radius-md)]"
        onClick={() => fleetCam.zoomBy(1)}
      >
        <Plus className="size-4" />
      </button>
      <button
        aria-label="Zoom out"
        className="hud-panel flex size-11 items-center justify-center rounded-[var(--radius-md)]"
        onClick={() => fleetCam.zoomBy(-1)}
      >
        <Minus className="size-4" />
      </button>
    </>
  );
}

function Radar() {
  const [hud, setHud] = useState(() => sim.getHud());
  useEffect(() => {
    const id = window.setInterval(() => setHud(sim.getHud()), 120);
    return () => window.clearInterval(id);
  }, []);
  const scale = 1.6;
  const dots = sim.drones.slice(0, 24).map((d) => ({
    x: 40 + (d.x - hud.rallyX) * scale * 0.35,
    y: 40 + (d.z - hud.rallyZ) * scale * 0.35,
    kind: d.kind,
  }));
  const foes = sim.hostiles
    .filter((h) => h.alive)
    .map((h) => ({
      x: 40 + (h.x - hud.rallyX) * scale * 0.35,
      y: 40 + (h.z - hud.rallyZ) * scale * 0.35,
    }));
  return (
    <div className="hud-panel mt-2 hidden size-24 overflow-hidden rounded-[var(--radius-md)] md:block">
      <svg viewBox="0 0 80 80" className="size-full">
        <circle cx="40" cy="40" r="38" fill="transparent" stroke="currentColor" className="text-border" />
        <circle cx="40" cy="40" r="3" className="fill-amber" />
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={Math.max(4, Math.min(76, d.x))}
            cy={Math.max(4, Math.min(76, d.y))}
            r="2.2"
            className={
              d.kind === "scout"
                ? "fill-beacon"
                : d.kind === "relay"
                  ? "fill-accent"
                  : d.kind === "utility"
                    ? "fill-amber"
                    : "fill-lime"
            }
          />
        ))}
        {foes.map((h, i) => (
          <circle
            key={`h-${i}`}
            cx={Math.max(4, Math.min(76, h.x))}
            cy={Math.max(4, Math.min(76, h.y))}
            r="2.4"
            className="fill-danger"
          />
        ))}
      </svg>
    </div>
  );
}

function FormationDock({
  formation,
  boids,
  sensor,
  onFormation,
  onBoids,
  onSensor,
}: {
  formation: string;
  boids: boolean;
  sensor: string;
  onFormation: (f: (typeof FORMATIONS)[number]) => void;
  onBoids: () => void;
  onSensor: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(100%-1.5rem,42rem)] -translate-x-1/2 pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="hud-panel flex flex-wrap items-center justify-center gap-2 rounded-[var(--radius-xl)] px-3 py-2">
        {FORMATIONS.map((f) => (
          <button
            key={f}
            onClick={() => onFormation(f)}
            className={cn(
              "min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide uppercase",
              formation === f ? "bg-fg text-accent-fg" : "text-muted hover:text-fg",
            )}
          >
            {f}
          </button>
        ))}
        <button
          onClick={onBoids}
          className={cn(
            "min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide uppercase",
            boids ? "text-beacon" : "text-muted",
          )}
        >
          Boids {boids ? "on" : "off"}
        </button>
        <button
          onClick={onSensor}
          className="min-h-10 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs tracking-wide text-muted uppercase hover:text-fg"
        >
          {sensor === "off" ? "Sensors" : sensor}
        </button>
      </div>
    </div>
  );
}

function CenterCard({
  title,
  body,
  action,
  restart,
}: {
  title: string;
  body: string;
  action?: string;
  restart?: boolean;
}) {
  const hangar = useGame((s) => s.hangar);
  const play = useGame((s) => s.play);
  const mode = useGame((s) => s.mode);
  const briefing = useGame((s) => s.briefing);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/50 p-4">
      <div className="hud-panel max-w-sm rounded-[var(--radius-xl)] p-6">
        <h2 className="font-display text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-4 flex flex-col gap-2">
          {restart && (
            <Button onClick={() => (mode === "fleet" ? play("fleet", briefing) : play(mode))}>
              <RotateCcw className="size-4" />
              Run it again
            </Button>
          )}
          {action && (
            <Button variant={restart ? "secondary" : "primary"} onClick={hangar}>
              {action}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PauseMenu() {
  const togglePause = useGame((s) => s.togglePause);
  const hangar = useGame((s) => s.hangar);
  const play = useGame((s) => s.play);
  const mode = useGame((s) => s.mode);
  const briefing = useGame((s) => s.briefing);
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-bg/60 p-4">
      <div className="hud-panel w-full max-w-sm rounded-[var(--radius-xl)] p-6">
        <h2 className="font-display text-3xl">Paused</h2>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={togglePause}>Resume</Button>
          <Button
            variant="secondary"
            onClick={() => (mode === "fleet" ? play("fleet", briefing) : play(mode))}
          >
            <RotateCcw className="size-4" />
            Restart
          </Button>
          <Button variant="ghost" onClick={hangar}>
            Hangar
          </Button>
        </div>
      </div>
    </div>
  );
}

function DreamPanel() {
  const mode = useGame((s) => s.mode);
  const toggleDream = useGame((s) => s.toggleDream);
  const src =
    mode === "fleet"
      ? "/assets/targets/fleet-ops-sm.jpg"
      : mode === "hangar"
        ? "/assets/targets/hangar-ops-sm.jpg"
        : "/assets/targets/field-sm.jpg";
  return (
    <div className="pointer-events-auto absolute top-20 right-4 z-10 w-[min(100%-2rem,20rem)]">
      <div className="hud-panel overflow-hidden rounded-[var(--radius-lg)]">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Dream target</p>
          <button onClick={toggleDream} aria-label="Close dream" className="text-muted">
            <X className="size-4" />
          </button>
        </div>
        <img
          src={src}
          alt="Dream Loop target screenshot"
          className="aspect-video w-full object-cover"
          crossOrigin="anonymous"
        />
        <p className="p-3 text-xs leading-relaxed text-muted">
          Target frame first, then match it in-engine. This demo borrows Fleet Commander ops —
          launch, rally, drill, hunt, harvest — without touching the original project.
        </p>
      </div>
    </div>
  );
}

function LibraryPanel() {
  const libraryId = useGame((s) => s.libraryId);
  const setLibraryId = useGame((s) => s.setLibraryId);
  const item = catalogById(libraryId);
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="hud-panel mx-auto max-w-5xl rounded-[var(--radius-xl)] p-3 md:p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{item.kind}</p>
            <h2 className="font-display text-3xl">{item.title}</h2>
            <p className="text-sm text-muted">{item.role}</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle">{item.notes}</p>
          </div>
          <img
            src={item.still}
            alt=""
            className="hidden h-28 w-28 rounded-[var(--radius-md)] object-cover md:block"
            crossOrigin="anonymous"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CATALOG.map((c) => (
            <button
              key={c.id}
              onClick={() => setLibraryId(c.id)}
              className={cn(
                "shrink-0 rounded-[var(--radius-md)] border px-3 py-2 text-left text-xs",
                c.id === libraryId
                  ? "border-fg bg-fg text-accent-fg"
                  : "border-border bg-surface text-muted",
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SensorWash() {
  const sensor = useGame((s) => s.sensor);
  if (sensor === "off") return null;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        sensor === "thermal" && "sensor-thermal",
        sensor === "uv" && "sensor-uv",
        sensor === "nv" && "sensor-nv",
      )}
    />
  );
}

function TouchPad() {
  const playing = useGame((s) => s.playing);
  const paused = useGame((s) => s.paused);
  if (!playing || paused) return null;
  return (
    <div className="pointer-events-auto absolute bottom-24 left-3 md:hidden">
      <Stick />
    </div>
  );
}

function FleetTouch() {
  return (
    <div className="pointer-events-auto absolute right-3 bottom-36 flex flex-col gap-2 md:hidden">
      <ZoomBtns />
      <div className="hud-panel flex size-11 items-center justify-center rounded-[var(--radius-md)]">
        <Crosshair className="size-4 text-muted" />
      </div>
    </div>
  );
}

function Stick() {
  const [active, setActive] = useState({ x: 0, y: 0 });
  return (
    <div
      className="relative size-28 rounded-full border border-border bg-surface/80"
      onPointerDown={(e) => {
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        nudge(e, setActive);
      }}
      onPointerMove={(e) => {
        if (e.buttons) nudge(e, setActive);
      }}
      onPointerUp={() => {
        setActive({ x: 0, y: 0 });
        sim.setTouch(0, 0);
      }}
      onPointerCancel={() => {
        setActive({ x: 0, y: 0 });
        sim.setTouch(0, 0);
      }}
    >
      <div
        className="absolute top-1/2 left-1/2 size-10 rounded-full bg-fg/80"
        style={{
          transform: `translate(calc(-50% + ${active.x * 36}px), calc(-50% + ${active.y * 36}px))`,
        }}
      />
    </div>
  );
}

function nudge(
  e: PointerEvent<HTMLDivElement>,
  setActive: (v: { x: number; y: number }) => void,
) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 2 - 1;
  const y = ((e.clientY - r.top) / r.height) * 2 - 1;
  const nx = Math.max(-1, Math.min(1, x));
  const ny = Math.max(-1, Math.min(1, y));
  setActive({ x: nx, y: ny });
  sim.setTouch(-nx, -ny);
}
