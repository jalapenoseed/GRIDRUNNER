# GRIDRUNNER — Unreal Asset Lab
Open `unreal/Launch-AssetLab.cmd` on Windows, or `GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject` in UE 5.8.
The saved startup map is `/Game/GRIDRUNNER/Maps/L_AssetLab_Showcase`; generation is unnecessary for normal use.

This compact 40 m editor showroom contains the existing SCOUT, pad transformer, workbench and supply crate.
The scene was generated and imported in UE **5.8.2**, using Interchange scene import.
SCOUT keeps 19 separate mesh actors within its imported hierarchy. Placement translates assembly roots; it does not combine meshes, recenter pivots or rescale geometry.

| Asset | Imported bounds, cm |
| --- | --- |
| SCOUT | 52.10 × 41.73 × 12.39 |
| Transformer | 205 × 148 × 155.80 |
| Workbench | 192 × 94.70 × 121 |
| Crate | 78.60 × 59.41 × 46 |

SCOUT's separate PBR maps are assigned through material instances: albedo uses sRGB; metallic, roughness and AO are linear.
Loose OpenGL normal PNGs use Normalmap compression, linear sampling and a green-channel flip.
Props retain their embedded glTF atlas materials and metallic/roughness channel mapping.
Wetness adjusts roughness on SCOUT and the test surfaces. It is a material comparison, not simulated rain.

[Day/dry](validation/screenshots_final/day_dry.png) · [Day/wet](validation/screenshots_final/day_wet.png) · [Night/dry](validation/screenshots_final/night_dry.png) · [Night/wet](validation/screenshots_final/night_wet.png) · [Overview](validation/screenshots_final/overview_day.png)
Actual engine capture and reopen records: [captures.json](validation/captures.json), [imports.json](validation/imports.json).
DX12/SM6, Lumen GI/reflections and Virtual Shadow Maps are configured. The test PC uses a GTX 1050 Ti; these images are not a performance benchmark.
Use right-mouse + WASD to inspect. In Output Log Python mode, `import lab_presets; lab_presets.apply("night")` changes lighting; `"day"` restores daylight.

`tools/prepare_assets.py` stages existing exports without changing sources; its six tests passed. `Content/Python/finish_asset_lab.py` imports a fresh showcase and refuses duplicate placement.
`capture_asset_lab.py` runs with `-ExecCmds="py <absolute-script-path>"`, reopens the scene, captures five images, restores day/dry and saves. Preserve existing captures before rerunning.
The launcher supplies missing TMP/ComSpec variables required in remote sessions. No C++ build is required.
Keep Three.js, Godot and Blender originals intact. Walking, drone flight, quests, crafting, NPCs, large environments, full weather and a packaged game remain outside this checkpoint.
