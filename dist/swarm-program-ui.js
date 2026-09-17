import {STARTER_AIRCRAFT,aircraftCode} from './fleet-manifest.js';
import {createSwarmProgram,validateSwarmProgram,compileProgram,sampleSwarmProgram,PROGRAM_SHAPES,PROGRAM_FIELDS,PROGRAM_RANGES,PROGRAM_EXAMPLES,FIELD_FORMULAS} from './swarm-program.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
let dispose=null;
export function unmountSwarmProgram(){dispose?.();dispose=null;}
const choices=(values,current)=>Object.entries(values).map(([id,label])=>`<option value="${id}" ${id===current?'selected':''}>${label}</option>`).join('');
export function renderSwarmProgram(program=createSwarmProgram(),started=false){
 const p=program.settings,number=(key,label,step=1)=>`<label>${label}<input data-program-number="${key}" type="number" step="${step}" min="${PROGRAM_RANGES[key][0]}" max="${PROGRAM_RANGES[key][1]}" value="${p[key]}" required></label>`,select=(key,label,values)=>`<label>${label}<select data-program-setting="${key}">${choices(values,p[key])}</select></label>`;
 return `<section class="swarmStudio"><div class="panelTop"><div><div class="eyebrow">BLACKLINE / PROGRAM BENCH</div><h2>Program your swarm</h2></div><button data-nav="swarm">← Operations</button></div>
 <div class="programActions"><button class="primary" data-program-action="apply" ${!started?'disabled':''}>APPLY TO LIVE FLEET</button><button data-program-action="resume" ${!started?'disabled':''}>RESUME FIELD RUN</button><button data-program-action="live-pause" ${!started?'disabled':''}>PAUSE LIVE PROGRAM</button><button data-program-action="return" ${!started?'disabled':''}>RETURN CLUSTER</button></div>
 <p class="programLive" data-program-live>${started?'The field is paused. Preview changes, apply, then resume to fly.':'Try the preview here. Choose Operations → Play Swarm Start to fly your program.'}</p>
 <fieldset class="programFleet"><legend>Affected aircraft</legend>${STARTER_AIRCRAFT.map(id=>`<label><input type="checkbox" data-program-id="${id}" ${program.ids.includes(id)?'checked':''}>${aircraftCode(id)}</label>`).join('')}<button data-program-action="all">ALL SIX</button><button data-program-action="scout-pair">SCOUTS 03 + 04</button></fieldset>
 <p class="hint">Scouts 03 + 04 are selected by default, leaving your guards and Relays on duty. Applying a program assigns the selected available aircraft to it.</p>
 <div class="programBench"><section class="programPreview"><div class="programPreviewHead"><h3>Formation preview</h3><select aria-label="Preview camera" data-program-view><option value="oblique">Angled view</option><option value="top">Top view</option><option value="front">Front view</option></select></div><canvas id="swarmProgramCanvas" width="640" height="420" tabindex="0" aria-label="Formation preview and drawing pad. Enable Draw path, then drag; keyboard arrows move the pen, Space starts or ends a stroke."></canvas>
 <div class="programTransport"><button data-program-action="run">▶ RUN PREVIEW</button><button data-program-action="pause">PAUSE</button><button data-program-action="step">STEP +1s</button><button data-program-action="reset">RESET</button><output data-program-clock>0.0 s</output></div>
 <p class="hint">Dim rings: base formation · arrows: influence · bright points: combined targets. Preview shows targets; live aircraft accelerate, avoid obstacles and return on reserve.</p>
 <div class="programDraw"><button data-program-action="draw" aria-pressed="false">DRAW PATH</button><button data-program-action="undo">UNDO STROKE</button><button data-program-action="clear">CLEAR DRAWING</button><output data-program-points>${program.strokes.length} strokes</output></div><p class="hint">Draw several strokes with mouse or touch. Keyboard: arrows move the pen, Space starts/ends a stroke. Turn Draw path off to see the formation.</p>
 <p data-program-error class="programError" role="alert"></p><p data-program-message role="status">Ready to experiment.</p>
 <details class="programStorage"><summary>Save / import / export presets</summary><label>Preset name<input data-program-name value="My swarm" maxlength="40"></label><div class="programTransport"><button data-program-action="save">SAVE PRESET</button><button data-program-action="export">EXPORT JSON</button></div><label>Saved on this device<select data-program-saved><option value="">Choose a preset</option></select></label><button data-program-action="load">LOAD PRESET</button><label>Import preset<input data-program-import type="file" accept=".json,application/json"></label></details>
 </section><section class="programControls"><div class="programTabs" role="group" aria-label="Program input mode"><button data-program-mode="manual" aria-pressed="${program.mode==='manual'}">HAND INPUTS</button><button data-program-mode="script" aria-pressed="${program.mode==='script'}">SCRIPT</button></div>
 <div data-program-manual ${program.mode==='script'?'hidden':''}><h3>Formation & origin</h3><div class="programInputs">${select('shape','Shape',PROGRAM_SHAPES)}${select('plane','Word / drawing plane',{sky:'Upright in the sky',ground:'Horizontal / top view'})}${select('origin','Origin',{bike:'Bike',operator:'Operator',objective:'Scout objective',fixed:'Fixed point'})}${number('spacing','Spacing (m)')}${number('height','Height above origin (m)')}<label>Word<input data-program-word value="${esc(p.word)}" maxlength="16" spellcheck="false"></label><label class="programCheck"><input data-program-trace type="checkbox" ${p.trace?'checked':''}>Trace word / drawing</label>${number('moveX','Move east / west (m)')}${number('moveZ','Move south / north (m)')}${number('rotation','Rotate (°)')}${number('scale','Shape scale',.1)}${number('morph','Morph from ring (s)',.5)}${select('pattern','Motion pattern',{hold:'Hold',orbit:'Orbit',wave:'Wave',pulse:'Pulse',search:'Search'})}${select('team','Teammate coupling',{independent:'Independent slots',pairs:'Pair coupling',leader:'Follow leader',mesh:'Nearest teammate'})}</div><p class="hint">Six points cannot hold every letter of a long word. Tracing moves them along the strokes. Negative north/south values move north.</p>
 <h3>Mathematical influence</h3><div class="programInputs">${select('field','Influence field',PROGRAM_FIELDS)}${number('strength','Strength (m)')}${number('frequency','Frequency (rad/s)',.05)}${number('phase','Phase (rad)',.1)}${number('fieldScale','Coordinate scale (m)')}${number('blend','Blend',.05)}</div><p data-program-formula class="programFormula">${esc(FIELD_FORMULAS[p.field])}</p><div data-program-custom ${p.field==='custom'?'':'hidden'}>${['X','Y','Z'].map(axis=>`<label>Δ${axis.toLowerCase()} formula<input data-program-formula-input="formula${axis}" value="${esc(p['formula'+axis])}" maxlength="240" spellcheck="false"></label>`).join('')}<p class="hint">Use + − * / ^, sin, cos, abs, sqrt, min, max, atan2. Custom formulas output metres; Blend scales them.</p></div>
 <details><summary>Showoff pass & timing</summary><div class="programInputs">${select('show','Choreography',{none:'None',flyby:'Buzzing flyby + roll',roll:'Barrel roll',flip:'Synchronized flip',dance:'Flip & dance'})}${number('countIn','Count-in (s)',.5)}${number('offset','Aircraft phase offset (s)',.1)}</div><p class="hint">Shows repeat every 12 seconds (flyby path: 16 seconds). Rolls and flips animate the airframe while the flight controller holds its path. Reduced motion disables choreography.</p></details></div>
 <div data-program-script ${program.mode==='script'?'':'hidden'}><label>Runnable example<select data-program-example>${Object.keys(PROGRAM_EXAMPLES).map(name=>`<option>${name}</option>`).join('')}</select></label><button data-program-action="example">LOAD EXAMPLE / ALL SIX</button><label>Program<textarea data-program-source rows="17" spellcheck="false" maxlength="6000">${esc(program.source)}</textarea></label><p class="hint">Commands run together until “wait”. “select” addresses aircraft inside the affected group. Lines starting with # are comments.</p><details><summary>Language & commands</summary><pre>select all | scouts | relays | scout-03,scout-04
assign formation | operator | bike | scout | relay | standby
formation ring | wedge | line | grid | word | drawing
origin bike | operator | objective | fixed
spacing 14
height 20
move 0 -25
rotation 45
scale 1.5
word GRID
plane sky | ground
trace on
pattern hold | orbit | wave | pulse | search
team independent | pairs | leader | mesh
influence vortex 8 0.6
formula x = 6 * sin(t + i)
show none | flyby | roll | flip | dance
wait 12
repeat 24</pre><p class="hint">Influence: name, strength, frequency. objective x z uses the scout objective as origin with those offsets. Other numeric controls also work as commands: morph, strength, frequency, phase, fieldScale, blend, countIn, offset. Time is in seconds; distances are metres. Guard and scout assignments retain their mission and cap added influence at 4 m per axis. standby releases an aircraft until you apply again.</p></details><ol data-program-cues class="programCues"></ol></div>
 </section></div></section>`;
}
export function mountSwarmProgram(root,{program,started,reducedMotion=false,onDraft=()=>{},onApply=()=>'',onResume=()=>{},onLivePause=()=>'',onReturn=()=>''}){
 unmountSwarmProgram();let draft=clone(program),valid=null,t=0,running=false,drawing=false,pen=null,stroke=null,raf=0,last=0,view='oblique',traces=new Map(),alive=true;
 const find=selector=>root.querySelector(selector),canvas=find('#swarmProgramCanvas'),ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
 const error=find('[data-program-error]'),message=find('[data-program-message]');
 function persist(){onDraft(clone(draft));}
 function validate(){try{valid=validateSwarmProgram(draft,{reset:true});error.textContent='';if(draft.mode==='script'){const script=compileProgram(draft.source);find('[data-program-cues]').innerHTML=script.cues.filter(c=>c.assignment||Object.keys(c.patch).length).map(c=>`<li><b>${c.at}s · line ${c.line}</b> ${esc(c.assignment?'assign '+c.assignment:Object.entries(c.patch).map(([k,v])=>k+' '+v).join(' · '))}</li>`).join('');}return true;}catch(e){error.textContent=e.message;valid=null;running=false;return false;}}
 function changed(){persist();validate();traces.clear();draw();}
 function setMode(mode){draft.mode=mode;find('[data-program-manual]').hidden=mode!=='manual';find('[data-program-script]').hidden=mode!=='script';root.querySelectorAll('[data-program-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.programMode===mode)));changed();}
 function updateControls(){for(const el of root.querySelectorAll('[data-program-number]'))el.value=draft.settings[el.dataset.programNumber];for(const el of root.querySelectorAll('[data-program-setting]'))el.value=draft.settings[el.dataset.programSetting];for(const el of root.querySelectorAll('[data-program-formula-input]'))el.value=draft.settings[el.dataset.programFormulaInput];root.querySelectorAll('[data-program-id]').forEach(el=>el.checked=draft.ids.includes(el.dataset.programId));find('[data-program-word]').value=draft.settings.word;find('[data-program-trace]').checked=draft.settings.trace;find('[data-program-source]').value=draft.source;find('[data-program-formula]').textContent=FIELD_FORMULAS[draft.settings.field];find('[data-program-custom]').hidden=draft.settings.field!=='custom';find('[data-program-points]').textContent=draft.strokes.length+' strokes';setMode(draft.mode);}
 const listeners=[];function listen(el,type,fn){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));}
 listen(root,'input',event=>{
  const el=event.target;
  if(el.dataset.programNumber){draft.settings[el.dataset.programNumber]=el.value===''?NaN:Number(el.value);}
  else if(el.dataset.programFormulaInput)draft.settings[el.dataset.programFormulaInput]=el.value;
  else if(el.hasAttribute('data-program-word'))draft.settings.word=el.value.toUpperCase();
  else if(el.hasAttribute('data-program-source'))draft.source=el.value;
  else return;
  changed();
 });
 listen(root,'change',async event=>{
  const el=event.target;
  if(el.dataset.programId){draft.ids=STARTER_AIRCRAFT.filter(id=>find('[data-program-id="'+id+'"]').checked);changed();}
  if(el.dataset.programSetting){draft.settings[el.dataset.programSetting]=el.value;find('[data-program-formula]').textContent=FIELD_FORMULAS[draft.settings.field];find('[data-program-custom]').hidden=draft.settings.field!=='custom';changed();}
  if(el.hasAttribute('data-program-trace')){draft.settings.trace=el.checked;changed();}
  if(el.hasAttribute('data-program-view')){view=el.value;traces.clear();draw();}
  if(el.hasAttribute('data-program-import'))try{const file=el.files?.[0];if(!file)return;if(file.size>32000)throw Error('Preset must be smaller than 32 KB.');const text=await file.text();if(!alive)return;const imported=validateSwarmProgram(JSON.parse(text),{reset:true});draft=imported;t=0;running=false;updateControls();message.textContent='Preset imported. Preview it, then Apply to fly.';}catch(e){if(alive)error.textContent=e.message;}
 });
 function presets(){try{const value=JSON.parse(window.localStorage.getItem('gridrunner.swarm.programs.v1')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function refreshPresets(){find('[data-program-saved]').innerHTML='<option value="">Choose a preset</option>'+Object.keys(presets()).slice(0,12).map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');}
 listen(root,'click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.programMode){setMode(button.dataset.programMode);return;}
  const action=button.dataset.programAction;if(!action)return;
  if(action==='resume'){onResume();return;}
  if(action==='return'){message.textContent=onReturn();return;}
  if(action==='live-pause'){message.textContent=onLivePause();button.textContent=message.textContent.startsWith('Live program paused')?'RESUME LIVE PROGRAM':'PAUSE LIVE PROGRAM';return;}
  if(action==='pause'){running=false;message.textContent='Preview paused at '+t.toFixed(1)+' s.';}
  if(action==='run'&&validate()){running=true;drawing=false;find('[data-program-action="draw"]').setAttribute('aria-pressed','false');message.textContent=reducedMotion?'Reduced motion: targets remain static.':'Preview running. The field fleet has not changed.';}
  if(action==='step'&&validate()){running=false;t+=1;message.textContent='Preview stepped to '+t.toFixed(1)+' s.';}
  if(action==='reset'){running=false;t=0;traces.clear();message.textContent='Preview reset. Your program is unchanged.';}
  if(action==='apply'&&started&&validate()){const result=onApply(clone(valid));message.textContent=result;find('[data-program-live]').textContent=result;}
  if(action==='all'||action==='scout-pair'){draft.ids=action==='all'?[...STARTER_AIRCRAFT]:['scout-03','scout-04'];updateControls();}
  if(action==='example'){draft.source=PROGRAM_EXAMPLES[find('[data-program-example]').value];draft.ids=[...STARTER_AIRCRAFT];draft.mode='script';t=0;running=false;updateControls();message.textContent='Example loaded for all six. Edit the affected group to keep guards on duty.';}
  if(action==='draw'){drawing=!drawing;running=false;stroke=null;pen=[0,0];button.setAttribute('aria-pressed',String(drawing));if(drawing){draft.settings.shape='drawing';draft.mode='manual';updateControls();message.textContent='Draw your path. Each new drag starts a separate stroke.';canvas.focus();}}
  if(action==='undo'){draft.strokes.pop();changed();}
  if(action==='clear'){draft.strokes=[];changed();}
  if(action==='save'&&validate())try{const name=find('[data-program-name]').value.trim();if(!name)throw Error('Give this preset a name.');const saved=presets();if(!Object.hasOwn(saved,name)&&Object.keys(saved).length>=12)throw Error('Twelve presets are stored. Reuse a name to replace one.');Object.defineProperty(saved,name,{value:clone(valid),enumerable:true,configurable:true,writable:true});window.localStorage.setItem('gridrunner.swarm.programs.v1',JSON.stringify(saved));refreshPresets();message.textContent='Saved “'+name+'” on this device.';}catch(e){error.textContent=e.message;}
  if(action==='load')try{const value=presets()[find('[data-program-saved]').value];if(!value)throw Error('Choose a saved preset.');draft=validateSwarmProgram(value,{reset:true});t=0;running=false;updateControls();message.textContent='Preset loaded. Apply when ready.';}catch(e){error.textContent=e.message;}
  if(action==='export'&&validate()){const url=URL.createObjectURL(new Blob([JSON.stringify(valid,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='GRIDRUNNER-swarm-program.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='Program exported.';}
  find('[data-program-points]').textContent=draft.strokes.length+' strokes';draw();
 });
 function point(event){const r=canvas.getBoundingClientRect();return [Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1))];}
 function startStroke(p){if(draft.strokes.length>=24||draft.strokes.reduce((n,s)=>n+s.length,0)>=510){error.textContent='Drawing limit reached. Undo or clear a stroke.';return;}stroke=[[...p]];draft.strokes.push(stroke);pen=p;}
 function extend(p){pen=p;if(!stroke)return;if(draft.strokes.reduce((n,s)=>n+s.length,0)>=512){stroke=null;error.textContent='512-point drawing limit reached.';return;}if(Math.hypot(p[0]-stroke.at(-1)[0],p[1]-stroke.at(-1)[1])>.012)stroke.push([...p]);}
 listen(canvas,'pointerdown',event=>{if(!drawing)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);startStroke(point(event));draw();});
 listen(canvas,'pointermove',event=>{if(!drawing||!stroke)return;extend(point(event));draw();});
 const finish=()=>{if(!stroke)return;stroke=null;find('[data-program-points]').textContent=draft.strokes.length+' strokes';changed();};
 listen(canvas,'pointerup',finish);listen(canvas,'pointercancel',finish);
 listen(canvas,'keydown',event=>{if(!drawing)return;const d={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]}[event.key];if(!d&&event.key!==' ')return;event.preventDefault();event.stopPropagation();if(event.key===' '){if(stroke)finish();else startStroke(pen||[0,0]);}else{const p=pen||[0,0];extend(p.map((v,i)=>Math.max(-1,Math.min(1,v+d[i]))));}draw();});
 function draw(){
  if(!alive)return;const w=Math.max(260,canvas.clientWidth||640),h=w*.66,dpr=Math.min(2,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#081920';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#244148';ctx.lineWidth=1;for(let x=0;x<w;x+=w/12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=h/8){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.font='12px monospace';ctx.fillStyle='#b1d0ca';ctx.fillText(drawing?'DRAW / MULTI-STROKE PATH':view.toUpperCase()+' / TARGET PREVIEW',12,22);
  const line=(a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
  if(drawing){for(const path of draft.strokes)for(let i=1;i<path.length;i++)line([(path[i-1][0]+1)*w/2,(path[i-1][1]+1)*h/2],[(path[i][0]+1)*w/2,(path[i][1]+1)*h/2],'#61ead4',2);if(pen){const x=(pen[0]+1)*w/2,y=(pen[1]+1)*h/2;line([x-7,y],[x+7,y],'#ffca77');line([x,y-7],[x,y+7],'#ffca77');}}
  else if(valid){
   const samples=valid.ids.map(id=>({id,...sampleSwarmProgram(valid,id,{time:t,reducedMotion})})),extent=Math.max(70,...samples.flatMap(p=>[Math.abs(p.target[0])*1.35,Math.abs(p.target[2])*1.35,p.target[1]*1.4])),scale=w/(extent*2.4);
   const project=([x,y,z])=>view==='top'?[w/2+x*scale,h/2+z*scale]:view==='front'?[w/2+x*scale,h*.85-y*scale]:[w/2+(x+z*.35)*scale,h*.72+(z*.45-y)*scale];
   line(project([-extent,0,0]),project([extent,0,0]),'#446760');line(project([0,0,-extent]),project([0,0,extent]),'#446760');
   const guide=samples[0];if(guide?.strokes.length){const o=guide.opts,angle=o.rotation*Math.PI/180;for(const stroke of guide.strokes){const points=stroke.map(([u,v])=>{const x=u*o.spacing*2*o.scale,y=o.plane==='sky'?-v*o.spacing*2*o.scale:0,z=o.plane==='ground'?v*o.spacing*2*o.scale:0;return project([x*Math.cos(angle)-z*Math.sin(angle)+o.moveX,y+o.height,x*Math.sin(angle)+z*Math.cos(angle)+o.moveZ]);});for(let k=1;k<points.length;k++)line(points[k-1],points[k],'#82baa755',1.5);}}
   for(const sample of samples){
    const color=sample.id.startsWith('relay')?'#f17aff':'#62f5df',p=project(sample.target),b=project(sample.base),trail=traces.get(sample.id)||[];
    if(running){trail.push([...sample.target]);if(trail.length>100)trail.shift();traces.set(sample.id,trail);}
    for(let j=1;j<trail.length;j++)line(project(trail[j-1]),project(trail[j]),color+'60');
    ctx.strokeStyle='#7ba6a180';ctx.beginPath();ctx.arc(...b,4,0,Math.PI*2);ctx.stroke();line(b,p,'#cfbc75',1.5);const angle=Math.atan2(p[1]-b[1],p[0]-b[0]);if(Math.hypot(p[0]-b[0],p[1]-b[1])>8){line(p,[p[0]-5*Math.cos(angle-.5),p[1]-5*Math.sin(angle-.5)],'#cfbc75');line(p,[p[0]-5*Math.cos(angle+.5),p[1]-5*Math.sin(angle+.5)],'#cfbc75');}
    ctx.save();ctx.translate(...p);ctx.rotate(sample.attitude.roll);ctx.fillStyle=color;ctx.fillRect(-4,-3,8,6);ctx.restore();ctx.fillStyle=color;ctx.fillText(aircraftCode(sample.id).replace('SCOUT','S').replace('RELAY','R'),p[0]+8,p[1]-6);
    if(sample.error)error.textContent=sample.error;
   }
   const shape=samples[0]?.opts.shape;if(shape==='word'||shape==='drawing'){ctx.fillStyle='#b1d0ca';ctx.fillText(valid.ids.length+' aircraft · '+(samples[0].opts.trace?'TRACING':'HOLDING SAMPLED POINTS'),12,h-12);}
  }
  find('[data-program-clock]').textContent=t.toFixed(1)+' s';
 }
 function frame(now){if(!alive)return;if(running){t+=Math.min(.05,last?(now-last)/1000:0);draw();}last=now;raf=globalThis.requestAnimationFrame?.(frame)||0;}
 const resize=()=>draw();globalThis.addEventListener?.('resize',resize);dispose=()=>{alive=false;globalThis.cancelAnimationFrame?.(raf);globalThis.removeEventListener?.('resize',resize);listeners.forEach(fn=>fn());};refreshPresets();validate();draw();raf=globalThis.requestAnimationFrame?.(frame)||0;
}
