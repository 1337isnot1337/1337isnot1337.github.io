const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('site/index.html', 'utf8');
const script = fs.readFileSync('site/shelf.js', 'utf8');
function page(setup = () => {}) {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://1337isnot1337.github.io/', pretendToBeVisual: true });
  dom.window.matchMedia = () => ({ matches: true, addEventListener() {} });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  setup(dom.window);
  dom.window.eval(script);
  const d = dom.window.document;
  return { dom, d, click: id => d.querySelector(id).click(), input(id, value) {
    d.querySelector(id).value = value;
    d.querySelector(id).dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  }};
}
test('all local resources and project anchors resolve', () => {
  const d = new JSDOM(html).window.document;
  const ids = [...d.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
  for (const el of d.querySelectorAll('[src], link[href]')) {
    const url = el.getAttribute('src') || el.getAttribute('href');
    if (!url.startsWith('https:')) assert.ok(fs.existsSync('site/' + url.split('?')[0]), url);
  }
  for (const el of d.querySelectorAll('a[href^="#"]')) assert.ok(d.getElementById(el.hash.slice(1)), el.hash);
});
test('catalogue matches accents, case, and whitespace; empty search can recover', () => {
  const p = page();
  assert.equal(p.d.querySelector('#result-count').textContent, '6 of 31 projects');
  p.input('#find-project', 'ERDOS');
  assert.equal(p.d.querySelector('#result-count').textContent, '1 project');
  p.input('#find-project', 'matrix    multiplication');
  assert.equal(p.d.querySelector('#result-count').textContent, '1 project');
  p.input('#find-project', 'nothing-matches');
  assert.equal(p.d.querySelector('#no-projects').hidden, false);
  p.click('#clear-projects');
  assert.equal(p.d.querySelector('#no-projects').hidden, true);
  assert.equal(p.d.activeElement.id, 'find-project');
  p.click('#more-projects');
  assert.equal(p.d.querySelectorAll('.catalogue-list li:not([hidden])').length, 31);
  p.dom.window.close();
});
test('the War demo repeats the entire deal, not just the exposed cards', () => {
  const p = page();
  const initial = p.d.querySelector('#war-queues').textContent;
  p.click('#deal-war');
  assert.match(p.d.querySelector('#war-report').value, /Turn 1. Player A won/);
  assert.notEqual(p.d.querySelector('#war-queues').textContent, initial);
  p.click('#repeat-war');
  assert.match(p.d.querySelector('#war-report').value, /Turn 90.*game repeats/);
  assert.equal(p.d.querySelector('#war-queues').textContent, initial);
  p.click('#repeat-war');
  assert.match(p.d.querySelector('#war-report').value, /Turn 180.*game repeats/);
  p.click('#reset-war');
  assert.equal(p.d.querySelector('#war-queues').textContent, initial);
  p.dom.window.close();
});
test('branch predictor reports its pre-update guess and saturates at both ends', () => {
  const p = page();
  p.click('[data-taken="true"]');
  assert.match(p.d.querySelector('#prediction-result').textContent, /Predicted not taken.*Missed/);
  assert.match(p.d.querySelector('#forecast').textContent, /^10/);
  for (let i = 0; i < 8; i++) p.click('[data-taken="true"]');
  assert.match(p.d.querySelector('#forecast').textContent, /^11/);
  for (let i = 0; i < 8; i++) p.click('[data-taken="false"]');
  assert.match(p.d.querySelector('#forecast').textContent, /^00/);
  p.click('#reset-predictor');
  assert.match(p.d.querySelector('#forecast').textContent, /^01/);
  p.dom.window.close();
});
test('factorization, instruction encoding, and rook neighbors handle boundaries', () => {
  const p = page();
  for (const [n, result] of [[2, '2 is prime.'], [221, '221 = 13 × 17'], [999999, '999999 = 3 × 3 × 3 × 7 × 11 × 13 × 37']]) {
    p.input('#composite', n); p.click('#factor-form button');
    assert.equal(p.d.querySelector('#factors').value, result);
  }
  p.input('#address', 32767);
  assert.equal(p.d.querySelector('#instruction').value, '0111 1111 1111 1111');
  p.input('#address', '');
  assert.match(p.d.querySelector('#instruction').value, /Enter a whole number/);
  for (const square of p.d.querySelectorAll('#rook-board button')) {
    square.click();
    assert.equal(p.d.querySelectorAll('#rook-board .neighbor').length, 4);
    assert.equal(p.d.querySelectorAll('#rook-board [aria-pressed="true"]').length, 1);
  }
  p.dom.window.close();
});
test('missing-page recovery and schedule loading work before JavaScript', () => {
  const missing = new JSDOM(fs.readFileSync('site/404.html', 'utf8')).window.document;
  assert.equal(missing.querySelector('meta[name="robots"]').content, 'noindex');
  assert.ok(missing.querySelector('a[href="/"]'));
  const schedule = new JSDOM(fs.readFileSync('site/imsa-map/index.html', 'utf8')).window.document;
  assert.equal(schedule.querySelector('h1').textContent, 'IMSA schedule map');
  assert.ok(schedule.querySelector('#schedule-loading[role="status"]'));
  assert.ok(schedule.querySelector('noscript'));
});

test('illustrated contents explains each experiment without JavaScript', () => {
  const d = new JSDOM(html).window.document;
  const entries = [...d.querySelectorAll('.index a[data-project]')];
  assert.equal(entries.length, 6);
  for (const entry of entries) {
    assert.ok(entry.querySelector('strong').textContent.length > 3);
    assert.ok(entry.querySelector('small').textContent.length > 12);
    assert.equal(entry.querySelector('img').alt, '');
    assert.ok(fs.existsSync('site/' + entry.querySelector('img').getAttribute('src')));
  }
});

test('War cycle chart and scrubber track the real 23-card deal', () => {
  const p=page();
  const initial=p.d.querySelector('#war-queues').textContent;
  const traces=[...p.d.querySelectorAll('#war-lines polyline')].map(line => line.getAttribute('points').split(' '));
  assert.equal(traces.length,3);
  for (const trace of traces) assert.equal(trace.length,91);
  for (let step=0;step<=90;step++) {
    const counts=traces.map(trace => (108-Number(trace[step].split(',')[1]))/7.5);
    assert.equal(counts.reduce((a,b)=>a+b),23);
    assert.ok(counts.every(n=>n>0 && n<=12));
  }
  for (let step=6;step<=90;step++) {
    for (const trace of traces) assert.equal(trace[step].split(',')[1],trace[step%6].split(',')[1]);
  }
  p.input('#war-turn',45);
  assert.match(p.d.querySelector('#war-report').value,/Turn 45/);
  assert.notEqual(p.d.querySelector('#war-queues').textContent,initial);
  p.input('#war-turn',90);
  assert.equal(p.d.querySelector('#war-queues').textContent,initial);
  assert.match(p.d.querySelector('#war-report').value,/game repeats/);
  p.click('#deal-war');
  assert.equal(p.d.querySelector('#war-turn').value,'1');
  p.click('#reset-war');
  assert.equal(p.d.querySelector('#war-turn').value,'0');
  p.dom.window.close();
});

test('rook comparisons show the actual common-neighbor counts', () => {
  const p=page();
  p.click('[data-rook-pair="A1,B1"]');
  assert.deepEqual([...p.d.querySelectorAll('#rook-board .neighbor')].map(e=>e.textContent),['C1']);
  assert.match(p.d.querySelector('#rook-caption').value,/Adjacent.*1 shared neighbor/);
  p.click('[data-rook-pair="A1,B2"]');
  assert.deepEqual([...p.d.querySelectorAll('#rook-board .neighbor')].map(e=>e.textContent),['A2','B1']);
  assert.match(p.d.querySelector('#rook-caption').value,/Nonadjacent.*2 shared neighbors/);
  assert.equal(p.d.querySelectorAll('#rook-board [aria-pressed="true"]').length,2);
  p.d.querySelector('#rook-board button').click();
  assert.equal(p.d.querySelectorAll('#rook-board .neighbor').length,4);
  assert.equal(p.d.querySelectorAll('#rook-board [aria-pressed="true"]').length,1);
  p.dom.window.close();
});

test('audio comparison seeks explicitly and explains playback failures', async () => {
  const p=page();
  const audio=p.d.querySelector('#recording');
  let starts=0;
  Object.defineProperty(audio,'readyState',{value:1,configurable:true});
  audio.play=async () => {starts++;};
  p.click('[data-audio-cue="70"]');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(audio.currentTime,70);
  assert.equal(starts,1);
  assert.equal(p.d.querySelector('#audio-status').hidden,true);
  Object.defineProperty(audio,'readyState',{value:0,configurable:true});
  audio.currentTime=0;
  p.click('[data-audio-cue="70"]');
  assert.equal(audio.currentTime,0);
  audio.dispatchEvent(new p.dom.window.Event('loadedmetadata'));
  assert.equal(audio.currentTime,70);
  Object.defineProperty(audio,'readyState',{value:1,configurable:true});
  audio.play=async () => {throw new Error('Unavailable');};
  p.click('[data-audio-cue="10"]');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(audio.currentTime,10);
  assert.equal(p.d.querySelector('#audio-status').hidden,false);
  assert.match(p.d.querySelector('#audio-status').textContent,/Try the audio player/);
  audio.play=async () => {throw new p.dom.window.DOMException('Paused', 'AbortError');};
  p.click('[data-audio-cue="10"]');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(p.d.querySelector('#audio-status').hidden,true);
  p.dom.window.close();
});

test('shelf arrows preserve modified browser shortcuts and still turn plain arrows', () => {
  let shelf;
  const p = page(window => {
    window.Swiper = class {
      constructor(carousel, options) {
        this.slides = [...carousel.querySelectorAll('.swiper-slide')];
        this.realIndex = options.initialSlide;
        this.activeIndex = options.initialSlide;
        shelf = this;
      }
      slideToLoop(index) { this.realIndex = this.activeIndex = index; }
    };
  });
  const target = p.d.querySelector('#next');
  const initial = shelf.realIndex;
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      const event = new p.dom.window.KeyboardEvent('keydown', {
        key, [modifier]: true, bubbles: true, cancelable: true,
      });
      target.dispatchEvent(event);
      assert.equal(event.defaultPrevented, false, `${modifier}+${key} must retain native behavior`);
      assert.equal(shelf.realIndex, initial, `${modifier}+${key} must not rotate the shelf`);
    }
  }
  for (const [key, index] of [['ArrowRight', initial + 1], ['ArrowLeft', initial]]) {
    const event = new p.dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(shelf.realIndex, index);
  }
  p.dom.window.close();
});

