# v7.20 — Physical line harvesting

After onboarding in Ghost Signal, fit the existing engineer module, select Utility and use **Fleet → Perch nearest live wire**. Dispatch from the bike or fly near a desired section before assigning. At least 25% battery and 30% hull are required.

## Implemented

- The 24 authored conductors share one sagging geometry model between rendering and flight. Attachment points are continuous along supported spans, excluding tower-end clearances and blocked or occupied positions. The radio link to the bike must reach the point.
- Physical approach → alignment → perch → coupling → charging → standby. A small visible clamp marks attachment. Propulsion and rotor audio stop. The battery charges to 90%, then the drone stays in place with only electronics draw until recalled.
- **Release & return** clears the conductor physically before returning. Other flight orders also release first; FPV takeover is refused until release finishes. Battery, hull and link failures retain priority. A powerless aircraft drops under the existing emergency-landing model.
- Onboard Utility capacity is 180 Wh for this mechanic; input is 1.2 Wh per game second. Southern/northern circuit reserves start at 500/1200 Wh. Every battery credit debits its circuit once. The southern feed starts live; the north feed requires the existing substation relay and grid coupler restoration. No proximity charge or energy from dead/exhausted circuits.
- Owned jobs, anchors, harvested energy and circuit balances persist. Restoring an attached job rechecks coupling before charging. Paused jobs remain clamped without harvesting; open menus and closed sessions do not advance energy. Practice is isolated from campaign circuits.
- Fleet shows stage, energized/dead/depleted status, remaining circuit Wh, collected Wh, battery charge, input rate and estimated time. Existing survey/outpost jobs, controls and campaigns remain available.

## Verification

Focused tests cover continuous wire positions, physical approach/attachment/release, exact Wh conservation, charge caps, parked standby, saved transitions, pause/resume, dead and occupied spans, interruption and failures, malformed saves, and real Rapier clearance. Full-runtime tests dispatch through the actual Fleet menu, fly through world collision, charge an unselected Utility, verify clamp visibility, restore a release, and preserve campaign inventory, trailer energy and Flight Yard isolation. Audio checks verify silent perched motors.

`npm test` passed on 2026-09-16. The in-memory ES-module bundle resolved (4,260,816 bytes), and `git diff --check` passed.

This pass uses renderer-independent simulation and DOM integration with real Rapier/Recast; it does not claim a new GPU visual review, audio listening session or hardware-controller playtest.

## Remaining pipeline

This is the first onboard-only harvesting slice. Removable battery packs, payload ownership/mass, multiple same-class harvesters, trailer unloading and fleet power policies come next. Conductors in later regions, richer grid restoration/interference, the original portrait communicator and authored intro, Eclipse, and the older graphics/asset/vehicle-physics queue remain tracked in the roadmap. The legacy receiver/trailer transfer is preserved as a separate game device.
