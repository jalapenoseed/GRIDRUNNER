import {SpatialIndex} from './spatial-index.js';
import {droneHull,validSolid,blocksRider,moveRiderFallback} from './collision-shapes.js';

let engine;
const loadEngine = () => engine ||= import('./vendor/rapier.js').then(async ({default:R}) => {
  await R.init();
  return R;
});
const rotation = {x:0, y:0, z:0, w:1};
const vector = p => ({x:p[0], y:p[1], z:p[2]});

// First Rapier migration: static world + kinematic rider + swept drone hulls.
// Acceleration, terrain grounding, flight forces, damage and saves remain game-owned.
export class GamePhysics extends SpatialIndex {
  constructor(solids) {
    super(solids,64);
    this.status = 'loading';
    this.disposed = false;
    this.ready = this.initialize();
  }
  async initialize() {
    try {
      this.R = await loadEngine();
      if (this.disposed) return false;
      this.world = new this.R.World({x:0,y:0,z:0});
      this.colliders = new Map();
      // Authoring already expands obstacle footprints for the rider. A narrow
      // query body preserves the cabin doors, ramps and old save positions.
      this.rider = this.world.createCollider(this.R.ColliderDesc.cuboid(.12,.82,.12));
      this.bikeRider = this.world.createCollider(this.R.ColliderDesc.cuboid(.38,.65,.85));
      this.controller = this.world.createCharacterController(.015);
      this.controller.setSlideEnabled(true);
      this.droneShape = new this.R.Ball(.4);
      this.rebuild();
      this.status = 'ready';
      return true;
    } catch (error) {
      this.world?.free();
      this.world = null;
      this.status = 'fallback';
      console.warn('Rapier unavailable; using existing collision checks.', error);
      return false;
    }
  }
  rebuild() {
    super.rebuild();
    if (!this.world) return this;
    for (const handle of this.colliders.keys()) this.world.removeCollider(this.world.getCollider(handle), false);
    this.colliders.clear();
    this.rejected = 0;
    for (const b of this.source) {
      const minY = b.minY ?? 0, maxY = b.maxY ?? 12;
      if (!validSolid(b)) { this.rejected++; continue; }
      const c = this.world.createCollider(this.R.ColliderDesc.cuboid(b.w,(maxY-minY)/2,b.d)
        .setTranslation(b.x,(minY+maxY)/2,b.z));
      this.colliders.set(c.handle,b);
    }
    // Static broad phase needs an initial step, and another only after geometry edits.
    this.world.step();
    return this;
  }
  moveRider(position, dx, dz, options={}) {
    if (this.status !== 'ready') return moveRiderFallback(this,position,dx,dz,options);
    this.ensure();
    const body=options.mode==='bike'?this.bikeRider:this.rider;
    body.setTranslation({x:position.x,y:position.y-.55,z:position.z});
    body.setRotation({x:0,y:Math.sin((options.yaw||0)/2),z:0,w:Math.cos((options.yaw||0)/2)});
    this.controller.computeColliderMovement(body,{x:dx,y:0,z:dz},undefined,undefined,
      c => this.colliders.has(c.handle)&&blocksRider(this.colliders.get(c.handle)));
    const movement = this.controller.computedMovement();
    return {x:position.x+movement.x,z:position.z+movement.z,
      hit:Math.hypot(movement.x-dx,movement.z-dz)>.005};
  }
  sweepDrone(from,to,type,payloadKg=0) {
    if (this.status !== 'ready') return null;
    this.ensure();
    const velocity = vector(to.map((v,i)=>v-from[i]));
    if (Math.hypot(velocity.x,velocity.y,velocity.z)<1e-9) return false;
    const shape=type?new this.R.Cuboid(...droneHull(type,payloadKg)):this.droneShape;
    const hit = this.world.castShape(vector(from),rotation,velocity,shape,0,1,true,
      undefined,undefined,this.rider,undefined,c => this.colliders.has(c.handle)&&this.colliders.get(c.handle).drone!==false);
    return !!hit;
  }
  audit() {
    const invalid=this.source.filter(b=>!validSolid(b));
    const categories={};for(const b of this.source){const key=b.kind||'authored';categories[key]=(categories[key]||0)+1;}
    return {...this.stats(),invalid:invalid.length,categories};
  }
  stats() { return {...super.stats(),engine:'Rapier',status:this.status,active:this.colliders?.size||0,rejected:this.rejected||0}; }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.world?.free();
    this.world = null;
    this.status = 'disposed';
  }
}
