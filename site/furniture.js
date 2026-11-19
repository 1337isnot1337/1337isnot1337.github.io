import * as T from './vendor/three/three.module.min.js';
import { furnish } from './desk-model.js?v=4';

import { attachDeskPointer } from './desk-pointer.js?v=4';
import { HDRLoader } from './vendor/three/HDRLoader.js';

export function mountFurniture(stage) {
  const canvas = stage.querySelector('canvas');
  if (!document.createElement('canvas').getContext('2d'))throw new Error('Canvas drawing unavailable');
  const engine = new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  const warning=stage.querySelector('.graphics-warning');
  const unavailable=warning.textContent;
  const gl=engine.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  engine.setPixelRatio(Math.min(devicePixelRatio, software ? .85 : 1.7));
  engine.shadowMap.enabled=true;
  engine.shadowMap.type=software ? T.BasicShadowMap : T.PCFSoftShadowMap;
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
  if(!software)new HDRLoader().load('assets/furniture/workshop.hdr', texture => {
    texture.mapping=T.EquirectangularReflectionMapping;
    scene.environment=texture;
    scene.environmentRotation.y=1.20;
    scene.environmentIntensity=.40;
    redraw();
  });
  const section=stage.closest('.desk-overview');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let narrow=false,viewWidth=0,viewHeight=0;
  const links=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]));
  const vector=new T.Vector3(), point=new T.Vector3(), aim=new T.Vector3();
  const ray=new T.Raycaster(),mouse=new T.Vector2();
  let model,frame=0,visible=true,dirty=true,drawerOpen=false,drawerAmount=0,opened='',fileAngle=0,bookAngle=0;
  let pointerX=0,pointerY=0,tiltX=0,tiltY=0;
  let timeline=0,lastTime=0,lampOn=false;
  let orbit=0, contextLost=false;
  let qualityTimer=0;
  function redraw() {
    dirty=true;
    if (visible && !contextLost && !frame) frame=requestAnimationFrame(paint);
  }
  // Lower the fragment workload during movement on a software renderer, then restore detail.
  function navigating() {
    if(software && !motion.matches){
      if(!qualityTimer)engine.setPixelRatio(Math.min(devicePixelRatio,.48));
      clearTimeout(qualityTimer);
      qualityTimer=setTimeout(()=>{
        qualityTimer=0;engine.setPixelRatio(Math.min(devicePixelRatio,.85));redraw();
      },400);
    }
    redraw();
  }
  function rebuild() {
    if(model){
      scene.remove(model.world);model.contactMap.dispose();
      const textures=new Set(),materials=new Set(),geometries=new Set();
      model.world.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);for(const value of Object.values(m.material))if(value?.isTexture)textures.add(value);}});
      textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    }
    model=furnish(scene,narrow,redraw);
    model.bulbGlass.emissiveIntensity=lampOn?2.2:.08;
    model.lamp.localToWorld(bulb.position.set(-.24,1.13,.24));engine.shadowMap.needsUpdate=true;
  }
  function layout() {
    const w=stage.clientWidth,h=stage.clientHeight;
    // Some browsers briefly collapse a background or captured page to a 1px viewport.
    if(w<2 || h<2 || window.innerHeight<2)return false;
    if(w===viewWidth && h===viewHeight)return true;
    viewWidth=w;viewHeight=h;
    const compact=w<=660 || w/h<=1.2;
    if(!model || narrow!==compact){narrow=compact;rebuild();}
    engine.setSize(w,h,false);camera.aspect=w/h;
    camera.fov=narrow?Math.min(73,Math.max(49,2*Math.atan(.355/camera.aspect)*180/Math.PI)):43;
    camera.updateProjectionMatrix();return true;
  }
  function projectTargets() {
    const width=stage.clientWidth,height=stage.clientHeight;
    if(!width||!height)return;
    for(const [id,{root,point:local,w,h}] of model.targets) {
      const el=links.get(id);
      point.copy(local);root.localToWorld(point);vector.copy(point).project(camera);
      const x=(vector.x+1)*.5*width,y=(1-vector.y)*.5*height;
      const cameraZ=-point.applyMatrix4(camera.matrixWorldInverse).z;
      const px=height/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*cameraZ);
      el.style.setProperty('--screen-x',x.toFixed(1)+'px');
      el.style.setProperty('--screen-y',y.toFixed(1)+'px');
      el.style.setProperty('--hit-width',Math.max(40,w*px*.83).toFixed(1)+'px');
      el.style.setProperty('--hit-height',Math.max(37,h*px*.68).toFixed(1)+'px');
      el.toggleAttribute('data-outside',x<10||x>width-10||y<12||y>height-10);
    }
  }
  function paint(time) {
    frame=0;
    if(!visible||contextLost||!dirty||!layout())return;
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
    const phone=narrow;
    camera.position.set((phone?.36:.82)*(1-timeline)+tiltX*.15,
      (phone?3.95:3.82)+timeline*.68+tiltY*.09,
      (phone?6.30:6.64)-timeline*.48+drawerAmount*.92);
    aim.set((phone?0:.025)+tiltX*.07,(phone?.66:1.03)-timeline*(phone?.78:1.02)-drawerAmount*.24,.02+timeline*.53+drawerAmount*.66);
    const reach=camera.position.z-aim.z;
    camera.position.x+=Math.sin(orbit)*reach;
    camera.position.z-=reach*(1-Math.cos(orbit));
    camera.lookAt(aim);engine.render(scene,camera);projectTargets();
    if(!stage.classList.contains('is-rendered')){
      stage.classList.add('is-rendered');
      if(software)warning.textContent='The desk is using software rendering. Enable graphics acceleration for smoother movement.';
      warning.hidden=!software;
      lamp.hidden=false;drawer.hidden=false;keepsake.hidden=!drawerOpen;
    }
    if(drawerAmount!==Number(drawerOpen)||fileAngle!==(opened==='catalogue'?1:0)||bookAngle!==(opened==='about'?1:0)||Math.abs(tiltX-pointerX)>.005||Math.abs(tiltY-pointerY)>.005)redraw();
  }
  const leaveDesk=attachDeskPointer(stage,{
    pick(x,y) {
      mouse.set(x*2-1,1-y*2);
      ray.setFromCamera(mouse,camera);
      const first=ray.intersectObject(model.world,true)[0];
      for(let m=first?.object;m;m=m.parent)if(m.userData.pick)return m.userData.pick;
      return '';
    },
    look(x,y) {
      if(software || motion.matches || (x===pointerX && y===pointerY))return;
      pointerX=x;pointerY=y;redraw();
    },
    orbitBy(delta) {orbit=T.MathUtils.clamp(orbit-delta*.87,-.33,.33);navigating();}
  });
  const lamp=links.get('lamp');
  lamp.addEventListener('click',()=>{
    lampOn=!lampOn;lamp.setAttribute('aria-pressed',String(lampOn));
    model.bulbGlass.emissiveIntensity=lampOn?2.2:.08;
    bulb.intensity=lampOn?22:0;sky.intensity=lampOn?.95:1.95;sun.intensity=lampOn?.80:2.12;
    redraw();
  });
  const drawer=links.get('drawer'),keepsake=links.get('keepsake');
  drawer.addEventListener('click',()=>{
    drawerOpen=!drawerOpen;drawer.setAttribute('aria-expanded',String(drawerOpen));

    keepsake.hidden=!drawerOpen;redraw();
    if(drawerOpen&&drawer.matches(':focus-visible'))keepsake.focus({preventScroll:true});
  });
  section.closest('#studio').addEventListener('desk-room',e=>{opened=e.detail||'';if(opened)leaveDesk();redraw();});
  let lastProgress=-1;
  window.addEventListener('scroll',()=>{
    if(document.pointerLockElement===canvas){
      const r=stage.getBoundingClientRect();
      if(r.bottom<innerHeight-2 || r.top>2)leaveDesk();
    }
    if(!visible||motion.matches||opened||document.querySelector('.open-project[open]'))return;
    const r=section.getBoundingClientRect();
    const fraction=T.MathUtils.clamp(-r.top/Math.max(1,r.height-stage.clientHeight),0,1);
    if(Math.abs(fraction-lastProgress)>.001){lastProgress=fraction;navigating();}
  },{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;if(visible)redraw();else leaveDesk();
  }).observe(stage);
  if('ResizeObserver' in window)new ResizeObserver(redraw).observe(stage);
  window.addEventListener('resize',redraw);
  motion.addEventListener('change',()=>{pointerX=pointerY=0;redraw();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;leaveDesk();warning.textContent=unavailable;warning.hidden=false;stage.classList.remove('is-rendered');links.forEach(el=>el.removeAttribute('data-outside'));drawer.hidden=true;keepsake.hidden=true;lamp.hidden=true;});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;engine.shadowMap.needsUpdate=true;redraw();});
  redraw();
}
