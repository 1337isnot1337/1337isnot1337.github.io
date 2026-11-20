(() => {
  const surfaces = [
    ['.put-down-surface', '.back-to-desk'],
    ['.drawer-post', '.return-post'],
    ['.calling-card-dialog', '.return-calling-card'],
    ['.pickup', '.put-down'],
    ['.open-project', '#close-dialog']
  ];
  for (const [selector, control] of surfaces) {
    const surface = document.querySelector(selector);
    const paper = surface.tagName === 'DIALOG';
    let press = null;
    function outside(event) {
      if (event.target !== surface) return false;
      if (!paper) return true;
      const box = surface.getBoundingClientRect();
      return event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom;
    }
    surface.addEventListener('pointerdown', event => {
      press = event.isPrimary && event.button === 0 && outside(event)
        ? {x:event.clientX, y:event.clientY, id:event.pointerId} : null;
    }, true);
    surface.addEventListener('pointermove', event => {
      if (press?.id === event.pointerId && Math.hypot(event.clientX-press.x, event.clientY-press.y) > 6) press=null;
    });
    surface.addEventListener('pointercancel', () => { press=null; });
    surface.addEventListener('click', event => {
      const dismiss = press && outside(event) && Math.hypot(event.clientX-press.x,event.clientY-press.y) <= 6;
      press=null;
      if (dismiss || (!paper && event.detail===0)) document.querySelector(control).click();
    });
  }
})();
