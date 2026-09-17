import fs from 'node:fs';
// Development-only CPU/HUD diagnostic. Never copied into the hosted static build.
const diagnostics={name:'gridrunner-diagnostics',configureServer(server){server.middlewares.use((req,res,next)=>{
 if(req.url==='/_qa-commander-mobile'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0;background:#24333c"><iframe title="Phone Commander QA" src="/commander.html" style="width:390px;height:844px;border:0"></iframe></body></html>');return;}
 if(req.url==='/_qa-mobile'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0;background:#24333c"><iframe title="Phone menu QA" src="/_qa" style="width:390px;height:844px;border:0"></iframe></body></html>');return;}
 if(req.url==='/_qa'){
  const html=fs.readFileSync(new URL('./dist/index.html',import.meta.url),'utf8').replace(/game\.js(?:\?v=[^"']+)?(?=["'])/,'/_qa-game.js').replace('<body>','<body><output id="diagnostic" style="position:fixed;top:0;left:0;z-index:9999;background:#762e16;color:white;font:11px monospace;padding:5px;pointer-events:none">CPU / HUD DIAGNOSTIC — NO 3D RENDERING</output>');res.setHeader('Content-Type','text/html');res.end(html);return;
 }
 if(req.url==='/_qa-game.js'){
  let source=fs.readFileSync(new URL('./dist/game.js',import.meta.url),'utf8');source=source.replace("import * as T from './three.js';",`import * as Three from './three.js';
class DiagnosticRenderer {constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld();document.querySelector('#diagnostic').textContent='CPU / HUD DIAGNOSTIC — NO 3D RENDERING · AUDIO '+(sound.ctx?.state||'OFF')+' · '+sound.state;}}
const T={...Three,WebGLRenderer:DiagnosticRenderer};`);
  source=source.replaceAll('requestPointerLock','__diagnosticNoPointerLock');res.setHeader('Content-Type','text/javascript');res.end(source);return;
 }next();
 });}};
export default {root:'dist',server:{host:'0.0.0.0',allowedHosts:['terminal.local']},plugins:[diagnostics]};
