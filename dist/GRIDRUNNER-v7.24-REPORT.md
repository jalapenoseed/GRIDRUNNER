# GRIDRUNNER v7.24 — Field systems and Relay House

Build report: September 16, 2026. Continues v7.23's YOLO and collision foundation. Phases 1–3 are implemented in the current Three.js expedition. Automated checks cover rules, saves, controls and game integration. Human playtest acceptance remains open.

## Current game state

The three playable chapters, guided opening, bike/trailer energy system, salvage/crafting, four-airframe fleet, physical jobs, removable packs and quest unlocks remain the foundation. This build adds navigation, teaching, fleet expression and the Relay House reasoning puzzle. It does not reset existing expeditions.

YOLO remains the bundled local YOLOX-Nano pixel detector from v7.23. Y toggles it on visible rendered frames. It recognizes general model classes; it is not a trained electrical-equipment detector. R performs authored world measurements. Their evidence and purposes remain separate.

The collision foundation remains active: class/load-sized drone sweeps, roof-aware returns, sampled terrain clearance, rider obstacle filtering and solid infrastructure across the three chapters. Full wheel/suspension dynamics, articulated trailer physics and exhaustive authored-world collision inspection remain future work.

## Phase 1 — Navigation and first interactions

Implemented:

- Menu history records the actual parent page. Escape, controller B and ordinary Back buttons return through that history. At the root, Escape/B resumes. The terminal returns to the world; story and death flows keep their deliberate handling.
- Existing child-tab, focus, scroll, accordion, inventory and selected-aircraft memory is retained. Returning to Fleet restores the selected formation control.
- Field overview orders actions by aircraft control, damage, charge, Relay House progress and trailer proximity. Known workshop recipes become a contextual destination. Ordering occurs when the page is rendered, without a live timer moving focused controls.
- Seven saved interaction records cover scan, sensor switching, repair, pack loading, conductor perching, delivery and reserve-policy arming. Contextual cards explain commands near their menu controls. First scan/sensor actions also explain their meaning through the existing notification surface.
- Status distinguishes seen, skipped and performed actions. Field Manual and Settings offer replay. Resetting hints changes teaching state only. Narration and tutorial visibility remain independent.

Try: open the field menu, enter Fleet, focus a formation, open Settings, then go back. Open the Field Manual's interaction guides to replay teaching. Hints do not block simulation or grant quest progress.

## Phase 2 — Drone behavior and sensors

The existing flight controller remains the authority for movement, collision, energy, tasks and failures. Lifecycle labels now derive from that state: docked, launch, formation/follow, pilot, task, idle, return, landing and failure. This avoids introducing a competing movement controller.

New formation choices are Staggered, High / Low, Protective Ring, Overwatch, Search Grid and Buzz Pass. They join Wedge, Trail, Line, Orbit and the separately tasked Relay Outpost. Search Grid sweeps a repeated set of lanes. Buzz Pass follows an overhead path with at least 8 m lateral offset and 9 m height relative to home, with a 10 m/s autonomous pursuit limit. Formation paths use the normal obstruction and terrain checks. Existing HOLD, manual takeover, recall and failsafes keep priority.

Class-specific idle offsets affect stationary-home FOLLOW targets: Scout explores more, Cargo holds steadily, Utility makes small corrections, and Relay gently changes altitude. Reduced Motion disables these offsets. HOLD, conductor contact, landed outposts and precise task destinations stay fixed.

| Aircraft | Installed sensor modes | Purpose |
|---|---|---|
| Scout | RGB, low-light, acoustic | Optical survey and authored movement/rotor sound contacts |
| Cargo | RGB, range/depth | Visual survey and distance measurements |
| Utility | RGB, thermal, range/depth | Authored warm bodies/equipment and working distances |
| Relay | RGB, EM/RF | Signal and energy emitters |

B cycles only the selected aircraft's installed modes. R uses its range, class coverage and charge cost: RGB 3, low-light/thermal 4, RF 5, acoustic/depth 2. On-foot scans remain the handheld RGB survey. Journal discoveries retain the latest sensor reading, modeled confidence, source and observation time. Thermal, acoustic and RF measurements are explicitly simulated from authored world contacts; confidence is gameplay quality, not a calibrated machine-learning probability. Acoustic/depth use the normal view with measurement results rather than a new visual filter. Optional chemistry, environmental and anomaly instruments remain unbuilt.

Try: inspect the same equipment with Utility thermal and Cargo depth, then compare its latest journal reading. Use Fleet to choose a formation and issue FOLLOW. Patterns affect following aircraft, not aircraft committed to another task.

