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
test('workbench switches its three real project sheets and retains experiment state',()=>{
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
 assert.equal(d.querySelectorAll('[data-desk-panel]:not([hidden])').length,3);
 assert.equal(d.querySelectorAll('audio').length,0);
 assert.equal(d.querySelector('.desk-tabs').hidden,true);
 assert.equal(d.querySelector('.desk-controls').hidden,true);
 assert.equal(d.querySelector('.desk-register-reset').hidden,true);
 assert.equal(d.querySelector('img').getAttribute('loading'),'lazy');
 assert.match(d.textContent,/unrefereed/);
 assert.ok(d.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/"]'));
 dom.window.close();
});
