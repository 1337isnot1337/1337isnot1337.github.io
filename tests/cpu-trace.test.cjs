const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=()=>fs.readFileSync('site/index.html','utf8');
function page(){const dom=new JSDOM(html(),{runScripts:'outside-only'});dom.window.eval(fs.readFileSync('site/cpu-trace.js','utf8'));return {dom,d:dom.window.document};}
test('CPU trace faithfully displays recorded snapshots, including the discarded wrong path',()=>{
 const p=page(),trace=p.d.querySelector('#cpu-trace');
 const rows=fs.readFileSync('site/assets/cpu-trace/trace.csv','utf8').trim().split('\n').slice(1).map(line=>line.split(','));
 const window=rows.filter(row=>Number(row[0])>=170);
 const instructions={e4d0:'D = D − A',e301:'D;JGT','8a80':'NOP','0001':'@1'};
 assert.equal(trace.querySelectorAll('[role="status"],output').length,1);
 assert.equal(window.length,5);
 for(const [i,row] of window.entries()){
  assert.equal(trace.dataset.time,row[0]);
  assert.equal(p.d.querySelector('#trace-fetch-address').textContent,`Address ${row[1]}`);
  assert.equal(p.d.querySelector('#trace-register-d').textContent,row[6]);
  assert.equal(p.d.querySelector('#trace-fetch-instruction').textContent,instructions[row[2]]);
  if(row[0]==='200'){
   assert.match(p.d.querySelector('#trace-execute-address').textContent,/Bubble · no program address/);
   assert.equal(p.d.querySelector('#trace-execute-instruction').textContent,'Inserted NOP');
   assert.match(p.d.querySelector('#trace-explanation').textContent,/195 ns.*discarded/);
  }else{
   assert.equal(p.d.querySelector('#trace-execute-address').textContent,`Address ${row[3]}`);
   assert.equal(p.d.querySelector('#trace-prediction').textContent,`Predicted next: ${row[7]} · Actual next: ${row[8]}`);
  }
  if(row[0]==='190'){assert.equal(trace.dataset.state,'mispredict');assert.match(p.d.querySelector('#trace-explanation').textContent,/wrong path/);}
  if(i<4)p.d.querySelector('#trace-next').click();
 }
 assert.equal(p.d.querySelector('#trace-next').disabled,true);
 p.d.querySelector('#trace-prev').click();assert.equal(trace.dataset.time,'200');
 p.d.querySelector('#trace-reset').click();assert.equal(trace.dataset.time,'170');assert.equal(p.d.querySelector('#trace-prev').disabled,true);
 p.dom.window.close();
});
test('CPU trace has an honest static snapshot without JavaScript',()=>{
 const dom=new JSDOM(html()),d=dom.window.document,trace=d.querySelector('#cpu-trace');
 assert.equal(trace.dataset.time,'190');
 assert.equal(trace.querySelector('.trace-controls').hidden,true);
 assert.match(trace.textContent,/not hardware speed measurements/);
 assert.match(trace.textContent,/not program address 0/);
 assert.match(trace.textContent,/195 ns/);
 assert.equal(trace.querySelector('#trace-register-d').textContent,'0');
 dom.window.close();
});
