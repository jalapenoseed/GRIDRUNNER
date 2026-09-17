# v7.33 — Swarm field operations

Open **Swarm Command → Play Swarm Start** for an immediate expedition with four Scouts, two Relays and the camouflage cloth deployed. In an existing expedition, open the **SWARM** field button and choose **Protect + Scout**, then **Resume Field Run**.

- Six starter aircraft with independent identity, battery, hull, sensor selection, FPV control and saved orders. Existing Scout, Relay, Cargo and Utility identities stay valid; old saves receive the four missing starter instances.
- Protect + Scout assigns Scout 01 to the operator, Scout 02 to the bike, Scouts 03–04 to survey, and both Relays to airborne communications positions. Individual assignments can be changed without overwriting teammates. FPV and existing expedition jobs keep authority.
- Live aircraft use the established flight controller, collision checks, obstacle avoidance, staged launch and reserve returns. Shared drone assets are cloned per instance; extra airframes reuse class geometry, materials and textures.
- Formation controls include spacing, origin, pattern and an objective map with pointer and keyboard input. Guards remain anchored to the physical rider/bike while the player pilots another drone. Scout contacts enter the normal map and journal.
- Nearby guards provide hostile-contact warnings and a bounded reduction in incoming damage. This is an abstract defensive game mechanic; there is no autonomous drone weapon system.
- A visible patched cloth covers the parked rig. While the rider and bike stay within four metres it reduces visual detection range by 60%. Walking away removes its benefit; moving the rig, starting fuel generation or firing packs/breaks the cover. It does not block projectiles or nearby observers.
- The opening story now describes a cluster assembled before the expedition. The first salvage box contains spare parts. Changed narration passages use speech synthesis/captions so the old acquisition recording does not contradict the story.
- Cargo, Utility, landed Relay Outpost, line harvesting and reserve automation retain their progression gates.
- The original optional **2D Formation Lab** remains available. Its default fleet now matches the six-drone kit; preferences are validated and paused/closed labs release animation resources.

## Verification

- Full `npm test` passed, including the new live-swarm integration suite.
- The integration suite exercises six physical launches, split assignments, independent batteries/IDs, airborne relay links, FPV body anchoring, old/new save restoration, pending-order cancellation, low-charge return, concealment and recall.
- Desktop and 390 px mobile command controls were exercised in the browser's CPU/HUD diagnostic: launch entry, assignment selectors, camouflage toggle, navigation and formation lab.
- The cloud browser reports WebGL unavailable. GPU appearance and device frame rate remain hands-on playtest items; browser checks did not render the 3D world.

Player scripting, mathematical influence layers, choreography, words and drawn formations are captured separately in **SWARM-NEXT-UPDATE.md** and are not part of this release.
