# GRIDRUNNER v7.8 — Quiet Start

Branch: `grok` (not merged into the live Pages site).

Play: https://cdn.jsdelivr.net/gh/jalapenoseed/GRIDRUNNER@grok/dist/index.html

## Why

First-time players spawned on the bike with every panel up and no first verb. Buddy feedback: they did not know what to do.

## What changed

- New run starts on foot ~11 m south of the motorcycle.
- Three gated verbs: mount → salvage crate 0 → scout hop → talk to Mara.
- Quiet HUD (`body.intro-quiet`) hides nav map, charger aside, drone command strip, optics/hangar until Line Open.
- Map and Flight Yard locked until Mara. Pack still works after mount.
- Raiders do not deal damage during the lock.
- Old saves with no `intro` state are treated as Line Open (no forced tutorial).

## Files

| File | Role |
|---|---|
| `dist/intro.js` | Stage flags, objectives, HUD copy |
| `dist/intro.css` | Hide chrome while quiet |
| `dist/game.js` | Spawn, mount/crate/drone/Mara hooks |
| `dist/expedition.js` | Save migrate |
| `dist/index.html` | Cache `?v=7.8` |

## Not in v7.8

Phone HUD layout pass, camp art, new enemies, destruction, merging to `main`.
