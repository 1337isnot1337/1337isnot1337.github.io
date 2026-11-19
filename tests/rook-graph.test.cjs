const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
function page(){const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'),{runScripts:'outside-only',url:'https://example.test/'});dom.window.matchMedia=()=>({matches:true});dom.window.HTMLElement.prototype.scrollIntoView=()=>{};dom.window.eval(fs.readFileSync('site/shelf.js','utf8'));dom.window.eval(fs.readFileSync('site/rook-graph.js','utf8'));return {dom,d:dom.window.document};}
test('the graph draws exactly the eighteen rook adjacencies, with degree four and correct shared counts',()=>{
 const p=page(),buttons=[...p.d.querySelectorAll('#rook-board button')],names=buttons.map(b=>b.textContent),edges=[...p.d.querySelectorAll('.rook-graph-edges path')];
 assert.equal(buttons.length,9);assert.equal(edges.length,18);assert.equal(edges.filter(e=>e.getAttribute('d').includes('Q')).length,6);
 const pairs=new Set(edges.map(e=>[e.dataset.from,e.dataset.to].sort().join(',')));assert.equal(pairs.size,18);
 const adjacent=(a,b)=>pairs.has([a,b].sort().join(','));
 for(const a of names){
  assert.equal(names.filter(b=>adjacent(a,b)).length,4);
  for(const b of names.filter(b=>b!==a)){
   assert.equal(adjacent(a,b),a[0]===b[0]||a[1]===b[1]);
   assert.equal(names.filter(c=>adjacent(a,c)&&adjacent(b,c)).length,adjacent(a,b)?1:2);
  }
 }
 assert.equal(p.d.querySelector('.rook-graph-edges').getAttribute('aria-hidden'),'true');p.dom.window.close();
});
test('graph and board views share the same selected positions and live neighbor explanation',()=>{
 const p=page(),frame=p.d.querySelector('.rook-graph-frame'),board=p.d.querySelector('#rook-board');assert.equal(frame.dataset.view,'graph');
 for(const button of board.children){button.click();assert.equal(p.d.querySelectorAll('.rook-graph-edges .is-incident').length,4);}
 p.d.querySelector('[data-rook-pair="A1,B1"]').click();assert.equal(board.querySelectorAll('.neighbor').length,1);assert.equal(p.d.querySelectorAll('.rook-graph-edges .is-incident').length,7);
 const selected=[...board.querySelectorAll('[aria-pressed="true"]')];p.d.querySelector('[data-rook-view="board"]').click();assert.equal(frame.dataset.view,'board');assert.deepEqual([...board.querySelectorAll('[aria-pressed="true"]')],selected);
 p.d.querySelector('[data-rook-pair="A1,B2"]').click();assert.equal(board.querySelectorAll('.neighbor').length,2);p.d.querySelector('[data-rook-view="graph"]').click();assert.equal(p.d.querySelectorAll('.rook-graph-edges .is-incident').length,8);
 assert.match(p.d.querySelector('#rook-caption').textContent,/2 shared neighbors/);assert.match(p.d.querySelector('#conway').textContent,/not a 99-vertex solution/);p.dom.window.close();
});
