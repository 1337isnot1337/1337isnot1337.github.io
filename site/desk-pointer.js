// Pointer Lock supplies deltas, so the painted paw and picking share one position.
export function attachDeskPointer(stage, {pick, look, orbitBy}) {
  const canvas = stage.querySelector('canvas');
  const paw = stage.querySelector('.desk-paw');
  const shelf = stage.querySelector('.shelf-return');
  const controls = new Map([...stage.querySelectorAll('[data-object]')].map(el => [el.dataset.object, el]));
  const locked = () => document.pointerLockElement === canvas;
  const rendered = () => stage.classList.contains('is-rendered');
  let x = 0, y = 0, hoverFrame = 0, press = null, suppressClick = false;
  let pointerType = '', lockPending = false;
  function clear() {
    cancelAnimationFrame(hoverFrame);
    hoverFrame = 0;
    stage.classList.remove('has-paw', 'looking-around');
    press = null;
    look(0, 0);
  }
  function leave() {
    lockPending = false;
    if (locked()) document.exitPointerLock();
    clear();
  }
  function atPoint() {
    const r = stage.getBoundingClientRect();
    const element = document.elementFromPoint(r.left + x, r.top + y);
    if (shelf.contains(element)) return shelf;
    const link = element?.closest('[data-object]');
    if (link && !link.hidden) return link;
    const prop = controls.get(pick(x / r.width, y / r.height));
    return prop && !prop.hidden ? prop : null;
  }
  function pose() {
    hoverFrame = 0;
    const target = atPoint();
    paw.dataset.pose = press?.dragging ? 'hold' : target?.dataset.object === 'lamp' ? 'light' : target ? 'reach' : 'rest';
  }
  function movePaw() {
    stage.classList.add('has-paw');
    paw.style.transform = 'translate3d(' + (x - 3) + 'px,' + (y - 3) + 'px,0)';
    if (!hoverFrame) hoverFrame = requestAnimationFrame(pose);
  }
  function updatePosition(e) {
    const r = stage.getBoundingClientRect();
    if (locked()) {
      x = Math.max(0, Math.min(r.width - 1, x + e.movementX));
      y = Math.max(0, Math.min(r.height - 1, y + e.movementY));
    } else {
      x = e.clientX - r.left;
      y = e.clientY - r.top;
    }
  }
  stage.addEventListener('pointermove', e => {
    if (!rendered()) return;
    pointerType = e.pointerType;
    updatePosition(e);
    if (press && press.id === e.pointerId) {
      const dx = locked() ? e.movementX : x - press.lastX;
      press.dx += dx;
      if (!press.dragging && Math.abs(press.dx) > 8 && Math.abs(press.dx) > Math.abs(y - press.startY)) {
        press.dragging = true;
        if (!locked()) stage.setPointerCapture(e.pointerId);
        stage.classList.add('looking-around');
        orbitBy(press.dx / stage.clientWidth);
      } else if (press.dragging) orbitBy(dx / stage.clientWidth);
      press.lastX = x;
    }
    if (pointerType !== 'mouse') return;
    movePaw();
    if (!press?.dragging) look(x / stage.clientWidth * 2 - 1, y / stage.clientHeight * 2 - 1);
  });
  stage.addEventListener('pointerdown', e => {
    if (!rendered() || !e.isPrimary || e.button !== 0) return;
    pointerType = e.pointerType;
    if (!locked()) updatePosition(e);
    if (pointerType !== 'mouse') clear();
    else movePaw();
    suppressClick = false;
    if (e.target.closest('.shelf-return')) return;
    press = {id:e.pointerId, lastX:x, startY:y, dx:0, dragging:false};
  });
  function release(e) {
    if (press?.id !== e.pointerId) return;
    suppressClick = press.dragging;
    press = null;
    stage.classList.remove('looking-around');
    if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    if (stage.classList.contains('has-paw') && !hoverFrame) hoverFrame = requestAnimationFrame(pose);
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', e => { release(e); clear(); });
  stage.addEventListener('dragstart', e => { if (e.target.closest('[data-object]')) e.preventDefault(); });
  stage.addEventListener('pointerleave', () => { if (!locked() && !press?.dragging) clear(); });
  stage.addEventListener('click', e => {
    if (!e.detail || !rendered() || e.button !== 0) return;
    if (suppressClick) {
      suppressClick = false; e.preventDefault(); e.stopImmediatePropagation(); return;
    }
    if (!locked()) updatePosition(e);
    const target = e.target === canvas ? atPoint() : e.target.closest('a,button');
    if (target?.tagName === 'A') leave();
    else if (!locked() && pointerType === 'mouse' && e.isTrusted &&
             matchMedia('(any-pointer:fine)').matches && canvas.requestPointerLock) {
      lockPending = true;
      try { canvas.requestPointerLock()?.catch(() => { lockPending = false; }); }
      catch { lockPending = false; }
    }
    if (e.target === canvas && target) target.click();
  }, true);
  document.addEventListener('pointerlockchange', () => {
    if (locked() && lockPending) { lockPending = false; movePaw(); }
    else leave();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Tab' || e.key === 'Escape') leave(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  window.addEventListener('blur', leave);
  window.addEventListener('pagehide', leave);
  return leave;
}
