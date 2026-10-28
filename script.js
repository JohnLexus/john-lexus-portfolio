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

// ---------- ID card: drops in with gravity, swings on its lanyard, flips on click ----------
// A small physics loop: the card falls, bounces once or twice when the strap catches it, and the
// impact sets it swinging like a pendulum. Drag it sideways to swing it yourself; click to flip it.
(() => {
  const swing = document.getElementById('idSwing');
  const tilt = document.getElementById('idTilt');
  const card = document.getElementById('idCard');
  if (!swing || !tilt || !card) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = 2600;          // gravity, px/s^2
  const K = 26;            // pendulum stiffness
  const C = 1.9;           // damping
  let y = reduce ? 0 : -(window.innerHeight * 0.95 + 200);
  let vy = 0, angle = 0, av = 0;
  let tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  let dragging = false, moved = false, startX = 0, startAngle = 0;
  let raf = 0, last = 0;

  const draw = () => {
    swing.style.transform = 'translateY(' + y.toFixed(1) + 'px) rotate(' + angle.toFixed(2) + 'deg)';
    tilt.style.transform = 'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg)';
  };

  const step = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    // Falling: gravity until the strap catches the card, then a damped bounce.
    if (y < 0 || vy < 0) {
      vy += G * dt;
      y += vy * dt;
      if (y >= 0) {
        y = 0;
        if (vy > 160) {
          av += Math.min(vy * 0.016, 34);   // the jolt starts the swing
          vy = -vy * 0.3;
        } else vy = 0;
      }
    }
    // Swinging: damped pendulum about the top of the strap (held still while dragging).
    if (!dragging) {
      av += (-K * angle - C * av) * dt;
      angle += av * dt;
    }
    // Soft 3D tilt toward the pointer.
    tiltX += (tiltTX - tiltX) * Math.min(1, dt * 9);
    tiltY += (tiltTY - tiltY) * Math.min(1, dt * 9);

    draw();
    const settled = y === 0 && vy === 0 && !dragging && Math.abs(angle) < 0.03 && Math.abs(av) < 0.05
      && Math.abs(tiltX - tiltTX) < 0.02 && Math.abs(tiltY - tiltTY) < 0.02;
    if (settled) { angle = av = 0; draw(); raf = 0; return; }
    raf = requestAnimationFrame(step);
  };
  const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

  draw();
  if (!reduce) run();

  const flip = () => card.setAttribute('aria-pressed', String(card.classList.toggle('flipped')));

  // Pointer: drag to swing, click (no drag) to flip, hover to tilt in 3D.
  card.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false; startX = e.clientX; startAngle = angle; av = 0;
    card.setPointerCapture(e.pointerId);
    run();
  });
  card.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      angle = Math.max(-38, Math.min(38, startAngle - dx * 0.2));
      return;
    }
    if (reduce) return;
    const r = card.getBoundingClientRect();
    tiltTY = ((e.clientX - r.left) / r.width - 0.5) * 18;
    tiltTX = -((e.clientY - r.top) / r.height - 0.5) * 12;
    run();
  });
  card.addEventListener('pointerup', (e) => {
    dragging = false;
    if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId);
    if (!moved) flip();
    run();
  });
  card.addEventListener('pointercancel', () => { dragging = false; run(); });
  card.addEventListener('pointerleave', () => { if (!dragging) { tiltTX = tiltTY = 0; run(); } });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
})();

