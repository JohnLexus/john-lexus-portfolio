// Privacy-first, anonymous analytics. No cookies, no IP stored, no fingerprinting.
// A random per-tab session id lives in sessionStorage and dies when the tab closes.
// Events are batched and flushed when the tab is hidden. Does nothing until
// analytics/config.js is filled in, on localhost, or when Do Not Track is on.
// Visit the site once with ?notrack=1 to exclude your own browser.
(() => {
  const cfg = window.JL_ANALYTICS || {};
  if (!cfg.url || !cfg.anonKey) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  const params = new URLSearchParams(location.search);
  try {
    if (params.get('notrack') === '1') localStorage.setItem('jl_notrack', '1');
    if (localStorage.getItem('jl_notrack')) return;
  } catch (_) {}

  let sid;
  try {
    sid = sessionStorage.getItem('jl_sid');
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('jl_sid', sid);
    }
  } catch (_) { sid = Math.random().toString(36).slice(2); }

  const w = window.innerWidth;
  const base = {
    session_id: sid,
    path: location.pathname,
    device: w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop',
    screen_w: w,
    tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 60),
    lang: (navigator.language || '').slice(0, 20)
  };
  const q = (k) => (params.get(k) || '').slice(0, 100) || null;

  // Every row carries the same keys, which PostgREST bulk insert requires.
  const row = (type, target, value, href, extra) => ({
    ...base, type,
    target: target ? String(target).slice(0, 200) : null,
    value: value == null ? null : Math.round(value * 10) / 10,
    href: href ? String(href).slice(0, 500) : null,
    referrer: null, utm_source: null, utm_medium: null, utm_campaign: null, ref_tag: null,
    ...extra
  });

  let queue = [row('pageview', null, null, null, {
    referrer: document.referrer ? document.referrer.slice(0, 300) : null,
    utm_source: q('utm_source'), utm_medium: q('utm_medium'), utm_campaign: q('utm_campaign'),
    ref_tag: q('ref')
  })];

  const flush = () => {
    if (!queue.length) return;
    const body = JSON.stringify(queue);
    queue = [];
    fetch(cfg.url + '/rest/v1/events', {
      method: 'POST', keepalive: true,
      headers: {
        'Content-Type': 'application/json', apikey: cfg.anonKey, Prefer: 'return=minimal'
      },
      body
    }).catch(() => {});
  };

  // Section dwell: time a section is >=40% in view, reported when it leaves view or the tab hides.
  const labelOf = (s) => s.id || (s.className || 'section').split(/\s+/)[0];
  const sections = [...document.querySelectorAll('main > section')];
  const inView = new Set();
  const since = new Map();
  const startDwell = (el) => { if (!since.has(el)) since.set(el, performance.now()); };
  const endDwell = (el) => {
    const t0 = since.get(el);
    if (t0 == null) return;
    since.delete(el);
    const secs = (performance.now() - t0) / 1000;
    if (secs >= 0.5) queue.push(row('section_view', labelOf(el), secs));
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { inView.add(e.target); if (document.visibilityState === 'visible') startDwell(e.target); }
        else { inView.delete(e.target); endDwell(e.target); }
      });
    }, { threshold: 0.4 });
    sections.forEach((s) => io.observe(s));
  }

  // Scroll depth milestones.
  const hit = new Set();
  window.addEventListener('scroll', () => {
    const pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    [25, 50, 75, 100].forEach((m) => {
      if (pct >= m - 1 && !hit.has(m)) { hit.add(m); queue.push(row('scroll_depth', m + '%', m)); }
    });
  }, { passive: true });

  // Link clicks: label, destination, and the section they happened in.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.getAttribute('href').startsWith('#') && !a.hasAttribute('data-track'))) return; // ignore in-page nav unless marked data-track
    const sec = a.closest('main > section');
    const file = a.closest('.file');
    const where = file ? file.id.replace('file-', '') : sec ? labelOf(sec) : '';
    const label = (a.hasAttribute('data-track') ? 'jump · ' : '') + (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const href = a.protocol === 'mailto:' ? 'mailto' : a.href;
    queue.push(row('click', (where ? where + ' · ' : '') + label, null, href));
    flush();
  }, true);

  // Time spent inside each file popup (script.js dispatches 'jl-file').
  let openFile = null;
  const endFile = () => {
    if (!openFile) return;
    const secs = (performance.now() - openFile.t) / 1000;
    if (secs >= 0.5) queue.push(row('section_view', 'file · ' + openFile.name, secs));
    openFile = null;
  };
  window.addEventListener('jl-file', (e) => {
    endFile();
    if (e.detail.open) openFile = { name: e.detail.name, t: performance.now() };
  });

  // Visible time on page; flush whenever the tab is hidden or closed.
  let visibleMs = 0, shownAt = performance.now();
  const onHide = () => {
    visibleMs += performance.now() - shownAt;
    inView.forEach(endDwell);
    const reopen = openFile && openFile.name;
    endFile();
    if (reopen) openFile = { name: reopen, t: performance.now() };
    queue.push(row('session_end', null, visibleMs / 1000));
    flush();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
    else { shownAt = performance.now(); inView.forEach(startDwell); if (openFile) openFile.t = performance.now(); }
  });
  window.addEventListener('pagehide', () => { if (document.visibilityState === 'visible') onHide(); });
  setInterval(flush, 15000);
})();
