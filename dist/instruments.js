export function drawInstruments(display,s){
 const {canvas,tex}=display,c=canvas.getContext('2d'),speed=Math.round(Math.abs(s.speed)*2.237),heading=((Math.round(-s.yaw*180/Math.PI)%360)+360)%360;
 c.fillStyle='#071216';c.fillRect(0,0,512,256);c.fillStyle='#20373b';c.fillRect(0,0,512,32);
 c.font='16px monospace';c.fillStyle='#a9c8c5';c.fillText('BLACKLINE / '+(s.powerMode||'ASSIST'),16,22);c.fillStyle='#5cedc2';c.fillText(String(heading).padStart(3,'0')+'°',444,22);
 c.fillStyle='#eff6df';c.font='bold 106px monospace';c.fillText(String(speed).padStart(2,'0'),22,145);c.font='18px monospace';c.fillStyle='#a0b5b1';c.fillText('MPH',162,141);
 const bar=(name,value,y,color)=>{c.fillStyle='#a0b5b1';c.font='15px monospace';c.fillText(name,250,y);c.fillStyle=color;c.font='bold 24px monospace';c.fillText(Math.floor(value)+'%',405,y);c.fillStyle='#213739';c.fillRect(250,y+9,230,8);c.fillStyle=color;c.fillRect(250,y+9,230*Math.max(0,Math.min(1,value/100)),8);};
 bar('BIKE',s.battery,72,s.battery<20?'#efaa65':'#b9da78');bar('TRAILER',s.trailer/40*100,132,'#68decd');
 c.strokeStyle='#284044';c.beginPath();c.moveTo(16,176);c.lineTo(496,176);c.stroke();c.fillStyle='#75b7b5';c.font='15px monospace';c.fillText('SCOUT '+s.droneSystem.mode,18,204);c.fillText('LINK '+Math.round(s.droneSystem.signal)+'%',350,204);
 c.fillStyle='#e6b36b';c.fillText(s.battery<10?'LOW ENERGY / PEDAL TO CONSERVE':'HULL '+Math.round(s.hp)+'%   ·   MOTOR '+Math.round(s.temp)+'°C',18,237);
 // Permanent hairline scuffs on the cover glass; telemetry remains readable.
 c.strokeStyle='#cfebdf18';for(let i=0;i<7;i++){c.beginPath();c.moveTo(355+i*19,35+i*3);c.lineTo(370+i*19,40+i*3);c.stroke();}tex.needsUpdate=true;
}
