# GRIDRUNNER v7.8 — Quiet Start

## v7.8.1 — Tutorial / Flight Yard integration repair

- Fixed Flight Yard inheriting the fresh campaign tutorial: launch now takes
  control of the selected drone, shows flight telemetry/progress and allows G
  to reopen the hangar. Practice is available at any tutorial stage.
- Preserved the held campaign across flight changes and returning from practice,
  including tutorial flags, drone viewpoint/origin, cargo and world state.
- Moved the opening foot spawn south of the bike so the bike is actually ahead.
- Kept the current tutorial verb visible without altering saved HUD preferences;
  added destination distance/direction and keyboard, Xbox and touch prompts.
- Gated every launch command before salvage, waited for physical docking before
  completing the scout step, and restricted the final conversation to Mara.
- Applied map/journal/pack gates through the shared menu entry point; disabled
  player weapons during the quiet sequence.
- Unified save migration so missing/null legacy intro data and completed stages
  stay unlocked; supplied later chapters explicitly skip the opening tutorial.
- Updated the runtime test harness for the new spawn and added tutorial/hangar
  regression scenarios. Fixed the development diagnostic's stale script version.

Validation: the full `npm test` suite passes, including tutorial progression,
all four practice airframes, recall/relaunch, campaign return, save migration and
the existing three-chapter, audio, controller and asset suites. Visual WebGL QA
was not completed: the cloud browser blocked the local test URL with
`ERR_BLOCKED_BY_CLIENT`.

The changes below describe the original v7.8 implementation; v7.8.1 supersedes
its campaign-wide Flight Yard lock.

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
