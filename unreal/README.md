# GRIDRUNNER - Unreal

The current Windows milestone is **Ghost Signal Field Slice**. From this folder,
run `Launch-FieldSlice.cmd`, or open
`GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject` in Unreal Engine 5.8.
The startup map is `/Game/GRIDRUNNER/Maps/L_GhostSignal_FieldSlice`.

Read [FIELD-SLICE.md](FIELD-SLICE.md) for controls, the playable route, restoration
and build commands. [HANDOFF.md](HANDOFF.md) records the latest continuation state.
Downloaded sources remain in the separate [asset hub](ASSET-LIBRARY.md) at
`D:\UNREAL-GRIDRUNNER-ASSETS`; [ASSET-STATUS.md](ASSET-STATUS.md) identifies the packs.

## Current field slice

The native C++ controller connects walking, a Chaos motorcycle with an electric
drivetrain model, a mounted Manny idle, and the approved SCOUT assembly. SCOUT's
19 copied parts retain their materials and relative transforms. Assisted
pitch/roll/yaw flight includes collision sweeps, energy use and return/landing.

The route now has three interactive stages: restore the service disconnect,
recover the corridor relay's power cell, then scan and decode the far receiver
with SCOUT before returning to its terminal. Mission state saves at interactions,
dismount and normal Escape exit. Restored relays recharge nearby equipment.

Selected Freeway props dress the existing corridor, with access openings in the
guardrails. Niagara fault sparks react to relay restoration. Wind/bird ambience,
night rain audio, scanner visibility, night vision and day/night controls are
connected to the running game. Rain audio does not constitute a weather simulation.

The bike still has its imported combustion-enduro exterior. Its battery/motor
remodel, mount/dismount animation transitions, rider IK, a custom protagonist,
inventory/crafting, NPCs and the full Three.js gameplay set remain future work.
Keyboard and Xbox mappings are implemented; physical controller/mobile testing
and a full graphics/performance pass remain separate from this Windows build.

## Validation state

The native `GRIDRUNNERGameEditor` and `GRIDRUNNERGame` Development targets compiled
in UE 5.8.2. The integration generator saved and reopened the map, preserved the
approved source fingerprints and resolved 417 checked packages with none missing.
The generated field map contains 390 actors. Recorded build output is retained in
[field_editor_build.log](validation/field_editor_build.log) and
[field_game_build.log](validation/field_game_build.log); map checks are in
[field_integration.json](validation/field_integration.json).

The final running-game smoke test passed all 18 checks: walking, Chaos bike
propulsion, possession/dismount, wind playback, relay Niagara, SCOUT flight,
energy/return, scanning, relay progression and save persistence. Earlier bike
obstruction and return-test timing failures were corrected before this pass.
See [field_runtime_smoke.json](validation/field_runtime_smoke.json) for the result.

`tools/Field-Workflow.ps1` builds, integrates, verifies, launches or packages the
milestone. `tools/Restore-FieldAssets.ps1` restores the exact selected vendor and
installed-engine template dependencies using their SHA-256 manifests. The public
repository excludes the selected raw vendor and template files; restore those
dependencies from your licensed sources and matching engine installation first.

The validation PC is a GTX 1050 Ti. Current defaults retain DX12/SM6 but disable
Lumen GI/reflection rendering and Virtual Shadow Maps, use 75% screen percentage
and an 1800 MB texture pool. Screenshots are not performance benchmarks.
Build/package capability and a source game window are not proof of a tested
standalone packaged executable; completed validation records establish that.

## Historical Ghost Signal prototype

`/Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype` remains the original on-foot
500 m highway/utility-corridor foundation, combining Epic's third-person template
with GRIDRUNNER's approved field assets. Its four objective signs were markers;
the interactive logic is implemented in the newer Field Slice map.

[Original engine overview](validation/ghost_signal_overview.png) -
[Original map manifest](validation/gameplay.json) -
[Original capture record](validation/gameplay_capture.json)

`Launch-GhostSignal.cmd` is the historical prototype tool. Use the Field Slice
launcher for current work. Do not rerun the old generator to update the current
map: its earlier implementation depended on which map the editor had open.

## Preserved Unreal Asset Lab

The compact 40 m showroom remains at `/Game/GRIDRUNNER/Maps/L_AssetLab_Showcase`.
It contains the approved SCOUT, pad transformer, workbench and supply crate,
imported and verified in UE 5.8.2 using Interchange. SCOUT remains a 19-part
assembly; its source meshes, pivots and material slots were not combined.

| Asset | Imported bounds, cm |
| --- | --- |
| SCOUT | 52.10 x 41.73 x 12.39 |
| Transformer | 205 x 148 x 155.80 |
| Workbench | 192 x 94.70 x 121 |
| Crate | 78.60 x 59.41 x 46 |

SCOUT uses sRGB albedo and linear metallic/roughness/AO. Its OpenGL normal PNGs
use Normalmap compression, linear sampling and a green-channel flip. Props retain
their glTF atlas materials and metallic/roughness channels. The historical wet
variant changes roughness; it does not simulate rain.

[Day/dry](validation/screenshots_final/day_dry.png) -
[Day/wet](validation/screenshots_final/day_wet.png) -
[Night/dry](validation/screenshots_final/night_dry.png) -
[Night/wet](validation/screenshots_final/night_wet.png) -
[Showroom overview](validation/screenshots_final/overview_day.png)

These original showroom captures used Lumen and Virtual Shadow Maps. Those
settings describe the historical captures, not the current low-end field defaults.

Keep approved Blender sources, Three.js and Godot unchanged. Commit Unreal work
only to `unreal`; do not force-push or merge it into `main` without approval.
