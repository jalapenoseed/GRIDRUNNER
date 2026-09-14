# GRIDRUNNER — Unreal Asset Lab 0.1

An independent **UE 5.8 content-only starter**, branched from `main` at
`c5a20775f127dd1b854900770d0a7f7fed5e5350` (v7.6 Flight Yard). Nothing in the
Three.js game, Godot branch, or approved Blender sources is changed.

## Status — read first

This is project configuration and editor-generation source, **not a packaged
game or an editor-verified scene**. Unreal Editor was unavailable in the build
environment. The `.umap` and `.uasset` files are generated on your PC; no fake
binary assets or renders are included. Local checks cover Python syntax,
project JSON/configuration, and the asset-staging helper with synthetic fixtures.
They do not validate Unreal APIs, shaders, real GLB imports, or performance.

## First run on Windows

1. Check out the `unreal` branch of the existing GRIDRUNNER repo. If you have
   uncommitted work, use a separate checkout/worktree instead of switching over it.
2. Open `unreal/GRIDRUNNERAssetLab/GRIDRUNNERAssetLab.uproject` in UE 5.8.
   This is a Blueprint/content-only project; there is no C++ module to compile.
3. Wait for shaders, then save any open map/assets. In **Tools > Execute Python
   Script**, run `Content/Python/build_asset_lab.py` inside this project.
4. The script creates and opens `/Game/GRIDRUNNER/Maps/L_AssetLab`: a 40 m square
   material yard, workshop shell, drone plinth, prop pad, five material samples,
   cyan/amber lights, atmosphere/fog, PlayerStart, and three cinematic cameras.
   These are deliberately simple staging geometry, not finished GRIDRUNNER art.
5. Save All. Set `L_AssetLab` as Editor Startup Map and Game Default Map in
   Project Settings > Maps & Modes after confirming it exists. Until then the
   project opens Unreal's built-in Entry map, so first launch has no missing map.

Use the editor viewport (right-mouse + WASD) to inspect. The project has no custom
walk character, bike, FPV drone pawn, or controller mappings yet. Do not confuse
the engine's default fly pawn with the game's drone physics.

The generator refuses to replace `L_AssetLab`, refuses to run during PIE, and
refuses to discard dirty maps/assets. If interrupted after creating a partial
level, save/inspect it and rename the partial map in Unreal before retrying.
It reuses existing material assets without changing their authored values.

## Bring in the existing art

From the repository root, run with Python 3:

```powershell
py unreal/tools/prepare_assets.py
```

This reads the existing `dist/assets` files and stages SCOUT, the pad transformer,
workbench, supply crate, and shared drone textures under `unreal/ImportStaging/`.
It decompresses SCOUT's lossless `.glb.gz`, checks the GLB header/JSON, and prints
source/output paths and SHA-256 hashes. It does not change the originals or fetch
anything. Repeating it is safe; different existing staging files are protected.
Other drone variants can be added to `SELECTION` later.

Import the staged GLBs with Unreal's glTF/Interchange support. For assembled
multi-part drones, use the scene-preserving import workflow available in the
installed editor (Import Into Level) and verify the node transforms. An ordinary
Content Browser mesh import can produce separate mesh assets; do not pile those
parts at a single origin or silently combine away rotor/gimbal pivots. Start with
SCOUT on the named plinth, then place the three props on the pad.

If a compatible glTF scene importer is unavailable, export FBX from a **copy** of
the original Blender model. Record the actual importer/version and scale result.
Do not install third-party plugins or edit canonical `.blend` sources just to
make this quick starter work.

The existing drone manifest reports 1,024 px runtime maps and OpenGL normals.
Use the original higher-resolution library maps later when they are available.

| Source | Unreal setup |
| --- | --- |
| Albedo/base color | sRGB enabled |
| Metallic, roughness, AO, masks | sRGB disabled; separate maps retained |
| Normal | Normal-map compression; sRGB disabled; verify/flip green for OpenGL source |
| Blender procedural nodes | Bake/export or rebuild in Unreal; not automatically portable |
| glTF scale | Validate actual dimensions; Unreal units are cm, glTF units are metres |

Validate one normal-map result under grazing light before applying a green-channel
flip across a batch; an importer may already account for the source convention.
Preserve material slots and animated-component pivots. Enable Nanite selectively
on supported static geometry after visual checks, and use simple collision.
No Nanite assets, drone LOD chain, or collision generation is delivered in 0.1.
Do not force a triangle budget or regenerate the approved drone to meet one.

The sample `M_GR_Surface` uses color/metallic/roughness parameters and a wetness
roughness blend, with five material instances. It is a material-test baseline,
not the complete procedural Blender library, rain simulation, or a textured
production master. Assign the imported PBR maps explicitly in the next pass.

## Lighting comparisons

After generating/opening `L_AssetLab`, use the **Python** command mode in the
Output Log:

```python
import lab_presets; lab_presets.apply("day")
import lab_presets; lab_presets.apply("dusk")
import lab_presets; lab_presets.apply("night")
```

Each command is a separate choice. They change the lab sun/skylight and sample
material wetness in the editor; changes remain unsaved until Save All. They are
not runtime day/night cycling or weather. Night retains a little skylight; set it
to zero for a blackout comparison. Auto-exposure is disabled for consistent
material comparison. All intensities are initial artistic values, not calibrated
outdoor measurements. Tune exposure and real asset lighting on the target GPU.

Lumen GI/reflections, mesh distance fields, DX12, and Virtual Shadow Maps are
requested in configuration. Verify actual support and active settings on the PC.
Hardware ray tracing and MegaLights are not forced. Pilot the named CineCamera
actors for stills; no render sequence or movie is delivered yet.

## Scope and next checkpoint

Finish the first real-art comparison: one assembled SCOUT, three props, correct
PBR maps, dry/wet and day/night screenshots. Then add walking and Xbox-controller
FPV flight with pitch/roll/yaw/throttle, before expanding toward a 200 m environment.
Bike, crafting, saves, quests, NPC AI, dense vegetation, rain, scan/night vision,
and full game migration are deliberately deferred. Keep the browser build intact.

Do not commit Binaries, Intermediate, Saved, caches, or duplicate staging exports.
Generated `.uasset`/`.umap` files are not ignored: commit verified originals needed
to open the finished lab. Agree on Git LFS before adding large binary packs; this
starter does not migrate existing repo assets or assume LFS is configured.

## Checks

```powershell
py -m unittest discover -s unreal/tests -v
py -m compileall -q unreal/tools unreal/tests unreal/GRIDRUNNERAssetLab/Content/Python
```

Before calling the lab playable or polished, open it in UE, check Output Log,
inspect mesh scale/materials/hierarchy, run PIE, measure performance on the named
GPU/resolution, reopen the saved project, and capture actual editor screenshots.

## References

- [UE 5.8 release](https://www.unrealengine.com/news/unreal-engine-5-8-is-now-available)
- [Epic: LevelEditorSubsystem API](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/LevelEditorSubsystem?application_version=5.6)
- [Epic: MaterialEditingLibrary API](https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/MaterialEditingLibrary?application_version=5.6)

The linked Python API pages document baseline methods; UE 5.8 execution still
needs validation. Read `HANDOFF.md` for the bounded continuation task.
