(() => {
  const panel = document.querySelector('[data-desk-panel="numbers"]');
  if (!panel) return;

  const period = 7;
  const forbidden = [2, 5, 9];
  const example = [0, 1, 4];
  let kept = new Set(example);
  const status = panel.querySelector('#desk-number-status');
  const density = panel.querySelector('#desk-number-density');
  const explanation = panel.querySelector('#desk-number-explanation');
  const controls = [];

  // The first seven positions choose residue classes, not isolated points.
  for (const point of panel.querySelectorAll('[data-integer]')) {
    const n = Number(point.dataset.integer);
    if (n >= period) { point.setAttribute('aria-hidden', 'true'); continue; }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = point.className;
    button.dataset.integer = n;
    button.dataset.residue = n;
    button.textContent = n;
    button.setAttribute('aria-label', `Keep position ${n} in each 7-number block`);
    button.addEventListener('click', () => {
      if (kept.has(n)) kept.delete(n);
      else kept.add(n);
      render();
    });
    point.replaceWith(button);
    controls.push(button);
  }
  const points = [...panel.querySelectorAll('[data-integer]')];

  function firstConflict() {
    // Check the infinite periodic set, including the next block. Looking only
    // at the drawn points would make validity depend on the viewport.
    for (const gap of forbidden) {
      for (let residue = 0; residue < period; residue++) {
        if (kept.has(residue) && kept.has((residue + gap) % period))
          return [residue, residue + gap, gap];
      }
    }
    return null;
  }

  function render() {
    const conflict = firstConflict();
    for (const point of points) {
      const n = Number(point.dataset.integer);
      point.classList.toggle('is-selected', kept.has(n % period));
      point.classList.toggle('is-conflict', Boolean(conflict && (n === conflict[0] || n === conflict[1])));
    }
    for (const button of controls)
      button.setAttribute('aria-pressed', String(kept.has(Number(button.dataset.residue))));
    density.textContent = `${kept.size}/7`;
    status.dataset.valid = String(!conflict);
    explanation.textContent = conflict
      ? `${conflict[0]} and ${conflict[1]} are ${conflict[2]} apart. That gap is forbidden.`
      : kept.size ? 'No pair is 2, 5 or 9 apart.' : 'No numbers selected.';
  }

  const reset = panel.querySelector('#desk-number-reset');
  reset.hidden = false;
  reset.addEventListener('click', () => { kept = new Set(example); render(); });
  panel.querySelector('.numberline-instruction').textContent = 'Toggle the first row; the same pattern repeats below.';
  render();
})();
