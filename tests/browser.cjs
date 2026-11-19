// Browser checks run against the exact static directory shipped to Pages.
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
  if (!fs.existsSync(file)) {res.writeHead(404).end();return;}
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
   const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror', e=>errors.push(e.message));
   await page.goto(base);
   await page.locator('.swiper-initialized').waitFor();
   await page.screenshot({path:`test-results/${name}-shelf.png`,fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
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
   await page.goto(base + '/404.html');
   await page.getByRole('heading',{name:'Nothing at this address.'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: 404 overflow`);
   await page.screenshot({path:`test-results/${name}-404.png`,fullPage:true});
   await page.goto(base + '/imsa-map/?example=1');
   await page.getByRole('heading',{name:'S1 room list'}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: schedule overflow`);
   await page.screenshot({path:`test-results/${name}-schedule.png`,fullPage:true});
   assert.deepEqual(errors,[],`${name}: uncaught browser errors`);
   await page.close();
   console.log(`${name}: layout and interactions passed`);
  }
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
