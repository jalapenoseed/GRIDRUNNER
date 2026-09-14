# GRIDRUNNER Unreal continuation

Repository: `jalapenoseed/GRIDRUNNER`, branch `unreal`.
Project: `unreal/GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject`.
Windows checkout: `D:\GRIDRUNNER-Unreal`.

Start with `unreal/Launch-GhostSignal.cmd`; the startup map is
`/Game/GRIDRUNNER/Maps/L_GhostSignal_Prototype`.
The original verified showroom remains at `L_AssetLab_Showcase`.

Verified in Unreal 5.8.2:

- Ghost Signal map generated and saved with 255 actors;
- 10 highway segments, 16 utility poles and 5 route beacons;
- 10 broad terrain tiles and 14 distant hill silhouettes;
- UE third-person character, animation and Enhanced Input assets resolve;
- keyboard/mouse, Xbox-compatible gamepad and touch mappings are present;
- SCOUT's 19-part imported assembly and its PBR materials remain intact;
- playable map reopened and all required actors/assets passed verification;
- a real 1280×720 engine overview was captured.

The validation PC has an NVIDIA GTX 1050 Ti on driver 531.30. UE 5.8 flags that
driver as denylisted and pauses interactive game startup at a warning dialog.
Update to the driver version Unreal recommends or dismiss the warning locally.
Do not claim packaged-build validation until that interactive gate is cleared.

Next milestone: possessable SCOUT flight and electric-enduro gameplay after the
chosen Fab bike, rider animations and audio are installed. Preserve assembly,
pivots, material slots and all Blender originals. Do not replace the approved
SCOUT mesh. Keep Three.js and Godot untouched.

Commit only Unreal work on this branch. Never force-push or merge into `main`.
