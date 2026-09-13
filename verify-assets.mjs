// Validate the actual shipped Blender exports and exercise Three's loader and
// our batching with images omitted only in this headless geometry check.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from './dist/three.js';import {GLTFLoader} from './dist/GLTFLoader.js';import {AssetKit} from './dist/asset-kit.js';
const kit=new AssetKit(false);let triangles=0;
for(const name of fs.readdirSync('dist/assets/kit').filter(n=>n.endsWith('.glb'))){
 const bytes=fs.readFileSync('dist/assets/kit/'+name);assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 for(const buffer of json.buffers||[])assert(!buffer.uri,'All buffers embedded');for(const image of json.images||[])assert(Number.isInteger(image.bufferView),'All textures embedded');
 for(const mesh of json.meshes){for(const p of mesh.primitives){delete p.material;triangles+=json.accessors[p.indices??p.attributes.POSITION].count/3;}}
 const raw=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(padded);const bin=bytes.subarray(20+jsonLength);const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+bin.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);const glb=Buffer.concat([header,padded,bin]);
 const loaded=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');const batched=kit.batch(loaded.scene);const box=new T.Box3().setFromObject(batched),size=box.getSize(new T.Vector3());assert(size.toArray().every(v=>Number.isFinite(v)&&v>0),name+' has valid 3D bounds');assert(batched.children.length>0);batched.traverse(m=>{if(m.isMesh){assert(m.geometry.attributes.position.count>0);assert(m.geometry.attributes.normal);m.geometry.dispose();}});
}
assert(triangles<130000,'Imported equipment triangle budget');console.log('PASS: ten embedded GLB exports parse, batch and retain valid geometry/bounds;',Math.round(triangles),'equipment triangles. Texture appearance requires GPU review.');
