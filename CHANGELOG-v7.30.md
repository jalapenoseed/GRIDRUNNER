# v7.30 — Personal thermal and neon escort

Based on Grok's `812380d` v7.29 update. Existing presence, foliage, animation, audio, fleet jobs and campaign features are retained.

- **Personal visor:** B cycles RGB, night, thermal, UV and RF on foot or bike. Fleet → Sensors & optics exposes the same active-view choices. Each visor/aircraft selection is remembered independently; FPV obeys airframe payload limits and returning to the operator restores the visor. Personal scans now record the selected sensor with a 1-charge scan cost and a 60 m base range.
- **Escort anchor:** FOLLOW, ORBIT, SCOUT AHEAD and formation slots track the operator's body. FPV does not move that body anchor. Launch, radio range/reserve, return, docking, dedicated survey jobs and energy delivery retain their rig/world targets.
- **Visible flight:** Close protective rings use 4–7 m vertical offsets above the operator anchor; regular orbit uses 6–9 m. Collision avoidance still climbs above obstructing geometry. HOLD retains position authority.
- **Neon aircraft:** Permanent cyan/amber/lime/magenta identities gain soft additive halos, four navigation lamps, two light strips and an underside ring. Core beacons retain a 10 px minimum projected identifier. These are depth tested and visible without bloom on LOW; no extra point lights or shadows. Chase/overhead views show the selected airframe.
- **Presence repair:** HDR render targets, final exposure/tone mapping/display conversion and drawing-buffer sizing correct the v7.29 bloom output. Vignette uses a defined smoothstep direction. Thermal remains on its separate renderer path.

## Validation

- Full `npm test` regression chain, including actual Rapier/Recast and YOLO WASM tests; new physical escort and personal-view integration tests.
- Real Windows Edge WebGL on DESKTOP-19SM9JD: baseline v7.29 browser smoke, LOW/HIGH neon rendering, four staged launches and operator orbit, personal thermal, FPV/body-anchor isolation, visor restoration, loaded aircraft assets and viewport resize. No page, shader or asset errors. Software-WebGL warnings are not FPS measurements.
- Constant-color render matched `[92,92,92,255]` both with and without postprocessing. Normal forward camera projection explicitly checks that the close ring is in the viewport.
- `verify-neon-browser.mjs` writes local review captures into ignored `qa-output/`; it does not ship test hooks to `dist/`.
- Bundle and whitespace checks passed. Physical touch/controller handling and sustained hardware FPS/audio listening remain outside this automated pass.

## Existing v7.29 limitation

The optional `scripts/remesh-gltf.mjs` is a bounds/collider prototype, not a working GLB remesher/exporter. It rejects binary GLB and does not decode glTF geometry. No imported props are enabled by default. This release makes no claim that production mesh intake is complete.
