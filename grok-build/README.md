# GRIDRUNNER — grok-build ops demo

Night-ops **Field Run** + **Fleet Commander** web demo. Built in Grok Build
(React Three Fiber), borrowed from Fleet Commander mechanics without touching
the Unity project or the live GRIDRUNNER game on `main`.

This folder lives on the `grok-build-ops` branch only.

## What’s in here

- **Field Run** — chase-cam dual-sport, three salvage waves, bank at cyan gates
- **Fleet Commander** — 6 / 16 / 24 airframes with spinning rotors, boids,
  tap-to-rally, airframe filter
- Briefings: Night Harvest, Formation Drill, Beacon Hunt, Relay Hop,
  **Night Intercept**, Free Flight
- Asset library (bike, four airframes, pads, drums, floodlights, gates)

## Run it

This snapshot still uses the Grok Build / TanStack Start scaffold (`vite`,
`@tanstack/react-start`, R3F). From this folder:

```bash
npm install
npm run dev
```

Dev server binds `0.0.0.0:8080`.

```bash
npm run build
npm run typecheck
```

## Controls

| | Field Run | Fleet |
|---|---|---|
| Move / steer | WASD or left stick | — |
| Rally | — | tap the yard |
| Formations | 1–5 | 1–5 |
| Launch / recall | Space / L | Space / L |
| Harvest / hop | F | F / R |
| Airframe filter | — | V or chips |
| Pause | Esc | Esc |

A turns left, D turns right from the chase cam.

## Layout

```
src/game/     sim, craft, swarm, scenes, HUD
public/assets textures, library stills, dream-loop targets
```
