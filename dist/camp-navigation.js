// Engine-only module, shared by the navigation worker and real-WASM tests.
let engine;
const loadEngine = () => engine ||= import('./vendor/recast.js').then(async R => {await R.init();return R;});
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

export function campGeometry(camp, solids) {
  const positions=[], indices=[];
  const quad = (a,b,c,d) => {
    const i=positions.length/3;
    positions.push(...a,...b,...c,...d);
    indices.push(i,i+1,i+2,i,i+2,i+3);
  };
  const [left,right,back,front] = camp.bounds;
  // Local coordinates keep Recast's voxel precision stable in all three legs.
  quad([left,0,back],[left,0,front],[right,0,front],[right,0,back]);
  for (const solid of solids) {
    const x=solid.x-camp.x,z=solid.z-camp.z;
    const x0=Math.max(left,x-solid.w),x1=Math.min(right,x+solid.w);
    const z0=Math.max(back,z-solid.d),z1=Math.min(front,z+solid.d);
    const y0=Math.max(0,solid.minY??0),y1=solid.maxY??12;
    if(x0>=x1||z0>=z1||y1<=0||y0>2.4)continue;
    quad([x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]);
    quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]);
    quad([x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0]);
    quad([x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0,y0,z1]);
    quad([x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0]);
    quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]);
  }
  return {positions,indices};
}

export async function buildCampRoutes(camps,solids) {
  const R=await loadEngine(), results=[];
  for (const camp of camps) {
    const {positions,indices}=campGeometry(camp,solids);
    // Recast config height/radius/climb are VOXELS, not metres.
    const build=R.generateSoloNavMesh(positions,indices,{cs:.2,ch:.1,
      walkableHeight:23,walkableRadius:2,walkableClimb:2,
      walkableSlopeAngle:35,minRegionArea:0,mergeRegionArea:0,
      maxSimplificationError:.5,detailSampleDist:6,detailSampleMaxError:1});
    let query;
    try {
      if (!build.success) throw Error(build.error);
      query=new R.NavMeshQuery(build.navMesh);
      const routes=camp.stops.map((a,i)=>{
        const b=camp.stops[(i+1)%camp.stops.length];
        const start={x:a[0],y:0,z:a[1]},end={x:b[0],y:0,z:b[1]};
        const result=query.computePath(start,end,{halfExtents:{x:.6,y:.5,z:.6}});
        // Detour may return success with a partial path. Never walk through a
        // wall to join a projected or unreachable endpoint.
        if(!result.success||result.path.length<2||distance(result.path[0],start)>.35||
          distance(result.path.at(-1),end)>.35||result.path.some(p=>p.y>.3))
          throw Error('Unreachable camp stop '+i);
        return result.path.map(p=>({x:p.x+camp.x,z:p.z+camp.z}));
      });
      results.push({id:camp.id,routes});
    } catch(error) {
      results.push({id:camp.id,routes:[],error:String(error.message||error)});
    } finally {
      query?.destroy();
      build.navMesh?.destroy();
    }
  }
  return results;
}
