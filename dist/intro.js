// First-hour lock: Approach → Yard → Line. Same map, fewer verbs.
import {liveDemo,applyDemoShell} from './demo-boot.js';
if (typeof document !== 'undefined' && liveDemo()) applyDemoShell();
export function introState(){
  return {stage:'approach',trailerBriefed:false,scoutBriefed:false,mounted:false,salvaged:false,scouted:false,talked:false,launched:false};
}
export function completedIntro(){
  return {stage:'line',trailerBriefed:true,scoutBriefed:true,mounted:true,salvaged:true,scouted:true,talked:true,launched:true};
}
export function migrateIntro(x){
  // Missing intro data belongs to an expedition created before Quiet Start.
  if(!x||typeof x!=='object'||Array.isArray(x))return completedIntro();
  if(x.stage==='line'||x.talked===true)return completedIntro();
  const d=introState();
  for(const k of ['mounted','salvaged','scouted','talked','launched','trailerBriefed','scoutBriefed'])d[k]=x[k]===true;
  if(d.scouted)d.launched=true;
  if(d.launched)d.salvaged=true;
  if(d.salvaged||x.stage==='yard')d.mounted=true;
  d.stage=d.mounted?'yard':'approach';
  return d;
}
export function introQuiet(s){return !!(s&&!(s.leg>1)&&s.intro&&s.intro.stage!=='line');}
export function introAllows(s,verb){
  if(!introQuiet(s))return true;
  const i=s.intro||introState();
  if(i.stage==='line')return true;
  if(verb==='bike')return true;
  if(verb==='crate')return i.mounted;
  if(verb==='drone')return i.salvaged;
  if(verb==='talk')return i.scouted;
  if(verb==='fire')return false;
  if(verb==='menu')return i.mounted;
  return i.stage==='line';
}
export function markIntro(s,flag){
  const i=s.intro=migrateIntro(s.intro);
  if(!['mounted','salvaged','scouted','talked','launched','trailerBriefed','scoutBriefed'].includes(flag))return i;
  if(i[flag]===true)return i;
  i[flag]=true;
  if(i.talked)i.stage='line';
  else if(i.mounted)i.stage='yard';
  else i.stage='approach';
  return i;
}
export function introObjective(s,controls={mount:'F',use:'E',drone:'Q',lift:'SPACE / SHIFT'}){
  if(!introQuiet(s))return null;
  const i=s.intro||introState();
  if(i.stage==='line')return null;
  if(!i.mounted)return `Walk to the motorcycle ahead. ${controls.mount} mounts it.`;
  if(!i.salvaged)return `Ride northeast to the crate beside Mara’s camp. ${controls.use} salvages wire and cells.`;
  if(!i.scouted){
    if(s.droneSystem?.mode==='RETURN HOME')return 'Scout returning. Keep the bike stopped until it docks.';
    if(s.droneSystem?.mode==='LANDED')return `Scout landed. Park the bike nearby and use ${controls.drone} to recover it.`;
    return i.launched?`${controls.lift} changes altitude. Look around, then ${controls.drone} recalls the scout.`:`${controls.drone} launches the scout. Climb, look, then recall it.`;
  }
  if(!i.talked)return `Ride to Mara at the camp east of the crate. ${controls.use} to talk.`;
  return null;
}
export function introTitle(s){
  const i=s.intro||introState();
  if(i.stage==='approach')return ['00 / APPROACH','Find the motorcycle.'];
  if(i.stage==='yard')return ['00 / YARD','Salvage. Scout. Talk.'];
  return ['01 / GHOST SIGNAL','Follow the transmission.'];
}
export function applyIntroHUD(s,controls,positions){
  const quiet=introQuiet(s);
  document.body.classList.toggle('intro-quiet',quiet);
  if(!quiet)return;
  const title=introTitle(s);
  const eye=document.querySelector('#quest .eyebrow');
  const h2=document.querySelector('#quest h2');
  if(eye)eye.textContent=title[0];
  if(h2)h2.textContent=title[1];
  const obj=introObjective(s,controls);
  if(obj){
    const n=document.querySelector('#objective');
    if(n)n.textContent=obj;
  }
  const distEl=document.querySelector('#questDistance');
  if(distEl&&quiet){
    const i=s.intro||introState();
    const target=!i.mounted?'bike':!i.salvaged?'crate':i.scouted?'mara':null;
    const label={bike:'MOTORCYCLE',crate:'CRATE',mara:'MARA'}[target];
    const p=positions?.[target];
    if(p){
      const dx=p.x-s.pos.x,dz=p.z-s.pos.z;
      const angle=Math.atan2(Math.sin(Math.atan2(-dx,-dz)-s.yaw),Math.cos(Math.atan2(-dx,-dz)-s.yaw));
      const direction=Math.abs(angle)<.35?'AHEAD':Math.abs(angle)>2.4?'BEHIND':angle<0?'RIGHT':'LEFT';
      distEl.textContent=`${label} · ${Math.round(Math.hypot(dx,dz))} M · ${direction}`;
    }else distEl.textContent=`SCOUT · ${s.droneSystem?.mode||'READY'}`;
  }
}
export const INTRO_CRATE=0;
