# GRIDRUNNER v7.14 — Preflight and broad phase

- Preloads all opening narration during the story/menu and reuses the warmed audio resources.
- Prepares SCOUT-01 plus the four first-minute Relay House/Mara equipment assets before play.
- Defers compressed drone parsing to an idle slice so menu animation and input stay responsive.
- Compiles newly available shader/material stages while paused instead of waiting for the entire equipment queue.
- Adds a static spatial broad phase for rider movement, camera clipping, drone collision, scanning, return planning and line-of-sight queries.
- Preserves the existing AABB narrow phase and all save/mission behavior; Rapier remains a later opt-in migration.
- Adds equivalence and candidate-reduction coverage for the spatial index.
