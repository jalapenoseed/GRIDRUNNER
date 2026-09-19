// Campaign airframe jobs. Practice copies live in Flight Yard; these run on the live expedition.
export const AIR_JOBS = {
 inspect: {
  id: 'inspect', type: 'scout', name: 'Dead-zone inspect',
  hint: 'Launch SCOUT-01 and hover at each amber survey node.',
  sites: [[38, 8, -94], [-77, 8, -281], [90, 9, -416]]
 },
 cargo: {
  id: 'cargo', type: 'cargo', name: 'Settlement haul',
  hint: 'CARGO-01 only. Clamp the crate at PICKUP, deliver to Riggs.',
  pickup: [38, 3.2, -94], drop: [-123, 4, -146]
 },
 repair: {
  id: 'repair', type: 'engineer', name: 'Breaker repair',
  hint: 'UTILITY-01. Hold a stable hover over the substation cabinet.',
  target: [155, 6, -733]
 },
 relay: {
  id: 'relay', type: 'relay', name: 'Uplink hold',
  hint: 'RELAY-01. Climb the radio tower and hold station above the mast.',
  target: [0, 28, -1460]
 }
};

export function createAirJobs() {
 return { inspect: false, cargo: false, repair: false, relay: false };
}

export function migrateAirJobs(value) {
 const next = createAirJobs();
 if (value && typeof value === 'object') {
  for (const k of Object.keys(next)) if (value[k] === true) next[k] = true;
 }
 return next;
}

export function createAirSession(id) {
 const job = AIR_JOBS[id];
 if (!job) return null;
 return { id, hold: 0, inspected: 0, carrying: false, complete: false, elapsed: 0 };
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function stepAirSession(session, drone, dt, type) {
 if (!session || session.complete) return '';
 session.elapsed += dt;
 const job = AIR_JOBS[session.id];
 const pos = drone.pos;
 if (session.id === 'inspect') {
  const target = job.sites[session.inspected];
  if (type === job.type && distance(pos, target) < 6 && drone.speed < 3) {
   session.hold += dt;
   if (session.hold >= 2.5) {
    session.inspected++;
    session.hold = 0;
    if (session.inspected === job.sites.length) session.complete = true;
    return session.complete ? 'SURVEY COMPLETE' : 'Inspection recorded';
   }
  } else session.hold = 0;
 } else if (session.id === 'repair' || session.id === 'relay') {
  const right = type === job.type;
  if (right && distance(pos, job.target) < 5 && drone.speed < 2.5) {
   session.hold += dt;
   if (session.hold >= 5) session.complete = true;
  } else session.hold = 0;
 }
 return session.complete ? job.name.toUpperCase() + ' COMPLETE' : '';
}

export function useAirCargo(session, drone, type) {
 if (!session || session.id !== 'cargo' || session.complete) return '';
 if (type !== 'cargo') return 'CARGO-01 is required for the recovery clamp.';
 if (drone.speed > 3) return 'Slow to a hover before operating the clamp.';
 const job = AIR_JOBS.cargo;
 const target = session.carrying ? job.drop : job.pickup;
 if (distance(drone.pos, target) > 6) return session.carrying ? 'Carry the crate to Riggs (Milepost 09).' : 'Approach PICKUP to attach the crate.';
 if (session.carrying) { session.carrying = false; session.complete = true; return 'DELIVERY COMPLETE · Riggs has the crate.'; }
 session.carrying = true;
 return 'LOAD SECURED · fly west to Riggs';
}

export function airProgress(session) {
 if (!session) return '';
 if (session.complete) return 'COMPLETE';
 if (session.id === 'inspect') return 'INSPECTION ' + (session.inspected + 1) + ' / 3 · ' + Math.floor(session.hold / 2.5 * 100) + '%';
 if (session.id === 'cargo') return session.carrying ? 'LOAD SECURED → RIGGS' : 'PICKUP → E / USE';
 return 'STABLE HOVER · ' + Math.min(100, Math.floor(session.hold / 5 * 100)) + '%';
}

export function nearestAirTarget(session, jobsDone = {}) {
 if (session && !session.complete) {
  const job = AIR_JOBS[session.id];
  if (session.id === 'inspect') return job.sites[session.inspected];
  if (session.id === 'cargo') return session.carrying ? job.drop : job.pickup;
  return job.target;
 }
 for (const job of Object.values(AIR_JOBS)) {
  if (jobsDone[job.id]) continue;
  if (job.sites) return job.sites[0];
  if (job.pickup) return job.pickup;
  return job.target;
 }
 return null;
}

export function applyAirReward(state, id) {
 state.airJobs = migrateAirJobs(state.airJobs);
 state.airJobs[id] = true;
 if (id === 'inspect') state.scanned = true;
 if (id === 'cargo') {
  state.inv = state.inv || {};
  state.inv.cutters = (state.inv.cutters || 0) + 1;
 }
 if (id === 'repair') state.interface = true;
 if (id === 'relay') state.relay = true;
 return id === 'inspect' ? 'Survey logged. Map pins updated.'
  : id === 'cargo' ? 'Riggs left a pair of cutters in your pack.'
  : id === 'repair' ? 'Substation coupler restored.'
  : 'Tower uplink holding. Link range improved.';
}
