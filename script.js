// ---------- Curtain: opens as soon as the page has loaded ----------
(() => {
  const curtain = document.getElementById('curtain');
  const reveal = () => {
    document.querySelectorAll('.rise').forEach((el, i) => {
      el.style.transitionDelay = (i * 110) + 'ms';
      el.classList.add('in');
    });
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!curtain || reduce) { if (curtain) curtain.remove(); reveal(); return; }

  document.body.classList.add('curtain-on');
  // The seam runs corner to corner, so the word is rotated to follow it and sized to the diagonal.
  const fit = () => {
    const w = window.innerWidth, h = window.innerHeight;
    curtain.style.setProperty('--ang', (-Math.atan2(h, w) * 180 / Math.PI).toFixed(2) + 'deg');
    curtain.style.setProperty('--fs', Math.min(Math.hypot(w, h) * 0.17, 240).toFixed(0) + 'px');
  };
  fit();
  window.addEventListener('resize', fit);
  const MIN_VISIBLE = 1100;        // let "Welcome" be readable even on a fast load
  const OPEN_MS = 1800;            // matches the CSS transition
  const t0 = performance.now();
  let opened = false;

  const open = () => {
    if (opened) return;
    opened = true;
    const wait = Math.max(0, MIN_VISIBLE - (performance.now() - t0));
    setTimeout(() => {
      curtain.classList.add('open');
      setTimeout(reveal, OPEN_MS * 0.45);        // content rises while the curtain is still parting
      setTimeout(() => {
        curtain.classList.add('done');
        document.body.classList.remove('curtain-on');
      }, OPEN_MS + 100);
    }, wait);
  };

  if (document.readyState === 'complete') open();
  else window.addEventListener('load', open);
  setTimeout(open, 6000);          // never leave a visitor stuck behind the curtain
})();

// ---------- Scroll reveal ----------
(() => {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
  setTimeout(() => items.forEach((el) => el.classList.add('in')), 8000);
})();

// ---------- Portrait flip ----------
(() => {
  const card = document.getElementById('portrait');
  if (!card) return;
  const toggle = () => card.setAttribute('aria-pressed', String(card.classList.toggle('flipped')));
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
})();

// ---------- Videos play on the page ----------
// Case-study thumbnails play in place; reels open a vertical player popup.
(() => {
  const src = (id) => 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';

  document.querySelectorAll('.case-media[data-yt]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const f = document.createElement('iframe');
      f.className = 'yt-frame';
      f.src = src(a.dataset.yt);
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = a.getAttribute('aria-label') || 'Video';
      a.replaceChildren(f);
    }, { once: true });
  });

  const box = document.createElement('div');
  box.className = 'vbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Video player');
  box.innerHTML = '<div class="vbox-inner"><button class="vbox-close" type="button" aria-label="Close video">Close &times;</button><div class="vbox-stage vertical"></div></div>';
  document.body.appendChild(box);
  const stage = box.querySelector('.vbox-stage');
  let from = null;
  const close = () => {
    if (box.hidden) return;
    box.hidden = true;
    stage.replaceChildren();               // removing the player stops playback
    if (from) from.focus({ preventScroll: true });
  };
  document.querySelectorAll('.reel[data-yt], .reel[data-tiktok], .chip[data-instagram]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      from = a;
      const f = document.createElement('iframe');
      f.src = a.dataset.tiktok ? 'https://www.tiktok.com/embed/v2/' + a.dataset.tiktok
        : a.dataset.instagram ? 'https://www.instagram.com/reel/' + a.dataset.instagram + '/embed'
        : src(a.dataset.yt);
      f.title = a.getAttribute('aria-label') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      stage.replaceChildren(f);
      box.hidden = false;
      box.querySelector('.vbox-close').focus({ preventScroll: true });
    });
  });
  box.querySelector('.vbox-close').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

// ---------- Featured ad: self-hosted video that plays on the page ----------
(() => {
  const player = document.getElementById('adPlayer');
  const video = document.getElementById('adVideo');
  if (!player || !video) return;
  const toggle = () => (video.paused ? video.play() : video.pause());
  player.addEventListener('click', (e) => {
    if (e.target.closest('video') && video.controls) return;   // native controls handle it once playing
    toggle();
  });
  video.addEventListener('play', () => {
    player.classList.add('is-playing');
    video.controls = true;                  // scrub / sound once it has started
  });
  video.addEventListener('pause', () => { if (!video.ended) player.classList.remove('is-playing'); });
  video.addEventListener('ended', () => {
    player.classList.remove('is-playing');
    video.controls = false;
    video.currentTime = 0;
  });
  // Starting any other video on the page stops the ad.
  document.addEventListener('click', (e) => {
    if (!video.paused && e.target.closest('.reel, .case-media, .chip')) video.pause();
  });
})();
