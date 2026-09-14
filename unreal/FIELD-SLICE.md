# Ghost Signal — Unreal field slice

This milestone connects selected downloaded content to GRIDRUNNER's existing
Unreal exploration map. Open `Launch-FieldSlice.cmd` on the Unreal PC. The
standalone game window uses `L_GhostSignal_FieldSlice`; the original prototype
and verified asset showroom remain available as separate maps.

## Play the route

Restore the service disconnect near the start, ride to the corridor relay to
recover its power cell, then reach the far receiver. Deploy SCOUT, enable the
scanner within 16 m of the receiver and hold position while it decodes the
carrier. Return to the terminal on foot to complete the route. Restored relays
recharge a nearby bike and a landed SCOUT. Mission progress saves at interactions,
dismount and normal Escape exit.

| Action | Keyboard / mouse | Xbox controller |
| --- | --- | --- |
| Walk / steer | WASD | Left stick |
| Walk camera | Mouse | Right stick |
| Jump | Space | A |
| Interact / mount | E | X |
| Dismount below 5 km/h | B | B |
| Bike throttle / reverse | W / S | RT / left stick back |
| Bike brake | Space | LT |
| Deploy SCOUT / return | F | Y |
| SCOUT tilt | WASD | Left stick |
| SCOUT yaw | Q / E or mouse | Right stick horizontal |
| SCOUT rise / descend | Space / Ctrl | RT / LT |
| Scanner visibility | Tab | LB |
| Night vision | N | RB |
| Day / night | T | Keyboard shortcut |
| Help panel | H | Menu |
| Save and quit | Escape | Keyboard shortcut |

## Systems and assets

- Native C++ player controller, HUD, mode transitions, relay sequence and SaveGame.
- Chaos two-wheel movement using the downloaded bike's skeletal rig, physics asset,
  wheels and suspension. A fixed-ratio electric torque model drives acceleration,
  consumption and limited regenerative recovery. The imported enduro exterior
  still needs the planned battery/motor remodel.
- Manny's mounted idle animation supplies a rider. Mount/dismount transitions,
  hand/foot IK and a custom protagonist remain follow-up work.
- SCOUT uses copies of all 19 approved mesh parts with original material slots
  and assembly transforms. Assisted inertial pitch/roll/yaw flight has collision
  sweeps, hover assistance, battery depletion and automatic return/landing.
- Seven selected Freeway mesh assets dress three roadside checkpoints. Vendor
  geometry stays at native scale. Three guardrail openings keep relay access clear.
- Niagara fault sparks and status lighting react to the first restored relay.
  Wind/bird ambience and a night rain layer use selected sound cues. Custom electric
  drivetrain/drone audio and surface footsteps remain separate audio work.
- Compact scanner display can be hidden. Night vision and day/night are runtime
  controls; rain ambience is not a full weather simulation.

Keyboard and Xbox mappings are implemented. Physical controller and mobile-device
compatibility require device testing; this is a Windows milestone.

## Reproduce the setup

Unreal 5.8, Visual Studio C++ Build Tools, Windows SDK and .NET Framework 4.8 SDK
are required. `tools/Field-Workflow.ps1` sets temporary and derived-cache paths on
D: for its process, keeping large build work off the nearly full C: drive.

The public repository contains GRIDRUNNER source, its own content, asset references,
the integration generator and validation records. Selected third-party source
assets stay on the licensed user's PC and are ignored by Git.

On a new checkout, acquire the five packs listed in `ASSET-STATUS.md`, stage the
same reviewed versions with original Content paths, then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\Restore-FieldAssets.ps1 -SourceContent 'D:\UNREAL-GRIDRUNNER-ASSETS\Projects\GR_AssetReview\Content'
.\Launch-FieldSlice.cmd build
.\Launch-FieldSlice.cmd integrate
.\Launch-FieldSlice.cmd verify
.\Launch-FieldSlice.cmd
```

The restore tool checks every SHA-256 digest and refuses mismatched sources or
overwriting modified game assets. `field_vendor_manifest.json` records the precise
dependency set. `field_template_manifest.json` records missing character packages
restored from the installed Epic template; use `-EngineRoot` if Unreal is installed
elsewhere. Demo collections are not copied wholesale.

`integrate` saves and reopens the map, checking approved hero assembly fingerprints,
native actor counts, scale, materials, collisions, road clearance and package
references. `verify` drives a running game through movement/possession/mission/save
checks and writes `Saved/Validation/field_runtime_smoke.json` plus screenshots.
Smoke verification uses its own save slot and does not overwrite player progress.

`Launch-FieldSlice.cmd package` invokes Unreal BuildCookRun for Win64 Development
and places a standalone build under `D:\GRIDRUNNER-Builds\GhostSignal-FieldSlice`.
Only completed validation records establish what actually passed on a given PC.

## Validated milestone — 2026-09-14

Both native Editor and Game targets compiled successfully in UE 5.8.2. The saved
map reopened with 390 actors, all 19 SCOUT source parts preserved, and no missing
packages among 417 checked dependencies. All 18 runtime checks passed, including
real Chaos bike propulsion/braking, safe dismount, SCOUT flight/landing, relay
progression, scanner decoding and save persistence. These automated checks cover
system behavior; they do not establish handling polish or full-game completion.

See `validation/field_runtime_smoke.json`, the build logs and
`validation/field_screenshots/`. The game was tested through the installed editor;
the optional cooked Win64 packaging workflow has not been validated.
