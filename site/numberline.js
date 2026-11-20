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

  function firstConflict() {
    // Check the infinite periodic set, including the next block. Looking only
    // at the drawn points would make validity depend on the viewport.
    for (const gap of forbidden) {
      for (let residue = 0; residue < period; residue++) {
        if (kept.has(residue) && kept.has((residue + gap) % period))
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
  let extended=null,startX=null,dragNumber=null,suppress=false;
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
  strips.addEventListener('pointerdown',event=>{
    suppress=false;startX=event.clientX;dragNumber=event.target.closest('[data-integer]')?.dataset.integer;
  });
  strips.addEventListener('pointerup',event=>{
    if(startX===null)return;
    const delta=event.clientX-startX;
    startX=null;
    if(Math.abs(delta)<32)return;
    suppress=true;
    if(dragNumber!==undefined && Number(dragNumber)<period){
      const n=(Number(dragNumber)+Math.sign(delta)+period)%period;
      kept.delete(Number(dragNumber));kept.add(n);
    }else if(!extended){
      extended=document.createElement('div');extended.dataset.extraLine='';
      strips.after(extended);
    }
    render();
  });
  strips.addEventListener('pointercancel',()=>{startX=null;});
  strips.addEventListener('click',event=>{
    if(!suppress||!event.detail)return;
    suppress=false;event.preventDefault();event.stopImmediatePropagation();
  },true);
  panel.addEventListener('dblclick',event=>{
    if(event.target.closest('.numberline-continuation')&&!extended){
      extended=document.createElement('div');extended.dataset.extraLine='';
      strips.after(extended);render();
    }
  });
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
      for(let n=21;n<42;n++){
        const cell=document.createElement('b');
        cell.textContent=n;
        cell.classList.toggle('conflict',Boolean(conflict&&(n===conflict[0]+21||n===conflict[1]+21)));
        if(!kept.has(n%period))cell.style.opacity='.44';
        extended.append(cell);
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
