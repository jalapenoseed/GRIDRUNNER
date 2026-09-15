# GRIDRUNNER v7.9 — Field Edition

Continues `grok` from 2e950c4, preserving Quiet Start, Flight Yard and existing campaign saves.

## Menus and instruments

- One field unit with five categories: Expedition, Equipment, Drones, World, System. Each category has a short page list.
- Four main-menu actions; later chapter starts live under Chapters. Settings use expandable sections, with display controls first.
- Uses the supplied icon atlas unchanged, through 44 CSS sprite mappings. Responsive trim, typography and layout replace overlapping HUD layers.
- Walking shows condition, stamina and the current objective. The bike's physical dashboard remains the primary riding instrument; chase views retain compact riding telemetry. Drone flight shows compact battery, altitude, speed, range and signal.
- Equipment, generation, cargo, commands and records remain in field menus. The Relay House terminal remains live during use. Scan overlays remain toggleable and retained discoveries are preserved.
- Keyboard Tab/Space and Xbox menu navigation respect collapsed sections. Escape before an expedition returns to the main menu.

## World and graphics

- Mara has one sloped shelter with over 1.6 m of head clearance. Posts and roofs have finite collision bounds.
- Shared placement exclusions protect buildings, residents, forecourts, paths, saved pickups and Flight Yard. No low-detail random placement fallback at the origin.
- Corrected settlement sign supports, ground-marking flicker, skyline rocks in authored areas and the overlapping chapter road seam.
- Covered drone deployment no longer jumps through roofs. Physical return paths enter below canopies from the side; save recovery is preserved.
- Clear daylight starts at 13:30. Only the inherited stationary clear-weather 17:30 default migrates; deliberate dark modes and other chosen times remain.
- More diffuse daylight and ground bounce, brighter correctly oriented PBR environment, correct sky output color handling and lightweight drifting clouds. Night, Pitch Black and night vision remain distinct. LOW disables cloud work.

## Verification and limits

`npm test` passes: all three mission chains, tutorial gates, four airframes, flight practice/campaign isolation, save migration, cargo/crafting, live terminal, controller handling, menus and presets. Geometry checks raycast Mara and resident roofs and inspect 3,227 actual scenery instance transforms. Covered drone returns are checked from five approach directions.

Desktop and 390px menu layouts were inspected with the development-only CPU/HUD diagnostic. That diagnostic is not part of the deployed game. The available preview browser cannot create WebGL, so actual GPU lighting, texture appearance and visual 3D playthrough remain unverified here.

## Rendering research

Kept Three.js r169 and the existing asset pipeline. No additional runtime library was needed for this pass. Implementation uses documented [hemisphere lighting](https://threejs.org/docs/pages/HemisphereLight.html), [scene environment lighting](https://threejs.org/docs/pages/Scene.html), [PMREM filtering](https://threejs.org/docs/pages/PMREMGenerator.html) and [renderer color output](https://threejs.org/docs/pages/WebGLRenderer.html).
