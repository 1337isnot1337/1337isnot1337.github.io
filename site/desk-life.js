import { MathUtils, Vector3 } from './vendor/three/three.module.min.js';
import { leafPoint, caterpillarPoint, caterpillarRadii } from './desk-botany.js?v=1';

const { clamp, lerp } = MathUtils;
const experiment = ['sound','cards','bits','numbers'];
const leafDrift = new Vector3();

export function deskLife(stage, getModel, redraw, reduced) {
  const el = id => stage.querySelector('[data-object="'+id+'"]');
  const part = id => getModel().details.get(id);
  const object = id => getModel().targets.get(id)?.root;
  const home = new WeakMap();
  let drawerClaps=0,lastClose=0,drawerNote=false,complaintTravel=0,liner=false,linerLift=0;
  let marbleX=-.77,marbleZ=-.43,marbleSpeed=0,marbleDepthSpeed=0,marbleRotation=0;
  let handleStarted=0,handleSpring=0,stampBorrowed=false,postcardHeld=false;
  let potTurn=0,nibble=0,plantOpen=0,leafSaved=false,fallStart=0,dew=0,dewFall=0,dewTilt=0,star=false,borrowed=false,hop=0;
  const leafBends=new Map(), dewStart=new Vector3(), fragmentStart=new Vector3();
  const lampOrigin=new Vector3(), lightAxis=new Vector3(), incident=new Vector3();
  let sproutLean=0;
  let lampAngle=0,lampPitch=0,lampClicks=0,lampClickTime=0,warmAt=0,mothIdle=performance.now(),mothRest=false,mothScared=0;
  let pointerSample=null;
  let planeAngle=.62,planeSpeed=0,lift=0,aimOffset=0,tuner=-1,previousTuner=-1,afterglow=0,patched=false;
  let pencilX=[0,0],guide=false,bookmark=false,currentFile='',sleeve=false,wrote=false;
  const started=performance.now();
  let recording=null,chewed=false,ripple=0,tape=0,folded=false,unclipped=false,split=false,ribbonShift=0;
  let serviceOpened=false,deskLeafFile=false,tapeUp=0,pencilDrop=0,stowedScrew=false,lookedAtScrew=false;
  let scratching=false;
  const reversedBooks=new Set();
  const prints = new Map(),printOffsets=new Map(),paperclips=new Map();
  try{
    for(const project of JSON.parse(localStorage.getItem('shelf-paperclips')||'[]'))
      if(['flyover','cpu','schedule','conway','conjectures','factoring'].includes(project))paperclips.set(project+'-print',true);
  }catch{}
  let currentSketch=null;
  const drawing = stage.closest('#studio');
  try{currentFile=sessionStorage.getItem('desk-research-slip')||'';}catch{}
  function move(id,x,y,z) {
    const root=object(id);
    if(!root)return;
    if(!home.has(root))home.set(root,root.position.clone());
    root.position.copy(home.get(root)).add(leafDrift.set(x,y,z));
  }
  function setFile(id) {
    currentFile=id;
    part('errata').visible=Boolean(id);
    redraw();
  }
  function onSketch(event) {
    currentSketch=event.detail;
    const texture=getModel()?.sketchTexture;
    if(!texture)return;
    const canvas=texture.image;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    wrote=Boolean(event.detail);
    if(wrote)ctx.drawImage(event.detail,0,0,canvas.width,canvas.height);
    texture.needsUpdate=true;redraw();
  }
  drawing.addEventListener('desk-sketch',onSketch);
  drawing.addEventListener('desk-fold',event=>{folded=event.detail;redraw();});
  drawing.addEventListener('desk-file-out',event=>{deskLeafFile=event.detail;redraw();});
  document.addEventListener('desk-wave',event=>{tuner=0;afterglow=.34;redraw();});
  document.addEventListener('desk-clip',event=>{
    const {id,on}=event.detail;if(id)paperclips.set(id,on);redraw();
  });
  document.addEventListener('desk-tape',event=>{tape+=event.detail;redraw();});
  drawing.querySelector('.drawer-post').addEventListener('beforetoggle',event=>{
    postcardHeld=event.newState==='open';
    redraw();
  });
  document.addEventListener('desk-pin',event=>{
    prints.set(event.detail.id,event.detail.angle);redraw();
  });
  document.addEventListener('desk-bookmark',event=>{
    bookmark=event.detail==='notebook';setFile(event.detail==='research'?'research':'');
  });
  document.addEventListener('play',event=>{
    if(!['desk-audio','recording'].includes(event.target.id))return;
    recording=event.target;redraw();
  },true);
  function drawerChange(open,speed,direct){
    if(open)return;
    const time=performance.now();
    if(direct && speed>-1.35){
      handleSpring=.14;handleStarted=time;
      return;
    }
    drawerClaps=time-lastClose<2600?drawerClaps+1:1;
    lastClose=time;
    if(drawerClaps>=(direct?3:5)){
      drawerNote=true;complaintTravel=0;
    }
    handleSpring=clamp(.10+Math.abs(speed)*.041,.10,.34);
    handleStarted=time;
  }
  function drawerMomentum(impulse){
    if(Math.abs(impulse)>.05)marbleDepthSpeed=clamp(marbleDepthSpeed+impulse,-2.3,2.3);
  }
  function pullComplaint(amount){
    complaintTravel=clamp(amount,0,.13);
  }
  function lampChange(on) {
    const time=performance.now();
    lampClicks=time-lampClickTime<1000?lampClicks+1:1;
    lampClickTime=time;
    warmAt=on && lampClicks>=4?time+250:0;
    mothIdle=time;mothRest=false;mothScared=0;pointerSample=null;
  }
  function startleMoth(time){
    if(!mothRest && time-mothIdle>=14000){mothScared=time;mothRest=true;}
    mothIdle=time;
  }
  function pointerMoved(x,y,time) {
    if(pointerSample){
      const distance=Math.hypot(x-pointerSample.x,y-pointerSample.y);
      const elapsed=time-pointerSample.time;
      if(elapsed<130&&distance>.16)startleMoth(time);
      else if(distance>.025 && time-mothIdle<14000)mothIdle=time;
    }
    pointerSample={x,y,time};
  }
  const gestures = {
    propeller(dx,dy){planeSpeed=clamp((dx-dy)*150,-34,34);},
    listen(){sendRubbing('DOPPLERGEIST');},
    airframe(dx,dy){lift=clamp(lift-dy*3,0,.55);aimOffset=clamp(aimOffset+dx*4,-1.2,1.2);if(dy>.01)planeSpeed=1.1;},
    shade(dx,dy){
      const direction=dx>0? .55-lampAngle : lampAngle+1.33;
      const resistance=.23+.77*clamp(direction/.42,0,1);
      lampAngle=clamp(lampAngle+dx*6*resistance,-1.33,.55);
      lampPitch=clamp(lampPitch+dy*5,-.75,.43);
    },
    'shade-hinge'(dx,dy){gestures.shade(dx,dy);},
    tuner(dx,dy){
      previousTuner=tuner;
      const next=clamp(Math.round((part('tuner').rotation.z+(dx-dy)*7)/.45),-2,1);
      tuner=next+2;
      part('tuner').rotation.z=clamp(part('tuner').rotation.z+(dx-dy)*7,-.94,.68);
      if(previousTuner!==tuner)afterglow=.19;
    },
    cable(dx,dy){if(Math.abs(dx)+Math.abs(dy)>.003)patched=true;},
    wax(dx,dy){if(Math.abs(dx)+Math.abs(dy)>.003)split=true;},
    ribbon(dx){
      ribbonShift=clamp(ribbonShift+dx*7,-.22,.31);bookmark=true;
      const i=clamp(Math.round((ribbonShift+.22)/.17),0,3);
      document.dispatchEvent(new CustomEvent('desk-bookmark-leaf',{detail:i}));
    },
    binder(dx,dy){if(Math.abs(dx)+Math.abs(dy)>.003)unclipped=true;},
    marble(dx,dy){marbleSpeed=dx*13;marbleDepthSpeed=dy*13;},
    liner(){liner=true;},
    'nibbled-leaf'(dx,dy){brushLeaf('nibbled-leaf',dx*40,dy*40);},
    plant(dx){potTurn+=dx*3;},
    pencil(dx,dy){pencilX[0]=clamp(pencilX[0]+dx*1.6,-.32,.30);pencilDrop=clamp(pencilDrop-dy*3,0,.2);},
    'rose-pencil'(dx,dy){pencilX[1]=clamp(pencilX[1]+dx*1.6,-.29,.32);pencilDrop=clamp(pencilDrop-dy*3,0,.2);},
    tape(dx,dy){tapeUp=clamp(tapeUp-dy*9,0,1.54);},
    'pad-corner'(){guide=true;},
    file(dx,dy){if(dy>.004)sleeve=true;},
    book(dx,dy){if(Math.abs(dy)>.004)bookmark=true;if(Math.abs(dx)>.01)sendRubbing('Cinna’s notebook');}
  };
  function sendRubbing(label){
    if(!wrote||scratching)return;
    scratching=true;
    drawing.dispatchEvent(new CustomEvent('desk-rubbing',{detail:label}));
    setTimeout(()=>{scratching=false;},1300);
  }
  function tap(name) {
    switch(name){
      case 'drawer-stamp':
        stampBorrowed=!stampBorrowed;
        drawing.dispatchEvent(new CustomEvent('drawer-stamp',{detail:stampBorrowed}));
        break;
      case 'liner': liner=!liner;break;
      case 'binder': if(!unclipped)return false;unclipped=false;break;
      case 'screw-socket':
        if(!lookedAtScrew)return false;
        stowedScrew=true;break;
      case 'screw': part('screw').rotation.y+=.84;break;
      case 'fallen-leaf':
        if(!fallStart)return false;
        leafSaved=true;bookmark=true;break;
      case 'errata':
        if(!currentFile.startsWith(location.origin+'/solved-conjectures/docs/'))return false;
        location.href=currentFile;break;
      case 'listen':
        if(!part('listen').visible)return false;
        document.dispatchEvent(new CustomEvent('desk-experiment',{detail:'sound'}));
        el('scope').click();break;
      case 'tuner':
        if(tuner<0)return false;
        document.dispatchEvent(new CustomEvent('desk-experiment',{detail:experiment[tuner]}));
        return false;
      case 'pad-corner':
        if(!guide)return false;
        guide=false;break;
      default: return false;
    }
    redraw();return true;
  }
  function movePrint(id,dx,dy){
    const offset=printOffsets.get(id)||[0,0];
    offset[0]=clamp(offset[0]+dx*2,-.13,.13);
    offset[1]=clamp(offset[1]-dy*2,-.12,.12);
    printOffsets.set(id,offset);
    prints.set(id,clamp((prints.get(id)||0)+dx*1.2,-.16,.16));
  }
  function stow(id,yaw){
    if(['proof','archive'].includes(id)){
      if(Math.cos(yaw)<0)reversedBooks.add(id);else reversedBooks.delete(id);
    }
  }
  function brushLeaf(name,dx,dy){
    if(name==='whole-leaf'||name==='bitten-leaf'||name==='caterpillar')name='nibbled-leaf';
    if(name!=='nibbled-leaf'&&!name.startsWith('leaf-'))return false;
    const node=part(name);
    if(!node)return false;
    const current=leafBends.get(name)||[0,0];
    current[0]=clamp(current[0]+dy*.62,-.38,.38);
    current[1]=clamp(current[1]+dx*.58,-.32,.32);
    leafBends.set(name,current);return true;
  }
  function inspect(name,id,delta,event) {
    if(event==='open'&&id==='screw')lookedAtScrew=true;
    if(event==='close'&&id==='drawer-note')complaintTravel=.13;
    if(event==='hover'&&name==='springtail')hop=.22;
    if(event==='tap'&&name==='service-label')serviceOpened=!serviceOpened;
    if(id==='plant'){
      if(event==='open')plantOpen=performance.now();
      if(event==='pose')dewTilt=clamp((Math.sin(delta.pitch)-.45)*2,0,1);
      if(event==='close')dewTilt=0;
    }
    if(id==='plane' && event==='turn' && delta.y>.03)planeSpeed=delta.y*2+.7;
    if(id==='cup'){
      if(event==='use'){borrowed=!borrowed;star=borrowed;}
      if(name?.startsWith('cup-pencil-') && event==='tap'){borrowed=!borrowed;star=borrowed;}
    }
    if(event==='tap' && ['research-question','proof-card'].includes(name)){
      document.dispatchEvent(new CustomEvent('desk-book-slip',{detail:name}));
    }
    if(id==='tape' && event==='turn'){
      document.dispatchEvent(new CustomEvent('desk-tape',{detail:delta.x}));
    }
  }
  function updateInspection(copy) {
    copy?.traverse(node=>{
      if(node.parent===copy)return;
      const original=node.userData.detail && part(node.userData.detail);
      if(!original)return;
      node.visible=original.visible;
      node.position.copy(original.position);node.quaternion.copy(original.quaternion);
    });
  }
  function update(time,dt,drawerAmount,lampOn,inHand,{yaw,below,rear,behindWall},flap) {
    const model=getModel(),motion=!reduced.matches;
    const drift=motion?Math.sin((time-started)/90000)*.32:0;
    if(wrote&&currentSketch&&model.sketchTexture.image!==currentSketch && !part('scratch').userData.drawn){
      part('scratch').userData.drawn=true;onSketch({detail:currentSketch});
    }
    part('hutch-back').visible=Boolean(rear);
    part('rear-screw').visible=rear>0;
    part('rear-pencil').visible=rear>0;
    part('reverse-plaque').visible=rear<0;
    part('screw').visible=!stowedScrew;
    part('screw-socket').visible=!stowedScrew&&below>.34;
    part('fitted-screw').visible=stowedScrew;
    part('drawer-stamp').visible=!stampBorrowed;
    object('keepsake').visible=!postcardHeld;

    part('wall').visible=!behindWall;
    part('under-eye').visible=below>.44;
    part('pupil').position.x=clamp(Math.sin(yaw)*.072,-.047,.047);
    const limit=Math.sqrt(Math.max(0,.05**2-part('pupil').position.x**2));
    part('pupil').position.y=-limit*(.55+below*.45);
    part('drawer-note').visible=drawerNote;
    part('drawer-note').rotation.x=lerp(-.48,-1.02,drawerAmount)+complaintTravel*3.2;
    part('drawer-note').position.z=.15+complaintTravel*.68;
    part('drawer-note').position.y=.385+complaintTravel*.48;
    const linerGoal=Number(liner);
    linerLift=!motion||Math.abs(linerLift-linerGoal)<.008?linerGoal:lerp(linerLift,linerGoal,dt*10);
    part('liner').rotation.x=lerp(-.06,-1.31,linerLift);part('crumb-plan').visible=linerLift>.30;
    const nextX=clamp(marbleX+marbleSpeed*dt,-.97,-.43);
    const nextZ=clamp(marbleZ+marbleDepthSpeed*dt,-1.01,-.19);
    marbleRotation+=(nextZ-marbleZ)/.047;
    part('marble').position.set(nextX,.107,nextZ);
    part('marble').rotation.x=marbleRotation;
    part('marble').rotation.z=-nextX/.047;
    marbleX=nextX;marbleZ=nextZ;
    const friction=Math.exp(-dt*3.3);
    marbleSpeed*=friction;marbleDepthSpeed*=friction;
    if(marbleX===-.97||marbleX===-.43)marbleSpeed*=-.42;
    if(marbleZ===-1.01||marbleZ===-.19)marbleDepthSpeed*=-.48;
    const swing=clamp((time-handleStarted)/495,0,1);
    part('handle').rotation.x=motion?Math.sin(swing*Math.PI)*handleSpring*(1-swing):0;
    const shade=part('shade');
    part('shade-hinge').rotation.x=lampPitch*.27;
    shade.rotation.set(-.16+lampPitch*.73,lampAngle,-.36+lampAngle*.29);
    shade.updateWorldMatrix(true,false);
    shade.getWorldPosition(lampOrigin);
    lightAxis.set(0,-1,0).transformDirection(shade.matrixWorld);
    part('listen').visible=lampOn && lampAngle<-.22;
    const scratches=part('lamplit-scratches');
    scratches.getWorldPosition(incident).sub(lampOrigin).normalize();
    const hit=lightAxis.dot(incident);
    scratches.visible=lampOn&&hit>.72&&lightAxis.x<-.43;
    const projection=part('rabbit-shadow');
    projection.visible=lampOn&&Math.abs(lampAngle+.83)<.29&&Math.abs(lampPitch-.13)<.30;
    if(projection.visible)model.projectLampShadow(lampAngle,lampPitch,potTurn,aimOffset);
    part('pad-guide').visible=guide;
    part('pad-corner').rotation.x=guide?-.75:0;
    part('bookmark').visible=bookmark;part('ribbon').position.x=.39+ribbonShift;
    part('wax').visible=!split;part('split-wax').visible=split;
    part('errata').visible=Boolean(currentFile);
    part('loose-sheet').visible=deskLeafFile;
    part('scratch').visible=wrote;part('flat-sketch').visible=!folded;part('folded-sketch').visible=folded;
    const moth=part('moth');
    const elapsed=time-mothIdle;
    moth.visible=lampOn && (elapsed>=14000||mothRest);
    const retreat=mothScared ? clamp((time-mothScared)/380,0,1) : 1;
    const arrival=clamp((elapsed-14000)/1200,0,1);
    const settling=clamp((22000-elapsed)/1500,0,1);
    const flying=moth.visible && !inHand && motion && (mothRest?retreat<1:elapsed<22000);
    const amount=flying ? (mothRest?1-retreat:arrival*settling) : 0;
    const base=model.lamp.position.x;
    moth.position.set(
      lerp(base-.79,base-.42+Math.sin(time/635)*.24,amount),
      lerp(1.55,1.2+Math.sin(time/310)*.16,amount),
      lerp(-1.245,-.73+Math.cos(time/700)*.17,amount));
    moth.rotation.y=Math.sin(time/712)*amount*.72;
    for(const sign of [-1,1])part('moth-wing-'+sign).rotation.z=flying?sign*Math.sin(time/32)*.79:sign*.22;
    part('propeller').rotation.z=planeAngle;
    if(motion)planeAngle+=planeSpeed*dt;
    planeSpeed*=Math.exp(-dt*1.85);
    lift=lerp(lift,0,motion?.12:1);aimOffset=lerp(aimOffset,0,motion?.12:1);
    part('airframe').position.y=.58+lift;part('airframe').rotation.y=-.59+aimOffset;
    const playing=recording&&!recording.paused;
    part('flyover').visible=Boolean(playing);
    if(playing)part('flyover').position.x=clamp(recording.currentTime/(recording.duration||85),0,1)*1.45-.72;
    const glass=part('glass-glare').children[0]?.material?.map;
    if(glass)glass.offset.x=clamp(Math.sin(yaw)*2.9,-1,1);
    part('service-diagram').visible=serviceOpened;
    part('scope-glow').children.forEach((readout,i)=>{
      const latest=i===(patched?4:tuner);
      readout.visible=latest||(afterglow>0&&i===previousTuner&&previousTuner!==tuner);
      readout.position.z=latest?0:.008;
      for(const layer of readout.children)if(layer.material)layer.material.opacity=latest?1:afterglow*1.4;
    });
    afterglow=Math.max(0,afterglow-dt);
    part('cable').position.set(patched?.62:.12,patched?.40:.032,patched?.59:1.13);
    part('cable-wire').visible=!patched;part('plugged-wire').visible=patched;
    if(inHand==='plant'){
      nibble=clamp((time-plantOpen)/14500,0,1);
      for(let i=0;i<caterpillarRadii.length;i++){
        const segment=part('caterpillar-segment-'+i);
        segment.position.set(...caterpillarPoint(nibble,i,motion?time:0));
      }
    }
    const bitten=chewed ||= (inHand==='plant'&&nibble>.89);
    part('whole-leaf').visible=!bitten;
    part('bitten-leaf').visible=bitten;
    part('caterpillar').visible=inHand==='plant';
    const pot=object('plant');
    pot.rotation.y=potTurn;
    if(inHand==='plant'&&nibble>.95&&!fallStart){
      fallStart=time;
      part('nibbled-leaf').getWorldPosition(fragmentStart);
      fragmentStart.x+=.10;fragmentStart.z+=.085;fragmentStart.y-=.03;
    }
    const fragment=part('fallen-leaf');
    fragment.visible=Boolean(fallStart&&!leafSaved);
    part('pressed-leaf').visible=leafSaved;
    const falling=fallStart ? clamp((time-fallStart)/780,0,1) : 1;
    if(fragment.visible){
      fragment.position.set(
        lerp(fragmentStart.x,pot.position.x+.43,falling),
        lerp(fragmentStart.y,1.53,falling*falling),
        lerp(fragmentStart.z,-1.46,falling));
      fragment.rotation.set(.8*(1-falling),.45+falling*.8,-.56*(1-falling));
    }
    for(const [id,angles] of leafBends){
      const blade=part(id);
      blade.rotation.x=angles[0];blade.rotation.z=angles[1];
      const decay=Math.exp(-dt*6.4);
      angles[0]*=decay;angles[1]*=decay;
      if(Math.hypot(...angles)<.002){blade.rotation.set(0,0,0);leafBends.delete(id);}
    }
    const drop=part('dew');
    if(dew<1&&inHand==='plant')dew=clamp(dew+dt*dewTilt*.69,0,1);
    drop.position.set(...leafPoint(.32+dew*.66,.025));
    drop.position.y-=.004;
    drop.visible=dew<1;
    if(!dewFall&&dew===1){
      part('dew-track').localToWorld(dewStart.copy(drop.position));
      pot.worldToLocal(dewStart);
      dewFall=time;
    }
    const fall=dewFall ? clamp((time-dewFall)/370,0,1) : 0;
    const freeDrop=part('falling-dew'),ripple=part('ripple');
    freeDrop.visible=fall>0&&fall<1;
    if(freeDrop.visible){
      freeDrop.position.set(lerp(dewStart.x,.181,fall),lerp(dewStart.y,.004,fall*fall),lerp(dewStart.z,.091,fall));
    }
    const rip=dewFall ? clamp((time-dewFall-370)/760,0,1) : 0;
    ripple.visible=fall>=1&&rip<1;
    if(ripple.visible){
      ripple.scale.setScalar(1+rip*2.3);
      for(const ring of ripple.children)if(ring.material)ring.material.opacity=(1-rip)*.66;
    }
    const leanGoal=lampOn?.20:0;
    sproutLean=motion?lerp(sproutLean,leanGoal,Math.min(1,dt*.13)):leanGoal;
    const toward=Math.atan2(model.lamp.position.x-pot.position.x,model.lamp.position.z-pot.position.z)-potTurn;
    part('sprout').rotation.set(Math.cos(toward)*sproutLean,0,-Math.sin(toward)*sproutLean);
    const springtail=part('springtail');
    springtail.position.y=.011+Math.sin(Math.PI*(hop/.22))*.025;
    hop=Math.max(0,hop-dt);
    part('paper-star').visible=star;
    part('cup-pencil-0').visible=!borrowed;
    move('pencil',pencilX[0],0,0);move('rose-pencil',pencilX[1],0,0);
    if(pencilDrop>.003){
      const height=motion?Math.abs(Math.sin(time/45))*pencilDrop:0;
      move('pencil',pencilX[0],height,0);move('rose-pencil',pencilX[1],height*.55,0);
      pencilDrop*=.83;
      part('ribbon').position.y=.07+height*.18;
    }
    object('pencil').rotation.z=pencilX[0]*17;object('rose-pencil').rotation.z=pencilX[1]*17;
    object('file').rotation.y=sleeve?-.03:-.14;
    part('binder').rotation.x=unclipped?-.85:0;
    for(let i=0;i<4;i++)part('folder-page-'+i).position.z=(flap*.012+(unclipped||sleeve?.058:0))*i;
    object('tape').rotation.x=-tapeUp;
    move('tape',0,Math.sin(tapeUp)*.29,0);
    part('stage-lights').visible=lampOn&&tapeUp>1.02&&lampAngle<-.22;
    for(const id of ['proof','archive'])part(id+'-volume').rotation.y=(id==='proof'?.14:-.12)+(reversedBooks.has(id)?Math.PI:0);
    part('reel-0').rotation.y=tape*1.2;part('reel-1').rotation.y=tape*.82;
    part('eaten-tape').visible=tape<-3;
    for(const [id,on] of paperclips)part('pin-clip-'+id).visible=on;
    for(const [id,angle] of prints)object(id).rotation.z=angle;
    for(const [id,[x,y]] of printOffsets){
      move(id,x,y,0);
      part('pin-hole-'+id).visible=Math.hypot(x,y)>.025;
    }
    const warm=warmAt ? clamp((time-warmAt)/750,0,1):1;
    return { drift, warm, active: Boolean(
      Math.abs(planeSpeed)>.025||lift>.005||Math.abs(aimOffset)>.01||Math.hypot(marbleSpeed,marbleDepthSpeed)>.022||(motion&&swing<1)||linerLift!==linerGoal||
      afterglow>0||pencilDrop>.003||(inHand==='plant'&&time-plantOpen<15600)||(inHand==='plant'&&dewTilt>0&&dew<1)||freeDrop.visible||ripple.visible||hop>0||leafBends.size||falling<1||playing||flying||(lampOn&&warm<1)), wakeAt:lampOn&&!moth.visible ? mothIdle+14000 : 0};
  }
  return {tap,gestures,movePrint,stow,drawerChange,drawerMomentum,pullComplaint,lampChange,brushLeaf,pointerMoved,startleMoth,inspect,updateInspection,update};
}
