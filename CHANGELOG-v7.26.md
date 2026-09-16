# v7.26 — Swarm / Sensor Lab

- Added local flocking and predictive peer separation to autonomous formation flight, while preserving pilot, precision task, return and battery authority.
- Added a compact four-aircraft selector at the top of Fleet, Launch All and Return All. Shift+Q stages eligible docked aircraft through a clear takeoff corridor. Shift+1–4 remains direct aircraft selection.
- Made the ALL selection apply consistently to Fleet command buttons as well as keyboard orders. FPV remains single-aircraft.
- Added a compact Flight Yard picker and Sensor / YOLO Lab. UV, thermal and RF exercise progress is isolated from the expedition.
- Restored UV on Scout and Utility. Authored fluorescent Maintenance Cut markings provide optional exploration clues recorded by R and retained in the Journal.
- Kept Utility thermal and Relay RF, with physical lab targets and finite scan costs. UV does not tag arbitrary objectives as fluorescent.
- Added separate approximate person/bicycle reference-box comparison for the existing real local YOLOX detector. Reference labels never enter the inference worker; misses remain visible.
- Research, limitations and proposed sensor missions: `SWARM-SENSORS-v7.26.md`.

Validation: focused crossing/authority/energy tests, real Three.js/Rapier scene and DOM integration, actual bundled YOLOX WASM inference, full regression chain and browser module bundle. Browser/GPU presentation and physical controller/mobile acceptance remain unverified. No trained swarm model, external simulator runtime, new model download or multi-instance fleet registry is included.
