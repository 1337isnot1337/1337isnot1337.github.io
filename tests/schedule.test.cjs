const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const pause = () => new Promise(resolve => setTimeout(resolve, 25));

test('published WASM separates terms, expands periods and recovers from invalid input', async () => {
  const dom = new JSDOM('<body></body>', { url: 'https://example.test', pretendToBeVisual: true, runScripts: 'outside-only' });
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
  dom.window.eval(fs.readFileSync(path.join(dir, "schedule-actions.js"), "utf8"));
  assert.equal(document.querySelector(".schedule-actions"), null, "no exports before successful parsing");
  async function submit(value) {
    field.value = value;
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
    await pause();
    field.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await pause();
  }
  const row = (period, term, room) => `${period}\t${term}\tMath\tMath\tExample\t${room}\tstart\tend`;
  // This public fixture is synthetic. Compare the reader's compact illustration
  // with the shipped WASM, not a second implementation of schedule parsing.
  const sampleRows = [
    "2(A,C-D)\tS1\tMAT101\tMathematics\tExample\tA113\t08/19/2024\t01/19/2025",
    "3(B,I)\tS1\tPHY101\tPhysics\tExample\tB204\t08/19/2024\t01/19/2025",
  ];
  const loader = fs.readFileSync('site/imsa-map/index.html', 'utf8');
  for (const row of sampleRows) assert.ok(loader.includes(JSON.stringify(row)), 'reader uses the actual public example fixture');
  await submit('Sample week\nPeriod / Term / Course / Title / Teacher / Room / Start / End\n' + sampleRows.join('\n'));
  const example = new JSDOM(fs.readFileSync('site/index.html', 'utf8'));
  const preview = example.window.document.querySelector('.schedule-example');
  assert.ok(preview);
  assert.match(preview.textContent, /Example data, not my class schedule/);
  assert.match(preview.textContent, /Periods 2.3 shown/);
  assert.deepEqual([...preview.querySelectorAll('.schedule-example-input > div')].map(node => [
    node.querySelector('b').textContent.trim(),
    node.querySelector('span').textContent.trim().replace(/\s+/g, ' '),
  ]), [
    ['Mathematics', '2(A,C-D) · S1 · Room A113'],
    ['Physics', '3(B,I) · S1 · Room B204'],
  ], 'displayed input fields match the same public fixture');

  const outputDays = [...document.querySelectorAll('.schedule-days > section')];
  for (const [i, day] of ['A', 'B', 'I', 'C', 'D'].entries()) {
    const periods = [...outputDays[i].querySelectorAll('li')].map(node => node.textContent);
    for (const period of [2, 3]) {
      assert.equal(preview.querySelector(`[data-example-day="${day}"] [data-example-period="${period}"]`).textContent.trim(), periods[period - 1]);
    }
    for (const period of [1, 4, 5, 6, 7, 8]) assert.equal(periods[period - 1], 'Free period');
  }
  example.window.close();
  const actions = document.querySelector('.schedule-actions');
  assert.ok(actions);
  const [copy, print] = actions.querySelectorAll('button');
  assert.equal(actions.nextElementSibling, document.querySelector('.schedule-results'));
  let copied = '', prints = 0;
  Object.defineProperty(window.navigator, 'clipboard', {configurable:true, value:{writeText: async value => {copied=value;}}});
  window.print = () => { prints++; };
  copy.click(); await pause();
  assert.match(copied, /^S1 room list\n\nA day\n1\. Free period\n2\. A113/);
  assert.match(copied, /I day\n1\. Free period\n2\. Free period\n3\. B204/);
  assert.match(actions.textContent, /Room list copied/);
  print.click(); assert.equal(prints, 1);
  window.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
  copy.click(); await pause();
  const manual = actions.querySelector('textarea');
  assert.equal(manual.hidden, false);
  assert.equal(manual.value, copied);
  assert.equal(document.activeElement, manual);
  assert.equal(manual.selectionEnd, copied.length);
  field.dispatchEvent(new window.Event('input', {bubbles:true}));
  assert.equal(copy.disabled, true); assert.equal(print.disabled, true);
  assert.equal(manual.hidden, true); assert.equal(manual.value, '');
  assert.match(actions.textContent, /Submit again/);
  print.click(); assert.equal(prints, 1);


  await submit('Schedule\nHeader\n' + row('2-4(A,C-D)', 'S1', 'A113') + '\n' + row('3(A)', 'S2', 'B204'));
  assert.equal(document.querySelectorAll('.schedule-results > section').length, 2);
  const days = document.querySelectorAll('.schedule-days');
  assert.deepEqual([...days[0].querySelectorAll('h3')].map(x => x.textContent), ['A day', 'B day', 'I day', 'C day', 'D day']);
  assert.deepEqual([...days[0].querySelector('ol').children].slice(1, 4).map(x => x.textContent), ['A113', 'A113', 'A113']);
  assert.equal(days[1].querySelector('ol').children[2].textContent, 'B204');
  await submit('Schedule\nHeader\n' + row('4-2(A)', 'S1', 'A113'));
  assert.match(document.querySelector('[role="alert"]').textContent, /forwards/);
  assert.equal(document.querySelector('.schedule-results'), null);
  assert.equal(document.querySelector('.schedule-actions'), null);
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
  for (const room of ['', '   ']) {
    await submit(row('1(A)', 'S1', room));
    const periods = document.querySelector('.schedule-days ol').children;
    assert.equal(periods[0].textContent, 'Room not listed');
    assert.equal(periods[1].textContent, 'Free period');
  }
  for (const [first, second] of [['A101', 'B204'], ['', 'B204'], ['B204', '']]) {
    await submit(row('1-3(A,C-D)', 'S1', first) + '\n' + row('2(C)', 'S1', second));
    assert.match(document.querySelector('[role="alert"]').textContent, /Conflicting rooms/);
    assert.equal(document.querySelector('.schedule-results'), null);
  assert.equal(document.querySelector('.schedule-actions'), null);
  }
  await submit(row('1(A)', 'S1', 'A101') + '\n' + row('1(A)', 'S1', ' A101 '));
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.equal(document.querySelector('.schedule-days li').textContent, 'A101');
  await submit(row('1(A)', 'S1', 'A101') + '\n' + row('1(A)', 'S2', 'B204'));
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.deepEqual([...document.querySelectorAll('.schedule-days')].map(days => days.querySelector('li').textContent), ['A101', 'B204']);
  dom.window.close();
});

test('schedule loader versions its binary by content', () => {
  const { createHash } = require('node:crypto');
  const binary = fs.readFileSync('site/imsa-map/schedule_bg.wasm');
  const digest = createHash('sha256').update(binary).digest('hex').slice(0,12);
  const html = fs.readFileSync('site/imsa-map/index.html','utf8');
  assert.ok(html.includes(`schedule_bg.wasm?v=${digest}`), 'update loader version when rebuilding WASM');
});
