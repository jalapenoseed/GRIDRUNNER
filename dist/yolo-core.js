// Official YOLOX-Nano 0.1.1rc0 raw-output export, not decoded custom exports.
export const YOLO_SIZE=416;
export const COCO_CLASSES='person,bicycle,car,motorcycle,airplane,bus,train,truck,boat,traffic light,fire hydrant,stop sign,parking meter,bench,bird,cat,dog,horse,sheep,cow,elephant,bear,zebra,giraffe,backpack,umbrella,handbag,tie,suitcase,frisbee,skis,snowboard,sports ball,kite,baseball bat,baseball glove,skateboard,surfboard,tennis racket,bottle,wine glass,cup,fork,knife,spoon,bowl,banana,apple,sandwich,orange,broccoli,carrot,hot dog,pizza,donut,cake,chair,couch,potted plant,bed,dining table,toilet,tv,laptop,mouse,remote,keyboard,cell phone,microwave,oven,toaster,sink,refrigerator,book,clock,vase,scissors,teddy bear,hair drier,toothbrush'.split(',');
export function letterbox(width,height){const ratio=Math.min(YOLO_SIZE/width,YOLO_SIZE/height);return {ratio,width:Math.floor(width*ratio),height:Math.floor(height*ratio)};}
export function bgrTensor(rgba){
 const area=YOLO_SIZE*YOLO_SIZE;if(rgba.length!==area*4)throw Error('Unexpected vision frame size');
 const out=new Float32Array(area*3);for(let i=0;i<area;i++){out[i]=rgba[i*4+2];out[i+area]=rgba[i*4+1];out[i+area*2]=rgba[i*4];}return out;
}
export function iou(a,b){const w=Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1)),h=Math.max(0,Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1)),area=w*h;return area/Math.max(1e-9,(a.x2-a.x1)*(a.y2-a.y1)+(b.x2-b.x1)*(b.y2-b.y1)-area);}
export function decodeYolo(data,dims,width,height,{threshold=.4,nms=.45,limit=16}={}){
 if(dims.length!==3||dims[0]!==1||dims[1]!==3549||dims[2]!==85)throw Error('Unsupported YOLOX output shape');
 const {ratio}=letterbox(width,height),boxes=[];let row=0;
 for(const stride of [8,16,32]){const side=YOLO_SIZE/stride;for(let y=0;y<side;y++)for(let x=0;x<side;x++,row++){
  const offset=row*85;let score=0,cls=0;for(let c=0;c<80;c++){const p=data[offset+4]*data[offset+5+c];if(p>score){score=p;cls=c;}}
  if(score<threshold||!Number.isFinite(score))continue;
  const cx=(data[offset]+x)*stride,cy=(data[offset+1]+y)*stride,w=Math.exp(data[offset+2])*stride,h=Math.exp(data[offset+3])*stride;
  const box={label:COCO_CLASSES[cls],classId:cls,score,x1:Math.max(0,(cx-w/2)/ratio),y1:Math.max(0,(cy-h/2)/ratio),x2:Math.min(width,(cx+w/2)/ratio),y2:Math.min(height,(cy+h/2)/ratio)};
  if(Object.values(box).filter(v=>typeof v==='number').every(Number.isFinite)&&box.x2>box.x1&&box.y2>box.y1)boxes.push(box);
 }}
 boxes.sort((a,b)=>b.score-a.score);const kept=[];for(const box of boxes){if(!kept.some(other=>iou(box,other)>nms))kept.push(box);if(kept.length>=limit)break;}return kept;
}
