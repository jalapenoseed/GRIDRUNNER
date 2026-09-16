# v7.28 — Fleet and sensor access

Investigated the deployed v7.27 source, commit 4349c95f2719fbe408a07c041740c450998dbab5. Thermal rendering, UV/RF readings, ten flight formations and Relay Outpost were still present. The compact menu hid formations and sensor controls behind directory subpages. Applying a formation changed a setting without moving idle aircraft into it.

- Fleet now has visible Commands, Formations and Sensors & optics shortcuts, including when the mobile directory is closed.
- Quick aircraft selectors show payloads. Thermal belongs to Utility, RF to Relay, and UV to Scout/Utility; the sensor page names the selected airframe and explains this mapping.
- Applying a flight formation orders available HOLD/FOLLOW/ORBIT/SCOUT AHEAD aircraft into it and queues ready docked aircraft through the existing staged launcher. Campaign unlocks, tutorial gates, battery/hull limits and launch clearance remain enforced.
- Piloted aircraft, assigned jobs, safety returns, landed/perched aircraft and the separate Relay Outpost operation retain their authority.
- No save schema or external menu dependency changed.

Validation: all 28 npm test stages pass, including the added real-menu sensor clicks and formation order integration checks. Browser module bundling and diff checks pass. Thermal material selection/restoration is covered by existing rendering-adapter tests. GPU appearance, physical touch and physical controller testing were not performed in this repair.

Menu library research is in MENU-LIBRARY-NOTES.md. This release repairs the current interface; it does not claim to install a replacement framework.
