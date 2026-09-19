# Local vision assets

- Runtime: `onnxruntime-web` 1.22.0 (pinned package-lock). CPU/WASM JS, module and binary are copied together by `npm run vendor:vision`.
- Model: official YOLOX-Nano 416 raw-output export from https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_nano.onnx
- Model SHA-256: `c789161ed43c8269fcd4e67c67eeeb4e80c622da2eb296a20bc6007bd18a0b7d`
- Runtime license: https://github.com/microsoft/onnxruntime/blob/v1.22.0/LICENSE
- YOLOX project license: https://github.com/Megvii-BaseDetection/YOLOX/blob/main/LICENSE

Keep both license files. The npm runtime tarball omits its license, so the upstream pinned license is retained here. Project licensing is not represented as a separate model-weight guarantee.

Input: float32 NCHW BGR 0–255, top-left aspect-fit padding 114, 416×416. Output: `[1,3549,85]` raw grid export, strides 8/16/32, objectness × class probability. This implementation uses continuous-coordinate class-agnostic IoU NMS at .45, confidence .4, maximum 16 boxes. It does not accept a decoded custom export without an adapter.

All inference is local and optional. No CDN or inference service is contacted at play time. COCO classes are general objects, not custom game equipment. No synthetic scene tags are substituted when the model produces zero detections.
