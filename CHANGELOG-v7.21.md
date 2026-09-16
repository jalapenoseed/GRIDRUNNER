# v7.21 — Harvest & deliver / fleet identification

After onboarding: **fit engineer module → stop beside trailer → Fleet → Utility → Assemble empty pack → Load lowest-charge pack → Harvest & deliver**. Assembly costs 1 cell, 2 wire, 1 electronics and 1 rubber from the backpack.

## Playable slice

- Up to eight removable 120 Wh / 1.2 kg packs have unique IDs, charge, capacity and a single owner. Build empty packs, load Utility or Cargo, and unload at the trailer. Scout and Relay cannot lift them. A visible battery case and the existing mass readout show the carried load; campaign acceleration, braking, climb and drain use it.
- Utility's delivery job physically approaches and clamps to a supported conductor, charges its onboard battery first and its pack to 90%, clears the wire, then flies to the trailer's current position. It holds above the stopped trailer for two seconds to secure/unload the pack, then returns to the bike. Parked trailers work independently of bike position. Radio/reserve, collision and hull failsafes still apply.
- Every harvested Wh debits the existing finite circuit once. Trailer conversion uses the existing economy: 20 Wh per reserve unit, 800 Wh total capacity. Surplus stays in the stored pack; use Stored packs → reserve later. Cargo-full or moving trailers cannot accept a remote delivery. Stored packs use cargo capacity and add towing mass.
- Pause/resume, manual takeover, recall, failure, saves and aircraft changes retain pack ownership. Interrupted work never remotely credits the trailer. Practice starts with a separate empty manifest and restores campaign packs on exit. Old saves migrate to zero packs and zero added energy. Generalized repeat policies and multiple same-class harvesters remain planned.

## Visibility

- Stable aircraft colors: **Scout cyan / Cargo amber / Utility lime / Relay magenta**. Fleet cards show the same colors and names. Return, release, perching and relaying never recolor an aircraft's identification lamp.
- Saturated, untone-mapped, fog-independent beacon cores with a compact ten-pixel outer footprint at distance. A low-amplitude pulse remains continuously visible; terrain and structures still occlude the lamps. There is no 600 m scale cap. Normal blending keeps identity colors from washing out against the sky.
- Thermal includes airborne drones, grounded relays and perched Utility. Bright heat geometry is fog-independent and depth-tested; colored identification sprites retain their palette. The current night-vision scene tint is unchanged.

## References and remaining pipeline

Reviewed all 16 supplied images: communicator/narrative boards, conductor-perching scene, solvable-world and route concepts, riding modes, drone operations, weather/audio, modular people, four airframes, materials and UI atlas. These guide the continuing pipeline; this slice reuses the approved drone assets. No source video was inspected in this pass.

Next: repeat harvesting policies and trailer-reserve targets, then multiple-airframe ownership, followed by the original portrait communicator / authored intro and Eclipse. Older collision-hull, trailer-physics, graphics, audio and asset work stays on the roadmap.

## Verification

Full automated regression suite plus new pack and beacon checks: actual Fleet transactions, loaded world flight using Rapier, saved release, physical delivery to a detached trailer, exact circuit/onboard/pack/reserve accounting, full-storage retention, ownership rejection, paused delivery restore/resume, moving delivery target, recall and practice isolation. Beacon checks cover all four colors, 150/460/900 m projections across three viewport heights, thermal materials, depth testing and renderer-state restoration after failure.

Validation is simulation/DOM/Three.js geometry and module bundling. It does not claim new GPU screenshots, audio listening or phone/controller playtesting.
