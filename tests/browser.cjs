// Browser checks run against site/. CI runs this after the research catalogue build.
const engines = require('playwright');
const engineName = process.env.BROWSER || 'chromium';
if (!['chromium','webkit','firefox'].includes(engineName)) throw new Error('BROWSER must be chromium, webkit, or firefox');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('site');
const types = { '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json', '.pdf':'application/pdf', '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.wasm':'application/wasm', '.webp':'image/webp', '.woff2':'font/woff2', '.mp3':'audio/mpeg' };
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
   const mapRequests=[];
   page.on('request',request=>{if(request.url().includes('/assets/livermore-automatic-mp3'))mapRequests.push(request.url());});
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
   assert.deepEqual(mediaRequests.filter(url=>url.includes(".mp3")),[],`${name}: unopened flyover must not download audio`);
   assert.equal(await page.locator("#desk-audio").getAttribute("src"),null);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
   assert.deepEqual(mapRequests,[],`${name}: closed map must not request image`);
   await page.locator('#desk-map summary').click();
   await page.waitForFunction(()=>{const img=document.querySelector('#desk-map-image img');return img?.complete && img.naturalWidth>0;});
   assert.equal(mapRequests.length,1,`${name}: one responsive map image`);
   assert.equal(await page.locator('#desk-audio').getAttribute('src'),null);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('#desk-map').screenshot({path:`test-results/${name}-location-search.png`});
   assert.equal(await page.locator('#desk-map a').first().getAttribute('href'),'assets/livermore-automatic-mp3.webp');
   await page.locator('#desk-map summary').click();
   assert.ok(await page.locator('.firmware-project').isVisible());
   await page.locator('.firmware-note summary').click();
   assert.match(await page.locator('.firmware-limit').textContent(),/not yet hardware-verified/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.firmware-note').screenshot({path:`test-results/${name}-firmware-note.png`});
   await page.locator('.firmware-note summary').click();
   const incidentSummary=page.locator('.incident-note summary');
   await incidentSummary.focus();
   await incidentSummary.press('Enter');
   assert.equal(await page.locator('.incident-note').getAttribute('open'),'');
   assert.equal(await page.locator('.incident-lane').count(),2);
   assert.match(await page.locator('.incident-scope').textContent(),/no production changes/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `${name}: incident case-note overflow`);
   await page.locator('.incident-note').screenshot({path:`test-results/${name}-incident-note.png`});
   await incidentSummary.press('Enter');
   assert.equal(await page.locator('.incident-note').getAttribute('open'),null);
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
     const mapped={flyover:'sound',conjectures:'cards',cpu:'bits'}[printOrder[printIndex]];
     if(direction==='#next' && mapped){
      await page.locator('#open-print').click();
      assert.equal(await page.locator('dialog[open]').count(),0);
      assert.equal(await page.locator(`[data-desk="${mapped}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.evaluate(name=>document.activeElement===document.querySelector(`[data-desk-panel="${name}"] h3`),mapped),true);
      await page.keyboard.press('Tab');
      const firstControl={sound:'#desk-play-recording',cards:'#desk-deal-one',bits:'.desk-bit-row button[data-bit="14"]'}[mapped];
      assert.equal(await page.locator(firstControl).evaluate(el=>el===document.activeElement),true, 'heading leads directly into the experiment by keyboard');
     }
    }
   }
   assert.equal(await page.locator('#open-print').getAttribute('href'),'#flyover');
   await page.locator('#open-print').click();
   assert.equal(await page.locator('dialog[open]').count(),0, 'shelf try-action opens the desk, not a competing reader');
   assert.ok(page.url().endsWith('#desk-sound'));
   assert.equal(await page.locator('[data-desk="sound"]').getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('[data-desk-panel="sound"] h3')),true);
   await page.locator('[data-desk-panel="sound"] .desk-project').click();
   await page.locator('dialog[open]').waitFor();
   if(width<=680) {
    const sheet=await page.locator('dialog[open]').boundingBox();
    assert.ok(Math.abs(sheet.x)<1 && Math.abs(sheet.y)<1, `${name}: reader fills phone without outer margins`);
    assert.ok(Math.abs(sheet.width-width)<1 && Math.abs(sheet.height-height)<1, `${name}: reader uses the full dynamic viewport`);
    for(const id of ['close-dialog','previous-detail','next-detail']) {
     const control=await page.locator('#'+id).boundingBox();
     assert.ok(control.height>=44 && control.width>=44, `${name}: ${id} is a 44px touch target`);
    }
    assert.ok(await page.locator('#detail-slot > .detail').evaluate(el=>el.clientWidth>=innerWidth-1), `${name}: article retains full sheet width`);
   }
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
   await page.locator('#desk-play-recording').click();
   await page.waitForFunction(()=>{const a=document.querySelector('#desk-audio');return !a.paused&&a.currentTime>0&&Number.isFinite(a.duration);});
   await page.locator('#desk-audio').evaluate(a=>{a.currentTime=40;});
   await page.waitForFunction(()=>parseFloat(document.querySelector('.desk-playhead').style.left)>45);
   assert.equal(await page.locator('.desk-listen').isVisible(),false,'native controls replace initial play button');
   await page.locator('.desk-recording').screenshot({path:`test-results/${name}-desk-playing.png`});
   await page.locator('[data-desk="cards"]').click();
   assert.equal(await page.locator('#desk-audio').evaluate(a=>a.paused),true,'leaving sound sheet pauses its recording');
   await page.locator('#desk-deal-cycle').click();
   assert.equal(await page.locator('#desk-turn').textContent(),'Turn 90 / 90');
   assert.match(await page.locator('#desk-deal-status').textContent(),/Exactly the original card order/);
   await page.screenshot({path:`test-results/${name}-desk-cards.png`});
   await page.locator('[data-desk="bits"]').click();
   await page.locator('.desk-bit-row [data-bit="14"]').click();
   assert.equal(await page.locator('#desk-address-value').textContent(),'16426');
   await page.locator('.desk-register-reset').click();
   assert.equal(await page.locator('#desk-address-value').textContent(),'42');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: workbench fits`);
   await page.screenshot({path:`test-results/${name}-desk-bits.png`});
   await page.locator('[data-desk="numbers"]').click();
   assert.equal(await page.locator('#desk-number-density').textContent(),'3/7');
   if(width<=680){
    for(const sheet of ['sound','cards','bits','numbers']){
     await page.locator(`[data-desk="${sheet}"]`).click();
     const positions=await page.locator(`[data-desk-panel="${sheet}"]`).evaluate(panel=>({artifact:panel.querySelector('.desk-artifact').getBoundingClientRect().top,explanation:panel.querySelector('.desk-copy').getBoundingClientRect().top,desk:document.querySelector('#desk').getBoundingClientRect().top}));
     assert.ok(positions.artifact<positions.explanation,`${name}: experiment comes before explanation`);
     assert.ok(positions.artifact-positions.desk<600,`${name}: experiment is not buried below introductory prose`);
    }
    await page.locator('[data-desk="numbers"]').click();
   }
   await page.locator('[data-residue="5"]').click();
   assert.match(await page.locator('#desk-number-explanation').textContent(),/5 and 7 are 2 apart/);
   assert.equal(await page.locator('#desk-number-status').getAttribute('data-valid'),'false');
   await page.locator('[data-desk-panel="numbers"]').screenshot({path:`test-results/${name}-numberline-conflict.png`});
   await page.locator('#desk-number-reset').click();
   assert.equal(await page.locator('#desk-number-status').getAttribute('data-valid'),'true');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: fourth workbench tab and numberline fit`);
   await page.locator('[data-desk-panel="numbers"]').screenshot({path:`test-results/${name}-numberline.png`});
   await page.locator('[data-desk="sound"]').click();
   await page.screenshot({path:`test-results/${name}-desk-sound.png`});
   const catalogueLinks = page.locator('.catalogue-list > li > a');
   await page.locator('#more-projects').focus();
   await page.locator('#more-projects').press('Enter');
   assert.equal(await catalogueLinks.nth(6).evaluate(el => el === document.activeElement),true,
     `${name}: expansion continues at first new project`);
   assert.ok(await catalogueLinks.nth(6).evaluate(el => {
    const r=el.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight;
   }), `${name}: newly focused project is visible`);
   await page.keyboard.press('Tab');
   assert.equal(await catalogueLinks.nth(7).evaluate(el => el === document.activeElement),true,
     `${name}: Tab continues through expanded projects`);
   await page.screenshot({path:`test-results/${name}-catalogue-expanded.png`});
   await page.locator('#more-projects').click();
   await page.locator('#find-project').fill('erdos');
   assert.equal(await page.locator('#result-count').textContent(),'1 project');
   await page.locator('#find-project').fill('not-a-project');
   await page.locator('#clear-projects').click();
   assert.equal(await page.locator('#find-project').inputValue(),'');
   await page.locator('#about').scrollIntoViewIfNeeded();
   assert.ok(await page.locator('#about pre').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${name}: robot excerpt fits without horizontal scrolling`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: notebook fits page`);
   assert.equal(await page.locator('#about .favorites a').count(),4);
   await page.locator('#about').screenshot({path:`test-results/${name}-notebook.png`});
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
   await page.locator('#trace-next').click();
   await page.locator('#trace-next').click();
   assert.equal(await page.locator('#cpu-trace').getAttribute('data-time'),'190');
   assert.match(await page.locator('#trace-prediction').textContent(),/Predicted next: 5 · Actual next: 7/);
   await page.locator('#cpu-trace').screenshot({path:`test-results/${name}-cpu-mispredict.png`});
   await page.locator('#trace-next').click();
   assert.match(await page.locator('#trace-execute-address').textContent(),/Bubble/);
   assert.equal(await page.locator('#trace-register-d').textContent(),'0');
   await page.locator('#trace-next').click();
   assert.equal(await page.locator('#trace-next').isDisabled(),true);
   await page.locator('#trace-reset').click();
   assert.equal(await page.locator('#cpu-trace').getAttribute('data-time'),'170');
   await page.goto(base + '/#factoring');
   await page.locator('dialog[open]').waitFor();
   await page.locator('#composite').fill('30030');
   await page.getByRole('button',{name:'Factor it',exact:true}).click();
   await page.getByText('See the divisions',{exact:true}).click();
   assert.equal(await page.locator('#factor-steps li').count(),5);
   assert.match(await page.locator('#factor-ending').textContent(),/13 is prime/);
   await page.locator('#factor-form').screenshot({path:`test-results/${name}-factoring.png`});
   assert.equal(await page.locator('#factoring .research-bound math').count(),1);
   assert.ok(await page.locator('#factoring').evaluate(el=>el.scrollWidth<=el.clientWidth+1),`${name}: native factoring bound fits reader`);
   await page.locator('#factoring .research-bound').screenshot({path:`test-results/${name}-factoring-bound.png`});
   await page.goto(base + '/#conway');
   await page.locator('dialog[open]').waitFor();
   await page.evaluate(() => document.fonts.ready);
   assert.ok(await page.locator('#conway-title').evaluate(title=>title.getBoundingClientRect().top >= document.querySelector('.modal-top').getBoundingClientRect().bottom-1), `${name}: deep-linked heading clears sticky reader controls`);
   await page.screenshot({path:`test-results/${name}-rook-reader.png`});
   assert.equal(await page.locator('.rook-graph-frame').getAttribute('data-view'),'graph');
   assert.equal(await page.locator('.rook-graph-edges path').count(),18);
   assert.ok(await page.locator('.rook-graph-frame').evaluate(frame=>{
    const svg=frame.querySelector('svg'),matrix=svg.getScreenCTM();
    const nodes=[...frame.querySelectorAll('button')].map(button=>({name:button.textContent,rect:button.getBoundingClientRect()}));
    return [...svg.querySelectorAll('path')].every(path=>{
     const length=path.getTotalLength();
     for(let i=0;i<=200;i++){
      const point=path.getPointAtLength(length*i/200),x=point.x*matrix.a+point.y*matrix.c+matrix.e,y=point.x*matrix.b+point.y*matrix.d+matrix.f;
      for(const node of nodes){if(node.name===path.dataset.from||node.name===path.dataset.to)continue;
       if(Math.hypot(x-node.rect.x-node.rect.width/2,y-node.rect.y-node.rect.height/2)<=node.rect.width/2+1.2)return false;
      }
     }return true;
    });
   }),`${name}: edges clear nonendpoint vertices`);
   await page.locator('[data-rook-pair="A1,B1"]').click();
   assert.match(await page.locator('#rook-caption').textContent(), /1 shared neighbor: C1/);
   await page.locator('[data-rook-pair="A1,B2"]').click();
   assert.match(await page.locator('#rook-caption').textContent(), /2 shared neighbors: A2, B1/);
   assert.equal(await page.locator('.rook-graph-edges .is-incident').count(),8);
   await page.locator('.rook-graph-frame').screenshot({path:`test-results/${name}-rook-graph.png`});
   await page.locator('[data-rook-view="board"]').click();
   assert.equal(await page.locator('.rook-graph-edges').isVisible(),false);
   assert.equal(await page.locator('#rook-board [aria-pressed="true"]').count(),2);
   await page.locator('.rook-graph-frame').screenshot({path:`test-results/${name}-rook-board.png`});
   await page.locator('[data-rook-view="graph"]').click();
   await page.locator('#conway .toy').screenshot({path:`test-results/${name}-rook.png`});
   await page.goto(base + '/#schedule');
   await page.getByRole('heading',{name:'Schedule map',exact:true}).waitFor();
   const scheduleExample = page.locator('.schedule-example');
   assert.ok(await scheduleExample.isVisible());
   assert.equal(await scheduleExample.locator('[data-example-day]').count(),5);
   assert.match(await scheduleExample.textContent(),/Example data, not my class schedule/);
   assert.ok(await scheduleExample.evaluate(node => node.scrollWidth <= node.clientWidth), `${name}: schedule example overflow`);
   await scheduleExample.screenshot({path:`test-results/${name}-schedule-example.png`});
   await scheduleExample.locator(".schedule-example-input").screenshot({path:`test-results/${name}-schedule-input.png`});
   await scheduleExample.locator(".schedule-example-output").screenshot({path:`test-results/${name}-schedule-output.png`});
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
   await field.fill('Schedule\nHeader\n' + row('2-4(A,C-D)','S1','A113') + '\n' + row('3(A)','S2','B204') + '\n' + row('1(A)','S2',''));
   await page.getByRole('button',{name:'Submit',exact:true}).click();
   await page.getByRole('heading',{name:'S2 room list'}).waitFor();
   const terms = page.locator('.schedule-results > section');
   assert.equal(await terms.count(),2);
   assert.deepEqual(await terms.nth(0).locator('h3').allTextContents(),['A day','B day','I day','C day','D day']);
   assert.deepEqual((await terms.nth(0).locator('ol').first().locator('li').allTextContents()).slice(1,4),['A113','A113','A113']);
   assert.equal((await terms.nth(1).locator('ol').first().locator('li').allTextContents())[2],'B204');
   assert.equal((await terms.nth(1).locator('ol').first().locator('li').allTextContents())[0],'Room not listed');
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
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.locator('.brand img').evaluate(image=>image.complete && image.naturalWidth>0),'catalogue brand asset decodes');
    const provenanceFile = path.join(root,'solved-conjectures/catalogue-provenance.json');
    if (fs.existsSync(provenanceFile)) {
     const provenance = JSON.parse(fs.readFileSync(provenanceFile,'utf8'));
     if (provenance.mode === 'snapshot') {
      await page.locator('.catalogue-snapshot').waitFor();
      assert.ok((await page.locator('.catalogue-snapshot').textContent()).includes(provenance.rendered_source.commit.slice(0,7)));
      assert.ok((await page.title()).startsWith('Snapshot '));
      assert.ok((await page.locator('meta[name="description"]').getAttribute('content')).startsWith('Catalogue snapshot ('));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: snapshot notice fits viewport`);
      await page.screenshot({path:`test-results/${name}-catalogue-snapshot.png`});
      await page.goto(base + '/solved-conjectures/results/frankl-generator-families/');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.catalogue-snapshot').waitFor();
      const sourceLink=page.getByRole('link',{name:'View source',exact:true});
      assert.ok((await sourceLink.getAttribute('href')).includes('/blob/' + provenance.rendered_source.commit + '/'));
      await page.screenshot({path:`test-results/${name}-snapshot-result.png`});
     } else {
      assert.equal(await page.locator('.catalogue-snapshot').count(),0);
     }
     assert.ok(provenance.website_reader,'catalogue release identifies its website reader stylesheet');
     if(provenance.website_reader){
      await page.goto(base + '/solved-conjectures/results/haralambis-three-differences/proof/');
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('#website-reader-style').count(),1);
      assert.ok((await page.locator('#website-reader-style').getAttribute('href')).endsWith(provenance.website_reader.asset));
      assert.ok(await page.locator('.prose').evaluate(el=>getComputedStyle(el).fontFamily.includes('Newsreader')));
      assert.ok(await page.locator('math').count()>10,'native mathematical notation remains present');
      assert.equal(await page.locator('.prose').evaluate(el=>getComputedStyle(el).color),'rgb(66, 44, 65)');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: proof reader fits viewport`);
      assert.ok(await page.locator('.prose p').evaluateAll(paragraphs=>paragraphs.filter(p=>p.scrollWidth>p.clientWidth+1).every(p=>{p.scrollLeft=p.scrollWidth;const reachable=p.scrollLeft>0;p.scrollLeft=0;return reachable;})), 'wide equations remain horizontally reachable, not clipped');
      if(width<=720) assert.equal(await page.locator('.article-nav ul').evaluate(el=>getComputedStyle(el).display),'flex');
      if(provenance.mode==='snapshot') assert.ok(await page.locator('.catalogue-snapshot').isVisible());
      await page.screenshot({path:`test-results/${name}-research-reader-top.png`});
      await page.locator('.prose').scrollIntoViewIfNeeded();
      await page.screenshot({path:`test-results/${name}-research-reader-body.png`});
      await page.goto(base + '/solved-conjectures/results/nonmixed-gap-packing/proof/');
      await page.evaluate(()=>document.fonts.ready);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: inline list equations stay within page`);
      assert.ok(await page.locator('.prose ul,.prose ol').evaluateAll(lists=>lists.filter(el=>el.scrollWidth>el.clientWidth+1).every(el=>{el.scrollLeft=el.scrollWidth;const reachable=el.scrollLeft>0;el.scrollLeft=0;return reachable;})),'wide list equations remain reachable');
     }
    }
   }
   assert.deepEqual(errors,[],`${name}: uncaught browser errors`);
   await page.close();
   console.log(`${name}: layout and interactions passed`);
  }
  // Playwright exposes real touch-drag injection through Chromium's CDP only.
  const linkedDesk=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  for(const [id,name] of [['desk-sound','sound'],['desk-war','cards'],['desk-bits','bits'],['desk-numbers','numbers']]){
   await linkedDesk.goto(base+'/#'+id);
   await linkedDesk.locator('.desk-ready').waitFor();
   assert.equal(await linkedDesk.locator(`[data-desk="${name}"]`).getAttribute('aria-pressed'),'true');
   assert.ok(await linkedDesk.locator('#'+id).isVisible());
   assert.equal(await linkedDesk.locator('#desk-audio').getAttribute('src'),null);
   assert.equal(await linkedDesk.locator('dialog[open]').count(),0);
  }
  await linkedDesk.locator('[data-desk="cards"]').click();
  assert.ok(linkedDesk.url().endsWith('#desk-war'));
  await linkedDesk.locator('[data-desk="bits"]').click();
  await linkedDesk.goBack();
  await linkedDesk.waitForFunction(()=>document.querySelector('[data-desk="cards"]').getAttribute('aria-pressed')==='true');
  await linkedDesk.goBack();
  await linkedDesk.waitForFunction(()=>document.querySelector('[data-desk="numbers"]').getAttribute('aria-pressed')==='true');
  await linkedDesk.goForward();
  await linkedDesk.locator('#desk-war .desk-project').click();
  await linkedDesk.locator('dialog[open] #conjectures').waitFor();
  await linkedDesk.locator('#close-dialog').click();
  await linkedDesk.waitForFunction(()=>!document.querySelector('dialog').open);
  assert.ok(linkedDesk.url().endsWith('#desk-war'));
  assert.ok(await linkedDesk.locator('#desk-war').isVisible());
  await linkedDesk.reload();
  assert.equal(await linkedDesk.locator('[data-desk="cards"]').getAttribute('aria-pressed'),'true');
  await linkedDesk.screenshot({path:'test-results/direct-desk-link.png'});
  await linkedDesk.close();
  console.log('desk links: direct loads, reloads, history and reader return passed');

  if (engineName === 'chromium') {
  const soundRecovery = await browser.newPage();
  await soundRecovery.route('**/assets/livermore.mp3',route=>route.abort());
  await soundRecovery.goto(base+'/#desk');
  await soundRecovery.locator('#desk-play-recording').click();
  await soundRecovery.locator('#desk-audio-status').waitFor({state:'visible'});
  assert.match(await soundRecovery.locator('#desk-audio-status').textContent(),/Try again/);
  await soundRecovery.unroute('**/assets/livermore.mp3');
  await soundRecovery.locator('#desk-play-recording').click();
  await soundRecovery.waitForFunction(()=>{const a=document.querySelector('#desk-audio');return !a.paused&&a.currentTime>0;});
  assert.equal(await soundRecovery.locator('#desk-audio-status').isVisible(),false);
  await soundRecovery.locator('.desk-sound .desk-action').click();
  await soundRecovery.locator('dialog[open]').waitFor();
  assert.equal(await soundRecovery.locator('#desk-audio').evaluate(a=>a.paused),true,'opening recording notes stops the inline player');
  await soundRecovery.close();
  const historySound = await browser.newPage();
  await historySound.goto(base);
  await historySound.locator('.index summary').click();
  await historySound.locator('.index a[data-project="cpu"]').click();
  await historySound.locator('dialog[open]').waitFor();
  await historySound.locator('#close-dialog').click();
  await historySound.locator('dialog').waitFor({state:'hidden'});
  await historySound.locator('#desk-play-recording').click();
  await historySound.waitForFunction(()=>!document.querySelector('#desk-audio').paused);
  await historySound.goForward();
  await historySound.locator('dialog[open]').waitFor();
  assert.equal(await historySound.locator('#desk-audio').evaluate(a=>a.paused),true,'history opening a reader pauses inline audio');
  await historySound.close();
  // Printing an open reader must not superimpose it on the underlying shelf.
  const printable = await browser.newPage({viewport:{width:900,height:800}});
  for (const project of ['conway','conjectures','flyover','factoring','cpu','schedule']) {
   await printable.goto(base + '/#' + project);
   await printable.locator('dialog[open]').waitFor();
   await printable.locator('dialog .outbound').focus();
   await printable.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
   await printable.emulateMedia({media:'print'});
   assert.equal(await printable.locator('body > main').isVisible(),false,'printed reader omits background page');
   assert.equal(await printable.locator('.modal-top').isVisible(),false,'printed reader omits navigation');
   assert.ok(await printable.locator('dialog').evaluate(el=>el.scrollHeight<=el.clientHeight+1),`${project}: print reader is not clipped`);
   if (engineName === 'chromium') await printable.pdf({path:`test-results/project-${project}-print.pdf`,format:'Letter'});
   await printable.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
   await printable.emulateMedia({media:'screen'});
   assert.equal(await printable.locator('dialog').evaluate(el=>el.matches(':modal')),true,'reader returns to modal after printing');
   assert.equal(await printable.locator('dialog .outbound').evaluate(el=>el===document.activeElement),true,'printing preserves reader focus');
  }
  await printable.close();
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
  const touchedProject=await touch.locator('#open-print').getAttribute('data-project');
  await touch.locator('#open-print').tap();
  const deskPanel={flyover:'sound',conjectures:'cards',cpu:'bits'}[touchedProject];
  if(deskPanel){
    await touch.waitForFunction(name=>document.querySelector(`[data-desk="${name}"]`).getAttribute('aria-pressed')==='true',deskPanel);
    assert.equal(await touch.locator('dialog[open]').count(),0);
    await touch.locator(`[data-desk-panel="${deskPanel}"] .desk-project`).tap();
  }
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
  await plain.locator('#desk-map summary').click();
  assert.ok(await plain.locator('#desk-map .desk-map-links a').first().isVisible());
  assert.match(await plain.locator('#desk-map').textContent(),/inconclusive/);
  assert.equal(await plain.locator('#desk-map-image img').count(),0);
  await plain.locator('#desk-map summary').click();
  await plain.locator('.firmware-note summary').click();
  assert.ok(await plain.locator('.firmware-order').isVisible());
  assert.match(await plain.locator('.firmware-limit').textContent(),/not a BIOS flash/);
  await plain.locator('.firmware-note summary').click();
  await plain.locator('.incident-note summary').click();
  assert.ok(await plain.locator('.incident-ledger').isVisible());
  assert.match(await plain.locator('.incident-scope').textContent(),/proposal.only/);
  await plain.locator('.incident-note summary').click();
  assert.equal(await plain.locator('.catalogue-list li:visible').count(),31);
  assert.equal(await plain.locator('.project-details .detail:visible').count(),6);
  assert.equal(await plain.locator('.shelf-controls').isVisible(),false);
  assert.equal(await plain.locator('#factor-form').isVisible(),false);
  await plain.locator('.index summary').click();
  await plain.locator('.index a[data-project="conway"]').click();
  await plain.locator('#conway-title').waitFor();
  assert.ok(plain.url().endsWith('#conway'));
  await plain.locator('#conway').screenshot({path:'test-results/no-script-reading.png'});
  await plain.goto(base + '/#schedule');
  assert.ok(await plain.locator('.schedule-example').isVisible(),'the synthetic schedule preview works without JavaScript');
  await plain.goto(base + '/#cpu');
  assert.equal(await plain.locator('#cpu-trace').getAttribute('data-time'),'190');
  assert.ok(await plain.locator('#cpu-trace').isVisible(),'static processor trace remains visible without JavaScript');
  assert.equal(await plain.locator('.trace-controls').isVisible(),false);
  assert.match(await plain.locator('#trace-summary').textContent(),/195 ns/);
  await plain.goto(base + '/#flyover');
  // Navigation waits for load; direct evaluation also works with Firefox's disabled-JS context.
  assert.ok(await plain.locator('#flyover .spectrum img').evaluateAll(images=>images.some(image=>!image.hidden && image.naturalWidth>0)), 'no-script spectrogram is loaded');
  assert.equal(await plain.locator('#flyover .spectrum img:visible').count(),1);
  assert.equal(await plain.locator('#flyover audio:visible').count(),1);
  assert.ok((await plain.locator('#flyover audio:visible').getAttribute('src')).endsWith('livermore.mp3'));
  await plain.locator('#flyover .player').screenshot({path:'test-results/no-script-flyover.png'});
  await plain.goto(base+'/#desk-numbers');
  assert.ok(await plain.locator('#desk-numbers').isVisible());
  assert.equal(await plain.locator('#desk-numbers .desk-permalink').getAttribute('href'),'#desk-numbers');
  await plain.close();
  console.log('no JavaScript: catalogue and project reading passed');

  const graphFallback=await browser.newPage({viewport:{width:320,height:740},reducedMotion:'reduce'});
  await graphFallback.route('**/rook-graph.js*',route=>route.abort());
  await graphFallback.goto(base+'/#conway');
  await graphFallback.locator('dialog[open]').waitFor();
  assert.equal(await graphFallback.locator('.rook-view-controls').isVisible(),false);
  assert.equal(await graphFallback.locator('#rook-board button').count(),9);
  await graphFallback.locator('#rook-board button').first().click();
  assert.equal(await graphFallback.locator('#rook-board .neighbor').count(),4);
  await graphFallback.close();
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

  const noDesk=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await noDesk.route('**/workbench.js*',route=>route.abort());
  await noDesk.goto(base);
  assert.equal(await noDesk.locator('.desk-tabs').isVisible(),false);
  assert.equal(await noDesk.locator('[data-desk-panel]:visible').count(),4);
  assert.equal(await noDesk.locator('#open-print').textContent(),'Listen to a flyover');
  await noDesk.locator('#open-print').click();
  await noDesk.locator('dialog[open] #flyover').waitFor();
  await noDesk.close();
  console.log('missing workbench enhancement: original shelf reader remains available');

  const reading = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reading.route('**/shelf.js*',route=>route.abort());
  const readingErrors=[];
  reading.on('pageerror',error=>readingErrors.push(error.message));
  await reading.goto(base + '/#flyover');
  await reading.locator('html.script-unavailable').waitFor();
  assert.match(await reading.locator('.shelf-heading p').textContent(),/could not load.*read the project notes/);
  assert.equal(await reading.locator('.project-details .detail:visible').count(),6);
  assert.equal(await reading.locator('.shelf-controls').isVisible(),false);
  assert.equal(await reading.locator('#factor-form').isVisible(),false);
  assert.equal(await reading.locator('#cpu .predictor:visible').count(),0);
  assert.ok(await reading.locator('#cpu-trace').isVisible(),'independent processor trace remains available when main enhancement fails');
  assert.equal(await reading.locator('#flyover audio:visible').count(),1);
  assert.ok((await reading.locator('#recording').getAttribute('src')).endsWith('livermore.mp3'));
  await reading.locator('#recording').click({position:{x:20,y:16}});
  await reading.waitForFunction(()=>{const audio=document.querySelector('#recording');return !audio.paused && audio.currentTime>0;});
  await reading.waitForFunction(()=>document.querySelector('#flyover .spectrum img').naturalWidth>0);
  assert.equal(await reading.locator('#flyover .spectrum img:visible').count(),1);
  await reading.locator('#flyover .player').screenshot({path:'test-results/main-script-unavailable.png'});
  await reading.locator('.index summary').click();
  await reading.locator('.index a[data-project="cpu"]').click();
  assert.ok(reading.url().endsWith('#cpu'));
  assert.deepEqual(readingErrors,[]);
  await reading.close();
  console.log('missing main enhancement: native reading, links and media passed');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
