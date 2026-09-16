import {POLICY_TARGETS} from './fleet-policy.js';
import {campaignUnlocks,unlockReason} from './campaign-progress.js';

const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderFleetPolicy(s,{enabled=true}={}){
 const p=s.fleetPolicy,u=campaignUnlocks(s),unlocked=u.reservePolicy,target=Math.round(s.trailer/40*100);
 return `<section class="fleetTask" aria-label="Autonomous reserve policy"><div class="sectionHeading"><span>FLEET / POWER POLICY</span><b>${unlocked?(p.enabled?'ARMED':'MANUAL'):'QUEST LOCKED'}</b></div><h3>Maintain trailer reserve</h3><p>After one proven manual delivery, Utility can load the lowest-charge stored pack, harvest from a safe live conductor, deliver it, and repeat until the selected trailer target is reached.</p><div class="taskActions">${POLICY_TARGETS.map(n=>`<button data-fleet-policy-target="${n}" class="${p.targetPercent===n?'selected':''}" ${!enabled||!unlocked?'disabled':''}>${n}%</button>`).join('')}<button data-fleet-policy-toggle="${p.enabled?'off':'on'}" ${!enabled||!unlocked?'disabled':''}>${p.enabled?'STOP AFTER CURRENT FLIGHT':'ARM REPEAT POLICY'}</button></div><p role="status">${esc(unlocked?p.status:unlockReason('reservePolicy'))}</p><p class="hint">${p.cycles} delivered cycle${p.cycles===1?'':'s'} recorded. The policy never fabricates packs, teleports energy, runs while paused, or overrides weather, signal, battery, hull, collision, source-depletion or trailer safeguards.</p></section>`;
}
