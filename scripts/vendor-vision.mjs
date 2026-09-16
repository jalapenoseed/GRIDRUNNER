import {mkdir,copyFile} from 'node:fs/promises';
const target='dist/vendor/vision';
await mkdir(target,{recursive:true});
for(const file of ['ort.wasm.min.mjs','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])
 await copyFile('node_modules/onnxruntime-web/dist/'+file,target+'/'+file);
// The npm tarball omits the license; the pinned upstream license is committed
// alongside the runtime, together with the official YOLOX license and model.
console.log('Vendored matching ONNX Runtime Web CPU assets.');
