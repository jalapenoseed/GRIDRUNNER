# v7.26 current update

Fleet now has quick airframe selection, staged Launch All and bounded local swarm steering. Scout/Utility UV reveals authored fluorescent maintenance clues; Utility thermal and Relay RF remain available. Sensor / YOLO Lab practices all three and compares actual pixel predictions with separate approximate person/bicycle reference boxes. See [v7.26 play guide and limits](GRIDRUNNER-v7.26-REPORT.md). Multi-instance fleets, trained swarm controllers and thermal/RF campaign contracts remain future work.

# GRIDRUNNER — Project Scope, Build History & Future Paths

> **v7.24 update, September 16, 2026:** Phases 1–3 below are now implemented and automatically checked. Human playtest acceptance remains open. Read [the current build report](GRIDRUNNER-v7.24-REPORT.md) and [milestone timeline](reports/GRIDRUNNER-v7.24-timeline.xlsx) for current state. The v7.23 inventory and history below are retained as the baseline; their descriptions of these phases as future work are superseded.

Revision: 16 September 2026 · foundation update v7.23

Playable project: https://gridrunner.goodyartist.chatgpt.site

This is the consolidated working project brief. It separates implemented systems, the current update, unfinished foundations, and proposed expansion paths. It is not a claim that every planned feature is already playable.

## 1. Project identity

GRIDRUNNER is an exploration and electrical-survival game built around a rider, a bike, a trailer, and a fleet of specialized drones. The player observes a damaged world, interprets clues, restores useful infrastructure, and turns scarce stored energy into mobility and capability.

The desired rhythm is:

**Explore → observe → understand → repair or solve → earn equipment/access → apply that capability somewhere new.**

The fleet acts as a mechanical companion party: different bodies, sensors, energy budgets, movement styles, and jobs. It should eventually feel like a group of capable machines inhabiting the world, not four interchangeable camera modes.

The immediate product target remains a convincing 5–15 minute opening vertical slice: start camp, exploration, bike, salvage, first drone flight, and an intelligent electrical discovery. Preserve the three existing campaign legs while improving this opening.

### Main development track

- The active playable implementation is JavaScript/Three.js.
- Continue evolving the working browser game. Do not restart it to accommodate a new system.
- Godot and Unreal are subordinate port/research options, not simultaneous replacements for the browser build.
- Approved Blender/source assets and supplied visual references remain source material. A concept image is not evidence that its pictured functionality exists in the game.
- This update is maintained in the existing Sites source repository on `main`. Older project notes refer to the separate GitHub `grok` branch. Publishing this Site does not demonstrate that `jalapenoseed/GRIDRUNNER:grok` was updated.

## 2. Scope boundaries

### Core scope

| Pillar | Intended experience | Current foundation |
|---|---|---|
| Traversal | Readable, forgiving riding through a solid world | Foot/bike movement, cargo/energy effects, terrain grades, static collision |
| Electrical survival | Power is something to find, understand, store and route | Bike/trailer reserves, generators, repairs, finite feeds and packs |
| Drones | A useful autonomous fleet with distinct roles | Four classes, mass-sensitive flight, formations, survey/outpost/harvest tasks |
| Perception | Different instruments expose different kinds of evidence | Field scan, visible/night/thermal/RF presentation, new pixel-based YOLO lane |
| Progression | Solves and quests unlock capabilities, then new places | Initial airframe/system gates and journal route |
| Puzzles | Observation and reasoning, not arbitrary switch hunting | Relay House clue/repair/terminal chain; mathematical redesign remains planned |
| World density | Frequent meaningful choices and environmental stories | Salvage, deposits, settlements, residents, infrastructure and vegetation |
| Interface | Context-sensitive choices with reliable back/select behavior | Five menu groups, item inspection, new focus/scroll/child memory |
| Teaching | Explain an action at the moment it becomes relevant | Guided opening, replayable equipment lessons, new first-use menu cards |
| Narrative | Original radio characters and environmental mystery | Story pages, narration, NPC dialogue and campaign objectives |

### Not assumed in the current scope

