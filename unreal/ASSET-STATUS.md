# GRIDRUNNER downloaded assets — 2026-09-14

The desktop **GRIDRUNNER Assets** shortcut opens `D:\UNREAL-GRIDRUNNER-ASSETS`.
Use **Open-Asset-Inbox.cmd** for future Fab additions and **Open-Asset-Review.cmd**
for the selected evaluation collection. The existing game opens through
**Open-GRIDRUNNER.cmd**. Original source projects retain their locations.

## Source project labels

| Existing project | Identified contents |
| --- | --- |
| `FactoryEnvironment` | Factory, Warehouse, Unfinished Building, walk animations |
| `FactoryEnvironmentCollect` | Factory and motorcycle interaction animations |
| `MetaHumans` | MetaHuman sample and Sparks & Embers |
| `MetaHumans2` | Second MetaHuman sample copy |
| `MyProject` | Rigged motorcycle, Freeway Props, Free Sounds Pack, template content |
| `UNREAL-GRIDRUNNER-ASSETS/MyProject2` | Template content at time of scan |

The mixed factory projects and MetaHuman projects contain different additions.
Nothing was deleted as a duplicate. Named Browse shortcuts and the searchable
catalog make the contents identifiable without renaming package paths.

## Evaluation collection

An initial 871-file, 5,177,192,170-byte copy was verified using SHA-256. Two demo
dependencies were subsequently copied and verified from the same source projects.
The review project is on D:, outside the game repository. Its original copy
manifest and Unreal audit reports are kept alongside the `.uproject`.

| Collection | Asset Registry result | Intended GRIDRUNNER use |
| --- | --- | --- |
| Freeway Props | 168 static meshes in 452 assets | Highway barriers, signs and roadside detail |
| Motorcycle | 58 assets; skeletal mesh, skeleton, physics asset, controls | Electric-enduro conversion and movement foundation |
| Motorcycle Interaction Animations | 208 assets; 97 animation sequences including demo locomotion | Select riding, mount/dismount and interaction clips; adapt rider rig |
| Sparks & Embers | 51 assets including 10 Niagara systems | Electrical sparks and environmental effects |
| Free Sounds Pack | 50 SoundWave assets and 50 SoundCues | Audition and assign interaction/world sounds |

Registry counts establish package presence and types, not visual quality or
gameplay readiness. Rendering, collision response, bike handling, rider retargeting
and audio suitability still need in-engine evaluation. The downloaded motorcycle
is not yet an electric GRIDRUNNER vehicle. These collections are not yet migrated
into the game or committed as raw assets to GitHub.

## Reference repair

Five stale package paths in the original motorcycle demo affected 20 Control Rig
and pose assets. Their staging copies were byte-identical to the originals before
repair. The correct assets were already present elsewhere in the same pack.
The evaluation copies were loaded and resaved using temporary exact package
redirects, with all 20 original files backed up outside Content. The original
configuration was restored afterward. A fresh Unreal audit then reported zero
missing `/Game` package references across all five selected collections.

The three legacy demo Control Rigs were then recompiled, their generated classes
resolved, and the packages saved in a fresh UE 5.8 session. That check exited
successfully without Blueprint, RigVM, Python or asset-load errors in its log.
[Recorded rig check](validation/asset_library_rigs.json).

This check covers package paths; it does not establish gameplay or visual parity.
Detailed results are in [the recorded audit](validation/asset_library_audit.json).

## Environment and startup

Unreal 5.8.2 is installed. Visual Studio 2022 Build Tools 17.14.40 and Windows SDK
10.0.22621.0 are present; MSVC compiler file version is 19.44.35228.0. No reboot
was required. Unreal's ValidatePlatforms check completed successfully.

The remote process environment lacked `TMP`, causing Build.bat to retry its lock
file indefinitely. Providing process-local TMP/TEMP on D: allowed the Unreal
audit to finish. The new launch commands set temporary/cache locations on D:;
they do not change global Windows environment settings.

C: had about 4 GiB free during this pass, while D: had over 1.8 TiB free. New
downloads should use the D: inbox/source-project folders. Existing active source
locations remain intact. An hourly check is enabled for the next 24 hours to
report meaningful download or disk-space changes.

The game remains an on-foot prototype with the existing SCOUT and field assets.
Its four objective markers do not yet implement missions. Bike control, SCOUT
flight, inventory and electrical gameplay remain conversion work.
