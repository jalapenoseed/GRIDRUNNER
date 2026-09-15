// First-hour lock: Approach → Yard → Line. Same map, fewer verbs.
export function introState(){
  return {stage:'approach',mounted:false,salvaged:false,scouted:false,talked:false,launched:false};
}
export function migrateIntro(x){
  const d=introState();
  if(!x||typeof x!=='object')return d;
  for(const k of ['mounted','salvaged','scouted','talked','launched'])d[k]=x[k]===true;
  if(['approach','yard','line'].includes(x.stage))d.stage=x.stage;
  if(d.talked)d.stage='line';
  else if(d.mounted)d.stage='yard';
  else d.stage='approach';
  return d;
}
export function introQuiet(s){return !!(s&&s.intro&&s.intro.stage!=='line');}
export function introAllows(s,verb){
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
  if(i[flag]===true)return i;
  i[flag]=true;
  if(i.talked)i.stage='line';
  else if(i.mounted)i.stage='yard';
  else i.stage='approach';
  return i;
}
export function introObjective(s){
  const i=s.intro||introState();
  if(i.stage==='line')return null;
  if(!i.mounted)return 'Walk to the motorcycle ahead. F mounts it.';
  if(!i.salvaged)return 'Ride to the marked crate. E salvages wire and cells.';
  if(!i.scouted)return i.launched?'Look around, then Q to recall the scout.':'Q launches the scout on the trailer. Climb, look, then Q to dock.';
  if(!i.talked)return 'Ride to Mara at the camp east of the crate. E to talk.';
  return null;
}
export function introTitle(s){
  const i=s.intro||introState();
  if(i.stage==='approach')return ['00 / APPROACH','Find the motorcycle.'];
  if(i.stage==='yard')return ['00 / YARD','Salvage. Scout. Talk.'];
  return ['01 / GHOST SIGNAL','Follow the transmission.'];
}
export function applyIntroHUD(s){
  const quiet=introQuiet(s);
  document.body.classList.toggle('intro-quiet',quiet);
  const title=introTitle(s);
  const eye=document.querySelector('#quest .eyebrow');
  const h2=document.querySelector('#quest h2');
  if(eye)eye.textContent=title[0];
  if(h2)h2.textContent=title[1];
  const obj=introObjective(s);
  if(obj){
    const n=document.querySelector('#objective');
    if(n)n.textContent=obj;
  }
  const distEl=document.querySelector('#questDistance');
  if(distEl&&quiet){
    const i=s.intro||introState();
    distEl.textContent=!i.mounted?'MOTORCYCLE \u00b7 WALK':!i.salvaged?'CRATE \u00b7 EAST':!i.scouted?'SCOUT \u00b7 Q':!i.talked?'MARA \u00b7 CAMP':'LINE OPEN';
  }
}
export const INTRO_CRATE=0;
