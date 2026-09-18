# v7.40 — Composable Boids

## Controls

- Standalone Commander: Program → Boids, effects & variance → Boids on → Apply.
- In-world test fleet: F9 → Boids, independent effects & variance → Apply changes & resume.
- Campaign Program Bench: Boids section, subject to existing story unlocks.
- Presets: balanced flock, loose swarm, close formation.

Separation repels nearby drones; heading alignment turns toward neighboring headings; cohesion pulls toward their center; obstacle avoidance anticipates nearby collision volumes; attraction adds arrival steering toward the current assignment; velocity matching approaches neighbors' average velocity (or moving-anchor velocity without neighbors).

All six weights can be zeroed individually. Neighbor radius is 8–48 m; personal space is 2–16 m (capped at neighbor radius during steering); added force is 0–16 m/s². Boids contributes bounded motion on top of formation, mission and influence layers. Returning, docked, manual and task aircraft do not attract the social flock. Selected active program aircraft receive the extra layer. Hold/recall and normal flight safeguards retain authority.

None / off produces exactly zero extra force. Reset Boids / off restores only its own defaults. Changes take effect on Apply, consistent with the existing editor. Clear all effects also resets it. Older files migrate to off. Save/import/export preserves all parameters. No session history or cached steering force can stick after reset.

## Scripts

```text
select all
boids on
boidSeparation 1.4
boidAlignment 0.6
boidCohesion 0.35
boidAvoidance 1.5
boidAttraction 0.3
boidMatching 0.5
boidRadius 32
boidDistance 6
boidForce 8
wait 15
reset boids
repeat 30
```

`boids none` disables without replacing weights. `reset boids` disables and restores weights. Group selection and timed cues are supported; `reset effects` and `reset all` clear Boids too.

## Verification and limits

Behavior tests cover each force direction, exact overlaps, radius/force bounds, off/zero neutrality, selected timed scripts, validation, save roundtrips and old-save migration. 100-body tests exercise real flight and full recall; manual input, emergency landing and reserve return bypass Boids. A 2,000-body CPU stress test checks finite bounded motion. Actual DOM tests cover standalone, F9 and campaign controls including reset isolation.

Existing Commander, in-world Commander, flight and swarm-program regression gates also pass. Browser-style integration tests stub WebGL; these are not visual/GPU tests. At 2,000 drones, Boids adds significant CPU work and device performance still needs user testing. The kernel is game steering, not a real-aircraft controller or a collision-free mathematical solver. No new asset pack or campaign unlock was added.
