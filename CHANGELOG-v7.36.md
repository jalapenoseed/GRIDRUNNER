# GRIDRUNNER v7.36 — In-world Fleet Commander

Start or continue an expedition, then open **Menu → System → Settings → Reset & hints → Advanced / admin tools → In-game fleet test / up to 100**. **F9** opens the same controls directly. Choose 1–100 aircraft and **Spawn / replace & resume**. Once active, the small **ADMIN FLEET** button also reopens the panel. This entry stays outside the normal Fleet directory.

## Live game testing

- Test aircraft fly in the current expedition's actual scene, through the regular flight controller. Terrain, solid obstacles, radio loss, reserve returns, hull damage and avoidance remain active. You can walk, ride or view them from a regular campaign drone.
- Launch is staggered across individual deployment positions. Player, bike, fixed-origin and objective anchors are available, plus a Protect + Scout split and recall to the test deployment positions.
- Existing airframes use instanced meshes with nearby reference-model detail. Eight beacon colors plus white use compact bright cores. Unlimited battery is optional; this does not disable damage or radio limits.
- Test copies are temporary and excluded from campaign snapshots. Remove clears them immediately; loading/new expeditions, chapter changes, death and training-session changes clear them automatically. The normal four Scouts and two Relays remain the campaign fleet.
- The admin panel loads and saves the same named fleet configurations used by the independent Commander. Edit aircraft types, colors and teams in Commander, save the setup, then load it here. Fleets remain device/browser-local, with JSON import/export available in Commander.

## Presets, drawing and beat choreography

Both modes now expose 29 presets: Wedge; Column / trail; Line abreast; Grid; Orbit; Dual orbit; Adaptive scatter; Staggered; High / low; Protective ring; Overwatch; Search grid; Buzz pass; Weave; Expand / contract; Wave dance; Riemann bloom; Lissajous dance; Rising spiral; Opening braid; Twin attractors; Complex square; Barrel-roll wave; Synchronized flips; Beat dance; Sky writing; Draw your own; Guard + scout; and Relay mesh + scouts.

Drawing supports mouse, touch and keyboard, multiple strokes, undo, clear, upright or flat placement, scaling and continuous tracing. The pad, word and script all travel with a saved fleet.

**Dance to a beat** accepts 40–220 BPM, tap tempo, per-aircraft stagger and an optional metronome. **Use beat dance** selects synchronized choreography; **Apply** starts it. Set stagger to zero for synchronized motion. The script commands `beat on`, `beat off` and `bpm 120` can also control the rhythm. The simulation clock owns the choreography and click; pausing freezes both. Music BPM is entered or tapped manually; there is no microphone, uploaded-song analysis or external music service.

The real campaign Relay Outpost and conductor-harvesting jobs remain in their existing menus. Commander guard/relay/search presets describe flight assignments, not new campaign mission rewards, ground outpost jobs or energy harvesting.

## Verification and limits

- `npm run test:admin-fleet`: 100 regular-controller aircraft, obstacle/terrain clearance, moving rider anchors, complete recall, reserve override, edge spawning, all preset targets, old fleet migration, beat math, tap tempo and pause-safe optional audio. Real scene/DOM checks exercise hidden access, instance counts, save isolation, shared fleet persistence, drawing, script rejection, cleanup and F9.
- `npm run test:commander`: standalone simulation, actual UI controls, presets, beat settings saved/restored, drawing, named fleets, party turns and expedition handoff.
- `npm test`: shared campaign, physics, formation, save, sensor, menu and Commander regressions.
- Browser checks cover desktop and narrow-screen controls. Main-game browser inspection uses the development-only CPU/HUD diagnostic; standalone Commander uses its tactical fallback when WebGL is unavailable. Renderer integration tests use a WebGL stub. GPU rendering/performance, physical touch/controller use and audible listening still need device playtesting. No measured GPU frame-rate claim is made.

Show rotations are visual choreography layered over the normal controller, not new acrobatic rigid-body flight. Very tight drawings or extreme influences may be softened by real avoidance and terrain clearance. Increase spacing or altitude for a clearer show.
