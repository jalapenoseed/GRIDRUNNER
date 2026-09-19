# v7.27 — Compact Field Directory

Menus previously combined two navigation strips and long stacked pages. This release uses one expandable directory and one working subpage at a time.

- Expedition, Equipment, Fleet, World, System branches; keyboard arrow navigation and native button activation.
- Smaller left-aligned desktop surface, compact actions and home screen, responsive Directory toggle.
- Fleet subpages for commands, formations, jobs, packs, reserve automation, airframe details and sensor buttons. Quick aircraft selection, Launch All and Return All remain at the top.
- Settings/controls and bike/trailer subpages, remembered selection/focus/scroll, clear Back behavior.
- First-use guides fold away; original icon atlas and brand assets reused.
- Existing gameplay actions, save formats, quest gates, UV/RF/thermal, fleet rules and isolated practice behavior retained.

Validation: full 28-stage npm test; browser module bundle; desktop and 390×844 menu browser inspection through the CPU diagnostic renderer. WebGL unavailable in cloud QA; on-world appearance, physical device/controller use and audio listening remain manual acceptance.

Workflow: inspect → baseline → focused failing checks → implement → integrated checks → review → handoff → publish. No ECC installation or independent-agent review claimed.
