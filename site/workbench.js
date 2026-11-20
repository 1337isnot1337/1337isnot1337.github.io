(() => {
  const desk=document.querySelector('.workbench');
  if(!desk) return;
  const audio=desk.querySelector('#desk-audio');
  const tabs=[...desk.querySelectorAll('[data-desk]')];
  const panels=[...desk.querySelectorAll('[data-desk-panel]')];
  function choose(name){
    if(name!=='sound' && !audio.paused) audio.pause();
    tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.desk===name)));
    panels.forEach(panel=>panel.hidden=panel.dataset.deskPanel!==name);
    document.dispatchEvent(new CustomEvent('desk-project-selected',{detail:{sound:'flyover',cards:'conjectures',bits:'cpu',numbers:'conjectures'}[name]}));
  }
  function remember(name){
    const panel=panels.find(panel=>panel.dataset.deskPanel===name);
    if(panel && location.hash!=='#'+panel.id) history.pushState({desk:name},'','#'+panel.id);
  }
  function fromHash(){
    const panel=panels.find(panel=>'#'+panel.id===location.hash);
    if(panel) choose(panel.dataset.deskPanel);
  }
  tabs.forEach(button=>button.addEventListener('click',()=>{choose(button.dataset.desk);remember(button.dataset.desk);}));
  desk.querySelector('.desk-tabs').hidden=false;
  desk.classList.add('desk-ready');
  choose('sound');
  document.addEventListener('desk-experiment',event=>choose(event.detail));
  fromHash();
  window.addEventListener('popstate',fromHash);
  window.addEventListener('hashchange',fromHash);
  desk.addEventListener('open-from-shelf', event=>{
    const panel=panels.find(panel=>panel.dataset.deskPanel===event.detail);
    if(!panel) return;
    choose(event.detail);
    remember(event.detail);
    const heading=panel.querySelector('h3');
    heading.tabIndex=-1;
    heading.focus({preventScroll:true});
    desk.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches !== false?'instant':'smooth'});
  });

  // Template contents have no active image request until the disclosure opens.
  const map=desk.querySelector('#desk-map');
  map.addEventListener('toggle',()=>{
    const holder=desk.querySelector('#desk-map-image');
    if(!map.open || holder.childElementCount) return;
    const fragment=desk.querySelector('#desk-map-template').content.cloneNode(true);
    fragment.querySelector('img').addEventListener('error',()=>{
      desk.querySelector('#desk-map-error').hidden=false;
    });
    holder.append(fragment);
  });

  const listen=desk.querySelector('.desk-listen');
  const play=desk.querySelector('#desk-play-recording');
  const status=desk.querySelector('#desk-audio-status');
  const playhead=desk.querySelector('.desk-playhead');
  listen.hidden=false;
  function recordingFailed(){
    status.textContent='The recording could not start. Try again, or open the recording notes.';
    status.hidden=false;
    play.textContent='Try the recording again';
    listen.hidden=false;
  }
  play.addEventListener('click',async()=>{
    status.hidden=true;
    // Even preload="none" can fetch in some engines. Do not assign a URL
    // until the visitor actually asks to hear the recording.
    if(!audio.getAttribute('src')) audio.src=audio.dataset.deskSrc;
    else if(audio.error) audio.load();
    audio.hidden=false;
    try{
      await audio.play();
      // Replace the load button with native controls without dropping focus.
      if(document.activeElement===play) audio.focus({preventScroll:true});
      listen.hidden=true;
    }catch(error){
      if(error?.name!=='AbortError') recordingFailed();
    }
  });
  audio.addEventListener('error',recordingFailed);
  audio.addEventListener('pause',()=>{delete audio.dataset.deskCarry;});
  audio.addEventListener('loadedmetadata',()=>{
    const cue=Number(audio.dataset.printCue);
    if(Number.isFinite(cue)){
      audio.currentTime=Math.min(audio.duration,cue);
      delete audio.dataset.printCue;
    }
  });
  audio.addEventListener('timeupdate',()=>{
    const valid=Number.isFinite(audio.duration) && audio.duration>0;
    playhead.hidden=!valid || audio.currentTime===0;
    if(valid) playhead.style.left=Math.min(99.8,100*audio.currentTime/audio.duration)+'%';
  });
  const spectrum=desk.querySelector('.desk-spectrum');
  spectrum.querySelector('img').draggable=false;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function paperGesture(surface,onMove,onRelease){
    let down=null;
    surface.addEventListener('pointerdown',event=>{
      if(!event.isPrimary || event.button!==0)return;
      down={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false,target:event.target};
    });
    surface.addEventListener('pointermove',event=>{
      if(down?.id!==event.pointerId || !event.buttons)return;
      down.dragged ||= Math.hypot(event.clientX-down.x,event.clientY-down.y)>6;
      if(down.dragged){
        if(!surface.hasPointerCapture(event.pointerId))surface.setPointerCapture(event.pointerId);
        onMove(event,down);
      }
    });
    surface.addEventListener('pointerup',event=>{
      if(down?.id===event.pointerId)onRelease(event,down);
      down=null;
    });
    surface.addEventListener('pointercancel',()=>{down=null;});
  }
  function note(parent,className,text){
    const node=document.createElement('span');node.className=className;node.textContent=text;
    parent.append(node);return node;
  }
  let loop=null,marker=null,loopBand=null;
  const duration=()=>audio.duration>0?audio.duration:85;
  function position(clientX,clientY){
    const rect=spectrum.getBoundingClientRect();
    return [clamp((clientX-rect.left)/rect.width,0,1),clamp((clientY-rect.top)/rect.height,0,1)];
  }
  function seekLoop(which,time){
    if(!loop)return;
    const d=duration();
    loop[which]=which===0?clamp(time,0,loop[1]-.18):clamp(time,loop[0]+.18,d);
    paintLoop();
    if(audio.readyState && (audio.currentTime<loop[0]||audio.currentTime>loop[1]))audio.currentTime=loop[0];
  }
  function paintLoop(){
    if(!loopBand){
      loopBand=note(spectrum,'spectrum-loop','');
      for(const [index,description] of ['Loop start','Loop end'].entries()){
        const handle=document.createElement('button');
        handle.type='button';handle.className='spectrum-loop-handle';
        handle.dataset.end=String(index);handle.setAttribute('aria-label',description);
        handle.addEventListener('keydown',event=>{
          const delta={ArrowRight:.25,ArrowLeft:-.25}[event.key];
          if(delta===undefined)return;
          event.preventDefault();seekLoop(index,loop[index]+delta);
        });
        loopBand.append(handle);
      }
    }
    loopBand.style.left=loop[0]/duration()*100+'%';
    loopBand.style.width=(loop[1]-loop[0])/duration()*100+'%';
  }
  paperGesture(spectrum,(event,down)=>{
    const [x,y]=position(event.clientX,event.clientY);
    const d=duration();
    const end=down.target.closest('[data-end]');
    if(end){seekLoop(Number(end.dataset.end),x*d);return;}
    marker??=note(spectrum,'spectrum-note','');
    marker.style.setProperty('--at',clamp(x,.12,.88)*100+'%');
    marker.style.setProperty('--frequency',clamp(y,.13,.88)*100+'%');
    marker.textContent=(d*x).toFixed(1)+' s · '+Math.round(400-y*300)+' Hz';
    const [start]=position(down.x,down.y);
    const measured=(x-start)*d;
    if(Math.abs(measured)>.85){
      loop=[Math.min(start,x)*d,Math.max(start,x)*d];
      if(!audio.paused)audio.dataset.deskCarry='';
      paintLoop();
    }
  },(event,down)=>{
    if(down.dragged&&loop&&audio.readyState&&!down.target.closest('[data-end]'))audio.currentTime=loop[0];
  });
  spectrum.addEventListener('dblclick',()=>{
    delete audio.dataset.deskCarry;loop=null;loopBand?.remove();loopBand=null;marker?.remove();marker=null;
  });
  audio.addEventListener('timeupdate',()=>{
    if(loop&&audio.currentTime>=loop[1]&&!audio.paused)audio.currentTime=loop[0];
  });
  audio.addEventListener('play',()=>{
    if(!loop)return;
    audio.dataset.deskCarry='';
    if(audio.currentTime<loop[0] || audio.currentTime>=loop[1])audio.currentTime=loop[0];
  });
  const figure=map.querySelector('figure');
  const rankings=[
    {rank:1,score:'0.935434',offset:'476 m',x:72.10,y:48.0},
    {rank:10,score:'0.927466',offset:'152 m',x:74.13,y:49.5}
  ];
  let shownRank=0,comparison;
  function compareFits(index){
    shownRank=index;
    const holder=map.querySelector('#desk-map-image');
    const candidate=rankings[index];
    holder.querySelector('.map-pick')?.remove();
    const ring=note(holder,'map-pick','');
    ring.style.left=candidate.x+'%';ring.style.top=candidate.y+'%';ring.setAttribute('aria-hidden','true');
    if(!comparison){
      comparison=document.createElement('div');comparison.className='fit-comparison';
      rankings.forEach((entry,i)=>{
        const tab=document.createElement('button');tab.type='button';
        tab.textContent=(i===0?'★':'◆')+' Rank '+entry.rank+' · '+entry.score;
        tab.addEventListener('click',()=>compareFits(i));comparison.append(tab);
      });
      note(comparison,'found-paper','').dataset.fitNote='';
      figure.append(comparison);
    }
    [...comparison.querySelectorAll('button')].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    comparison.querySelector('[data-fit-note]').textContent=candidate.offset+' from the inferred reference. The spectrogram shows the measured recording and the leading candidate’s plotted curve.';
  }
  figure.addEventListener('dblclick',event=>{
    if(event.target.closest('img'))compareFits(comparison?1-shownRank:1);
  });
  // The homepage player and the full project reader must never talk over
  // each other. Native play does not bubble, so listen in the capture phase.
  document.addEventListener('play',event=>{
    if(event.target===audio){
      const reader=document.querySelector('#recording');
      if(reader && !reader.paused) reader.pause();
    }else if(event.target.id==='recording' && !audio.paused) audio.pause();
  },true);
  document.addEventListener('click',event=>{
    if(event.target.closest('a[data-project]') && !audio.paused) audio.pause();
  });

  const initial=[[15,7,16,8,1,22,17,9],[10,2,23,18,11,19,12,3],[4,20,13,5,21,14,6]];
  let hands=initial.map(h=>[...h]),turn=0;
  const states=[hands.map(hand=>[...hand])];
  const dealStatus=desk.querySelector('#desk-deal-status');
  const dealCards=desk.querySelector('.desk-playing-cards');
  let traced=null,cardPreview=null;
  const stacks=[...dealCards.children];
  function renderDeal(){
    'abc'.split('').forEach((player,i)=>{
      desk.querySelector(`#desk-card-${player}`).textContent=hands[i][0];
      desk.querySelector(`#desk-count-${player}`).textContent=`${hands[i].length} cards`;
    });
    dealCards.toggleAttribute('data-loop',turn===90);
    traced?.remove();traced=null;
    cardPreview?.remove();cardPreview=null;
    for(const stack of stacks)stack.style.removeProperty('--deal-card-shift');
    desk.querySelector('#desk-turn').textContent=`Turn ${turn} / 90`;
  }
  function deal(){
    if(turn===90){hands=initial.map(h=>[...h]);turn=0;}
    const exposed=hands.map(h=>h.shift());
    const winner=exposed.indexOf(Math.max(...exposed));
    hands[winner].push(...exposed.sort((a,b)=>b-a));turn++;states[turn]=hands.map(hand=>[...hand]);
    dealStatus.textContent=turn===90?'Exactly the original card order. The next 90 turns will repeat.':`Player ${'ABC'[winner]} wins turn ${turn}. Won cards go underneath, highest first.`;
    renderDeal();
  }
  paperGesture(dealCards,(event,down)=>{
    const stack=down.target.closest('.desk-playing-cards > div:not(.dragged-deal)');
    if(!stack)return;
    const index=stacks.indexOf(stack),delta=event.clientX-down.x;
    if(delta<0)return;
    stack.style.setProperty('--deal-card-shift',Math.min(21,delta*.21)+'px');
    if(delta<27||cardPreview)return;
    cardPreview=document.createElement('div');cardPreview.className='dragged-deal';
    for(const [i,hand] of hands.entries()){
      if(i===index)continue;
      note(cardPreview,'found-paper','ABC'[i]+' plays '+hand[0]);
    }
    dealCards.append(cardPreview);
  },(event,down)=>{
    const delta=event.clientX-down.x;
    cardPreview?.remove();cardPreview=null;
    for(const stack of stacks)stack.style.removeProperty('--deal-card-shift');
    if(!down.dragged||Math.abs(delta)<20)return;
    if(delta>0&&down.target.closest('.desk-playing-cards > div'))deal();
    else if(delta<0&&turn>0){
      turn--;hands=states[turn].map(hand=>[...hand]);renderDeal();
      dealStatus.textContent='Rewound to turn '+turn+'. The cards have agreed to forget.';
    }
  });
  dealCards.addEventListener('dblclick',event=>{
    if(turn!==6&&turn!==90)return;
    const card=event.target.closest('.desk-playing-cards > div');
    if(!card)return;
    traced?.remove();
    const i=stacks.indexOf(card);
    if(i<0)return;
    traced=document.createElement('div');traced.className='found-paper queue-sheet';
    card.append(traced);
    if(turn===6){
      const line=(ranks,className)=>{
        const row=document.createElement('span');row.className=className;
        for(const rank of ranks)note(row,'queue-rank',String(rank));
        traced.append(row);
      };
      note(traced,'queue-label',hands[i].length+' cards in both hands');
      line(initial[i],'queue-start');line(hands[i],'queue-now');
    }else{
      const ranks=document.createElement('span');ranks.className='queue-picker';traced.append(ranks);
      const output=note(traced,'queue-route','');
      function traceRank(rank){
        const visits=states.flatMap((state,n)=>{
          const location=state.findIndex(hand=>hand.includes(rank));
          if(n>0&&states[n-1][location].includes(rank))return [];
          return [n+' '+ 'ABC'[location]];
        });
        output.textContent=rank+' visited '+visits.join(' → ');
      }
      for(const rank of initial[i]){
        const button=document.createElement('button');button.type='button';button.textContent=rank;
        button.addEventListener('click',()=>traceRank(rank));ranks.append(button);
      }
      traceRank(initial[i][0]);
    }
  });
  desk.querySelector('.desk-controls').hidden=false;
  desk.querySelector('#desk-deal-one').addEventListener('click',deal);
  desk.querySelector('#desk-deal-cycle').addEventListener('click',()=>{if(turn===90){hands=initial.map(h=>[...h]);turn=0;}while(turn<90)deal();});
  desk.querySelector('#desk-deal-reset').addEventListener('click',()=>{hands=initial.map(h=>[...h]);turn=0;renderDeal();dealStatus.textContent='Highest card wins. Won cards go underneath, highest first.';});

  let address=42;
  const row=desk.querySelector('.desk-bit-row');
  desk.querySelector('.desk-bit-fallback').remove();
  const bits=[];
  for(let bit=14;bit>=0;bit--){
    const button=document.createElement('button');button.type='button';button.dataset.bit=bit;
    button.setAttribute('aria-label',`Bit ${bit}, place value ${2**bit}`);
    button.addEventListener('click',()=>{
      const before=address;
      address^=2**bit;renderBits();
      if(address>before && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === false){
        const panel=desk.querySelector('.desk-register');
        const label=desk.querySelector('#desk-bit-sum');
        const p=panel.getBoundingClientRect(),a=button.getBoundingClientRect(),b=label.getBoundingClientRect();
        const addend=note(panel,'bit-addend',String(2**bit));
        addend.style.left=a.x-p.x+'px';addend.style.top=a.y-p.y+'px';
        addend.animate([
          {transform:'translate(0,0)',opacity:1},
          {transform:'translate('+(b.x-a.x)+'px,'+(b.y-a.y)+'px)',opacity:.1}
        ],{duration:270,easing:'ease-out'}).finished.then(()=>addend.remove()).catch(()=>addend.remove());
      }
      if(address===42){
        const scribble=note(desk.querySelector('.desk-register'),'bit-margin-note','@42');
        setTimeout(()=>scribble.remove(),1650);
      }
    });
    row.append(button);bits.push(button);
  }
  function renderBits(){
    const values=[];
    bits.forEach(button=>{const bit=Number(button.dataset.bit),on=Boolean(address&(2**bit));button.textContent=on?'1':'0';button.setAttribute('aria-pressed',String(on));if(on)values.push(2**bit);});
    desk.querySelector('#desk-address-value').value=String(address);
    if(!slip.hidden){
      slipFront.textContent=address.toString(2).padStart(16,'0').match(/.{4}/g).join(' ');
      slipBack.textContent='0x'+address.toString(16).toUpperCase().padStart(4,'0')+' · @'+address;
    }
    desk.querySelector('#desk-bit-sum').textContent=`${values.length?values.join(' + '):'0'} = ${address}`;
  }
  const bitsPaper=desk.querySelector('.desk-register');
  const slip=document.createElement('button');
  slip.type='button';slip.className='found-paper register-slip';
  const slipFront=note(slip,'slip-front',''),slipBack=note(slip,'slip-back','');
  bitsPaper.append(slip);slip.hidden=true;
  bitsPaper.querySelector('.desk-address').addEventListener('dblclick',()=>{
    slip.hidden=!slip.hidden;renderBits();
  });
  slip.addEventListener('click',()=>{
    const flip=slip.toggleAttribute('data-hex');
    slip.setAttribute('aria-pressed',String(flip));renderBits();
  });
  const reset=desk.querySelector('.desk-register-reset');reset.hidden=false;reset.addEventListener('click',()=>{address=42;renderBits();});
  desk.querySelector('.desk-bit-hint').textContent='Flip a bit. Watch the address change.';
  renderBits();
})();
