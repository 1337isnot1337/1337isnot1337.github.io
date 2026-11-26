import { attachHeldArrows } from './desk-arrows.js?v=1';

// Keep the browser cursor at its real hotspot. Only an orbit owns the pointer.
export function attachDeskPointer(stage,{pick,track,hover=()=>{},stopLook=()=>{},orbitBy,endOrbit,part,gesture,tapPart,zoomBy,targets=new Map([...stage.querySelectorAll('[data-object]')].map(el=>[el.dataset.object,el]))}) {
  const canvas=stage.querySelector('canvas');
  const overview=stage.closest('.desk-overview');
  let press=null, frame=0, x=0, y=0, overControl=false, suppress=false;
  let clickTarget, pointerInside=false, nextCameraPick=0;
  const active=()=>stage.classList.contains('is-rendered') && !overview.inert;
  function setAim(target){
    const aim=target?'object':'desk';
    if(stage.dataset.aim!==aim)stage.dataset.aim=aim;
  }
  function targetAt(clientX,clientY,r=canvas.getBoundingClientRect()){
    if(clientX<r.left||clientX>=r.right||clientY<r.top||clientY>=r.bottom)return null;
    const target=targets.get(pick((clientX-r.left)/r.width,(clientY-r.top)/r.height));
    return target && !target.hidden ? target : null;
  }
  function endPress(cancelled=false){
    const ended=press;
    press=null;stage.classList.remove('looking-around');
    if(ended && stage.hasPointerCapture(ended.id))stage.releasePointerCapture(ended.id);
    if(ended?.mode)endOrbit(performance.now(),cancelled);
  }
  function leave(){
    endPress(true);cancelAnimationFrame(frame);frame=0;
    pointerInside=false;clickTarget=undefined;
    stopLook();hover('');
    delete stage.dataset.aim;
  }
  function aim(e){
    if(e.pointerType!=='mouse')return;
    pointerInside=true;
    x=e.clientX;y=e.clientY;
    overControl=Boolean(e.target.closest('[data-object]'));
    if(!frame)frame=requestAnimationFrame(()=>{
      frame=0;
      const enabled=active();
      const target=enabled && targetAt(x,y);
      if(enabled && !press && !document.querySelector('dialog[open]')){
        const r=stage.getBoundingClientRect();
        hover(target?.dataset.object||'');
        track((x-r.left)/r.width*2-1,(y-r.top)/r.height*2-1,overControl||Boolean(target));
      }
      setAim(target);
    });
  }
  function refreshHover(time){
    if(!pointerInside || press || frame || time<nextCameraPick || !active() || document.querySelector('dialog[open]'))return;
    nextCameraPick=time+100;
    const target=targetAt(x,y);
    hover(target?.dataset.object||'');
    setAim(target);
  }
  stage.addEventListener('pointerdown',e=>{
    if(!active()||!e.isPrimary||e.button!==0||e.target.closest('.loose-file-slip'))return;
    cancelAnimationFrame(frame);frame=0;stopLook();hover('');
    suppress=false;clickTarget=undefined;
    const bounds=canvas.getBoundingClientRect();
    const target=targetAt(e.clientX,e.clientY,bounds);
    press={width:stage.clientWidth,height:stage.clientHeight,id:e.pointerId,lastX:e.clientX,lastY:e.clientY,mode:null,target,part:part()||target?.dataset.object};
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    if(!active())return;
    if(press?.id===e.pointerId){
      if(!(e.buttons&1)){suppress=true;endPress(true);}
      else{
        const dx=e.clientX-press.lastX,dy=e.clientY-press.lastY;
        if(!press.mode && Math.hypot(dx,dy)<=7)return;
        const start=press.mode ? null : Math.abs(dx)>=Math.abs(dy) ? 'horizontal' : dy<0 ? 'up' : 'down';
        const moveX=dx/press.width,moveY=dy/press.height;
        const handled=press.mode!=='orbit' && gesture(press.part,moveX,moveY,e.timeStamp,start);
        if(!press.mode){
          press.mode=handled?'object':'orbit';
          stage.classList.add('looking-around');
        }
        if(press.mode==='orbit')orbitBy(moveX,moveY,e.timeStamp);
        press.lastX=e.clientX;press.lastY=e.clientY;return;
      }
    }
    aim(e);
  });
  stage.addEventListener('wheel',e=>{
    if(!active() || e.ctrlKey || e.metaKey || !e.deltaY || document.querySelector('dialog[open]'))return;
    e.preventDefault();
    const unit=e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1;
    zoomBy(e.deltaY*unit);
  },{passive:false});
  const stopArrows=attachHeldArrows(document,()=>active() && !press &&
    document.documentElement.dataset.view==='desk' && !document.querySelector('dialog[open]'),
  (x,y,time)=>{stopLook();orbitBy(x*1.25,y*.87,time);});
  stage.addEventListener('pointerup',e=>{
    if(press?.id!==e.pointerId)return;
    clickTarget=press.target;
    suppress=Boolean(press.mode || (press.part && tapPart(press.part)));
    endPress();if(active())aim(e);
  });
  stage.addEventListener('pointercancel',e=>{if(press?.id===e.pointerId)leave();});
  stage.addEventListener('lostpointercapture',e=>{
    if(press?.id!==e.pointerId)return;
    suppress=true;
    endPress(true);
  });
  stage.addEventListener('pointerleave',()=>{if(!press)leave();});
  stage.addEventListener('dragstart',e=>{if(active())e.preventDefault();});
  stage.addEventListener('click',e=>{
    if(!active() || !e.detail || e.button!==0 || e.target.closest('.loose-file-slip'))return;
    const target=suppress ? null : clickTarget===undefined ? targetAt(e.clientX,e.clientY) : clickTarget;
    suppress=false;clickTarget=undefined;
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
  document.addEventListener('pointerdown',()=>{stage.dataset.pointerInput='';},true);
  document.addEventListener('keydown',e=>{
    if(!e.altKey && !e.ctrlKey && !e.metaKey)delete stage.dataset.pointerInput;
    if(e.key==='Tab'||e.key==='Enter'||e.key===' '){
      cancelAnimationFrame(frame);frame=0;stopLook();
    }
  });
  document.addEventListener('portfolio-view',()=>{stopArrows();leave();});
  return {leave,refreshHover};
}
