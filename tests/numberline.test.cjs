const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('site/index.html','utf8');
function example(){
 const dom=new JSDOM(html,{runScripts:'outside-only'});
 dom.window.eval(fs.readFileSync('site/numberline.js','utf8'));
 const panel=dom.window.document.querySelector('[data-desk-panel="numbers"]');
 const buttons=[...panel.querySelectorAll('[data-residue]')];
 return{dom,panel,buttons,set(mask){for(const button of buttons){const expected=Boolean(mask&(1<<Number(button.dataset.residue)));if((button.getAttribute('aria-pressed')==='true')!==expected)button.click();}}};
}
test('all128 repeating patterns agree with an independent integer-line check',()=>{
 const p=example();let validPatterns=0,maxCount=0;
 assert.equal(p.buttons.length,7);
 for(let mask=0;mask<128;mask++){
  p.set(mask);
  const has=n=>Boolean(mask&(1<<((n%7+7)%7)));
  const count=Array.from({length:7},(_,r)=>has(r)).filter(Boolean).length;
  let valid=true;
  for(let n=-21;n<=21;n++)for(const gap of[2,5,9])if(has(n)&&has(n+gap))valid=false;
  assert.equal(p.panel.querySelector('#desk-number-status').dataset.valid,String(valid),`mask ${mask}`);
  assert.equal(p.panel.querySelector('#desk-number-density').textContent,`${count}/7`);
  assert.equal(p.panel.querySelectorAll('[data-integer].is-selected').length,3*count);
  const conflict=[...p.panel.querySelectorAll('.is-conflict')].map(node=>Number(node.dataset.integer));
  assert.equal(conflict.length,valid?0:2);
  if(!valid){assert.ok([2,5,9].includes(conflict[1]-conflict[0]));assert.ok(conflict.every(has));}
  else{validPatterns++;maxCount=Math.max(maxCount,count);}
 }
 assert.equal(validPatterns,29);
 assert.equal(maxCount,3);
 p.dom.window.close();
});
test('conflicts cross the period boundary and reset restores the actual014 example',()=>{
 const p=example();p.set((1<<0)|(1<<5));
 assert.match(p.panel.querySelector('#desk-number-explanation').textContent,/5 and 7 are 2 apart/);
 assert.deepEqual([...p.panel.querySelectorAll('.is-conflict')].map(n=>n.textContent),['5','7']);
 p.panel.querySelector('#desk-number-reset').click();
 assert.deepEqual(p.buttons.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>Number(b.dataset.residue)),[0,1,4]);
 assert.equal(p.panel.querySelector('#desk-number-status').dataset.valid,'true');
 assert.equal(p.panel.querySelector('#desk-number-density').textContent,'3/7');
 assert.equal(p.panel.querySelector('#desk-number-status').getAttribute('aria-atomic'),'true');
 assert.ok(p.panel.querySelector('#desk-number-status #desk-number-explanation'));
 p.dom.window.close();
});
test('without JavaScript the numberline is a complete attributed worked example',()=>{
 const dom=new JSDOM(html),p=dom.window.document.querySelector('[data-desk-panel="numbers"]');
 assert.equal(p.querySelectorAll('[data-integer]').length,21);
 assert.equal(p.querySelectorAll('.is-selected').length,9);
 assert.equal(p.querySelector('#desk-number-reset').hidden,true);
 assert.match(p.textContent,/both directions/);
 assert.match(p.textContent,/not a proof of the general theorem/);
 assert.ok(p.querySelector('a[href="/solved-conjectures/results/haralambis-three-differences/proof/"]'));
 assert.ok(p.querySelector('a[href*="d0baa69c2eb911888d9d93ef6efec707a9a86630/lean/Conjectures/HaralambisExamples.lean"]'));
 dom.window.close();
});
