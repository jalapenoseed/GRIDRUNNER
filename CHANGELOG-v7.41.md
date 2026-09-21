# GRIDRUNNER v7.41 — Quiet Field demo

Bounded demo entry. Campaign systems stay in the tree. Campaign localStorage keys are not used while the demo is active.

## Play

- `dist/demo.html` or `index.html?mode=demo`
- GitHub Pages: `https://jalapenoseed.github.io/GRIDRUNNER/demo.html`

Same map and Quiet Start verbs: walk to the bike, salvage the first crate, launch/recall one scout, talk to Mara.

## What the flag does

- Forces LOW graphics, explorer difficulty, tutorial intro, Boids/program layers untouched but extra chrome hidden
- Uses `gridrunner.demo.save.*` and does not read or write `gridrunner.save.*`
- Blocks F9 admin fleet while the demo session is running
- Leaves Commander, YOLO, Swarm and story modules loaded; they stay off the first-mile HUD

## Checks

`node verify-demo.mjs`
