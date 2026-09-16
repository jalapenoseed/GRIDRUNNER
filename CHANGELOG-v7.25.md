# v7.25 — Maintenance Cut / WATCH-01

- Added an optional amber-marked service route between the opening camp and the stranded EV: route board, roofed cover bay, recoverable night-shift note, repairable latch panel and finite supply locker.
- Kept the main carriageway, existing quest approaches and saved field pickups clear. Shared scenery exclusions protect the authored route. Cover dimensions match its static collision volumes.
- Added one independent, non-weaponized WATCH-01 patrol with camera-cone detection, terrain/solid occlusion, accumulating suspicion, investigation/observation, frozen last-known search, finite search duration, physical retreat and finite station energy.
- Reused the existing aircraft physics and approved Scout model when loaded; retained its established low-detail fallback. No approved source assets or other engine branches were edited.
- Added proximity-, ownership- and capacity-safe repair/salvage transactions. Repair consumes exactly one wire and one electronics once; a full backpack leaves remaining items in place.
- Added campaign state validation/migration and pause/tutorial/chapter/Flight Yard isolation. Recharge has no offline clock and cannot refill from an empty station.
- Reused existing objective/radio surfaces for threat cues and the Journal for recovered route notes. No new permanent HUD overlay or combat damage.

Verification: unit tests and real-scene/DOM integration with Rapier. Coverage includes a complete patrol, collision-free route walking, physical roof/side walls, last-known tracking, save round-trips, finite energy accounting and one-time salvage. The renderer in integration tests is a stub; these results do not claim browser/GPU screenshots, listening, or physical controller/mobile testing.

Scope boundary: one short authored detour and one unarmed enemy prototype, not a region-wide density pass or a finished combat system. Multi-instance fleets, original communicator/cinematic, Eclipse and broader physics/audio/asset work remain future slices.
