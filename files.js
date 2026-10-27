
// File popups: each portfolio section lives in its own dialog. Opening is
// driven by the URL hash (#file-<name>) so cards, the side panel, shared
// links and the browser Back button all behave the same way.
(() => {
  const files = [...document.querySelectorAll('.file')];
  if (!files.length) return;
  let current = null, lastFocus = null;
  const nameOf = (f) => f.id.replace('file-', '');

  // Closing a file puts video thumbnails back, which also stops playback.
  const stopVideos = (file) => file.querySelectorAll('.yt-frame').forEach((f) => {
    const a = f.parentElement;
    if (a && a._restore) a._restore();
  });
  const hide = (file, swapping) => {
    stopVideos(file);
    file.classList.remove('open');
    file.hidden = true;
    current = null;
    if (!swapping) {
      document.body.classList.remove('file-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    window.dispatchEvent(new CustomEvent('jl-file', { detail: { name: nameOf(file), open: false } }));
  };
  const show = (file) => {
    if (current === file) return;
    if (current) hide(current, true);
    lastFocus = document.activeElement;
    file.hidden = false;
    file.classList.add('open');
    document.body.classList.add('file-open');
    file.querySelector('.file-body').scrollTop = 0;
    file.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
    current = file;
    file.querySelector('.file-close').focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('jl-file', { detail: { name: nameOf(file), open: true } }));
  };
  const sync = () => {
    const f = files.find((x) => '#' + x.id === location.hash);
    if (f) show(f); else if (current) hide(current);
  };
  const close = () => {
    if (!current) return;
    // Back to the page without leaving a stale #file-... in the URL.
    history.pushState('', document.title, location.pathname + location.search);
    hide(current);
  };

  window.addEventListener('hashchange', sync);
  files.forEach((f) => {
    f.querySelector('.file-close').addEventListener('click', close);
    f.addEventListener('click', (e) => { if (e.target === f) close(); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  sync();
})();
