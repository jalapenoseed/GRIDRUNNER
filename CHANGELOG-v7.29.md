# v7.29 — Presence (look, bones, foliage, spatial audio, TRELLIS intake)

Wave 1 of the graphical/interactive upgrade, on Three r169 + Rapier + Recast. Fleet, sensors, menus and saves are unchanged.

- **Look:** HIGH/ULTRA get a local bloom + FXAA + vignette composer. LOW/MEDIUM, thermal and night vision keep the existing single `renderer.render`. No extra npm runtime; WebGLRenderTarget only.
- **Bones:** Mara, camp residents, hostiles and the chase-view walking body share an 8-bone Mixamo-named skeleton. Recast still drives feet. AnimationMixer plays walk / idle / work / watch. The dummy sin-pivot path remains as fallback.
- **Foliage:** Roadside and grove oak crowns are instanced icosahedron volumes with wind, not billboard cards. Trunks and grass cards stay. LOW still hides oak batches.
- **Audio:** Camp generator, tower carrier, workshop and Mara's shelter become HRTF panners when the AudioContext supports them. Procedural motors/rotors/score are untouched. Howler remains the recorded-file path when VO lands.
- **TRELLIS / imported buildings:** `node scripts/remesh-gltf.mjs --in raw.gltf --out dist/assets/imported/name.glb` welds voxel sludge, writes a Rapier AABB, and `ImportedProps` will load a remeshed GLB from `dist/assets/imported/` without blocking boot if the file is missing.

Validation: `npm run test:presence` plus the full `npm test` chain. GPU appearance of bloom and volume crowns was not device-tested in this pass.
