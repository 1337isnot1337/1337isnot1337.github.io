import * as T from './vendor/three/three.module.min.js';
import { attachHeldArrows } from './desk-arrows.js?v=1';
import { shelfInspection } from './shelf-inspection.js?v=2';

// One renderer serves the room and the object in hand. Capture the room once per pickup.
export function inspectDeskObjects(stage,engine,room,deskCamera,getModel,redraw,life,motion){
  const dialog=document.querySelector('.object-view'), surface=dialog.querySelector('.turn-surface');
  const use=dialog.querySelector('.use-object');
  const turnLabel=surface.getAttribute('aria-label');
  const objects={
    plant:['The windowsill cutting'], cup:['The pencil cup','Borrow a pencil'],
    pencil:['Graphite pencil','Draw with it'], 'rose-pencil':['Rose pencil','Draw with it']
  };
  const display=new T.Scene(), camera=new T.PerspectiveCamera(35,1,.02,40);
  const stand=new T.Group();display.add(stand);
  const sky=new T.HemisphereLight(0xfff3db,0xb0a0ad,2.3);display.add(sky);
  for(const [color,strength,x,y,z] of [[0xffead2,2.5,-3,4,5],[0xffdfbb,1.8,3,2,-2]]){
    const light=new T.DirectionalLight(color,strength);light.position.set(x,y,z);display.add(light);
  }
  const backdrop=new T.ShaderMaterial({
    depthWrite:false,depthTest:false,uniforms:{frame:{value:null},focus:{value:1}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D frame;uniform float focus;
      void main(){vec3 color=textureLod(frame,vUv,2.28*focus).rgb;
        float edge=smoothstep(.13,.73,distance(vUv,vec2(.5,.52)));
        gl_FragColor=vec4(mix(color,mix(color*.39,vec3(.045,.027,.039),.32+edge*.38),focus),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const screen=new T.Mesh(new T.PlaneGeometry(2,2),backdrop);
  screen.frustumCulled=false;screen.renderOrder=-1000;display.add(screen);
  let active='',source=null,snapshot=null,opener=null,using=false,press=null,tap=null,working=null;
  let yaw=0,pitch=0,radius=1,aspect=0,part='',control='';
  let zoom=0,zoomTarget=0,fitDistance=1,liftStarted=-Infinity,liftScale=1;
  const liftOffset=new T.Vector2();
  const loader=new T.TextureLoader();
  let detailedPrint=null;
  const ray=new T.Raycaster(),screenPoint=new T.Vector2();
  function hitsObject(e){
    part='';control='';
    if(!source)return true;
    const r=surface.getBoundingClientRect();
    screenPoint.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
    ray.setFromCamera(screenPoint,camera);
    const hit=ray.intersectObject(stand,true).find(result=>{
      for(let n=result.object;n;n=n.parent)if(!n.visible)return false;
      return true;
    });
    for(let n=hit?.object;n&&!(part&&control);n=n.parent){
      part ||= n.userData.detail||'';
      control ||= n.userData.shelfControl||'';
    }
    return Boolean(hit);
  }
  function rotate(dx,dy){
    life.inspect(part,active,{x:dx,y:dy},'turn');
    yaw+=dx;pitch=T.MathUtils.clamp(pitch+dy,-Math.PI*.94,Math.PI*.94);
    life.inspect(part,active,{yaw,pitch},'pose');
    redraw();
  }
  function restPose(){
    yaw=active.includes('pencil')?-.72:-.24;
    pitch=['drawer-note','crumb-plan','shim','screw'].includes(active)?.90:active==='prop-small-keys'?.68:
      active.includes('pencil')?.94:active==='cup'?.32:active==='prop-pocket-compass'?-.72:.16;
  }
  function zoomBy(delta){
    zoomTarget=T.MathUtils.clamp(zoomTarget+delta,Math.log(.74),Math.log(1.62));
    redraw();
  }
  function open(id,label,action){
    if(dialog.open)return;
    putBack();
    active=id;
    opener=stage.querySelector('[data-object="'+id+'"]');
    dialog.setAttribute('aria-label',label);
    surface.setAttribute('aria-label',id.startsWith('room-') ? turnLabel+' Press Enter to open the source.' : turnLabel);
    use.hidden=!action;use.textContent=id==='cup'?life.cupAction():action||'';
    restPose();zoom=zoomTarget=0;liftStarted=-Infinity;
    life.inspect('',active,null,'open');
    source=null;aspect=0;stage.classList.add('inspecting');
    dialog.showModal();surface.focus({preventScroll:true});redraw();
  }
  for(const [id,[label,action]] of Object.entries(objects)){
    const button=stage.querySelector('[data-object="'+id+'"]');
    button.addEventListener('click',e=>{
      if(using || !stage.classList.contains('is-rendered') || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)return;
      e.preventDefault();e.stopImmediatePropagation();
      open(id,label,action);
    },true);
  }
  for(const poster of stage.querySelectorAll('[data-room-poster]')){
    poster.addEventListener('click',e=>{
      if(using || !stage.classList.contains('is-rendered') || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)return;
      e.preventDefault();e.stopImmediatePropagation();
      open(poster.dataset.object,poster.textContent.trim());
    },true);
  }
  function followPoster(){
    using=true;try{opener.click();}finally{using=false;}
  }
  function close(){
    if(dialog.open)dialog.close();
    putBack();
  }
  dialog.querySelector('.put-object-back').onclick=close;
  function releasePrint(){
    if(!detailedPrint)return;
    detailedPrint.material.map.dispose();
    detailedPrint.material.dispose();
    detailedPrint.geometry.dispose();
    detailedPrint=null;
  }
  function loadPrint(copy,{w,h}){
    const face=copy.children.find(mesh=>mesh.material?.map);
    if(!face)return;
    loader.load('/assets/furniture/posters/'+active.slice(5)+'.webp',texture=>{
      // A visitor may put this poster down or open another before the image arrives.
      if(stand.children[0]!==copy){texture.dispose();return;}
      texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
      face.geometry=new T.PlaneGeometry(w,h);
      face.material=face.material.clone();face.material.map=texture;
      detailedPrint=face;redraw();
    },undefined,()=>{});
  }
  const stopArrows=attachHeldArrows(surface,()=>dialog.open && surface===document.activeElement && !press,
    (x,y)=>rotate(x*1.5,y*1.5));
  function putBack(){
    if(!active)return;
    stopArrows();working=null;control='';delete surface.dataset.shelfControl;
    life.stow(active,yaw);life.inspect('',active,null,'close');active='';source=null;part='';
    cancelPress();releasePrint();stand.clear();snapshot?.dispose();snapshot=null;
    backdrop.uniforms.frame.value=null;stage.classList.remove('inspecting');redraw();
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)putBack();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  use.onclick=()=>{
    const returning=life.inspect(part,active,null,'use');
    const graphite=active==='pencil', erase=Math.cos(pitch)<-.25;
    close();
    if(returning)return;
    using=true;try{opener.click();}finally{using=false;}
    if(graphite)document.dispatchEvent(new CustomEvent('desk-eraser',{detail:erase}));
  };
  surface.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    if(working?.key?.(e.key.toLowerCase())){
      e.preventDefault();redraw();return;
    }
    if(active.startsWith('room-') && (e.key==='Enter' || e.key===' ')){
      e.preventDefault();followPoster();return;
    }
    if(working&&(e.key==='Enter'||e.key===' ')){
      e.preventDefault();working.activate(working.primary,motion.matches);redraw();return;
    }
    if(e.key==='Home'){
      e.preventDefault();restPose();zoomTarget=0;life.inspect(part,active,{yaw,pitch},'pose');redraw();return;
    }
    if(e.key==='+'||e.key==='='||e.key==='-'){
      e.preventDefault();zoomBy(e.key==='-'?-.14:.14);return;
    }
  });
  surface.addEventListener('wheel',e=>{
    if(!e.deltaY||e.ctrlKey||e.metaKey)return;
    e.preventDefault();
    const unit=e.deltaMode===1?16:e.deltaMode===2?surface.clientHeight:1;
    zoomBy(-e.deltaY*unit*.00115);
  },{passive:false});
  surface.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    const onObject=hitsObject(e);
    tap=null;
    press={id:e.pointerId,x:e.clientX,y:e.clientY,part,control,onObject,dragging:false,
      sensitivity:1.25*Math.PI/Math.max(320,Math.min(surface.clientWidth,surface.clientHeight))};
    surface.setPointerCapture(e.pointerId);
  });
  surface.addEventListener('pointermove',e=>{
    if(press?.id===e.pointerId && !(e.buttons&1))cancelPress(e);
    if(!press || press.id!==e.pointerId){
      if(working){
        hitsObject(e);surface.toggleAttribute('data-shelf-control',Boolean(control));
      }else if(active==='plant'&&hitsObject(e)&&part==='springtail'){
        life.inspect(part,active,null,'hover');redraw();
      }
      return;
    }
    const dx=e.clientX-press.x,dy=e.clientY-press.y;
    if(!press.dragging){
      if(Math.hypot(dx,dy)<=6)return;
      press.dragging=true;
      surface.classList.add('is-turning');
    }
    const x=dx*press.sensitivity,y=dy*press.sensitivity;
    if(working?.drag(press.control,x,y,stand.quaternion))redraw();
    else if((active==='archive'||active==='proof')&&life.pullSlip(press.part,x,y))redraw();
    else {
      if(active==='plant')life.brushLeaf(press.part,x,y);
      rotate(x,y);
    }
    press.x=e.clientX;press.y=e.clientY;
  });
  surface.addEventListener('click',e=>{
    const started=tap;tap=null;
    if(!e.detail||!started||!source)return;
    const onObject=hitsObject(e);
    if(!onObject && !started.onObject)close();
    else if(onObject && started.onObject){
      if(active.startsWith('room-'))followPoster();
      else if(!working?.activate(control,motion.matches))life.inspect(part,active,null,'tap');
      if(active==='cup')use.textContent=life.cupAction();
      redraw();
    }
  });
  surface.addEventListener('pointerup',e=>{
    if(press?.id!==e.pointerId)return;
    const ended=press;cancelPress();
    if(ended.dragging){
      if(active==='archive'||active==='proof')life.pullSlip(ended.part,0,0,true);
    }else if(Math.hypot(e.clientX-ended.x,e.clientY-ended.y)<=6)tap=ended;
  });
  function cancelPress(e){
    if(e && press?.id!==e.pointerId)return;
    const ended=press;
    press=null;tap=null;surface.classList.remove('is-turning');
    if(ended && surface.hasPointerCapture(ended.id))surface.releasePointerCapture(ended.id);
  }
  surface.addEventListener('pointercancel',cancelPress);
  surface.addEventListener('pointerleave',()=>delete surface.dataset.shelfControl);
  surface.addEventListener('lostpointercapture',cancelPress);
  window.addEventListener('blur',()=>cancelPress());
  window.addEventListener('hashchange',close);
  function paint(time,dt){
    if(!active || !dialog.open)return false;
    const model=getModel();
    const detail=active==='plane'?'airframe':active+'-volume';
    const item=model.details.get(detail)||(model.targets.get(active)?.preview||model.targets.get(active)?.root)||model.details.get(active);
    const ratio=stage.clientWidth/stage.clientHeight;
    if(source!==item || ratio!==aspect){
      const firstPickup=!source;
      aspect=ratio;source=item;releasePrint();stand.clear();
      const copy=item.clone(true);
      copy.position.set(0,0,0);copy.quaternion.identity();copy.scale.setScalar(1);
      const box=new T.Box3().setFromObject(copy,true),center=box.getCenter(new T.Vector3());
      radius=box.getBoundingSphere(new T.Sphere()).radius;copy.position.sub(center);stand.add(copy);
      working=shelfInspection(copy);
      if(working)surface.setAttribute('aria-label',turnLabel+' Press Enter to '+working.label+'.');
      if(active.startsWith('room-'))loadPrint(copy,model.targets.get(active));
      snapshot?.dispose();
      snapshot=new T.WebGLRenderTarget(Math.round(480*Math.min(ratio,1)),Math.round(480*Math.min(1/ratio,1)));
      snapshot.texture.generateMipmaps=true;snapshot.texture.minFilter=T.LinearMipmapLinearFilter;
      const showing=item.visible;
      item.visible=false;
      engine.setRenderTarget(snapshot);engine.render(room,deskCamera);engine.setRenderTarget(null);
      item.visible=showing;
      copy.visible=true;backdrop.uniforms.frame.value=snapshot.texture;
      display.environment=room.environment;display.environmentIntensity=room.environmentIntensity;
      display.environmentRotation.copy(room.environmentRotation);
      camera.aspect=ratio;camera.updateProjectionMatrix();
      const halfAngle=Math.tan(T.MathUtils.degToRad(camera.fov/2));
      fitDistance=radius/Math.sin(Math.atan(halfAngle*Math.min(1,ratio)))*1.06;
      if(firstPickup && !motion.matches){
        const r=surface.getBoundingClientRect(), anchor=opener?.getBoundingClientRect();
        const halfHeight=fitDistance*halfAngle;
        liftStarted=time;
        liftScale=anchor?.width ? T.MathUtils.clamp(Math.max(anchor.width,anchor.height)/(.65*Math.min(r.width,r.height)),.14,.72) : .70;
        liftOffset.set(anchor?.width ? ((anchor.x+anchor.width/2-r.x)/r.width*2-1)*halfHeight*ratio : 0,
          anchor?.height ? (1-(anchor.y+anchor.height/2-r.y)/r.height*2)*halfHeight : -halfHeight*.25);
      }
    }
    zoom=Math.abs(zoom-zoomTarget)<.002||motion.matches?zoomTarget:
      T.MathUtils.lerp(zoom,zoomTarget,1-Math.exp(-dt*32));
    camera.position.z=fitDistance/Math.exp(zoom);
    const progress=motion.matches?1:Math.min(1,(time-liftStarted)/170);
    const remaining=(1-progress)**3;
    backdrop.uniforms.focus.value=1-remaining;
    stand.position.set(liftOffset.x*remaining,liftOffset.y*remaining,0);
    stand.scale.setScalar(T.MathUtils.lerp(1,liftScale,remaining));
    life.updateInspection(stand);
    const volume=stand.children[0];
    if(active==='archive'||active==='proof'){
      volume.position.set(0,-radius*.70,0);
      volume.quaternion.identity();
    }
    stand.rotation.set(pitch,yaw,0,'YXZ');
    const partMoving=working?.paint(time,dt,stand.quaternion,motion.matches);
    engine.render(display,camera);
    if(progress<1||zoom!==zoomTarget||partMoving)redraw();
    return true;
  }
  return {paint,close,open,active:()=>active};
}