Multiplayer, an MMO economy, cloud-account saves, procedurally infinite worlds, unrestricted object destruction, photorealistic rendering, external desktop capture, webcam surveillance, a finished combat game, and parallel full engine ports are not implied by the current request. They would need separate scope decisions.

## 3. Past build path

The table is grounded in the checkout's changelogs and implementation notes. Missing version notes are not filled in with invented milestones.

| Build | Main contribution |
|---|---|
| Original Legs 1–3 | Expedition riding, energy, generators, inventory, scripted missions, security/enemies, saves and final choices |
| v7 | Independent inertial drone simulation, commands, physical return, signal/reserve safeguards, persistent scanned discoveries and adaptive audio |
| v7.2 | Fieldwork inventory, salvage/crafting, finite deposits, timed mining, separate pack/bike/trailer storage, finite trade |
| v7.3 | Nine settlements, open-front enterable buildings, residents, advice and persistent barter |
| v7.4 | Activity-sensitive viewpoints and remembered camera preferences |
| v7.5 | Relay House rooms, Len, fuse/generator/bench/filter/dish/CRT clue chain; controller and equipment improvements |
| v7.6 | Four imported drone classes, isolated Flight Yard, moving sun/weather, night vision and clearable scan overlays |
| v7.7 | Role-specific campaign field jobs |
| v7.8 / 7.8.1 | On-foot quiet opening; mount → salvage → scout → Mara; onboarding and practice-isolation repairs |
| v7.9 | Five-category field menu, contextual instruments, fewer overlapping overlays and world-placement fixes |
| v7.10 | Backpack search/filter/sort, selected-item inspection, separate Workshop/Cargo surfaces and roadside foliage |
| v7.11 | Opening story, story archive, field manual, spoiler gating and surface improvements |
| v7.14 | Asset/narration preflight, idle asset work, paused shader preparation and static spatial indexing |
| v7.15 | Rapier kinematic collision and drone sweeps; Recast camp routes and walking residents |
| v7.16 | Broader world collision, grade limits, collision-debug view, fleet commands and formations |
| v7.17 | Aircraft/mass/load-sensitive flight, fast light frames, Mode 2 dual sticks and loaded Cargo behavior |
| v7.18 | Stable aircraft/battery ownership, independent persistent survey tasks, interruption and failure states |
| v7.19 | Physical landed Relay outposts, stopped motors, finite radio drain, two-hop links and a dependent Scout sortie |
| v7.20 | Physical Utility conductor attachment, coupling, finite charging, release and return on 24 supported Ghost Signal wires |
| v7.21 | Up to eight unique removable packs, physical charging/delivery/unloading and visible/thermal fleet beacons |
| v7.22 | Initial quest-gated equipment/system progression and player-armed trailer-reserve automation |
| v7.23 — this pass | Genuine local YOLO inference, collision hardening/coverage, reserve-policy repair, menu memory and first-use foundations |

No standalone v7.1, v7.12 or v7.13 root changelog was used for this history. Some asset/style filenames carry older version strings; they do not define the current game version.

## 4. Present playable scope

### Campaign and progression

The three existing legs are Ghost Signal, The Spillway, and Black Start. Existing authored mission chains, supplied chapter starts, saves, and the final outcomes are retained.

The initial unlock route is:

| Trigger | Capability |
|---|---|
| Opening salvage/tutorial | Scout acquisition and first flight |
| Meet Mara | Cargo availability |
| Fabricate engineer module | Utility availability |
| Recover Relay House schematic | Removable pack fabrication |
| Decode Relay House hidden carrier | Conductor harvesting and Relay availability |
| Complete one manual Harvest & Deliver | Reserve-maintenance policy |

This is a first progression layer, not a complete dependency graph for every future level, item or sensor. Flight Yard remains unrestricted practice. Supplied chapter starts are deliberate demo shortcuts; they should be separated from normal progression in a later menu pass.

### Fleet and energy

