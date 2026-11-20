(() => {
  const paper=document.querySelector('#schedule .schedule-example');
  if(paper){
    const inputs=[...paper.querySelectorAll('.schedule-example-input > div')];
    const link=paper.querySelector('a[href*="example=1"]');
    const days=[['A','C','D'],['B','I']];
    const rooms=['A113','B204'];
    const periods=[2,3];
    function render(){
      inputs.forEach((row,i)=>{row.querySelector('code').textContent=periods[i]+'('+['A,C-D','B,I'][i]+')';});
      for(const cell of paper.querySelectorAll('[data-example-period]')){
        const day=cell.closest('[data-example-day]').dataset.exampleDay;
        const i=periods.findIndex((period,j)=>String(period)===cell.dataset.examplePeriod&&days[j].includes(day));
        cell.textContent=rooms[i]||'Free period';
      }
      link.href='/imsa-map/?example=1&mat='+periods[0]+'&phy='+periods[1];
    }
    for(const [i,row] of inputs.entries()){
      let grip=null;
      row.addEventListener('pointerdown',event=>{
        if(event.button!==0||!event.isPrimary)return;
        grip={id:event.pointerId,x:event.clientX,y:event.clientY};
        row.setPointerCapture(event.pointerId);
      });
      row.addEventListener('pointerup',event=>{
        if(grip?.id!==event.pointerId)return;
        const delta=(event.clientX-grip.x)+(event.clientY-grip.y);
        grip=null;
        if(Math.abs(delta)<20)return;
        periods[i]=delta<0?2:3;
        render();
      });
      row.addEventListener('pointercancel',()=>{grip=null;});
    }
  }
  const bound=document.querySelector('#factoring .research-bound');
  const writtenProof=document.querySelector('#factoring .outbound');
  const theorem='IntegerFactoring.HalfAppendix.sqrtLogLog_factoring';
  const source='https://github.com/1337isnot1337/integer-factoring/blob/96cd333018060b4ddcb6dbc951b02fd1c0ae2efb/formal-appendix/HalfTheorem.lean#L73';
  if(bound){
    bound.addEventListener('dblclick',event=>{
      if(event.target.closest('a'))return;
      let proof=bound.querySelector('.found-paper');
      if(proof){proof.hidden=!proof.hidden;return;}
      proof=document.createElement('div');proof.className='found-paper';
      const exact=document.createElement('a');exact.href=source;
      exact.textContent='theorem sqrtLogLog_factoring : Factoring.SqrtLogLogConjecture';
      const premise=document.createElement('button');
      premise.type='button';premise.textContent='SqrtLogLogConjecture';
      const caption=bound.querySelector('figcaption');
      const mark=on=>caption.classList.toggle('reader-evidence',on);
      premise.addEventListener('focus',()=>mark(true));premise.addEventListener('blur',()=>mark(false));
      premise.addEventListener('pointerenter',()=>mark(true));premise.addEventListener('pointerleave',()=>mark(false));
      premise.addEventListener('click',()=>{mark(true);caption.scrollIntoView({block:'nearest'});});
      proof.append(exact,' ',premise);
      bound.append(proof);
    });
    writtenProof?.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      const copy=setTimeout(()=>navigator.clipboard?.writeText(source).then(()=>{
        writtenProof.classList.add('reader-evidence');setTimeout(()=>writtenProof.classList.remove('reader-evidence'),850);
      }).catch(()=>{}),500);
      window.addEventListener('pointerup',()=>clearTimeout(copy),{once:true});
      window.addEventListener('pointercancel',()=>clearTimeout(copy),{once:true});
    });
  }
  const notes=document.querySelector('.notes-list');
  if(notes){
    let slip=null;
    document.addEventListener('dblclick',event=>{
      const row=event.target.closest('.notes-list li');
      if(!row||event.target.closest('a'))return;
      const link=row.querySelector('a');
      slip?.remove();
      slip=document.createElement('aside');slip.className='research-slip';
      const title=document.createElement('b');title.textContent=link.textContent;
      const url=document.createElement('p');url.textContent=link.href;
      const scope=document.createElement('small');
      scope.textContent=row.closest('.notes-section').querySelector('h2').firstChild.textContent.trim();
      slip.append(title,url,scope);
      row.append(slip);
      try{sessionStorage.setItem('desk-research-slip',link.href);}catch{}
    });
  }
  const proofPage=document.querySelector('[data-theorem-print]');
  if(proofPage){
    proofPage.addEventListener('dblclick',()=>{
      if(proofPage.querySelector('.research-slip'))return;
      const slip=document.createElement('aside');slip.className='research-slip';
      const label=document.createElement('b');label.textContent=theorem;
      const scope=document.createElement('p');scope.textContent='Smallest prime factor · deterministic worst case · saving exponent ½ formalized.';
      const url=document.createElement('p');url.textContent=source;
      slip.append(label,scope,url);proofPage.append(slip);
    });
  }
})();
