# v7.22 — Quest-gated fleet progression

## Playable flow

- Campaign systems now have one explicit unlock route instead of appearing as an undifferentiated sandbox. Scout is opening equipment; Cargo follows meeting Mara; Utility follows fabricating the engineer module; removable packs follow the Relay House schematic; conductor harvesting and Relay follow decoding the Relay House hidden carrier.
- Flight Yard remains unrestricted practice. These locks apply to the expedition, so the current demo keeps a place to test every airframe without corrupting campaign progression.
- Journal now includes a persistent Expedition unlock route showing completed and locked steps. Existing saves migrate without losing inventory, tasks, packs or aircraft state.

## Maintain trailer reserve

- Completing one manual Harvest & Deliver run unlocks the first fleet power policy. Choose a 40%, 60%, 80% or 100% trailer target and arm repeat deployment.
- Utility waits until it has physically returned and docked beside a stopped trailer, loads the lowest-charge stored pack, finds a reachable live conductor, then uses the existing physical perch, finite circuit, pack charging, release and trailer-unload path. It does not create packs or energy.
- The policy holds with a visible reason for unsafe weather/interference, low battery or hull, a moving or distant trailer, missing packs, an unavailable conductor, a depleted source or an active/paused job. Stopping automation never cancels a flight already in progress.
- Completed delivery IDs are counted once across repeated ticks and saves. Policy target, armed state, cycle count, retry time, reason and the campaign milestone ledger persist.

## Verification

Added progression/policy coverage for quest gates, migration, one-time delivery accounting, target selection, weather holds, physical stored-pack loading, repeat dispatch and malformed saves. The existing full regression suite remains required before publication.
