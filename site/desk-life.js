import { MathUtils, Vector3 } from './vendor/three/three.module.min.js';
import { caterpillarPoint, caterpillarRadii } from './desk-botany.js?v=1';

const { clamp, lerp } = MathUtils;
const experiment = ['sound','cards','bits','numbers'];
const leafDrift = new Vector3();

export function deskLife(stage, getModel, redraw, reduced) {
  const el = id => stage.querySelector('[data-object="'+id+'"]');
  const part = id => getModel().details.get(id);
  const object = id => getModel().targets.get(id)?.root;
  const home = new WeakMap();
  let drawerClaps=0,lastClose=0,drawerNote=false,marbleX=-.77,marbleSpeed=0,handleSwing=0,liner=false;
  let potTurn=0,nibble=0,plantOpen=0,leafLift=0,falling=false,leafSaved=false,dew=0,star=false,borrowed=false,hop=0;
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
    const card=object('keepsake');
    if(card){card.visible=event.newState!=='open';redraw();}
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
  function drawerChange(open, speed=0) {
    if(open){marbleSpeed=.8+2*Math.abs(speed);return;}
    const time=performance.now();
    drawerClaps=time-lastClose<1350?drawerClaps+1:1;
    lastClose=time;
    if(drawerClaps>=3 || (drawerClaps>=2 && speed<-.9))drawerNote=true;
    handleSwing=Math.abs(speed)*.16+.10;
    marbleSpeed=-.6;
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
    shade(dx,dy){lampAngle=clamp(lampAngle+dx*6,-1.33,.55);lampPitch=clamp(lampPitch+dy*6,-.75,.43);},
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
    marble(dx){marbleSpeed=dx*12;},
    liner(){liner=true;},
    'nibbled-leaf'(dx,dy){leafLift+=dy*3;},
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
      case 'drawer-note': drawerNote=false;break;
      case 'liner': liner=!liner;break;
      case 'binder': if(!unclipped)return false;unclipped=false;break;
      case 'screw-socket':
        if(!lookedAtScrew)return false;
        stowedScrew=true;break;
      case 'screw': part('screw').rotation.y+=.84;break;
      case 'fallen-leaf':
        if(!falling)return false;
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
  function inspect(name,id,delta,event) {
    if(event==='open'&&id==='screw')lookedAtScrew=true;
    if(event==='hover'&&name==='springtail')hop=.22;
    if(event==='tap'&&name==='service-label')serviceOpened=!serviceOpened;
    if(id==='plant'){
      if(event==='open')plantOpen=performance.now();
      if(event==='turn'){
        leafLift=clamp(leafLift+delta.y*.10,-.3,.3);
        dew=clamp(dew+Math.abs(delta.y)*.46,0,1);
        if(dew>=.99)ripple=.85;
        hop=.2;
      }
      if(event==='close' && nibble>.94)falling=true;
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
    part('screw').visible=!stowedScrew;part('screw-socket').visible=!stowedScrew;
    part('wall').visible=!behindWall;
    part('under-eye').visible=below>.44;
    part('pupil').position.x=clamp(Math.sin(yaw)*.072,-.047,.047);
    const limit=Math.sqrt(Math.max(0,.05**2-part('pupil').position.x**2));
    part('pupil').position.y=-limit*(.55+below*.45);
    part('drawer-note').visible=drawerNote;
    part('drawer-note').rotation.x=lerp(-.62,-1.25,drawerAmount);
    part('liner').rotation.x=liner?1.68:.11;part('crumb-plan').visible=liner;
    marbleX=clamp(marbleX+marbleSpeed*dt,-.90,.90);marbleSpeed*=Math.exp(-dt*2.8);
    if(Math.abs(marbleX)===.90)marbleSpeed*=-.46;
    part('marble').position.x=marbleX;part('marble').rotation.z=-marbleX*10;
    handleSwing*=Math.exp(-dt*5.3);
    part('handle').rotation.x=motion?Math.sin(time/78)*handleSwing:0;
    part('shade').rotation.set(-.16+lampPitch,lampAngle,-.36+lampAngle*.15);
    part('listen').visible=lampOn && lampAngle<-.22;
    part('lamplit-scratches').visible=lampOn&&lampAngle<-.34;
    part('rabbit-shadow').visible=lampOn&&Math.abs(lampAngle+.83)<.055&&Math.abs(lampPitch-.13)<.15;
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
    part('fallen-leaf').visible=falling&&!leafSaved;
    part('nibbled-leaf').rotation.x=leafLift;
    if(motion)leafLift*=Math.exp(-dt*4.1);
    part('dew').position.z=.12+dew*.21;
    part('dew').visible=dew<.99;
    part('ripple').visible=ripple>.01;part('ripple').scale.setScalar(1+(1-ripple)*1.9);
    ripple=Math.max(0,ripple-dt);
    part('sprout').rotation.z=(lampOn?-.14:.02)+potTurn*.06;
    part('springtail').position.y=.011+hop*.035;
    hop=Math.max(0,hop-dt);
    object('plant').rotation.y=potTurn+(lampOn?drift*.10:0);
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
      Math.abs(planeSpeed)>.025||lift>.005||Math.abs(aimOffset)>.01||Math.abs(marbleSpeed)>.02||handleSwing>.005||
      afterglow>0||pencilDrop>.003||(inHand==='plant'&&time-plantOpen<15600)||ripple>0||hop>0||playing||flying||(lampOn&&warm<1)), wakeAt:lampOn&&!moth.visible ? mothIdle+14000 : 0};
  }
  return {tap,gestures,movePrint,stow,drawerChange,lampChange,pointerMoved,startleMoth,inspect,updateInspection,update};
}
