# GRIDRUNNER v7.5 — The Relay House

This release extends the existing JavaScript expedition from main `d08df87`. All three campaign legs, existing settlements, energy economy, saves, touch controls and camera preferences remain playable.

## Machines and controls

- Rebuilt first-person cockpit in both helmet and handlebar views: bent alloy bars, clamp bolts, grips, rounded gloves, hydraulic lines, levers, reservoirs, radio and hooded 512 × 256 instrument cluster. Speed, both battery reserves, compass, aircraft link, motor temperature and hull are live.
- Manual drone flight offers **Stabilized** (default) and **Acro** under Settings. Acro has independent persisted pitch/yaw/roll, angular response, nose drive, body-up lift, gravity, aerodynamic drag and swept collision. The FPV camera follows aircraft attitude. HOLD and physical return retain assisted flight.
- Acro is a simplified vectored-thrust game aircraft, not a calibrated quadcopter aerodynamics simulator. Pitch is limited to about ±85°; roll can invert. Neutral lift balances gravity only when level. Banked flight loses altitude. Reduced camera motion never conceals actual Acro attitude.
- Xbox/standard Gamepad API polling, radial deadzones, analog triggers, invert Y and sensitivity. Last active device owns continuous input. An unplugged controller during FPV leaves the aircraft on HOLD, restores the stationary rider and pauses.
- Menus support stick/D-pad focus, A selection, B close, and left/right slider adjustment. Keyboard and touch remain available. Browser audio still needs an initial click/tap on platforms that enforce gesture activation.

| Xbox control | Action |
|---|---|
| LS | Move/steer; Acro nose drive + roll |
| RS | Look; Acro pitch/yaw |
| LT / RT | Brake / motor assist |
| A / B / X / Y | Use / dismount-back / scan / pack |
| LB / RB | Camera / launch-recall |
| D-pad up/down | Drone lift |
| D-pad left/right | Cycle Follow/Hold/Dock/FPV |
| LS click / RS click | Pedal toggle / energy pulse |
| View / Start | Map / pause |

Keyboard Acro: W/S nose drive, A/D roll, mouse or arrows pitch/yaw, Space/Shift lift. **2** returns to HOLD. **J** opens the journal; **I** pack; **M** map; **Tab** field menus.

## Exploration and crafting

The service track west of the opening road leads to Relay House, centered at **x -86, z -86**. A raised porch, kitchen, office, bunk room, walkable service stair, cellar, yard workshop and collidable roof form one continuous 3D location. Ten physical hotspots use the existing E/USE interaction.

1. Recover the protected fuse and radio materials from the cellar toolbox.
2. Give the fuse to **Len**, the cabin caretaker; recover his folded login note.
3. Free the yard generator with a wrench.
4. Combine the note with the office frequency scrap to access the CRT.
5. Read the operator notebook; wind a coil, then build a signal filter at the powered yard bench.
6. Install the filter in the cellar rack, use the drone on the rooftop dish, and tune the terminal to the carrier.
7. Receive the hidden transmission and retain its tower authentication token.

The CRT remains a live in-world console: `login`, `list`, `read`, `ping`, `dump`, `tune`, `exit`. Touch/controller command shortcuts appear only when their clues have been recovered. The expedition clock continues while using this terminal. Ordinary field menus still pause.

Evidence, component use, recipe knowledge, station gates and successful repairs persist. New components include protected fuses, radio coils, signal filters, sealed reserve cells and repair kits. Failed fabrication consumes neither materials nor energy. Essential relay parts cannot be discarded before completion; they can be stored and retrieved at vehicles.

## Presentation and assets

- Compact riding instruments, contextual radio subtitles, revised field-terminal menus, evidence cards, item selection, controller guidance and mobile layout rules.
- Ten existing Electrical Pack 01 / Field Camp Pack 02 GLBs: workbench, field radio, supply crate, breaker panel, cot, barrel, cable spool, tarp shelter, utility pole and transformer. Approximately **99,076** imported equipment triangles before instance placement.
- Existing Ground037, Rock030, Wood051 material maps and original oak cutout from the supplied assets; instanced verge stone, road patches and oak clusters; modest environment reflections and practical cabin lights.
- Equipment streams two files at a time near the compound. LOW uses procedural proxies, fewer instances and no added point lights. Missing imported assets retain stand-ins. No edits to `dist/three.js`.
- Original synthesized motor, rotor body/harmonic, generator, CRT, carrier, pedal cadence and loaded-trailer rattle; radio/danger music ducking and pause cleanup. No downloaded sample pack.

## Save and module compatibility

The envelope stays **SAVE_VERSION=1**. The existing `state.relay` boolean is the original substation flag and remains unchanged. New mystery state is **`state.relayHouse`**, deliberately separate; old records migrate to an unsolved house. Missing aircraft attitude migrates to level flight. Camera and gamepad settings remain in browser settings.

New modules isolate controller polling/menus, instrument drawing, evidence/terminal UI, pure puzzle transactions, compound geometry, imported equipment and environmental detail. `game.js` adapts them to the existing campaign.

Validation and remaining device checks are recorded in [QA-v7.5.md](QA-v7.5.md).
