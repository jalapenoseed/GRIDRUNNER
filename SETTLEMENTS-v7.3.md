# GRIDRUNNER v7.3 — Settlements

## Play

Follow the road to the new roadside building clusters; scan with R to tag settlements. Approach a resident and press E. Barter consumes materials from your pack. Advice is recorded in the journal; merchant stock is finite and persists through saves.

First stop: Riggs at Milepost 09, west of the road near the starting region (x -123, z -146). Two steel buy one set of wire cutters.

## Added

- Nine settlements, three per Leg, containing 18 enterable open-front buildings.
- Garage, diner and workers' housing layouts, with benches, counters, stools, beds and cupboards.
- Separate wall collision volumes, leaving entrances open; interior furniture collision where appropriate.
- Roof vents, facade seams, window panels, awnings, forecourts and scattered debris.
- Individual readable settlement signs rendered using canvas textures.
- Six residents: Riggs, Vee, Inez, Sol, Ada and Kip. Each has a role, clothing color, dialogue, route advice and a limited barter offer.
- Persistent resident meetings and trade counts, with validation and defaults for old saves.
- Residents subtly idle and face the player. They are stationary encounter characters, not roaming simulation agents.
- Leg-specific architectural colors: warm desert plaster, faded river green and cold industrial steel.
- Emissive entrance strips and settlement lamps. Local point lights are disabled on LOW.
- Buildings batched by material with instancing; settlements hidden outside their Leg or beyond 550 units.
- Distance-faded, stereo-positioned workshop and shelter ambience; sparse local metallic/tonal details; quieter trade confirmation sound. Synthesized sound, no voice acting.
- Weathered field-terminal menus, amber/teal accents, readable dialogue cards and mobile layout adjustments.

## Architecture

`dist/settlements.js` owns SETTLEMENTS and RESIDENTS data, save-record validation and scene construction. `game.js` adapts residents to E interactions, map scanning, journals, barter UI and the audio frame. Trades use the existing atomic inventory transform function. `expedition.js` validates the optional residents save field. `audio.js` adds two reusable ambient loops and location events.

Add a settlement with stable id, name, leg, x/z and style (garage/diner/homes). Keep footprints clear of mission routes and existing salvage. Add a resident with stable id, site reference, role, color, cost/reward item dictionaries, stock limit, dialogue and rumor. Saves use `state.residents[id] = {met:true,trades:1}`. Do not rename published resident IDs without migration.

## Verification

All five automated suites pass: original Legs 1–3 mission chains, riding/drone systems, audio mocks, economy, and DOM/runtime integration. Added checks cover resident proximity interaction, finite barter, item costs/rewards, journal entry, save/reload, legacy defaults, malformed stock rejection, enterable interior and Leg culling.

Full scene contains 470 mesh objects and roughly 225,512 triangles, including invisible Legs. Static settlement architecture is instanced per material. These are scene counts, not measured GPU frame rates.

The available test browser has WebGL disabled, established on the preceding release. No GPU rendering, lighting screenshots, audio listening or real-device FPS is claimed. Manual desktop and iPhone playtesting remains necessary.

## Limitations

NPCs use the existing stylized procedural person model with color variations; no new rigged GLB characters, speech or pathfinding. Props and buildings are procedural geometry. Roofs are visual surfaces rather than drone collision planes; wall volumes handle collisions. New rooms do not yet contain dedicated loot inventories. Existing roadside scavenging remains available. NPC hostility, factions, schedules and generalized quests are not implemented in this pass.