test('factor ledger shows actual divisions and clears old workings', () => {
  const p=page();
  for (const n of [221,64,30030,999999,97,2]) {
    p.input('#composite',n);p.click('#factor-form button');
    let remainder=n;
    for (const row of p.d.querySelectorAll('#factor-steps li')) {
      const [a,op,b]=[...row.children].map(e=>e.textContent);
      const divisor=Number(op.match(/\d+/)[0]);
      assert.equal(Number(a),remainder);
      assert.equal(Number(a)/divisor,Number(b));
      remainder=Number(b);
    }
    if (n===97 || n===2) {
      assert.equal(p.d.querySelectorAll('#factor-steps li').length,0);
      assert.match(p.d.querySelector('#factor-ending').textContent,/already prime/);
    }
  }
  p.dom.window.close();
});

test('predictor announces the outcome and next state together without nested live regions', () => {
  const p = page();
  const status = p.d.querySelector('#prediction-status');
  assert.equal(status.getAttribute('role'), 'status');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  assert.equal(status.getAttribute('aria-atomic'), 'true');
  assert.equal(status.querySelectorAll('output, [role="status"], [aria-live]').length, 0);
  p.click('[data-taken="true"]');
  assert.match(status.textContent, /10 · Weakly predicts taken/);
  assert.match(status.textContent, /Predicted not taken; actual jump taken.*Missed this one/s);
  p.click('[data-taken="true"]');
  assert.match(status.textContent, /11 · Strongly predicts taken/);
  assert.match(status.textContent, /Predicted taken; actual jump taken.*Correct/s);
  p.click('#reset-predictor');
  assert.match(status.textContent, /01 · Weakly predicts not taken/);
  assert.match(status.textContent, /Reset to 01/);
  assert.doesNotMatch(status.textContent, /Correct|Missed/);
  p.dom.window.close();
});


