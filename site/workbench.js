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
  audio.addEventListener('timeupdate',()=>{
    const valid=Number.isFinite(audio.duration) && audio.duration>0;
    playhead.hidden=!valid || audio.currentTime===0;
    if(valid) playhead.style.left=Math.min(99.8,100*audio.currentTime/audio.duration)+'%';
  });
  const spectrum=desk.querySelector('.desk-spectrum');
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function paperGesture(surface,onMove,onRelease){
    let down=null;
    surface.addEventListener('pointerdown',event=>{
      if(!event.isPrimary || event.button!==0)return;
      down={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};
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
  function position(event){
    const rect=spectrum.getBoundingClientRect();
    return [clamp((event.clientX-rect.left)/rect.width,0,1),clamp((event.clientY-rect.top)/rect.height,0,1)];
  }
  paperGesture(spectrum,(event,down)=>{
    const [x,y]=position(event),duration=audio.duration||85;
    marker??=note(spectrum,'spectrum-note','');
    marker.style.setProperty('--at',clamp(x,.12,.88)*100+'%');
    marker.textContent=(duration*x).toFixed(1)+' s · ≈'+Math.round(400-y*300)+' Hz';
    const [start]=position({clientX:down.x,clientY:down.y});
    if(Math.abs(start-x)>.025){
      loop=[Math.min(start,x),Math.max(start,x)].map(fraction=>fraction*duration);
      if(!audio.paused)audio.dataset.deskCarry='';
      loopBand??=note(spectrum,'spectrum-loop','');
      loopBand.style.left=Math.min(start,x)*100+'%';loopBand.style.width=Math.abs(start-x)*100+'%';
    }
  },(event,down)=>{
    if(down.dragged&&loop&&audio.readyState)audio.currentTime=loop[0];
  });
  spectrum.addEventListener('dblclick',()=>{delete audio.dataset.deskCarry;loop=null;loopBand?.remove();loopBand=null;marker?.remove();marker=null;});
  audio.addEventListener('timeupdate',()=>{
    if(loop&&audio.currentTime>=loop[1]&&!audio.paused)audio.currentTime=loop[0];
  });
  const figure=map.querySelector('figure');
  figure.addEventListener('dblclick',event=>{
    if(!event.target.closest('img'))return;
    const holder=map.querySelector('#desk-map-image');
    const side=holder.dataset.fit==='alternative'?'highest':'alternative';
    holder.dataset.fit=side;
    holder.querySelector('[data-fit-note]')?.remove();
    const text=side==='highest'?'Star · highest fit in this run':'Diamond · alternative fit in the same run';
    const fit=note(holder,'found-paper',text);
    fit.dataset.fitNote='';
    holder.querySelector('.map-pick')?.remove();
    const ring=note(holder,'map-pick','');
    ring.style.left=(side==='highest'?72.1:74.1)+'%';
    ring.style.top=(side==='highest'?48.0:49.5)+'%';
    ring.setAttribute('aria-hidden','true');
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
  let traced=null;
  function renderDeal(){
    'abc'.split('').forEach((player,i)=>{
      desk.querySelector(`#desk-card-${player}`).textContent=hands[i][0];
      desk.querySelector(`#desk-count-${player}`).textContent=`${hands[i].length} cards`;
    });
    dealCards.toggleAttribute('data-loop',turn===90);
    if(traced)traced.remove();
    traced=null;
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
  paperGesture(dealCards,()=>{},(event,down)=>{
    const delta=event.clientX-down.x;
    if(!down.dragged||Math.abs(delta)<20)return;
    if(delta>0)deal();
    else if(turn>0){
      turn--;hands=states[turn].map(hand=>[...hand]);renderDeal();
      dealStatus.textContent='Rewound to turn '+turn+'. The cards have agreed to forget.';
    }
  });
  dealCards.addEventListener('dblclick',event=>{
    if(turn!==6&&turn!==90)return;
    const card=event.target.closest('.desk-playing-cards > div');
    if(!card)return;
    traced?.remove();
    const i=[...dealCards.children].indexOf(card);
    const rank=hands[i][0];
    if(turn===6){
      const now=hands[i].join(' · '),start=initial[i].join(' · ');
      traced=note(card,'found-paper','Start '+start+' / now '+now);
    }else{
      const visits=states.flatMap((state,n)=>{
        const location=state.findIndex(hand=>hand.includes(rank));
        if(n>0&&states[n-1][location].includes(rank))return [];
        return [n+' '+ 'ABC'[location]];
      });
      traced=note(card,'found-paper',rank+' visited '+visits.join(' → '));
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
        const label=desk.querySelector('#desk-bit-sum');
        label.animate([{opacity:.65,transform:'translateY(-3px)'},{opacity:1,transform:'translateY(0)'}],{duration:170});
      }
    });
    row.append(button);bits.push(button);
  }
  function renderBits(){
    const values=[];
    bits.forEach(button=>{const bit=Number(button.dataset.bit),on=Boolean(address&(2**bit));button.textContent=on?'1':'0';button.setAttribute('aria-pressed',String(on));if(on)values.push(2**bit);});
    desk.querySelector('#desk-address-value').value=String(address);
    if(!slip.hidden)slip.textContent=slip.hasAttribute('data-hex')?
      '0x'+address.toString(16).toUpperCase().padStart(4,'0')+' · @'+address:
      address.toString(2).padStart(16,'0').match(/.{4}/g).join(' ')+' · @'+address+(address===42?' · unusually prepared for this question':'');
    desk.querySelector('#desk-bit-sum').textContent=`${values.length?values.join(' + '):'0'} = ${address}`;
  }
  const bitsPaper=desk.querySelector('.desk-register');
  const slip=note(bitsPaper,'found-paper','');
  slip.hidden=true;
  bitsPaper.querySelector('.desk-address').addEventListener('dblclick',()=>{
    slip.hidden=!slip.hidden;renderBits();
  });
  slip.addEventListener('click',()=>{
    slip.toggleAttribute('data-hex');renderBits();
  });
  const reset=desk.querySelector('.desk-register-reset');reset.hidden=false;reset.addEventListener('click',()=>{address=42;renderBits();});
  desk.querySelector('.desk-bit-hint').textContent='Flip a bit. Watch the address change.';
  renderBits();
})();
