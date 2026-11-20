const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
test('robotics notebook presents the team photograph and programming lead role',()=>{
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'));
 const robotics=dom.window.document.querySelector('.notebook-robotics');
 assert.match(robotics.textContent,/I lead programming for Titan Robotics/);
 assert.match(robotics.querySelector('.leaf-art img').alt,/REEFSCAPE/);
 assert.equal(robotics.querySelectorAll('script').length,0);
 dom.window.close();
});
test('personal notebook preserves the public abstract and personal-interest links',()=>{
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'));
 const about=dom.window.document.querySelector('#about');
 assert.ok(about.querySelector('a[href="https://digitalcommons.imsa.edu/sir_presentations/2026/session2/5/"]'));
 assert.match(about.textContent,/Nathan Catlett/);
 assert.match(about.textContent,/April 15, 2026/);
 assert.match(about.textContent,/abstract/i);
 assert.equal(about.querySelectorAll('.favorites a').length,4);
 assert.match(about.textContent,/Epoch/);
 assert.match(about.textContent,/Scholastic Bowl/);
 dom.window.close();
});
