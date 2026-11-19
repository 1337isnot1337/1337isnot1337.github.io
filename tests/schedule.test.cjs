const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const pause = () => new Promise(resolve => setTimeout(resolve, 25));

test('published WASM separates terms, expands periods and recovers from invalid input', async () => {
  const dom = new JSDOM('<body></body>', { url: 'https://example.test', pretendToBeVisual: true });
  for (const key of ['window', 'document', 'navigator', 'Window', 'Document', 'Element', 'Node', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event']) {
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
  }
  globalThis.self = dom.window;
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  const dir = path.join(__dirname, '../site/imsa-map');
  const moduleURL = 'data:text/javascript;base64,' + fs.readFileSync(path.join(dir, 'schedule.js')).toString('base64');
  const { default: init } = await import(moduleURL);
  await init({ module_or_path: fs.readFileSync(path.join(dir, 'schedule_bg.wasm')) });
  await pause();
  const field = document.querySelector('textarea');
  assert.ok(field);
  async function submit(value) {
    field.value = value;
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
    await pause();
    field.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await pause();
  }
  const row = (period, term, room) => `${period}\t${term}\tMath\tMath\tExample\t${room}\tstart\tend`;
  await submit('Schedule\nHeader\n' + row('2-4(A,C-D)', 'S1', 'A113') + '\n' + row('3(A)', 'S2', 'B204'));
  assert.equal(document.querySelectorAll('.schedule-results > section').length, 2);
  const days = document.querySelectorAll('.schedule-days');
  assert.deepEqual([...days[0].querySelectorAll('h3')].map(x => x.textContent), ['A day', 'B day', 'I day', 'C day', 'D day']);
  assert.deepEqual([...days[0].querySelector('ol').children].slice(1, 4).map(x => x.textContent), ['A113', 'A113', 'A113']);
  assert.equal(days[1].querySelector('ol').children[2].textContent, 'B204');
  await submit('Schedule\nHeader\n' + row('4-2(A)', 'S1', 'A113'));
  assert.match(document.querySelector('[role="alert"]').textContent, /forwards/);
  assert.equal(document.querySelector('.schedule-results'), null);
  await submit('Schedule\nHeader\n' + row('1(I)', 'S2', 'C105'));
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.match(document.querySelector('.schedule-results').textContent, /C105/);
  for (const prefix of ['', 'Headings\n', 'Schedule\nHeadings\n']) {
    await submit(prefix + [row('1(A)', 'S1', 'A101'), row('2(A)', 'S1', 'A102'), row('3(A)', 'S1', 'A103')].join('\n'));
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.deepEqual([...document.querySelector('.schedule-days ol').children].slice(0, 3).map(x => x.textContent), ['A101', 'A102', 'A103']);
  }
  await submit(row('1(I)', 'S1', 'C105'));
  assert.match(document.querySelector('.schedule-results').textContent, /C105/);
  dom.window.close();
});
