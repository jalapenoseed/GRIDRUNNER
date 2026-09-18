# Current implementation — v7.38

Date: 2026-09-18. Fleet capacity, beacons, word sequencing and menu update.

Both Commander modes accept 1–2,000 actual drones with legacy fleet migration and compact archives. `word-sequence.js` controls hold / smooth transition / loop; the same IDs, bodies and flight clocks persist between words. Dense words use spaced depth rows. `fleet-spatial.js` supplies exact nearest-24 queries within 48 m for the live test fleet. The common steering math avoids per-neighbor allocations without changing its control rules. Large world tests use 20 Hz flight updates and interpolated positions. GPU geometry is bounded by distance while all 2,000 beacons remain present. `aircraft-beacons.js` provides optical cores/glare/strobes plus eight nearby surface lights.

The new task menus and native contextual dialogs are available in Commander and F9. Browser-checked the 2,000 selection, word editor and running HELLO/WORLD in the tactical fallback. Automated tests cover real flight bodies, timing/continuity/identity, save/import migration, exact spatial queries, count-change routing, recall, bounded edge deployment and scene beacon capacities. The full `npm test` regression suite passed, including story and save checks. WebGL appearance and physical-device performance remain unverified here. See CHANGELOG-v7.38.md.

## Previous release record

# GRIDRUNNER continuation state

Date: 2026-09-17. Current slice: v7.37 All the lights we carried.

v7.37 connects the existing three-sector expedition to earned aircraft, eight Field link calls, six sourced bench exercises, four frame rebuilds, named Charger dispatch, six finite charging stations, saved aircraft placement across sector travel, three sensor recovery trails, a bounded fleet flight recorder and a finale using actual owned/available aircraft. New story expeditions start with one Scout. Old saves and Swarm Start keep legacy access. `dist/CAMPAIGN-ARC.md` records the larger seven-region direction and distinguishes current implementation from future regions, animated calls, deeper engineering curriculum, physical handheld and image/music import.

Run `npm run test:story` for the focused real-scene/DOM checks. It is included in `npm test`. See CHANGELOG-v7.37.md for verification scope and controls. The new visual layouts have not passed browser acceptance because preview access was unavailable; no GPU or physical-device validation is claimed. Current implementation uses the existing assets and small station/cache meshes.

Continuation: follow `dist/CAMPAIGN-ARC.md` next-implementation order. Keep aircraft and battery identity, finite energy ledgers, station ownership, old-save migration and independent practice modes intact. Do not claim that the full seven-region campaign, true RF triangulation or automatic picture/music interpretation is already built.

v7.36 adds a hidden Settings / Reset & hints / Advanced admin entry and F9 for 1–100 temporary drones in the actual campaign scene. `in-world-commander.js` uses the regular aircraft controller with actual terrain, solids, radio, reserve returns and campaign peers; `in-world-commander-visuals.js` instances the existing airframes. Copies remain outside campaign snapshots and clear on world/session changes. Both Commander modes share 29 presets and saved setups, multi-stroke drawing and beat choreography with BPM/tap tempo/optional metronome. See CHANGELOG-v7.36.md and `npm run test:admin-fleet`. GPU/device acceptance remains open; main-game browser checks use the explicit CPU/HUD diagnostic, and standalone checks use the tactical fallback.

v7.35 adds `commander.html`: an independent 1–100-drone arena with nine beacon colors, fleet builder, bounded grouped programs, named fleet JSON saves, drill/hunt/pass-and-play games, instanced reference models and a working canvas fallback. Campaign entry/return holds and restores the current expedition in session storage without overwriting named saves. Full regression and focused Commander simulation/DOM/handoff tests pass; desktop and 390 px browser controls are checked in the fallback because WebGL is unavailable in the browser. See CHANGELOG-v7.35.md for the measured CPU scope and unverified GPU limits. Discovery/parts-builder progression remains future work.

v7.34 adds the live program bench, bounded arithmetic/script interpreter, group timeline, layered mathematical fields, show attitudes, words and drawn paths, and device-local presets. Source remains `/workspace/sites/gridrunner-swarm-live`; the other dirty checkout and remote PC / GitHub worktrees are untouched. See CHANGELOG-v7.34.md for checks and limitations.

v7.33 integrates six starter aircraft (four Scouts and two Relays), live guard/scout/relay assignments, per-instance saves and FPV, and physical camouflage cover. The canonical Sites checkout is `/workspace/sites/gridrunner-swarm-live`, resumed from published `df10466`. Full tests pass; browser command UI was checked at desktop and 390 px, with WebGL unavailable in that browser. See CHANGELOG-v7.33.md. The user’s requested programming, formula influences, dance flybys, word formations and drawings are recorded in SWARM-NEXT-UPDATE.md for the next update. The PC worktree `GRIDRUNNER-swarm-command` remains at its prior sandbox revision; it was inspected but not overwritten by this Site release.

v7.32 adds an optional virtual Swarm Command sandbox beside Flight Yard. Players can vary the four current airframe counts, place origin/objective points, and combine formations, motion patterns, missions, origin logic, intelligence and teammate rules. It keeps practice preferences device-local and does not mutate expedition saves, hull, charge, tasks or discoveries. See CHANGELOG-v7.32.md.

v7.31 resumes GitHub `grok` commit `812380d` (Grok v7.29), restores independent personal optics, anchors escort flight to the operator, adds LOW-compatible neon airframe lights and repairs bloom output. See CHANGELOG-v7.31.md for validation and remaining limitations. Concurrent Grok v7.30 contact AO (`90fa399`) is also retained, with HDR output corrections. The separate dirty v7.21 and prior sync worktrees were not used or overwritten.

