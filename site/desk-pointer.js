// Keep the browser cursor at its real hotspot. Only an orbit owns the pointer.
export function attachDeskPointer(stage,{pick,orbitBy,endOrbit}) {
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
  function leave(){
    if(press && canvas.hasPointerCapture(press.id))canvas.releasePointerCapture(press.id);
    if(press?.dragging)endOrbit();
    press=null;cancelAnimationFrame(frame);frame=0;
    delete stage.dataset.aim;stage.classList.remove('looking-around');
  }
  function aim(e){
    if(e.pointerType!=='mouse')return;
    x=e.clientX;y=e.clientY;
    if(!frame)frame=requestAnimationFrame(()=>{
      frame=0;stage.dataset.aim=active() && targetAt(x,y) ? 'object':'desk';
    });
  }
  stage.addEventListener('pointerdown',e=>{
    if(!active()||!e.isPrimary||e.button!==0)return;
    suppress=false;
    press={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,dragging:false};
  });
  stage.addEventListener('pointermove',e=>{
    if(!active())return;
    if(press?.id===e.pointerId && e.buttons){
      const dx=e.clientX-press.x,dy=e.clientY-press.y;
      if(!press.dragging && Math.abs(dx)>6 && Math.abs(dx)>Math.abs(dy)){
        press.dragging=true;canvas.setPointerCapture(e.pointerId);stage.classList.add('looking-around');
      }
      if(press.dragging){orbitBy((e.clientX-press.lastX)/stage.clientWidth);press.lastX=e.clientX;return;}
    }
    aim(e);
  });
  stage.addEventListener('touchmove',e=>{
    if(press?.dragging && e.touches.length===1 && e.cancelable)e.preventDefault();
  },{passive:false});
  stage.addEventListener('pointerup',e=>{
    if(press?.id!==e.pointerId)return;
    suppress=press.dragging;
    leave();if(active())aim(e);
  });
  stage.addEventListener('pointercancel',leave);
  stage.addEventListener('pointerleave',()=>{if(!press?.dragging)leave();});
  stage.addEventListener('dragstart',e=>{if(active())e.preventDefault();});
  stage.addEventListener('click',e=>{
    if(!active() || !e.detail || e.button!==0)return;
    const target=suppress ? null : targetAt(e.clientX,e.clientY);
    suppress=false;
    if(target===e.target.closest('[data-object]') && target)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(!target)return;
    target.focus({preventScroll:true});
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey){
      target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey,altKey:e.altKey}));
    } else target.click();
  },true);
  window.addEventListener('blur',leave);
  document.addEventListener('portfolio-view',leave);
  return leave;
}
