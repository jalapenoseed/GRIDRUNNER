import * as ort from './vendor/vision/ort.wasm.min.mjs';
import {bgrTensor,decodeYolo,YOLO_SIZE} from './yolo-core.js';
ort.env.wasm.numThreads=1;
ort.env.wasm.wasmPaths=new URL('./vendor/vision/',import.meta.url).href;
let session;
self.onmessage=async({data})=>{
 try{
  if(data.kind==='init'){
   session=await ort.InferenceSession.create(new URL('./vendor/vision/yolox_nano.onnx',import.meta.url).href,{executionProviders:['wasm']});
   self.postMessage({kind:'ready'});return;
  }
  if(data.kind!=='frame'||!session)return;
  const input=new ort.Tensor('float32',bgrTensor(new Uint8ClampedArray(data.pixels)),[1,3,YOLO_SIZE,YOLO_SIZE]),start=performance.now();
  let output;try{
   output=await session.run({[session.inputNames[0]]:input});const result=output[session.outputNames[0]];
   self.postMessage({kind:'result',id:data.id,boxes:decodeYolo(result.data,result.dims,data.width,data.height),ms:Math.round(performance.now()-start)});
  }finally{input.dispose();if(output)for(const value of Object.values(output))value.dispose();}
 }catch(error){self.postMessage({kind:'error',message:String(error.message||error).slice(0,160)});}
};
