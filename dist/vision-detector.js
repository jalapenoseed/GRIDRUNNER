import {YOLO_SIZE,letterbox} from './yolo-core.js';
// YOLO reads only this game's rendered canvas. No camera, screen-share or upload.
export class VisionDetector{
 constructor({document:doc=globalThis.document,workerFactory=()=>new Worker(new URL('./yolo-worker.js',import.meta.url),{type:'module'})}={}){
  this.doc=doc;this.workerFactory=workerFactory;this.enabled=false;this.state='off';this.status='YOLO OFF';this.serial=0;this.nextAt=0;this.busy=false;
  this.canvas=doc.createElement('canvas');this.canvas.width=this.canvas.height=YOLO_SIZE;
  this.layer=doc.createElement('div');this.layer.id='visionDetections';this.layer.setAttribute('aria-hidden','true');doc.body.append(this.layer);
  this.readout=doc.createElement('div');this.readout.id='visionReadout';this.readout.hidden=true;this.readout.setAttribute('role','status');doc.body.append(this.readout);
 }
 toggle(){this.enabled=!this.enabled;this.layer.replaceChildren();this.readout.hidden=!this.enabled;
  if(!this.enabled){this.stop();return false;}
  this.state='loading';this.status='YOLO / LOADING LOCAL MODEL';this.readout.textContent=this.status;
  try{this.worker=this.workerFactory();this.worker.onmessage=e=>this.message(e.data);this.worker.onerror=()=>this.fail('Vision worker unavailable');this.worker.postMessage({kind:'init'});this.watchdog=setTimeout(()=>this.fail('Model loading timed out'),45000);}catch{this.fail('Vision is unsupported on this browser');}return true;
 }
 stop(){clearTimeout(this.watchdog);this.worker?.terminate();this.worker=null;this.busy=false;this.state='off';this.status='YOLO OFF';this.layer.replaceChildren();}
 fail(message){this.stop();this.state='error';this.status='YOLO UNAVAILABLE / toggle off and on to retry';this.readout.textContent=this.status;console.warn('YOLO:',message);}
 message(data){if(!this.enabled)return;if(data.kind==='error'){this.fail(data.message);return;}
  if(data.kind==='ready'){clearTimeout(this.watchdog);this.state='ready';this.status='YOLO / READY';return;}
  if(data.kind!=='result'||data.id!==this.pending?.id)return;
  this.busy=false;clearTimeout(this.watchdog);this.nextAt=performance.now()+Math.max(500,data.ms*1.5);
  this.result={...data,...this.pending,at:performance.now()};this.status=`YOLOX NANO / ${data.boxes.length} DETECTIONS · ${data.ms} MS`;
 }
 update(source,now,{active=true,mode='visible',pose=[]}={}){
  this.readout.hidden=!this.enabled||!active;if(!this.enabled)return;
  const valid=active&&mode==='visible';this.layer.hidden=!valid;
  if(!valid){this.result=null;this.layer.replaceChildren();this.readout.textContent='YOLO / SWITCH TO VISIBLE SENSOR';return;}
  this.readout.textContent=this.status;
  const r=this.result,moved=r&&pose.some((v,i)=>Math.abs(v-r.pose[i])>(i<3?.7:.035));
  if(r&&!moved&&now-r.at<1200){if(this.drawn!==r.id){this.layer.replaceChildren();for(const b of r.boxes){const el=this.doc.createElement('div');el.className='visionBox';el.style.cssText=`left:${b.x1/r.width*100}%;top:${b.y1/r.height*100}%;width:${(b.x2-b.x1)/r.width*100}%;height:${(b.y2-b.y1)/r.height*100}%`;const label=this.doc.createElement('span');label.textContent=`${b.label.toUpperCase()} ${Math.round(b.score*100)}%`;el.append(label);this.layer.append(el);}this.drawn=r.id;}}
  else{this.layer.replaceChildren();this.drawn=null;}
  if(this.state!=='ready'||this.busy||now<this.nextAt||!source?.width||!source?.height)return;
  try{
   const ctx=this.canvas.getContext('2d',{willReadFrequently:true}),fit=letterbox(source.width,source.height);ctx.fillStyle='rgb(114,114,114)';ctx.fillRect(0,0,YOLO_SIZE,YOLO_SIZE);ctx.drawImage(source,0,0,fit.width,fit.height);
   const pixels=ctx.getImageData(0,0,YOLO_SIZE,YOLO_SIZE).data;
   this.pending={id:++this.serial,width:source.width,height:source.height,pose:[...pose]};this.busy=true;
   this.worker.postMessage({kind:'frame',...this.pending,pixels:pixels.buffer},[pixels.buffer]);this.watchdog=setTimeout(()=>this.fail('Inference timed out'),20000);
  }catch(error){this.fail(error.message);}
 }
}
