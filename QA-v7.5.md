# GRIDRUNNER v7.5 validation

Base: `d08df877f357cdba3a7b4b851e0cf5a22d3db575` on jalapenoseed/GRIDRUNNER main.

## Automated

`npm test` includes the existing six suites plus gamepad, Relay House and shipped-asset checks.

Verified:

- Original Legs 1–3 prerequisite chains, both endings, zero-energy travel, field economy, residents and all camera profiles.
- Drone pitch-driven trajectory, yaw and roll response, gravity while banked, thin-wall swept collision, migrated attitude and physical return from Acro.
- Complete mystery transactions, clue gates, finite rewards, station/knowledge/energy crafting, filter installation, roof dish, carrier decoding, retained token and legacy save validation.
- Continuous movement through the actual raised porch and down/up the cellar stair, followed by the real interaction and DOM crafting adapters. No teleports are used for that traversal check. Later machinery fixture positions isolate interaction checks.
- A live CRT advances expedition time; normal menus pause. Roof collision prevents flying straight through the building to the dish.
- A stub Xbox device reaches the actual E adapter. Keyboard reclaims input. A disconnect during FPV sets HOLD, restores the rider and pauses. Pure tests cover analog triggers, radial deadzones, null slots, button edges and menu repeat.
- Audio starts lazily, uses one context, ducks music under radio, supports new loops/events and returns all one-shot nodes to zero after pause. Repeated pause/resume does not grow the loop graph. Mixer tests use a fake AudioContext and are not an audible listening pass.
- All ten real GLBs are self-contained, parse with the shipped r169 GLTFLoader, retain finite geometry and survive the actual material batching path. Their geometry totals 99,076 triangles. This headless check omits material bindings only to avoid browser image decoding; it does not verify texture appearance.

## Environment limitations

The local Vite command encountered `uv_interface_addresses` in the hosted Linux runtime. The authored `dist/` works with a plain HTTP server; this does not require a production bundler.

The connected test browser rejected localhost with `ERR_BLOCKED_BY_CLIENT`; the configured development hostname refused the connection. The complete runtime tests use real Three.js scene objects and a stub renderer. These results do not establish GPU rendering, FPS, physical Xbox compatibility, iPhone layout/comfort, or audible sound quality.

Manual checks still needed on the player's hardware:

- Read the new cockpit at normal and handlebar POV/FOV.
- Walk Relay House, descend its stairs, look at the imported equipment and approach the roof dish in FPV.
- Plug in an Xbox controller; ride, navigate menus, fly Acro and disconnect/reconnect.
- Inspect 320px touch layout and landscape on iPhone; compare LOW/HIGH performance.
- Listen to motor, rotor, generator, carrier and footsteps; adjust mixer levels.

Gamepad API reference: [MDN: Using the Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API). Browser reports of standard mapping are required; unknown mappings retain keyboard/touch fallback.
