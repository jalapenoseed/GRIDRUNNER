import {createDrone,commandDrone,updateDrone} from './drone-system.js';
import {validateCommanderFleet} from './fleet-commander-core.js';
import {sampleSwarmProgram,initialProgramOrders,advanceSwarmProgram} from './swarm-program.js';
import {swarmSnapshot} from './swarm-steering.js';
import {droneHull,hullIntersectsSegment} from './collision-shapes.js';
import {segmentCandidates} from './spatial-index.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export const rotateFleetPoint=([x,y,z],yaw)=>[x*Math.cos(yaw)+z*Math.sin(yaw),y,-x*Math.sin(yaw)+z*Math.cos(yaw)];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
export class InWorldCommander{
 constructor(){this.clear();}
 clear(){this.drones=[];this.config=null;this.program=null;this.elapsed=0;this.lastStepMs=0;this.fixed=null;this.objective=null;this.owner=null;this.leg=null;this.session=null;}
 peers(){return swarmSnapshot(Object.fromEntries(this.drones.filter(d=>!d.queued).map(d=>['admin-'+d.id,{type:d.type,system:d.system}])));}
 spawn(config,{operator,bike,yaw=0,terrain=()=>0,solids=[],floorZ=-1600,owner=null,leg=1,session=null}){
  const next=validateCommanderFleet(config),count=next.roster.length,width=Math.ceil(Math.sqrt(count)),orders=initialProgramOrders(next.program),drones=[];
  for(const [i,drone]of next.roster.entries()){
   const offset=rotateFleetPoint([(i%width-(width-1)/2)*4,0,12+Math.floor(i/width)*4],yaw);let x=clamp(clamp(operator[0],-530,530)+offset[0],-590,590),z=clamp(clamp(operator[2],floorZ+70,145)+offset[2],floorZ+10,220),y=terrain(x,z)+1.6;const hull=droneHull(drone.type);
   const boxes=segmentCandidates(solids,[x,0,z],[x,190,z],Math.max(...hull));for(const box of boxes)if(box.drone!==false&&Math.abs(x-box.x)<=box.w+hull[0]+.5&&Math.abs(z-box.z)<=box.d+hull[2]+.5)y=Math.max(y,(box.maxY??12)+hull[1]+1);
   if(y>180||boxes.some(box=>box.drone!==false&&hullIntersectsSegment([x,y,z],[x,y,z],box,hull)))throw Error('No clear test launch position here. Move into the open and try again.');
   const home=[x,y,z];drones.push({...drone,home,system:createDrone(home),battery:100,queued:orders[drone.id]!=='standby',launchAt:i*.055,order:orders[drone.id]||'formation',target:[...home],attitude:{pitch:0,roll:0}});
  }
  this.config=next;this.program=next.program;this.program.enabled=true;this.program.running=true;this.program.activeIds=[...next.program.ids];this.drones=drones;this.elapsed=0;this.fixed=[...operator];this.heading=yaw;this.owner=owner;this.leg=leg;this.session=session;this.objective=add(operator,rotateFleetPoint(next.objective,yaw));
 }
 apply(config){if(!this.config)throw Error('Spawn a test fleet first.');const next=validateCommanderFleet(config);if(next.roster.length!==this.drones.length||next.roster.some((d,i)=>d.id!==this.drones[i].id))throw Error('Use Spawn / replace to change the test fleet roster.');this.config=next;this.program=next.program;this.program.enabled=true;this.program.running=true;const orders=initialProgramOrders(this.program);for(const [i,d]of this.drones.entries()){Object.assign(d,next.roster[i]);if(this.program.ids.includes(d.id)){d.order=orders[d.id];if(d.order==='standby')this.recall([d.id]);}else if(d.order==='formation')d.order='hold';}this.program.activeIds=this.drones.filter(d=>this.program.ids.includes(d.id)&&d.system.mode!=='RETURN HOME'&&(d.queued||d.system.mode!=='DOCK')).map(d=>d.id);}
 recall(ids=this.drones.map(d=>d.id)){for(const d of this.drones)if(ids.includes(d.id)){d.queued=false;if(d.system.mode!=='DOCK'){d.system.mode='RETURN HOME';d.system.returnPlan=null;d.system.reason='Admin recall';}}if(this.program){this.program.activeIds=this.program.activeIds.filter(id=>!ids.includes(id));if(!this.program.activeIds.length)this.program.running=false;}}
 assign(order,ids=this.drones.map(d=>d.id)){if(!['formation','operator','bike','scout','relay','hold'].includes(order))throw Error('Unknown assignment.');for(const d of this.drones)if(ids.includes(d.id)&&d.system.mode!=='RETURN HOME'){d.order=order;if(order==='hold')d.target=[...d.system.pos];} }
 step(dt,{operator,bike,yaw=0,terrain=()=>0,solids=[],floorZ=-1600,reducedMotion=false,storm=false,jammed=false,wind=0,peers=[],relayNodes=[]}){
  if(!this.program)return;const started=performance.now();this.elapsed+=dt;
  for(const cue of advanceSwarmProgram(this.program,dt))for(const d of this.drones)if(cue.ids.includes(d.id)&&this.program.activeIds.includes(d.id)){if(cue.assignment==='standby')this.recall([d.id]);else d.order=cue.assignment;}
  for(const d of this.drones)if(d.queued&&this.elapsed>=d.launchAt){d.queued=false;commandDrone(d.system,'FOLLOW',d.home,d.battery,solids,{type:d.type});}
  const neighbors=[...peers,...this.peers()],groups={};for(const d of this.drones){if(!groups[d.order])groups[d.order]=[];groups[d.order].push(d);}
  for(const d of this.drones){
   d.attitude={pitch:0,roll:0};if(d.queued||d.system.mode==='DOCK')continue;let target=[...d.target];
   const sample=this.program.ids.includes(d.id)?sampleSwarmProgram(this.program,d.id,{reducedMotion:reducedMotion||this.config.options.reducedMotion}):null,group=groups[d.order],i=group.indexOf(d),n=group.length,a=i/n*Math.PI*2,heading=this.heading;
   if(d.order==='formation'&&sample){const origin=sample.opts.origin==='operator'?operator:sample.opts.origin==='bike'?bike:sample.opts.origin==='objective'?this.objective:this.fixed;target=add(origin,rotateFleetPoint(sample.target,heading));d.attitude=sample.attitude;}
   else if(d.order==='operator'||d.order==='bike'){const center=d.order==='bike'?bike:operator,radius=16+Math.floor(i/16)*4;target=[center[0]+Math.cos(a+this.program.time*.12)*radius,center[1]+14+i%4*4,center[2]+Math.sin(a+this.program.time*.12)*radius];}
   else if(d.order==='scout')target=[this.objective[0]+Math.cos(a)*Math.max(8,Math.sqrt(n)*2),this.objective[1]+i%4*4,this.objective[2]+Math.sin(a)*Math.max(8,Math.sqrt(n)*2)];
   else if(d.order==='relay'){const f=(i+1)/(n+1);target=bike.map((v,j)=>v+(this.objective[j]-v)*f);target[1]=Math.max(target[1],terrain(target[0],target[2])+20+i%3*4);}
   if(d.order!=='formation'&&d.order!=='hold'&&sample&&this.program.activeIds.includes(d.id))target=target.map((v,j)=>v+clamp(sample.field[j],-4,4));
   target[0]=clamp(target[0],-590,590);target[2]=clamp(target[2],floorZ+5,220);target[1]=clamp(Math.max(target[1],terrain(target[0],target[2])+8),8,185);d.target=target;
   const localPeers=neighbors.filter(p=>Math.abs(p.pos[0]-d.system.pos[0])<65&&Math.abs(p.pos[2]-d.system.pos[2])<65);
   const result=updateDrone(d.system,dt,{home:d.home,followHome:operator,formationOffset:target.map((v,j)=>v-operator[j]),yaw,terrain,solids,floorZ,battery:this.config.options.unlimited?100:d.battery,type:d.type,swarmPeers:localPeers,swarmId:'admin-'+d.id,relayNodes,storm,jammed,wind,elapsed:this.elapsed,idleMotion:false,formationSpeed:sample?.opts.show==='flyby'?16:Infinity});
   d.battery=this.config.options.unlimited?100:result.battery;if(['RETURN HOME','LANDED','DOCK'].includes(d.system.mode)){d.attitude={pitch:0,roll:0};this.program.activeIds=this.program.activeIds.filter(id=>id!==d.id);}
  }
  this.lastStepMs=performance.now()-started;
 }
 stats(){const flying=this.drones.filter(d=>!d.queued&&d.system.mode!=='DOCK');return {total:this.drones.length,active:flying.length,queued:this.drones.filter(d=>d.queued).length,returning:flying.filter(d=>d.system.mode==='RETURN HOME').length,battery:this.drones.length?Math.round(this.drones.reduce((n,d)=>n+d.battery,0)/this.drones.length):0,cohesion:flying.length?Math.max(0,Math.round(100-flying.reduce((n,d)=>n+distance(d.system.pos,d.target),0)/flying.length*2)):0,stepMs:this.lastStepMs};}
}
