# GRIDRUNNER — grok-build ops demo

Night-ops **Field Run** + **Fleet Commander** web demo. Built in Grok Build
(React Three Fiber). Borrowed Fleet Commander mechanics without touching the
Unity project or rewriting the live GRIDRUNNER v7 game.

## Play in the browser

https://jalapenoseed.github.io/GRIDRUNNER/ops/

Live v7 game (unchanged): https://jalapenoseed.github.io/GRIDRUNNER/

## Run locally

```bash
npm install
npm run dev          # TanStack Start preview
npm run build:pages  # static SPA for GitHub Pages
```

`build:pages` writes `dist-ops/` with base `/GRIDRUNNER/ops/`. Copy that folder
to `dist/ops/` on this repo so Pages can serve it.

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
