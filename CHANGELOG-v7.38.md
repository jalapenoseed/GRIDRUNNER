# v7.38 — One fleet, many words

## Play

- **Commander:** Fleet → 2,000 → Build fresh fleet. Program → Word sequence → Edit word sequence → Apply & launch sequence.
- **Expedition:** F9 (or Settings → Reset & hints → Advanced / admin tools). Choose up to 2,000; use Word sequence → Use word sequence; Deploy fleet & resume for a new roster, or Apply changes & resume for the current aircraft.
- Enter 2–16 messages, one per line. Each accepts 1–16 letters, numbers, spaces or hyphens. Hold 2–30 s, transition 2–40 s; loop or end on the final word. Aircraft IDs and flight bodies persist between cues.
- The four task pages reveal relevant controls. Guide & shortcuts opens explanatory, keyboard-accessible pop-up navigation. Invalid sequences return to the editor; an airborne size change offers Deploy or Keep current size. Advanced formulas and scripts remain available.

## Implementation

- Validation, buffers, launch pads, staging, saved fleets and both renderers support 2,000. Large default formations use banks / layers to fit the practice field. World edge deployment translates the entire pad grid, preserving unique launch positions.
- Hashed nearest neighbors replace all-fleet scans. Timed cue membership and aircraft indices use cached sets/maps. Steering preserves the previous avoidance math using scalar intermediates. In-world fleets over 512 use 20 Hz updates and interpolated positions; ordinary expedition aircraft retain their own update path.
- Small beacon cores, faint optical glare, distance attenuation and brief white strobes replace solid circular markers. Reduced motion holds them steady. Eight nearby point lights illuminate surfaces; distant aircraft use beacons and distance-limited airframe detail. This is an efficient visual model, not 2,000 shadow-casting lights or a certified real-flight controller.
- Compact fleet exports omit duplicated derived groups. Imports allow 2 MB. Old 1–100 fleets receive sequence defaults and continue to load. Expedition story progress and owned-aircraft snapshots exclude all test copies.

## Verification

- Focused core and actual UI/in-world integration checks pass for 100 and 2,000 drones, same-body word morphs, pause, loop/end, invalid-edit isolation, save/import, nearest-neighbor correctness, recall, unique edge pads and full beacon capacity.
- Isolated CPU run: approximately 9.3 ms per practice step and 16.1 ms per world step for a 2,000-drone grid, measured here over 320 steps. These are CPU measurements, not GPU frame-rate guarantees. Scripts, denser shows, terrain and devices change cost.
- Browser-checked the count controls, sequence dialog, launch and readable moving letters in tactical view. The cloud browser reports WebGL unavailable. Final 3D lamp appearance, GPU frame rate, mobile hardware and long-duration show endurance remain user QA.
- The complete `npm test` regression suite passed, including story progression and the new large-fleet checks. Both browser module graphs also validate.
