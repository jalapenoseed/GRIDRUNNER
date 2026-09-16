// TRELLIS / generated-mesh intake. Voxel sludge becomes a field prop:
// weld by grid, drop degenerates, emit an AABB collider the Rapier solids list understands.
export const REMESH_DEFAULTS={grid:.04,minTriangles:24,maxTriangles:18000,pad:.04};

export function weldPositions(positions,grid=REMESH_DEFAULTS.grid){
  const map=new Map(),out=[],index=[];
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i],y=positions[i+1],z=positions[i+2];
    const key=`${Math.round(x/grid)}:${Math.round(y/grid)}:${Math.round(z/grid)}`;
    let id=map.get(key);
    if(id==null){id=out.length/3;map.set(key,id);out.push(x,y,z);}
    index.push(id);
  }
  return {positions:out,index};
}

export function dropDegenerate(index){
  const out=[];
  for(let i=0;i<index.length;i+=3){
    const a=index[i],b=index[i+1],c=index[i+2];
    if(a!==b&&b!==c&&c!==a)out.push(a,b,c);
  }
  return out;
}

export function boundsOf(positions,pad=REMESH_DEFAULTS.pad){
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i],y=positions[i+1],z=positions[i+2];
    if(x<minX)minX=x;if(y<minY)minY=y;if(z<minZ)minZ=z;
    if(x>maxX)maxX=x;if(y>maxY)maxY=y;if(z>maxZ)maxZ=z;
  }
  if(!Number.isFinite(minX))return {x:0,z:0,w:.5,d:.5,minY:0,maxY:1,kind:'imported'};
  return {
    x:(minX+maxX)/2,z:(minZ+maxZ)/2,
    w:(maxX-minX)/2+pad,d:(maxZ-minZ)/2+pad,
    minY:minY-pad,maxY:maxY+pad,kind:'imported'
  };
}

export function remeshPositions(positions,options={}){
  const grid=options.grid??REMESH_DEFAULTS.grid;
  const welded=weldPositions(positions,grid);
  const index=dropDegenerate(welded.index);
  const triangles=index.length/3;
  if(triangles<REMESH_DEFAULTS.minTriangles){
    return {ok:false,reason:'too-thin',triangles,positions:welded.positions,index,collider:boundsOf(welded.positions,options.pad)};
  }
  return {
    ok:triangles<=REMESH_DEFAULTS.maxTriangles,
    reason:triangles>REMESH_DEFAULTS.maxTriangles?'still-dense':'ready',
    triangles,positions:welded.positions,index,
    collider:boundsOf(welded.positions,options.pad)
  };
}

export function colliderToSolid(collider,origin={x:0,z:0}){
  return {...collider,x:collider.x+(origin.x||0),z:collider.z+(origin.z||0),kind:collider.kind||'imported'};
}
