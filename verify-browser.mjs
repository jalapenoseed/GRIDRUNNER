// Optional real WebGL + Worker smoke test. Uses installed Playwright/Chromium.
// No renderer replacement and no test hooks are shipped in dist/.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist');
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(file);
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,
    args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:900,height:620}}),errors=[];
  page.on('pageerror',error=>{errors.push(error.message);console.error('Browser page error:',error.message);});
  page.on('console',msg=>{if(['error','warning'].includes(msg.type()))console.log('Browser:',msg.text());if(msg.type()==='error')errors.push(msg.text());});
  const source=await readFile('dist/game.js','utf8');
  // Font CDN access is not part of this local engine test; use CSS fallbacks.
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
  await page.route(/\/game\.js(?:\?.*)?$/,route=>route.fulfill({contentType:'text/javascript',
    body:source+'\nwindow.__gridrunnerQA=code=>eval(code);'}));
  await page.addInitScript(()=>localStorage.setItem('gridrunner.settings',JSON.stringify({graphics:'LOW',tutorialEnabled:false,recordedVoice:false})));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__gridrunnerQA?.("spatial.status==='ready'&&ambientResidents.status==='ready'"),{},{timeout:60000});
  const run=code=>page.evaluate(code=>window.__gridrunnerQA(code),code);
  const engines=await run('({physics:spatial.stats(),navigation:ambientResidents.stats()})');
  assert.equal(engines.navigation.active,7);
  await run("settings.graphics='LOW';settings.recordedVoice=false;applySettings();newExpedition();s.intro=completedIntro();s.pos.set(-106,1.7,-143);s.yaw=-1.9;ambientResidents.update(0,s);paused=true;screen='';document.querySelector('#overlay').style.display='none'");
  const before=await run("ambientResidents.position('riggs')");
  await run("for(let i=0;i<360;i++)ambientResidents.update(.05,s)");
  const after=await run("ambientResidents.position('riggs')");
  assert(Math.hypot(after.x-before.x,after.z-before.z)>1,'Resident follows Recast route in browser');
  assert(await run("targets().some(t=>t.id==='riggs'&&Math.abs(t.x-ambientResidents.position('riggs').x)<.001)"));
  await run("{const p=ambientResidents.position('riggs');s.pos.set(p.x+3,1.7,p.z+5);s.yaw=Math.atan2(3,5);s.pitch=0;camera.position.copy(s.pos);camera.rotation.set(s.pitch,s.yaw,0,'YXZ');camera.updateMatrixWorld();renderer.render(scene,camera)}");
  await mkdir('/tmp/gridrunner-qa',{recursive:true});
  await page.screenshot({path:'/tmp/gridrunner-qa/v7.15-resident.png'});
  const rendered=await run("({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION)})");
  assert(rendered.calls>0&&rendered.triangles>0,'Real WebGL draws the game');
  // Exercise every airframe with the same browser-loaded Rapier adapter.
  await run("s.pos.set(0,1.7,15);s.mode='foot';bike.position.set(0,0,15);s.engineerBuilt=true;for(const id of ['scout','cargo','engineer','relay']){releaseDroneView();selectAircraft(s,id);issueDrone('MANUAL');for(let i=0;i<50;i++)tickDrone(.02,[0,0,1]);issueDrone('HOLD');}");
  assert.deepEqual(errors,[],'No page, shader or console errors');
  console.log('PASS: browser WebGL scene, Rapier, actual navigation worker, seven routes, moving interaction targets and four aircraft.',engines,rendered);
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
