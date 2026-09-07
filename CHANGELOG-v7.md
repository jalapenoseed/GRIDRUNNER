# GRIDRUNNER v7 — Immersion + Drone Systems

Upgraded from the canonical `GRIDRUNNER-source-Legs-1-2-3.zip`, preserving the original Three.js game and campaign. This is a release candidate: GPU rendering and a manual visual playthrough remain unverified because the available browser reports its graphics renderer as disabled. The live v6 deployment has not been replaced.

## Drone 2.0

- Added a renderer-independent vehicle controller with acceleration, braking inertia, horizontal speed caps, vertical flight and altitude limits.
- Added independent aircraft position, velocity, hull, distance traveled, battery use, range and signal telemetry.
- Replaced teleport recall and arbitrary range penalties with physical return and docking. The rider regains control while the aircraft returns.
- FOLLOW tracks a moving bike with target velocity prediction; HOLD captures a stationary hover target. SCOUT AHEAD, ORBIT, RETURN HOME and manual FPV are also implemented.
- Q retains launch/recall. Added 1 Follow, 2 Hold, 3 Dock, 4 FPV takeover, 5 Scout Ahead and 6 Orbit, with menu and touch-accessible buttons.
- Signal deteriorates with range, sandstorms, the industrial interference corridor and intersecting building volumes. Sustained loss invokes autonomous return.
- Battery reserve and severe damage invoke return. Exhausted or disabled aircraft descend and remain recoverable near the bike, rather than being deleted.
- Added building/terrain collision damage, docked repairs and separate aircraft hull.
- Added a class registry for Scout, Engineering, Cargo and Interceptor. Scout and Engineering remain the playable modules; the other two are extension definitions.

## Reconnaissance

- Scans identify nearby energy, salvage, objectives, signals and hostiles with a five-second cooldown.
- Discoveries persist in saves, the journal, map and projected AR tags after returning to the bike.
- Hostile tags represent last scanned positions. Existing power-search and campaign interaction behavior remains available.

## Rendering and movement

- Added leg-specific sky/fog and terrain palettes: warm basin, green-gray spillway and cold industrial corridor.
- Replaced the old fixed sky dome with a viewer-centered gradient horizon and sun highlight.
- Added instanced vegetation, rocks, gravel, road wear, rubble and distant silhouettes across all three legs.
- Added emissive infrastructure fixtures, electrical sparks, ambient particles and off-road dust.
- Added bike headlights, a drone light and local directional shadows on higher presets.
- Added LOW, MEDIUM, HIGH and ULTRA presets controlling resolution, detail density, particles, lights and shadow quality.
- Improved drone models with rotor guards, antenna and engineering tools; animated bike/trailer wheels.
- Added restrained acceleration response, suspension vibration, lean smoothing, impact response and speed-dependent FOV. Motion, stabilization and FOV response are configurable.

## Sound and music

- Reworked procedural motor load/pitch, regenerative braking, tire noise, trailer rattle, rotor speed/climb and docking/impact sounds.
- Added distance attenuation and stereo positioning for the drone and nearby infrastructure; added river, sparse nature calls, industrial tone, wind and shelter damping.
- Added weak-link static, scan/discovery sounds and rate-limited edge-triggered warnings.
- Added adaptive Exploration, Discovery, Tension, Danger, Combat, Escape and Calm music states.
- Added a D–A–E-flat–D Ghost Signal motif with deliberate silent phrases.
- Added an ambience mix control. Audio starts through a user gesture and gameplay loops fade during menus.

## Interface, saves and infrastructure

- Added shared Blackline OS drone telemetry with BAT, ALT, SPD, RANGE, SIGNAL, LINK, HULL and MODE.
- Added mode-switch feedback, optional interference and persistent recon displays.
- Preserved campaign menus, map, inventory, crafting, generators, enemies, supplied chapter starts and touch controls.
- Kept save envelope version 1 and existing storage keys; missing v7 drone/discovery fields receive migration defaults and malformed new data is rejected.
- Added a reproducible Vite development setup, a development-only CPU/HUD diagnostic and four verification suites.
- Fixed negative hull after incoming fire and obsolete Leg 2 completion text.

## Verified and remaining

Passed: original baseline logic suites; v7 campaign, energy and save regression suites; drone simulation scenarios; synthesized-audio tests; full DOM/runtime integration including all three mission chains and final save. Browser diagnostic confirmed New Game, launch, scan, command buttons, graphics selections, mute controls, save/reload and Continue, with a running real AudioContext.

Not verified: actual GPU/shader output, visual composition during riding, real frame rate, pointer-lock feel, physical mobile input and a listening pass. The diagnostic deliberately does not draw the 3D world. Collision uses selected bounding volumes, not every decorative object; signal obstruction and spatial audio are approximations. Cargo/Interceptor gameplay, full interiors and advanced pathfinding are not implemented. See `QA-v7.md` for details.
