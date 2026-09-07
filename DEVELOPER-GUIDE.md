# GRIDRUNNER v7 developer guide

## Scope and provenance

This is an upgrade of the canonical Legs 1–3 ZIP, not a rewrite. The original campaign, geometry, inventory, generators, input and saves remain the foundation. New reusable drone and presentation systems attach to the existing game. `QA-v7.md` records the baseline hash, tests and unresolved GPU validation. The source download contains the untouched original ZIP for comparison.

## Project structure

| File | Responsibility |
|---|---|
| `dist/index.html` | Canvas, helmet HUD, touch controls and modal panel |
| `dist/game.js` | Scene setup, original world, shared state, loop, input, bike, interactions, missions, save/UI integration |
| `dist/drone-system.js` | Pure drone simulation, class registry, commands, collision/signal calculations, scans, migration |
| `dist/immersion.js` | Presets, chapter atmosphere, additional instanced scenery, lights, particles and camera feedback |
| `dist/audio.js` | Web Audio synthesis, mixer, positional approximation and adaptive score |
| `dist/expedition.js` | Save validation, pedaling and generator calculations |
| `dist/visuals.js` | Bike, trailer, cockpit, drone, people, terrain and detailed props |
| `dist/leg2.js`, `dist/leg3.js` | Chapter defaults, sites, objectives, puzzle helpers and geometry |
| `dist/style.css` | Existing interface plus v7 telemetry and command styles |
| `dist/three.js` | Original bundled Three.js dependency |
| `dist/assets/` | Supplied reference JPEGs and existing terrain texture |
| `vite.config.js` | Local static development server and development-only diagnostic route |
| `verify-*.mjs` | Campaign, drone, audio and complete runtime integration suites |

Production is the authored `dist/` directory. There is no mandatory compiler or asset CDN. Development dependencies are locked in `package-lock.json`. Do not edit bundled Three.js to implement game features.

## Run locally

For play, Python 3 is sufficient:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Windows can use `py` instead of `python3`. ES modules and assets require HTTP; opening the HTML as a file is unsupported. Use a browser with WebGL enabled. Click New Expedition or Continue to start sound.

For development and automated tests, use Node.js 24:

```sh
npm ci
npm run dev
npm test
```

The Vite server prints its URL. The `/_qa` route is a CPU/HUD diagnostic for environments without WebGL. It runs the real scene and UI but substitutes a null renderer and disables pointer lock. Its visible banner states that no 3D rendering occurs. The route is middleware in the development configuration and is absent when serving `dist/` directly.

## Game loop and state

`initial()` in game.js produces fresh campaign state `s`: rider position, yaw/pitch, mode, bike and trailer energy, stamina, inventory, progression, aircraft battery, `droneSystem` and `discoveries`.

The existing design uses `s.pos` as the active controlled viewpoint. In bike/foot mode it is the rider; in manual FPV it follows the aircraft. `droneOrigin` retains the stationary rider's position, yaw and mode during FPV. The new aircraft has its own persistent position even while the rider is moving. Do not use `s.pos` as the drone's position outside FPV.

`loop()` requests the next animation frame and caps simulation delta at 0.04 seconds. While unpaused it calls `update()`. This advances expedition systems, rider movement, drone simulation, charging, enemies and nearby interaction selection. Audio receives current gameplay context. The loop then positions the camera, updates rigs and immersion, refreshes HUD at roughly 10 Hz and renders. Menus freeze gameplay, battery drain, AI and flight; audio loops fade. Rendering continues so menu and camera presentation remain responsive.

Scene objects are not stored in saves. Their transforms are restored from data. Transient fields such as scan cooldown, warning timers and renderer state are rebuilt. Avoid introducing DOM, AudioNode or Three objects into portable state.

## Bike controller

The original controller remains in `update()`. WASD supplies throttle/brake/steering. `pedalStep()` decides motor versus human power, stamina and target speed; speed approaches that target rather than jumping. Battery drain scales with distance, terrain, cargo, upgrades and difficulty. S brakes and recovers a small charge if regenerative braking is installed. Zero battery enables human power, preserving the ability to move.

