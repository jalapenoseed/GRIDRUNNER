# GRIDRUNNER v7.15 integration notes

## Implemented

- **Rapier 0.20.0:** static world colliders, a kinematic rider controller with move-and-slide, and swept spherical drone collision queries. Sweeping catches thin obstacles crossed between ticks. The same adapter serves the selected aircraft and the rest of the squad. Ground-only barriers remain passable by drones; roofs retain their vertical bounds.
- **Recast Navigation 0.43.1:** navigation meshes generated from each camp's floor and authored collision volumes. A module worker builds routes for Mara and all six residents, then terminates. Detour partial/unreachable paths are rejected. NPCs alternate work and walking, pause for a nearby rider, and watch low-flying drones. Leg pivots animate their steps. Interaction and barter positions follow the actors.
- **Tutorial and saves:** Mara remains at her original position until onboarding is complete. Ambient poses are transient; new/restored campaigns reset actors to their camps. Save schemas, trade stocks, campaign goals and custom drone flight equations stay game-owned.
- **Static deployment:** pinned npm development dependencies and reproducible ES-module bundles with embedded WASM, local licenses and SHA-256 manifest. `dist/three.js` remains r169. Engine loading starts during the opening/menu. If WASM or Worker loading fails, the existing collision checks and stationary residents keep the campaign available, with a console diagnostic.

This is the first Rapier migration. Bike suspension, articulated trailer joints, loose dynamic salvage, terrain rigid-body colliders and force-driven drone rigid bodies are still future work. Recast currently serves authored camp routes; it does not provide a world-wide crowd, dynamic obstacle avoidance or combat AI.

The two vendor modules add 3,613,209 raw bytes (about 1.30 MB combined with gzip). They load once, separately from the core game script. Recast mesh building stays off the render thread. No frame-rate or startup-time improvement is claimed from these additions.

## Validation

`npm test` includes real vendored Rapier and Recast WASM. It checks high-speed wall/roof crossing, rider sliding, vertical clearance, ground-only masks, changed collider bounds, navigation detours, disconnected paths, low ceilings, conversation stops, tutorial freezing and state reset. The full runtime suite also runs with both engines initialized and exercises onboarding, all three campaigns, four-aircraft operations, menus, save migration and the walkable cabin porch/cellar stairs.

`npm run test:browser` is a separate optional Playwright test using real WebGL and a real module worker. Install Playwright and its Chromium browser first, or provide `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`. It serves the authored `dist/` tree, injects test hooks only into the intercepted test response, checks routes and moving targets, and writes a screenshot to `/tmp/gridrunner-qa/`. Software WebGL checks are not representative of frame rate on the player's GPU.

The browser smoke test passed on 2026-09-15 with Chromium/SwiftShader: 236 Rapier static colliders, seven active Recast routes, moving resident targets, four-aircraft updates, and a real WebGL 2 scene render. Google Fonts was replaced by an empty stylesheet only inside the test; the game's CSS font fallbacks were used. No game renderer or engine was mocked in this browser run.

## Checklist status and next choices

| Item | Current state / next useful step |
|---|---|
| Asset pipeline | **v7.29:** `scripts/remesh-gltf.mjs` welds TRELLIS/generated meshes and writes Rapier AABBs into `dist/assets/imported/`. Meshopt decoding, glTF Transform optimization and KTX2 texture encoding are still pending. |
| Static-world queries | The existing spatial grid remains useful. `three-mesh-bvh` is not installed; add it when imported buildings need triangle-level queries instead of authored boxes. |
| Rapier | First collision/controller migration complete; vehicle suspension and trailer constraints remain. |
| Recast | Camp navigation complete; broader navigation/crowds remain. |
| Unified input | Existing `ControllerBridge` and action routing already handle keyboard/gamepad; extend this for calibrated FPV radios instead of adding another overlapping wrapper. |
| Postprocessing | **v7.29:** local bloom + FXAA + vignette on HIGH/ULTRA. Thermal/NV/LOW/MEDIUM unchanged. `postprocessing@6.36.7` remains a future candidate if a shared effect stack is needed; not installed. |
| Vegetation, water and weather | **v7.29:** instanced icosahedron oak crowns with wind. Grass cards and existing weather remain. |

## Additional libraries researched on 2026-09-15

These are candidates, not installed features. Sources below are the maintainers' repositories/docs.

| Library | Concrete GRIDRUNNER use | Decision |
|---|---|---|
| [Troika Three Text](https://protectwise.github.io/troika/troika-three-text/) | Readable in-world service signs, equipment labels and radio text using SDF glyphs; worker-based text processing. | Good targeted addition. `0.52.5` declares Three `>=0.125.0`, compatible with r169. Keep screen menus in HTML. |
| [Howler.js](https://github.com/goldfire/howler.js) | Positional recorded radio chatter, camp machinery and ambient loops, with loading/playback management. | Useful when adding recorded environmental audio. Preserve existing procedural motor/drone synthesis. |
| [stats-gl](https://github.com/RenaudRohlinger/stats-gl) | Development-only CPU/GPU timing to distinguish shader/texture hitches from simulation cost. | Useful before the next graphics upgrade. GPU timer availability must be checked; no production HUD overlay by default. |
| [three.quarks](https://github.com/Alchemist0823/three.quarks) | Batched sparks, exhaust, electrical arcs and dust emitters. | Defer: current `0.17.1` requires Three `>=0.182.0`, beyond r169. A renderer upgrade needs its own regression pass. |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | Larger asynchronous local storage for future replays, screenshots or cached generated maps. | Defer until those features exist; current small save records do not justify a storage migration. |
| [navcat](https://github.com/isaac-mason/navcat) | Pure-JavaScript navigation alternative from the Recast JS maintainer. | Worth monitoring if WASM payload becomes a constraint. Avoid a second navigation stack alongside the working Recast integration. |

Primary sources for the current foundation: [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/), [Rapier scene queries](https://rapier.rs/docs/user_guides/javascript/scene_queries/), [Recast JS](https://github.com/isaac-mason/recast-navigation-js), [postprocessing](https://github.com/pmndrs/postprocessing), [Meshoptimizer](https://github.com/zeux/meshoptimizer), [glTF Transform](https://github.com/donmccurdy/glTF-Transform).
