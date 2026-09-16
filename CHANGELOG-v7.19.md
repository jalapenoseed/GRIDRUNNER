# v7.19 — Relay outposts and tutorial recovery

## Playable change

After onboarding, use **Fleet → Relay Outpost** or **Shift+0**. Relay deploys to a clear, reasonably flat patch about 240 m ahead of the bike, descends gently and stops its rotors. Scout waits for the landed connection, surveys about 460 m ahead, scans once and physically returns. Relay stays deployed until recalled or a safety return takes precedence.

Both aircraft need at least 40% battery, 30% hull and no active job. Deployment validates both orders before changing either aircraft. If no landing area and onward link are available in the current region, move or turn the bike. The outpost remains at its assigned location when the rider moves; it does not teleport along with the formation.

The link uses the stronger of direct reception and a two-hop route through the outpost. The weaker hop limits relayed reception; both account for range, authored structures, sampled terrain, weather and interference. The bike must remain connected to Relay. Radio-only draw is 0.012 battery percentage points per second before difficulty scaling. Batteries never charge from this operation. Normal return reserves and lost-link/hull failsafes still apply.

Relay jobs and Scout's dependency persist through saves. Menus and closed sessions do not simulate them. FPV/HOLD pauses work, Resume explicitly continues it, and recall/cancel replaces it. A parked Relay can take off remotely and return through collision; emergency LANDED aircraft retain the existing nearby-recovery requirement. Parked relay motors are silent in the audio mix. The existing four movement presets and ordinary survey jobs remain available.

## Maintenance

- Beacons use a brighter additive core, higher minimum opacity and one-third the previous angular size, with a 3.6 m world-size cap. Amber marks return; pale blue marks a landed outpost. Each aircraft has its own pulse phase. World occlusion remains enabled.
- “Skip this introduction” is a one-expedition choice. It no longer persists Tutorial OFF. **Begin with tutorial** restores a guided new start even with an older OFF preference; Pause → Replay equipment guide preserves campaign progression.
- The live Scout lesson now reflects Mode 2 and Acro controls instead of overwriting them with legacy instructions. Existing narration, subtitles and acquisition lessons remain.
- Shift-number commands use physical digit codes when the browser reports punctuation. Orbit now displays its actual `0` binding. Relay Outpost uses `Shift+0`.
- Rejected chapter transitions check prerequisites before cancelling jobs or resetting aircraft.
- The existing drone telemetry identifies a relayed link. No additional permanent HUD panel was introduced.

## Verification and limits

Focused simulation checks cover landing without hull damage, stopped propulsion, finite radio drain, remote recall, waiting dependencies, travel beyond direct range, loss of either hop, weather/terrain attenuation, pause/resume, battery failsafes, save restoration, malformed task rejection, atomic deployment refusal and real Rapier approach clearance. Full-runtime DOM checks exercise the actual Fleet button and physical hotkey values, terrain and world volumes, selected/background flight, real discoveries, tutorial recovery and chapter guards.

`npm test` passed on 2026-09-16, including the three campaigns, inventory and energy systems, earlier fleet jobs, dual sticks, Flight Yard isolation, save migration, Rapier collision and Recast camp navigation. The full ES-module bundle resolved in memory (4,240,932 bytes); `git diff --check` passed. Beacon checks inspect materials and geometry; they are not a new GPU screenshot or device playtest. Visual readability, audio listening and mobile/gamepad hardware feel still need field QA.

This completes a bounded relay-support slice. Physical conductor attachment/charging, removable packs, multiple same-class harvesters, fleet power policies, the original portrait communicator/intro overhaul and Eclipse remain in the roadmap. The older asset/rendering/vehicle-physics queue has also been reviewed there. A local source commit does not publish the hosted build.
