# GRIDRUNNER — All the lights we carried

Campaign direction and implementation record · 17 September 2026

The journey begins with one repaired Scout and an electric bike. It ends with a sky full of aircraft whose histories the player remembers. Between those moments, the player builds a network of people, machines and places that remain useful after the first visit.

The earlier discussion established the small starting fleet, progressive repair and construction, distributed aircraft, Charger, practical learning, a handheld communicator and a late creative fleet celebration. The seven-region sequence below is a proposed narrative structure for that direction. It is not a claim that seven regions are playable.

## What is playable in this update

| Feature | Current behavior | Further work |
|---|---|---|
| Story progression | New expeditions begin with Scout 01; Cargo, Utility, Relay and four spare frames are earned. Existing saves keep their fleet. | A parts-level airframe builder with component compatibility, damage and appearance. |
| Field link | Eight milestone transmissions, contact portraits, a call archive, next-step guidance and a U shortcut. | Animated video calls, spatially held communicator, authored interruptions and branching conversations. |
| Field bench | Six short sourced exercises; four frame repairs consume specific parts after the appropriate lesson and story milestone. | Interactive measurements, component faults, radio instruments, chemistry models and advanced mathematics. |
| Charger | Named command dispatches the existing Utility controller to real energized game conductors; approach, clamp, charge, removable-pack delivery and return use the existing flight/task systems. Charger can remain stationed on the line. | Search uncertainty, spoken reports, more source types, rooftop clamps and a broader battery distribution scheduler. |
| Distributed fleet | Six fixed stations across the three existing sectors. Aircraft preserve identity, hull, charge and placement across saves and travel. Charging draws from finite reserves. | Player-selected roofs, improvised depots, camp upgrades and simulated distant operations. |
| Discovery trails | UV maintenance cache, warm backup controller and RF beacon with three spatially separated readings; finite recoverable parts. | Actual noisy bearing intersection, richer thermal diagnosis and trails across later regions. |
| Flight recorder | Up to 120 samples of deployed aircraft, recorded every two active seconds; saved route, altitude, battery, hull and flight mode. A map slider reviews history without altering the world. | Recorded camera playback, mission annotations, longer exportable logs and comparisons between attempts. |
| Finale | Black Start unlocks a show using owned, available aircraft with sufficient charge and hull. Stationed aircraft must be recovered. Drawing, words, formulas and scripts control the same fleet. | Worldwide convergence, image-to-formation import and uploaded-music analysis. |
| Experimentation | Existing standalone Commander and hidden F9 fleet testing remain accessible. Commander retains 29 presets, drawing, words, BPM, tap tempo and optional metronome. | Expanded post-campaign Fleet Lab, authored challenge sets and exportable shows. |

The playable geography remains **Ghost Signal → The Spillway → Black Start**. The new story systems connect these existing sectors; they do not add the four proposed regions below. Station charging advances only in the active sector while the game runs. Closing, pausing or travelling elsewhere earns no charge.

## The dramatic arc

**Need → trust → responsibility → abundance → expression.** At first, electricity means enough range to survive the next leg. Later, it means keeping a promise to another place. At the end, it can mean making something beautiful together.

The recurring mystery is a maintenance signal that keeps changing. Early messages seem automatic. Different regions reveal revisions, signatures and workarounds left by people who never met. The reveal is that the network survived through repair and cooperation. The player becomes the next author of that network.

Charger begins as a practical local assistant. Its personality develops through remembered tasks and locations: the first successful clamp, a difficult return, a battery left for a camp, an aircraft recovered after a storm. It should remember concrete events, not announce imaginary emotional experiences or knowledge the player has not earned.

### Proposed regional sequence

