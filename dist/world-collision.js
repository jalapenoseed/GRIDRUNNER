export function boxSolid(solids,x,y,z,w,h,d,kind='facility'){
 // Road paint, shallow road slabs and tiny surface trim stay rideable.
 if(h<=.35||w<=.09||d<=.09)return;
 solids.push({x,z,w:w/2,d:d/2,minY:y-h/2,maxY:y+h/2,kind});
}
export function coneSolids(solids,x,y,z,r,h){
 for(let i=0;i<12;i++){const radius=r*(1-(i+.5)/12)*.82;solids.push({x,z,w:radius,d:radius,minY:y-h/2+i*h/12,maxY:y-h/2+(i+1)*h/12,kind:'rock'});}
}
export function beamSolids(solids,a,b,r,kind='tower'){
 const count=Math.max(1,Math.ceil(Math.hypot(...b.map((v,i)=>v-a[i]))/3));
 for(let i=0;i<count;i++){const p=a.map((v,j)=>v+(b[j]-v)*i/count),q=a.map((v,j)=>v+(b[j]-v)*(i+1)/count);solids.push({x:(p[0]+q[0])/2,z:(p[2]+q[2])/2,w:Math.abs(q[0]-p[0])/2+r,d:Math.abs(q[2]-p[2])/2+r,minY:Math.min(p[1],q[1])-r,maxY:Math.max(p[1],q[1])+r,kind});}
}
