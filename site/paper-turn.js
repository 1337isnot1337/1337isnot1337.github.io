for(const hand of document.querySelectorAll('[data-turn-paper]')){
  const print=hand.firstElementChild;
  const [front,back]=print.children;
  let yaw=0,pitch=0,grip=null;
  function orient() {
    print.style.transform='rotateX('+pitch+'deg) rotateY('+yaw+'deg)';
    const facing=Math.cos(pitch*Math.PI/180)*Math.cos(yaw*Math.PI/180);
    front.setAttribute('aria-hidden',String(facing<0));
    back.setAttribute('aria-hidden',String(facing>=0));
    hand.dispatchEvent(new CustomEvent('paper-turn',{detail:{yaw,pitch,back:facing<0}}));
    print.style.setProperty('--glint',String((1-Math.abs(facing))*.18));
  }
  hand.addEventListener('pointerdown',event=>{
    if(!event.isPrimary || event.button!==0 || event.target.closest('a,button,input,[data-private],.post-signature,.cat-stamp'))return;
    hand.focus({preventScroll:true});
    hand.setPointerCapture(event.pointerId);
    grip={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,scale:240/print.offsetWidth};
    hand.classList.add('holding');
  });
  hand.addEventListener('pointermove',event=>{
    if(grip?.id!==event.pointerId)return;
    yaw=grip.yaw+(event.clientX-grip.x)*grip.scale;
    pitch=grip.pitch-(event.clientY-grip.y)*grip.scale;
    orient();
  });
  function letGo(){grip=null;hand.classList.remove('holding');}
  hand.addEventListener('lostpointercapture',letGo);
  const turns={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,15],ArrowDown:[0,-15]};
  hand.addEventListener('keydown',event=>{
    const turn=turns[event.key];
    if(!turn || event.altKey || event.ctrlKey || event.metaKey)return;
    event.preventDefault();yaw+=turn[0];pitch+=turn[1];orient();
  });
  hand.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  function reset(){letGo();yaw=0;pitch=0;orient();}
  const dialog=hand.closest('dialog');
  dialog.addEventListener('beforetoggle',e=>{if(e.newState==='open')reset();});
  dialog.addEventListener('close',()=>{if(!dialog.open)reset();});
  reset();
}
