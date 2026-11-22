(() => {
  const dialog=document.querySelector('.pickup');
  if(typeof dialog.showModal!=='function')return;
  const items=document.querySelectorAll('[data-keepsake]');
  const title=dialog.querySelector('h2');
  const front=dialog.querySelector('.photo-front');
  const back=dialog.querySelector('.photo-back');
  const hand=dialog.querySelector('.photo-hand');
  const link=dialog.querySelector('.photo-link');
  const sketch=dialog.querySelector('.sketch-paper');
  const undo=dialog.querySelector('.undo-sketch');
  const ns='http://www.w3.org/2000/svg';
  const pinned=[...document.querySelectorAll('[data-board-print]')];
  const photos={
    'flyover-print':['DOPPLERGEIST','assets/prints/flyover.webp','An illustrated plane banking above a cat listening on a hillside.','#flyover','Listen to the recording'],
    'conway-print':['Conway’s 99-graph','assets/prints/conway.webp','A colorful geometric print from the graph theory shelf.','#conway','Explore the graph'],
    'factoring-print':['Integer factoring','assets/prints/factoring-bead.webp','A cat pushing a bead along an abacus.','#factoring','Read the factoring notes'],
    'cpu-print':['The Hack CPU','assets/prints/cpu-switch.webp','A streetcar at a railway switch.','#cpu','Explore the processor'],
    'schedule-print':['Schedule map','assets/prints/schedule.webp','A folded campus map with a route marked in red.','#schedule','Open the schedule project'],
    'conjectures-print':['Solved conjectures','assets/prints/conjectures.webp','Rabbit playing cards laid out on a plum-colored table.','#conjectures','Explore the conjectures'],
    'robot-photo':['REEFSCAPE, 2025','assets/studio/reefscape.webp','Titan Robotics’ blue-bumpered 2022 robot carrying a white coral pipe on the REEFSCAPE field.','#about-robotics','Open the robotics notebook']
  };
  const doodles=['wave','airmail','pit-crew','constellation','snail-mail'];
  let bag=[],last=null,opener=null,lead='graphite',stroke=null,eraser=false;
  const linePoints=new WeakMap();
  document.addEventListener('desk-eraser',event=>{eraser=event.detail;});
  document.addEventListener('desk-borrow-lead',event=>setLead(event.detail));
  function outputLine(path,points){
    let d='',connect=false;
    for(const point of points){
      if(!point){connect=false;continue;}
      d+=(connect?'L':'M')+point.map(value=>Math.round(value*10)/10).join(',');
      if(!connect)d+='l.1 .1';
      connect=true;
    }
    if(d)path.setAttribute('d',d);
    else path.remove();
  }
  function eraseAt(e){
    const [x,y]=point(e);
    let erased=false;
    for(const path of sketch.querySelectorAll('path')){
      const points=linePoints.get(path);
      if(!points)continue;
      let changed=false;
      for(let i=0;i<points.length;i++){
        const p=points[i];
        if(!p||Math.hypot(x-p[0],y-p[1])>9)continue;
        points[i]=null;changed=true;
      }
      if(changed){erased=true;outputLine(path,points);}
    }
    if(!erased)return;
    for(let i=0;i<3;i++){
      const dust=document.createElementNS(ns,'circle');
      dust.classList.add('eraser-dust');dust.setAttribute('cx',x+Math.random()*13-6);
      dust.setAttribute('cy',y+Math.random()*6);dust.setAttribute('r',.75+Math.random()*.65);
      sketch.append(dust);
    }
  }
  function surprise(){
    if(!bag.length){
      bag=[...doodles];
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.at(-1)===last)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
    }
    last=bag.pop();return last;
  }
  function setLead(color){
    if(lead!==color)eraser=false;lead=color;document.dispatchEvent(new CustomEvent('desk-lead',{detail:color}));
    for(const button of dialog.querySelectorAll('[data-lead]'))button.setAttribute('aria-pressed',String(color===button.dataset.lead));
  }
  let boardIndex=0;
  for(const item of items){
    if(item.dataset.object==='plant')continue;
    item.hidden=false;
    item.addEventListener('click',()=>{
      if(dialog.open)return;
      opener=item;link.dataset.originObject=item.dataset.object;
      let id=item.dataset.object;
      if(id==='pinboard')id=pinned[boardIndex++%pinned.length].dataset.object;
      const photo=photos[id];
      dialog.querySelector('.photo-piece').hidden=!photo;
      dialog.querySelector('.sketch-piece').hidden=Boolean(photo);
      if(photo){
        const [name,src,alt,href,label]=photo;
        title.textContent=name;
        const preview=new Image();
        preview.alt=alt;preview.draggable=false;
        preview.src='assets/furniture/prints/'+src.split('/').pop();
        front.replaceChildren(preview);
        const full=new Image();
        full.alt=alt;full.draggable=false;full.src=src;
        // An older download can only replace its own (possibly detached) preview.
        full.decode().then(()=>preview.replaceWith(full),()=>{});
        back.replaceChildren(document.getElementById('back-'+id).content.cloneNode(true));
        const signature=document.createElement('small');
        signature.className='film-signature';
        signature.textContent=id==='robot-photo'?'Titan Robotics · Feb. 4, 2025':'C. Davis · project print';
        front.append(signature);
        dialog.style.setProperty('--print-ratio',id==='robot-photo'?'1':'.8');
        link.hidden=!href;
        link.removeAttribute('data-project');
        if(href){
          link.href=href;link.textContent=label;
          if(id!=='robot-photo')link.dataset.project=href.slice(1);
        } else link.removeAttribute('href');
      }else{
        title.textContent='Scratch paper';setLead(id==='rose-pencil'?'rose':id==='pencil'?'graphite':lead);
        undo.disabled=!sketch.querySelector('path,image');
      }
      dialog.dispatchEvent(new CustomEvent('desk-pickup',{detail:id}));
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
    return [p.x,p.y];
  }
  // A native fling after a paper gesture can swallow the next tap on Put back.
  sketch.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  sketch.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||(e.button!==0&&e.button!==5))return;
    sketch.setPointerCapture(e.pointerId);
    if(eraser || e.button===5 || e.buttons===32){
      stroke={id:e.pointerId,erase:true};
      eraseAt(e);undo.disabled=!sketch.querySelector('path,image');return;
    }
    const path=document.createElementNS(ns,'path');
    path.dataset.lead=lead;
    path.setAttribute('stroke',lead==='rose'?'#a3536d':'#534954');
    path.setAttribute('opacity',lead==='rose'?'.87':'.95');
    const weight=strokeWeight(e);
    path.setAttribute('stroke-width',weight);path.style.strokeWidth=weight;
    const points=[point(e)];
    linePoints.set(path,points);
    outputLine(path,points);sketch.append(path);
    stroke={path,points,id:e.pointerId,weight};undo.disabled=false;
  });
  function strokeWeight(e){
    const pressure=e.pressure||.42;
    if(lead==='rose')return Math.max(2.5,2.3+Math.hypot(e.tiltX||0,e.tiltY||0)/10+pressure);
    return Math.max(.86,pressure*2.55);
  }
  sketch.addEventListener('pointermove',e=>{
    if(stroke?.id!==e.pointerId)return;
    if(stroke.erase){eraseAt(e);return;}
    const next=point(e),last=stroke.points.at(-1);
    if(!last)stroke.points.push(next);
    else{
      const steps=Math.max(1,Math.ceil(Math.hypot(next[0]-last[0],next[1]-last[1])/5));
      for(let i=1;i<=steps;i++)stroke.points.push([
        last[0]+(next[0]-last[0])*i/steps,
        last[1]+(next[1]-last[1])*i/steps
      ]);
    }
    stroke.weight=(stroke.weight*3+strokeWeight(e))/4;
    stroke.path.setAttribute('stroke-width',stroke.weight);
    stroke.path.style.strokeWidth=stroke.weight;
    outputLine(stroke.path,stroke.points);
  });
  sketch.addEventListener('lostpointercapture',()=>{stroke=null;});
  dialog.addEventListener('close',()=>{stroke=null;});
  for(const button of dialog.querySelectorAll('[data-lead]'))button.onclick=()=>setLead(button.dataset.lead);
  dialog.querySelector('.stamp-sketch').onclick=()=>{
    const image=document.createElementNS(ns,'image');
    image.setAttribute('href','assets/desk-drawings/'+surprise()+'.svg');
    image.setAttribute('x',30+Math.floor(Math.random()*180));image.setAttribute('y',20+Math.floor(Math.random()*90));
    image.setAttribute('width','260');image.setAttribute('height','180');sketch.append(image);undo.disabled=false;
  };
  undo.onclick=()=>{
    [...sketch.querySelectorAll('path,image')].at(-1)?.remove();
    undo.disabled=!sketch.querySelector('path,image');
  };
})();
