import * as T from './three.js';

// Field bodies keep their existing meshes. A hidden Mixamo-scale skeleton
// drives walk / idle / work / watch clips through AnimationMixer. Drop a
// remeshed TRELLIS or KayKit GLB later by retargeting onto these bone names.
const NAMES=['Hips','Spine','Neck','Head','LeftArm','RightArm','LeftUpLeg','RightUpLeg'];

function quat(x,y,z){return new T.Quaternion().setFromEuler(new T.Euler(x,y,z,'XYZ'));}

function quatTrack(name,times,poses){
  const values=[];
  for(const p of poses){const q=quat(p[0],p[1],p[2]);values.push(q.x,q.y,q.z,q.w);}
  return new T.QuaternionKeyframeTrack(name+'.quaternion',times,values);
}

function makeClips(){
  const t=[0,.25,.5,.75,1];
  const walk=new T.AnimationClip('walk',1,[
    quatTrack('LeftUpLeg',t,[[.55,0,0],[.12,0,0],[-.5,0,0],[-.08,0,0],[.55,0,0]]),
    quatTrack('RightUpLeg',t,[[-.5,0,0],[-.08,0,0],[.55,0,0],[.12,0,0],[-.5,0,0]]),
    quatTrack('LeftArm',t,[[-.42,0,.08],[-.1,0,.08],[.38,0,.08],[.08,0,.08],[-.42,0,.08]]),
    quatTrack('RightArm',t,[[.38,0,-.08],[.08,0,-.08],[-.42,0,-.08],[-.1,0,-.08],[.38,0,-.08]]),
    quatTrack('Spine',t,[[0,0,.04],[.03,0,0],[0,0,-.04],[-.03,0,0],[0,0,.04]]),
    quatTrack('Head',t,[[.04,0,0],[0,.05,0],[-.03,0,0],[0,-.05,0],[.04,0,0]])
  ]);
  const idle=new T.AnimationClip('idle',2.4,[
    quatTrack('Spine',[0,1.2,2.4],[[0,0,0],[.03,0,.02],[0,0,0]]),
    quatTrack('Head',[0,1.2,2.4],[[.02,0,0],[.04,.06,0],[.02,0,0]]),
    quatTrack('LeftArm',[0,1.2,2.4],[[.08,0,.12],[.12,0,.1],[.08,0,.12]]),
    quatTrack('RightArm',[0,1.2,2.4],[[.08,0,-.12],[.14,0,-.1],[.08,0,-.12]])
  ]);
  const work=new T.AnimationClip('work',1.6,[
    quatTrack('LeftArm',[0,.8,1.6],[[.55,0,.2],[.15,0,.35],[.55,0,.2]]),
    quatTrack('RightArm',[0,.8,1.6],[[.2,0,-.25],[.7,0,-.1],[.2,0,-.25]]),
    quatTrack('Spine',[0,.8,1.6],[[.12,0,0],[.18,.08,0],[.12,0,0]]),
    quatTrack('Head',[0,.8,1.6],[[.2,0,0],[.08,.12,0],[.2,0,0]])
  ]);
  const watch=new T.AnimationClip('watch',2,[
    quatTrack('Head',[0,1,2],[[.05,.35,0],[.08,-.3,0],[.05,.35,0]]),
    quatTrack('Spine',[0,1,2],[[0,.12,0],[0,-.1,0],[0,.12,0]]),
    quatTrack('LeftArm',[0,2],[[.12,0,.16],[.12,0,.16]]),
    quatTrack('RightArm',[0,2],[[.12,0,-.16],[.12,0,-.16]])
  ]);
  return {walk,idle,work,watch};
}

function bone(name,x,y,z){
  const b=new T.Bone();b.name=name;b.position.set(x,y,z);return b;
}

export function attachFieldRig(group){
  if(group.userData.rig)return group;
  const hips=bone('Hips',0,.92,0);
  const spine=bone('Spine',0,.38,0);hips.add(spine);
  const neck=bone('Neck',0,.28,0);spine.add(neck);
  const head=bone('Head',0,.16,0);neck.add(head);
  const leftArm=bone('LeftArm',-.22,.22,0);spine.add(leftArm);
  const rightArm=bone('RightArm',.22,.22,0);spine.add(rightArm);
  const leftUpLeg=bone('LeftUpLeg',-.12,0,0);hips.add(leftUpLeg);
  const rightUpLeg=bone('RightUpLeg',.12,0,0);hips.add(rightUpLeg);
  const skeleton=new T.Skeleton([hips,spine,neck,head,leftArm,rightArm,leftUpLeg,rightUpLeg]);
  const root=new T.Group();root.name='FieldRig';root.visible=false;root.add(hips);group.add(root);
  const clips=makeClips();
  const mixer=new T.AnimationMixer(root);
  const actions={};
  for(const [name,clip] of Object.entries(clips)){
    actions[name]=mixer.clipAction(clip);actions[name].enabled=true;actions[name].setEffectiveWeight(0);
  }
  actions.idle.setEffectiveWeight(1);actions.idle.play();
  const legs=group.userData.legs||[],arms=group.userData.arms||[];
  group.userData.rig={
    mixer,actions,skeleton,clips,current:'idle',
    bones:{Hips:hips,Spine:spine,Neck:neck,Head:head,LeftArm:leftArm,RightArm:rightArm,LeftUpLeg:leftUpLeg,RightUpLeg:rightUpLeg},
    visuals:{Head:group.userData.head,LeftArm:arms[0],RightArm:arms[1],LeftUpLeg:legs[0],RightUpLeg:legs[1]}
  };
  return group;
}

export function setFieldAction(group,name,fade=.18){
  const rig=group.userData.rig;if(!rig||!rig.actions[name]||rig.current===name)return;
  const next=rig.actions[name],prev=rig.actions[rig.current];
  next.reset().play();next.setEffectiveWeight(1);next.fadeIn(fade);
  if(prev&&prev!==next)prev.fadeOut(fade);
  rig.current=name;
}

export function updateFieldRig(group,dt){
  const rig=group.userData.rig;if(!rig)return;
  rig.mixer.update(Math.max(0,Math.min(dt,.05)));
  for(const [name,visual] of Object.entries(rig.visuals)){
    if(!visual||!rig.bones[name])continue;
    visual.quaternion.copy(rig.bones[name].quaternion);
  }
}

export function fieldRigStats(group){
  const rig=group.userData.rig;
  return rig?{bones:NAMES.length,clip:rig.current,clips:Object.keys(rig.actions)}:{bones:0,clip:null,clips:[]};
}