- One Scout, one Cargo, one Utility and one Relay exist. Multiple instances of the same class are not implemented.
- Aircraft have independent state, stable identity, onboard charge, hull condition, signal and task ownership.
- Manual flight and autopilot share class/load-sensitive flight behavior.
- Wedge, Trail, Line and Orbit are available formation foundations. A Relay Outpost deploys a landed radio node and a dependent Scout survey.
- Survey jobs have persistent stages and explicit interruption/failure handling.
- Utility approaches, aligns with, grips, couples to and charges from supported live conductors. Recall physically releases it before return.
- Two finite Ghost Signal circuit ledgers supply the first conductor system. Later-region conductor networks remain future work.
- Removable packs have unique ownership, charge, capacity and mass. Utility and Cargo have bounded loading rules.
- A delivery reaches the actual stopped trailer, dwells, unloads and credits only available reserve space. Excess energy stays in the pack.
- Reserve automation uses explicit 40/60/80/100% targets. It does not fabricate packs, create free energy or run while paused/offline.

### World, presentation and controls

Existing content includes deterministic salvage/deposits, crafting, bike/trailer storage, settlements, residents, static infrastructure, world vegetation, weather, night/blackout states, recorded narration, camera contexts and keyboard/touch/controller input.

Recast currently supports camp resident routes. It is not worldwide tactical navigation or enemy-drone intelligence. Thermal and RF are game sensor presentations; they are not physical thermal-camera or RF-hardware simulators.

## 5. What v7.23 adds and fixes

### A. Real YOLO perception lane

The new control is **Y / YOLO**. It works from the currently rendered game canvas in visible-sensor mode, including ground and drone views.

- Bundled official YOLOX-Nano ONNX model, 416×416 input, 80 COCO object classes.
- Bundled ONNX Runtime Web 1.22.0 CPU/WASM files, matched to the same release.
- Lazy initialization: the model is not loaded until enabled. Detection starts off each page load.
- Separate Worker, one inference at a time, adaptive spacing between samples, and explicit loading/error reporting.
- Local game-frame processing only. No webcam, desktop capture permission, frame upload or inference service.
- Boxes show model labels and confidence. Results expire and are suppressed when the camera moves enough to make them stale.
- Turning it off terminates the worker. Paused/hidden/non-visible views do not enqueue new frames; an already-running frame may finish and is not displayed in those views.
- The ordinary R field scanner and its authored discoveries remain separate. No scene tags are relabeled as neural detections.

Important limits: COCO includes people, bicycles, motorcycles, cars and common household objects. It does **not** contain GRIDRUNNER-specific classes such as energized conductor, transformer fault, battery chemistry, quest switch or enemy-drone subtype. Stylized game art is a different visual domain from the model's training images; false positives, missed objects and zero detections are expected. YOLO currently supplies observation only, not quest rewards, combat targeting or collision authority.

Validation includes actual execution of the committed model through the committed CPU/WASM runtime, correct tensor shape/finite output, an honest empty result on a uniform frame, and an upstream photo that produced dog/car/bicycle detections. This is not a fresh browser/GPU/device-performance certification.

### B. Collision foundation pass

- Conservative class-sized drone shells follow the rendered frame spans; carried payload adds vertical clearance.
- Covered-return planning uses the same class/load shell rather than a conflicting generic margin.
- Final docking checks clearance instead of snapping through a nearby wall.
- Terrain is sampled along drone motion; a rejected high-ground destination no longer lifts the aircraft at its old location.
- Rider fallback movement is swept/substepped instead of endpoint-only, so a missing physics engine does not permit thin-wall tunneling.
- Bike and walking query bodies differ. Shallow terrain changes have a bounded step allowance before grade rejection.
- Explicit rideable/soft surface masks distinguish passable surfaces from meaningful obstacles. Small grass and soft clutter remain non-blocking.
- Later chapter box geometry now registers solid infrastructure during authoring: cabinets, barriers, poles, caches and other substantial props. Capacitors/dish and layered canyon-rock proxies are included.
- Transmission/radio beams use segmented volumes following their visible slope, and car cabins have upper collision coverage.
- Invalid/non-finite solid bounds are rejected before spatial indexing.

This closes specific current-foundation gaps, not every possible collision feature. It is still kinematic traversal with simplified static shapes. Full bike suspension, trailer articulation/contact, dynamic rigid-body props, exact imported-mesh collision and device field QA remain unfinished. Decorative turbine blades and complex animated geometry need their own deliberate collision policy. Do not equate “more registered colliders” with a finished vehicle simulation.

