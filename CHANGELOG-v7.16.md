# GRIDRUNNER v7.16 — Physical world and fleet control

- Expands the Rapier static world from hand-picked buildings to generated rocks, oak trunks, salvage crates, transmission structures, turbines, solar arrays, waterworks hardware and later-leg facilities.
- Rejects bike and foot movement up terrain grades beyond their traversal limits instead of snapping through steep ground.
- Adds collider validation, category counts and an `F8` in-world wireframe collision QA view. The browser check reports 1,207 active Rapier shapes and zero rejected volumes.
- Adds Wedge, Trail, Line and Orbit fleet formations with persistent save migration and separated autonomous target slots.
- Adds squad-wide Follow, Hold, Scout Ahead, Orbit and Return commands while preserving single-aircraft FPV control.
- Adds keyboard fleet controls: `Shift+1–4` selects an airframe, `Shift+5` selects all, and `7–0` selects a formation. Existing `1–6` drone commands remain intact.
- Adds deterministic fleet-spacing, formation hotkey, save-migration, generated-collider and live WebGL/Rapier/Recast regression coverage.
