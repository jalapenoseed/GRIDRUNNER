# GRIDRUNNER v7.7 — Field Jobs

Extends v7.6 Flight Yard. Practice missions stay isolated. The same four airframe roles now exist on the live expedition.

## Phone LOD

LOW graphics keeps the procedural proxy on the trailer and does not stream a reference GLB until you enter FPV. MEDIUM uses the GLB inside 18 m. HIGH/ULTRA keep the existing close showcase. Shared textures drop anisotropy on LOW. Shadows on drone meshes follow the graphics preset.

## Campaign jobs

- SCOUT-01: hover-inspect three Leg 1 survey nodes (camp crate, EV, solar yard).
- CARGO-01: clamp the west salvage crate and deliver it to Riggs at Milepost 09. Reward: cutters in pack.
- UTILITY-01: five-second hover on the dark substation cabinet. Restores the grid coupler.
- RELAY-01: station-keep above the radio tower mast. Marks the rooftop relay complete.

Jobs persist on the save as `airJobs`. Wrong airframe is rejected. Flight Yard is unchanged as a trainer.

## Files

`dist/field-jobs.js` is new. `drone-fleet.js`, `game.js`, `expedition.js` and `index.html` are updated.