Ground movement checks the existing X/Z solid volumes. Terrain height comes from `heightAt()`. Bike/trailer meshes follow the rider; wheels rotate from speed. `Immersion.update()` layers restrained pitch, lean, vibration and FOV feedback on the camera after the base viewpoint is established. `feedback()` adds a decaying impact displacement. Set cameraMotion and speedFov to zero, and bob off, for a steady view. Stabilization changes smoothing, not steering sensitivity.

## Drone controller and commands

`createDrone()` returns a serializable state. `updateDrone(d, dt, options)` mutates that state and returns the remaining battery and event names. Options supply home position, input, camera yaw, class, terrain, solids, weather, jammer state, difficulty and current chapter boundary. The pure module has no DOM or renderer dependency.

Manual input is `[forward, strafe, vertical]`. Desired horizontal velocity is resolved relative to yaw, diagonals are normalized, and each velocity component changes through capped acceleration. Drag decelerates released controls. Vertical flight is constrained by terrain clearance and a 200-unit ceiling. Scout speed is 38 units/s; Engineering is 34. These are simulation metres; some original route displays still use the prototype's compressed-distance presentation.

`issueDrone()` in game.js adapts command changes to the rider/FPV state, UI and audio. `releaseDroneView()` restores the rider without moving the aircraft. `tickDrone()` supplies world information and applies controller events.

| Command | Behavior |
|---|---|
| MANUAL / FPV | Captures rider origin, gives aircraft control to WASD/altitude input |
| FOLLOW | Tracks a point near/ahead of the moving bike, with home-velocity feed-forward |
| HOLD | Captures the aircraft's current position and settles there with inertia |
| SCOUT AHEAD | Follows an elevated point about 65 units ahead of the bike |
| ORBIT | Circles the bike using traveled distance to advance orbit phase |
| RETURN HOME / DOCK request | Climbs over intersecting volumes, approaches home, descends and docks |
| DOCK state | Aircraft follows its home without flight drain |
| LANDED | Emergency descent and recoverable aircraft on the ground |

Recall is not instant. HOLD also takes time to brake after high-speed flight. Return follows the moving bike; stopping makes docking easier. Low charge, severe hull damage or sustained signal loss initiate return. Battery exhaustion or zero hull triggers controlled descent rather than deletion. Park within nine units of a landed aircraft and issue Q/Dock to recover it; recharge and repair before relaunch.

The return controller uses bounding-volume climb avoidance, not a navigation mesh or general path planner. Decorative rocks, trees and wires are not all collision volumes. Add carefully measured solids for obstacles that should affect flight. `maxY`/`minY` prevent infinite-height walls. Water's ground collision volume is explicitly excluded from aircraft collision.

## Input bindings and touch

| Input | Action |
|---|---|
| W/S, A/D | Throttle/brake and steering; movement/strafe in foot or FPV |
| Mouse / arrow keys | Look |
| Space / Shift | Drone ascend / descend |
| Q | Launch docked drone, recall airborne drone, recover nearby landed drone |
| R / E | Scan / interact |
| 1 / 2 / 3 / 4 | Follow / Hold / Dock / FPV takeover |
| 5 / 6 | Scout Ahead / Orbit |
| F / P+W | Mount-dismount / human pedaling |
| T / V | Transfer reserve / find power |
| X or click / C | Ballistic shot / energy pulse |
| I / M / Tab / Escape | Inventory / map / quick menu / pause |
| F5 | Manual save slot 1 |

Pointer capture retains independent touch steering and look. Rise and descend use held touch buttons; PEDAL toggles human power. Command buttons and Drone operations provide alternatives to number keys. Keep controls at least 44 CSS pixels high on touch layouts. Browser focus loss clears inputs and pauses.

## Signal, scanning and discoveries

Signal combines class range, distance falloff and 3D line intersection with obstruction volumes. Weather and the Leg 3 interference corridor reduce effective range. Signal is smoothed; a brief dip does not immediately force return. At sustained near-zero link the aircraft navigates autonomously. Optional scanline interference and static increase with poor reception, but switching off the visual effect does not disable the mechanic.

