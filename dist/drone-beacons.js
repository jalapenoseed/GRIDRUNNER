import {EXTRA_AIRCRAFT,aircraftType} from './fleet-manifest.js';
// Identity never changes with orders or sensor palettes.
export const BEACONS={
 scout:{color:0x22efff,name:'CYAN'},
 cargo:{color:0xffb52e,name:'AMBER'},
 engineer:{color:0x78ff45,name:'LIME'},
 relay:{color:0xf46bff,name:'MAGENTA'}
};
for(const id of EXTRA_AIRCRAFT)BEACONS[id]=BEACONS[aircraftType(id)];
export function beaconScale(camera,position,viewportHeight=800){
 // A compact ten-pixel optical identification lamp at any viewing distance.
 // Normal depth testing still hides it behind terrain and structures.
 const depth=camera?Math.max(.1,-position.clone().applyMatrix4(camera.matrixWorldInverse).z):30;
 const fov=(camera?.fov||75)*Math.PI/180;
 return Math.max(.09,depth*2*Math.tan(fov/2)*10/Math.max(240,viewportHeight));
}
