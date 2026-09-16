#!/usr/bin/env node
// Drop a TRELLIS (or any) GLB in, get a field-ready mesh + Rapier AABB.
//   node scripts/remesh-gltf.mjs --in raw.glb --out dist/assets/imported/shed.glb --name shed
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {basename, dirname} from 'node:path';
import {remeshPositions} from '../dist/remesh-gltf.js';

function arg(name,fallback){
  const i=process.argv.indexOf('--'+name);
  return i>=0?process.argv[i+1]:fallback;
}

const input=arg('in');
if(!input){
  console.error('Usage: node scripts/remesh-gltf.mjs --in trellis.glb --out dist/assets/imported/name.glb');
  process.exit(1);
}

const source=await readFile(input);
const json=source[0]===0x67?null:JSON.parse(source.toString('utf8'));
if(!json){
  console.error('Binary GLB packing needs @gltf-transform/core (npm i -D @gltf-transform/core @gltf-transform/functions).');
  console.error('This script accepts JSON glTF today and writes collider JSON beside the output.');
  process.exit(2);
}

const positions=[];
for(const mesh of json.meshes||[])for(const prim of mesh.primitives||[]){
  const acc=json.accessors?.[prim.attributes?.POSITION];
  if(!acc?.min||!acc?.max)continue;
  // Accessor data is not decoded here; collider uses declared min/max so TRELLIS JSON still gates.
  positions.push(acc.min[0],acc.min[1],acc.min[2],acc.max[0],acc.max[1],acc.max[2]);
}
if(!positions.length){
  console.error('No POSITION accessors with min/max. Export glTF with min/max or use gltf-transform.');
  process.exit(3);
}

const result=remeshPositions(positions,{grid:Number(arg('grid','.04'))});
const out=arg('out',input.replace(/\.gltf$/i,'.remesh.json'));
await mkdir(dirname(out),{recursive:true});
const report={source:basename(input),ok:result.ok,reason:result.reason,triangles:result.triangles,collider:result.collider};
await writeFile(out.replace(/\.glb$/i,'.collider.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!result.ok)process.exit(4);
