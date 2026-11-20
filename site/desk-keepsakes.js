(() => {
  const dialog=document.querySelector('.pickup');
  if(typeof dialog.showModal!=='function')return;
  const items=document.querySelectorAll('[data-keepsake]');
  const title=dialog.querySelector('h2');
  const front=dialog.querySelector('.photo-front');
  const back=dialog.querySelector('.photo-back');
  const hand=dialog.querySelector('.photo-hand');
  const print=dialog.querySelector('.photo-print');
  const link=dialog.querySelector('.photo-link');
  const sketch=dialog.querySelector('.sketch-paper');
  const undo=dialog.querySelector('.undo-sketch');
  const ns='http://www.w3.org/2000/svg';
  const photos={
    'flyover-print':['DOPPLERGEIST','assets/prints/flyover.webp','An illustrated plane banking above a cat listening on a hillside.','#flyover','Listen to the recording'],
    'conway-print':['Conway’s 99-graph','assets/prints/conway.webp','A colorful geometric print from the graph theory shelf.','#conway','Explore the graph'],
    'robot-photo':['REEFSCAPE, 2025','assets/studio/reefscape.webp','Titan Robotics’ blue-bumpered 2022 robot carrying a white coral pipe on the REEFSCAPE field.','#about','Open the robotics notebook']
  };
  const doodles=['wave','airmail','pit-crew','constellation','snail-mail'];
  let bag=[],last=null,opener=null,lead='graphite',stroke=null;
  function surprise(){
    if(!bag.length){
      bag=[...doodles];
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.at(-1)===last)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
    }
    last=bag.pop();return last;
  }
  function setLead(color){
    lead=color;
    for(const button of dialog.querySelectorAll('[data-lead]'))button.setAttribute('aria-pressed',String(color===button.dataset.lead));
  }
  let yaw=0,pitch=0,grip=null;
  function orient() {
    print.style.transform='rotateX('+pitch+'deg) rotateY('+yaw+'deg)';
    const facing=Math.cos(pitch*Math.PI/180)*Math.cos(yaw*Math.PI/180);
    front.setAttribute('aria-hidden',String(facing<0));
    back.setAttribute('aria-hidden',String(facing>=0));
    print.style.setProperty('--glint',String((1-Math.abs(facing))*.18));
  }
  hand.addEventListener('pointerdown',event=>{
    if(!event.isPrimary || event.button!==0)return;
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
  let boardIndex=0;
  for(const item of items){
    if(item.dataset.object==='plant')continue;
    item.hidden=false;
    item.addEventListener('click',()=>{
      if(dialog.open)return;
      opener=item;link.dataset.originObject=item.dataset.object;
      let id=item.dataset.object;
      if(id==='pinboard')id=['flyover-print','conway-print'][boardIndex++%2];
      const photo=photos[id];
      dialog.querySelector('.photo-piece').hidden=!photo;
      dialog.querySelector('.sketch-piece').hidden=Boolean(photo);
      if(photo){
        const [name,src,alt,href,label]=photo;
        title.textContent=name;
        front.firstElementChild.loading='eager';
        front.firstElementChild.src=src;front.firstElementChild.alt=alt;
        back.replaceChildren(document.getElementById('back-'+id).content.cloneNode(true));
        dialog.style.setProperty('--print-ratio',id==='robot-photo'?'1':'.8');
        link.hidden=!href;
        link.removeAttribute('data-project');
        if(href){
          link.href=href;link.textContent=label;
          if(href!=='#about')link.dataset.project=href.slice(1);
        } else link.removeAttribute('href');
        yaw=0;pitch=0;orient();
      }else{
        title.textContent='Scratch paper';setLead(id==='rose-pencil'?'rose':id==='pencil'?'graphite':lead);
        undo.disabled=!sketch.childElementCount;
      }
      dialog.showModal();
      if(photo)hand.focus({preventScroll:true});
    });
  }
  dialog.querySelector('.put-down').onclick=()=>dialog.close();
  // Let the desk's normal link handlers own history and focus for the next reader.
  link.addEventListener('click',e=>{
    if(e.button||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
    dialog.close();opener?.focus({preventScroll:true});
  });
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close();});
  function point(e){
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(sketch.getScreenCTM().inverse());
    return Math.round(p.x)+','+Math.round(p.y);
  }
  // The stroke belongs to the paper. A browser fling can otherwise consume the next button tap.
  sketch.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  sketch.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    sketch.setPointerCapture(e.pointerId);
    const path=document.createElementNS(ns,'path');
    path.setAttribute('stroke',lead==='rose'?'#a3536d':'#534954');
    path.setAttribute('d','M'+point(e)+'l.1 .1');sketch.append(path);
    stroke={path,id:e.pointerId};undo.disabled=false;
  });
  sketch.addEventListener('pointermove',e=>{
    if(stroke?.id!==e.pointerId)return;
    stroke.path.setAttribute('d',stroke.path.getAttribute('d')+'L'+point(e));
  });
  sketch.addEventListener('lostpointercapture',()=>{stroke=null;});
  dialog.addEventListener('close',()=>{stroke=null;letGo();});
  for(const button of dialog.querySelectorAll('[data-lead]'))button.onclick=()=>setLead(button.dataset.lead);
  dialog.querySelector('.stamp-sketch').onclick=()=>{
    const image=document.createElementNS(ns,'image');
    image.setAttribute('href','assets/desk-drawings/'+surprise()+'.svg');
    image.setAttribute('x',30+Math.floor(Math.random()*180));image.setAttribute('y',20+Math.floor(Math.random()*90));
    image.setAttribute('width','260');image.setAttribute('height','180');sketch.append(image);undo.disabled=false;
  };
  undo.onclick=()=>{sketch.lastElementChild?.remove();undo.disabled=!sketch.childElementCount;};
})();
