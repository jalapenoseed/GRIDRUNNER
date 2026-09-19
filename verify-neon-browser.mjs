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
    body:source.replaceAll('requestAnimationFrame(loop)','void 0')+'\nwindow.__gridrunnerQA=code=>eval(code);'}));
  await page.addInitScript(()=>localStorage.setItem('gridrunner.settings',JSON.stringify({graphics:'LOW',tutorialEnabled:false,recordedVoice:false})));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__gridrunnerQA?.("spatial.status==='ready'&&ambientResidents.status==='ready'"),{},{timeout:60000});
  const run=code=>page.evaluate(code=>window.__gridrunnerQA(code),code);

  const color=await run(`(()=>{
    const testScene=new T.Scene(),testCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
    testScene.add(new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:0x555555})));
    const read=()=>{const gl=renderer.getContext(),pixel=new Uint8Array(4);gl.readPixels(Math.floor(gl.drawingBufferWidth/2),Math.floor(gl.drawingBufferHeight/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return [...pixel];};
    renderer.render(testScene,testCamera);const direct=read();
    const post=new PresenceComposer(renderer,testScene,testCamera);post.apply({graphics:'HIGH',sensorMode:'visible'});post.render();const bloom=read();
    return {direct,bloom,target:[post.sceneTarget.width,post.sceneTarget.height],buffer:[renderer.domElement.width,renderer.domElement.height]};
  })()`);
  assert(Math.abs(color.direct[0]-color.bloom[0])<5,'HIGH output preserves display color and exposure');
  assert.deepEqual(color.target,color.buffer,'postprocessing uses device pixel resolution');
  await run(`newExpedition();yardChoice='scout';startFlightYard('sensors');issueDrone('HOLD');
    s.mode='foot';s.pos.set(190,1.7,110);s.yaw=0;s.pitch=.35;bike.position.set(150,0,125);
    settings.tutorialEnabled=false;settings.randomEnvironment=false;settings.weather='night';settings.sunHour=1;settings.movingSun=false;settings.reduceMotion=true;settings.sensorMode='visible';applySettings();
    setFormation('PROTECTIVE RING');play();
    for(let i=0;i<1250;i++){s.elapsed+=.02;tickDrone(.02,[0,0,0]);}
    paused=true;screen='';document.querySelector('#overlay').style.display='none';
    for(const id of AIRCRAFT){const d=s.squad[id].system;d.mode='HOLD';d.hold=[...d.pos];}
    loop(performance.now()+20)`);
  const escort=await run('Object.entries(s.squad).map(([id,r])=>({id,pos:r.system.pos,mode:r.system.mode,hp:r.system.hp}))');
  assert(escort.every(r=>Math.hypot(r.pos[0]-190,r.pos[2]-110)<22),'all aircraft reached operator ring');
  const projected=await run('AIRCRAFT.map(id=>{const m=fleet.meshes[id],p=m.position.clone().project(camera);return {id,visible:m.visible,pos:m.position.toArray(),ndc:p.toArray()};})');
  assert(projected.some(p=>p.visible&&Math.abs(p.ndc[0])<.95&&Math.abs(p.ndc[1])<.95&&p.ndc[2]<1),'ring crosses normal forward sightline');
  console.log('Visible formation:',projected);
  const output=resolve('qa-output');await mkdir(output,{recursive:true});
  for(const quality of ['LOW','HIGH']){
    await run(`settings.graphics='${quality}';settings.sensorMode='visible';applySettings();loop(performance.now()+20)`);
    if(quality==='HIGH')await run('fleet.prepare(AIRCRAFT)');
    await page.waitForTimeout(250);await run('loop(performance.now()+20)');
    await page.screenshot({path:resolve(output,'neon-'+quality.toLowerCase()+'.png')});
  }
  await run("settings.sensorMode='thermal';applySettings();loop(performance.now()+20)");
  assert.equal(await run('document.body.dataset.sensor'),'thermal');
  await page.screenshot({path:resolve(output,'personal-thermal.png')});
  await run("issueDrone('MANUAL');s.droneSystem.pos=[230,25,150];s.pos.fromArray(s.droneSystem.pos);s.yaw=1;loop(performance.now()+20)");
  assert.deepEqual(await run('fleetAnchor().pos'),[190,2,110]);
  assert.equal(await run('settings.sensorMode'),'visible');
  await run("issueDrone('HOLD')");assert.equal(await run('settings.sensorMode'),'thermal');
  await run("settings.sensorMode='visible';settings.graphics='HIGH';applySettings()");
  await page.setViewportSize({width:1100,height:700});await run('loop(performance.now()+20)');
  assert.deepEqual(await run('[presence.sceneTarget.width,presence.sceneTarget.height]'),await run('[renderer.domElement.width,renderer.domElement.height]'));
  assert.deepEqual(errors,[],'no browser, shader or asset errors');
  console.log('PASS: real WebGL LOW/HIGH neon, personal thermal, all four physical escorts, FPV body anchor, visor restoration, display transform and resize.',{color,escort});
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
