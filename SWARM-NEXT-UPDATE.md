# Next swarm update — player programming

User notes, 17 September 2026. Follow-up to the playable starter cluster and field cover.

## Player-authored behavior

- Allow direct numeric inputs and a readable script editor with runnable examples.
- Programs should select individual aircraft or groups and schedule assignments, formation changes, origins, objectives, patterns and teammate relationships.
- Include Run, Pause, Step, Reset, Save preset, Import and Export. Show errors beside the relevant input or script line.
- Keep the campaign fleet, per-aircraft batteries, collisions and return reserves authoritative. Preview programs in the formation lab before applying them to a live group.
- Use a bounded interpreter or expression parser, not unrestricted JavaScript evaluation. Limit instructions, execution time, output magnitudes and non-finite values.

## Mathematical influence layer

Compose assignment → formation → influence field → choreography. An influence changes a target or velocity field without discarding the underlying mission or formation.

- Vector fields: attraction, repulsion, curl/vortex, waves and moving flow lines.
- Parametric curves: Lissajous paths, spirals, knots and phased oscillations.
- Riemann-inspired experiments: offer clearly named complex-plane mappings or sampled surfaces, with a visual explanation of the actual formula and its parameters. Do not label arbitrary noise as a Riemann formula.
- Useful controls: strength, phase, scale, frequency, time, coordinate origin, blend weight and affected aircraft.
- Curveballs: interference between two moving attractors; a traveling wave through a formation; a braid that opens to pass around an obstacle and reforms.
- Preview vector arrows, trajectory traces and the combined target. Make it clear when collision avoidance or a reserve return overrides the program.

## Show-off choreography

- A buzzing flyby with rolls, flips and synchronized dance beats.
- Separate translational paths from airframe attitude choreography; preserve altitude and lateral clearance around the rider and bike.
- A timeline or cue list with count-in, repeat, phase offsets and an immediate Return command.
- Respect reduced-motion settings. Choreography remains a game mechanic, not real-aircraft flight guidance.

## Words and drawings

- Type a word and distribute the selected drones along its letter strokes.
- Draw a path or silhouette on the operations map; resample it into evenly spaced formation slots.
- Let the player move, rotate, scale and raise the result, then morph from one saved shape to another.
- Support multiple strokes, limited fleet size and a clear preview of which letters or details six drones can represent. Offer animated tracing when there are too few drones to hold the whole word.

Implemented in v7.34: hand inputs, bounded cue scripts and expressions, group orders, origin/formation/pattern controls, fields, choreography, words/drawings, preview controls, and preset/save support. Morphing currently starts from a ring; arbitrary saved-shape-to-saved-shape blending and automatic obstacle-aware braid opening remain follow-ups. The braid preset is a periodic field layered beneath normal collision avoidance. See CHANGELOG-v7.34.md.
