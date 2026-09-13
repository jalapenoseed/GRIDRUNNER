# GRIDRUNNER v7.2 — Fieldwork foundation

This is the first playable implementation of the Compact Work Handoff, built on GitHub commit 3b9b17c. It preserves the Ghost Signal campaign rather than replacing it. The original build remains in Git history; all existing v7 tests passed before editing.

## Play

Open the GitHub Pages game. New Expedition supplies a screwdriver and wrench. Ride off the road toward the small salvage boxes; E opens nearby containers. Inventory → Fieldwork opens cargo and fabrication. R scans and tags sites on the map. Controls contains editable keyboard assignments, including drone altitude and commands; touch controls remain available.

1. Search household, garage, electrical and industrial containers.
2. Inspect junk, then salvage it using the required tool.
3. Craft cutters from steel/rubber. Assemble a pickaxe near the trailer.
4. Mine deposits: choose Mine, then remain within 8 m for four seconds of play.
5. Transfer cargo between pack, bike (12 kg) and trailer (60 kg). Ride weight includes vehicle cargo. Unhitching leaves trailer cargo behind.
6. Find rare fuel in garages/industrial containers; pour one liter into the nearby trailer generator. Select Fuel in Bike / Trailer, resume play and transfer stored power with T.

## What changed

- 27 shared item definitions: materials, four tools, mundane junk, salvageable appliances and fuel.
- 120 seeded loot containers and 24 finite mining deposits across all three Legs.
- Persistent world contents, discoveries, mining depletion and vehicle cargo.
- Reusable atomic transfers with mass and stack limits; failed transactions preserve inputs.
- Tool-gated salvage and four data-defined fabrication recipes, with station and energy requirements.
- Timed mining interrupts when the player leaves, switches to drone or loses the tool.
- One instanced draw batch for new props; proximity and Leg culling. No solid infrastructure overlaps found by runtime checks.
- Configurable keyboard bindings, including drone flight, scan, launch/recall and commands. Duplicate assignments swap; saved separately from expedition saves.
- Rare fuel: 3.5% roll in eligible garage/industrial containers, usually 1 L, exceptionally 5 L. No reroll on reload.
- Generator produces 3 kWh per liter at 12 kW. A game hour is five real minutes. Existing charge units represent 0.02 kWh: bike capacity 2 kWh, trailer 0.8 kWh. Full storage stops fuel consumption. Solar/water retain campaign rates.
- New ordinary expeditions start with 0.15 L. Mara trades two 0.1 L emergency remnants at four steel each; unlimited cheap fuel removed. Supplied chapter starts and scripted emergency caches preserve their existing fuel rewards.
- Existing campaign inventory s.inv is expanded in place. Campaign rewards/crafting and new materials share one inventory.
- Save envelope remains version 1; field subsystem carries version 1. Old saves receive deterministic field defaults; malformed field records are rejected. New saves are not backwards compatible with old game builds.

## Module map

| File | Responsibility |
|---|---|
| dist/survival.js | Item/recipe/loot data; deterministic world generation; inventory validation; atomic transfer, salvage, fabrication; energy constants |
| dist/game.js | Existing scene and gameplay; field interactions, menus, rendering adapter, timed jobs, controls and save orchestration |
| dist/expedition.js | Save validation/migration, riding and generation math |
| dist/drone-system.js | Existing independent drone vehicle, commands, scan and signal |
| dist/leg2.js / leg3.js | Campaign content and mission gates |
| dist/visuals.js / immersion.js | Existing models, landscape, scalable atmosphere and camera |
| dist/audio.js | Existing synthesized ambience, music and gameplay feedback |
| verify-survival.mjs | Pure economy and persistence invariants |
| verify-runtime.mjs | Real DOM + Three.js scene integration, renderer stubbed |

## Content schemas and examples

Executable examples are in survival.js. Add a normal item to ITEMS using a stable ID:

```js
radio: item('Broken radio', .7, 'junk', 4, {
  tool: 'screwdriver', salvage: { electronics: 1, copper: 1 }
})
```

Add its ID to a LOOT table. The generic inspect, transfer, mass, salvage and save systems then handle it. Add categories by extending LOOT and the generator's selection; do not change existing entity IDs/layout in a released version without migration.

```js
// FIELD_RECIPES entry
radioRepair: {
  name: 'Repair radio', inputs: { electronics: 2, wire: 1 },
  output: { radio: 1 }, tool: 'screwdriver', station: 'trailer', energy: 2
}
// Container instance
{ id:'field-1-0', leg:1, x:-18, z:10, kind:'container',
  table:'household', items:{bottle:2}, left:0, resource:'copper', seen:false }
// Save extension under state.field
{ version:1, seed:1047, storage:{bike:{},trailer:{}}, world:[/*144 records*/], fuelTrades:0 }
```

NPC and mission schemas have NOT been generalized in this pass. Existing NPCs and mission handlers remain authoritative; see DEVELOPER-GUIDE.md for their current implementation and Leg extension points. Do not treat proposed future NPC schemas as executable features.

## Run and validate

`npm ci`, then `npm test`. Serve `dist` using `python -m http.server 8080 --directory dist`, or use `npm run dev`. The static build requires no bundling and uses relative URLs for GitHub Pages. Vite startup encountered an environment-specific network-interface error here; the Python static server started successfully.

Automated checks passed: all original campaign chains and ending save, drone movement/commands, audio synthesis, graphics options, save validation, atomic transfers, capacity, tool gates, fabrication, timed mining, cargo, fuel refill, finite trade, legacy migration, depletion reload, seeded rare loot, energy conservation and remapped key events. Scene: 284 meshes, about 215,330 triangles, including 144 low-poly prop instances.

Browser local navigation was blocked by this environment (ERR_BLOCKED_BY_CLIENT). The integration suite uses real Three.js objects with a stubbed renderer: it does not verify GPU rendering, FPS, pointer lock or audible mixing. Manual PC/iPhone visual playthrough remains required.

## Scope and next pass

This is a working foundations pass, not the complete long-term handoff. NPC factions/reputation/trade simulation, generalized mission objectives, controller input, new authored GLB models, equipment durability, recipe timers/knowledge, multi-class drone payloads, custom map markers and the developer panel remain for later work. Existing campaign recipes are still their existing data/handlers; new fabrication uses the shared transaction core. The new prop shapes are simple boxes/low deposits rather than bespoke appliance models. Audio reuses the v7 effects.

Recommended next pass: visually test and balance this loop, then introduce authored salvage clusters and camp merchants with finite inventories, followed by reusable mission objectives. Refactor field UI out of game.js once those interactions are settled. Preserve serialized IDs and add migration tests before changing world layout or inventory schemas.
