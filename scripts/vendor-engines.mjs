import {build} from 'esbuild';
import {mkdir, copyFile, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Committed ES modules keep the existing static-server deployment self-contained.
// Both compatibility packages embed WASM; no CDN, import map or runtime npm needed.
await mkdir('dist/vendor', {recursive:true});
const entries = {
  rapier: "export {default} from '@dimforge/rapier3d-compat';",
  recast: "export {init, NavMeshQuery} from 'recast-navigation'; export {generateSoloNavMesh} from 'recast-navigation/generators';"
};
const manifest = {};
for (const [name, contents] of Object.entries(entries)) {
  const outfile = `dist/vendor/${name}.js`;
  await build({stdin:{contents, resolveDir:process.cwd(), sourcefile:`${name}-entry.js`}, outfile,
    bundle:true, format:'esm', platform:'browser', target:'es2022', minify:true,
    // Recast's Node-only branch is unused in browsers but retained for engine tests.
    external:['node:module'], legalComments:'eof'});
  const bytes = await readFile(outfile);
  manifest[name] = {bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex')};
}
// Rapier's npm tarball omits LICENSE; this copy is from dimforge/rapier/LICENSE.
await copyFile('scripts/licenses/RAPIER-LICENSE', 'dist/vendor/RAPIER-LICENSE');
await copyFile('node_modules/recast-navigation/LICENSE', 'dist/vendor/RECAST-LICENSE');
await writeFile('dist/vendor/manifest.json', JSON.stringify(manifest,null,2)+'\n');
console.log('Vendored Rapier 0.20.0 and Recast 0.43.1', manifest);
