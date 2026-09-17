# v7.35 — Fleet Commander

Play the independent arena at **[Fleet Commander](https://gridrunner.goodyartist.chatgpt.site/commander.html)**, or choose **Fleet Commander · 100 drones** from the GRIDRUNNER main/pause menu, Fleet directory, Swarm Command or Program Swarm.

## Fleet and flight

- Build 1–100 individual aircraft, with quick choices for 6, 25, 50 or 100. Six starters are four Scouts and two Relays. Recon, four-airframe and relay-only mixes reuse Scout, Relay, Cargo and Utility identities; each drone's airframe, callsign, team and beacon color are editable.
- Nine beacon choices: red, orange, amber, lime, cyan, blue, violet, pink and white. Paint a whole group or an individual aircraft. Compact colored beacons have bright white centers; airframe strips and halos in the campaign are also toned down. Commander has no bloom lighting.
- Launch, pause, recall, recharge and reset. Click an objective, select a color/team/airframe group, and scout, protect the operator, protect the bike or build a relay link. Per-drone launch pads, battery reserve returns, spatially indexed spacing corrections, field limits and obstacle clearance are simulated. Unlimited batteries are the default practice option.
- Overview, top, front and selected-aircraft cameras in WebGL. Approved GLB airframes share instanced mesh parts; far aircraft use lightweight bodies. Beacons retain pixel size without adding a light per drone. A working canvas tactical view is available when WebGL cannot initialize; it offers overview/top and front elevation, without the 3D follow camera.

## Programs and saved fleets

The shared bounded script/formula engine now accepts a Commander roster of up to 100 while campaign validation still accepts only its six starter IDs. Scripts can select all, airframe classes, alpha–delta teams, any beacon color or IDs such as `drone-001`. Empty named groups are skipped. Applying a program restarts its clock; unaddressed formation aircraft hold their previous targets. Direct group commands release those aircraft from program authority.

Manual controls include shapes, placement, spacing, scale, altitude, patterns, influence fields, custom arithmetic formulas and show choreography. Words and multi-stroke drawings can hold or trace upright or flat formations. The same stroke/word system samples 100 distinct trace phases; path metrics are cached for repeated sampling. Dense words can still be distorted by spacing and field limits.

Four Commander script examples cover a Riemann bloom, color wave, sky writing and split guard/scout duties. Formulas remain bounded arithmetic with no JavaScript evaluation, property access or I/O. Rolls/flips are visual airframe choreography, rather than a physical aerobatics model.

Save up to 20 named fleets in the browser, replace a named setup, load it, or export/import a validated JSON file. Fleets include roster, teams, colors, program, drawings, objective and field options. Loading resets the run; these are setup files, not midflight checkpoints. Named saves are separate from campaign saves. The last valid working setup is also held for the current browser tab. Export a file to keep a copy across devices or browser-storage resets.

## Training and party games

- **Free flight:** experiment with the fleet and program controls.
- **Formation drill:** match ring, line, grid and wedge, holding at least 80% cohesion for three seconds each, within three minutes.
- **Beacon hunt:** direct the requested color into a target. Correct aircraft earn 10 points each, completing a color earns 25, and wrong colors lose two each. Ninety-second round.
- **Party relay:** 2–4 named pilots pass the controls on the same device. Each receives the same starting fleet and 90-second course; a scoreboard records the rounds. No online multiplayer is implied.

Roster, imports and field options lock during scored rounds. Programs and group commands remain available. Hiding the arena pauses it; use Resume to continue.

Entering Commander from a running expedition holds a validated snapshot for that tab, including individual aircraft state. Returning restores the expedition paused and consumes the handoff once. Opening Commander directly does not require a campaign. The campaign still begins with its six-aircraft workshop kit, camouflage cover, finite supplies and existing missions; the 100-aircraft mode is this independent practice field.

## Validation and limits

Full `npm test` passes, including campaign/physics/sensor/save/menu regressions and new Commander suites. Focused coverage includes 1/6/100-drone fleets, all colors, malicious/invalid imports, complete save round trips, grouped and queued script cues, 100 distinct trace phases, all-aircraft return/dock, finite flight and bounds with all example scripts, reserve return, playable drill/hunt scoring, fair party resets, UI drawing/paint/save/load controls, and campaign handoff isolation.

The 100-drone launch/grid scenario averaged approximately 1 ms per simulation step in this environment, with at most 338 neighbor checks per step. This is a CPU simulation measurement, not a GPU frame-rate claim. Shared mesh geometry and instance capacity are checked separately. Desktop and 390 px browser controls, save/load, scripts and challenge setup were exercised using the actual tactical fallback. WebGL was unavailable in the review browser; 3D appearance and GPU performance require a device playtest.

Commander uses its own lightweight practice controller and obstacle range, not 100 copies of campaign Rapier bodies, sensor inference or battery-pack jobs. Drone discovery, parts-based construction, campaign challenge progression, online play and export into campaign inventories remain future work. Source remains the GRIDRUNNER Sites repository; other dirty checkouts and remote PC/GitHub branches were not overwritten.
