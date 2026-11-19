(() => {
  const board=document.querySelector('#rook-board');
  const controls=document.querySelector('.rook-view-controls');
  if(!board || !controls || board.children.length!==9) return;
  const edges=[
  [
    "A3",
    "B3",
    "M60,60 L150,60"
  ],
  [
    "B3",
    "C3",
    "M150,60 L240,60"
  ],
  [
    "A3",
    "C3",
    "M60,60 Q150,-30 240,60"
  ],
  [
    "A2",
    "B2",
    "M60,150 L150,150"
  ],
  [
    "B2",
    "C2",
    "M150,150 L240,150"
  ],
  [
    "A2",
    "C2",
    "M60,150 Q150,60 240,150"
  ],
  [
    "A1",
    "B1",
    "M60,240 L150,240"
  ],
  [
    "B1",
    "C1",
    "M150,240 L240,240"
  ],
  [
    "A1",
    "C1",
    "M60,240 Q150,330 240,240"
  ],
  [
    "A3",
    "A2",
    "M60,60 L60,150"
  ],
  [
    "A2",
    "A1",
    "M60,150 L60,240"
  ],
  [
    "A3",
    "A1",
    "M60,60 Q-30,150 60,240"
  ],
  [
    "B3",
    "B2",
    "M150,60 L150,150"
  ],
  [
    "B2",
    "B1",
    "M150,150 L150,240"
  ],
  [
    "B3",
    "B1",
    "M150,60 Q60,150 150,240"
  ],
  [
    "C3",
    "C2",
    "M240,60 L240,150"
  ],
  [
    "C2",
    "C1",
    "M240,150 L240,240"
  ],
  [
    "C3",
    "C1",
    "M240,60 Q330,150 240,240"
  ]
];
  const frame=document.createElement('div');frame.className='rook-graph-frame';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('rook-graph-edges');svg.setAttribute('viewBox','0 0 300 300');
  svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  for(const [from,to,d] of edges){
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.dataset.from=from;path.dataset.to=to;path.setAttribute('d',d);svg.append(path);
  }
  board.before(frame);frame.append(svg,board);
  const key=document.querySelector('.rook-graph-key');
  function render(){
    const selected=new Set([...board.children].filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.textContent));
    for(const path of svg.children)path.classList.toggle('is-incident',selected.has(path.dataset.from)||selected.has(path.dataset.to));
  }
  function view(name){
    frame.dataset.view=name;
    controls.querySelectorAll('[data-rook-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rookView===name)));
    board.setAttribute('aria-label',name==='graph'?'Choose a vertex in the nine-vertex rook graph':'Choose a rook position on the board');
    key.hidden=name!=='graph';
  }
  controls.querySelectorAll('[data-rook-view]').forEach(button=>button.addEventListener('click',()=>view(button.dataset.rookView)));
  board.addEventListener('rook-change',render);
  controls.hidden=false;document.querySelector('.rook-graph-count').hidden=false;
  view('graph');render();
})();