### C. Automation and unlock safety

- A docked, unselected Utility continues to evaluate an armed reserve policy.
- Operator fleet/Utility commands and manual job control suspend repeat automation.
- Failed/cancelled jobs disarm repeat dispatch until the player explicitly re-arms it.
- The policy unlock notification is not emitted for every successful cycle.
- Direct aircraft-selection and Relay Outpost paths respect availability gates.
- Existing finite-energy accounting, ownership, save migration and Flight Yard isolation remain intact.

### D. Menu/tutorial foundations

- Remember the last child page within each menu category.
- Restore stable focused controls, content scroll and accordion state where the page still contains them.
- Device-local first-use cards for Fleet, Backpack, Workshop and Bike/Trailer.
- Dismissal persists locally; Tutorial OFF suppresses those cards.
- Settings offers replay of first-use hints.

The v7.24 continuation implements Escape/controller-B parent traversal, contextual field-menu ranking and seven saved interaction guides. The original communicator remains phase 6. See the current build report for implementation and playtest limits.

## 6. Recommended next build sequence

Order by dependency and player value, not by a promised date. Each slice should produce a usable result and preserve old saves.

### Phase 1 — Menu navigation and first-interaction teaching

**Goal:** make the growing game understandable before adding more commands.

1. Create an explicit menu tree with parent, current page, selected entity and return destination.
2. Escape/B goes back one level; root returns to play. Handle story, terminal, confirmation and death screens deliberately.
3. Remove redundant EXIT buttons from ordinary pages. Keep a clear resume affordance and accessible back control where needed.
4. Retain the selected drone, inventory category, item, task, accordion and scroll position across child views.
5. Rank optional actions by context without moving a control while it is focused: nearby trailer, selected aircraft, damage, active quest, relevant crafting prerequisites.
6. Add a reusable first-interaction lesson registry: trigger, prerequisites, anchor object, explanation, completion event, replay and persisted status.
7. Teach the first scan, first sensor switch, first repair, first pack load, first perch, first delivery and first policy arm.
8. Ensure skip/mute/replay works independently from campaign progress; do not permanently disable all future teaching when skipping one lesson.

**Done when:** keyboard, mouse, touch and controller can traverse a nested action and return to the same meaningful selection; first-use lessons survive interruption/reload and never repeatedly block an experienced player.

### Phase 2 — Drone behavior and sensor specialization

**Goal:** make the fleet feel like autonomous companions.

- Consolidate explicit states: docked, launching, follow, formation, task, idle, return, landing/docking and failure recovery.
- Add class-specific idle movement without changing authoritative task positions or energy ownership.
- Expand formation patterns: staggered trail, high/low escort, protective ring, overwatch, search grid and controlled buzz pass.
- Give each pattern clearance, speed, player-distance and interruption rules. “Buzzing” should never ram or obscure the player.
- Introduce data-driven sensor packages: RGB/vision, low-light, thermal, EM/RF, acoustic, range/depth and optional environmental/anomaly instruments.
- Separate sensor capability, visual presentation, evidence quality and quest interpretation. A bright thermal material is not proof of chemical identity.
- Add power cost, range, confidence and class coverage per installed sensor.

**Done when:** the same target produces appropriately different evidence through different aircraft, each aircraft remains distinct in movement, and autonomous formation/task transitions do not teleport or override an operator unexpectedly.

### Phase 3 — Intelligent Relay House vertical slice

**Goal:** make the opening teach observation → measurement → reasoning → electrical manipulation.

Proposed puzzle structure, not committed final values:

- Partially labeled circuits, a maintenance note, meter readings and a damaged branch.
- Several plausible configurations; identify the required communication loads while obeying the available supply and branch constraints.
- Use enough independent clues to infer one intended safe solution. Do not make brute-force trial the best strategy.
- Drone inspection reveals a hidden label or physical relationship, not the completed answer.
- Introduce one meaningful complication: abnormal branch draw, an incorrect label, a phase/routing mismatch or a load that changes after restoration.
- Layer optional hints: where to observe, which relationship matters, then a worked reasoning step. Keep the final solve in the player's hands.
- Script varied states only after an automated solver proves each authored variant solvable and sufficiently constrained.
- Tie rewards to actual new capabilities and show the prerequisite chain in the Journal.

