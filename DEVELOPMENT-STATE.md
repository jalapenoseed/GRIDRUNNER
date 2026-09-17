# GRIDRUNNER continuation state

Date: 2026-09-17. Current slice: v7.34 Programmable swarms.

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
