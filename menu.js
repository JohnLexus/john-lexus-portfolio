// Full-screen menu. Open: the overlay's clip-path grows up from a strip at the
// bottom while photo, details, links and bar animate in (timings live in
// menu.css). Close: it collapses to the top edge, then resets for next time.
// While the pointer is over the menu on wide screens, its horizontal position
// pans the link row, and the accent bar follows the hovered link, both easing
// 5% of the remaining distance per frame.
(() => {
  const toggle = document.querySelector('.mtoggle');
  const menu = document.getElementById('menu');
  if (!toggle || !menu) return;

  const row = menu.querySelector('.mrow');
  const bar = menu.querySelector('.mbar');
  const links = [...menu.querySelectorAll('.mlink')];
  const wide = window.matchMedia('(min-width:1000px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const CLOSE_MS = 1250;

  // Split each link into letters: two stacked copies per letter for the roll.
  links.forEach((a, li) => {
    const text = a.textContent.trim();
    a.setAttribute('aria-label', text);
    a.textContent = '';
    [...text].forEach((ch, ci) => {
      const s = document.createElement('span');
      s.className = 'mch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--c', ci);
      const g = ch === ' ' ? ' ' : ch;
      s.innerHTML = '<i>' + g + '</i><i>' + g + '</i>';
      a.appendChild(s);
    });
    a.parentElement.style.setProperty('--i', li);
    a.style.setProperty('--i', li);
  });
  menu.querySelectorAll('.dl').forEach((el, i) => el.style.setProperty('--i', i));

  // ---- Pan + bar easing ----
  let rowX = 0, rowTarget = 0;
  let barX = 0, barW = 0, barXT = 0, barWT = 0;
  let raf = 0, hovered = links[0];
  const setBarTarget = (a) => { hovered = a; barXT = a.offsetLeft; barWT = a.offsetWidth; };
  const travel = () => Math.max(0, row.scrollWidth - (window.innerWidth - 64));

  const frame = () => {
    rowX += (rowTarget - rowX) * 0.05;
    barX += (barXT - barX) * 0.05;
    barW += (barWT - barW) * 0.05;
    row.style.transform = 'translateX(' + rowX.toFixed(2) + 'px)';
    bar.style.transform = '';
    bar.style.left = barX.toFixed(2) + 'px';
    bar.style.width = barW.toFixed(2) + 'px';
    raf = requestAnimationFrame(frame);
  };
  const startLoop = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };

  menu.addEventListener('mousemove', (e) => {
    if (!wide.matches) return;
    const w = window.innerWidth;
    const t = Math.min(1, Math.max(0, (e.clientX - w * 0.25) / (w * 0.5)));
    rowTarget = -t * travel();
  });
  links.forEach((a) => a.addEventListener('mouseenter', () => { if (wide.matches) setBarTarget(a); }));
  row.addEventListener('mouseleave', () => { if (wide.matches) setBarTarget(links[0]); });

  // ---- Open / close ----
  let state = 'closed', lastFocus = null, closeTimer = 0;
  const finishClose = () => {
    menu.classList.add('is-reset');
    menu.classList.remove('is-open', 'is-closing', 'is-visible');
    void menu.offsetWidth;
    menu.classList.remove('is-reset');
    stopLoop();
    state = 'closed';
  };
  const open = () => {
    if (state === 'open') return;
    clearTimeout(closeTimer);
    if (state === 'closing') finishClose();
    state = 'open';
    lastFocus = document.activeElement;
    rowX = rowTarget = 0;
    row.style.transform = '';
    setBarTarget(links[0]);
    menu.classList.add('is-visible');
    barX = barXT; barW = barWT;
    bar.style.left = barX + 'px';
    bar.style.width = barW + 'px';
    void menu.offsetWidth;                       // commit the start state
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    if (wide.matches && !reduce.matches) startLoop();
    links[0].focus({ preventScroll: true });
  };
  const close = (after) => {
    if (state !== 'open') return;
    state = 'closing';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    menu.classList.remove('is-open');
    menu.classList.add('is-closing');
    if (after) after();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    closeTimer = setTimeout(finishClose, reduce.matches ? 0 : CLOSE_MS);
  };

  toggle.addEventListener('click', () => (state === 'open' ? close() : open()));
  document.querySelectorAll('[data-open-menu]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Each word closes the menu and opens its popup file (files.js reads the hash).
  links.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const hash = a.getAttribute('href');
    close(() => { if (location.hash !== hash) location.hash = hash; });
  }));
  wide.addEventListener('change', () => { if (state === 'open') { rowTarget = rowX = 0; row.style.transform = ''; wide.matches && !reduce.matches ? startLoop() : stopLoop(); } });
})();
