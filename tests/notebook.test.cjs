const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source='https://github.com/titan2022/FRC-2026-JAVA/blob/275a9639b7a768b2026bf9e56adfdf6069d0093e/src/main/java/frc/robot/subsystems/base/VoltageControlledBase.java';
const normalized=text=>text.replace(/\s+/g,' ').trim();
test('personal notebook shows the real pinned robot excerpt without executing it',()=>{
 const dom=new JSDOM(fs.readFileSync('site/index.html','utf8'));
 const about=dom.window.document.querySelector('#about');
 assert.equal(normalized(about.querySelector('pre code').textContent),normalized(`public void run() {
 setVoltage(DEFAULT_VOLTAGE);
}
public void reverse() {
 setVoltage(-DEFAULT_VOLTAGE);
}
public void stop() {
 setVoltage(0);
 motor.stopMotor();
}`));
 assert.ok(about.querySelector(`a[href="${source}"]`));
 assert.equal(about.querySelectorAll('script').length,0);
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
