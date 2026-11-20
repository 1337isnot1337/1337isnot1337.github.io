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
  document.addEventListener('desk-book-slip',event=>{
    const object=document.querySelector('.object-view');
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
    object.addEventListener('close',()=>slip.remove(),{once:true});
  });
  function enableCrease(slip){
    const key='desk-fold:'+slip.dataset.source;
    try{if(localStorage.getItem(key))slip.dataset.crease='flat';}catch{}
    let gripped=null;
    slip.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('a'))return;
      const bounds=slip.getBoundingClientRect();
      if(event.clientX<bounds.right-42||event.clientY>bounds.top+45)return;
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

  function buildReverse(id,host) {
    const area=insertOnce(host,'turn','div','','');
    const content={
      'flyover-print':['TUNE TO 01:00','A sound originally found in the air.'],
      'factoring-print':['2 × 337','674. It is doing its best.'],
      'cpu-print':['MAIN TRACK','The next instruction is already on the train.'],
      'schedule-print':['A113 → B204','A very small campus expedition.'],
      'conway-print':['1 / 7','One triangle, two neighbors, zero spare vertices.'],
      'conjectures-print':['15  ·  10  ·  4','Someone shuffled these for ninety turns.'],
      'robot-photo':['1 / 3','The bare chassis before the wiring went in.']
    }[id];
    if(!content)return;
    let value=0;
    area.append(make('b',content[0]));
    let output=make('small',content[1]);area.append(output);
    if(id==='conway-print'){
      const diagram=document.createElementNS(ns,'svg');
      diagram.setAttribute('viewBox','0 0 106 106');diagram.classList.add('thread-diagram');area.prepend(diagram);
      for(let i=0;i<7;i++){
        const triangle=document.createElementNS(ns,'polygon');
        const angle=i*Math.PI*2/7;
        const a=[53+40*Math.cos(angle),53+40*Math.sin(angle)];
        const b=[53+40*Math.cos(angle+.39),53+40*Math.sin(angle+.39)];
        triangle.setAttribute('points','53,53 '+a.join(',')+' '+b.join(','));
        triangle.classList.toggle('lit',i===0);diagram.append(triangle);
      }
    }
    if(id==='factoring-print'){
      const rows=make('div','','bead-rows');
      for(const n of [7,7]){
        const rod=make('div','','bead-rod');
        for(let j=0;j<n;j++)rod.append(make('i',''));
        rows.prepend(rod);
      }
      area.prepend(rows);
    }
    if(id==='conjectures-print'){
      const ranks=make('div','','mini-ranks');
      for(const rank of [15,10,4])ranks.append(make('b',rank));
      area.prepend(ranks);
    }
    if(id==='schedule-print'){
      const map=make('img');
      map.alt='Folded campus illustration';map.src='assets/prints/schedule.webp';
      area.prepend(map);
    }
    if(id==='robot-photo'){
      const zoom=make('div','','build-negative');
      zoom.style.backgroundImage='url(assets/studio/reefscape-build.webp)';area.prepend(zoom);
    }
    area.addEventListener('pointerdown',event=>event.stopPropagation());
    dragSurface(area,(event,grip)=>{
      value=event.clientX-grip.startX;
      const width=area.clientWidth||1;
      const step=Math.round(value/(width/7));
      const counter=area.querySelector(':scope > b');
      if(id==='conway-print'){
        const lit=((step%7)+7)%7;
        [...area.querySelectorAll('polygon')].forEach((node,i)=>node.classList.toggle('lit',i===lit));
        counter.textContent=(lit+1)+' / 7';
      }
      if(id==='factoring-print'){
        const a=Math.max(1,Math.min(7,2+step)),b=Math.max(1,Math.min(7,5-step));
        [...area.querySelectorAll('.bead-rod')].forEach((row,i)=>[...row.children].forEach((bead,j)=>bead.classList.toggle('on',j<(i?a:b))));
        counter.textContent=a+' × '+b+' = '+(a*b);
        output.textContent='The cat approves of this arithmetic.';
      }
      if(id==='cpu-print'){
        const side=value<0?'SIDING':'MAIN TRACK';
        counter.textContent=side;
        output.textContent=value<0?'Wrong path. Discard the instruction already in Fetch.':'The predictor can keep the instruction it fetched.';
      }
      if(id==='schedule-print'){
        const map=area.querySelector('img');
        map.style.setProperty('--unfold',Math.max(.25,Math.min(1,Math.abs(value)/width+.35)));
        counter.textContent=value<0?'B204 → A113':'A113 → B204';
      }
      if(id==='robot-photo'){
        const frame=Math.min(2,Math.max(0,Math.floor((event.clientX-area.getBoundingClientRect().left)*3/width)));
        area.querySelector('.build-negative').style.backgroundPositionX=50*frame+'%';
        counter.textContent=(frame+1)+' / 3';
        output.textContent=['The belly pan on the build table.','Wiring work in progress.','The mounted motor controllers.'][frame];
      }
      if(id==='conjectures-print'){
        area.querySelector('.mini-ranks').style.setProperty('--fan',Math.max(-20,Math.min(20,value))+'deg');
      }
      if(id==='flyover-print'){
        const time=Math.min(84,Math.max(0,Math.round((event.clientX-area.getBoundingClientRect().left)*85/width)));
        output.textContent=Math.floor(time/60)+':'+String(time%60).padStart(2,'0')+' on the recording';
        counter.textContent='LIVERMORE';
        document.querySelector('#recording').dataset.deskCue=time;
        send('desk-wave',time);
      }
    });
  }
  pickup.addEventListener('desk-pickup',event=>{activePrint=event.detail;pictureTurns=0;});
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
    if(event.target.closest('.photo-back') && activePrint.endsWith('-print') && !event.target.closest('[data-private]'))
      send('press-paperclip',activePrint);
  });
  pickup.addEventListener('close',()=>{
    if(backs.has(activePrint))send('desk-pin',{id:activePrint,angle:backs.get(activePrint)});
  });

  const folder=studio.querySelector('#catalogue');
  let folderPull=null,suppressFileClick=false;
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
  journal.addEventListener('pointerdown',event=>{
    const leaf=event.target.closest('[data-leaf]');
    if(!leaf||event.button!==0||event.target.closest('a,button,input'))return;
    const bounds=leaf.getBoundingClientRect();
    if(event.clientX<bounds.right-38||event.clientY<bounds.bottom-55)return;
    pageCorner={leaf,id:event.pointerId,x:event.clientX};
    leaf.setPointerCapture(event.pointerId);
  });
  journal.addEventListener('pointermove',event=>{
    if(pageCorner?.id!==event.pointerId||!event.buttons)return;
    const amount=Math.max(0,Math.min(65,(pageCorner.x-event.clientX)*.40));
    pageCorner.leaf.style.setProperty('--page-curl',amount+'px');pageCorner.leaf.dataset.pageCurl='';
  });
  function putCornerDown(event){
    if(pageCorner?.id!==event.pointerId)return;
    const {leaf,x}=pageCorner;
    leaf.style.removeProperty('--page-curl');delete leaf.dataset.pageCurl;pageCorner=null;
    if(event.type==='pointercancel')return;
    const delta=x-event.clientX;
    if(delta>135)journal.querySelector('#leaf-next').click();
    else if(delta>22){
      bookmarked=leaf.id;
      leaf.classList.add('dog-eared');leaf.dataset.crease='';
      send('desk-bookmark','notebook');
    }
  }
  journal.addEventListener('pointerup',putCornerDown);
  journal.addEventListener('pointercancel',putCornerDown);
  journal.addEventListener('dblclick',event=>{
    const leaf=event.target.closest('[data-leaf]');
    if(!leaf || event.target.closest('a,button,input'))return;
    bookmarked=bookmarked===leaf.id?'':leaf.id;
    for(const page of journal.querySelectorAll('[data-leaf]'))page.classList.toggle('dog-eared',page.id===bookmarked);
    send('desk-bookmark',bookmarked?'notebook':'');
  });
  document.addEventListener('desk-bookmark-leaf',event=>{
    bookmarked=journal.querySelectorAll('[data-leaf]')[event.detail]?.id||'';
  });
  const cover=studio.querySelector('[data-object=book]');
  cover.addEventListener('click',event=>{
    if(!bookmarked || event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    cover.href='#'+bookmarked;
  },true);
  function prepareAddress(link) {
    let didCopy=false;
    link.addEventListener('click',event=>{
      if(didCopy){didCopy=false;event.preventDefault();}
    });
    const copy=()=>{
      if(!navigator.clipboard)return;
      didCopy=true;
      navigator.clipboard.writeText(link.href).then(()=>{
        link.classList.add('copied-address');
        setTimeout(()=>link.classList.remove('copied-address'),950);
      }).catch(()=>{didCopy=false;});
    };
    link.querySelector('small')?.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      const timer=setTimeout(copy,470);
      const stop=()=>clearTimeout(timer);
      window.addEventListener('pointerup',stop,{once:true});
      window.addEventListener('pointercancel',stop,{once:true});
    });
  }
  letterForm.querySelectorAll('.address-links a').forEach(prepareAddress);
  letterForm.querySelector('.letter-heading h2').addEventListener('dblclick',()=>{
    const seal=insertOnce(letterForm.querySelector('.letter-heading'),'wax','span','delivered despite the handwriting');
    waveAt(seal);
  });
  let rewound=0;
  document.addEventListener('desk-tape',event=>{
    rewound+=event.detail;
    if(Math.abs(rewound)<2.9)return;
    const leaf=studio.querySelector('#off-the-clock .leaf-writing');
    const side=insertOnce(leaf,'cassette','small',rewound<0?'Side B · the pencil finally fixed it':'Side B · four tracks and one very long loop');
    waveAt(side);
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
        'cat please-read-me-first':'Try ls. The notes file can live in practice/.',
        'ls practice':moved?'notes':'(empty)',
        'ls practice/':moved?'notes':'(empty)'
      };
      const command=input.value.trim();
      if(command==='mv notes practice/'){
        output.textContent=moved?'Already moved.':'Moved notes to practice/.';
        moved=true;
      }else if(command==='reset'){
        moved=false;output.textContent='Reset the practice directory.';
      }else output.textContent=Object.hasOwn(commands,command)?commands[command]:'Command stayed in the booklet.';
      input.value='';
    });
    input.focus({preventScroll:true});
  });
})();
