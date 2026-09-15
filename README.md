# GRIDRUNNER v7.18 — Autonomous sorties (`grok`)

**[Play GRIDRUNNER](https://gridrunner.goodyartist.chatgpt.site)**

After the opening tutorial, open **Fleet → select an aircraft → Assign survey**, then resume play. The drone flies to a fixed waypoint ahead of the bike, holds steady for five seconds, spends 3% charge to scan actual contacts, and physically returns. Other aircraft can run independent jobs while you ride. Jobs persist in saves; they do not run while paused or while the app is closed.

FPV or HOLD pauses a job; Fleet → Resume continues it. Recall, Cancel or another autonomous command ends it. Battery/signal/damage failures override work and never auto-resume. Task status and optional ownership/waypoint details are inside Fleet, not another HUD overlay. Onboard batteries now have stable ownership IDs; removable packs and multiple same-class aircraft are not implemented yet.

Rapier now resolves rider movement against buildings, terrain grades, rocks, oak trunks, towers, solar hardware, crates and campaign facilities, while sweeping drone hulls through their full movement each tick. Mara and six camp residents retain their Recast routes. All four aircraft can fly Wedge, Trail, Line and Orbit formations or receive squad-wide orders without replacing single-aircraft FPV.

Scout and Relay are the fast/light aircraft; Utility and Cargo trade agility for equipment and payload. Mass now affects loaded acceleration, climb, braking distance, rotation, wind response, battery draw and return reserve. The Flight Yard crate weighs 6 kg and remains attached to Cargo when another drone is selected. Fleet cards show airframe specs; the existing flight HUD shows total mass.

Touch and Xbox default to **Mode 2**: left stick lift/yaw; right stick forward/strafe in Stabilized or pitch/roll in Acro. Centered lift supplies hover thrust, not full RC throttle simulation or altitude hold when tilted. Settings → Flight & controller offers Classic move/look. Keyboard controls are unchanged. Mobile has two independent sticks and a HOLD recovery button while flying.

New expeditions start on foot. Mount → salvage → scout hop → Mara. Then follow the line. Tab opens the field menu; Escape pauses or resumes. Flight Yard is in the menu or G. K toggles scan overlays, N night vision, O light/weather, H camera view. Shift+1–4 selects an aircraft, Shift+5 selects the fleet, 7–0 selects formations, and F8 displays nearby collision volumes for QA.

Planning, supplies and equipment use five menu groups. Riding instruments remain on the bike's dashboard, with compact chase-view and drone telemetry. Later supplied chapter starts are under Chapters.

Run `npm ci` and `npm test`. Serve `dist/` for the playable game, or use `npm run dev`. Existing saves migrate; Flight Yard never replaces campaign saves.

[v7.18 changelog and QA](CHANGELOG-v7.18.md) · [v7.17 flight update](CHANGELOG-v7.17.md) · [Current/new systems roadmap](ROADMAP-2026-09-15.md) · [v7.16 changelog](CHANGELOG-v7.16.md) · [v7.15 engine integration notes](INTEGRATIONS-v7.15.md). The pinned engines are committed under `dist/vendor/`; regenerate with `npm run vendor:engines`. No CDN or runtime package install is required. A source commit does not automatically update the hosted playable build.

[Field Edition changelog](CHANGELOG-v7.10.md) · [Quiet Start](QUIET-START-v7.8.md) · [Previous changelog](CHANGELOG-v7.8.md)

Opening story, handbook and surface rendering notes: [CHANGELOG-v7.11.md](CHANGELOG-v7.11.md).
