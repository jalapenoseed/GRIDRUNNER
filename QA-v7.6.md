# v7.6 validation

Based on the yaw-enabled main commit de4cbbe.

All included logic and real-DOM integration suites pass, including the existing three campaign legs, Relay House, energy economy, save migration, remaps, Xbox disconnection safety and independent pitch/yaw/roll dynamics. New tests cover the four-airframe hangar, gate order, inspection dwell, role-gated repair/relay, cargo pickup/delivery constraints, campaign restoration, autosave isolation, scan-label hiding without data loss, blackout lighting, night vision, moving sunlight/rain, controller chords and aircraft save round trips.

All four runtime GLBs parse through the shipped Three.js loader with UVs, normals, material names, metric bounds, 19 meshes and four rotor pivots each. Runtime maps are verified PNGs at 1024 × 1024. Source Blender files remain unchanged; the export manifest records the source hash.

Recovery verification: all eleven npm test suites passed again after restoring the interrupted working tree. Cargo delivery now records its best time once, and repeat interaction preserves it; the real interaction adapter is covered. Inspection points and the current non-circuit hover target now have visible amber markers. JavaScript syntax and local static asset references were checked before publishing.

The earlier test browser could not reach the local development server. GPU rendering and visual layout have not been verified in this recovery session. Physical Xbox controller and iOS/Android tests have not been performed; no frame-rate or hardware compatibility certification is claimed.
