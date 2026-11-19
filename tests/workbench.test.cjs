const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function desk(){
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'),{runScripts:'outside-only'});
 dom.window.eval(fs.readFileSync('site/workbench.js','utf8'));
 const d=dom.window.document;
 return {dom,d,click:selector=>d.querySelector(selector).click()};
}
test('workbench switches its real project sheets and retains experiment state',()=>{
 const p=desk();
 assert.equal(p.d.querySelectorAll('[data-desk-panel]:not([hidden])').length,1);
 p.click('[data-desk="cards"]');
 assert.equal(p.d.querySelector('[data-desk="cards"]').getAttribute('aria-pressed'),'true');
 p.click('#desk-deal-one');
 assert.equal(p.d.querySelector('#desk-turn').textContent,'Turn 1 / 90');
 p.click('[data-desk="bits"]');p.click('[data-desk="cards"]');
 assert.equal(p.d.querySelector('#desk-turn').textContent,'Turn 1 / 90');
 p.click('#desk-deal-cycle');
 assert.equal(p.d.querySelector('#desk-turn').textContent,'Turn 90 / 90');
 assert.deepEqual(['a','b','c'].map(id=>p.d.querySelector('#desk-card-'+id).textContent),['15','10','4']);
 assert.deepEqual(['a','b','c'].map(id=>p.d.querySelector('#desk-count-'+id).textContent),['8 cards','8 cards','7 cards']);
 p.click('#desk-deal-one');assert.equal(p.d.querySelector('#desk-turn').textContent,'Turn 1 / 90');
 p.click('#desk-deal-reset');assert.equal(p.d.querySelector('#desk-turn').textContent,'Turn 0 / 90');
 p.dom.window.close();
});
test('workbench bit switches encode every address bit with fixed instruction zero',()=>{
 const p=desk();
 const bits=[...p.d.querySelectorAll('.desk-bit-row button')];
 assert.equal(bits.length,15);
 assert.equal(p.d.querySelector('.desk-fixed-bit').childNodes[0].textContent,'0');
 for(const bit of bits)if(bit.getAttribute('aria-pressed')==='true')bit.click();
 assert.equal(p.d.querySelector('#desk-address-value').value,'0');
 for(const bit of bits)bit.click();
 assert.equal(p.d.querySelector('#desk-address-value').value,'32767');
 assert.match(p.d.querySelector('#desk-bit-sum').textContent,/16384.*1 = 32767/);
 p.click('.desk-register-reset');assert.equal(p.d.querySelector('#desk-address-value').value,'42');
 p.dom.window.close();
});
test('workbench remains readable without JavaScript and does not preload audio',()=>{
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'));
 const d=dom.window.document.querySelector('.workbench');
 assert.equal(d.querySelectorAll('[data-desk-panel]:not([hidden])').length,4);
 const audio=d.querySelector('audio');
 assert.equal(audio.getAttribute('src'),null);
 assert.equal(audio.hidden,true);
 assert.equal(audio.preload,'none');
 assert.ok(fs.existsSync('site/'+audio.dataset.deskSrc));
 assert.equal(d.querySelector('.desk-listen').hidden,true);
 assert.equal(d.querySelector('.desk-tabs').hidden,true);
 assert.equal(d.querySelector('.desk-controls').hidden,true);
 assert.equal(d.querySelector('.desk-register-reset').hidden,true);
 assert.equal(d.querySelector('img').getAttribute('loading'),'lazy');
 assert.match(d.textContent,/unrefereed/);
 assert.ok(d.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/"]'));
 dom.window.close();
});

test('in-place recording is user initiated, follows real time and stops when leaving the sheet',async()=>{
 const p=desk(),audio=p.d.querySelector('#desk-audio');
 let playing=false,starts=0,pauses=0;
 Object.defineProperty(audio,'paused',{get:()=>!playing});
 Object.defineProperty(audio,'duration',{value:85});
 audio.play=async()=>{playing=true;starts++;audio.dispatchEvent(new p.dom.window.Event('play'));};
 audio.pause=()=>{playing=false;pauses++;};
 assert.equal(audio.getAttribute('src'),null);
 p.d.querySelector('#desk-play-recording').focus();
 p.click('#desk-play-recording');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(starts,1);
 assert.equal(audio.getAttribute('src'),'assets/livermore.mp3');
 assert.equal(audio.hidden,false);
 assert.equal(p.d.activeElement,audio);
 assert.equal(p.d.querySelector('.desk-listen').hidden,true);
 audio.currentTime=42.5;audio.dispatchEvent(new p.dom.window.Event('timeupdate'));
 assert.equal(p.d.querySelector('.desk-playhead').style.left,'50%');
 assert.equal(p.d.querySelector('.desk-playhead').hidden,false);
 p.click('[data-desk="cards"]');assert.equal(pauses,1);
 playing=true;p.click('.desk-sound a[data-project]');assert.equal(pauses,2);
 p.dom.window.close();
});
test('in-place recording failures expose a retry without treating a deliberate pause as failure',async()=>{
 const p=desk(),audio=p.d.querySelector('#desk-audio');
 audio.play=async()=>{throw new Error('Network unavailable');};
 p.click('#desk-play-recording');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(p.d.querySelector('#desk-audio-status').hidden,false);
 assert.equal(p.d.querySelector('.desk-listen').hidden,false);
 assert.match(p.d.querySelector('#desk-play-recording').textContent,/again/);
 let reloads=0;
 Object.defineProperty(audio,'error',{value:{code:2},configurable:true});
 audio.load=()=>{reloads++;};audio.play=async()=>{};
 p.click('#desk-play-recording');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(reloads,1);
 assert.equal(p.d.querySelector('#desk-audio-status').hidden,true);
 assert.equal(p.d.querySelector('.desk-listen').hidden,true);
 audio.play=async()=>{throw new p.dom.window.DOMException('Paused','AbortError');};
 p.click('#desk-play-recording');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(p.d.querySelector('#desk-audio-status').hidden,true);
 p.dom.window.close();
});

test('the inline recording and project reader never play over each other',()=>{
 const p=desk(),inline=p.d.querySelector('#desk-audio'),reader=p.d.querySelector('#recording');
 let inlinePauses=0,readerPauses=0;
 Object.defineProperty(inline,'paused',{value:false});
 Object.defineProperty(reader,'paused',{value:false});
 inline.pause=()=>{inlinePauses++;};reader.pause=()=>{readerPauses++;};
 inline.dispatchEvent(new p.dom.window.Event('play'));
 assert.equal(readerPauses,1);
 reader.dispatchEvent(new p.dom.window.Event('play'));
 assert.equal(inlinePauses,1);
 p.dom.window.close();
});

test('shelf handoff selects the matching sheet and focuses its heading without starting audio',()=>{
 const p=desk();
 p.dom.window.matchMedia=()=>({matches:true});
 const bench=p.d.querySelector('.workbench');let scrolled=0;
 bench.scrollIntoView=options=>{assert.equal(options.behavior,'instant');scrolled++};
 for(const name of ['cards','bits','sound']){
  bench.dispatchEvent(new p.dom.window.CustomEvent('open-from-shelf',{detail:name}));
  const panel=p.d.querySelector(`[data-desk-panel="${name}"]`);
  assert.equal(panel.hidden,false);
  assert.equal(p.d.activeElement,panel.querySelector('h3'));
  assert.equal(p.d.querySelector('#desk-audio').getAttribute('src'),null);
 }
 assert.equal(scrolled,3);
 for(const panel of p.d.querySelectorAll('[data-desk-panel]')){
  const link=panel.querySelector('.desk-project');
  assert.ok(link.href.endsWith('#'+link.dataset.project));
  assert.ok(fs.existsSync('site/'+link.querySelector('img').getAttribute('src')));
 }
 p.dom.window.close();
});

test('each desk sheet reads heading, artifact, then explanation in the DOM',()=>{
 const p=desk();
 for(const panel of p.d.querySelectorAll('[data-desk-panel]')){
  assert.deepEqual([...panel.children].map(el=>el.classList.contains('desk-intro')?'heading':el.classList.contains('desk-artifact')?'artifact':el.classList.contains('desk-copy')?'explanation':'unexpected'),['heading','artifact','explanation']);
  assert.ok(panel.querySelector('.desk-intro h3'));
  assert.ok(panel.querySelector('.desk-artifact'));
  assert.ok(panel.querySelector('.desk-copy p'));
 }
 assert.match(p.d.querySelector('.desk-numbers .desk-copy').textContent,/not a proof of the general theorem/);
 assert.match(p.d.querySelector('.desk-cards .desk-copy').textContent,/unrefereed; Lean status is recorded per result/);
 p.dom.window.close();
});
