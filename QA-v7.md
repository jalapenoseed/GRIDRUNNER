# v7 audit and QA record

Date: 2026-09-07. Canonical source: GRIDRUNNER-source-Legs-1-2-3.zip.
SHA-256: 6d16fffe9e29581ebfc9c923def235e2916e6cd61896feb28a8006edbcb27dae.
Existing source revision: 50091b3844f448887cb87fd8e34271ca4700740d.

## Baseline

The archive was unpacked to an untouched baseline. Every original dist file matched the existing checkout byte-for-byte. Both original verification suites passed before gameplay changes. The original game was served locally and opened in the browser. WebGL initialization failed with GL_RENDERER=Disabled / BindToCurrentSequence failed. Consequently, baseline visual functionality could not be established in this environment. Work continued with this limitation explicitly disclosed; no baseline playthrough is claimed.

Audit: game.js owns rendering setup, loop, input, riding, interactions, menus, campaign adapters and save integration; visuals.js owns procedural assets; expedition.js owns portable saves, energy and pedaling; audio.js owns lazy synthesized sound; leg2.js and leg3.js own chapter definitions and scenery. Original drone movement was instant and its recall teleported the rider/drone state; apparent follow was cosmetic. Existing touch input and the original campaign were retained.

## Executed tests

| Area | Method | Result |
|---|---|---|
| Baseline campaign, energy, saves, audio | Original supplied Node suites | Pass |
| New Game and bike movement | Full runtime with real Three scene objects, DOM and rendering stub | Pass |
| Drone acceleration, braking, climb/descent | Deterministic simulation and runtime integration | Pass |
| FOLLOW at bike speed, HOLD, physical DOCK | Deterministic simulation | Pass |
| Collision/damage, obstruction, lost link, battery return, emergency landing | Deterministic simulation | Pass |
| Scan range, cooldown, retained discoveries | Simulation, runtime and browser diagnostic | Pass |
| Leg 1 Mara, cache token and tower | Real interaction functions with fixture positions | Pass |
| Leg 2 transition, Cal, intake, clue, breakers, archive | Real mission chain with fixture positions | Pass |
| Leg 3 transition, engineer relay, key, antenna, capacitor, ending | Real mission chain with fixture positions | Pass |
| Both ending costs and blocked prerequisites | Campaign regression suite | Pass |
| Old saves, v7 saves, malformed records, final reload | Regression and full runtime | Pass |
| New Game, launch, scan, Follow/Hold/Dock buttons | Browser CPU/HUD diagnostic | Pass |
| Four graphics selectors, interference toggle, master mute input | Browser diagnostic; renderer configuration covered in runtime | Pass |
| Manual Save, reload, Continue | Browser diagnostic with real localStorage | Pass |
| Audio start and procedural scheduling | Real browser AudioContext reports running; mocked audio suite validates gain/mute/events | Pass, no listening certification |
| Console | GPU initialization error on real game; no game exception observed in diagnostic flow | GPU blocked |

Full runtime test scene at ULTRA: 283 mesh objects, approximately 213,602 triangles including instance counts. This is scene accounting, not a frame-rate benchmark.

## Remaining acceptance checks

On a WebGL-enabled desktop: inspect every leg at all presets and weather settings; verify shaders, shadows, clipping, vehicle presentation and particles; ride each mission route without fixture positioning; test sustained keyboard/mouse controls and pointer lock; listen for levels, spatial direction, excessive repetition or clicks; measure frame times; test touch on a physical phone/tablet. Check autonomous return around several buildings and while riding. Test a real existing save export from the live origin.

No claim is made that fixture-based progression is a manual playthrough. The dev diagnostic substitutes only the renderer and disables pointer lock; it is labeled NO 3D RENDERING and is excluded from the static build. Live publication was held because the graphics acceptance check remains unresolved.