**Done when:** a new player can explain why the solution works; clues remain recoverable after reload; hints do not destroy the puzzle; one validated solve unlocks the intended equipment exactly once.

All electrical quantities and interactions are fictionalized gameplay. This is not instruction for approaching or connecting real power infrastructure.

### Phase 4 — Meaningful density and enemy-drone prototype

**v7.25 status:** First bounded route and one non-weaponized surveillance prototype implemented. Maintenance Cut adds real cover, repair/salvage decisions and a recoverable shift note; WATCH-01 loses line of sight, searches its last observation, and returns to a finite charger using existing aircraft collision and energy logic. Automated integration covers this slice. Human readability, GPU/device/audio acceptance and broader route expansion remain open. See `GRIDRUNNER-v7.25-REPORT.md`.

**Goal:** add decisions and believable behavior, not simply more meshes.

Create a small density pass around the opening route: readable landmarks, alternate access, solid cover, salvage decisions, repairable infrastructure, small mysteries and environmental stories. Protect the main road and NPC/quest approaches from random obstruction.

Then add one hostile surveillance-drone prototype: patrol → detect → investigate → pursue/observe → lose track → search → retreat/recharge. Start with perception, threat indication and evasive play. Full weapons/combat balance is a later decision.

**Done when:** a 30-second traversal segment contains meaningful information or a choice; solid obstacles support both navigation and line of sight; the hostile can genuinely lose the player and respects energy/terrain rather than cheating.

### Phase 5 — Scalable fleet logistics and regional power networks

**Goal:** support multiple same-class aircraft without corrupting saves or duplicating energy.

- Migrate class-keyed squad state to an instance registry with unique airframe IDs.
- Keep battery/pack/attachment ownership explicit and single-owner.
- Add build/acquisition/storage rules and instance selection before introducing arbitrary fleet size.
- Add queues, role assignment, shared perch occupancy and conflict resolution.
- Expand scouting → outpost → harvesting → transport coordination.
- Extend authored circuits to later regions, with finite or explicitly modeled replenishment.
- Report fleet generation, consumption, stored energy, bottlenecks and meaningful ETA.
- Offer stockpile-at-source versus transport-to-trailer policies only after accounting is reliable.

**Done when:** two harvesters can share a region, be interrupted, recalled, saved and reloaded without duplicate payload, lost charge, shared positions or conflicting perch ownership.

### Phase 6 — Original communicator, authored introduction and Eclipse

**Goal:** unify story, teaching and world state once the opening gameplay is stable.

- Build an original portrait/radio communicator inspired by the interaction grammar of classic codec calls, not copied characters, dialogue, art or exact UI.
- Combine voice, subtitles, portrait state, short cinematic/video material and playable transitions into one authored introduction.
- Keep mute, skip, replay, reduced motion and save-safe interruption first-class.
- Replace redundant overlays; do not add another permanent screen layer.
- Implement Eclipse as a saved event with entry, totality and exit. One solar-availability value must drive sky presentation and every solar generator.
- Author NPC/radio/world responses. Night, blackout and ordinary weather are not substitutes for an eclipse.

**Done when:** the opening hands control back coherently, teaches the actual current game, and an eclipse changes energy decisions as well as the sky.

## 7. Branching build options

These are design/development paths, not a claim that new Git branches have already been created.

| Path | What it prioritizes | Benefit | Cost/risk | Suggested role |
|---|---|---|---|---|
| A. Browser-first vertical slice | Menus, tutorials, Relay House and reliable traversal | Fastest route to a coherent playable opening | Must keep graphics/AI within browser budgets | Main path |
| B. Fleet systems sandbox | Multi-instance drones, jobs, sensors and regional energy | Distinctive systemic identity | Save/ownership/scheduling complexity; can overwhelm new players | Parallel research after Phase 1 |
| C. World and atmosphere | Authored density, original communicator, audio, cinematic intro | Stronger place, story and emotional identity | Art/content workload; risks decorating unfinished interactions | Build alongside a stable slice |
| D. Perception research | Game-specific training data, models, sensor experiments | Real recognition of authored equipment | Dataset quality, false positives, inference cost and model maintenance | Isolated experiment feeding A/B |
| E. Engine port | Godot first or Unreal as a separate feasibility study | Different native physics/rendering/tooling options | Reimplementation and parity burden; slows main game if simultaneous | Deferred, gated decision |

