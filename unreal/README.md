# GRIDRUNNER — Unreal

Open `unreal/Launch-GhostSignal.cmd` on Windows, or open
`GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject` in Unreal Engine 5.8.
The saved startup map is `/Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype`.

Downloaded Fab collections now have a separate [asset library and staging guide](ASSET-LIBRARY.md).
The Windows hub is `D:\UNREAL-GRIDRUNNER-ASSETS`; open the desktop **GRIDRUNNER Assets** shortcut.

## Ghost Signal playable prototype

This is the first playable Unreal conversion of the current GRIDRUNNER concept.
It combines Epic's UE 5.8 Third Person Blueprint template with the approved
SCOUT and electrical/field assets already imported into the branch.

The map is an authored 500 m highway and utility corridor with a relay outpost,
substation-style yard, debris, power poles, cyan route beacons, broad terrain,
Hill Country silhouettes and four staged exploration objectives:

1. Restore the relay.
2. Retrieve the power cell.
3. Deploy SCOUT.
4. Trace the ghost signal.

These four objectives are currently world markers and labels. Their interaction,
power-cell inventory, SCOUT deployment and completion logic are not implemented yet.

Controls come from Epic's Enhanced Input template: WASD + mouse + Space,
Xbox-compatible left/right sticks + A, and touch controls. Run the game with:

```text
Launch-GhostSignal.cmd play
```

The validation PC's NVIDIA 531.30 driver is denylisted by UE 5.8. Update it or
dismiss Unreal's driver warning before the first interactive run. Editor map
generation, reopen validation and off-screen rendering all completed in 5.8.2.

[Ghost Signal engine render](validation/ghost_signal_overview.png) ·
[Gameplay manifest](validation/gameplay.json) ·
[Capture record](validation/gameplay_capture.json)

`Launch-GhostSignal.cmd build` runs the non-destructive generator. It bootstraps
from the validated showroom, refuses to duplicate authored content, and can add
the terrain upgrade to an earlier prototype. `verify` reopens the saved map and
checks the game mode, character, input, terrain, objectives and electrical
material. `capture` creates the real Unreal overview shown above.

## Unreal Asset Lab

Open `unreal/Launch-AssetLab.cmd` to inspect the original compact 40 m showroom.
The saved map is `/Game/GRIDRUNNER/Maps/L_AssetLab_Showcase`.
It contains the existing SCOUT, pad transformer, workbench and supply crate.
The scene was generated and imported in UE **5.8.2** using Interchange.
SCOUT keeps 19 separate mesh actors within its imported hierarchy; placement
does not combine meshes, recenter pivots or rescale geometry.

| Asset | Imported bounds, cm |
| --- | --- |
| SCOUT | 52.10 × 41.73 × 12.39 |
| Transformer | 205 × 148 × 155.80 |
| Workbench | 192 × 94.70 × 121 |
| Crate | 78.60 × 59.41 × 46 |

SCOUT's separate PBR maps use sRGB albedo and linear metallic, roughness and AO.
OpenGL normal PNGs use Normalmap compression, linear sampling and a green-channel
flip. Props retain their embedded glTF atlas materials and metallic/roughness
channel mapping. Wetness currently adjusts roughness rather than simulating rain.

[Day/dry](validation/screenshots_final/day_dry.png) ·
[Day/wet](validation/screenshots_final/day_wet.png) ·
[Night/dry](validation/screenshots_final/night_dry.png) ·
[Night/wet](validation/screenshots_final/night_wet.png) ·
[Overview](validation/screenshots_final/overview_day.png)

DX12/SM6, Lumen GI/reflections and Virtual Shadow Maps are configured. The
validation PC uses a GTX 1050 Ti, so captures are not performance benchmarks.

## Scope and next conversion steps

The current branch is a playable on-foot exploration foundation, not a claim
that every Three.js system has already migrated. The next clean milestones are:

- import the selected rigged electric enduro and motorcycle interaction animset;
- build Chaos-based e-bike movement, battery, regen and rider IK;
- convert SCOUT's hierarchy into a possessed flight pawn with pitch/yaw/roll;
- add runtime scan/night-vision/weather modes and electrical Niagara effects;
- migrate inventory, crafting, relay puzzles, NPCs, audio and save state;
- replace prototype terrain/structures with curated Fab and GRIDRUNNER packs.

Keep Blender sources, Three.js and Godot untouched. Commit Unreal work only on
the `unreal` branch; never force-push or merge it into `main` without approval.
