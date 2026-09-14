# Copyable handoff — GRIDRUNNER Unreal Asset Lab

Continue `jalapenoseed/GRIDRUNNER`, branch `unreal`, project
`unreal/GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject`.

Goal: a small, high-quality visual lab for existing GRIDRUNNER assets, not a full
game rewrite. Keep Three.js/Godot work and approved Blender sources untouched.

Read `unreal/README.md`. The branch contains a UE 5.8 content-only project,
editor showroom/material generator, editor day/dusk/night presets, and a tested
asset-staging helper. Unreal was not available where this starter was authored:
there are no generated `.umap`/`.uasset` files, no verified editor run, and no
packaged build. Do not call syntax tests an Unreal build.

First checkpoint: connect to the available PC/editor with the user's configured
tools, verify UE version/access, run the generator, stage/import the existing
SCOUT plus transformer/workbench/crate, preserve assembly/pivots, assign correct
PBR maps, and capture actual day/night and dry/wet screenshots. Use originals or
existing exports; do not recreate drone geometry. Blender procedural shaders do
not automatically transfer. Verify centimetre scale and normal-map convention.

Fix startup/import/shader issues, save the real assets/map, reopen to verify, then
commit and push only this Unreal branch. Report exactly what ran and what remains.
If PC/editor access is missing, state the specific blocker; do not fabricate
screenshots or claim a playable export.

Keep the first pass compact. Defer the 200 m environment, bike, crafting, quests,
NPCs, dense vegetation, and full weather. After the visual checkpoint, the next
bounded feature is walking plus SCOUT FPV flight with pitch/roll/yaw/throttle and
keyboard/mouse + Xbox controller (not Xbox-console deployment).

Art direction: grounded near-future Central Texas utility infrastructure, dark
industrial surfaces, wet/weathered materials, restrained cyan and amber practical
lighting, plausible engineering. Prioritize real materials and lighting over
adding more placeholder geometry. Use concise updates, reuse existing work, and
avoid unrelated refactors or unbounded polish loops.
