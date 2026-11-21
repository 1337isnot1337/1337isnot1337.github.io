import * as T from './vendor/three/three.module.min.js';
import { furnish } from './desk-model.js?v=26';
import { inspectDeskObjects } from './desk-inspect.js?v=11';

import { attachDeskPointer } from './desk-pointer.js?v=15';

import { deskLife } from './desk-life.js?v=12';
import { deskView } from './desk-view.js?v=2';
import { drawerTravel } from './desk-drawer.js?v=1';

export function mountFurniture(stage,showGraphicsFallback) {
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
  const bulb=new T.PointLight(0xffce8a,0,8,2);
  const beam=new T.SpotLight(0xffd39a,0,8,.72,.85,1.9);
  scene.add(bulb,beam,beam.target);
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
  let narrow=false,viewWidth=0,viewHeight=0,needsLayout=true;
  const links=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]));
  const vector=new T.Vector3(), point=new T.Vector3(), aim=new T.Vector3();
  const ray=new T.Raycaster(),mouse=new T.Vector2();
  let model,frame=0,visible=true,dirty=true,drawerAmount=0,opened='',fileAngle=0,bookAngle=0;
  const drawer=links.get('drawer');
  const travel=drawerTravel(drawer.getAttribute('aria-expanded')==='true');
  const hitGroups=new Map(),bounds=new T.Box3(),intersection=new T.Vector3();
  let lastTime=0,lampOn=false;
  let contextLost=false;
  const view=deskView();
  let gazeX=0, gazeY=0, targetX=0, targetY=0;
  const life=deskLife(stage,()=>model,redraw,motion);
  const inspector=inspectDeskObjects(stage,engine,scene,camera,()=>model,redraw,life);
  let ambientTimer=0;
  let lastPart='',pickedUp='',pickupTravel=0,centered='',centerUntil=0;
  function redraw() {
    dirty=true;
    if (visible && !contextLost && !document.hidden && !frame) frame=requestAnimationFrame(renderFrame);
  }
  function renderFrame(time) {
    try { paint(time); }
    catch (error) { suspendDesk();console.error("Desk rendering failed",error); }
  }
  function rebuild() {
    if(model){
      scene.remove(model.world);model.contactMap.dispose();
      const textures=new Set(),materials=new Set(),geometries=new Set();
      model.world.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);for(const value of Object.values(m.material))if(value?.isTexture)textures.add(value);}});
      textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    }
    model=furnish(scene,narrow,redraw,software);hitGroups.clear();extraMeshes.length=0;
    stage.closest('#studio').dispatchEvent(new Event('desk-sketch-request'));
    try{
      const destination=sessionStorage.getItem('desk-return');
      if(destination && model.targets.has(destination)){
        faceObject(destination);
        sessionStorage.removeItem('desk-return');
      }
    }catch{}
    model.world.traverse(mesh=>{
      if(!mesh.isMesh)return;
      let owner=mesh.parent;
      while(owner && !owner.userData.pick)owner=owner.parent;
      if(!owner){
        if(mesh.parent.userData.detail && !['wall','hutch-back','under-eye','pupil','brass-aside','moth'].includes(mesh.parent.userData.detail))extraMeshes.push(mesh);
        return;
      }
      const id=owner.userData.pick;
      if(!hitGroups.has(id))hitGroups.set(id,{meshes:[],box:new T.Box3()});
      hitGroups.get(id).meshes.push(mesh);
    });
    model.bulbGlass.emissiveIntensity=lampOn?2.2:.08;
    model.lamp.localToWorld(bulb.position.set(-.24,1.13,.24));engine.shadowMap.needsUpdate=true;
  }
  function layout() {
    if(!needsLayout)return true;
    const w=stage.clientWidth,h=stage.clientHeight;
    // Some browsers briefly collapse a background or captured page to a 1px viewport.
    if(w<2 || h<2 || window.innerHeight<2)return false;
    needsLayout=false;
    if(w===viewWidth && h===viewHeight)return true;
    viewWidth=w;viewHeight=h;
    const compact=w<=660 || w/h<=1.2;
    if(!model || narrow!==compact){narrow=compact;rebuild();}
    engine.setSize(w,h,false);camera.aspect=w/h;
    camera.fov=narrow?Math.min(73,Math.max(49,2*Math.atan(.355/camera.aspect)*180/Math.PI)):
      Math.max(43,2*Math.atan(Math.tan(T.MathUtils.degToRad(21.5))*1.60/camera.aspect)*180/Math.PI);
    camera.updateProjectionMatrix();return true;
  }
  const targetStyles=new Map();
  const targetProperties=['--screen-x','--screen-y','--hit-width','--hit-height'];
  function projectTargets() {
    const lens=viewHeight/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
    for(const [id,{root,point:local,w,h}] of model.targets) {
      const el=links.get(id);
      point.copy(local).applyMatrix4(root.matrixWorld);
      const depth=-vector.copy(point).applyMatrix4(camera.matrixWorldInverse).z;
      vector.copy(point).project(camera);
      const x=(vector.x+1)*.5*viewWidth,y=(1-vector.y)*.5*viewHeight;
      const outside=depth<=camera.near||x<10||x>viewWidth-10||y<12||y>viewHeight-10;
      if(el.hasAttribute('data-outside')!==outside)el.toggleAttribute('data-outside',outside);
      if(outside)continue;
      const px=lens/depth;
      const next=[x,y,Math.max(40,w*root.scale.x*px*.83),Math.max(37,h*root.scale.y*px*.68)].map(value=>Math.round(value*10));
      const old=targetStyles.get(id);
      for(const [i,property] of targetProperties.entries()){
        if(old?.[i]!==next[i])el.style.setProperty(property,(next[i]/10)+'px');
      }
      targetStyles.set(id,next);
    }
  }
  let boundedModel=null;
  function paint(time) {
    frame=0;
    if(!visible||contextLost||document.hidden||!dirty||!layout()||!lightReady)return;
    dirty=false;

    const dt=Math.min(.06,Math.max(.016,(time-lastTime)/1000));lastTime=time;
    const amount=(motion.matches||software)?1:1-Math.exp(-dt*12);
    const target=(value,goal)=>Math.abs(value-goal)<.004?goal:T.MathUtils.lerp(value,goal,amount);
    const prevDrawer=drawerAmount,prevFile=fileAngle,prevBook=bookAngle;
    const drawerMotion=travel.step(dt,motion.matches||software);
    drawerAmount=drawerMotion.amount;
    life.drawerMomentum(drawerMotion.impulse);
    const folderGoal=life.folderPose(opened==='catalogue');
    fileAngle=target(fileAngle,folderGoal);bookAngle=target(bookAngle,opened==='about'?1:0);
    model.drawer.position.z=2.17+drawerAmount*1.53;
    model.flap.rotation.x=-fileAngle*1.22;model.cover.rotation.z=bookAngle*2.40;
    if((prevDrawer!==drawerAmount && (drawerAmount===0||drawerAmount===1)) ||
       (prevFile!==fileAngle && (fileAngle===0||fileAngle===1)) ||
       (prevBook!==bookAngle && (bookAngle===0||bookAngle===1)))engine.shadowMap.needsUpdate=true;
    const posture=view.step(dt,motion.matches);
    const held=inspector.active();
    const events=life.update(time,dt,drawerAmount,lampOn,held,posture,fileAngle);
    const shade=model.details.get('shade');
    shade.localToWorld(bulb.position.set(0,-.22,0));
    shade.localToWorld(beam.target.position.set(0,-2.8,0));
    beam.position.copy(bulb.position);
    bulb.intensity=lampOn?13*events.warm:0;
    beam.intensity=lampOn?11*events.warm:0;
    if(inspector.paint()){
      if(events.active && !document.hidden)redraw();
      return;
    }
    // A sun patch and the resting moth can advance without an idle render loop.
    if(!ambientTimer&&!document.hidden&&!opened){
      const delay=Math.min(events.wakeAt ? Math.max(90,events.wakeAt-time) : Infinity,motion.matches?Infinity:9000);
      if(Number.isFinite(delay))ambientTimer=setTimeout(()=>{ambientTimer=0;redraw();},delay);
    }
    const phone=narrow;
    camera.position.set(phone?.22:.70, (phone?4.19:4.06)+drawerAmount*.12, (phone?6.13:6.47)+drawerAmount*1.52);
    aim.set(phone?0:.025,(phone?.40:.67)-drawerAmount*.53,.21+drawerAmount*.77);
    const ease=motion.matches?1:1-Math.exp(-dt*18);
    gazeX=Math.abs(gazeX-targetX)<.009?targetX:T.MathUtils.lerp(gazeX,targetX,ease);
    gazeY=Math.abs(gazeY-targetY)<.009?targetY:T.MathUtils.lerp(gazeY,targetY,ease);
    camera.position.x+=gazeX*.30;camera.position.y-=gazeY*.17;
    aim.x+=gazeX*.125;aim.y-=gazeY*.065;
    camera.position.y-=posture.below*5.88;
    aim.y-=posture.below*2.83;
    const offsetX=camera.position.x-aim.x;
    const offsetZ=camera.position.z-aim.z;
    const sin=Math.sin(posture.yaw),cos=Math.cos(posture.yaw);
    camera.position.x=aim.x+offsetX*cos+offsetZ*sin;
    camera.position.z=aim.z+offsetZ*cos-offsetX*sin;
    const sunChanged=Math.abs(sun.position.x+4.7-events.drift)>.045;
    if(sunChanged)sun.position.x=-4.7+events.drift;
    model.daylight.value=events.drift;
    const centeredObject=centerUntil>time&&model.targets.get(centered);
    if(centeredObject){
      const focus=centeredObject.root.localToWorld(point.copy(centeredObject.point));
      const strength=motion.matches?1:Math.max(0,Math.min(1,(centerUntil-time)/740));
      aim.lerp(focus,strength);
    }
    if(!software&&(detailMoved||sunChanged))engine.shadowMap.needsUpdate=true;
    camera.lookAt(aim);engine.render(scene,camera);projectTargets();
    if(!stage.classList.contains('is-rendered') || prevDrawer!==drawerAmount || prevFile!==fileAngle || prevBook!==bookAngle || model!==boundedModel || events.active || detailMoved){
      detailMoved=false;
      for(const group of hitGroups.values()){
        group.box.makeEmpty();
        for(const mesh of group.meshes)group.box.union(bounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
      }
      boundedModel=model;
    }
    if(!stage.classList.contains('is-rendered')){
      stage.classList.remove('is-loading');stage.classList.add('is-rendered');
      if(software)warning.textContent='The desk is using software rendering. Enable graphics acceleration for smoother movement.';
      warning.hidden=!software;
      lamp.hidden=false;links.get('plant').hidden=false;
    }
    if((events.active && !document.hidden) || (centeredObject && !motion.matches) || posture.move || gazeX!==targetX||gazeY!==targetY||drawerMotion.moving||fileAngle!==folderGoal||bookAngle!==(opened==='about'?1:0))redraw();
  }
  function faceObject(id){
    if(!model?.targets.has(id))return;
    view.faceFront();
    centered=id;
    centerUntil=performance.now()+3150;
    redraw();
  }
  document.addEventListener('desk-return-target',event=>{
    if(document.documentElement.dataset.view==='desk')faceObject(event.detail);
  });
  let detailMoved=false;
  const extraMeshes=[];
  const shown=mesh=>{for(let n=mesh;n;n=n.parent)if(!n.visible)return false;return true;};
  const candidates=[],hits=[];
  const leaveDesk=attachDeskPointer(stage,{
    track(x,y) {
      life.pointerMoved(x,y,performance.now());
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
      candidates.length=0;hits.length=0;lastPart='';
      for(const [id,{meshes,box}] of hitGroups){
        if(links.get(id).hidden || !ray.ray.intersectsBox(box))continue;
        for(const mesh of meshes)if(shown(mesh))candidates.push(mesh);
      }
      for(const mesh of extraMeshes)if(shown(mesh))candidates.push(mesh);
      const [first]=ray.intersectObjects(candidates,false,hits);
      if(!first)return '';
      for(const box of model.occluders){
        if(ray.ray.intersectBox(box,intersection) && ray.ray.origin.distanceTo(intersection)<first.distance-.012)return '';
      }
      let owner=first.object;
      while(owner){
        lastPart ||= owner.userData.detail||'';
        if(owner.userData.pick){
          const id=owner.userData.pick;
          if(!lastPart&&id.endsWith('-print')){
            const local=owner.worldToLocal(point.copy(first.point));
            const {w,h}=model.targets.get(id);
            if(Math.abs(local.x)>.33*w&&local.y<-.29*h)lastPart='print-corner-'+id;
          }
          return id;
        }
        owner=owner.parent;
      }
      return '';
    },
    part(){return lastPart;},
    tapPart(name){
      const labels={
        'drawer-note':'A complaint from the furniture',
        'crumb-plan':'The drawer’s structural plans',
        screw:'The spare screw', shim:'Shims and other published equations'
      };
      if(labels[name]){
        if(name==='drawer-note')life.pullComplaint(.08);
        inspector.open(name,labels[name]);
        return true;
      }
      return life.tap(name);
    },
    gesture(name,dx,dy,time){
      if(name==='handle'){
        travel.drag(dy,time);redraw();return true;
      }
      if(name==='drawer-note'){
        pickedUp=name;pickupTravel-=Math.abs(dx)*.45+Math.abs(dy);
        life.pullComplaint(-pickupTravel);
        detailMoved=true;redraw();return true;
      }
      if(['airframe','scope','proof-volume','archive-volume'].includes(name)){
        if(pickedUp!==name){pickedUp=name;pickupTravel=0;}
        pickupTravel+=dy;
        if(name!=='airframe')return true;
      }
      if(name?.endsWith('-print') && !name.startsWith('pin-clip-')){
        life.movePrint(name,dx,dy);detailMoved=true;redraw();return true;
      }
      if(name?.startsWith('leaf-')&&life.brushLeaf(name,dx*35,dy*35)){
        detailMoved=true;redraw();return true;
      }
      const gesture=life.gestures[name];
      if(!gesture)return false;
      gesture(dx,dy,time);detailMoved=true;redraw();return true;
    },
    orbitBy(delta,vertical,time) {
      centerUntil=0;
      view.drag(delta,vertical,time);
      if(Math.abs(delta)+Math.abs(vertical)>.035)life.startleMoth(time);
      redraw();
    },
    endOrbit(time,cancelled) {
      view.release(time,cancelled);
      life.releaseProps(cancelled);
      const drawerRelease=travel.release(time,cancelled);
      if(drawerRelease){
        stage.dispatchEvent(new CustomEvent('drawer-position',{detail:drawerRelease.target}));
        if(drawerRelease.target===0&&drawerRelease.hadTravel)
          life.drawerChange(false,drawerRelease.velocity,true);
      }
      if(cancelled){
        pickedUp='';pickupTravel=0;
        redraw();return;
      }
      if(pickedUp==='drawer-note'&&pickupTravel<-.038)inspector.open('drawer-note','A complaint from the furniture');
      if(pickupTravel<-.085){
        if(pickedUp==='airframe')inspector.open('plane','DOPPLERGEIST model airplane','Open DOPPLERGEIST');
        if(pickedUp==='scope')inspector.open('scope','Oscilloscope','Open the experiments');
        if(pickedUp==='proof-volume')inspector.open('proof','Solved conjectures','Open Solved Conjectures');
        if(pickedUp==='archive-volume')inspector.open('archive','Research notes','Open the research notes');
      }
      pickedUp='';pickupTravel=0;
      redraw();
    }
  });
  const lamp=links.get('lamp');
  lamp.addEventListener('click',()=>{
    lampOn=!lampOn;life.lampChange(lampOn);lamp.setAttribute('aria-pressed',String(lampOn));
    model.bulbGlass.emissiveIntensity=lampOn?2.2:.08;
    bulb.intensity=lampOn?22:0;sky.intensity=lampOn?.95:1.95;sun.intensity=lampOn?.80:2.12;
    redraw();
  });
  stage.addEventListener('drawer-change',()=>{
    const open=drawer.getAttribute('aria-expanded')==='true';
    travel.toggle(open);
    life.drawerChange(open,open?1:-1,false);
    redraw();
  });
  section.closest('#studio').addEventListener('desk-room',e=>{opened=e.detail||'';if(opened)leaveDesk();redraw();});
  function resized(){needsLayout=true;redraw();}
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;if(visible)resized();else leaveDesk();
  }).observe(stage);
  if('ResizeObserver' in window)new ResizeObserver(resized).observe(stage);
  window.addEventListener('resize',resized);
  document.addEventListener('portfolio-view',resized);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)redraw();});
  motion.addEventListener('change',redraw);
  function suspendDesk() {
    contextLost=true;leaveDesk();warning.textContent=unavailable;
    showGraphicsFallback();
    links.forEach(el=>el.removeAttribute('data-outside'));
    inspector.close();lamp.hidden=true;links.get('plant').hidden=true;
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();suspendDesk();});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;engine.shadowMap.needsUpdate=true;redraw();});
  redraw();
}
