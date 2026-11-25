import * as T from './vendor/three/three.module.min.js';
import { furnish } from './desk-model.js?v=52';
import { inspectDeskObjects } from './desk-inspect.js?v=20';

import { attachDeskPointer } from './desk-pointer.js?v=25';

import { deskLife } from './desk-life.js?v=18';
import { deskView } from './desk-view.js?v=14';
import { drawerTravel } from './desk-drawer.js?v=1';
import { setClock } from './shelf-clock.js?v=1';
import { bindRoomActions } from './room-actions.js?v=3';

export function mountFurniture(stage,showGraphicsFallback,reportProgress) {
  const canvas = stage.querySelector('canvas');
  if (!document.createElement('canvas').getContext('2d'))throw new Error('Canvas drawing unavailable');
  const options={alpha:false,antialias:false,powerPreference:'default'};
  const context=canvas.getContext('webgl2',options);
  if(!context)throw new Error('WebGL 2 unavailable');
  const engine = new T.WebGLRenderer({canvas,context,...options});
  const warning=stage.querySelector('.graphics-warning');
  const unavailable=warning.textContent;
  const gl=engine.getContext();
  const debug=gl.getExtension('WEBGL_debug_renderer_info');
  const software=debug && /swiftshader|llvmpipe/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  const pixelGrid=matchMedia('(forced-colors: none) and (prefers-contrast: no-preference)');
  let movingPixels=false;
  function setResolution(moving=movingPixels){
    movingPixels=moving;
    // Sample the canvas once, in WebGL. DOM text and hit targets stay at native resolution.
    const still=pixelGrid.matches ? (software ? .79 : 1) : (software ? .85 : 1.4);
    const sampleMotion=moving && pixelGrid.matches;
    const motionLimit=software ? .36 : .8;
    const maxPixels=software ? (sampleMotion ? 140000 : 720000) : (sampleMotion ? 1000000 : 2100000);
    const sizeLimit=Math.sqrt(maxPixels/Math.max(1,viewWidth*viewHeight));
    const ratio=Math.min(devicePixelRatio,sampleMotion?motionLimit:still,sizeLimit);
    if(engine.getPixelRatio()!==ratio)engine.setPixelRatio(ratio);
  }
  engine.shadowMap.enabled=!software;
  engine.shadowMap.type=software ? T.BasicShadowMap : T.PCFSoftShadowMap;
  engine.shadowMap.autoUpdate=false;
  engine.toneMapping=T.ACESFilmicToneMapping;engine.toneMappingExposure=1.03;
  const scene=new T.Scene();scene.background=new T.Color(0xc7bc9e);
  const camera=new T.PerspectiveCamera(43,1,.10,62);
  let shadersStarted=false, shadersReady=false;
  const daySky=1.68;
  const sky=new T.HemisphereLight(0xf3f0e5,0xc6ae9d,daySky);scene.add(sky);
  const sun=new T.DirectionalLight(0xffebd2,2.16);
  sun.position.set(-4.7,7.7,4.6);sun.target.position.set(0,.6,-.3);sun.castShadow=true;
  sun.shadow.mapSize.setScalar(1024);
  Object.assign(sun.shadow.camera,{left:-6.7,right:6.7,top:4.8,bottom:-4.8,near:.3,far:19});
  sun.shadow.bias=-.00025;sun.shadow.normalBias=.012;sun.shadow.radius=2;
  scene.add(sun,sun.target);
  const fill=new T.DirectionalLight(0xcce2ef,.74);fill.position.set(5.4,6.2,-8);scene.add(fill);
  const bulb=new T.PointLight(0xffce8a,0,8,2);
  const beam=new T.SpotLight(0xffd39a,0,8,.72,.85,1.9);
  const readingLight=new T.SpotLight(0xffd19a,0,5.7,.79,.76,1.75);
  readingLight.target.position.set(-7.21,-2.3,7.60);
  scene.add(bulb,beam,beam.target,readingLight,readingLight.target);
  const dayColor=sky.color.clone(),nightColor=new T.Color(0xa9bae9);
  const fallbackWash=[];
  if(software)for(const [x,color] of [[-7.8,0xffb283],[7.8,0xc3a9ff]]){
    const reflection=new T.PointLight(color,.35,0,1.15);
    reflection.position.set(x,5.95,2.1);scene.add(reflection);fallbackWash.push(reflection);
  }
  let nightTravel=0;
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
  const drawer=links.get('drawer'), posterSwitch=links.get('poster-switch');
  let posterMode='professional';
  const roomActions=bindRoomActions(links,redraw);
  const travel=drawerTravel(drawer.getAttribute('aria-expanded')==='true');
  const hitGroups=new Map(),bounds=new T.Box3(),intersection=new T.Vector3();
  let lastTime=0,lampOn=false;
  let contextLost=false;
  const view=deskView();
  let gazeX=0, gazeY=0, targetX=0, targetY=0;
  const life=deskLife(stage,()=>model,redraw,motion);
  const inspector=inspectDeskObjects(stage,engine,scene,camera,()=>model,redraw,life,motion);
  let ambientTimer=0,clockTimer=0;
  function scheduleClock() {
    if(!clockTimer)clockTimer=setTimeout(()=>{
      clockTimer=0;redraw();
    },1003-Date.now()%1000);
  }
  let lastPart='',pickedUp='',pickupTravel=0,centered='',centerUntil=0;
  function redraw() {
    dirty=true;
    if (visible && !contextLost && !document.hidden && !frame) frame=requestAnimationFrame(renderFrame);
  }
  function renderFrame(time) {
    try { paint(time); }
    catch (error) { suspendDesk();console.error("Desk rendering failed",error); }
  }
  let building=false;
  async function rebuild(compact) {
    const initialPosters=posterMode;
    const next=await furnish(scene,compact,redraw,software,initialPosters);
    if(initialPosters!==posterMode)next.showPosters(posterMode);
    const firstBuild=!model;
    if(model){
      scene.remove(model.world);model.contactMap.dispose();
      const textures=new Set(),materials=new Set(),geometries=new Set();
      const collect=m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);for(const value of Object.values(m.material))if(value?.isTexture)textures.add(value);}};
      model.world.traverse(collect);
      for(const item of model.roomProps.values())item.preview.traverse(collect);
      textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
    }
    viewWidth=0;narrow=compact;model=next;hitGroups.clear();extraMeshes.length=0;
    readingLight.position.copy(model.readingBulb);
    roomActions.mount(model);
    model.posterCap.position.y=posterMode==='frivolous'?.034:.053;
    const navigation=stage.querySelector('.desk-objects');
    for(const [id,{root}] of model.roomProps){
      if(links.has(id))continue;
      const button=document.createElement('button');
      button.type='button';button.dataset.object=id;button.dataset.roomProp='';
      button.hidden=true;button.setAttribute('aria-label',root.userData.roomProp);
      button.addEventListener('click',()=>inspector.open(id,root.userData.roomProp));
      navigation.append(button);links.set(id,button);
    }
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
    if(firstBuild)reportProgress(4);
  }
  function layout() {
    if(!needsLayout)return true;
    const w=stage.clientWidth,h=stage.clientHeight;
    // Some browsers briefly collapse a background or captured page to a 1px viewport.
    if(w<2 || h<2 || window.innerHeight<2)return false;
    const compact=w<=660 || w/h<=1.2;
    if(building)return false;
    if(!model || narrow!==compact){
      building=true;
      rebuild(compact).catch(error=>{
        suspendDesk();console.error('Desk construction failed',error);
      }).finally(()=>{building=false;needsLayout=true;redraw();});
      return false;
    }
    needsLayout=false;
    if(w===viewWidth && h===viewHeight)return true;
    viewWidth=w;viewHeight=h;targetStyles.clear();
    setResolution();engine.setSize(w,h,false);camera.aspect=w/h;
    camera.fov=narrow?Math.min(73,Math.max(49,2*Math.atan(.355/camera.aspect)*180/Math.PI)):
      Math.max(43,2*Math.atan(Math.tan(T.MathUtils.degToRad(21.5))*1.60/camera.aspect)*180/Math.PI);
    camera.updateProjectionMatrix();return true;
  }
  const targetStyles=new Map(),projectedCamera=new T.Matrix4(),projectedLens=new T.Matrix4();
  const targetProperties=['--screen-x','--screen-y','--hit-width','--hit-height'];
  const onScreen=(depth,x,y)=>depth>camera.near&&x>=10&&x<=viewWidth-10&&y>=12&&y<=viewHeight-10;
  function projectTargets() {
    const lens=viewHeight*camera.zoom/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
    const moved=!projectedCamera.equals(camera.matrixWorld) || !projectedLens.equals(camera.projectionMatrix);
    projectedCamera.copy(camera.matrixWorld);projectedLens.copy(camera.projectionMatrix);
    for(const [id,{root,point:local,w,h}] of model.targets) {
      const el=links.get(id);
      if((root.userData.roomPoster&&!root.visible)||(el===posterSwitch&&drawerAmount<.54)){
        el.hidden=true;
        targetStyles.delete(id);
        continue;
      }
      const saved=targetStyles.get(id);
      if(!moved && saved?.root===root && saved.matrix.equals(root.matrixWorld))continue;
      point.copy(local).applyMatrix4(root.matrixWorld);
      let depth=-vector.copy(point).applyMatrix4(camera.matrixWorldInverse).z;
      vector.copy(point).project(camera);
      let x=(vector.x+1)*.5*viewWidth,y=(1-vector.y)*.5*viewHeight;
      if(!onScreen(depth,x,y)&&root.userData.visibleAnchors){
        for(const anchor of root.userData.visibleAnchors){
          point.copy(anchor).applyMatrix4(root.matrixWorld);
          depth=-vector.copy(point).applyMatrix4(camera.matrixWorldInverse).z;
          vector.copy(point).project(camera);
          x=(vector.x+1)*.5*viewWidth;y=(1-vector.y)*.5*viewHeight;
          if(onScreen(depth,x,y))break;
        }
      }
      const outside=!onScreen(depth,x,y);
      if((root.userData.roomPoster||root.userData.roomProp||el===posterSwitch||el.hasAttribute('data-room-fixture'))&&el.hidden!==outside)el.hidden=outside;
      if(el.hasAttribute('data-outside')!==outside)el.toggleAttribute('data-outside',outside);
      const state=saved||{matrix:new T.Matrix4(),rect:[]};
      state.root=root;state.matrix.copy(root.matrixWorld);
      if(!saved)targetStyles.set(id,state);
      if(outside)continue;
      const px=lens/depth;
      vector.setFromMatrixScale(root.matrixWorld);
      const next=[x,y,Math.max(40,w*vector.x*px*.83),Math.max(37,h*vector.y*px*.68)].map(value=>Math.round(value*10));
      for(const [i,property] of targetProperties.entries()){
        if(state.rect[i]!==next[i])el.style.setProperty(property,(next[i]/10)+'px');
      }
      state.rect=next;
    }
  }
  let boundedModel=null,hovered='';
  const previews=new Map();
  const hoverable=new Set([
    'plane','file','proof','archive','scope','book','letters','drawer','lamp','plant',
    'pencil','rose-pencil','cup','blotter','pinboard','robot-photo','epoch',
  ]);
  const peek=id=>previews.get(id)||0;
  function paint(time) {
    frame=0;
    if(!visible||contextLost||document.hidden||!dirty)return;
    // A paper dialog keeps the last canvas frame as its backdrop.
    if(document.querySelector('dialog[open]:not(.object-view)'))return;
    if(!layout()||!lightReady)return;
    if(!shadersReady){
      if(!shadersStarted){
        shadersStarted=true;
        engine.compileAsync(scene,camera).then(()=>{shadersReady=true;redraw();},error=>{
          suspendDesk();console.error('Desk shader preparation failed',error);
        });
      }
      return;
    }
    dirty=false;

    const elapsed=Math.max(.001,(time-lastTime)/1000);lastTime=time;
    const dt=Math.min(.06,Math.max(.016,elapsed));
    const nightGoal=Number(lampOn);
    if(nightTravel!==nightGoal){
      const step=Math.min(.055,elapsed)/(motion.matches?.38:1.65);
      nightTravel=lampOn?Math.min(1,nightTravel+step):Math.max(0,nightTravel-step);
    }
    const night=T.MathUtils.smoothstep(nightTravel,0,1);
    model.night.value=night;
    model.details.get('lamp-switch').rotation.z=.15-night*.67;
    sky.color.lerpColors(dayColor,nightColor,night);
    sky.intensity=T.MathUtils.lerp(daySky,.56,night);
    sun.intensity=T.MathUtils.lerp(2.16,.12,night);
    fill.intensity=T.MathUtils.lerp(.74,.35,night);
    if(!software)scene.environmentIntensity=T.MathUtils.lerp(6.4,2.8,night);
    for(const {lens,color} of model.coves)lens.color.copy(color).multiplyScalar(.58+night*.83);
    for(const reflection of fallbackWash)reflection.intensity=.35+night*4.2;
    const amount=(motion.matches||software)?1:1-Math.exp(-dt*12);
    const target=(value,goal)=>Math.abs(value-goal)<.004?goal:T.MathUtils.lerp(value,goal,amount);
    const roomMotion=roomActions.paint({time,dt,night,nightGoal,reduced:motion.matches,ease:target});
    readingLight.intensity=roomMotion.readingLevel*25;
    sun.intensity*=1-roomMotion.drapes*.42;
    detailMoved ||= roomMotion.geometryMoved;
    const prevDrawer=drawerAmount,prevFile=fileAngle,prevBook=bookAngle;
    const held=inspector.active();
    const currentTime=new Date();
    for(const hands of model.roomClocks.values())setClock(hands,currentTime);
    if(model.roomClocks.has(held))scheduleClock();
    const reading=held||opened||document.querySelector('dialog[open]');
    const preview=reading?'':hovered;
    if(reading)view.look(0,0);
    let previewMoved=false,previewMoving=false;
    for(const [id,value] of previews){
      const goal=Number(preview===id),next=target(value,goal);
      previewMoved ||= next!==value;
      previewMoving ||= next!==goal;
      previews.set(id,next);
    }
    model.details.get('proof-volume').position.z=-1.56+peek('proof')*.102;
    model.details.get('archive-volume').position.z=-1.56+peek('archive')*.102;
    model.scopeScreen.emissiveIntensity=.035+peek('scope')*.46;
    const drawerMotion=travel.step(dt,motion.matches||software);
    drawerAmount=drawerMotion.amount;
    life.drawerMomentum(drawerMotion.impulse);
    const folderGoal=Math.max(life.folderPose(opened==='catalogue'),peek('file')*.23);
    const notebookGoal=Math.max(Number(opened==='about'),peek('book')*.16);
    fileAngle=target(fileAngle,folderGoal);bookAngle=target(bookAngle,notebookGoal);
    model.drawer.position.z=2.17+drawerAmount*1.53+(1-drawerAmount)*peek('drawer')*.043;
    model.flap.rotation.x=-fileAngle*1.22;model.cover.rotation.z=bookAngle*2.40;
    if((prevDrawer!==drawerAmount && (drawerAmount===0||drawerAmount===1)) ||
       (prevFile!==fileAngle && fileAngle===folderGoal) || (previewMoved && !previewMoving) ||
       (prevBook!==bookAngle && (bookAngle===0||bookAngle===1)))engine.shadowMap.needsUpdate=true;
    const posture=view.step(Math.min(.12,elapsed),motion.matches);
    const events=life.update(time,dt,drawerAmount,lampOn,held,posture,fileAngle,previews);
    for(const [id,value] of previews){
      model.poseHover(id,value);
      if(value===0 && preview!==id)previews.delete(id);
    }
    const shade=model.details.get('shade');
    shade.localToWorld(bulb.position.set(0,-.22,0));
    shade.localToWorld(beam.target.position.set(0,-2.8,0));
    beam.position.copy(bulb.position);
    const warmth=night*events.warm;
    const lightScale=model.deskScale**2;
    bulb.intensity=(14*warmth+peek('lamp')*.40)*lightScale;
    beam.intensity=16*warmth*lightScale;
    model.bulbGlass.emissiveIntensity=.08+2.12*warmth+peek('lamp')*.31;
    if(held && movingPixels)setResolution(false);
    if(inspector.paint(time,dt)){
      if((events.active || nightTravel!==nightGoal) && !document.hidden)redraw();
      return;
    }
    // A sun patch and the resting moth can advance without an idle render loop.
    if(!ambientTimer&&!document.hidden&&!opened){
      const delay=Math.min(events.wakeAt ? Math.max(90,events.wakeAt-time) : Infinity,motion.matches?Infinity:9000);
      if(Number.isFinite(delay))ambientTimer=setTimeout(()=>{ambientTimer=0;redraw();},delay);
    }
    const phone=narrow;
    camera.position.set(phone?.22:.70, (phone?4.19:4.06)+drawerAmount*.12, (phone?6.13:6.72)+drawerAmount*1.52);
    aim.set(phone?0:.025,(phone?.40:.96)-drawerAmount*.53,.21+drawerAmount*.77);
    const ease=motion.matches?1:1-Math.exp(-dt*18);
    gazeX=Math.abs(gazeX-targetX)<.009?targetX:T.MathUtils.lerp(gazeX,targetX,ease);
    gazeY=Math.abs(gazeY-targetY)<.009?targetY:T.MathUtils.lerp(gazeY,targetY,ease);
    camera.position.x+=gazeX*.30;camera.position.y-=gazeY*.17;
    aim.x+=gazeX*.125;aim.y-=gazeY*.065;
    const under=Math.max(0,posture.below),up=Math.max(0,-posture.below);
    const wallView=Math.sin(posture.yaw)**2;
    camera.position.y+=up*.5-under*5.88;
    aim.y+=-under*2.83+wallView*.85*(1-under);
    const offsetX=camera.position.x-aim.x;
    const offsetZ=camera.position.z-aim.z;
    if(up){
      const distance=Math.hypot(offsetX,offsetZ);
      const initialPitch=Math.atan2(aim.y-camera.position.y,distance);
      const elevation=T.MathUtils.lerp(initialPitch,Math.PI*.28,posture.above);
      aim.y=camera.position.y+Math.tan(elevation)*distance;
    }
    const sin=Math.sin(posture.yaw),cos=Math.cos(posture.yaw);
    // Orbit within the room in front of the desk. Past either side, look
    // outward toward the rest of the room from that same walkable arc.
    const walkSin=.95*sin,walkCos=Math.sqrt(1-walkSin*walkSin);
    camera.position.x=aim.x+offsetX*walkCos+offsetZ*walkSin;
    camera.position.z=aim.z+offsetZ*walkCos-offsetX*walkSin;
    aim.x=camera.position.x-offsetX*cos-offsetZ*sin;
    aim.z=camera.position.z-offsetZ*cos+offsetX*sin;
    camera.position.applyMatrix4(model.desk.matrixWorld);
    aim.applyMatrix4(model.desk.matrixWorld);
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
    if(camera.zoom!==posture.zoom){camera.zoom=posture.zoom;camera.updateProjectionMatrix();}
    setResolution(Boolean(posture.move||drawerMotion.moving));
    camera.lookAt(aim);engine.render(scene,camera);projectTargets();
    if(!opened){
      for(const id of model.roomClocks.keys()){
        if(!links.get(id).hidden){scheduleClock();break;}
      }
    }
    if(!stage.classList.contains('is-rendered') || prevDrawer!==drawerAmount || prevFile!==fileAngle || prevBook!==bookAngle || model!==boundedModel || events.active || detailMoved || previewMoved){
      detailMoved=false;
      boundsDirty=true;
      boundedModel=model;
    }
    if(!stage.classList.contains('is-rendered')){
      reportProgress(5);
      stage.classList.remove('is-loading');stage.classList.add('is-rendered');
      if(software)warning.textContent='The desk is using software rendering. Enable graphics acceleration for smoother movement.';
      warning.hidden=!software;
      lamp.hidden=false;links.get('plant').hidden=false;
    }
    if(posture.move)refreshHover(time);
    if((events.active && !document.hidden) || (centeredObject && !motion.matches) || posture.move || gazeX!==targetX||gazeY!==targetY||drawerMotion.moving||fileAngle!==folderGoal||bookAngle!==notebookGoal||previewMoving||roomMotion.moving||nightTravel!==nightGoal)redraw();
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
  let detailMoved=false,boundsDirty=true;
  function refreshBounds(){
    if(!boundsDirty)return;
    for(const group of hitGroups.values()){
      group.box.makeEmpty();
      for(const mesh of group.meshes)group.box.union(bounds.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));
    }
    boundsDirty=false;
  }
  const extraMeshes=[];
  const shown=mesh=>{for(let n=mesh;n;n=n.parent)if(!n.visible)return false;return true;};
  const candidates=[],hits=[];
  const {leave:leaveDesk,refreshHover}=attachDeskPointer(stage,{
    targets:links,
    hover(id){
      const next=hoverable.has(id)||id.endsWith('-print')||model?.targets.get(id)?.root.userData.roomPoster?id:'';
      if(next!==hovered){
        hovered=next;
        if(next&&!previews.has(next))previews.set(next,0);
        redraw();
      }
    },
    zoomBy(delta){view.wheel(delta);redraw();},
    stopLook(){view.look(0,0);},
    track(x,y,overObject) {
      life.pointerMoved(x,y,performance.now());
      if(view.look(x,y,overObject)){
        centerUntil=0;
        redraw();
      }
      if(motion.matches){x=0;y=0;}
      if(software){
        stage.style.setProperty('--pan-x',(x*0.6)+'%');
        stage.style.setProperty('--pan-y',(y*0.6)+'%');
        stage.classList.toggle('soft-pan',!motion.matches);
      }else if(x!==targetX||y!==targetY){targetX=x;targetY=y;redraw();}
    },
    pick(x,y) {
      refreshBounds();
      mouse.set(x*2-1,1-y*2);
      ray.setFromCamera(mouse,camera);
      candidates.length=0;hits.length=0;lastPart='';
      for(const [id,{meshes,box}] of hitGroups){
        if(links.get(id).hidden || !ray.ray.intersectsBox(box))continue;
        for(const mesh of meshes)if(shown(mesh))candidates.push(mesh);
      }
      for(const mesh of extraMeshes)if(shown(mesh))candidates.push(mesh);
      const [first]=ray.intersectObjects(candidates,false,hits);
      let nearest=first?.distance??Infinity, prop='';
      for(const [id,item] of model.roomProps){
        if(links.get(id).hidden||!ray.ray.intersectBox(item.bounds,intersection))continue;
        const distance=ray.ray.origin.distanceTo(intersection);
        if(distance<nearest){nearest=distance;prop=id;}
      }
      if(!Number.isFinite(nearest))return '';
      for(const box of model.occluders){
        if(ray.ray.intersectBox(box,intersection) && ray.ray.origin.distanceTo(intersection)<nearest-.012)return '';
      }
      if(prop)return prop;
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
    gesture(name,dx,dy,time,start){
      // Covers and handles have a vertical grip. A sideways drag can pass
      // across them just like a drag that starts on the desk surface.
      if(start==='horizontal' && ['handle','scope','proof-volume','archive-volume','file','file-cover','book'].includes(name))return false;
      if(start==='down' && ['scope','proof-volume','archive-volume','file','file-cover'].includes(name))return false;
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
      view.drag(-delta*.76,vertical);
      if(Math.abs(delta)+Math.abs(vertical)>.035)life.startleMoth(time);
      redraw();
    },
    endOrbit(time,cancelled) {
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
    redraw();
  });
  stage.addEventListener('drawer-change',()=>{
    const open=drawer.getAttribute('aria-expanded')==='true';
    travel.toggle(open);
    life.drawerChange(open,open?1:-1,false);
    redraw();
  });
  posterSwitch.addEventListener('click',()=>{
    if(posterSwitch.hidden||!model)return;
    const frivolous=posterMode==='professional';
    posterMode=frivolous?'frivolous':'professional';
    posterSwitch.setAttribute('aria-pressed',String(frivolous));
    model.showPosters(posterMode);
    model.posterCap.position.y=frivolous?.034:.053;
    targetStyles.clear();
    boundsDirty=true;
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
  document.addEventListener('close',redraw,true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)redraw();});
  motion.addEventListener('change',redraw);
  pixelGrid.addEventListener('change',()=>{
    setResolution();redraw();
  });
  function suspendDesk() {
    contextLost=true;leaveDesk();warning.textContent=unavailable;
    targetStyles.clear();
    showGraphicsFallback();
    links.forEach(el=>{
      el.removeAttribute('data-outside');
      if(el.matches('[data-room-prop],[data-room-poster],[data-room-fixture]'))el.hidden=true;
    });
    inspector.close();lamp.hidden=true;links.get('plant').hidden=true;
    posterSwitch.hidden=true;
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();suspendDesk();});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;engine.shadowMap.needsUpdate=true;redraw();});
  redraw();
}