## Phase 3 — Relay House reasoning puzzle

The house now has a fictional 24 V distribution board in its office terminal. Auxiliary house power still starts the original repair/crafting flow. The communication bus must additionally be commissioned before the hidden carrier and its unlocks can be received.

Four recoverable clues provide the evidence:

1. Generator service plate: voltage, available supply and the mathematical relationship.
2. Operator notebook or filter schematic: measured resistance and transmitter startup behavior.
3. Cellar toolbox slip: branch ratings and a damaged return.
4. Rooftop dish label: the obscured fuse rating, accessible by drone inspection.

The player assigns receiver, transmitter and cooling loads to branches, leaves the damaged branch isolated, and tests the result. Branch limits, duplicate assignments, missing essential equipment and supply overload each produce a specific diagnostic. Startup and continuous load differ. All three steady loads fit, but starting them together trips the supply. The player must reason about which device can wait, start the carrier, then restore cooling.

The final route was checked by enumerating all 256 configurations: exactly one satisfies the complete running-state constraints. One authored puzzle is shipped; random variants are not claimed. Three optional hints progress from observation to calculation to sequencing. None selects the branch assignments for the player.

Clues, selected routes, running state, hints and attempt count survive saves. A failed configuration consumes no quest materials. Commissioning is idempotent, and the existing radio-rack discovery grants its reward once. Older saves with an already decoded carrier migrate to a commissioned board; older unfinished expeditions can gather the new measurements without restarting.

## Verification and practical limits

The automated suite checks the full game module and DOM with real scene geometry and a stub renderer, including the live terminal, full mission chains, inventory, fleet jobs, power accounting, collision and saves. New coverage exercises parent history, saved lessons, sensor distinctions, formation slots and operator HOLD, exhaustive puzzle uniqueness, overload recovery, intermediate-state reload and legacy completion migration. The existing local YOLO model/runtime check is retained.

This run does not establish browser/GPU performance, mobile layout quality, gamepad hardware feel, audio quality or human puzzle comprehension. Before moving into the next content-heavy build, playtest:

- Back through nested menus on keyboard, touch and controller. Check focus/selection and hint replay.
- Fly the new formations around the house, trees and overhead structures. Inspect visual spacing and return behavior.
- Compare sensor readings and YOLO speed on the intended devices.
- Solve Relay House from a fresh expedition without hints, then with staged hints. Confirm the reasoning is discoverable and the route is enjoyable.

## Updated build timeline

The timeline is milestone-based. Future calendar dates are deliberately unassigned; the accompanying workbook has editable target-date cells.

| Order | Milestone | State after v7.24 | Gate / next step |
|---|---|---|---|
| Previous | Foundation, collision and local YOLO | Implemented in v7.23; retained | Continue device performance and traversal playtesting |
| 1 | Navigation and interaction guidance | Implemented in v7.24 | Human input/focus and teaching review |
| 2 | Drone behavior and sensor packages | Implemented in v7.24 | Human formation/sensor playtest |
| 3 | Intelligent Relay House | Implemented in v7.24 | Fresh-player reasoning and pacing review |
| Next | Acceptance and tuning | Ready for playtest | Resolve observed usability, motion or difficulty issues |
| 4 | Meaningful density and hostile surveillance drone | Planned | Small opening-route density slice; patrol, investigate, lose track, search and retreat |
| 5 | Scalable fleet logistics and regional grids | Planned after 4 | Instance IDs, same-class aircraft, ownership, scheduling and shared-perch conflict rules |
| 6 | Original communicator, introduction and Eclipse | Planned after stable systems | Communicator hierarchy, authored intro/cinematic transition and northern expansion |

## Branch options

**Recommended next:** playtest this build, then a bounded phase-4 opening-route slice. Add a meaningful choice or clue along each short traversal segment and one hostile surveillance drone with readable perception and escape behavior.

**Fleet-first alternative:** prioritize phase-5 instance identity and scheduling once phase-2 controls are comfortable. It expands systemic depth but creates more ownership/save complexity before the opening is fully tuned.

**Story-first alternative:** deepen Relay House environmental clues, dialogue and the next electrical mystery before increasing fleet scale. It makes the opening stronger while postponing large simulation complexity.

Keep the primary Three.js build and approved assets as the delivery path. Native-engine ports and custom detector training remain separate options, not implied deliverables of phases 1–3. Full project history and broader options remain in GRIDRUNNER-PROJECT-SCOPE.md; this report supersedes its v7.23 descriptions of pending phases 1–3.