// ---------- Viewfinder: running timecode, audio meters, autofocus lock, counting numbers ----------
(() => {
  const frame = document.querySelector('.vf-frame');
  if (!frame) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stats = [...frame.querySelectorAll('.vf-stat')];
  const tc = document.getElementById('vfTc');
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  // Counting numbers, like a recording counter.
  const count = (el, ms = 1500) => {
    const strong = el.querySelector('strong');
    const to = parseFloat(strong.dataset.to), dec = +strong.dataset.dec, suf = strong.dataset.suffix || '';
    const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v)) + suf;
    if (reduce) { strong.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      strong.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Autofocus: the brackets hunt, then lock lime.
  const focus = (el, delay = 0) => {
    clearTimeout(el._t);
    el.classList.remove('locked');
    el.classList.remove('hunting');
    void el.offsetWidth;
    el._t = setTimeout(() => {
      el.classList.add('hunting');
      count(el);
      el._t = setTimeout(() => el.classList.add('locked'), reduce ? 0 : 900);
    }, delay);
  };

  // Timecode + audio meters only run while the viewfinder is on screen.
  const vuL = document.getElementById('vfVuL'), vuR = document.getElementById('vfVuR');
  const SEG = 16;
  [vuL, vuR].forEach((c) => { for (let i = 0; i < SEG; i++) c.appendChild(document.createElement('i')); });
  let lvl = [0.5, 0.45], timers = [], t0 = 0;
  const paintVu = (bars, v) => {
    const on = Math.round(v * SEG);
    [...bars.children].forEach((s, i) => {
      s.className = i < on ? 'on' + (i > SEG * 0.85 ? ' hot' : i > SEG * 0.66 ? ' warm' : '') : '';
    });
  };
  const run = () => {
    if (timers.length || reduce) return;
    t0 = performance.now();
    timers.push(setInterval(() => {
      const f = Math.floor((performance.now() - t0) / (1000 / 30));
      tc.textContent = pad(Math.floor(f / 108000) % 100) + ':' + pad(Math.floor(f / 1800) % 60) + ':' + pad(Math.floor(f / 30) % 60) + ':' + pad(f % 30);
    }, 33));
    timers.push(setInterval(() => {
      lvl = lvl.map((v) => Math.max(0.12, Math.min(0.98, v + (Math.random() - 0.5) * 0.42 + (0.5 - v) * 0.12)));
      paintVu(vuL, lvl[0]); paintVu(vuR, lvl[1]);
    }, 90));
  };
  const stop = () => { timers.forEach(clearInterval); timers = []; };
  if (reduce) { paintVu(vuL, 0.55); paintVu(vuR, 0.5); }

  let seen = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      run();
      if (!seen) { seen = true; stats.forEach((el, i) => focus(el, 250 + i * 260)); }
    } else stop();
  }, { threshold: 0.3 }).observe(frame);

  // Tap to focus: click or press Enter on a stat to re-run the autofocus.
  stats.forEach((el) => {
    el.addEventListener('click', () => focus(el));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(el); } });
  });
})();

// ---------- Viewfinder scroll effect (desktop) ----------
// Stretches from its contained width to full-bleed as it reaches the middle of the screen,
// then folds back on a hinge at its bottom edge as you scroll on past it.
(() => {
  const sec = document.querySelector('.vf');
  const frame = sec && sec.querySelector('.vf-frame');
  if (!frame || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const wide = window.matchMedia('(min-width: 1000px)');
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let queued = false;

  const update = () => {
    queued = false;
    if (!wide.matches) { frame.style.marginInline = frame.style.borderRadius = frame.style.transform = frame.style.opacity = ''; return; }
    const vw = window.innerWidth, vh = window.innerHeight, r = sec.getBoundingClientRect();
    const c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);   // -1 above, 0 centred, +1 below
    const open = 1 - smooth(0.12, 0.9, Math.abs(c));                         // 1 when centred
    const fold = smooth(0.12, 0.9, -c);                                      // 0 -> 1 as it leaves upward
    const inset = (vw - Math.min(vw, 1320)) / 2 + vw * 0.06;
    frame.style.marginInline = (inset * (1 - open)).toFixed(1) + 'px';
    frame.style.borderRadius = (8 * (1 - open)).toFixed(1) + 'px';
    frame.style.transform = 'rotateX(' + (fold * 62).toFixed(2) + 'deg)';
    frame.style.opacity = (1 - fold * 0.6).toFixed(3);
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();
