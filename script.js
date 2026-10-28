// ---------- Hero reveal: content rises in as soon as the page loads ----------
(() => {
  document.querySelectorAll('.rise').forEach((el, i) => {
    el.style.transitionDelay = (i * 110) + 'ms';
    el.classList.add('in');
  });
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

// ---------- Self-hosted videos (the ad, and each Results card) play on the page ----------
(() => {
  const players = [...document.querySelectorAll('.ad-player')];
  players.forEach((player) => {
    const video = player.querySelector('video');
    if (!video) return;
    const toggle = () => (video.paused ? video.play() : video.pause());
    player.addEventListener('click', (e) => {
      if (video.controls && e.target.closest('video')) return;   // native controls take over once playing
      toggle();
    });
    video.addEventListener('play', () => {
      players.forEach((o) => { const v = o.querySelector('video'); if (v && v !== video && !v.paused) v.pause(); });
      player.classList.add('is-playing');
      video.controls = true;
    });
    video.addEventListener('pause', () => { if (!video.ended) player.classList.remove('is-playing'); });
    video.addEventListener('ended', () => {
      player.classList.remove('is-playing');
      video.controls = false;
      video.currentTime = 0;
    });
  });
  // Opening a YouTube / TikTok video stops any self-hosted one.
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.reel, .case-media')) return;
    players.forEach((o) => { const v = o.querySelector('video'); if (v && !v.paused) v.pause(); });
  });
})();

// ---------- Process / Results drop-down sections ----------
(() => {
  const accs = [...document.querySelectorAll('.acc')];
  const set = (acc, open) => {
    acc.classList.toggle('open', open);
    acc.querySelector('.acc-toggle').setAttribute('aria-expanded', String(open));
    if (!open) acc.querySelectorAll('.ad-player video').forEach((v) => v.pause());
  };
  accs.forEach((acc) => {
    acc.querySelector('.acc-toggle').addEventListener('click', () => set(acc, !acc.classList.contains('open')));
    acc.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  });
  // Any link to a drop-down section (nav, "let's talk") opens it, then scrolls to it.
  const go = (id, smooth) => {
    const acc = document.getElementById(id);
    if (!acc || !acc.classList.contains('acc')) return false;
    set(acc, true);
    setTimeout(() => acc.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }), 60);
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && go(a.getAttribute('href').slice(1), true)) e.preventDefault();
  });
  if (location.hash) go(location.hash.slice(1), false);
})();

// ---------- Header: hidden over the hero, returns once you scroll past it ----------
(() => {
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;
  nav.classList.add('nav--hidden');
  if (!('IntersectionObserver' in window)) { nav.classList.remove('nav--hidden'); return; }
  new IntersectionObserver(([e]) => {
    nav.classList.toggle('nav--hidden', e.isIntersecting || e.boundingClientRect.top > 0);
  }, { threshold: 0 }).observe(hero);
})();