v7.29 is a graphical/interactive wave on top of the v7.28 fleet/sensor access repair. See CHANGELOG-v7.29.md. Canonical playable Site remains `gridrunner.goodyartist.chatgpt.site`; this GitHub `grok` branch now carries the presence modules.



v7.28 repairs discoverability of sensors/formations and makes formation selection issue orders to free aircraft. See CHANGELOG-v7.28.md and MENU-LIBRARY-NOTES.md. The canonical source is the deployed Sites repository; this repair was based on v7.27, not the older dirty v7.21 workspace or the unsynchronized GitHub branch.

## Source of truth

- The active playable Site is `gridrunner.goodyartist.chatgpt.site`; its own source branch is `main`.
- This menu continuation resumed published v7.26 source at `fb1b1fa159df90568333c1d6c6ea71bb471eb134`.
- An older dirty checkout at `/workspace/sites/gridrunner` contains separate unfinished console/UV changes. It was inspected, not changed, committed or published by this continuation. Do not copy it over the current source.
- The separate GitHub `jalapenoseed/GRIDRUNNER` `grok` branch was observed with package version 7.16. Source reconciliation/push to that separate repository is not completed by a Sites release. Honor the previous authorization blocker; do not force-push or overwrite either history.
- No Godot, Unreal or approved Blender source assets were changed.

## Engineering loop applied

Inspect live source → run baseline → add failing focused tests → implement a bounded slice → run real-scene integration → review regressions → update this handoff → publish only after checks.

This is an ECC-style working practice. No ECC plugin, hooks, global rules or remote-PC installation were performed, and no independent-agent review is claimed.

## Compact menu continuation (v7.27)

- Replaced category tabs plus page rail with a single five-branch directory; one category expands at a time.
- Fleet has one visible pane: commands, formations, survey/harvesting, packs, automation, airframes, or sensors. Four quick selectors and Launch All remain above it.
- Settings/controls and bike/trailer use focused subpages. The existing action elements are moved, not recreated; gameplay, unlocks, campaign persistence and worker behavior remain unchanged.
- Sensor buttons invoke the same supported-payload checks and optics application as the B shortcut. UV, thermal and RF remain available on their existing airframes.
- Desktop panel is capped at 900px (previously 1180px). No world blur. On narrow screens Directory switches between navigation and content. Ordinary action targets are 44px on narrow screens.
- Back/Escape/controller B returns from a subpage to its first page before following the existing page history. Branch, focus and scroll preferences are device-local and separate from campaign saves.
- `dist/menu-tree.js`, `dist/menu-tree.css`: presentation adapter and styling. `verify-menu-tree.mjs`: focused navigation regression. `npm run test:menus`: focused plus integrated regression.
- Full 28-stage `npm test` passed; browser-targeted module bundle and diff checks passed.
- Browser checks: desktop menu and Fleet branch interaction; 390×844 iframe phone viewport, Directory navigation and branch switching. Used the existing `/_qa` renderer stub because actual WebGL boot reports unavailable in this cloud browser. `/_qa-mobile` is a development-only viewport wrapper. It is not included in the hosted static archive.
- GPU/world compositing, physical touch and physical controller acceptance remain outstanding. Automated real-scene/DOM tests cover WALK, BIKE, DRONE, fleet, saves, collision and controller routing. No GPU performance improvement is claimed.

## Swarm / sensor continuation

- `dist/swarm-steering.js`: immutable peer snapshots, local flocking, predicted crossing separation, launch-corridor clearance.
- `dist/sensor-lab.js`: authored UV/thermal/RF targets, finite-scan exercise, reused lab models and approximate reference projection/scoring.
- `npm run test:swarm-sensors`: focused behavior and real-scene integration. Included in the full regression workflow.
- `SWARM-SENSORS-v7.26.md`: source research, implemented limits and proposed UV/thermal/RF mission slices.
- The class-keyed four-airframe registry is unchanged. No trained swarm model or new external runtime is claimed. Precision tasks/pilot/return keep authority; avoidance is heuristic.
- The unfinished older UV branch was not merged wholesale. This live-source implementation restores explicit fluorescent contacts while retaining v7.24/v7.25.

## Focused maintenance

Release checks passed: the complete 27-stage `npm test` chain, focused Phase 4 integration after the final review fixes, scene-layout/foundation checks, the browser-targeted module bundle and `git diff --check`. This is not GPU or device acceptance.

- `npm run test:phase4`: pure simulation plus real scene / DOM integration for this slice.
- `npm test`: complete regression chain including Phase 4.
- `dist/opening-route.js`: data, saved progress and finite repair/loot transactions.
- `dist/surveillance.js`: perception, last-known search, physical aircraft controller integration and finite station ledger.
- `dist/opening-world.js`: authored geometry, matching cover collisions and reused aircraft visuals.
- Integration uses existing targets, interaction controls, Journal, objective, radio, saves and renderer; no alternate game loop or new HUD stack.

## Remaining acceptance and scope

GPU rendering, listening, physical-controller/touch checks and fresh-player route comprehension remain unverified. Menu browser checks are described above. Read `dist/GRIDRUNNER-v7.26-REPORT.md` and `dist/GRIDRUNNER-v7.25-REPORT.md` for the short manual route. Do not describe automated renderer-stub tests as visual playtesting.

Phase 4 is an initial bounded prototype, not full combat or region-wide density. Tune based on play feedback before expanding. Next structural candidate is Phase 5's multi-instance fleet registry and migration; original communicator/intro, Eclipse and broader physics/audio/asset work remain on the roadmap.
