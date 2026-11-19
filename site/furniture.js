import * as T from './vendor/three/three.module.min.js';
import { furnish } from './desk-model.js';

export function mountFurniture(stage) {
  const canvas = stage.querySelector('canvas');
  const engine = new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  const gl=engine.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  engine.setPixelRatio(Math.min(devicePixelRatio, software ? .85 : 1.7));
  engine.shadowMap.enabled=true;
  engine.shadowMap.type=T.PCFSoftShadowMap;
  engine.shadowMap.autoUpdate=false;
  engine.toneMapping=T.ACESFilmicToneMapping;engine.toneMappingExposure=1.03;
  const scene=new T.Scene();scene.background=new T.Color(0xc7bc9e);
  const camera=new T.PerspectiveCamera(43,1,.10,42);
  const sky=new T.HemisphereLight(0xfff5df,0xd0bec0,1.95);scene.add(sky);
  const sun=new T.DirectionalLight(0xffedd4,2.12);
  sun.position.set(-4.7,7.7,4.6);sun.target.position.set(0,.6,-.3);sun.castShadow=true;
  sun.shadow.mapSize.setScalar(software?768:2048);
  Object.assign(sun.shadow.camera,{left:-6.7,right:6.7,top:4.8,bottom:-4.8,near:.3,far:19});
  sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=2;
  scene.add(sun,sun.target);
  const fill=new T.DirectionalLight(0xe3ecff,.49);fill.position.set(5,3,-1);scene.add(fill);
  const bulb=new T.PointLight(0xffce8a,0,8,2);scene.add(bulb);
  // A studio reflection map for glazed ceramic, the oscilloscope and brass hardware.
  const lightMap=document.createElement('canvas');lightMap.width=256;lightMap.height=128;
  const lc=lightMap.getContext('2d'),gradient=lc.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,'#c2c6ca');gradient.addColorStop(.53,'#aba39a');gradient.addColorStop(1,'#705842');
  lc.fillStyle=gradient;lc.fillRect(0,0,256,128);lc.fillStyle='#fff8e8';lc.fillRect(28,20,41,64);
  lc.fillStyle='#655a54';lc.fillRect(46,20,2,64);lc.fillRect(28,51,41,2);
  const environment=new T.CanvasTexture(lightMap);environment.mapping=T.EquirectangularReflectionMapping;
  environment.colorSpace=T.SRGBColorSpace;scene.environment=environment;scene.environmentIntensity=.41;
  const section=stage.closest('.desk-overview');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const narrow=matchMedia('(max-width: 660px), (max-aspect-ratio: 6/5)');
  const links=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]));
  const vector=new T.Vector3(), point=new T.Vector3(), aim=new T.Vector3();
  const ray=new T.Raycaster(),mouse=new T.Vector2();
  let model,frame=0,visible=true,dirty=true,drawerOpen=false,drawerAmount=0,opened='',fileAngle=0,bookAngle=0;
  let hovered='',pointerX=0,pointerY=0,tiltX=0,tiltY=0;
  let timeline=0,lastTime=0,lampOn=false;
  let drag=null,orbit=0,blockClick=false;
  function redraw() {
    dirty=true;
    if (visible && !frame) frame=requestAnimationFrame(paint);
  }
  function rebuild() {
    if(model){
      scene.remove(model.world);
      const textures=new Set(),materials=new Set(),geometries=new Set();
      model.world.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);if(m.material.map)textures.add(m.material.map);}});
      textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    }
    model=furnish(scene,narrow.matches,redraw);
    model.lamp.localToWorld(bulb.position.set(-.24,1.13,.24));engine.shadowMap.needsUpdate=true;redraw();
  }
  function layout() {
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    engine.setSize(w,h,false);camera.aspect=w/h;
    camera.fov=narrow.matches?Math.min(73,Math.max(49,2*Math.atan(.355/camera.aspect)*180/Math.PI)):43;
    camera.updateProjectionMatrix();redraw();
  }
  function projectTargets() {
    for(const [id,{root,point:local,w,h}] of model.targets) {
      const el=links.get(id);
      point.copy(local);root.localToWorld(point);vector.copy(point).project(camera);
      const x=(vector.x+1)*.5*stage.clientWidth,y=(1-vector.y)*.5*stage.clientHeight;
      const cameraZ=-point.applyMatrix4(camera.matrixWorldInverse).z;
      const px=stage.clientHeight/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*cameraZ);
      el.style.setProperty('--screen-x',x.toFixed(1)+'px');
      el.style.setProperty('--screen-y',y.toFixed(1)+'px');
      el.style.setProperty('--hit-width',Math.max(40,w*px*.83).toFixed(1)+'px');
      el.style.setProperty('--hit-height',Math.max(37,h*px*.68).toFixed(1)+'px');
      el.toggleAttribute('data-outside',x<10||x>stage.clientWidth-10||y<12||y>stage.clientHeight-10);
    }
  }
  function paint(time) {
    frame=0;
    if(!visible||!model||!dirty)return;
    dirty=false;
    const dt=Math.min(.06,Math.max(.016,(time-lastTime)/1000));lastTime=time;
    const amount=(motion.matches||software)?1:1-Math.exp(-dt*12);
    const target=(value,goal)=>Math.abs(value-goal)<.004?goal:T.MathUtils.lerp(value,goal,amount);
    const prevDrawer=drawerAmount,prevFile=fileAngle,prevBook=bookAngle;
    drawerAmount=target(drawerAmount,Number(drawerOpen));fileAngle=target(fileAngle,opened==='catalogue'?1:0);bookAngle=target(bookAngle,opened==='about'?1:0);
    model.drawer.position.z=2.17+drawerAmount*1.53;
    model.flap.rotation.x=-fileAngle*2.10;model.cover.rotation.z=bookAngle*2.40;
    if((prevDrawer!==drawerAmount && (drawerAmount===0||drawerAmount===1)) ||
       (prevFile!==fileAngle && (fileAngle===0||fileAngle===1)) ||
       (prevBook!==bookAngle && (bookAngle===0||bookAngle===1)))engine.shadowMap.needsUpdate=true;
    const rect=section.getBoundingClientRect();
    const progress=motion.matches?.40:T.MathUtils.clamp(-rect.top/Math.max(1,rect.height-stage.clientHeight),0,1);
    timeline=progress*progress*(3-2*progress);
    tiltX=target(tiltX,motion.matches?0:pointerX);tiltY=target(tiltY,motion.matches?0:pointerY);
    const phone=narrow.matches;
    camera.position.set((phone?.36:.82)*(1-timeline)+tiltX*.15,
      (phone?3.95:3.82)+timeline*.68+tiltY*.09,
      (phone?6.30:6.64)-timeline*.48+drawerAmount*.92);
    aim.set((phone?0:.025)+tiltX*.07,(phone?.66:1.03)-timeline*(phone?.78:1.02)-drawerAmount*.24,.02+timeline*.53+drawerAmount*.66);
    const reach=camera.position.z-aim.z;
    camera.position.x+=Math.sin(orbit)*reach;
    camera.position.z-=reach*(1-Math.cos(orbit));
    camera.lookAt(aim);camera.updateMatrixWorld();
    scene.updateMatrixWorld(true);projectTargets();engine.render(scene,camera);
    stage.classList.add('is-rendered');
    if(drawerAmount!==Number(drawerOpen)||fileAngle!==(opened==='catalogue'?1:0)||bookAngle!==(opened==='about'?1:0)||Math.abs(tiltX-pointerX)>.005||Math.abs(tiltY-pointerY)>.005)redraw();
  }
  function pick(event) {
    const r=stage.getBoundingClientRect();
    mouse.set((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);
    ray.setFromCamera(mouse,camera);
    const first=ray.intersectObject(model.world,true)[0];
    for(let m=first?.object;m;m=m.parent)if(m.userData.pick)return m.userData.pick;
    return '';
  }
  function highlight(id) {
    if(hovered===id)return;
    links.get(hovered)?.removeAttribute('data-hover');hovered=id;links.get(id)?.setAttribute('data-hover','');
    canvas.style.cursor=id?'pointer':'default';
  }
  stage.addEventListener('pointermove',e=>{
    if(drag && drag.id===e.pointerId){
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!drag.moved && Math.abs(dx)>9 && Math.abs(dx)>Math.abs(dy)){
        drag.moved=true;stage.setPointerCapture(e.pointerId);stage.classList.add('looking-around');
      }
      if(drag.moved){orbit=T.MathUtils.clamp(drag.angle-dx/stage.clientWidth*.87,-.33,.33);redraw();return;}
    }
    if(e.pointerType!=='mouse')return;
    if(!motion.matches&&!software){const r=stage.getBoundingClientRect();pointerX=T.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);pointerY=T.MathUtils.clamp((e.clientY-r.top)/r.height*2-1,-1,1);redraw();}
    highlight(e.target.closest('[data-object]')?.dataset.object || (e.target===canvas?pick(e):''));
  });
  stage.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0||e.target.closest('.shelf-return'))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle:orbit,moved:false};blockClick=false;
  });
  function release(e){
    if(!drag||drag.id!==e.pointerId)return;
    blockClick=drag.moved;drag=null;stage.classList.remove('looking-around');
    if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
  }
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  stage.addEventListener('click',e=>{
    if(blockClick&&e.detail){e.preventDefault();e.stopImmediatePropagation();blockClick=false;}
  },true);
  stage.addEventListener('dragstart',e=>{if(e.target.closest('[data-object]'))e.preventDefault();});
  stage.addEventListener('pointerleave',()=>{highlight('');pointerX=pointerY=0;redraw();});
  canvas.addEventListener('click',e=>{const id=pick(e);if(id&&!links.get(id).hidden)links.get(id).click();});
  const lamp=links.get('lamp');lamp.hidden=false;
  lamp.addEventListener('click',()=>{
    lampOn=!lampOn;lamp.setAttribute('aria-pressed',String(lampOn));
    lamp.querySelector('span').textContent=lampOn?'Turn off the lamp':'Turn on the lamp';
    bulb.intensity=lampOn?22:0;sky.intensity=lampOn?.95:1.95;sun.intensity=lampOn?.80:2.12;
    redraw();
  });
  const drawer=links.get('drawer'),keepsake=links.get('keepsake');
  drawer.hidden=false;
  drawer.addEventListener('click',()=>{
    drawerOpen=!drawerOpen;drawer.setAttribute('aria-expanded',String(drawerOpen));
    drawer.querySelector('span').textContent=drawerOpen?'Close the drawer':'Pull the drawer';
    keepsake.hidden=!drawerOpen;redraw();
    if(drawerOpen&&drawer.matches(':focus-visible'))keepsake.focus({preventScroll:true});
  });
  section.closest('#studio').addEventListener('desk-room',e=>{opened=e.detail||'';redraw();});
  let lastProgress=-1;
  window.addEventListener('scroll',()=>{
    if(!visible||motion.matches||opened||document.querySelector('.open-project[open]'))return;
    const r=section.getBoundingClientRect();
    const fraction=T.MathUtils.clamp(-r.top/Math.max(1,r.height-stage.clientHeight),0,1);
    if(Math.abs(fraction-lastProgress)>.001){lastProgress=fraction;redraw();}
  },{passive:true});
  const watcher=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)redraw();});
  watcher.observe(stage);
  new ResizeObserver(layout).observe(stage);
  narrow.addEventListener('change',rebuild);
  motion.addEventListener('change',()=>{pointerX=pointerY=0;redraw();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.remove('is-rendered');links.forEach(el=>el.removeAttribute('data-outside'));drawer.hidden=true;keepsake.hidden=true;lamp.hidden=true;});
  canvas.addEventListener('webglcontextrestored',()=>{drawer.hidden=false;keepsake.hidden=!drawerOpen;lamp.hidden=false;engine.shadowMap.needsUpdate=true;redraw();});
  rebuild();layout();redraw();
}
