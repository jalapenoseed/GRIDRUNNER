# GRIDRUNNER — Ghost Signal FieldSlice handoff

Continue `jalapenoseed/GRIDRUNNER` on branch `unreal`. The working Windows project
is `D:\GRIDRUNNER-Unreal\unreal\GRIDRUNNERAssetLab\GRIDRUNNERAssetLab.uproject`.
The current gameplay map is `/Game/GRIDRUNNER/Maps/L_GhostSignal_FieldSlice`.
Preserve the separate prototype/showroom, approved Blender originals, Three.js
and Godot projects.

## Verified milestone

- Native `GRIDRUNNERGameEditor` and `GRIDRUNNERGame` C++ targets compiled under
  Unreal Engine 5.8.2. The C++ toolchain and SDK installation issues are resolved;
  the PC uses graphics driver 582.66.
- FieldSlice was built, saved and reopened with 390 actors, 20 selected Freeway
  props and three native relay actors. Native mesh scale, materials, collision,
  dependencies and clear relay approaches were checked. The saved/reopened audit
  checked 417 hard and soft package dependencies with none missing.
- All 19 approved SCOUT source components retain their assembly transforms,
  mesh references and material slots. Transformer, workbench and crate preservation
  checks also passed.
- Final runtime pass 3 passed all 18 checks: walking, Chaos bike propulsion and
  safe dismount, SCOUT thrust/energy/return/landing, Niagara/audio activation,
  relay progression, proximity scan, route completion and persistent save.
  The bike accelerated to approximately 59 km/h and travelled 43 m during the
  five-second propulsion test before braking to a stop.
- Missing Manny mesh, material and texture packages are restored from Epic's
  installed template content and recorded in `field_template_manifest.json`.
  The dependency audit explicitly includes the Third Person character and default
  input mapping, including their full closure.

The bike now spawns at `(2600, -200, 120)` clear of the inherited showroom.
The camera boom is raised above road contact, parked AI possession is disabled,
and camera exposure is set explicitly for each player mode.

## Launch and verification

From the repository's `unreal` directory:

```powershell
.\Launch-FieldSlice.cmd build
.\Launch-FieldSlice.cmd integrate
.\Launch-FieldSlice.cmd verify
.\Launch-FieldSlice.cmd
```

`Launch-FieldSlice.cmd` delegates to `tools/Field-Workflow.ps1`. No argument opens
the standalone game through the installed editor. `editor` opens FieldSlice for
editing; `package` requests a Win64 Development package. Packaging success must
be established separately. Temporary files and derived caches are directed to D:.

Read `FIELD-SLICE.md` for controls, route progression and known gameplay limits.
`validation/field_integration.json` records map save/reopen checks.
`validation/field_runtime_smoke.json` records the verified runtime checks;
`validation/field_runtime.log` and `validation/field_screenshots/` retain evidence.
Editor and Game build logs are also under `validation/`. Fresh runs write to
`GRIDRUNNERAssetLab/Saved/Validation/field_runtime_smoke.json`.
The smoke test uses a separate save slot.

## Assets and restoration

`validation/field_vendor_manifest.json` records 232 selected third-party files,
approximately 1.68 GB, with exact paths and SHA-256 digests. These licensed asset
packages stay on the user's PC and are ignored by the public repository. Preserve
their native Content paths. Use `tools/Restore-FieldAssets.ps1` with the reviewed
asset project's Content directory to restore matching files on a fresh checkout.
Do not commit entire downloaded collections or present the public source checkout
as a self-contained distributable game.

The repaired Epic character packages and exact hashes are recorded in
`validation/field_template_manifest.json`. Their original source root is:

`C:\Program Files\Epic Games\UE_5.8\Templates\TemplateResources\High\Characters\Content\`

They belong under the project's `Content\Characters\` using the matching relative
paths. Note that `Templates` is directly
under `UE_5.8`, and the source Content folder does not contain a further Characters
folder. Earlier handoff paths containing `Engine\Templates` were inaccurate.

## Remaining scope

This milestone runs through the installed editor in a standalone game window;
no cooked Win64 package has been validated. Full e-bike mesh conversion,
mount/dismount animation transitions, rider IK, custom protagonist, expanded audio
and full weather remain follow-up work. Keyboard and Xbox mappings are implemented;
physical-controller and mobile compatibility require device testing.
