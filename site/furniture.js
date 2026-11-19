import * as T from './vendor/three/three.module.min.js';
import { furnish } from './desk-model.js?v=8';
import { inspectDeskObjects } from './desk-inspect.js?v=2';

import { attachDeskPointer } from './desk-pointer.js?v=9';

export function mountFurniture(stage) {
  const canvas = stage.querySelector('canvas');
  if (!document.createElement('canvas').getContext('2d'))throw new Error('Canvas drawing unavailable');
  const engine = new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});
  const warning=stage.querySelector('.graphics-warning');
  const unavailable=warning.textContent;
  const gl=engine.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  engine.setPixelRatio(Math.min(devicePixelRatio, software ? .85 : 1.4));
  engine.shadowMap.enabled=!software;
  engine.shadowMap.type=software ? T.BasicShadowMap : T.PCFSoftShadowMap;
  engine.shadowMap.autoUpdate=false;
  engine.toneMapping=T.ACESFilmicToneMapping;engine.toneMappingExposure=1.03;
  const scene=new T.Scene();scene.background=new T.Color(0xc7bc9e);
  const camera=new T.PerspectiveCamera(43,1,.10,42);
  const sky=new T.HemisphereLight(0xfff5df,0xd0bec0,1.95);scene.add(sky);
  const sun=new T.DirectionalLight(0xffedd4,2.12);
  sun.position.set(-4.7,7.7,4.6);sun.target.position.set(0,.6,-.3);sun.castShadow=true;
  sun.shadow.mapSize.setScalar(1024);
  Object.assign(sun.shadow.camera,{left:-6.7,right:6.7,top:4.8,bottom:-4.8,near:.3,far:19});
  sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=2;
  scene.add(sun,sun.target);
  const fill=new T.DirectionalLight(0xe3ecff,.49);fill.position.set(5,3,-1);scene.add(fill);
  const bulb=new T.PointLight(0xffce8a,0,8,2);scene.add(bulb);
  // The workshop panorama is already convolved for each roughness level.
  // The atlas stores linear radiance / 16 encoded as sRGB, with row zero at the bottom.
  let lightReady=Boolean(software);
  if(!software)new T.TextureLoader().load('assets/furniture/workshop-light.webp', atlas => {
    atlas.mapping=T.CubeUVReflectionMapping;atlas.colorSpace=T.SRGBColorSpace;
    atlas.flipY=false;atlas.generateMipmaps=false;atlas.minFilter=T.LinearFilter;
    scene.environment=atlas;scene.environmentRotation.y=1.20;scene.environmentIntensity=.40*16;
    lightReady=true;redraw();
  },undefined,()=>{lightReady=true;redraw();});
  const section=stage.closest('.desk-overview');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let narrow=false,viewWidth=0,viewHeight=0;
  const links=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]));
  const vector=new T.Vector3(), point=new T.Vector3(), aim=new T.Vector3();
  const ray=new T.Raycaster(),mouse=new T.Vector2();
  let model,frame=0,visible=true,dirty=true,drawerOpen=stage.querySelector('[data-object="drawer"]').getAttribute('aria-expanded')==='true',drawerAmount=0,opened='',fileAngle=0,bookAngle=0;
  const hitGroups=new Map(),bounds=new T.Box3(),intersection=new T.Vector3();
  let lastTime=0,lampOn=false;
  let orbit=0, contextLost=false;
  let orbitPreview=0, gazeX=0, gazeY=0, targetX=0, targetY=0;
  const inspector=inspectDeskObjects(stage,engine,scene,camera,()=>model,redraw);
  function redraw() {
    dirty=true;
    if (visible && !contextLost && !frame) frame=requestAnimationFrame(paint);
  }
  function rebuild() {
    if(model){
      scene.remove(model.world);model.contactMap.dispose();
      const textures=new Set(),materials=new Set(),geometries=new Set();
      model.world.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);for(const value of Object.values(m.material))if(value?.isTexture)textures.add(value);}});
      textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    }
    model=furnish(scene,narrow,redraw,software);hitGroups.clear();
    model.world.traverse(mesh=>{
      if(!mesh.isMesh)return;
      let owner=mesh.parent;
      while(owner && !owner.userData.pick)owner=owner.parent;
      if(!owner)return;
      const id=owner.userData.pick;
      if(!hitGroups.has(id))hitGroups.set(id,{meshes:[],box:new T.Box3()});
      hitGroups.get(id).meshes.push(mesh);
    });
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
  let boundedModel=null;
  function paint(time) {
    frame=0;
    if(!visible||contextLost||!dirty||!layout()||!lightReady)return;
    dirty=false;
    if(inspector.paint())return;
    const dt=Math.min(.06,Math.max(.016,(time-lastTime)/1000));lastTime=time;
    const amount=(motion.matches||software)?1:1-Math.exp(-dt*12);
    const target=(value,goal)=>Math.abs(value-goal)<.004?goal:T.MathUtils.lerp(value,goal,amount);
    const prevDrawer=drawerAmount,prevFile=fileAngle,prevBook=bookAngle;
    drawerAmount=target(drawerAmount,Number(drawerOpen));fileAngle=target(fileAngle,opened==='catalogue'?1:0);bookAngle=target(bookAngle,opened==='about'?1:0);
    model.drawer.position.z=2.17+drawerAmount*1.53;
    model.flap.rotation.x=-fileAngle*1.22;model.cover.rotation.z=bookAngle*2.40;
    if((prevDrawer!==drawerAmount && (drawerAmount===0||drawerAmount===1)) ||
       (prevFile!==fileAngle && (fileAngle===0||fileAngle===1)) ||
       (prevBook!==bookAngle && (bookAngle===0||bookAngle===1)))engine.shadowMap.needsUpdate=true;
    const phone=narrow;
    camera.position.set(phone?.22:.70, (phone?4.19:4.06)+drawerAmount*.12, (phone?6.13:6.47)+drawerAmount*1.52);
    aim.set(phone?0:.025,(phone?.40:.67)-drawerAmount*.53,.21+drawerAmount*.77);
    const ease=motion.matches?1:1-Math.exp(-dt*18);
    gazeX=Math.abs(gazeX-targetX)<.009?targetX:T.MathUtils.lerp(gazeX,targetX,ease);
    gazeY=Math.abs(gazeY-targetY)<.009?targetY:T.MathUtils.lerp(gazeY,targetY,ease);
    camera.position.x+=gazeX*.30;camera.position.y-=gazeY*.17;
    aim.x+=gazeX*.125;aim.y-=gazeY*.065;
    const reach=camera.position.z-aim.z;
    camera.position.x+=Math.sin(orbit)*reach;
    camera.position.z-=reach*(1-Math.cos(orbit));
    camera.lookAt(aim);engine.render(scene,camera);projectTargets();
    if(!stage.classList.contains('is-rendered') || prevDrawer!==drawerAmount || prevFile!==fileAngle || prevBook!==bookAngle || model!==boundedModel){
      for(const group of hitGroups.values()){
        group.box.makeEmpty();
        for(const mesh of group.meshes)group.box.union(bounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
      }
      boundedModel=model;
    }
    if(!stage.classList.contains('is-rendered')){
      stage.classList.add('is-rendered');
      if(software)warning.textContent='The desk is using software rendering. Enable graphics acceleration for smoother movement.';
      warning.hidden=!software;
      lamp.hidden=false;links.get('plant').hidden=false;
    }
    if(gazeX!==targetX||gazeY!==targetY||drawerAmount!==Number(drawerOpen)||fileAngle!==(opened==='catalogue'?1:0)||bookAngle!==(opened==='about'?1:0))redraw();
  }
  const leaveDesk=attachDeskPointer(stage,{
    track(x,y) {
      if(motion.matches){x=0;y=0;}
      if(software){
        stage.style.setProperty('--pan-x',(x*0.6)+'%');
        stage.style.setProperty('--pan-y',(y*0.6)+'%');
        stage.classList.toggle('soft-pan',!motion.matches);
      }else if(x!==targetX||y!==targetY){targetX=x;targetY=y;redraw();}
    },
    pick(x,y) {
      mouse.set(x*2-1,1-y*2);
      ray.setFromCamera(mouse,camera);
      const hits=[];
      for(const [id,{meshes,box}] of hitGroups){
        if(!links.get(id).hidden && ray.ray.intersectsBox(box))ray.intersectObjects(meshes,false,hits);
      }
      if(!hits.length)return '';
      const first=hits[0];
      for(const box of model.occluders){
        if(ray.ray.intersectBox(box,intersection) && ray.ray.origin.distanceTo(intersection)<first.distance-.012)return '';
      }
      let owner=first.object;
      while(!owner.userData.pick)owner=owner.parent;
      return owner.userData.pick;
    },
    orbitBy(delta) {
      const next=T.MathUtils.clamp(orbit-delta*.87,-.33,.33);
      if(software){
        // Keep slow CPU rasterizers off the pointer path. The compositor previews the pan.
        orbitPreview+=next-orbit;
        canvas.style.transform='scale(1.045) translateX('+(-orbitPreview*3.2)+'%)';
      } else redraw();
      orbit=next;
    },
    endOrbit() {
      if(software){orbitPreview=0;canvas.style.transform='';redraw();}
    }
  });
  const lamp=links.get('lamp');
  lamp.addEventListener('click',()=>{
    lampOn=!lampOn;lamp.setAttribute('aria-pressed',String(lampOn));
    model.bulbGlass.emissiveIntensity=lampOn?2.2:.08;
    bulb.intensity=lampOn?22:0;sky.intensity=lampOn?.95:1.95;sun.intensity=lampOn?.80:2.12;
    redraw();
  });
  const drawer=links.get('drawer');
  stage.addEventListener('drawer-change',()=>{
    drawerOpen=drawer.getAttribute('aria-expanded')==='true';redraw();
  });
  section.closest('#studio').addEventListener('desk-room',e=>{opened=e.detail||'';if(opened)leaveDesk();redraw();});
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;if(visible)redraw();else leaveDesk();
  }).observe(stage);
  if('ResizeObserver' in window)new ResizeObserver(redraw).observe(stage);
  window.addEventListener('resize',redraw);
  motion.addEventListener('change',redraw);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;leaveDesk();warning.textContent=unavailable;warning.hidden=false;stage.classList.remove('is-rendered');links.forEach(el=>el.removeAttribute('data-outside'));inspector.close();lamp.hidden=true;links.get('plant').hidden=true;});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;engine.shadowMap.needsUpdate=true;redraw();});
  redraw();
}
