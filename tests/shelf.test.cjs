const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('site/index.html', 'utf8');
const script = fs.readFileSync('site/shelf.js', 'utf8');
function page() {
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://1337isnot1337.github.io/', pretendToBeVisual: true });
  dom.window.matchMedia = () => ({ matches: true, addEventListener() {} });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
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
  assert.match(p.d.querySelector('#forecast').value, /^10/);
  for (let i = 0; i < 8; i++) p.click('[data-taken="true"]');
  assert.match(p.d.querySelector('#forecast').value, /^11/);
  for (let i = 0; i < 8; i++) p.click('[data-taken="false"]');
  assert.match(p.d.querySelector('#forecast').value, /^00/);
  p.click('#reset-predictor');
  assert.match(p.d.querySelector('#forecast').value, /^01/);
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
