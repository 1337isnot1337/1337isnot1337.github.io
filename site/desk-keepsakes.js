(() => {
  const dialog=document.querySelector('.pickup');
  if(typeof dialog.showModal!=='function')return;
  const items=document.querySelectorAll('[data-keepsake]');
  const title=dialog.querySelector('h2');
  const front=dialog.querySelector('.photo-front');
  const back=dialog.querySelector('.photo-back');
  const flip=dialog.querySelector('.photo-flip');
  const flipControl=dialog.querySelector('.flip-control');
  const link=dialog.querySelector('.photo-link');
  const sketch=dialog.querySelector('.sketch-paper');
  const undo=dialog.querySelector('.undo-sketch');
  const ns='http://www.w3.org/2000/svg';
  const photos={
    'flyover-print':['DOPPLERGEIST','assets/prints/flyover.webp','An illustrated plane banking above a cat listening on a hillside.','#flyover','Listen to the recording'],
    'conway-print':['Conway’s 99-graph','assets/prints/conway.webp','A colorful geometric print from the graph theory shelf.','#conway','Explore the graph'],
    'robot-photo':['In the robot shop','assets/studio/roller.webp','An intake roller, drive belt and hex key on the robot worktable.','#about','Open the robotics notebook']
  };
  const doodles=[
    ['wave','A striped cat waves one paw.','oh hi. you found the back.'],
    ['airmail','A cat pilots a paper airplane.','Air traffic control has a few questions.'],
    ['pit-crew','A tiny robot high-fives its cat mechanic.','Passed inspection. Inspector wanted treats.'],
    ['constellation','A cat naps between the stars of a hand-drawn graph.','One more vertex and she wakes up.'],
    ['snail-mail','A snail carries a pink envelope.','Express delivery. Eventually.']
  ];
  let bag=[],last=null,opener=null,reverse=false,lead='graphite',stroke=null;
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
  function side(isBack,animate=false){
    reverse=isBack;front.hidden=reverse;back.hidden=!reverse;
    const action=reverse?'See the front':'Turn over';
    flip.setAttribute('aria-label',action);
    flip.setAttribute('aria-description',reverse ? back.firstElementChild.alt+' '+back.lastElementChild.textContent : front.firstElementChild.alt);
    flipControl.textContent=action+' ↻';
    if(animate && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      flip.animate([{transform:'perspective(700px) rotateY(-13deg)'},{transform:'none'}],{duration:160,easing:'ease-out'});
    }
  }
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
        front.firstElementChild.loading=back.firstElementChild.loading='eager';
        front.firstElementChild.src=src;front.firstElementChild.alt=alt;
        const [art,description,caption]=surprise();
        back.firstElementChild.src='assets/desk-drawings/'+art+'.svg';
        back.firstElementChild.alt=description;back.lastElementChild.textContent=caption;
        link.hidden=!href;
        link.removeAttribute('data-project');
        if(href){
          link.href=href;link.textContent=label;
          if(href!=='#about')link.dataset.project=href.slice(1);
        } else link.removeAttribute('href');
        side(false);
      }else{
        title.textContent='Scratch paper';setLead(id==='rose-pencil'?'rose':id==='pencil'?'graphite':lead);
        undo.disabled=!sketch.childElementCount;
      }
      dialog.showModal();
    });
  }
  flip.onclick=flipControl.onclick=()=>side(!reverse,true);
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
  dialog.addEventListener('close',()=>{stroke=null;});
  for(const button of dialog.querySelectorAll('[data-lead]'))button.onclick=()=>setLead(button.dataset.lead);
  dialog.querySelector('.stamp-sketch').onclick=()=>{
    const image=document.createElementNS(ns,'image');
    image.setAttribute('href','assets/desk-drawings/'+surprise()[0]+'.svg');
    image.setAttribute('x',30+Math.floor(Math.random()*180));image.setAttribute('y',20+Math.floor(Math.random()*90));
    image.setAttribute('width','260');image.setAttribute('height','180');sketch.append(image);undo.disabled=false;
  };
  undo.onclick=()=>{sketch.lastElementChild?.remove();undo.disabled=!sketch.childElementCount;};
})();
