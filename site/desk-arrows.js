const arrows = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

// A tap nudges once. Holding a key continues at a frame-rate independent
// speed, regardless of the browser's key-repeat delay or repeat frequency.
export function attachHeldArrows(element, enabled, move, tapTime = .085) {
  const held = new Set();
  let frame = 0, last = 0;
  function clear() {
    held.clear();
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function tick(time) {
    if (!held.size || !enabled()) { clear(); return; }
    let x = 0, y = 0;
    for (const key of held) {
      x += arrows[key][0];
      y += arrows[key][1];
    }
    const length = Math.hypot(x, y);
    const elapsed = Math.min(.05, Math.max(0, (time - last) / 1000));
    if (length) move(x / length * elapsed, y / length * elapsed, time);
    last = time;
    frame = requestAnimationFrame(tick);
  }
  element.addEventListener('keydown', event => {
    if (!Object.hasOwn(arrows, event.key) || event.defaultPrevented || !enabled() ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.target.closest?.('input, select, textarea, [contenteditable]')) return;
    event.preventDefault();
    if (held.has(event.key) || event.repeat) return;
    const [x, y] = arrows[event.key];
    move(x * tapTime, y * tapTime, event.timeStamp);
    held.add(event.key);
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });
  window.addEventListener('keyup', event => {
    held.delete(event.key);
    if (!held.size) clear();
  });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  return clear;
}
