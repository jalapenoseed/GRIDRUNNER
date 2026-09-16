# Imported field props

Drop remeshed TRELLIS / CC0 GLBs here.

```
node scripts/remesh-gltf.mjs --in raw.gltf --out dist/assets/imported/shed.glb
```

Then add a row to `IMPORTED_MANIFEST` in `dist/imported-props.js`. Missing files do not block boot.
