# GRIDRUNNER v7.23 — Perception & foundations

**[Play GRIDRUNNER](https://gridrunner.goodyartist.chatgpt.site)**

**New in v7.23:** Y / YOLO runs bundled YOLOX-Nano on visible rendered game frames locally, in its own worker. It reports real general-object detections; it does not identify custom electrical equipment or replace R's authored field scanner. Toggle it off to release its runtime. This pass also hardens class/load-sized collision, docking, terrain rollback and rider fallback; adds later-chapter prop coverage; fixes unselected Utility policy scheduling and deliberate re-arm after interruption; and adds menu child/focus/scroll memory plus first-use cards. Settings can replay those hints.

Read the **[full project scope, history, future build paths and options](dist/GRIDRUNNER-PROJECT-SCOPE.md)** and [v7.23 changes and limits](CHANGELOG-v7.23.md). Three.js remains the main build. Native engine ports, full suspension/trailer physics, custom detector training, comprehensive parent/back navigation and heavier AI remain separate future slices. Source is maintained in this Site's `main` branch; older `grok` notes refer to the separate GitHub track.

Verification: `npm test` plus `npm run test:foundations`. The latter runs the committed YOLO model with the committed WASM runtime; it is not a browser/GPU playtest.

**New: campaign unlocks and reserve automation.** Expedition airframes and systems now open through field objectives: meet Mara for Cargo, fabricate the engineer module for Utility, recover the Relay House schematic for removable packs, decode its hidden carrier for conductor harvesting and Relay, then complete one manual **Harvest & Deliver** run to unlock **Maintain trailer reserve**. The Journal shows this route. Flight Yard remains an unrestricted practice sandbox.

Choose a 40%, 60%, 80% or 100% reserve target. Utility physically returns and docks, loads the lowest-charge stored pack, perches on a reachable live conductor, charges, releases, delivers and repeats until the target is reached. It holds with a visible reason for unsafe weather/interference, damage, low battery, missing packs, a moving/distant trailer or depleted/unreachable conductors. The policy never fabricates packs, teleports energy or bypasses the existing finite circuit ledger.

The line feeds have finite saved reserves. Every credited Wh is deducted from its circuit; dead lines provide nothing. The southern feed starts live. Restore the substation relay and grid coupler to energize the northern feed. Move Utility near a different wire section before assignment to choose another valid attachment point. Up to eight removable packs retain unique identity, charge, mass and ownership through saves, interruptions and delivery.

After onboarding, open **Fleet → Relay Outpost** or press **Shift+0**. Relay flies about 240 m ahead, lands and stops its rotors. Scout waits for that connection, surveys about 460 m ahead, scans and returns. The weaker of the two radio hops limits coverage; terrain, structures and weather still matter. Relay remains deployed with finite radio drain until recalled or forced home by reserve/signal/hull limits. Both aircraft need at least 40% battery, 30% hull and no active job. Move or turn the bike if no clear outpost is found. This formation provides ground landing and radio support alongside the new conductor-harvesting job.

Beacons are smaller, brighter points with a steady luminous core; returning aircraft remain amber, active outposts are pale blue. **Begin with tutorial** recovers the guided opening even if an older saved setting disabled it. Skipping the current introduction no longer disables future tutorials. Pause → Replay equipment guide revisits the lessons without resetting the campaign.

After the opening tutorial, open **Fleet → select an aircraft → Assign survey**, then resume play. The drone flies to a fixed waypoint ahead of the bike, holds steady for five seconds, spends 3% charge to scan actual contacts, and physically returns. Other aircraft can run independent jobs while you ride. Jobs persist in saves; they do not run while paused or while the app is closed.

FPV or HOLD pauses a job; Fleet → Resume continues it. Recall, Cancel or another autonomous command ends it. Battery/signal/damage failures override work and never auto-resume. Task status and optional ownership/waypoint details are inside Fleet, not another HUD overlay. Onboard and removable batteries have stable ownership IDs. Multiple same-class aircraft remain planned.

Rapier now resolves rider movement against buildings, terrain grades, rocks, oak trunks, towers, solar hardware, crates and campaign facilities, while sweeping drone hulls through their full movement each tick. Mara and six camp residents retain their Recast routes. All four aircraft can fly Wedge, Trail, Line and Orbit formations or receive squad-wide orders without replacing single-aircraft FPV.

Scout and Relay are the fast/light aircraft; Utility and Cargo trade agility for equipment and payload. Mass now affects loaded acceleration, climb, braking distance, rotation, wind response, battery draw and return reserve. The Flight Yard crate weighs 6 kg and remains attached to Cargo when another drone is selected. Fleet cards show airframe specs; the existing flight HUD shows total mass.

Touch and Xbox default to **Mode 2**: left stick lift/yaw; right stick forward/strafe in Stabilized or pitch/roll in Acro. Centered lift supplies hover thrust, not full RC throttle simulation or altitude hold when tilted. Settings → Flight & controller offers Classic move/look. Keyboard controls are unchanged. Mobile has two independent sticks and a HOLD recovery button while flying.

New expeditions start on foot. Mount → salvage → scout hop → Mara. Then follow the line. Tab opens the field menu; Escape pauses or resumes. Flight Yard is in the menu or G. K toggles scan overlays, N night vision, O light/weather, H camera view. Shift+1–4 selects an aircraft, Shift+5 selects the fleet, 7–0 selects formations, and F8 displays nearby collision volumes for QA.

Planning, supplies and equipment use five menu groups. Riding instruments remain on the bike's dashboard, with compact chase-view and drone telemetry. Later supplied chapter starts are under Chapters.

Run `npm ci` and `npm test`. Serve `dist/` for the playable game, or use `npm run dev`. Existing saves migrate; Flight Yard never replaces campaign saves.

[v7.22 changelog and QA](CHANGELOG-v7.22.md) · [v7.21 harvest delivery](CHANGELOG-v7.21.md) · [v7.20 line harvesting](CHANGELOG-v7.20.md) · [Current/new systems roadmap](ROADMAP-2026-09-15.md) · [v7.15 engine integration notes](INTEGRATIONS-v7.15.md). The pinned engines are committed under `dist/vendor/`; regenerate with `npm run vendor:engines`. No CDN or runtime package install is required. A source commit does not automatically update the hosted playable build.

[Field Edition changelog](CHANGELOG-v7.10.md) · [Quiet Start](QUIET-START-v7.8.md) · [Previous changelog](CHANGELOG-v7.8.md)

Opening story, handbook and surface rendering notes: [CHANGELOG-v7.11.md](CHANGELOG-v7.11.md).
