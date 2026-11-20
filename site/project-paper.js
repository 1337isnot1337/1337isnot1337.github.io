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
      row.addEventListener('pointermove',event=>{
        if(grip?.id!==event.pointerId||!event.buttons)return;
        const travel=Math.max(-18,Math.min(18,event.clientX-grip.x));
        row.style.setProperty('--strip-drift',travel+'px');
      });
      row.addEventListener('pointerup',event=>{
        if(grip?.id!==event.pointerId)return;
        const delta=(event.clientX-grip.x)+(event.clientY-grip.y);
        grip=null;row.style.removeProperty('--strip-drift');
        if(Math.abs(delta)<20)return;
        periods[i]=delta<0?2:3;
        render();
      });
      row.addEventListener('pointercancel',()=>{grip=null;row.style.removeProperty('--strip-drift');});
    }
  }
  function make(tag,content='',className=''){
    const item=document.createElement(tag);
    item.textContent=content;if(className)item.className=className;
    return item;
  }
  function copyOnHold(surface,reference){
    if(!surface||!navigator.clipboard)return;
    let timer=0,press=null,consumed=false;
    const cancel=()=>{clearTimeout(timer);press=null;};
    surface.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary)return;
      cancel();consumed=false;
      press={x:event.clientX,y:event.clientY};
      timer=setTimeout(()=>{
        const link=reference();
        if(!link)return;
        consumed=true;
        navigator.clipboard.writeText(link).then(()=>{
          surface.classList.add('reader-evidence');
          const receipt=make('small','Copied.','reference-copy-receipt');
          surface.after(receipt);
          setTimeout(()=>{receipt.remove();surface.classList.remove('reader-evidence');},1300);
        }).catch(()=>{consumed=false;});
      },520);
    });
    surface.addEventListener('pointermove',event=>{
      if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>8)cancel();
    });
    window.addEventListener('pointerup',cancel);
    window.addEventListener('pointercancel',cancel);
    surface.addEventListener('click',event=>{
      if(consumed&&event.detail){consumed=false;event.preventDefault();}
    });
  }
  const recording=document.querySelector('#recording');
  copyOnHold(document.querySelector('#spectrum-seek'),()=>{
    if(!recording?.readyState)return null;
    const link=new URL(location.pathname,location.origin);
    link.hash='flyover';link.searchParams.set('t',recording.currentTime.toFixed(2));
    return link.href;
  });
  const bound=document.querySelector('#factoring .research-bound');
  const writtenProof=document.querySelector('#factoring .outbound');
  const theorem='IntegerFactoring.HalfAppendix.sqrtLogLog_factoring';
  const statement='theorem sqrtLogLog_factoring : Factoring.SqrtLogLogConjecture';
  const source='https://github.com/1337isnot1337/integer-factoring/blob/96cd333018060b4ddcb6dbc951b02fd1c0ae2efb/formal-appendix/HalfTheorem.lean#L73';
  const definition='https://github.com/IsaacRudich/SubexponentialDeterministicFactoring/blob/c91cc3f4947caca8977e81a5d14244f73b5ae2b1/Challenge.lean#L76';
  if(bound){
    copyOnHold(writtenProof,()=>source);
    bound.addEventListener('dblclick',event=>{
      if(event.target.closest('a,button'))return;
      let proof=bound.querySelector('.found-paper');
      if(proof){proof.hidden=!proof.hidden;return;}
      proof=make('div','','found-paper theorem-slip');
      const exact=make('a',statement);exact.href=source;
      const expands=make('pre',`∃ C : ℕ, FactoringInTime (fun n =>
  C * 2 ^ (C * n / (Nat.sqrt (Nat.log 2 n) + 1)))`);
      const premise=make('a','FactoringInTime and the exact rate');premise.href=definition;
      const prose=make('p','An existential constant C bounds the deterministic machine. Here n is the binary input length. The output is the smallest prime factor, with the pinned reference’s conventions at 0 and 1.');
      const caption=bound.querySelector('figcaption');
      const mark=on=>caption.classList.toggle('reader-evidence',on);
      premise.addEventListener('focus',()=>mark(true));premise.addEventListener('blur',()=>mark(false));
      premise.addEventListener('pointerenter',()=>mark(true));premise.addEventListener('pointerleave',()=>mark(false));
      copyOnHold(exact,()=>source);
      proof.append(exact,expands,prose,premise);
      bound.append(proof);
    });
  }

  let printSheet=null;
  function printable({title,scope,url,figure}){
    const slip=make('aside','','research-slip');
    slip.append(make('b',title),make('p',scope));
    if(figure){
      const art=make('figure');
      art.append(figure.cloneNode(true));slip.append(art);
    }
    const origin=make('a',url);origin.href=url;slip.append(origin);
    const action=make('button','Print slip','print-research-slip');action.type='button';
    action.addEventListener('click',()=>{
      printSheet?.remove();
      printSheet=slip.cloneNode(true);printSheet.classList.add('research-paper-print');
      printSheet.querySelector('.print-research-slip').remove();
      document.body.append(printSheet);
      document.body.dataset.printResearch='';
      window.print();
    });
    slip.append(action);
    return slip;
  }
  window.addEventListener('afterprint',()=>{
    printSheet?.remove();printSheet=null;
    delete document.body.dataset.printResearch;
  });
  const notes=document.querySelector('.notes-list');
  if(notes){
    let slip=null;
    document.addEventListener('dblclick',event=>{
      const row=event.target.closest('.notes-list li');
      if(!row||event.target.closest('a,button'))return;
      const link=row.querySelector('a');
      slip?.remove();
      const descriptor=row.closest('.notes-section').querySelector('h2').firstChild.textContent.trim();
      slip=printable({title:link.textContent,scope:descriptor+' · claim status and verification in the source',url:link.href});
      row.append(slip);
      try{sessionStorage.setItem('desk-research-slip',link.href);}catch{}
    });
  }
  const proofPage=document.querySelector('[data-theorem-print]');
  if(proofPage){
    proofPage.addEventListener('dblclick',event=>{
      if(event.target.closest('a')||proofPage.nextElementSibling?.classList.contains('research-slip'))return;
      const slip=printable({
        title:theorem,scope:'Formalized in Lean. Deterministic worst-case bound for the smallest prime factor.',
        url:source,figure:document.querySelector('.prose math')||document.querySelector('.hero-figure img')
      });
      proofPage.after(slip);
    });
  }
})();
