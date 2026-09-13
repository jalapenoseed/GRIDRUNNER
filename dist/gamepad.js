// Standard Gamepad API mapping. No DOM, storage, or simulation side effects.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const PAD_ACTIONS={0:'interact',1:'cancel',2:'scan',3:'inventory',4:'camera',5:'drone',8:'map',9:'pause',10:'pedal',11:'pulse',14:'previousCommand',15:'nextCommand'};
export function deadzone(x=0,y=0,zone=.18){const length=Math.hypot(x,y);if(length<=zone)return [0,0];const scale=clamp((length-zone)/(1-zone),0,1)/length;return [x*scale,y*scale];}
export class GamepadInput{
 constructor(){this.index=null;this.id='';this.previous=[];this.signature=[];this.nextRepeat=0;}
 poll(pads=[],settings={},now=0){
  const list=Array.from(pads||[]),old=this.index;
  const pad=list.find(p=>p?.connected!==false&&p?.mapping==='standard'&&p.index===old)||list.find(p=>p?.connected!==false&&p?.mapping==='standard');
  const empty={connected:false,lost:old!==null,joined:false,changed:false,active:false,move:[0,0],look:[0,0],vertical:0,brake:0,assist:0,actions:[],menu:[]};
  if(!pad||settings.gamepad===false){this.index=null;this.id='';this.previous=[];this.signature=[];return empty;}
  this.index=pad.index;this.id=pad.id;
  const b=Array.from({length:17},(_,i)=>{const v=pad.buttons?.[i];return clamp(typeof v==='number'?v:v?.value??(v?.pressed?1:0),0,1);});
  const move=deadzone(pad.axes?.[0],pad.axes?.[1],settings.gamepadDeadzone??.18),look=deadzone(pad.axes?.[2],pad.axes?.[3],settings.gamepadDeadzone??.18);
  const actions=Object.entries(PAD_ACTIONS).filter(([i])=>Number(i)!==8&&b[i]>.5&&!(this.previous[i]>.5)).map(([,action])=>action);
  // View is a modifier while held; a tap still opens the map on release.
  if(b[8]>.5){if(!(this.previous[8]>.5))this.viewChord=false;for(const [button,action,original]of [[2,'scanHUD','scan'],[3,'nightVision','inventory']])if(b[button]>.5&&!(this.previous[button]>.5)){this.viewChord=true;const i=actions.indexOf(original);if(i>=0)actions.splice(i,1);actions.push(action);}}
  else if(this.previous[8]>.5&&!this.viewChord)actions.push('map');
  const sig=[...move,...look,...b],changed=sig.some((v,i)=>Math.abs(v-(this.signature[i]||0))>.035),active=sig.some(v=>Math.abs(v)>.01);
  const menu=[];const direction=b[12]>.5||move[1]<-.55?'up':b[13]>.5||move[1]>.55?'down':b[14]>.5||move[0]<-.55?'left':b[15]>.5||move[0]>.55?'right':'';
  if(direction&&(direction!==this.direction||now>=this.nextRepeat)){menu.push(direction);this.nextRepeat=now+(direction!==this.direction?.38:.16);}this.direction=direction;
  this.previous=b;this.signature=sig;
  return {...empty,connected:true,lost:old!==null&&old!==pad.index,joined:old!==pad.index,changed,active,move,look,vertical:b[12]-b[13],brake:b[6],assist:b[7],actions,menu};
 }
}
