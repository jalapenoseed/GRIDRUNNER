# v7.18 — Autonomous sorties and owned tasks

## Playable update

After finishing the opening tutorial, open Fleet, select an aircraft, choose **ASSIGN SURVEY**, and resume play. The aircraft travels to a fixed, class-separated waypoint roughly 70 metres ahead of the bike, stabilizes for five seconds, spends 3% of its own charge to scan nearby world contacts, and physically returns to the bike. Select another aircraft to dispatch a second independent sortie while riding or walking.

The destination stays fixed when the bike moves; the return uses the bike's current position. Existing acceleration, mass, wind, collision, obstacle avoidance, signal and reserve rules still apply. This is not unrestricted pathfinding through arbitrary interiors: obstructed/stalled task stages time out after 120 active seconds, fail with a reason and request a return. An obstructed return can still require moving the bike.

## Ownership and lifecycle

- Existing Scout, Cargo, Utility and Relay slots have stable aircraft and onboard-battery IDs. `syncSquad` preserves record/task identity instead of replacing the selected record during HUD synchronization.
- Each accepted job receives a per-aircraft monotonic ID and stores references to its owning aircraft/battery, region, fixed destination, stage, elapsed time, dwell progress, scan result and explanatory status.
- Stages: TRANSIT → SURVEY → RETURN → DONE. States: RUNNING, PAUSED, COMPLETED, CANCELLED, FAILED.
- FPV or HOLD pauses work. Resume continues the same job and returns control to the rider without teleporting the aircraft. Recall/DOCK, Cancel and alternative autonomous commands cancel it. Rejected commands leave it unchanged.
- Low battery, lost signal, hull damage and emergency landing take priority over both running and manually paused work. They mark the task failed without overriding the existing safety flight. No silent auto-resume.
- Survey scan and its 3% debit occur at most once. Results merge into persistent discoveries for the correct aircraft. The job does not award quest items, clear puzzles or add energy.
- Fleet cards show state/stage. The selected Fleet task panel contains assign/pause/resume/cancel and optional details. No new permanent HUD layer.

## Saves and boundaries

- Forward migration of legacy records adds stable identities and empty task state while preserving existing charge, hull and position. The outer save version remains compatible; task records carry their own version.
- Validation rejects mismatched owners, invalid sequences/progress/waypoints, malformed battery records and unsupported manifests. Restored safety returns keep returning; manual work stays paused. An aircraft without a selected FPV pilot restores to HOLD instead of accepting rider movement as drone input.
- Chapter changes cancel old-region work before moving the existing aircraft. Flight Yard creates an isolated manifest and cannot assign expedition jobs; returning restores the held expedition's job IDs, position, progress and energy exactly.
- Paused menus pause simulation. Closing the app does not run jobs or grant offline scans/energy.
- One aircraft of each existing class remains the supported fleet. Battery IDs reference the current onboard percentage values, **not** removable-pack inventory. This release does not create multiple same-class harvesters, campaign cargo packs or new battery transfers.

## Verification

- Full `npm test`, including existing campaign, save, audio, UI, mass/controls, Rapier, Recast and formation suites.
- New `verify-fleet-tasks.mjs`: all four physical sorties, obstacle avoidance, save boundaries, scan/debit once, manual/HOLD interruption, explicit resume, rejected commands, recall, safety overrides, route timeout, fixed target, ownership validation, legacy saves and escaped task messages.
- New full-module `verify-fleet-task-integration.mjs`: actual Fleet buttons; paused menus; concurrent selected/background tasks; FPV-origin persistence; real contact discovery without quest rewards; physical recall; failed background-task saves; chapter transition; Flight Yard isolation; tutorial gating.
- Browser module graph bundling and syntax/diff checks. No live GPU/mobile visual pass is claimed; the browser connection to the local app was blocked in the previous update and was not bypassed here.

## On-device playtest

1. Finish/skip the tutorial, open Fleet and assign Scout a survey; close the menu. Observe transit, five-second survey, scan and physical docking.
2. Assign Relay while Scout works. Watch separate jobs and batteries; move the bike and verify destinations stay fixed while the return follows you.
3. Take over Scout via FPV, save/reload, then resume in Fleet. Check the rider returns to the original location, the waypoint stays unchanged and there is only one survey scan.
4. Recall or Cancel before the scan. Confirm the task is cancelled but the aircraft flies home normally. Use HOLD/Resume during transit and return.
5. Start a job, enter Flight Yard, then leave. Expedition work should resume from exactly the held state; practice must not advance it or duplicate charge/cargo.

Next: live conductor anchors and safe physical perch/release, then charging and trailer pack logistics on this task/ownership foundation. CODEC/intro and Eclipse remain documented future slices.
