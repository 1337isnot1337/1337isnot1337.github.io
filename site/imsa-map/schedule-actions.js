/* Local-only output tools. The parser and its rendered room lists stay authoritative. */
export default function attachScheduleActions() {
  const form = document.querySelector('form');
  const field = form?.querySelector('textarea');
  if (!form || !field) return;
  const tools = document.createElement('section');
  tools.className = 'schedule-actions';
  tools.setAttribute('aria-label', 'Keep your room list');
  const copy = document.createElement('button');
  copy.type = 'button'; copy.textContent = 'Copy room list';
  const print = document.createElement('button');
  print.type = 'button'; print.textContent = 'Print / save PDF';
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = 'Copy includes every day and semester shown below.';
  const fallback = document.createElement('textarea');
  fallback.readOnly = true; fallback.hidden = true;
  fallback.setAttribute('aria-label', 'Room list to copy manually');
  tools.append(copy, print, status, fallback);
  let dirty = false, generation = 0;
  const result = () => form.querySelector('.schedule-results');
  function text() {
    return [...result().children].map(term => [
      term.querySelector('h2').textContent,
      ...[...term.querySelectorAll('.schedule-days > section')].map(day =>
        [day.querySelector('h3').textContent, ...[...day.querySelectorAll('li')].map((li, i) => `${i + 1}. ${li.textContent}`)].join('\n')),
    ].join('\n\n')).join('\n\n');
  }
  function sync() {
    const output = result();
    if (!output) { tools.remove(); return; }
    if (tools.nextElementSibling !== output) output.before(tools);
    copy.disabled = print.disabled = dirty;
  }
  field.addEventListener('input', () => {
    dirty = true; generation++;
    fallback.hidden = true; fallback.value = '';
    if (result()) status.textContent = 'Your input changed. Submit again before copying or printing the updated list.';
    sync();
  });
  form.addEventListener('submit', () => {
    dirty = false; generation++; fallback.hidden = true; fallback.value = '';
    status.textContent = 'Copy includes every day and semester shown below.';
    // Yew renders asynchronously. Wait for its DOM update rather than read old results.
    requestAnimationFrame(sync);
  });
  copy.addEventListener('click', async () => {
    if (dirty || !result()) return;
    const value = text(), revision = generation;
    copy.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      if (revision === generation) status.textContent = 'Room list copied. Paste it into your notes.';
    } catch {
      if (revision === generation) {
        fallback.value = value; fallback.hidden = false;
        status.textContent = 'Clipboard access was unavailable. Copy the selected text below.';
        fallback.focus(); fallback.select();
      }
    } finally { sync(); }
  });
  print.addEventListener('click', () => { if (!dirty && result()) window.print(); });
  new MutationObserver(sync).observe(form, { childList: true, subtree: true });
  sync();
}
