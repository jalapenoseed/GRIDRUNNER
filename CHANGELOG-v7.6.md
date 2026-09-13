# GRIDRUNNER v7.6 — Flight Yard

Extends the yaw-enabled v7.5 main revision `de4cbbe`. The existing JavaScript campaign, saves, bike, trailer, energy systems, Relay House mystery and controller mapping remain the foundation.

## Fly the reference pack

SCOUT-01, CARGO-01, UTILITY-01 and RELAY-01 use runtime copies of the Blender reference rebuild. Each has 19 material-batched meshes and four independent rotor pivots, metric proportions, separate PBR textures, camera glass and restrained utility lights. UTILITY retains the `engineer` save ID and upgrade gate. Cargo and Relay are selectable in campaign while docked; all four are available in Flight Yard.

Open **Flight Yard** from the main menu, field navigation, or **G**. Choose an airframe and launch a gate circuit, optical inspection, cargo recovery, utility repair or relay-station exercise. Missions have stable-hover or airframe requirements. **H / LB** cycles FPV and chase cameras. The existing Stabilized and Acro pitch/yaw/roll models remain selectable in Settings.

The practice session holds the current campaign snapshot and suppresses campaign autosaves. **Return to expedition** restores position, aircraft state, inventory and energy. A recovery button is available on the main menu if the page was closed during practice. Best mission times are local to this browser. These are game exercises, not calibrated real-world flight or lifting models.

## Clear sightlines and weather

- **K** or **SCAN** button: show/hide scan labels, world markers and the large telemetry overlay. Discoveries remain on the map and in the journal. At most five nearby scan labels are shown.
- **N** or **NV** button: night vision, with scene illumination gain and a restrained green display treatment.
- **O**: atmosphere controls. Clear, dry heat, night, pitch black, rain, heavy rain/wind and sandstorm; adjustable sun time, moving sun and optional changing weather.
- Pitch black removes sun, ambient and environment light. Practical lamps remain visible. Night vision operates independently.
- Solar charging now follows actual daylight. Rain affects surface coat/roughness; wind perturbs manual aircraft; storms degrade the link.
- **Xbox controller:** hold **View + X** to toggle scan HUD; **View + Y** toggles night vision. A short View tap opens the map. All existing A/B/X/Y, sticks, triggers, bumpers and D-pad controls are preserved.
- Touch has visible scan, NV, atmosphere and hangar controls; compact flight telemetry keeps the center clear.

## Settlements and presentation

Settlement directory with map marking and nearby services. Rest restores stamina only. Enterable rooms gain service conduits, breaker cabinets, ventilation slots, light strips and worn safety details. NPCs have rounded workwear, equipment, heads/arms and restrained idle motion. Conversations have local advice and barter tabs, clearer give/receive inventory, stock and material requirements. Original finite trade transactions still apply.

## Source and runtime

Canonical Blender files were not modified. `source/export_runtime_drones.py` evaluates export copies, groups static geometry by material and preserves rotor pivots. `dist/assets/drones/manifest.json` records counts and the source hash. Gzip files contain standard GLBs (lossless transport compression); decompress to conventional glTF binary for other tools. Browser streaming uses DecompressionStream, supported by current mainstream mobile and desktop browsers. Runtime textures are separate 1024px PNG channels; the original 2048px material-library textures remain canonical. No ORM or engine-specific mask packing is introduced.

Only the selected airframe streams, and shared textures/materials are reused. Each drone is about 120k–154k triangles at source detail; these are showcase models, with no geometric LOD chain yet. Failure retains a procedural proxy and records an asset error. Reference cards are Blender studio renders, not screenshots of the browser renderer.

## Verification

`npm test` covers the original campaign and yaw/roll dynamics, all new mission transactions, held-campaign restoration, autosave isolation, scan hiding without discovery loss, black-lighting values and night vision, moving sun/rain, Xbox modifier chords, all four aircraft save round trips, GLB parsing, UVs, normals, bounds and rotor pivots.

Physical Xbox/iOS/Android hardware and frame-rate certification still require hands-on testing. GPU/browser checks are recorded in QA-v7.6.md.