test('binary register shows the actual fixed type bit and weighted address', () => {
  const p=page();
  for(const n of [0,1,42,16384,32767]) {
    p.input('#address',n);
    const cells=[...p.d.querySelectorAll('#binary-register .binary-cell')];
    assert.equal(cells.length,16);
    assert.equal(cells[0].querySelector('strong').textContent,'0');
    assert.equal(cells[0].querySelector('small').textContent,'type');
    assert.equal(parseInt(cells.map(el=>el.querySelector('strong').textContent).join(''),2),n);
    const sum=p.d.querySelector('#binary-sum').textContent.split(' = ');
    assert.equal(sum[0].split(' + ').reduce((a,b)=>a+Number(b),0),n);
    assert.equal(Number(sum[1]),n);
  }
  p.input('#address','');
  assert.equal(p.d.querySelector('#binary-register').children.length,0);
  assert.equal(p.d.querySelector('#binary-sum').textContent,'');
  p.dom.window.close();
});


test('shared pages request the same version of the shelf stylesheet', () => {
  const stylesheet = path => {
    const dom=new JSDOM(fs.readFileSync('site/'+path,'utf8'),{url:'https://1337isnot1337.github.io/'+path});
    const href=[...dom.window.document.querySelectorAll('link[rel="stylesheet"]')].find(link=>link.href.includes('/shelf.css')).href;
    dom.window.close();
    return href;
  };
  const expected=stylesheet('index.html');
  assert.ok(new URL(expected).searchParams.get('v'));
  for(const path of ['404.html','imsa-map/index.html']) assert.equal(stylesheet(path),expected);
});
