import {GamepadInput} from './gamepad.js';
export class ControllerBridge{
 constructor(api){this.api=api;this.pad=new GamepadInput();this.device='keyboard';this.frame={move:[0,0],look:[0,0],vertical:0,brake:0,assist:0};this.command=0;}
 other(device='keyboard'){this.device=device;}
 poll(dt){
  const a=this.api,settings=a.settings();let pads=[];try{pads=globalThis.navigator?.getGamepads?.()||[];}catch{/* Browser denied access; other input remains available. */}
  const f=this.pad.poll(pads,settings,performance.now()/1000);this.frame=f;
  if(f.joined){a.toast('XBOX / controller connected · A select · B back');a.sound.event('padConnect');}
  if(f.lost&&a.started()&&settings.gamepad!==false){if(a.state().mode==='drone')a.issueDrone('HOLD');a.open('pause');a.toast('Controller lost · flight held · reconnect or use keyboard');this.device='keyboard';return;}
  if(f.changed&&f.active)this.device='gamepad';
  document.body.dataset.input=this.device;
  if(this.device!=='gamepad'||!f.connected)return;
  const overlay=document.querySelector('#overlay'),inMenu=a.paused()||overlay?.dataset.screen==='relayTerminal';
  if(inMenu){this.menu(f);return;}
  for(const action of f.actions){
   if(action==='pause')a.open('pause');else if(action==='cancel')a.action('bike');
   else if(action==='camera')a.changePOV();else if(action==='pedal')a.togglePedal();
   else if(action==='previousCommand'||action==='nextCommand'){this.command=(this.command+(action==='nextCommand'?1:3))%4;a.issueDrone(['FOLLOW','HOLD','DOCK','MANUAL'][this.command]);}
   else a.action(action);
  }
 }
 movement(){return this.device==='gamepad'&&this.frame.connected?this.frame:null;}
 menu(f){const a=this.api,panel=document.querySelector('#panel'),controls=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')].filter(e=>!e.hidden&&e.type!=='file');
  for(const direction of f.menu){let i=controls.indexOf(document.activeElement);const active=controls[i];
   if(['left','right'].includes(direction)&&active?.matches('input[type=range],select')){const sign=direction==='right'?1:-1;if(active.tagName==='SELECT')active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+sign));else active.value=String(Math.max(+active.min,Math.min(+active.max,+active.value+sign*+(active.step||1))));active.dispatchEvent(new Event('change',{bubbles:true}));}
   else{const sign=direction==='down'||direction==='right'?1:-1;i=(i+sign+controls.length)%controls.length;controls[i]?.focus();controls[i]?.scrollIntoView?.({block:'nearest'});}
  }
  for(const action of f.actions){if(action==='interact'){const active=controls.includes(document.activeElement)?document.activeElement:controls[0];active?.click();}else if(action==='cancel'||action==='pause'){if(a.started())a.play();}else if(action==='map'&&a.started())a.open('map');}
 }
}
