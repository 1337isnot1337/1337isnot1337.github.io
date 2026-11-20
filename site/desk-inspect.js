import * as T from './vendor/three/three.module.min.js';

// One renderer serves the room and the object in hand. Capture the room once per pickup.
export function inspectDeskObjects(stage,engine,room,deskCamera,getModel,redraw,life){
  const dialog=document.querySelector('.object-view'), surface=dialog.querySelector('.turn-surface');
  const use=dialog.querySelector('.use-object');
  const objects={
    plant:['The windowsill cutting'], cup:['The pencil cup','Borrow a pencil'],
    pencil:['Graphite pencil','Draw with it'], 'rose-pencil':['Rose pencil','Draw with it'],
    tape:['Off the clock','Read the liner notes']
  };
  const display=new T.Scene(), camera=new T.PerspectiveCamera(35,1,.02,40);
  const stand=new T.Group();display.add(stand);
  const sky=new T.HemisphereLight(0xfff3db,0xb0a0ad,2.3);display.add(sky);
  for(const [color,strength,x,y,z] of [[0xffead2,2.5,-3,4,5],[0xffdfbb,1.8,3,2,-2]]){
    const light=new T.DirectionalLight(color,strength);light.position.set(x,y,z);display.add(light);
  }
  const backdrop=new T.ShaderMaterial({
    depthWrite:false,depthTest:false,uniforms:{frame:{value:null}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D frame;
      void main(){vec2 d=vec2(.004,.006);vec3 color=.4*textureLod(frame,vUv,2.).rgb;
        color+=.15*(textureLod(frame,vUv+d,2.).rgb+textureLod(frame,vUv-d,2.).rgb+textureLod(frame,vUv+vec2(d.x,-d.y),2.).rgb+textureLod(frame,vUv+vec2(-d.x,d.y),2.).rgb);
        float edge=smoothstep(.13,.73,distance(vUv,vec2(.5,.52)));
        gl_FragColor=vec4(mix(color*.39,vec3(.045,.027,.039),.32+edge*.38),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const screen=new T.Mesh(new T.PlaneGeometry(2,2),backdrop);
  screen.frustumCulled=false;screen.renderOrder=-1000;display.add(screen);
  let active='',source=null,snapshot=null,opener=null,using=false,drag=null;
  let yaw=0,pitch=0,radius=1,aspect=0,backgroundTap=false,dragged=false,part='';
  const ray=new T.Raycaster(),screenPoint=new T.Vector2();
  function hitsObject(e){
    if(!source)return true;
    const r=surface.getBoundingClientRect();
    screenPoint.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
    ray.setFromCamera(screenPoint,camera);
    const hit=ray.intersectObject(stand,true).find(result=>{
      for(let n=result.object;n;n=n.parent)if(!n.visible)return false;
      return true;
    });
    part='';
    for(let n=hit?.object;n&&!part;n=n.parent)part=n.userData.detail||'';
    return Boolean(hit);
  }
  function rotate(dx,dy){
    life.inspect(part,active,{x:dx,y:dy},'turn');
    if(active==='pencil'){
      const flipped=Math.cos(pitch+dy)<-.25;
      document.dispatchEvent(new CustomEvent('desk-eraser',{detail:flipped}));
    }
    yaw+=dx;pitch=T.MathUtils.clamp(pitch+dy,-Math.PI*.94,Math.PI*.94);
    life.inspect(part,active,{yaw,pitch},'pose');
    redraw();
  }
  function open(id,label,action){
    if(dialog.open)return;
    active=id;
    opener=stage.querySelector('[data-object="'+id+'"]');
    dialog.setAttribute('aria-label',label);
    use.hidden=!action;use.textContent=id==='cup'?life.cupAction():action||'';
    yaw=id.includes('pencil')?-.72:-.24;
    pitch=id==='tape'||['drawer-note','crumb-plan','shim','screw'].includes(id)?.90:id.includes('pencil')?.94:id==='cup'?.32:.16;
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
  function close(){if(dialog.open)dialog.close();}
  dialog.querySelector('.put-object-back').onclick=close;
  dialog.addEventListener('close',()=>{
    life.stow(active,yaw);life.inspect('',active,null,'close');active='';source=null;drag=null;stand.clear();snapshot?.dispose();snapshot=null;
    backdrop.uniforms.frame.value=null;stage.classList.remove('inspecting');redraw();
  });
  use.onclick=()=>{
    const returning=life.inspect(part,active,null,'use');
    close();
    if(returning)return;
    using=true;try{opener.click();}finally{using=false;}
  };
  surface.addEventListener('keydown',e=>{
    const turn={ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,-.2],ArrowDown:[0,.2]}[e.key];
    if(turn){e.preventDefault();rotate(...turn);}
  });
  surface.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    dragged=false;backgroundTap=!hitsObject(e);
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,part};surface.setPointerCapture(e.pointerId);
  });
  surface.addEventListener('pointermove',e=>{
    if(!drag || drag.id!==e.pointerId){
      if(active==='plant'&&hitsObject(e)&&part==='springtail'){
        life.inspect(part,active,null,'hover');redraw();
      }
      return;
    }
    if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6){dragged=true;backgroundTap=false;}
    const x=(e.clientX-drag.x)*.012,y=(e.clientY-drag.y)*.012;
    if(active==='tape'&&drag.part.startsWith('reel-'))
      document.dispatchEvent(new CustomEvent('desk-tape',{detail:x-y}));
    else if(active==='plant'&&life.brushLeaf(drag.part,x,y))redraw();
    else if((active==='archive'||active==='proof')&&life.pullSlip(drag.part,x,y))redraw();
    else rotate(x,y);
    drag.x=e.clientX;drag.y=e.clientY;
  });
  surface.addEventListener('click',e=>{if(e.detail && backgroundTap && !hitsObject(e))close();else if(e.detail && !dragged && hitsObject(e)){life.inspect(part,active,null,'tap');if(active==='cup')use.textContent=life.cupAction();}backgroundTap=false;redraw();});
  surface.addEventListener('pointerup',()=>{
    if(drag&&dragged&&(active==='archive'||active==='proof'))life.pullSlip(drag.part,0,0,true);
  });
  surface.addEventListener('pointercancel',()=>{backgroundTap=false;});
  surface.addEventListener('lostpointercapture',()=>{drag=null;});
  surface.addEventListener('touchmove',e=>{if(drag && e.cancelable)e.preventDefault();},{passive:false});
  window.addEventListener('hashchange',close);
  function paint(){
    if(!active || !dialog.open)return false;
    const model=getModel();
    const detail=active==='plane'?'airframe':active+'-volume';
    const item=model.details.get(detail)||model.targets.get(active)?.root||model.details.get(active);
    const ratio=stage.clientWidth/stage.clientHeight;
    if(source!==item || ratio!==aspect){
      aspect=ratio;source=item;stand.clear();
      const copy=item.clone(true);
      copy.position.set(0,0,0);copy.quaternion.identity();copy.scale.setScalar(1);
      const box=new T.Box3().setFromObject(copy,true),center=box.getCenter(new T.Vector3());
      radius=box.getBoundingSphere(new T.Sphere()).radius;copy.position.sub(center);stand.add(copy);
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
      camera.position.z=radius/Math.sin(Math.atan(Math.tan(T.MathUtils.degToRad(17.5))*Math.min(1,ratio)))*1.06;
    }
    life.updateInspection(stand);
    const volume=stand.children[0];
    if(active==='archive'||active==='proof'){
      volume.position.set(0,-radius*.70,0);
      volume.quaternion.identity();
    }
    stand.rotation.set(pitch,yaw,0,'YXZ');
    engine.render(display,camera);
    return true;
  }
  return {paint,close,open,active:()=>active};
}
