import {validSolid} from './collision-shapes.js'; // Broad-phase index for GRIDRUNNER's static AABB collision volumes. The
// narrow phase stays unchanged; this only avoids testing distant structures.
export class SpatialIndex{
 constructor(source=[],cellSize=64){this.source=source;this.cellSize=cellSize;this.cells=new Map();this.count=-1;this.rebuild();}
 key(x,z){return x+','+z;}
 rebuild(){this.cells.clear();for(const body of this.source){if(!validSolid(body))continue;const x0=Math.floor((body.x-body.w)/this.cellSize),x1=Math.floor((body.x+body.w)/this.cellSize),z0=Math.floor((body.z-body.d)/this.cellSize),z1=Math.floor((body.z+body.d)/this.cellSize);for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const key=this.key(x,z),bucket=this.cells.get(key);if(bucket)bucket.push(body);else this.cells.set(key,[body]);}}this.count=this.source.length;return this;}
 ensure(){if(this.count!==this.source.length)this.rebuild();}
 all(){this.ensure();return this.source;}
 queryAABB(minX,minZ,maxX,maxZ){if(![minX,minZ,maxX,maxZ].every(Number.isFinite)||maxX-minX>20000||maxZ-minZ>20000)return [];this.ensure();const found=new Set(),x0=Math.floor(minX/this.cellSize),x1=Math.floor(maxX/this.cellSize),z0=Math.floor(minZ/this.cellSize),z1=Math.floor(maxZ/this.cellSize);for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(const body of this.cells.get(this.key(x,z))||[])found.add(body);return [...found];}
 queryPoint(x,z,pad=0){return this.queryAABB(x-pad,z-pad,x+pad,z+pad);}
 querySegment(a,b,pad=0){return this.queryAABB(Math.min(a[0],b[0])-pad,Math.min(a[2],b[2])-pad,Math.max(a[0],b[0])+pad,Math.max(a[2],b[2])+pad);}
 stats(){this.ensure();return {bodies:this.count,cells:this.cells.size};}
}

export const solidList=solids=>typeof solids?.all==='function'?solids.all():solids||[];
export const segmentCandidates=(solids,a,b,pad=0)=>typeof solids?.querySegment==='function'?solids.querySegment(a,b,pad):solidList(solids);
