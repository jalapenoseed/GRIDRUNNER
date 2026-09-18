# v7.39 — Fieldwork & flight

Addresses the September 17 expedition QA and Fleet Commander feedback.

## Where to QA

| Feature | Route | What to try |
|---|---|---|
| Independent effects | Commander → Program → Effects & variance; expedition F9 → Independent effects & variance | Load Orbit, clear all effects, Apply. Stack Wave and Vortex on separate layers; switch either to None. |
| Script control | Flight script editor | Select a group; use `layer 2 wave 8 0.6`, `layer 3 vortex 5 0.4`, `layer 2 none`, `reset effects`, `pattern none`, or numeric variance/axis/speed commands. |
| Staging | Land all; F9 → Launch parked fleet | Watch the existing aircraft return to reserved ground pads and take off again. Parked bodies remain rendered, including large fleets. |
| Soundtrack | Program → Dance & rhythm → Soundtrack studio | Write `C4:1 R:1 C4+E4+G4:2`, enable audio and resume a running program; or attach an audio file and enter its BPM. |
| Cinematic camera | F8 or System → Cinematic camera | Select the rig, player or whole test fleet; orbit, tracking or overhead. F8 / Exit cinematic returns to the ordinary view. |
| Camo shelter | Equipment → Bike & trailer → Workshop camo shelter | Stop beside the rig, switch off fuel generation, Deploy and resume. The starting shelter begins packed. |
| Tutorial library | Expedition → Tutorial library | Search, read, queue lessons, mark read, read aloud and jump to the relevant control page. |
| Thermal / UV | System → Light & weather → Thermal & UV appearance | Compare Ironbow, Spectrum, White hot and Black hot. Practice fluorescence in the Sensor Lab. |
| Lightning | System → Light & weather → Storm discharge | Preview a local strike and distance-delayed thunder. Reduced motion suppresses the flash. |
| Map density | Ghost Signal map: East Service, West Depot and Drywell Annex | Follow gravel access lanes, walk through the six open-front buildings and inspect props and crews. |

## Fleet behavior

- Movement, show choreography and four influence layers have independent controls. Each field has strength, frequency, phase and mix; motion and shows have separate speed and amount. Field axis mixing applies to the combined fields, bounded to 32 m displacement. Custom layers share the three explicit formulas.
- None removes the selected layer. Clear all effects also resets timing variance, field mixing, trace and beat sync while preserving the formation. It recovers from invalid script/formula edits. Presets begin from a complete baseline, preventing a previous Orbit or field from carrying into an unrelated preset.
- Seeded position, phase and speed variation follows aircraft identity. Scripts can apply or clear layers for selected groups. Corkscrew, Ribbon and Salute join the existing flyby, roll, flip and dance styles.
- The existing 2,000-aircraft controller, optical beacons and same-aircraft HELLO/WORLD transitions remain. Landing uses the ordinary collision/terrain controller and reserved pads. Relaunch queues the existing parked bodies; it does not spawn substitutes.
- Written music loops on the program clock with notes, rests and up to four-note chords. Upload accepts browser-decodable audio up to 32 MB and 15 minutes. It loops at the program position; it does not infer beats or automatically time-stretch the track. Written notes save with a fleet; uploaded files must be reattached after reopening. Pause, count-in, master/music level and mute are honored. Muting cancels pending attachments.

## Expedition and presentation

- Base bike consumption drops from 0.065 to 0.018 charge per world unit, about 72% lower. It charges actual distance traveled, so pushing against a wall does not spend distance-based motor energy. Cargo, terrain, upgrade and difficulty modifiers remain, and the range estimate uses the same rate.
- Three connected service areas add six enterable buildings, interior equipment and readable metal wayfinding signs. Existing settlement facades are open-front shells with separate walls and roof collision. Substantial settlement props register collision; authored approaches are reserved from procedural scenery. Existing sectors and story gates remain.
- Twenty-four additional crew NPCs join existing residents. Their schedules use the existing navigation/animation system. The rider cannot sweep through nearby NPC bodies. The bike and trailer gain brake, suspension, cable, frame, strap and equipment detail; people gain layered clothing, headwear and face/hand/boot detail. PBR textures are shared and static parts batched. This is an improvement to the current asset set, not a photoreal character replacement.
- Thermal maps authored relative heat through selectable palettes, keeps texture/surface detail and normal occlusion, and restores visible materials afterward. UV highlights authored fluorescent surfaces against dark violet. Neither mode is a calibrated physical spectrum measurement.
- Three live-world opening camera shots replace the flat intro background. Cinematic shots follow the actual rig/player/fleet and clip against solid geometry. Fleet framing accounts for portrait aspect ratio and letterboxing. Simulation, energy and collisions continue during filming.
- Shared audio gains layered rain, tire/gravel and motor detail plus material transients, distance/pan thunder and a gentle recorded-narration radio filter. Existing caption and speech fallback remain; there is no new cast of recorded voices.
- Lightning has a deterministic branching path, nearby conductor target, local point light, bounded strike event history and delayed thunder. Pause and reduced-motion rules apply. Electrical conductivity chains, circuit damage, NPC reactions and storm puzzles are not yet connected to this event data.
- The player guide now covers the fleet studio, cinema, energy, camo and spectra. Twenty searchable, player-requested lessons can be queued without changing story state. Import maps and stylesheet revisions keep changed modules coherent for returning clients.

## Verification and limits

The complete `npm test` regression suite passed; the final weather-audio correction also passed the focused QA and audio gates. `npm test` includes the original story/save/physics/controller gates, 2,000-body simulation and new `npm run test:qa-update` checks. The new checks exercise independent layer addition, selected-group reset, identity-stable variance, music pitch/timing/mute/upload cancellation, all-2,000 portrait and landscape framing, sensor material restoration, lightning pause/thunder, tutorial queue isolation, invalid-script reset, physical landing/relaunch, cinematic exit and service entrance clearance. Commander DOM tests also exercise the effects dialog and clearing malformed edits.

Browser checks use the real Commander tactical fallback and the existing development-only expedition CPU/HUD diagnostic. These cover menus, search, queued reading, effects, 2,000-drone telemetry and landing controls. Actual GPU appearance, frame rate on the player's hardware, physical touch/controllers and subjective audio quality remain device QA. Diagnostics are outside the published `dist` directory.

Further production work: authored human/environment assets and voice performance, richer NPC actions, more terrain and connected regions, dynamic electrical consequences, image-to-formation and audio cue analysis. The existing three-sector campaign is preserved as the basis for that expansion.