`scanDrone()` builds eligible entities from current-leg sites, remaining crates and living raiders. `scanEntities()` filters radius and obstruction and enforces a five-second cooldown. Manual drone scans cost three battery points; rider scans retain the original one-bike-point cost. Existing power search remains alongside reconnaissance.

Discoveries use stable IDs and store category, label, last observed position, leg and expedition time. Rescanning updates an existing ID. They persist in the journal, map and AR tags after docking. Hostiles are last-known sightings, not live radar. Rendering escapes labels, and save validation bounds the records to 100 entries. To add a structure/device scan, add its stable entity record to the scan adapter; categories currently include ENERGY, SALVAGE, HOSTILE, OBJECTIVE and SIGNAL.

## Audio and music

`FieldAudio.start()` lazily creates one AudioContext after a click/tap. Master, effects, ambience and music gains feed a compressor. Continuous oscillators and filtered noise produce motor, regeneration, rotor, machinery, tires, wind, rattles, radio static, water and industrial sounds. `event()` creates short-lived voices that disconnect after ending.

`audioFrame()` supplies nearby infrastructure, threat state, relative bearing and shelter information. Drone volume changes with proximity and flight load. Stereo panning approximates direction; this is not HRTF-based 3D acoustics or a geometry reverb simulator. Nature calls are sparse synthesized gestures. There are no external audio samples to download or license.

`musicState()` selects Exploration, Discovery, Tension, Danger, Combat, Escape or Calm. A sparse scheduler plays the D–A–E-flat–D motif, with silence between phrases and denser timing under danger. Warnings are edge-triggered with a minimum interval. Menus fade loops/music but allow interface effects. Master zero mutes everything. A real listening pass remains required before final release.

To add a sound, add an event preset or a loop voice, define its context-dependent gain, and make sure it is silent while paused. For score extensions, change state selection or phrase timing without scheduling an unbounded number of AudioNodes.

## Graphics, assets and performance

`visuals.js` builds procedural meshes; `immersion.js` adds atmosphere and environmental detail. Existing reference images remain available through the Reference Archive. The terrain reuses desert-ground.png and adds blended chapter vertex colors. There are no new GLB models or generated image assets. Bike/trailer details, drone guards and engineering tools are editable geometry.

Scenery is merged by material in the original world, while the new vegetation, rocks, road wear and distant forms use instancing. Animated/interactable objects remain separate. Particles use fixed buffers instead of allocating new objects every frame. Higher presets enable a local sun shadow region that follows the bike; this is not an entire-world shadow map. Headlights and the drone light are omitted on LOW.

| Preset | Pixel-ratio cap | Added detail fraction | Particles | Shadow map |
|---|---:|---:|---:|---:|
| LOW | 1 | 25% | 64 | Off |
| MEDIUM | 1.25 | 50% | 180 | Off |
| HIGH | 1.7 | 80% | 380 | 1024 |
| ULTRA | 2 | 100% | 650 | 2048 |

Leg 1 uses a warm dry basin, Leg 2 a green-gray river atmosphere, and Leg 3 cooler industrial tones. Night and storm options override lighting/fog while retaining chapter terrain identity. Emissive props change brightness after restoration. Add gameplay obstacles separately from decorative instances so collision remains predictable.

Do not infer frame rate from scene counts or tests. GPU shader compilation, shadow artifacts, image composition and mobile frame rate still need actual hardware QA. Keep changes scalable through PRESETS.

## HUD and UI

Original helmet elements remain in index.html. `renderPanel()` handles menus; `augmentV7Panel()` appends v7 configuration, drone commands and recon entries. `updateDroneHUD()` refreshes telemetry and projected scan tags at the existing HUD cadence. Shared typography/colors connect the rider and remote interfaces; FPV uses a separate telemetry grid and optional signal effect. A short overlay marks control transitions.

New settings are declared in defaults, validated/clamped in applySettings, persisted to gridrunner.settings and exposed in the Settings panel. Do not add an effect without a reasonable low-cost or comfort option. The menus pause the entire world, so users must resume after issuing a flight command in a menu.

## Saves and migration