Recommended combination: **A is the release spine; B/C/D contribute bounded experiments. E stays subordinate until a measurable browser limitation or distribution requirement justifies it.**

### YOLO options

1. **Keep the general model as optional observation.** Lowest additional content cost; honest limited classes; current implementation.
2. **Train a GRIDRUNNER-specific detector.** Capture labeled scenes from varied lighting, weather, range and occlusion; include negatives and hard confusions; split training/test scenes to avoid memorizing a single level. Evaluate before exposing confidence as reliable gameplay evidence.
3. **Hybrid perception.** Keep authored game truth for interaction/collision/quest rules while neural inference provides uncertain visual evidence. Label the origin of each result clearly. Recommended for game reliability.
4. **External screen/camera input.** Separate feature with explicit capture permission, privacy UX, source selection and shutdown controls. Not implemented or silently enabled by “YOLO.”

### Collision options

1. Continue conservative static shapes for most scenery: inexpensive and predictable.
2. Author simplified compound colliders for important buildings, machinery and imported assets.
3. Use triangle-level collision only where the geometry materially affects gameplay; profile it.
4. Add actual bike suspension/trailer constraints as a bounded vehicle project, not as a side effect of adding boxes.

### Progression options

- Linear opening followed by branching regions: clearest onboarding and easiest validation.
- Capability-gated exploration with several valid solve orders: stronger replayability, higher dependency/testing burden.
- Fully open systems sandbox: useful as practice/debug mode, but weakens the campaign's earned-unlock identity if it becomes the default.

Recommended: linear teaching spine → capability-gated branches; retain Flight Yard and clearly marked demo chapter shortcuts.

## 8. Architecture direction

Current authored runtime lives in `dist/` as static ES modules. The large game coordinator is still a maintenance bottleneck; extract systems gradually around tested boundaries rather than rewriting everything at once.

Suggested boundaries:

| Area | Owns | Must not silently own |
|---|---|---|
| Campaign/progression | Quest facts, unlock prerequisites, journal evidence | Neural confidence as quest truth |
| World/collision | Registered obstacles, rideability and spatial queries | Menu state or energy credits |
| Fleet/flight | Instances, motion, commands, task execution | Duplicate pack ownership |
| Energy/logistics | Circuit balances, packs, trailer transfers | Visual proximity-based free charge |
| Perception | Sensor observations and their provenance | Authoritative collision or automatic rewards |
| UI/navigation | Parent/child pages, selection, focus and input | Changing gameplay resources during render |
| Tutorial/narrative | Triggered lessons, interruption and replay | Resetting campaign progress to replay a hint |
| Presentation | Materials, audio, camera and atmosphere | A separate hidden model of solar generation |

Maintain one owner for every resource and one explicit transition for every transfer. Store durable gameplay facts in versioned campaign saves; store local presentation preferences separately. Do not serialize the YOLO Worker/session or pretend jobs progressed while the game was closed.

## 9. Validation and release gates

Every gameplay slice should protect:

- Existing campaign saves and old-save migration.
- All three mission chains and the Flight Yard/campaign boundary.
- Manual takeover, hold, recall, cancel, damage, depleted power, weak link and save/load interruption.
- Energy conservation and exactly-one ownership of carried objects.
- Clear on-screen explanations for unavailable actions and failed tasks.
- Keyboard/touch/controller parity, remapped controls, reduced motion and tutorial preferences.
- Main-road rideability, doorway clearance, wall/roof collision and fast-motion sweeps.
- Optional-feature failure isolation: an unavailable detector must not prevent the game from starting.

Current automated tests use real Three.js scene objects and real WASM engines, with a stubbed WebGL renderer for much of the game integration suite. The new model test runs actual neural inference. Neither substitutes for visual playtesting, physical controller testing, audio review or target-device performance measurement.

