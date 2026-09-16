# v7.23 — Perception and foundations

## Added

- Optional Y / YOLO control. Actual bundled YOLOX-Nano + ONNX Runtime Web CPU/WASM, dedicated Worker, visible rendered-canvas input, confidence boxes, lazy loading, error/timeout states and camera-motion expiry. No upload, webcam or external-screen capture. R remains the authored field scanner.
- Airframe/load-sized collision shells and matching covered-return margins; wall-safe docking, sampled terrain travel, correct terrain rollback, swept rider fallback, bike body and bounded step tolerance.
- Box-authored later-chapter props, channel barriers, guardrails, poles, capacitor/dish and layered canyon-rock proxies; segmented sloped tower beams and car cabin coverage. Roads/paint/shallow slabs remain non-blocking.
- Menu category child memory, stable focus/scroll/accordion restoration, first-use Fleet/Backpack/Workshop/Rig cards, remembered dismissal and replay in Settings.
- Full scope/history/options/build-path document: `dist/GRIDRUNNER-PROJECT-SCOPE.md`.

## Fixed

- Background docked Utility policy evaluation.
- Operator command/manual task interruption suspends automation; failed/cancelled tasks require explicit re-arm.
- Repeated policy-unlock notifications; direct aircraft/outpost unlock checks.
- Non-finite solid bounds rejected before grid indexing.

## Verification and boundaries

`npm test` covers existing campaigns, DOM integration, saves, ownership, energy, flight and real physics/navigation engines. `npm run test:foundations` adds real committed-model/WASM inference, preprocessing/decode/NMS, empty/error/stale boxes, menu memory, invalid geometry, class/load clearance, terrain rollback and obstructed docking checks. Runtime integration adds unselected policy dispatch, recall disarm, locked outposts and later-chapter road/prop checks.

The official upstream dog photo was also processed through the actual model; dog, car and bicycle were detected. No fresh browser/GPU/device or audio playtest is claimed. General COCO detection is not reliable recognition of game-specific electrical equipment; custom training remains planned.

Static hulls remain approximations. Bike suspension/trailer rigid-body constraints, exact imported collision, dynamic/animated geometry and exhaustive world field QA are still future work. Full menu parent/back redesign and comprehensive first-interaction tutorials are next; this release lays their memory and first-use foundations.
