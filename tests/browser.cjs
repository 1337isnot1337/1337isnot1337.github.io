// Browser checks run against site/. CI runs this after the research catalogue build.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('site');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.wasm':'application/wasm', '.webp':'image/webp', '.woff2':'font/woff2', '.mp3':'audio/mpeg' };
const server = http.createServer((req,res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if (!fs.existsSync(file)) {res.writeHead(404, {'Content-Type':'text/html'});fs.createReadStream(path.join(root,'404.html')).pipe(res);return;}
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const browser = await chromium.launch();
 fs.mkdirSync('test-results', {recursive:true});
 try {
  for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]) {
   const page = await browser.newPage({viewport:{width,height}, reducedMotion:name === 'desktop' ? 'no-preference' : 'reduce'});
   const errors=[];
   page.on('pageerror', e=>errors.push(e.message));
   page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400 &&
        !response.url().endsWith('/a-missing-page-for-testing'))
      errors.push(`HTTP ${response.status()} ${response.url()}`);
   });
   page.on('requestfailed', request => {
    if (request.url().startsWith(base) && request.failure()?.errorText !== 'net::ERR_ABORTED')
      errors.push(`Failed resource ${request.url()}: ${request.failure()?.errorText}`);
   });
   await page.goto(base);
   await page.locator('.swiper-initialized').waitFor();
   await page.evaluate(() => document.fonts.ready);
   await page.screenshot({path:`test-results/${name}-shelf.png`,fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
   // Cross the loop seam in both directions, including normal-motion desktop.
   for (const direction of ['#next','#prev']) {
    for (let i=0;i<7;i++) {
     await page.locator(direction).click();
     await page.waitForFunction(() => !document.querySelector('.swiper').swiper.animating);
    }
   }
   assert.equal(await page.locator('#open-print').getAttribute('href'),'#flyover');
   await page.locator('#open-print').click();
   await page.locator('dialog[open]').waitFor();
   await page.locator('#previous-detail').click();
   await page.locator('#repeat-war').click();
   assert.match(await page.locator('#war-report').textContent(), /Turn 90.*game repeats/);
   await page.getByText('Look at all three hands',{exact:true}).click();
   await page.screenshot({path:`test-results/${name}-war.png`,fullPage:true});
   await page.locator('#close-dialog').click();
   await page.locator('dialog').waitFor({state:'hidden'});
   await page.goForward();
   await page.locator('dialog[open]').waitFor();
   await page.keyboard.press('Escape');
   await page.locator('dialog').waitFor({state:'hidden'});
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('modal-open')),false);
   await page.locator('#find-project').fill('erdos');
   assert.equal(await page.locator('#result-count').textContent(),'1 project');
   await page.locator('#find-project').fill('not-a-project');
   await page.locator('#clear-projects').click();
   assert.equal(await page.locator('#find-project').inputValue(),'');
   await page.goto(base + '/#cpu');
   await page.locator('dialog[open]').waitFor();
   await page.locator('[data-taken="true"]').click();
   assert.match(await page.locator('#prediction-result').textContent(),/Predicted not taken.*Missed/);
   await page.locator('#reset-predictor').click();
   assert.match(await page.locator('#forecast').textContent(),/^01/);
   await page.screenshot({path:`test-results/${name}-predictor.png`,fullPage:true});
   const missing = await page.goto(base + '/a-missing-page-for-testing');
   assert.equal(missing.status(),404);
   await page.getByRole('heading',{name:'Nothing at this address.'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: 404 overflow`);
   await page.screenshot({path:`test-results/${name}-404.png`,fullPage:true});
   await page.goto(base + '/imsa-map/?example=1');
   await page.getByRole('heading',{name:'S1 room list'}).waitFor();
   await page.evaluate(() => document.fonts.ready);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: schedule overflow`);
   await page.screenshot({path:`test-results/${name}-schedule.png`,fullPage:true});
   const row = (period,term,room) => `${period}\t${term}\tMath\tMath\tExample\t${room}\tstart\tend`;
   const field = page.getByRole('textbox',{name:'PowerSchool schedule'});
   await field.fill('Schedule\nHeader\n' + row('2-4(A,C-D)','S1','A113') + '\n' + row('3(A)','S2','B204'));
   await page.getByRole('button',{name:'Submit',exact:true}).click();
   await page.getByRole('heading',{name:'S2 room list'}).waitFor();
   const terms = page.locator('.schedule-results > section');
   assert.equal(await terms.count(),2);
   assert.deepEqual(await terms.nth(0).locator('h3').allTextContents(),['A day','B day','I day','C day','D day']);
   assert.deepEqual((await terms.nth(0).locator('ol').first().locator('li').allTextContents()).slice(1,4),['A113','A113','A113']);
   assert.equal((await terms.nth(1).locator('ol').first().locator('li').allTextContents())[2],'B204');
   await field.fill('Schedule\nHeader\n' + row('4-2(A)','S1','A113'));
   await page.getByRole('button',{name:'Submit',exact:true}).click();
   await page.getByRole('alert').waitFor();
   assert.equal(await terms.count(),0);
   await field.fill('Schedule\nHeader\n' + row('1(I)','S2','C105'));
   await page.getByRole('button',{name:'Submit',exact:true}).click();
   await page.getByRole('heading',{name:'S2 room list'}).waitFor();
   assert.equal(await page.getByRole('alert').count(),0);
   if (fs.existsSync(path.join(root,'solved-conjectures/index.html'))) {
    const collection = await page.goto(base + '/solved-conjectures/');
    assert.equal(collection.status(),200);
    assert.ok(await page.locator('h1').count());
   }
   assert.deepEqual(errors,[],`${name}: uncaught browser errors`);
   await page.close();
   console.log(`${name}: layout and interactions passed`);
  }
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
