# v7.30 — Contact shadows

Investigated N8AO 2.0.1 against the v7.29 composer. The package is Three r169 / WebGL2 compatible, CC0, and the right *algorithm* for crevice darkening. It is **not** installed.

Reasons the npm pass stays out of `dist/`:

- `N8AOPass` replaces `RenderPass` and expects `three/examples/jsm/postprocessing`, which this static r169 bundle does not ship.
- Hardware MSAA (desktop renderer `antialias`) does not survive an AO pass; N8AO then wants SMAA as a second library.
- Open issue #54: the stock fog compositor uses world-space camera distance, so AO vanishes a few hundred metres from the origin. GRIDRUNNER's FogExp2 basin is kilometres long.
- 2.0's neural denoiser is a desktop demo option, not a field-kit budget.

Instead, HIGH/ULTRA now run a half-res 8-sample view-space contact AO inside `PresenceComposer`, blurred and multiplied before bloom. Fog fade uses view-space Z so the opening camp keeps contact and the north basin does not speckle. Thermal, NV, LOW and MEDIUM still skip the composer.

Validation: `npm run test:presence` plus the full `npm test` chain. GPU appearance of contact under Mara/crates/bike was not device-tested in this pass.