| Region | Story turn and field loop | Learning through the problem | Capability and reason to return |
|---|---|---|---|
| 1. Dead Grid | Find Mara; prove the Scout can return; recover the Relay House notebook. A supposedly dead carrier changes after a repair. | Energy budgets, continuity, voltage/current/resistance; measured values versus guesses. | Cargo, first Relay and a repaired Scout. Return with UV and better diagnostics to read the original service trail. |
| 2. Corridor | The first long journey makes range and trust consequential. Charger identifies an energized line; the player chooses whether to leave it with a pack. | Line-of-sight radio, link margin, conductor geometry, reserve planning. | Dependable remote charging, clamps and temporary relay stations. Return with a route that avoids the old interference pocket. |
| 3. Creek | Cal needs dependable power at the waterworks. The player restores flow and discovers another maintenance signature. | Power versus energy, flow measurements, battery sizing, vector paths. | Water generation, another airframe and the first live fleet programming tools. Return to supply earlier camps and investigate heat anomalies. |
| 4. Suburbia | Household systems tell personal stories. The network becomes a group of people with conflicting priorities. | Board-level fault isolation, converters, sensor calibration, simple control loops. | Rooftop charging stations and the first multi-stop battery delivery route. Return to reconnect a place bypassed earlier. |
| 5. Industrial Grid | Old infrastructure offers abundant power but requires disciplined switching and load management. The archive explains why parts of the network were isolated. | Phase, startup surge, impedance, reactive loads and component ratings in bounded simulations. | Larger repair facilities, reliable storage and more demanding fleet coordination. Return to finish a system that could not be powered safely before. |
| 6. High Country / Towers | Weather, terrain and distance test the network the player has built. No single aircraft can solve every route. | Antenna geometry, sampling, signal/noise, navigation vectors and wind-aware planning. | Long-distance relays, distributed task scheduling and convergence rehearsals. Return to improve weak links revealed by recorded flights. |
| 7. Black Network | The player reconnects the human history behind the signal and decides how restoration should be shared. Energy becomes a resource for rebuilding and celebration. | Systems integration, uncertainty, optimization, coordinated motion and historical evidence. | Full campaign Fleet Commander, a gathering of recoverable aircraft and a player-authored sky show. Earlier regions remain useful after the ending. |

The existing Black Start choice is the present three-sector chapter ending. Its fleet finale is an early version of the eventual celebration; extending the campaign should preserve that completed chapter and the player's choice.

## The opening, beat by beat

This is an authored pacing target, not a measured completion time.

1. **A silent road.** The bike and one Scout are visible. The player hears a short carrier burst and learns to mount and stop. Avoid presenting every future fleet control at once.
2. **A small repair.** The first cache supplies tangible spare parts. The Scout systems check introduces launch, scan and return. A successful docking is the first complete loop.
3. **A person.** Mara explains what is missing at the Relay House and gives purpose to the Cargo frame. Her first call records a useful next step.
4. **A reading that matters.** The player predicts a simple current, compares the reading and repairs a spare Scout at a nearby bench. The lesson has an immediate consequence: another aircraft exists.
5. **A signal with a history.** The Relay House reveals its maintenance notebook. Different sensor views point to service paint, operating electronics and a carrier.
6. **“Charger, find me a power source.”** The player watches the aircraft identify a source, approach and attach. The first power report should refer to the actual remaining reserve and current task.
7. **A reason to come back.** Leave an aircraft or charged pack with a restored location. The next journey begins with a visible commitment behind the player.

The current implementation contains these interactions through the existing opening route, Relay House puzzle, bench and Charger tools. The timing, camera direction, complete voice track and handheld animations still need authored production and fresh-player testing.

## Persistent fleet rules

An aircraft has one identity, one hull state, one onboard battery, one position and one job. A menu, sector transition or finale must not quietly replace it with a fresh copy.

- **Travelling:** docked aircraft move with the rig.
- **Stationed:** placement belongs to a specific sector and station or supported conductor. It remains there until physically retrieved or recalled.
- **Working:** tasks report their stage and reason for waiting. A failed link, depleted source, blocked path or low reserve should produce a recoverable condition.
- **Damaged:** damaged aircraft remain part of the history. The player repairs or recovers them before they are eligible for a show.
- **Recorded:** logs describe what actually happened. Scrubbing a recorder never rewinds resources or moves a live drone.

Current travel between cleared sectors requires an unlocked station, all travelling aircraft docked and 8% bike charge. Fixed stations spend their saved Wh reserve on charging; conductor stations spend the existing circuit ledger. There is no offline economy in this release.

## Charger and the field device

The long-term command sequence is **search → identify → approach → clamp → couple → charge → stage or deliver → report → return**. Each step should expose the information the player can use: location, remaining energy, battery identity, time estimate, link condition and the reason for any hold.

The current command reuses the existing simulated conductor/pack machinery. It is a game operation, not a hardware procedure for connecting equipment to real power lines.