The envelope remains SAVE_VERSION=1. Existing keys are gridrunner.save.auto, manual1, manual2 and manual3, plus gridrunner.settings. snapshot() serializes rider, vehicles, origin, crates, enemies and progression. validateSave() retains strict original checks and invokes migrateDrone() for v7 fields. Missing discoveries default to an empty array; missing aircraft state becomes DOCK or MANUAL according to the original save mode. Invalid positions, hull, signal or discovery records are rejected.

restore() starts from fresh defaults and restores only recognized state keys, reconstructing Vector3 values and model transforms. Save records keep independent drone position, velocity, mode, hold target, hull, travel and signal. Transient flight timers are reset on restore. Manual FPV saves require a valid rider origin. Autosave still occurs during play and on leaving the page. Export/import supports moving progress between browser origins; a local build cannot automatically read saves from the live site's origin.

When extending state, add fresh defaults and validation/migration together. Never reuse mutable arrays across new expeditions. Retain old fixtures in tests. Treat loaded strings as data, escape UI output, and do not deserialize executable behavior.

## Missions and Legs 1–3

Leg 1 remains in game.js: meet Mara, salvage, manage energy, use the drone rooftop relay or salvage authentication token, then decode the tower for eight bike points. Solar and grid access retain their crafting prerequisites; the engineer perch still charges the attached trailer.

Leg 2 uses the supplied chapter module and game.js adapters: meet Cal, release the elevated intake with a drone, recover the note, operate breakers B → A → C, restore water generation and spend 12 + 8 bike points at the archive. Wrong phases retain their cost and cooldown. Supplied start and carried equipment both remain supported.

Leg 3 requires the engineering drone to disable security, recover a key, align A3/B1/C4, prime the capacitor for 15 bike points, then restore the camps for 20 or transmit north for eight. Security, one-time supply, both endings and final save remain intact.

### Add a mission

1. Add a boolean/counter default to the appropriate chapter defaults and validate it in expedition.js.
2. Add a stable site ID and coordinates to its chapter sites. Add geometry and any collision volumes without blocking access.
3. Add a target and an interaction branch with explicit prerequisites and resource checks. Change state only after a cost succeeds.
4. Update the chapter objective function, journal text and panels; tag it as OBJECTIVE/SIGNAL where appropriate.
5. Add tests for blocked prerequisites, success, repeat interaction, save/reload and resource boundaries.

### Add a drone ability

Register the ability name on the relevant DRONE_CLASSES entry. Add an explicit eligibility check in an adapter, then implement the effect in a pure function where possible. Define cooldown, battery cost and valid targets; call it through input/UI and emit an audio/visual event. Keep mission permissions separate from presentation. Add validation for any persistent fields and test that failed activation does not spend resources.

### Add a drone class

Add a registry entry with speed, climb, acceleration, drag, range, scan, drain and abilities. Set availability only when the class is playable. Add its model selection and unlock/UI handling, extend accepted droneType values in save validation, and provide defaults for any new equipment. The current campaign intentionally exposes only scout and engineer; Cargo and Interceptor are architectural entries, not completed units. The system currently operates one deployed aircraft at a time, not a multi-aircraft fleet.

### Add a Leg

Create a module exporting defaults, stable sites, objective selection and a world builder, following leg2.js/leg3.js. Integrate its start/transition and interaction adapter in game.js, extend validation, terrain/world boundaries, map/marker leg filters and save defaults. Add an atmosphere palette and contextual audio mapping. Define supplied and carried-equipment entry behavior, check the energy economy, and test the complete transition chain plus reloading saves from earlier legs.

## Testing and release

`verify-game.mjs` preserves the campaign/energy/save regression cases. `verify-drone.mjs` exercises physical drone behavior and failsafes. `verify-audio.mjs` tests audio graph behavior through a fake context. `verify-runtime.mjs` runs actual startup, DOM, Three scene construction and mission adapters with only rendering stubbed; its fixture positions are deliberate test setup, not a simulated manual ride.

Use the browser diagnostic for menu, storage and audio-start checks only. Before publishing, perform the outstanding WebGL acceptance list in QA-v7.md. Serve only dist/ for production; keep tests, original archives and the development diagnostic out of the hosted static assets. The current live game was deliberately left unchanged pending that acceptance check.
