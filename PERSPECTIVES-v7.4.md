# GRIDRUNNER v7.4 — Perspectives

Completes the interrupted experience-state/POV foundation from GRIDRUNNER_NEXT_WORK_HANDOFF. Built from v7.3 commit 86b1bc6. This is Phase 1 of that handoff, not a claim that every later phase is finished.

## Controls

H cycles the current activity's camera profile. The on-screen view badge does the same for touch. H is rebindable under Controls. Settings/Controls lets you select each activity's preference directly.

| Activity | Views |
|---|---|
| Walking | First person, over shoulder, third person |
| Bike | Helmet, handlebar, close chase, wide chase |
| Drone | FPV nose, stabilized recon, chase, inspection overhead |
| Inspection | Close, context |
| Power work | Meter, connection overview |
| Camp | First person, overview |

Inspection is entered through Inventory/Fieldwork, power through Bike/Trailer or active harvesting, camp through NPC conversations. These contextual views surround the existing paused menus; they are not new animated hands-on repair or camp construction mechanics.

## Changes

- Experience state is separate from physical movement mode and selected camera.
- Seventeen data-defined profiles; each of the six activities remembers its own profile in expedition saves.
- `experience.js`: profiles, state resolution, preference migration, camera positions and segment/AABB clipping. No browser dependencies.
- `camera-manager.js`: shared FOV ownership, chase smoothing, obstruction clipping, recon framing and FPV lean.
- Existing bike suspension feeds helmet presentation. Reduced-motion mode disables bike bob/lean and active transition tint immediately.
- View changes snap between distant physical anchors rather than sweeping from pilot to aircraft and revealing the intervening world. A short helmet tint and state sound provide limited transition feedback; full mount/deploy animations remain future work.
- Separate chase distance/height, response speed, lean influence, drone look sensitivity, HUD intensity and visor settings.
- Walking body appears in external views; bike/drone models appear in their external profiles. First-person equipment visibility adapts to the selected view.
- Ground and solid-wall camera clipping. It only covers existing collision volumes; decorative objects and visual-only roofs remain limitations.
- State-colored view badge, visor frame and contextual menu colors.
- Experience-based audio balance reduces remote world ambience in drone view; walking adds procedural surface-dependent footstep taps.
- Fire direction remains derived from player aim, never an arbitrary external-camera position. Third-person near-target aiming/framing needs manual visual validation.
- Save envelope remains compatible with v7 saves. Missing experience fields receive default profiles; invalid profile IDs reject the record. POV preferences travel with manual saves, autosaves and JSON exports. New expeditions reset to default views; general camera settings persist separately on the device.

## Verification

Before editing, all v7.3 suites passed. After recovery and completion, all six suites pass (`npm test`): campaign Legs 1–3, bike/drone flight and commands, economy, NPC trades, audio mock, save migration, every experience/profile, camera wall clipping, repeated view changes, visible body/drone models, preference persistence and immediate reduced-motion cancellation.

Runtime integration uses real Three.js scene objects and DOM with a stubbed renderer. The test browser was previously confirmed to have WebGL disabled. No new GPU, visual camera-comfort, iPhone FPS or audio listening results are claimed.

Run with `npm ci && npm test`. Serve `dist` with `python -m http.server 8080 --directory dist` or use `npm run dev` on a supported local environment. GitHub Pages serves `dist` without bundling.

## Known limitations / next pass

No seated rider animation, first-person repair hands, cinematic camera, motion blur, controller support or independently controlled recon gimbal. Recon keeps the horizon level with a narrower FOV; mouse still controls drone-facing look. Inspection/camp views are contextual presentation, not physical workbench gameplay. Camera distance reduces around walls; near-player geometry and overhead views need real-device visual tuning.

The existing energy, salvage and settlement foundations are preserved. Next: visually tune these camera profiles, then deepen component-based machine interaction and generator state audio. The reference-video contents were not analyzed or copied in this pass; implementation follows the written specification. The supplied NPC sheet remains art direction, not a set of playable rigged models.
