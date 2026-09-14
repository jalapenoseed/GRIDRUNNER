# GRIDRUNNER Unreal continuation
Repository: `jalapenoseed/GRIDRUNNER`, branch `unreal`.
Project: `unreal/GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject`.
Windows checkout: `D:\GRIDRUNNER-Unreal`. Open `unreal/Launch-AssetLab.cmd`.

Read README.md and validation/captures.json before continuing.
The showroom and four existing assets have been generated and saved in UE 5.8.2.
The startup map is L_AssetLab_Showcase; normal use does not require rerunning generators.
SCOUT retains its assembled hierarchy and separate mesh parts. Do not rebuild it.
SCOUT PBR maps are bound explicitly; prop atlas materials come from Interchange.
Capture outputs are real Unreal renders in validation/screenshots_final.
The saved scene returns to day/dry after capture.

Fixes include the fog API, remote-launch environment, SM6 configuration, camera framing and capture callback reentrancy.
The test PC has a GTX 1050 Ti with driver 531.30. Do not claim benchmarked frame rates or maximum-fidelity hardware rendering.
Wetness is currently a roughness control for SCOUT and sample surfaces.
The PC may contain an untracked L_AssetLab partial bootstrap map and first-pass screenshots; preserve them as local diagnostics, and use the saved Showcase map.

Continue with bounded material/asset presentation improvements as more approved exports arrive.
Keep Blender sources, Three.js and Godot untouched. Defer gameplay migration, crafting, quests, NPCs and a large environment.
Commit only Unreal work on this branch; never force-push or merge it into main.
