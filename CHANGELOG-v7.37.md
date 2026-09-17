# v7.37 — All the lights we carried

17 September 2026

New expeditions now earn their fleet through the story. Existing saves and the six-aircraft Swarm Start retain their aircraft; standalone Commander, Flight Yard and the hidden F9 fleet test remain available.

## Play the update

Start **New expedition** for the one-Scout progression. During an expedition, press **U** or use **Expedition → Field link**. The eight milestone transmissions introduce the current chapter and next field action.

- **Equipment → Field bench:** six short sourced exercises and four spare airframes rebuilt with recovered parts. Cargo is earned at Mara, Relay at the Relay House, and Utility through its existing workshop recipe.
- **Field link → Charger:** “Find me a power source” dispatches Utility through the real conductor flight/harvest task. Load a removable pack for delivery, or leave Charger clamped without a pack and return to collect it.
- **Fleet → Fleet network:** place a docked aircraft at one of six stations, inspect its saved charge/hull/location, collect it, and travel between cleared sectors. Travel costs 8% bike charge and requires all travelling aircraft docked. Distant stationed aircraft stay in place.
- **Expedition → Sensor discoveries:** follow UV, thermal and RF clues to three finite caches. The RF contract requires three observations at least 12 m apart; it is an observation-count exercise, not a physical triangulation solver.
- **Fleet network → Flight recorder:** inspect up to 120 recorded fleet samples with a map slider. Samples include actual position, battery, hull and mode. Playback never alters the live game.
- **Black Start complete → Fly my fleet finale:** launch an initial show with your actual available aircraft, then use the existing drawing/script/formula editor. Parked, busy, damaged and undercharged aircraft are excluded. No admin copies are created for the finale.

## Persistence and compatibility

Story state, exercise results, frame ownership, finite station reserves, placements, sensor evidence, remaining cache contents, flight records and finale participants are stored with the existing expedition record. Missing story fields migrate to legacy behavior. New story fields reject invalid values and inconsistent station positions.

Charging advances only in the active sector while unpaused. A station spends its reserve; a conductor spends the existing line ledger. Aircraft placed at a station cannot receive bike charging remotely. Pad allocation finds a free slot after retrieval, and a selected stationed aircraft does not block launches of the travelling fleet. Story chapter transitions retain aircraft hull condition.

The program bench now supports all eight campaign aircraft, including Cargo and Utility. Program application still checks ownership, availability, hull, charge and live tasks. Existing Commander test aircraft remain separate from campaign snapshots.

## Verification and limits

- Full `npm test` regression chain, including the new story integration branch.
- `npm run test:story` exercises the actual menu handlers, rebuild costs, incorrect/correct readings, station charging and migration, sector changes, physical Charger flight/perch, saved placements, finale eligibility, actual sensor scans, finite cache transfers and non-mutating replay.
- Browser-targeted module bundling, static entrypoint and local asset references, and `git diff --check` are release checks.
- Tests use the existing real scene/controller with a renderer stub. They verify simulation and DOM behavior, not GPU rendering. The browser preview was unavailable during final checking, so the new desktop/mobile layouts have not received visual acceptance. Physical touch/controller and listening checks also remain open.

The current playable world is still three sectors. [CAMPAIGN-ARC.md](dist/CAMPAIGN-ARC.md) records the seven-region direction, opening beats, learning tracks, recursive visits, distributed fleet and later convergence. New regions, animated video calls, physical handheld presentation, full chip-level repair, advanced lessons, image import and uploaded-music analysis remain future work. Current Commander beat tools are manual BPM/tap tempo, not audio analysis.

Source remains the existing Sites repository. The separate older checkout, GitHub track and native-engine/art sources were not changed by this release.