The communicator is an original field device with a concise portrait link, saved calls, sensor evidence, a repair bench, fleet network and recorder. The intended physical version has a screen, instrument inputs and modules unlocked through use. The Flipper-like interaction goal is a portable tool for the player's own game equipment: read a known beacon, inspect a circuit, compare a waveform and record a measurement. Real-world access or arbitrary device-control functionality is outside the current implementation.

## Learning design

The six current exercises are an introductory layer. They do not constitute the full requested curriculum. The next layer should make the player operate an instrument and explain an observed fault before spending a scarce component.

| Track | Current example | Next applied exercise |
|---|---|---|
| Electronics | Predict current through an ohmic practice load. | Use continuity and voltage measurements to distinguish an open trace, short and failed regulator. |
| Energy | Estimate nominal pack Wh. | Compare measured load against reserve and return distance, including losses. |
| Radio | Convert a receiver offset from MHz to kHz. | Locate the player's beacon using bearing uncertainty and separated measurements. |
| Mathematics | Find the length of a two-component displacement. | Work from vectors to interpolation, periodic motion, field gradients and constrained fleet paths. |
| Chemistry | Distinguish electron and ion motion in the battery model. | Explain a reduced usable capacity through a simplified material/cycling model. |
| History | Distinguish the date of a demonstration from that of a surviving object. | Examine source records and connect them to the mechanism being repaired. |

The current bench links its short explanations directly to [OpenStax on resistance](https://openstax.org/books/college-physics-2e/pages/20-2-ohms-law-resistance-and-simple-circuits), [OpenStax on power and energy](https://openstax.org/books/college-physics-2e/pages/20-4-electric-power-and-energy), [NIST on SI prefixes](https://www.nist.gov/pml/owm/metric-si-prefixes), [OpenStax on vectors](https://openstax.org/books/college-physics-2e/pages/3-2-vector-addition-and-subtraction-graphical-methods), [DOE on batteries](https://www.energy.gov/science/doe-explainsbatteries), and the [Royal Institution's Faraday apparatus record](https://www.rigb.org/explore-science/explore/collection/michael-faradays-electric-magnetic-rotation-apparatus-motor). Future lessons need the same source review, clear model assumptions and understandable feedback.

## The finale and life after it

The important number is the fleet the player can actually gather. A scattered, damaged or undercharged aircraft does not become a healthy light merely because the ending starts. Recovering and preparing the fleet is part of the final journey.

For the current Black Start show, available owned aircraft need at least 20% battery and 30% hull, cannot be stationed or occupied by another live task, and must be in a launchable flight state. The normal flight controller and reserve-return behavior remain authoritative. The show ends with a recall control.

Later image import should turn a chosen image into a previewed point formation, with explicit aircraft count and spacing. Later music import should produce an editable tempo/cue proposal before it drives choreography. Neither is implemented by this update. Existing drawing, text, formulas, scripts and manual beat controls provide the present creative tools.

The eventual convergence should reflect real travel and collected aircraft. Post-story Freeflight / Fleet Lab can offer unrestricted experimentation while preserving the expedition as a separate record.

## Next implementation order

1. **Play the opening on actual devices.** Check readability, camera guidance, controller/touch actions, first-time route comprehension and the new station/cache meshes.
2. **Build one complete repair investigation.** A visible board, instrument readings, fault hypothesis, part replacement and recovered frame. Include meaningful failed attempts.
3. **Deepen the communicator.** Physical handheld presentation, expressive original contacts, interrupted calls, concise voice recordings and replayable captions.
4. **Extend the station model.** One rooftop depot and one remote battery route, with capacity, approach and recovery checks. Add explicit remote simulation only after conservation and interruption behavior are verified.
5. **Expand one region at a time.** Suburbia first, including a return mission to an existing region. Each region needs a location, character, repair problem, clue, capability and reason to revisit.
6. **Add the creative imports.** Image sampling and music/cue analysis with a preview, bounded formations and the actual available fleet.
7. **Produce convergence and the later ending.** Preserve existing saves, chapter choices, identities and recorded history throughout.

New regions, rebuilt art, full chip repair, advanced engineering lessons, actual RF triangulation, worldwide convergence and automatic picture/music interpretation remain future production work. The original reference images inform the visual direction; this update reuses the existing models and adds small station/cache geometry rather than claiming a new asset set.
