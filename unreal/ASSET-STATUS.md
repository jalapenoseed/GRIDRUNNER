# GRIDRUNNER asset integration - 2026-09-14

The current game opens through `unreal/Launch-FieldSlice.cmd` at
`/Game/GRIDRUNNER/Maps/L_GhostSignal_FieldSlice`. See [FIELD-SLICE.md](FIELD-SLICE.md)
for controls and reproduction steps, and [HANDOFF.md](HANDOFF.md) for current
verification results and remaining work.

The desktop **GRIDRUNNER Assets** shortcut opens `D:\UNREAL-GRIDRUNNER-ASSETS`.
`Open-Asset-Inbox.cmd` is for future Fab additions; `Open-Asset-Review.cmd` opens
the reviewed source snapshot. Original downloads retain their locations and
internal package paths. Selected dependencies are now integrated into the game
on the Unreal PC; the complete source collections remain separate.

## Selected game content

| Downloaded collection | Current integration |
| --- | --- |
| Freeway Props | Seven native-scale meshes placed as 20 roadside props; three guardrail openings preserve relay access |
| Rigged motorcycle | Skeletal mesh, physics, wheels and suspension drive the native Chaos bike; electric torque/energy model added |
| Motorcycle Interaction Animations | Manny mesh and mounted idle selected; rider IK and animated mounting remain follow-up work |
| Sparks & Embers | Selected Niagara systems/materials support the field relay fault effect |
| Free Sounds Pack | Selected wind, bird and rain cues provide world ambience |

`validation/field_vendor_manifest.json` records the exact selected package
dependency closure and file SHA-256 digests. `validation/field_template_manifest.json`
records matching installed-engine template dependencies. The restore script
checks both before copying and refuses modified destination overwrites. These
selected raw third-party files are ignored by Git and are restored locally from
the user's licensed source collections and matching UE installation.

The approved GRIDRUNNER SCOUT, transformer, workbench and crate remain intact.
The flying SCOUT uses copies of all 19 approved mesh parts. Its source assembly
and PBR slots are preserved. The imported motorcycle exterior has not yet been
remodeled into the proposed GRIDRUNNER electric enduro.

Native Editor and Game Development targets compiled in UE 5.8.2, and map integration
and reopen/dependency checks completed: 390 actors and 417 packages with none
missing. See [Editor build output](validation/field_editor_build.log),
[Game build output](validation/field_game_build.log) and
[map integration report](validation/field_integration.json).
The final running-game smoke test passed all 18 checks, including Chaos bike
propulsion, SCOUT flight/energy/return, wind playback, relay sparks, mode transitions,
scanning, mission progression and saving. Earlier showroom obstruction and
return-test timing failures were corrected before the final run. See
[runtime validation](validation/field_runtime_smoke.json). This validates the
running source project; a packaged executable remains a separate validation step.

## Original download locations

| Existing project | Identified contents |
| --- | --- |
| `FactoryEnvironment` | Factory, Warehouse, Unfinished Building, walk animations |
| `FactoryEnvironmentCollect` | Factory and motorcycle interaction animations |
| `MetaHumans` | MetaHuman sample and Sparks & Embers |
| `MetaHumans2` | Second MetaHuman sample copy |
| `MyProject` | Rigged motorcycle, Freeway Props, Free Sounds Pack, template content |
| `UNREAL-GRIDRUNNER-ASSETS/MyProject2` | Template content at the organization scan |

The mixed factory and MetaHuman projects contain distinct additions. Nothing was
deleted as a duplicate. Factory/Warehouse/Unfinished Building and MetaHuman
protagonist content have not been included in this compact field integration.

## Historical review snapshot

The initial review copied 871 files / 5,177,192,170 bytes with SHA-256 equality;
two demo dependencies were subsequently copied and verified. This full review
project stays on D: outside the repository, with its copy manifest and audits.
The initial registry inventory was:

| Collection | Review inventory |
| --- | --- |
| Freeway Props | 168 static meshes in 452 assets |
| Motorcycle | 58 assets, including skeletal rig, physics and controls |
| Motorcycle Interaction Animations | 208 assets, including 97 animation sequences and demo locomotion |
| Sparks & Embers | 51 assets, including 10 Niagara systems |
| Free Sounds Pack | 50 SoundWave assets and 50 SoundCues |

These are full review counts, not the smaller migrated set and not quality or
performance measurements. The field manifest identifies what the game uses.

## Preserved reference-repair history

Five stale package paths in the original motorcycle demo affected 20 Control Rig
and pose assets. The review copies were loaded/resaved using temporary exact
package redirects, with original files backed up outside Content. The prior
configuration was then restored. A fresh audit reported zero missing `/Game`
package references across the five reviewed collections.

The three legacy demo Control Rigs were recompiled, their generated classes
resolved, and their packages saved in a fresh UE 5.8 session without Blueprint,
RigVM, Python or asset-load errors. See the [rig check](validation/asset_library_rigs.json)
and [review audit](validation/asset_library_audit.json). Original downloads were
not rewritten by this repair.

## Environment

Validation uses Unreal 5.8.2, Visual Studio 2022 Build Tools 17.14.40, Windows SDK
10.0.22621.0 and MSVC 19.44.35228.0. The native build also requires the .NET
Framework 4.8 SDK. Editor/game target compilation is separate from cooking,
packaging, device testing and performance qualification.

The organization pass found only about 4 GiB free on C: and over 1.8 TiB on D:.
Current launch/build commands set process-local temporary and derived-cache
directories on D:. Source downloads and the asset hub also remain there when
possible. A missing remote `TMP` previously caused a Build.bat lock retry; the
workflow supplies TEMP/TMP and a command-interpreter fallback explicitly.

An hourly download check was configured during the earlier organization pass
for 24 hours. That historical setup is not proof the check is still active.
