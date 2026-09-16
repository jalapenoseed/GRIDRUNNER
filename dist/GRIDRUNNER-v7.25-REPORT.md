# GRIDRUNNER v7.25 — Maintenance Cut / WATCH-01

## What changed

The current build already had reserve automation, local YOLO, improved collision foundations, menu history, interaction guides, formations, sensor packages and the Relay House circuit puzzle. This continuation adds the first bounded Phase 4 route and surveillance encounter; it does not redo those systems.

After onboarding in Ghost Signal, follow the road north beyond Mara. The Maintenance Cut board is on the west verge, ahead of the stranded EV. Amber stakes lead into a covered bay and along the service path. The road remains a faster, exposed alternative. This is an optional detour, not a new campaign gate.

| Stop | What you can do |
| --- | --- |
| Route board | Read why the covered path differs from the road |
| Service bay | Break real line of sight with solid side walls and a roof; read the shift ledger |
| Latch panel | Spend 1 wire and 1 electronics once to open the downstream locker |
| Supply locker | Recover 1 cell, 2 steel, 1 rubber and 2 wire; excess stays when your pack is full |
| Watcher station | Observe the patrol's physical return and recharge location |

Dismount to interact with route objects. The normal interaction button works with keyboard, touch or the existing controller bridge. Notes remain available in the Journal.

## WATCH-01 behavior

- Builds suspicion only within its camera cone and range, with solid geometry and terrain occlusion. Adverse weather shortens detection range.
- Investigates and observes a visible rider. It does not damage the player, summon reinforcements or carry weapons in this slice.
- Retains only the last seen position after losing sight. It searches a bounded pattern around that position, then returns to its actual station.
- Uses existing collision, acceleration, battery, reserve-return and emergency-landing logic. Its observation pace is slower than a player Scout.
- Has an independent 60 Wh onboard battery and an initially 180 Wh station. Charging debits the station exactly; empty stations cannot generate energy. These are game-balance values, not hardware specifications.
- Observes the rider's body during FPV, rather than magically moving its target to the player's camera.
- Saves phase, location, battery, station reserves, suspicion, search progress and last-known position. No offline advancement or refill occurs. Menus pause it; tutorials, other chapters and practice do not run it.

The existing objective area shows suspicion, tracking and last-known search only when relevant. Radio/toast cues announce transitions. Field scans record a last sighting, not a live enemy position. The enemy reuses the approved Scout model when that asset is loaded, with the existing proxy at low quality.

## Verification and limits

Automated coverage includes camera direction, walls, terrain, loss of sight, bounded search, low-battery return, exact finite charging, save validation/migration, remote-interaction rejection, idempotent repair, inventory capacity, persistent depletion, actual menu buttons, route walking, real Rapier roof/wall sweeps, a complete patrol in the real scene, and campaign/practice isolation.

The real-scene tests use a stub renderer. GPU appearance, sound, physical Xbox controller/mobile play and fresh-player readability still require hands-on acceptance. The existing v7.24 timeline workbook remains a historical snapshot, not an updated schedule. There are no promised completion dates.

## Five-minute acceptance route

1. Finish or skip the opening guide, then ride north past Mara to the amber Maintenance Cut board.
2. Dismount, read the board and follow the stakes through the roofed bay. Check lighting and that the signs are readable at your display size.
3. Let WATCH-01 see you on the road. Move under the bay roof: tracking should become a last-known search, without new damage.
4. Repair the latch with the listed materials and collect the locker. Save/reload: neither the material cost nor the salvage should repeat.
5. Open menus, switch to FPV, and visit/leave Flight Yard. Verify that patrol and route progress remain consistent.

Next: tune this encounter from play feedback, then scope Phase 5's unique-airframe ownership migration before adding multiple same-class drones. The original communicator/intro, Eclipse, broader density and deeper physical simulation remain separate roadmap items.
