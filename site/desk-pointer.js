// Keep the browser cursor at its real hotspot. Only an orbit owns the pointer.
export function attachDeskPointer(stage,{pick,track,orbitBy,endOrbit,part,gesture,tapPart}) {
  const canvas=stage.querySelector('canvas');
  const targets=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]));
  let press=null, frame=0, x=0, y=0, suppress=false;
  const active=()=>stage.classList.contains('is-rendered') && !stage.closest('.desk-overview').inert;
  function targetAt(clientX,clientY){
    const r=canvas.getBoundingClientRect();
    if(clientX<r.left||clientX>=r.right||clientY<r.top||clientY>=r.bottom)return null;
    const target=targets.get(pick((clientX-r.left)/r.width,(clientY-r.top)/r.height));
    return target && !target.hidden ? target : null;
  }
  function endPress(cancelled=false){
    if(press && canvas.hasPointerCapture(press.id))canvas.releasePointerCapture(press.id);
    if(press?.dragging)endOrbit(performance.now(),cancelled);
    press=null;stage.classList.remove('looking-around');
  }
  function leave(){
    endPress(true);cancelAnimationFrame(frame);frame=0;
    delete stage.dataset.aim;
  }
  function aim(e){
    if(e.pointerType!=='mouse')return;
    x=e.clientX;y=e.clientY;
    if(!frame)frame=requestAnimationFrame(()=>{
      frame=0;
      if(active() && !press && !document.querySelector('dialog[open]')){
        const r=stage.getBoundingClientRect();track((x-r.left)/r.width*2-1,(y-r.top)/r.height*2-1);
      }
      stage.dataset.aim=active() && targetAt(x,y) ? 'object':'desk';
    });
  }
  stage.addEventListener('pointerdown',e=>{
    if(!active()||!e.isPrimary||e.button!==0||e.target.closest('.loose-file-slip'))return;
    suppress=false;
    const target=targetAt(e.clientX,e.clientY);
    press={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,dragging:false,part:part()||target?.dataset.object};
  });
  stage.addEventListener('pointermove',e=>{
    if(!active())return;
    if(press?.id===e.pointerId && e.buttons){
      const dx=e.clientX-press.x,dy=e.clientY-press.y;
      if(!press.dragging && Math.hypot(dx,dy)>7){
        press.dragging=true;canvas.setPointerCapture(e.pointerId);stage.classList.add('looking-around');
      }
      if(press.dragging){
        const x=(e.clientX-press.lastX)/stage.clientWidth,y=(e.clientY-press.lastY)/stage.clientHeight;
        if(!gesture(press.part,x,y,e.timeStamp))orbitBy(x,y,e.timeStamp);
        press.lastX=e.clientX;press.lastY=e.clientY;return;
      }
    }
    aim(e);
  });
  stage.addEventListener('touchmove',e=>{
    if(press?.dragging && e.touches.length===1 && e.cancelable)e.preventDefault();
  },{passive:false});
  stage.addEventListener('pointerup',e=>{
    if(press?.id!==e.pointerId)return;
    suppress=press.dragging || Boolean(press.part && tapPart(press.part));
    endPress();if(active())aim(e);
  });
  stage.addEventListener('pointercancel',leave);
  canvas.addEventListener('lostpointercapture',e=>{
    if(press?.id!==e.pointerId)return;
    suppress=true;
    endPress(true);
  });
  stage.addEventListener('pointerleave',()=>{if(!press?.dragging)leave();});
  stage.addEventListener('dragstart',e=>{if(active())e.preventDefault();});
  stage.addEventListener('click',e=>{
    if(!active() || !e.detail || e.button!==0 || e.target.closest('.loose-file-slip'))return;
    const target=suppress ? null : targetAt(e.clientX,e.clientY);
    suppress=false;
    if(target===e.target.closest('[data-object]') && target)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!target)return;
    // A raycast lamp click only toggles the light. Tab still focuses its button.
    if (target.dataset.object !== 'lamp') target.focus({preventScroll:true});
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey){
      target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey,altKey:e.altKey}));
    } else target.click();
  },true);
  window.addEventListener('blur',leave);
  document.addEventListener('portfolio-view',leave);
  return leave;
}
