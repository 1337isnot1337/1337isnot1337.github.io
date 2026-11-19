(() => {
  const desk=document.querySelector('.workbench');
  if(!desk) return;
  const tabs=[...desk.querySelectorAll('[data-desk]')];
  const panels=[...desk.querySelectorAll('[data-desk-panel]')];
  function choose(name){
    tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.desk===name)));
    panels.forEach(panel=>panel.hidden=panel.dataset.deskPanel!==name);
  }
  tabs.forEach(button=>button.addEventListener('click',()=>choose(button.dataset.desk)));
  desk.querySelector('.desk-tabs').hidden=false;
  desk.classList.add('desk-ready');
  choose('sound');

  const initial=[[15,7,16,8,1,22,17,9],[10,2,23,18,11,19,12,3],[4,20,13,5,21,14,6]];
  let hands=initial.map(h=>[...h]),turn=0;
  const dealStatus=desk.querySelector('#desk-deal-status');
  function renderDeal(){
    'abc'.split('').forEach((player,i)=>{
      desk.querySelector(`#desk-card-${player}`).textContent=hands[i][0];
      desk.querySelector(`#desk-count-${player}`).textContent=`${hands[i].length} cards`;
    });
    desk.querySelector('#desk-turn').textContent=`Turn ${turn} / 90`;
  }
  function deal(){
    if(turn===90){hands=initial.map(h=>[...h]);turn=0;}
    const exposed=hands.map(h=>h.shift());
    const winner=exposed.indexOf(Math.max(...exposed));
    hands[winner].push(...exposed.sort((a,b)=>b-a));turn++;
    dealStatus.textContent=turn===90?'Exactly the original card order. The next 90 turns will repeat.':`Player ${'ABC'[winner]} wins turn ${turn}. Won cards go underneath, highest first.`;
    renderDeal();
  }
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
    button.addEventListener('click',()=>{address^=2**bit;renderBits();});
    row.append(button);bits.push(button);
  }
  function renderBits(){
    const values=[];
    bits.forEach(button=>{const bit=Number(button.dataset.bit),on=Boolean(address&(2**bit));button.textContent=on?'1':'0';button.setAttribute('aria-pressed',String(on));if(on)values.push(2**bit);});
    desk.querySelector('#desk-address-value').value=String(address);
    desk.querySelector('#desk-bit-sum').textContent=`${values.length?values.join(' + '):'0'} = ${address}`;
  }
  const reset=desk.querySelector('.desk-register-reset');reset.hidden=false;reset.addEventListener('click',()=>{address=42;renderBits();});
  desk.querySelector('.desk-bit-hint').textContent='Flip a bit. Watch the address change.';
  renderBits();
})();
