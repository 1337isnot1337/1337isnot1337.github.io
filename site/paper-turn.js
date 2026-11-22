for(const hand of document.querySelectorAll('[data-turn-paper]')){
  const print=hand.firstElementChild;
  const [front,back]=print.children;
  const controls='a,button,input,[data-private],.post-signature,.cat-stamp';
  let yaw=0,pitch=0,grip=null;
  let showingBack;
  function orient() {
    print.style.transform='rotateX('+pitch+'deg) rotateY('+yaw+'deg)';
    const facing=Math.cos(pitch*Math.PI/180)*Math.cos(yaw*Math.PI/180);
    if(showingBack!==(facing<0)){
      showingBack=facing<0;
      front.inert=showingBack;
      back.inert=!showingBack;
      front.setAttribute('aria-hidden',String(showingBack));
      back.setAttribute('aria-hidden',String(!showingBack));
    }
    hand.dispatchEvent(new CustomEvent('paper-turn',{detail:{yaw,pitch,back:showingBack}}));
    const shine=50+Math.sin(yaw*Math.PI/180)*77+Math.sin(pitch*Math.PI/180)*27;
    print.style.setProperty('--shine',shine+'%');
    print.style.setProperty('--glint',String((1-Math.abs(facing))*.49));
  }
  hand.addEventListener('pointerdown',event=>{
    if(!event.isPrimary || event.button!==0 || event.target.closest(controls))return;
    hand.focus({preventScroll:true});
    hand.setPointerCapture(event.pointerId);
    grip={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,scale:240/print.offsetWidth};
    hand.classList.add('holding');
  });
  hand.addEventListener('pointermove',event=>{
    if(grip?.id!==event.pointerId)return;
    if(!(event.buttons&1)){letGo();return;}
    yaw=grip.yaw+(event.clientX-grip.x)*grip.scale;
    pitch=grip.pitch-(event.clientY-grip.y)*grip.scale;
    orient();
  });
  function letGo(event){
    if(event?.pointerId!==undefined && grip?.id!==event.pointerId)return;
    const ended=grip;
    grip=null;hand.classList.remove('holding');
    if(ended && hand.hasPointerCapture(ended.id))hand.releasePointerCapture(ended.id);
  }
  for(const type of ['pointerup','pointercancel','lostpointercapture'])hand.addEventListener(type,letGo);
  hand.addEventListener('dragstart',event=>{if(grip)event.preventDefault();});
  window.addEventListener('blur',letGo);
  const turns={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,15],ArrowDown:[0,-15]};
  hand.addEventListener('keydown',event=>{
    const turn=turns[event.key];
    if(!turn || event.altKey || event.ctrlKey || event.metaKey)return;
    event.preventDefault();yaw+=turn[0];pitch+=turn[1];orient();
  });
  hand.addEventListener('touchstart',e=>{
    if(e.cancelable && !e.target.closest(controls))e.preventDefault();
  },{passive:false});
  function reset(){letGo();yaw=0;pitch=0;orient();}
  const dialog=hand.closest('dialog');
  dialog.addEventListener('beforetoggle',e=>{if(e.newState==='open')reset();});
  dialog.addEventListener('close',()=>{if(!dialog.open)reset();});
  reset();
}
