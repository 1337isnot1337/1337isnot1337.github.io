(() => {
  const panel = document.querySelector('[data-desk-panel="numbers"]');
  if (!panel) return;

  const period = 7;
  const forbidden = [2, 5, 9];
  const example = [0, 1, 4];
  let kept = new Set(example);
  const status = panel.querySelector('#desk-number-status');
  const density = panel.querySelector('#desk-number-density');
  const explanation = panel.querySelector('#desk-number-explanation');
  const controls = [];

  // The first seven positions choose residue classes, not isolated points.
  for (const point of panel.querySelectorAll('[data-integer]')) {
    const n = Number(point.dataset.integer);
    if (n >= period) { point.setAttribute('aria-hidden', 'true'); continue; }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = point.className;
    button.dataset.integer = n;
    button.dataset.residue = n;
    button.textContent = n;
    button.setAttribute('aria-label', `Keep position ${n} in each 7-number block`);
    button.addEventListener('click', () => {
      if (kept.has(n)) kept.delete(n);
      else kept.add(n);
      render();
    });
    point.replaceWith(button);
    controls.push(button);
  }
  const points = [...panel.querySelectorAll('[data-integer]')];

  function firstConflict(source=kept) {
    // Check the infinite periodic set, including the next block. Looking only
    // at the drawn points would make validity depend on the viewport.
    for (const gap of forbidden) {
      for (let residue = 0; residue < period; residue++) {
        if (source.has(residue) && source.has((residue + gap) % period))
          return [residue, residue + gap, gap];
      }
    }
    return null;
  }

  const strips=panel.querySelector('.numberline-strips');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('numberline-bridge');svg.setAttribute('aria-hidden','true');svg.hidden=true;
  const bridge=document.createElementNS(svg.namespaceURI,'path');svg.append(bridge);
  strips.style.position='relative';strips.append(svg);
  let extended=null,grip=null,suppress=false;
  function drawBridge(conflict) {
    if(!conflict || panel.hidden){svg.style.display='none';return;}
    const base=strips.getBoundingClientRect();
    const [from,to]=conflict.map(n=>points.find(point=>Number(point.dataset.integer)===n)?.getBoundingClientRect());
    if(!from || !to)return;
    const a=[from.x+from.width/2-base.x,from.y+from.height/3-base.y];
    const b=[to.x+to.width/2-base.x,to.y+to.height/3-base.y];
    svg.removeAttribute('hidden');svg.style.display='';
    bridge.setAttribute('d','M'+a.join(',')+' Q'+((a[0]+b[0])/2)+','+(Math.min(a[1],b[1])-24)+' '+b.join(','));
  }
  function exposeRemainder(){
    if(extended)return;
    extended=document.createElement('div');extended.dataset.extraLine='';
    strips.after(extended);
  }
  function displacement(event){
    const first=controls[0].getBoundingClientRect();
    const step=controls[1].getBoundingClientRect().left-first.left;
    return step?Math.round((event.clientX-grip.x)/step):0;
  }
  function tentative(residue){
    const copy=new Set(kept);
    copy.delete(grip.from);copy.add(residue);
    return copy;
  }
  strips.addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.isPrimary)return;
    suppress=false;
    const point=event.target.closest('[data-integer]');
    const from=point?Number(point.dataset.integer):null;
    grip={id:event.pointerId,x:event.clientX,from,dragged:false,target:null};
  });
  strips.addEventListener('pointermove',event=>{
    if(grip?.id!==event.pointerId||!event.buttons)return;
    grip.dragged ||= Math.abs(event.clientX-grip.x)>12;
    if(!grip.dragged)return;
    if(!strips.hasPointerCapture(event.pointerId))strips.setPointerCapture(event.pointerId);
    if(grip.from===null||grip.from>=period)return;
    const destination=(grip.from+displacement(event)%period+period)%period;
    if(grip.target===destination)return;
    grip.target=destination;
    const problem=firstConflict(tentative(destination));
    controls.forEach((control,i)=>control.classList.toggle('numberline-ghost',i===destination));
    drawBridge(problem);
    explanation.textContent=problem
      ? 'Here '+problem[0]+' and '+problem[1]+' would be '+problem[2]+' apart.'
      : 'No forbidden gap here.';
  });
  strips.addEventListener('pointerup',event=>{
    if(grip?.id!==event.pointerId)return;
    const finished=grip;grip=null;
    controls.forEach(control=>control.classList.remove('numberline-ghost'));
    if(!finished.dragged)return;
    suppress=true;
    if(finished.from!==null&&finished.from<period&&finished.target!==null){
      kept.delete(finished.from);kept.add(finished.target);
    }else if(Math.abs(event.clientX-finished.x)>32)exposeRemainder();
    render();
  });
  strips.addEventListener('pointercancel',()=>{
    grip=null;controls.forEach(control=>control.classList.remove('numberline-ghost'));render();
  });
  strips.addEventListener('click',event=>{
    if(!suppress||!event.detail)return;
    suppress=false;event.preventDefault();event.stopImmediatePropagation();
  },true);
  panel.addEventListener('dblclick',event=>{
    if(event.target.closest('.numberline-continuation')){exposeRemainder();render();}
  });
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>drawBridge(firstConflict())).observe(strips);
  function render() {
    const conflict = firstConflict();
    for (const point of points) {
      const n = Number(point.dataset.integer);
      point.classList.toggle('is-selected', kept.has(n % period));
      point.classList.toggle('is-conflict', Boolean(conflict && (n === conflict[0] || n === conflict[1])));
    }
    for (const button of controls)
      button.setAttribute('aria-pressed', String(kept.has(Number(button.dataset.residue))));
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>drawBridge(conflict));
    if(extended){
      extended.replaceChildren();
      const pair=conflict?conflict.slice(0,2).map(value=>value+21):[];
      for(let n=21;n<42;n++){
        const cell=document.createElement('b');
        cell.textContent=n;cell.dataset.extendedPoint=String(n);
        cell.classList.toggle('conflict',pair.includes(n));
        if(!kept.has(n%period))cell.style.opacity='.44';
        extended.append(cell);
      }
      if(conflict){
        const jump=document.createElement('button');jump.type='button';
        jump.textContent=pair[0]+' to '+pair[1]+' · gap '+conflict[2];
        jump.addEventListener('click',()=>{
          const problem=extended.querySelector('.conflict');
          problem.tabIndex=-1;problem.focus({preventScroll:true});
          problem.scrollIntoView({block:'nearest'});
          for(const point of extended.querySelectorAll('.conflict'))point.classList.add('jumped');
        });
        extended.append(jump);
      }
    }
    density.textContent = `${kept.size}/7`;
    status.dataset.valid = String(!conflict);
    explanation.textContent = conflict
      ? `${conflict[0]} and ${conflict[1]} are ${conflict[2]} apart. That gap is forbidden.`
      : kept.size ? 'No pair is 2, 5 or 9 apart.' : 'No numbers selected.';
  }

  const reset = panel.querySelector('#desk-number-reset');
  reset.hidden = false;
  reset.addEventListener('click', () => { kept = new Set(example); render(); });
  panel.querySelector('.numberline-instruction').textContent = 'Toggle the first row; the same pattern repeats below.';
  render();
})();
