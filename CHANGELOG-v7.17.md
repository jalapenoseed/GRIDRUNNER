# v7.17 — Mass & dual-stick flight

## Implemented

- Shared `dronePerformance()` supplies manual and autonomous aircraft with dry/loaded mass, speed, climb, acceleration, braking, angular response, wind response, draw and return-reserve tuning. Values are gameplay targets, not real equipment specifications.
- Scout: 0.95 kg / 48 m/s. Relay: 1.25 kg / 44 m/s. Utility: 3.4 kg / 32 m/s. Cargo: 8.4 kg / 26 m/s unloaded. These are horizontal limits, not instant speeds. The existing unavailable Interceptor stays unavailable.
- The actual Flight Yard recovery crate adds 6 kg to Cargo, reducing speed/climb/acceleration/braking authority and increasing energy draw. It affects the correct aircraft even while another aircraft is selected; the crate mesh follows its carrier. Delivery removes the load. Player backpack weight is not applied to aircraft.
- Shared Mode 2 mapping for mobile and standard Xbox-style controllers. Left: lift/yaw. Right: forward/strafe in Stabilized; pitch/roll in Acro. Acro right-stick up lowers the nose. Center lift is compensated hover thrust, not a realistic non-centering RC throttle; banking still loses altitude. Classic move/look remains selectable. Keyboard bindings are unchanged.
- Mobile has a second, independently captured joystick, contextual labels and HOLD. Sticks reset on cancellation, lost capture, menus, settings changes, controller-loss pause and aircraft commands. Walking/biking retain move-and-drag input. Gamepad use hides touch pads.
- Total mass appears in the existing drone telemetry header; fleet cards show dry mass, payload allowance, speed and acceleration. Tutorial hints, controls and handbook describe the new mapping.
- No save schema change: mass is derived from airframe plus actual session payload. Legacy drone records and campaign saves continue to load; Flight Yard payload cannot enter campaign saves.

## Verification

- `npm test`: campaign progression, save/restore, menus, audio state, Xbox mapping/disconnect, real Rapier collision, Recast navigation, fleet spacing/formations and the new flight tests.
- `verify-flight-dynamics.mjs`: mass/speed ordering, loaded movement and energy, equal-speed stopping distance, angular response, wind, reserve return, speed caps, fast thin-wall collision, covered docking for all four airframes, legacy records and two-stick ownership/cancellation.
- `verify-flight-integration.mjs` runs inside the real module/DOM suite: two-stick input into the game update, Acro axes, pause/HOLD safety, settings persistence, HUD mass, cargo attachment/delivery and selected/unselected load ownership.
- These automated tests are not physical-controller, iPhone or GPU visual certification. Browser inspection was attempted but the provided browser rejected the local URL with `net::ERR_BLOCKED_BY_CLIENT`. No screenshot or live visual pass is claimed. Vite's host discovery also failed in this environment; a plain local static server started successfully.

## Quick playtest (still needed on device)

1. Flight Yard → Scout → Circuit: compare acceleration and stopping with Utility/Cargo, then test Relay's speed.
2. On mobile, verify two sticks and USE/HOLD fit both orientations without covering telemetry; fly with both thumbs, cancel one touch, open/close a menu and confirm neutral input. In Classic, check RISE/DESCEND.
3. Xbox: verify left lift/yaw and right movement; change to Acro to check pitch/roll. Change to Classic to recover the old layout. Unplug in flight: aircraft should HOLD and the game should pause.
4. Cargo recovery: attach at PICKUP, observe 14.40 kg, fly and stop, switch to Scout, then return to Cargo and deliver. Mass should return to 8.40 kg.
5. Test Scout/Relay at speed against terrain, buildings and thin objects. Automated sweeps pass, but full-world collision coverage still needs playtesting.

Physical conductor perching, multiple same-class harvesters, removable campaign packs, autonomous energy policies, the CODEC/intro redesign and Eclipse are **roadmap requirements**, not features of this update. See `ROADMAP-2026-09-15.md`.
