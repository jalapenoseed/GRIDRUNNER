import {setFieldAction,updateFieldRig} from './presence-rig.js';

export function buildRoutesInWorker(camps,solids) {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./navigation-worker.js',import.meta.url),{type:'module'});
    const timer=setTimeout(()=>finish(Error('Camp navigation timed out')),45000);
    const finish=(error,routes)=>{clearTimeout(timer);worker.terminate();error?reject(error):resolve(routes);};
    worker.onmessage=({data})=>finish(data.error?Error(data.error):null,data.routes);
    worker.onerror=event=>finish(Error(event.message||'Navigation worker failed'));
    worker.postMessage({camps,solids});
  });
}

// A small schedule above Recast: work, walk, watch the rider/drone, return to work.
// Navigation is baked in a worker once; there are no per-frame WASM messages.
export class AmbientResidents {
  constructor(mara,settlements,solids,{build=buildRoutesInWorker}={}) {
    this.status='loading';
    this.actors=[{id:'mara',actor:mara,leg:1,x:54,z:-94,bounds:[-9,9,-12,8],
      stops:[[0,0],[-3,-2],[2,-5],[3,2]]},
      ...settlements.actors.map(({n,site,actor})=>({id:n.id,actor,leg:site.leg,x:site.x,z:site.z,
        bounds:[-28,28,-18,17],stops:n.stops||[[-8,4],[-8,-2],[-4,8],[10,8]],local:true}))];
    for(const a of this.actors){a.actor.userData.ambient=true;this.resetActor(a);}
    const camps=this.actors.map(({id,x,z,bounds,stops})=>({id,x,z,bounds,stops}));
    this.ready=Promise.resolve().then(()=>build(camps,solids)).then(results=>{
      for(const result of results){const a=this.actors.find(a=>a.id===result.id);a.routes=result.routes;a.error=result.error;}
      this.status=results.some(r=>r.error)?'partial':'ready';
      for(const r of results)if(r.error)console.warn('Camp navigation:',r.id,r.error);
      return results;
    }).catch(error=>{this.status='fallback';console.warn('Residents remain at camp; navigation unavailable.',error);return [];});
  }
  resetActor(a) {
    a.route=0;a.point=1;a.wait=9+this.actors.indexOf(a)*1.7;a.phase=this.actors.indexOf(a)*.7;a.state='WORK';
    a.actor.position.x=a.local?a.stops[0][0]:a.x+a.stops[0][0];
    a.actor.position.z=a.local?a.stops[0][1]:a.z+a.stops[0][1];
    a.actor.position.y=0;
    this.animate(a,0);
  }
  position(id) {
    const a=this.actors.find(a=>a.id===id);
    return a?{x:a.actor.position.x+(a.local?a.x:0),z:a.actor.position.z+(a.local?a.z:0)}:null;
  }
  turn(a,x,z,dt) {
    const p=this.position(a.id),target=Math.atan2(x-p.x,z-p.z);
    a.actor.rotation.y+=Math.atan2(Math.sin(target-a.actor.rotation.y),Math.cos(target-a.actor.rotation.y))*Math.min(1,dt*5);
  }
  animate(a,speed,dt=0) {
    const clip=speed?'walk':a.state==='WATCH'?'watch':'work';
    if(a.actor.userData.rig){
      setFieldAction(a.actor,clip);
      updateFieldRig(a.actor,dt||.016);
      a.actor.position.y=speed?Math.abs(Math.sin(a.phase))*.025:0;
      return;
    }
    const walk=Math.sin(a.phase)*speed;
    for(const [i,leg] of (a.actor.userData.legs||[]).entries())leg.rotation.x=walk*(i?-.42:.42);
    for(const [i,arm] of (a.actor.userData.arms||[]).entries())arm.rotation.x=walk*(i?.32:-.32);
    a.actor.position.y=speed?Math.abs(Math.sin(a.phase))*.025:0;
  }
  update(dt,s,{rider=s.pos,allowMara=true}={}) {
    if(this.lastState!==s){this.lastState=s;for(const a of this.actors)this.resetActor(a);}
    dt=Math.max(0,Math.min(dt,.05));
    for(const a of this.actors) {
      const p=this.position(a.id);
      if(a.leg!==s.leg||Math.hypot(p.x-rider.x,p.z-rider.z)>180||!allowMara&&a.id==='mara'){
        this.animate(a,0,dt);continue;
      }
      const close=Math.hypot(p.x-rider.x,p.z-rider.z)<7;
      const drone=s.mode==='drone'&&Math.hypot(p.x-s.pos.x,p.z-s.pos.z)<12&&s.pos.y<9;
      if(close||drone){a.state='WATCH';this.turn(a,close?rider.x:s.pos.x,close?rider.z:s.pos.z,dt);this.animate(a,0,dt);continue;}
      if(!a.routes?.length||a.wait>0){a.state='WORK';a.wait=Math.max(0,a.wait-dt);this.animate(a,0,dt);continue;}
      const path=a.routes[a.route],target=path[a.point],dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
      const step=Math.min(d,dt*.85);
      a.state='WALK';a.actor.position.x+=dx/(d||1)*step;a.actor.position.z+=dz/(d||1)*step;
      this.turn(a,target.x,target.z,dt);a.phase+=step*7;this.animate(a,1,dt);
      if(d<=step+.001){
        a.point++;
        if(a.point>=path.length){a.route=(a.route+1)%a.routes.length;a.point=1;a.wait=12+a.route*4;a.state='WORK';this.animate(a,0,dt);}
      }
    }
  }
  stats(){return {engine:'Recast',status:this.status,active:this.actors.filter(a=>a.routes?.length).length,total:this.actors.length};}
}
