# v7.34 — Programmable swarms

The live six-drone cluster can now run player-authored programs. Open **Swarm Command → Program Swarm**, choose aircraft, preview, then **Apply to Live Fleet → Resume Field Run**.

## What players can do

- Use numeric inputs for formation, origin, position, spacing, height, rotation, scale, pattern and teammate coupling. Scouts 03/04 are selected initially so the normal guard and Relay assignments remain in service.
- Edit a small cue language with aircraft/group selection, assignments, waits, repeat periods and line-numbered errors. Four runnable examples cover mixed guard/show duties, complex-plane fields, writing words and a custom formula dance.
- Layer vortex, attraction, repulsion, waves, Lissajous, spiral, braid, twin-attractor, complex-square, Riemann-sphere or custom arithmetic displacement onto targets. The Riemann preset uses inverse stereographic projection, with vertical Y: `(2u, u²+v²−1, 2v)/(1+u²+v²)`. Tests establish unit norm, including poles/equator sample points. It is not a zeta/Riemann-hypothesis simulation.
- Run buzzing flybys, rolls, flips and a phased dance. Airframe attitude animation is separate from the physical flight body and FPV camera. Reduced motion removes show attitude and continuous pattern animation.
- Type up to 16 letters/numbers or draw up to 24 strokes/512 points. Select upright sky lettering or a horizontal path, transform it, hold sampled points or trace strokes. Preview shows the outline, target traces and displacement arrows. Initial morphing starts from a ring.
- Run, pause, step and reset the preview independently of the field; pause the live program or return the cluster. Presets support device-local save/load and JSON import/export. Expedition saves retain the applied program and clock; older saves receive a disabled default.

## Flight authority and limits

Program targets pass through the regular flight controller, staged launch queue, terrain/sector bounds, obstacle avoidance, finite batteries and reserve return. Piloting or assigning an individual aircraft removes it from the program. Existing jobs and returning/depleted aircraft reject takeover with a reason. Script `standby` releases control and cancels pending launch; reapply to take control again. Guard/scout/Relay jobs retain mission targets, with additive influence capped at 4 m per axis. Formation targets preserve a 12 m rider/bike clearance. Choreography is a game animation, not a physical aerobatic flight model.

Expressions use a bounded parser with explicit arithmetic/functions, no JavaScript evaluation, no property access or I/O, depth/token limits and finite output checks. Whole influence displacement is bounded to 32 m. Scripts have 96 lines, 6000 characters and a maximum 600-second cycle. A non-finite formula is reported and contributes zero field displacement while normal flight continues.

Six aircraft represent six points, so long words are sparse; tracing is the practical default. The preview is an ideal target view, not a second physical simulator. Actual obstacle avoidance can distort lettering. The braid is periodic; automatic obstacle-aware splitting/reforming and arbitrary saved-shape-to-saved-shape morphs remain follow-ups.

## Validation

- Full `npm test` passes, including existing campaign, physics, fleet, sensor, save and menu regression checks, plus new pure programming and real scene/DOM integration checks.
- After the final count-in and status fixes: focused programming suite and scene/DOM integration pass; browser-targeted module bundle resolves; `git diff --check` passes.
- Coverage includes arithmetic precedence/rejection, exact timed group cues/repeats/count-in, all fields, stroke gaps, preset validation, live flight/battery use, guard/Relay preservation, timed assignments, pause, invalid-edit isolation, save restore, keyboard drawing, device presets, rendered flip transforms/reduced motion, FPV authority, reserve returns and queued standby cancellation.
- Desktop editor and 390 px phone layout checked through the development CPU/HUD preview. WebGL was unavailable in this browser. No GPU appearance/performance or physical touch/controller acceptance is claimed.

Canonical source remains the GRIDRUNNER Sites repository. Other local dirty worktrees and remote PC / GitHub sources were not overwritten or synchronized by this release.
