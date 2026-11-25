(() => {
  const poster = document.querySelector('[data-object="room-neuralink"]');
  const card = document.getElementById('internship-card');
  if (!poster || !card || typeof card.showModal !== 'function') return;
  poster.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (!card.open) card.showModal();
    event.preventDefault();
  });
  card.addEventListener('close', () => {
    if (!poster.hidden) poster.focus({ preventScroll: true });
  });
  window.addEventListener('hashchange', () => {
    if (card.open) card.close();
  });
})();