Before calling the vertical slice production-ready, perform a real browser/device pass over: cold start, new player tutorial, bike edges and slopes, wall/roof/door interactions, fast loaded Cargo, Utility delivery/re-arm, mobile controls, nested menu focus and detector on/off/error behavior.

Measure frame time with detection both off and on, model cold-load cost, inference latency, memory use and battery/thermal impact. Set performance targets from actual target devices; no universal frame-rate guarantee is made here.

## 10. Risks, unfinished items and decisions

| Risk or open item | Why it matters | Next action |
|---|---|---|
| General YOLO domain mismatch | Confident but incorrect labels can mislead | Keep experimental/local; collect representative validation scenes |
| Simplified collision proxies | Phantom obstruction or missed fine geometry | Field QA and deliberate compound colliders for gameplay-critical assets |
| Kinematic bike/trailer | Does not provide suspension/contact realism | Separate vehicle-physics acceptance plan |
| Large coordinator module | Cross-system regressions become easier | Incremental extraction with integration tests |
| Class-keyed fleet | Prevents safe same-class expansion | Instance registry/migration before multiple harvesters |
| Growing menu density | New systems become hard to discover/control | Phase 1 parent/back/context/teaching pass |
| Prototype progression shortcuts | Can bypass the intended story loop | Clearly separate demo/practice from campaign |
| Puzzle complexity | Difficulty can become ambiguity | Prove solvability; playtest reasoning and hints |
| Art pack versus runtime status | Exported asset existence is not integration | Track source, optimized export, collider, animation, runtime use separately |
| Licensing and redistribution | Models, runtime and art have separate provenance | Preserve notices; review asset/model terms before broader commercial distribution |

Near-term choices to revisit when their phase begins: exact menu hierarchy, which sensors each class starts with, how additional aircraft are acquired, whether enemy drones primarily threaten or fight, how many legitimate Relay House solutions exist, and which regions become capability-gated. They do not need to block the current foundation pass.

## 11. Definition of the next coherent milestone

The next milestone is not “all heavier systems.” It is a player completing the opening without unexplained interface behavior:

1. Enter the world and understand the bike/trailer relationship.
2. Salvage something, inspect it and use or store it.
3. Launch a recognizable Scout, understand its controls and sensor limits, then recover it safely.
4. Meet Mara and see why new equipment became available.
5. Investigate Relay House, reason from clues and earn a useful capability.
6. Use that capability on a new problem.
7. Navigate menus, replay help and save/return without losing context.

This milestone is the basis for branching out into deeper fleet systems, richer threats and a larger world.

## 12. Evidence and references

Project evidence: `README.md`; `ROADMAP-2026-09-15.md`; `CHANGELOG-v7.*.md`; `INTEGRATIONS-v7.15.md`; `DEVELOPER-GUIDE.md`; runtime modules and verification scripts in the current checkout. Historical “planned” statements are superseded where a later implemented slice is documented. In particular, removable-pack logistics are present from v7.21; they should no longer be listed as wholly unbuilt.

Supplied project images guide world, character, drone and interface direction; they are not screenshots certifying current implementation. Continuity notes also mention additional material, route, salvage and architecture source packs; their existence is not treated here as proof of integration into this checkout.

Primary perception references:

- [YOLOX official ONNX models and usage](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/demo/ONNXRuntime/README.md)
- [YOLOX official preprocessing](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/yolox/data/data_augment.py)
- [YOLOX official decoding/postprocessing](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/yolox/utils/demo_utils.py)
- [YOLOX COCO classes](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/yolox/data/datasets/coco_classes.py)
- [ONNX Runtime Web deployment guidance](https://onnxruntime.ai/docs/tutorials/web/deploy.html)
- [ONNX Runtime environment/session configuration](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
- [YOLOX project license](https://github.com/Megvii-BaseDetection/YOLOX/blob/main/LICENSE) and [ONNX Runtime license](https://github.com/microsoft/onnxruntime/blob/v1.22.0/LICENSE)

The upstream YOLOX project is Apache-2.0 and ONNX Runtime is MIT. Those project notices are preserved; no separate weight-specific legal guarantee is asserted. The model's official release URL and checksum are recorded with the vendored files.
