// Browser checks run against site/. CI runs this after the research catalogue build.
const engines = require('playwright');
const engineName = process.env.BROWSER || 'chromium';
if (!['chromium','webkit','firefox'].includes(engineName)) throw new Error('BROWSER must be chromium, webkit, or firefox');
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
  const size = fs.statSync(file).size;
  res.setHeader('Accept-Ranges', 'bytes');
  // Match Pages' byte-range behavior so media seeking is tested realistically.
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) {
    const start=Number(range[1]);
    const end=range[2] ? Math.min(Number(range[2]),size-1) : size-1;
    if (start>end || start>=size) {res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return;}
    res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
    fs.createReadStream(file,{start,end}).pipe(res);
    return;
  }
  res.setHeader('Content-Length',size);
  fs.createReadStream(file).pipe(res);
});
(async () => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const partial=await fetch(base + '/assets/livermore.mp3',{headers:{Range:'bytes=0-9'}});
 assert.equal(partial.status,206);
 assert.equal((await partial.arrayBuffer()).byteLength,10);
 const browser = await engines[engineName].launch(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {});
 fs.mkdirSync('test-results', {recursive:true});
 try {
  for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]) {
   const page = await browser.newPage({viewport:{width,height}, reducedMotion:name === 'desktop' ? 'no-preference' : 'reduce'});
   const errors=[];
   const mediaRequests=[];
   page.on('request',request=>{if (/\/assets\/livermore\.(mp3|webp)(?:[?#]|$)/.test(request.url())) mediaRequests.push(request.url());});
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
   await page.evaluate(() => document.fonts.load("600 16px 'DM Sans'", 'Erdős'));
   await page.evaluate(() => document.fonts.ready);
   assert.ok(await page.evaluate(()=>(()=>{const faces=[...document.fonts].filter(font=>font.family.includes('DM Sans'));return faces.length===2 && faces.every(font=>font.weight==='100 1000' && font.status==='loaded');})()), 'DM Sans uses real variable weights');
   assert.ok(await page.evaluate(()=>{const faces=[...document.fonts].filter(font=>font.family.includes('Bricolage'));return faces.length===2 && faces.every(font=>font.status==='loaded');}), 'headline glyphs load in the correct family');
   await page.screenshot({path:`test-results/${name}-shelf.png`,fullPage:true});
   assert.deepEqual(mediaRequests,[],`${name}: unopened flyover must not download media`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
   await page.locator('.index summary').click();
   await page.locator('.index[open]').waitFor();
   assert.equal(await page.locator('.index a img').count(),6);
   assert.ok(await page.locator('.index ul').evaluate(el => {
    const r=el.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;
   }), `${name}: print index escapes viewport`);
   await page.screenshot({path:`test-results/${name}-index.png`,fullPage:true});
   await page.locator('.index summary').press('Escape');
   assert.equal(await page.locator('.index').getAttribute('open'),null);
   // Cross the loop seam in both directions, including normal-motion desktop.
   const printOrder = ['schedule','conway','conjectures','flyover','factoring','cpu'];
   let printIndex = 3;
   for (const direction of ['#next','#prev']) {
    for (let i=0;i<7;i++) {
     printIndex = (printIndex + (direction === '#next' ? 1 : -1) + printOrder.length) % printOrder.length;
     await page.locator(direction).click();
     // Swiper schedules loop moves on a frame even at reduced-motion speed 0.
     // Wait for the requested visible state, not merely an idle animation flag.
     await page.waitForFunction(href => document.querySelector('#open-print').getAttribute('href') === href, '#' + printOrder[printIndex]);
     await page.waitForFunction(() => !document.querySelector('.swiper').swiper.animating);
    }
   }
   assert.equal(await page.locator('#open-print').getAttribute('href'),'#flyover');
   await page.locator('#open-print').click();
   await page.locator('dialog[open]').waitFor();
   // Reader navigation must not swallow browser shortcuts or text selection.
   for (const modifier of ['altKey','ctrlKey','metaKey','shiftKey']) {
    for (const key of ['ArrowLeft','ArrowRight']) {
     const prevented = await page.locator('#close-dialog').evaluate((button, detail) => {
      const event = new KeyboardEvent('keydown', {key: detail.key, [detail.modifier]: true, bubbles: true, cancelable: true});
      button.dispatchEvent(event);
      return event.defaultPrevented;
     }, {modifier,key});
     assert.equal(prevented,false, `${modifier}+${key}: reader retains native behavior`);
     assert.ok(page.url().endsWith('#flyover'));
    }
   }
   await page.locator('#close-dialog').press('ArrowRight');
   await page.locator('dialog #factoring').waitFor();
   await page.locator('#close-dialog').press('ArrowLeft');
   await page.locator('dialog #flyover').waitFor();
   await page.locator('[data-audio-cue="70"]').click();
   try {
    await page.waitForFunction(() => {
     const audio=document.querySelector('#recording');
     return !audio.paused && audio.currentTime >= 70 && Number.isFinite(audio.duration);
    });
   } catch (error) {
    console.error(`${name}: media state`, await page.locator('#recording').evaluate(audio => ({
      currentTime:audio.currentTime,duration:audio.duration,paused:audio.paused,
      readyState:audio.readyState,networkState:audio.networkState,currentSrc:audio.currentSrc,
      error:audio.error?.message,seekable:Array.from({length:audio.seekable.length},(_,i)=>[audio.seekable.start(i),audio.seekable.end(i)]),
      notice:document.querySelector('#audio-status').textContent
    })));
    await page.screenshot({path:`test-results/${name}-audio-failure.png`,fullPage:true});
    throw error;
   }
   assert.ok(await page.locator('#recording').evaluate(el => Math.abs(el.duration - 85.23) < 1));
   await page.locator('.player').screenshot({path:`test-results/${name}-audio.png`});
   await page.locator('#previous-detail').click();
   await page.locator('#repeat-war').click();
   assert.match(await page.locator('#war-report').textContent(), /Turn 90.*game repeats/);
   await page.getByText('Look at all three hands',{exact:true}).click();
   await page.screenshot({path:`test-results/${name}-war.png`,fullPage:true});
   await page.locator('#war-turn').press('Home');
   await page.locator('#war-turn').press('ArrowRight');
   assert.match(await page.locator('#war-report').textContent(), /Turn 1/);
   await page.locator('#war-turn').press('End');
   assert.match(await page.locator('#war-report').textContent(), /Turn 90.*game repeats/);
   await page.locator('.war-cycle').screenshot({path:`test-results/${name}-cycle.png`});
   await page.locator('#close-dialog').click();
   await page.locator('dialog').waitFor({state:'hidden'});
   await page.goForward();
   await page.locator('dialog[open]').waitFor();
   await page.keyboard.press('Escape');
   await page.locator('dialog').waitFor({state:'hidden'});
   // Native dialog close events are queued after the open attribute clears.
   await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
   await page.locator('#find-project').fill('erdos');
   assert.equal(await page.locator('#result-count').textContent(),'1 project');
   await page.locator('#find-project').fill('not-a-project');
   await page.locator('#clear-projects').click();
   assert.equal(await page.locator('#find-project').inputValue(),'');
   await page.goto(base + '/#cpu');
   await page.locator('dialog[open]').waitFor();
   await page.locator('[data-taken="true"]').click();
   assert.match(await page.locator('#prediction-result').textContent(),/Predicted not taken.*Missed/);
   assert.equal(await page.locator('#prediction-status').getAttribute('role'),'status');
   assert.equal(await page.locator('#prediction-status').getAttribute('aria-atomic'),'true');
   assert.match(await page.locator('#prediction-status').textContent(),/10.*Weakly predicts taken[\s\S]*Predicted not taken/);
   await page.locator('#reset-predictor').click();
   assert.match(await page.locator('#forecast').textContent(),/^01/);
   await page.screenshot({path:`test-results/${name}-predictor.png`,fullPage:true});
   await page.locator('.binary-working summary').click();
   await page.locator('#address').fill('42');
   assert.equal(await page.locator('#binary-register .is-one').count(),3);
   assert.equal(await page.locator('#binary-sum').textContent(),'32 + 8 + 2 = 42');
   await page.locator('.binary-working').screenshot({path:`test-results/${name}-binary-register.png`});
   await page.goto(base + '/#factoring');
   await page.locator('dialog[open]').waitFor();
   await page.locator('#composite').fill('30030');
   await page.getByRole('button',{name:'Factor it',exact:true}).click();
   await page.getByText('See the divisions',{exact:true}).click();
   assert.equal(await page.locator('#factor-steps li').count(),5);
   assert.match(await page.locator('#factor-ending').textContent(),/13 is prime/);
   await page.locator('#factor-form').screenshot({path:`test-results/${name}-factoring.png`});
   await page.goto(base + '/#conway');
   await page.locator('dialog[open]').waitFor();
   await page.locator('[data-rook-pair="A1,B1"]').click();
   assert.match(await page.locator('#rook-caption').textContent(), /1 shared neighbor: C1/);
   await page.locator('[data-rook-pair="A1,B2"]').click();
   assert.match(await page.locator('#rook-caption').textContent(), /2 shared neighbors: A2, B1/);
   await page.locator('#conway .toy').screenshot({path:`test-results/${name}-rook.png`});
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
   if (name === 'desktop') {
    await page.setViewportSize({width:816,height:1056});
    await page.emulateMedia({media:'print'});
    assert.equal(await field.isVisible(),false,'printed room list omits pasted source');
    assert.equal(await page.getByRole('button',{name:'Submit',exact:true}).isVisible(),false);
    assert.equal(await page.locator('.schedule-days:visible').count(),2);
    const positions = await terms.nth(0).locator('.schedule-days > section').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().top));
    assert.equal(new Set(positions).size,1,'all five day cards share one print row');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'printed schedule fits the page');
    await page.screenshot({path:'test-results/schedule-print.png',fullPage:true});
    if (engineName === 'chromium') await page.pdf({path:'test-results/schedule-print.pdf',format:'Letter'});
    await page.emulateMedia({media:'screen'});
    await page.setViewportSize({width,height});
   }
   await field.fill('Schedule\nHeader\n' + row('4-2(A)','S1','A113'));
   await page.getByRole('button',{name:'Submit',exact:true}).click();
   await page.getByRole('alert').waitFor();
   assert.equal(await terms.count(),0);
   await field.fill(row('1(I)','S2','C105'));
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
  // Playwright exposes real touch-drag injection through Chromium's CDP only.
  if (engineName === 'chromium') {
  const touch = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,reducedMotion:'no-preference'});
  const touchErrors=[];
  touch.on('pageerror',error=>touchErrors.push(error.message));
  await touch.goto(base);
  await touch.locator('.swiper-initialized').waitFor();
  const cdp=await touch.context().newCDPSession(touch);
  const box=await touch.locator('.swiper').boundingBox();
  const y=Math.round(box.y+box.height*.45);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y,id:1}]});
  for(let step=1;step<=8;step++) {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:310-step*30,y,id:1}]});
    await new Promise(resolve=>setTimeout(resolve,40));
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await touch.waitForFunction(()=>document.querySelector('#open-print').dataset.project!=='flyover');
  assert.equal(await touch.locator('dialog[open]').count(),0,'swiping must not open a print');
  await touch.screenshot({path:'test-results/touch-shelf.png',fullPage:true});
  await touch.locator('#open-print').tap();
  await touch.locator('dialog[open]').waitFor();
  assert.deepEqual(touchErrors,[]);
  await touch.locator('#close-dialog').tap();
  await touch.waitForFunction(()=>!document.body.classList.contains('modal-open'));
  await touch.close();
  console.log('touch-enabled mobile: swipe, momentum and deliberate tap passed');
  } else console.log(`${engineName}: native touch-drag injection and PDF export not exercised`);

  // WCAG text-spacing overrides: content may grow vertically, never disappear.
  const spaced = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await spaced.goto(base);
  await spaced.addStyleTag({content:`
    * {line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important;}
    p {margin-bottom:2em !important;}
  `});
  assert.ok(await spaced.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), 'text spacing: homepage overflow');
  await spaced.screenshot({path:'test-results/text-spacing-home.png',fullPage:true});
  for (const id of ['conjectures','flyover','factoring','cpu','schedule','conway']) {
    await spaced.evaluate(id=>{location.hash=id;},id);
    await spaced.locator('dialog[open]').waitFor();
    await spaced.locator(`dialog #${id}`).waitFor();
    assert.ok(await spaced.locator('dialog').evaluate(el=>el.scrollWidth <= el.clientWidth+1), `text spacing: ${id} reader overflow`);
    assert.ok(await spaced.locator('.turn-prints').evaluate(el=>{
      const [previous,count,next]=[...el.children].map(node=>node.getBoundingClientRect());
      return previous.width>=40 && next.width>=40 && count.left-previous.right>=7 && next.left-count.right>=7;
    }), 'reader arrows retain room for focus rings and page counter');
    await spaced.locator('#close-dialog').focus();
    await spaced.keyboard.press('Tab');
    assert.ok(await spaced.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)), 'keyboard focus must remain in modal');
  }
  await spaced.screenshot({path:'test-results/text-spacing-reader.png',fullPage:true});
  await spaced.close();
  console.log('increased text spacing: all project readers reflow without horizontal overflow');

  const plain = await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
  await plain.goto(base);
  assert.equal(await plain.locator('.catalogue-list li:visible').count(),31);
  assert.equal(await plain.locator('.project-details .detail:visible').count(),6);
  assert.equal(await plain.locator('.shelf-controls').isVisible(),false);
  assert.equal(await plain.locator('#factor-form').isVisible(),false);
  await plain.locator('.index summary').click();
  await plain.locator('.index a[data-project="conway"]').click();
  await plain.locator('#conway-title').waitFor();
  assert.ok(plain.url().endsWith('#conway'));
  await plain.locator('#conway').screenshot({path:'test-results/no-script-reading.png'});
  await plain.goto(base + '/#flyover');
  // Navigation waits for load; direct evaluation also works with Firefox's disabled-JS context.
  assert.ok(await plain.locator('#flyover .spectrum img').evaluateAll(images=>images.some(image=>!image.hidden && image.naturalWidth>0)), 'no-script spectrogram is loaded');
  assert.equal(await plain.locator('#flyover .spectrum img:visible').count(),1);
  assert.equal(await plain.locator('#flyover audio:visible').count(),1);
  assert.ok((await plain.locator('#flyover audio:visible').getAttribute('src')).endsWith('livermore.mp3'));
  await plain.locator('#flyover .player').screenshot({path:'test-results/no-script-flyover.png'});
  await plain.close();
  console.log('no JavaScript: catalogue and project reading passed');

  const fallback = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await fallback.route('**/vendor/swiper-bundle.min.js',route=>route.abort());
  const fallbackErrors=[];
  fallback.on('pageerror',error=>fallbackErrors.push(error.message));
  await fallback.goto(base + '/#factoring');
  await fallback.locator('dialog[open]').waitFor();
  await fallback.locator('#composite').fill('221');
  await fallback.getByRole('button',{name:'Factor it',exact:true}).click();
  assert.equal(await fallback.locator('#factors').textContent(),'221 = 13 × 17');
  await fallback.locator('#close-dialog').click();
  await fallback.waitForFunction(()=>!document.body.classList.contains('modal-open'));
  assert.equal(await fallback.locator('.shelf-controls').isVisible(),false);
  assert.equal(await fallback.locator('.swiper-initialized').count(),0);
  assert.deepEqual(fallbackErrors,[]);
  await fallback.screenshot({path:'test-results/no-carousel-library.png',fullPage:true});
  await fallback.close();
  console.log('missing carousel library: native shelf and experiments passed');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
