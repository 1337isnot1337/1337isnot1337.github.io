(() => {
  const studio=document.querySelector('#studio');
  const pickup=document.querySelector('.pickup');
  const post=studio.querySelector('.drawer-post');
  const backs=new Map();
  const ns='http://www.w3.org/2000/svg';
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const lead={color:'#534954',name:'graphite'};
  const art=document.createElement('canvas');
  art.width=480;art.height=330;
  let activePrint='',pictureTurns=0,signature=null,stamped=null,openFolder='',bookmarked='';
  const posting=post.querySelector('.post-message');
  const seal=post.querySelector('.cat-stamp');
  const letterForm=studio.querySelector('.letter-room');
  const researchSource='https://github.com/1337isnot1337/solved-conjectures/blob/892c04046aadc8731dd510bb9c9b3ca1a086bae1/docs/';
  const object=document.querySelector('.object-view');
  object.addEventListener('close',()=>{if(!object.open)object.querySelector('.private-book-slip')?.remove();});
  document.addEventListener('desk-book-slip',event=>{
    if(!object.open)return;
    const old=object.querySelector('.private-book-slip');
    if(old){
      old.remove();
      if(old.dataset.source===event.detail)return;
    }
    const slip=make('aside','','private-book-slip');
    slip.dataset.source=event.detail;
    if(event.detail==='proof-card'){
      slip.append(make('b','15'),make('p','Player A opens with this rank. It gets back home on turn 90.'));
      const route=make('a','Open the deal');
      route.href='#desk-war';
      route.addEventListener('click',()=>object.close());
      slip.append(route);
    }else if(event.detail==='research-erratum'){
      slip.append(make('b','A qualification in red pencil'),
        make('p','Too broad: the correction preserves the higher residues.'),
        make('p','With the factor included: inputs divisible by seven retain the full residues they have after multiplication by j. The later seed has to handle that j.'));
      const source=make('a','Precise statement and original evidence');
      source.href=researchSource+'verification/prime-filtering-four-exact-44601096014/README.md#the-proved-statement';
      slip.append(source);
    }else{
      const theorem='LineSize.EulerKernel.finiteProduct_correction_exact';
      slip.append(make('b','What changes at the endpoint?'),
        make('p','The finite product has a square-root factor. The bound applies with r·t in a fixed compact positive range.'));
      const proof=make('a',theorem,'graphite-verification');
      proof.href=researchSource+'lean-status.md#relation-formulas-euler-correction-and-finite-tuple-reconstruction';
      proof.setAttribute('aria-label','Verified Lean declaration '+theorem+' and its scope');
      const argument=make('a','Read the working note');
      argument.href='/solved-conjectures/docs/line-size-candidates/';
      slip.append(proof,argument);
    }
    enableCrease(slip);
    object.append(slip);
  });
  function enableCrease(slip){
    const key='desk-fold:'+slip.dataset.source;
    try{if(localStorage.getItem(key))slip.dataset.crease='flat';}catch{}
    let gripped=null;
    slip.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0||event.target.closest('a'))return;
      const bounds=slip.getBoundingClientRect();
      if(event.clientX<bounds.right-42||event.clientY>bounds.top+45)return;
      event.preventDefault();
      gripped=event.clientX;slip.setPointerCapture(event.pointerId);
    });
    slip.addEventListener('pointerup',event=>{
      if(gripped===null)return;
      if(Math.abs(event.clientX-gripped)>14){
        slip.dataset.crease=slip.dataset.crease==='folded'?'flat':'folded';
        try{localStorage.setItem(key,'1');}catch{}
      }
      gripped=null;
    });
    slip.addEventListener('pointercancel',()=>{gripped=null;});
  }

  function make(tag,text,className='') {
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text)element.textContent=text;
    return element;
  }
  function send(name,detail,target=document) {
    target.dispatchEvent(new CustomEvent(name,{detail}));
  }
  function waveAt(element,intensity=4) {
    if(!media.matches)element.animate(
      [{transform:'translateY(0)'},{transform:'translateY('+intensity+'px)'},{transform:'translateY(0)'}],
      {duration:250,easing:'ease-out'});
  }
  function insertOnce(host,key,tag,label) {
    let element=host.querySelector('[data-private="'+key+'"]');
    if(!element){
      element=make(tag,label,'found-paper');
      element.dataset.private=key;
      host.append(element);
    }
    return element;
  }
  function dragSurface(surface,change,write=false) {
    let grip=null;
    surface.addEventListener('pointerdown',event=>{
      if(!event.isPrimary || event.button!==0)return;
      grip={id:event.pointerId,startX:event.clientX,startY:event.clientY};
      surface.setPointerCapture(event.pointerId);
      if(write)change(event,grip,false);
    });
    surface.addEventListener('pointermove',event=>{
      if(grip?.id===event.pointerId && event.buttons)change(event,grip,false);
    });
    surface.addEventListener('pointerup',event=>{
      if(grip?.id===event.pointerId)change(event,grip,true);
      grip=null;
    });
    surface.addEventListener('pointercancel',()=>{grip=null;});
  }
  const stampArea=seal.closest('.post-address');
  let stampTool=null;
  function stampPost() {
    if(seal.closest('.postcard-back').getAttribute('aria-hidden')==='true')return;
    const moment=new Date();
    const date=moment.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    const angle=-12+Math.random()*16;
    stamped={text:date+' · drawer office',angle};
    const mark=insertOnce(stampArea,'postmark','span','');
    mark.textContent=stamped.text;
    mark.style.setProperty('--stamp-angle',angle+'deg');
    waveAt(mark,2);
  }
  studio.addEventListener('drawer-stamp',event=>{
    if(!event.detail){stampTool?.remove();stampTool=null;return;}
    if(stampTool)return;
    stampTool=make('button','','post-stamp-tool');
    stampTool.type='button';
    stampTool.setAttribute('aria-label','Rubber stamp');
    stampArea.append(stampTool);
    let dragged=false;
    dragSurface(stampTool,(event,grip,end)=>{
      const dx=event.clientX-grip.startX,dy=event.clientY-grip.startY;
      dragged ||= Math.hypot(dx,dy)>7;
      if(end){
        stampTool.style.removeProperty('--stamp-x');
        stampTool.style.removeProperty('--stamp-y');
        if(dragged)stampPost();
      }else{
        stampTool.style.setProperty('--stamp-x',dx+'px');
        stampTool.style.setProperty('--stamp-y',dy+'px');
      }
    });
    stampTool.addEventListener('pointerdown',event=>{dragged=false;event.stopPropagation();});
    stampTool.addEventListener('click',()=>{if(!dragged)stampPost();});
  });
  seal.addEventListener('pointerdown',event=>event.stopPropagation());
  seal.addEventListener('click',stampPost);
  document.addEventListener('desk-lead',event=>{
    lead.name=event.detail;
    lead.color=lead.name==='rose'?'#a3536d':'#534954';
    if(signature){
      signature.toggleAttribute('data-available',lead.name==='rose');
      return;
    }
    if(lead.name!=='rose')return;
    signature=document.createElementNS(ns,'svg');
    signature.classList.add('post-signature');
    signature.dataset.available='';
    signature.setAttribute('viewBox','0 0 220 54');
    signature.setAttribute('aria-label','Your signature');
    posting.append(signature);
    let path;
    function positionOnPaper(event){
      const matrix=signature.getScreenCTM();
      if(!matrix)return null;
      const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
      if(!p.w||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
      const x=Math.max(0,Math.min(220,p.x/p.w));
      const y=Math.max(0,Math.min(54,p.y/p.w));
      return x.toFixed(1)+','+y.toFixed(1);
    }
    dragSurface(signature,(event,grip,end)=>{
      event.stopPropagation();
      if(end){path=null;return;}
      const position=positionOnPaper(event);
      if(!position)return;
      if(!path){
        path=document.createElementNS(ns,'path');
        path.setAttribute('d','M'+position+' l.1 .1');
        path.setAttribute('stroke',lead.color);
        signature.append(path);
      }else path.setAttribute('d',path.getAttribute('d')+'L'+position);
    },true);
    signature.addEventListener('pointercancel',()=>{path=null;});
    signature.addEventListener('pointerdown',event=>event.stopPropagation());
  });
  studio.addEventListener('desk-post-export',event=>{
    const {ctx}=event.detail;
    if(stamped){
      ctx.save();ctx.translate(983,1039);ctx.rotate(stamped.angle*Math.PI/180);
      ctx.font='22px monospace';ctx.fillStyle='#a4555d';ctx.fillText(stamped.text,-115,0,255);
      ctx.strokeStyle='#a4555d';ctx.strokeRect(-125,-30,268,48);ctx.restore();
    }
    if(signature?.childElementCount){
      ctx.save();ctx.translate(70,1490);ctx.scale(2.2,2.2);ctx.lineWidth=1.3;ctx.lineCap='round';
      for(const stroke of signature.children){
        ctx.strokeStyle=stroke.getAttribute('stroke');
        ctx.stroke(new Path2D(stroke.getAttribute('d')));
      }
      ctx.restore();
    }
  });
  const sketch=pickup.querySelector('.sketch-paper');
  const sketchPage=pickup.querySelector('.sketch-piece');
  const surface=make('div','','sketch-surface');
  const rubbing=document.createElement('canvas');
  rubbing.width=480;rubbing.height=330;
  rubbing.className='rubbing-impression';rubbing.setAttribute('aria-hidden','true');
  surface.append(rubbing);
  sketch.before(surface);surface.prepend(sketch);
  const impressions=new Map();
  let freshLabel='',sketchRevision=0,folds=0,foldGrip=null;
  studio.addEventListener('desk-rubbing',event=>{freshLabel=event.detail||'';});
  function graphiteRubbing(path,label){
    const scratch=make('canvas');scratch.width=art.width;scratch.height=art.height;
    const c=scratch.getContext('2d');
    c.strokeStyle='#5c4c43';c.lineWidth=14;c.lineCap='round';
    c.stroke(new Path2D(path.getAttribute('d')));
    c.globalCompositeOperation='source-in';
    c.fillStyle='#69534f';
    c.font=label==='DOPPLERGEIST'?'bold 58px sans-serif':'italic 54px Georgia';
    c.textAlign='center';c.textBaseline='middle';
    c.fillText(label,240,165,415);
    return scratch;
  }
  function renderPaper(){
    const ctx=art.getContext('2d');
    const rub=rubbing.getContext('2d');
    const key=++sketchRevision;
    ctx.clearRect(0,0,art.width,art.height);rub.clearRect(0,0,art.width,art.height);
    const paths=[...sketch.querySelectorAll('path')];
    const stamps=[...sketch.querySelectorAll('image')];
    for(const stroke of paths){
      ctx.strokeStyle=stroke.getAttribute('stroke')||'#534954';
      ctx.lineWidth=Number(stroke.getAttribute('stroke-width'))||1.8;
      ctx.lineCap='round';ctx.globalAlpha=Number(stroke.getAttribute('opacity')||1);
      ctx.stroke(new Path2D(stroke.getAttribute('d')));
      if(impressions.has(stroke))rub.drawImage(graphiteRubbing(stroke,impressions.get(stroke)),0,0);
    }
    ctx.globalAlpha=1;ctx.drawImage(rubbing,0,0);
    const pending=stamps.map(node=>{
      const image=new Image();image.src=node.getAttribute('href');
      return image.decode().then(()=>{
        if(key===sketchRevision)ctx.drawImage(image,...['x','y','width','height'].map(attr=>Number(node.getAttribute(attr))));
      }).catch(()=>{});
    });
    const deliver=()=>send('desk-sketch',paths.length||stamps.length?art:null,studio);
    if(pending.length)Promise.all(pending).then(()=>{if(key===sketchRevision)deliver();});
    else deliver();
  }
  new MutationObserver(records=>{
    for(const change of records){
      for(const node of change.addedNodes){
        if(freshLabel&&node.nodeName.toLowerCase()==='path'&&node.dataset.lead==='graphite')
          impressions.set(node,freshLabel);
      }
    }
    for(const stroke of impressions.keys())if(!stroke.isConnected)impressions.delete(stroke);
    renderPaper();
  }).observe(sketch,{subtree:true,childList:true,attributes:true,attributeFilter:['d','stroke-width']});
  studio.addEventListener('desk-sketch-request',renderPaper);
  sketch.addEventListener('pointermove',event=>{
    if(event.buttons && Math.abs(event.movementX)>17)
      sketch.querySelectorAll('.eraser-dust').forEach(dust=>dust.remove());
  });
  function turnFold(count){
    folds=count;
    sketchPage.dataset.folds=String(folds);
    send('desk-fold',folds===3,studio);
  }
  sketch.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0||folds===3||!sketch.querySelector('path,image'))return;
    const bounds=sketch.getBoundingClientRect();
    const x=(event.clientX-bounds.left)/bounds.width,y=(event.clientY-bounds.top)/bounds.height;
    const corner=folds===0?x>.89&&y<.15:folds===1?x<.12&&y<.16:x<.14&&y>.77;
    if(!corner)return;
    foldGrip={id:event.pointerId,x:event.clientX,y:event.clientY};
    sketch.setPointerCapture(event.pointerId);
    event.stopImmediatePropagation();
  },true);
  sketch.addEventListener('pointerup',event=>{
    if(foldGrip?.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-foldGrip.x,event.clientY-foldGrip.y)>25)turnFold(folds+1);
    foldGrip=null;
  });
  sketch.addEventListener('pointercancel',()=>{foldGrip=null;});
  sketch.addEventListener('dblclick',()=>{if(folds===3)turnFold(0);});

  function graphic(viewBox,className){
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',viewBox);svg.classList.add(className);
    svg.setAttribute('aria-hidden','true');return svg;
  }
  function svgPart(parent,tag,attrs){
    const node=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    parent.append(node);return node;
  }
  function buildReverse(id,host){
    const area=insertOnce(host,'turn','div','');
    area.dataset.print=id;
    const title=make('b',''),note=make('small','');
    area.append(title,note);
    const put=element=>area.prepend(element);
    const stop=event=>event.stopPropagation();
    area.addEventListener('pointerdown',stop);
    const move=(element,onMove)=>dragSurface(element,(event,grip,done)=>{
      const bounds=element.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
      onMove(x,event,grip,done);
    });
    if(id==='robot-photo'){
      const pair=make('div','','build-comparison');put(pair);
      const frames=[11,257,503];
      const captions=[
        'The left photo shows the full belly pan. The second brings the bundled leads and the 12.6 V display into view.',
        'The wiring photo shows the power distribution. The close-up points to a single mounted motor controller and its lead.',
      ];
      function compare(index){
        pair.replaceChildren();
        for(const offset of [index,index+1]){
          const frame=graphic(frames[offset]+' 13 236 244','comparison-frame');
          frame.removeAttribute('aria-hidden');frame.setAttribute('role','img');
          frame.setAttribute('aria-label',['Full belly pan and four corner modules','Wiring and voltage display','Hand pointing to a motor-controller lead'][offset]);
          svgPart(frame,'image',{href:'assets/studio/reefscape-build.webp',width:750,height:270});
          pair.append(frame);
        }
        title.textContent='Build table · '+(index+1)+' and '+(index+2);
        note.textContent=captions[index];
      }
      compare(0);move(pair,x=>compare(Number(x>.5)));
    }else if(id==='factoring-print'){
      const counts=[2,3],rows=make('div','','bead-rows');
      put(rows);
      function sum(){title.textContent=counts.join(' × ')+' = '+counts[0]*counts[1];}
      counts.forEach((count,index)=>{
        const rod=make('div','','bead-rod');rows.append(rod);
        function repaint(){[...rod.children].forEach((bead,i)=>bead.classList.toggle('on',i<counts[index]));}
        for(let i=0;i<7;i++)rod.append(make('i',''));
        move(rod,x=>{counts[index]=Math.min(7,1+Math.floor(x*7));repaint();sum();});
        repaint();
      });
      sum();note.textContent='Two rods. One extremely qualified cat.';
    }else if(id==='cpu-print'){
      const rail=graphic('0 0 180 67','switching-track');put(rail);
      for(const d of ['M9 43H170','M73 43Q108 42 149 10'])svgPart(rail,'path',{d,class:'rail-bed'});
      for(const d of ['M9 43H170','M73 43Q108 42 149 10'])svgPart(rail,'path',{d,class:'rail-line'});
      const engine=svgPart(rail,'g',{});
      svgPart(engine,'rect',{x:-13,y:-7,width:26,height:13,rx:3});
      svgPart(engine,'circle',{cx:-7,cy:7,r:3});
      svgPart(engine,'circle',{cx:7,cy:7,r:3});
      const lever=svgPart(rail,'path',{class:'rail-switch'});
      function switchTrack(wrong){
        engine.setAttribute('transform',wrong?'translate(121 25) rotate(-32)':'translate(115 43)');
        lever.setAttribute('d',wrong?'M72 43L96 33':'M72 43H96');
        title.textContent=wrong?'Discard · fetched address 5':'Continue · actual next address 7';
        note.textContent=wrong?'D = D − A is already in Fetch. D;JGT just resolved with D = 0.':'The branch falls through to 7. The car on the siding was fetched on the prediction.';
      }
      switchTrack(true);move(rail,x=>switchTrack(x<.49));
    }else if(id==='schedule-print'){
      const map=graphic('0 0 180 78','pocket-map');put(map);
      svgPart(map,'path',{class:'map-outline',d:'M6 13L61 4L119 13L174 4V64L119 74L61 65L6 74Z'});
      svgPart(map,'path',{class:'map-route',d:'M25 52H48V29H85V49H127V26H154'});
      const ends=[[25,52,'A113'],[154,26,'B204']];
      for(const [x,y,text] of ends){
        svgPart(map,'circle',{cx:x,cy:y,r:4});
        svgPart(map,'text',{x,y:y+13,'text-anchor':'middle'}).textContent=text;
      }
      let folded=false;
      move(map,(x,event,start,done)=>{
        map.style.setProperty('--unfold',String(Math.max(.38,Math.abs(x-.5)*2)));
        if(done){
          folded=x<.50;area.toggleAttribute('data-folded',folded);
          title.textContent=folded?'B204':'A113 → B204';
          map.style.removeProperty('--unfold');
        }
      });
      title.textContent='A113 → B204';note.textContent='A schematic route for the sample rooms.';
    }else if(id==='conway-print'){
      const diagram=graphic('0 0 106 106','thread-diagram');put(diagram);
      for(let i=0;i<7;i++){
        const angle=i*Math.PI*2/7;
        const a=[53+40*Math.cos(angle),53+40*Math.sin(angle)];
        const b=[53+40*Math.cos(angle+.39),53+40*Math.sin(angle+.39)];
        svgPart(diagram,'polygon',{points:'53,53 '+a.join(',')+' '+b.join(',')});
      }
      function stitch(x){
        const lit=Math.min(6,Math.floor(x*7));
        [...diagram.children].forEach((node,i)=>node.classList.toggle('lit',i===lit));
        title.textContent=(lit+1)+' / 7';
      }
      stitch(0);move(diagram,stitch);note.textContent='Two neighbors stitch one triangle.';
    }else if(id==='conjectures-print'){
      const ranks=make('div','','mini-ranks');put(ranks);
      const pocket=make('div','','rank-pocket');ranks.append(pocket);
      let fan=0;
      for(const [i,rank] of [15,10,4].entries()){
        const card=make('button',rank,'pocket-rank');
        card.type='button';card.style.setProperty('--slot',String(i));pocket.append(card);
        move(card,(x,event,start,done)=>{
          fan=Math.max(0,Math.min(1,(start.y-event.clientY)/(ranks.clientHeight||1)+.27));
          if(done)fan=fan>.42?1:0;
          ranks.style.setProperty('--pocket-fan',String(fan));
        });
        card.addEventListener('keydown',event=>{
          if(!['ArrowUp','ArrowDown'].includes(event.key))return;
          event.preventDefault();event.stopPropagation();
          ranks.style.setProperty('--pocket-fan',event.key==='ArrowUp'?'1':'0');
        });
      }
      title.textContent='Opening deal';note.textContent='Three ranks, all home again in ninety turns.';
    }else if(id==='flyover-print'){
      const strip=make('div','','scope-matching-strip');put(strip);
      const wave=make('img');wave.alt='Waveform of the published Livermore recording';wave.src='assets/studio/flyover-wave.svg';wave.draggable=false;
      const cursor=make('i','');strip.append(wave,cursor);
      function place(time){
        cursor.style.left=time/85*100+'%';
        title.textContent=Math.floor(time/60)+':'+String(Math.floor(time)%60).padStart(2,'0')+' on the recording';
      }
      place(0);note.textContent='Livermore waveform';
      move(strip,(x,event,start,done)=>{
        const time=Math.round(x*850)/10;
        place(time);
        if(done){
          document.querySelector('#recording').dataset.deskCue=String(time);
          const audio=document.querySelector('#desk-audio');
          if(audio?.readyState)audio.currentTime=Math.min(time,audio.duration);
          else if(audio)audio.dataset.printCue=String(time);
          send('desk-wave',time);
        }
      });
    }
  }
  pickup.addEventListener('desk-pickup',event=>{
    activePrint=event.detail;pictureTurns=0;
    if(activePrint.endsWith('-print'))send('desk-project-selected',activePrint.slice(0,-6));
  });
  const photoHand=pickup.querySelector('.photo-hand');
  photoHand.addEventListener('paper-turn',event=>{
    const {yaw,pitch,back}=event.detail;
    if(back)pictureTurns=Math.max(pictureTurns,Math.abs(yaw)+Math.abs(pitch));
    const face=pickup.querySelector('.photo-back');
    if(back && pictureTurns>220 && !face.querySelector('[data-private=turn]'))buildReverse(activePrint,face);
    if(!back && pictureTurns>240 && activePrint.endsWith('-print')){
      const angle=Math.max(-.17,Math.min(.17,Math.sin(yaw*Math.PI/180)*.18+pitch/900));
      backs.set(activePrint,angle);
    }
  });
  photoHand.addEventListener('dblclick',event=>{
    const back=photoHand.querySelector('.photo-back[aria-hidden=false]');
    if(back && activePrint.endsWith('-print') && !event.target.closest('[data-private]'))
      send('press-paperclip',activePrint);
  });
  pickup.addEventListener('close',()=>{
    if(backs.has(activePrint))send('desk-pin',{id:activePrint,angle:backs.get(activePrint)});
  });

  const folder=studio.querySelector('#catalogue');
  let folderPull=null,suppressFileClick=false;
  folder.addEventListener('dragstart',event=>{if(folderPull)event.preventDefault();});
  folder.addEventListener('pointerdown',event=>{
    const row=event.target.closest('.catalogue-list li');
    if(!row||event.button!==0)return;
    suppressFileClick=false;
    folderPull={row,id:event.pointerId,x:event.clientX,y:event.clientY,pulled:false};
  });
  folder.addEventListener('pointermove',event=>{
    if(folderPull?.id!==event.pointerId||!event.buttons)return;
    if(Math.abs(event.clientX-folderPull.x)<22&&event.clientY-folderPull.y<28)return;
    folderPull.pulled=true;
    if(!folder.hasPointerCapture(event.pointerId))folder.setPointerCapture(event.pointerId);
    folderPull.row.style.setProperty('--pull',Math.min(18,Math.max(-9,event.clientY-folderPull.y))+'px');
  });
  folder.addEventListener('pointerup',event=>{
    if(folderPull?.id!==event.pointerId)return;
    const {row,pulled}=folderPull;
    folderPull=null;
    row.style.removeProperty('--pull');
    if(pulled){suppressFileClick=true;looseFile(row);}
  });
  folder.addEventListener('pointercancel',()=>{
    folderPull?.row.style.removeProperty('--pull');
    folderPull=null;
  });
  folder.addEventListener('click',event=>{
    if(!suppressFileClick||!event.detail)return;
    suppressFileClick=false;event.preventDefault();event.stopImmediatePropagation();
  },true);
  function looseFile(row){
    const source=row.querySelector('a');
    if(!source)return;
    const destination=new URL(source.href,location.href);
    if(!['http:','https:'].includes(destination.protocol))return;
    if(openFolder===destination.href){openFolder='';send('desk-file-out',null,studio);return;}
    openFolder=destination.href;
    send('desk-file-out',{href:openFolder,title:source.querySelector('strong')?.textContent.trim()||source.textContent.trim()},studio);
  }
  const journal=studio.querySelector('#about');
  let pageCorner=null;
  const contact=document.querySelector('.calling-card-dialog');
  const contactBack=contact.querySelector('.calling-card-links');
  function copyAddress(url,row,reply){
    if(!navigator.clipboard)return;
    navigator.clipboard.writeText(url).then(()=>{
      row.classList.add('copied-address');
      if(reply)reply.textContent='Copied.';
      setTimeout(()=>row.classList.remove('copied-address'),1050);
    }).catch(()=>{if(reply)reply.textContent='The browser did not allow copying.';});
  }
  studio.addEventListener('desk-contact-card',()=>{
    if(!contactBack.childElementCount){
      const reply=contact.querySelector('[role=status]');
      for(const source of letterForm.querySelectorAll('.address-links a')){
        const name=source.querySelector('span').textContent;
        const row=make('button','','calling-card-address');
        row.type='button';row.setAttribute('aria-label','Copy '+name+' address');
        row.append(make('b',name),make('small',source.querySelector('small').textContent));
        row.addEventListener('click',()=>copyAddress(source.href,row,reply));
        contactBack.append(row);
      }
    }
    if(!contact.open){
      contact.showModal();contact.querySelector('.calling-card-hand').focus({preventScroll:true});
    }
  });
  window.addEventListener('hashchange',()=>{if(contact.open)contact.close();});
  contact.addEventListener('close',()=>{contact.querySelector('[role=status]').textContent='';});
  journal.addEventListener('pointerdown',event=>{
    const leaf=event.target.closest('[data-leaf]');
    if(!leaf||event.button!==0||event.target.closest('a,button,input'))return;
    const bounds=leaf.getBoundingClientRect();
    if(event.clientX<bounds.right-38||event.clientY<bounds.bottom-55)return;
    const following=journal.querySelector('#leaf-next').hash;
    const next=document.getElementById(following.slice(1));
    const glimpse=make('div','','next-leaf-glimpse');
    glimpse.setAttribute('aria-hidden','true');
    const heading=next?.querySelector('h3');
    const illustration=next?.querySelector('.leaf-art img')?.cloneNode();
    if(heading)glimpse.append(make('b',heading.textContent));
    if(illustration){
      illustration.alt='';illustration.removeAttribute('id');glimpse.append(illustration);
    }
    pageCorner={leaf,id:event.pointerId,x:event.clientX,glimpse};
    leaf.append(glimpse);
    leaf.setPointerCapture(event.pointerId);
  });
  journal.addEventListener('pointermove',event=>{
    if(pageCorner?.id!==event.pointerId||!event.buttons)return;
    const amount=Math.max(0,Math.min(65,(pageCorner.x-event.clientX)*.40));
    pageCorner.leaf.style.setProperty('--page-curl',amount+'px');pageCorner.leaf.dataset.pageCurl='';
  });
  function putCornerDown(event){
    if(pageCorner?.id!==event.pointerId)return;
    const {leaf,x,glimpse}=pageCorner;
    leaf.style.removeProperty('--page-curl');delete leaf.dataset.pageCurl;pageCorner=null;
    glimpse.remove();
    if(event.type==='pointercancel')return;
    const delta=x-event.clientX;
    if(delta>Math.min(135,leaf.clientWidth*.40))journal.querySelector('#leaf-next').click();
    else if(delta>22){
      bookmarked=leaf.dataset.leaf;
      leaf.classList.add('dog-eared');leaf.dataset.crease='';
      send('desk-bookmark','notebook');
    }
  }
  journal.addEventListener('pointerup',putCornerDown);
  journal.addEventListener('pointercancel',putCornerDown);
  journal.addEventListener('dblclick',event=>{
    const leaf=event.target.closest('[data-leaf]');
    if(!leaf || event.target.closest('a,button,input'))return;
    bookmarked=bookmarked===leaf.dataset.leaf?'':leaf.dataset.leaf;
    for(const page of journal.querySelectorAll('[data-leaf]'))page.classList.toggle('dog-eared',page.dataset.leaf===bookmarked);
    send('desk-bookmark',bookmarked?'notebook':'');
  });
  document.addEventListener('desk-bookmark-leaf',event=>{
    bookmarked=journal.querySelectorAll('[data-leaf]')[event.detail]?.dataset.leaf||'';
  });
  const cover=studio.querySelector('[data-object=book]');
  cover.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    cover.href=bookmarked?'#'+bookmarked:'#about';
  },true);
  function prepareAddress(link) {
    let swallowClick=false;
    link.addEventListener('click',event=>{
      if(swallowClick && event.detail){swallowClick=false;event.preventDefault();}
    });
    const copy=()=>{
      if(!navigator.clipboard)return;
      swallowClick=true;
      navigator.clipboard.writeText(link.href).then(()=>{
        link.classList.add('copied-address');
        setTimeout(()=>link.classList.remove('copied-address'),950);
      }).catch(()=>{swallowClick=false;});
    };
    link.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0)return;
      swallowClick=false;
      if(!event.target.closest('small'))return;
      const timer=setTimeout(copy,470);
      const stop=()=>{
        clearTimeout(timer);
        window.removeEventListener('pointerup',stop);
        window.removeEventListener('pointercancel',stop);
        window.removeEventListener('blur',stop);
      };
      window.addEventListener('pointerup',stop);
      window.addEventListener('pointercancel',stop);
      window.addEventListener('blur',stop);
    });
  }
  letterForm.querySelectorAll('.address-links a').forEach(prepareAddress);
  letterForm.querySelector('.letter-heading h2').addEventListener('dblclick',()=>{
    const seal=insertOnce(letterForm.querySelector('.letter-heading'),'wax','span','delivered despite the handwriting');
    waveAt(seal);
  });
  document.addEventListener('desk-cassette-side-b',()=>{
    const leaf=studio.querySelector('#off-the-clock .leaf-writing');
    if(leaf.querySelector('[data-private=cassette]'))return;
    const side=insertOnce(leaf,'cassette','div','');
    side.classList.add('handwritten-liner');
    side.append(make('b','SIDE B'),make('p','Four tracks. The last one keeps winding.'));
    const tracklist=leaf.querySelector('ul').cloneNode(true);
    side.append(tracklist);
    waveAt(side);
  });
  let rewound=0;
  document.addEventListener('desk-tape',event=>{
    rewound+=event.detail;
    if(Math.abs(rewound)>3)document.dispatchEvent(new Event('desk-cassette-side-b'));
  });

  const epoch=studio.querySelector('#about-teaching');
  epoch.querySelector('.leaf-art').addEventListener('dblclick',()=>{
    if(epoch.querySelector('form'))return;
    const terminal=make('form','','epoch-terminal');
    const prompt=make('label','epoch $ ');
    const input=make('input');input.type='text';input.autocomplete='off';input.spellcheck=false;prompt.append(input);
    const output=make('pre','total 1 brain cell');
    terminal.append(output,prompt);epoch.querySelector('.leaf-writing').append(terminal);
    let moved=false;
    terminal.addEventListener('submit',event=>{
      event.preventDefault();
      const commands={
        ls:moved?'practice/  please-read-me-first':'notes  practice/  please-read-me-first',
        'cat notes':moved?'notes moved to practice/':'Everything is a file. Including this excuse.',
        'cat practice/notes':moved?'Yep. Still a file.':'There is no notes file in practice/ yet.',
        'cat please-read-me-first':'Try ls. The notes file can live in practice/.',
        'ls practice':moved?'notes':'(empty)',
        'ls practice/':moved?'notes':'(empty)'
      };
      const command=input.value.trim();
      if(command==='mv notes practice/'){
        output.textContent=moved?'notes is already in practice/.':'Moved notes to practice/notes. Use ls practice/ to see it.';
        moved=true;
      }else if(command==='reset'){
        moved=false;output.textContent='Reset the practice directory.';
      }else output.textContent=Object.hasOwn(commands,command)?commands[command]:'Command stayed in the booklet.';
      input.value='';
    });
    input.focus({preventScroll:true});
  });
})();
