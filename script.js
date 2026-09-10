document.documentElement.classList.add('js');

// Preloader: wipe-reveal on every page load, wipe-cover before internal
// navigation — so clicking Videos/Graphics/AI Workflows/About (or any
// same-origin link) feels like one continuous transition rather than a
// hard page cut, matching Bazil's own load-in/transition mechanism.
(() => {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    document.body.classList.remove('loading');
    preloader.classList.add('done');
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.body.classList.remove('loading');
      preloader.classList.add('done');
    }, 1150);
  });

  const isInternalPageLink = (a) => {
    if (!a || !a.href) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    let url;
    try { url = new URL(a.href, location.href); } catch { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname) return false; // same-page anchor, let smooth-scroll handle it
    return true;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!isInternalPageLink(a)) return;
    e.preventDefault();
    preloader.classList.remove('done');
    preloader.classList.add('exiting');
    document.body.classList.add('loading');
    setTimeout(() => { window.location.href = a.href; }, 480);
  });
})();

// Hero photo follows the cursor slightly: the photo's base layout position
// never moves (its centering transform on .hero-photo-center is untouched),
// but the inner crop layer drifts a few px toward the cursor — no tilt, no
// scale change, just a small "follow" nudge from its resting place, eased
// toward the target each frame.
(() => {
  const wrap = document.querySelector('.hero-photo-center');
  const crop = document.querySelector('.photo-crop');
  const heroSection = document.querySelector('.hero');
  if (!wrap || !crop || !heroSection) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return; // skip on touch

  let targetTX = 0, targetTY = 0;
  let curTX = 0, curTY = 0;
  let rafId = null;

  const tick = () => {
    curTX += (targetTX - curTX) * 0.12;
    curTY += (targetTY - curTY) * 0.12;
    crop.style.transform = `translate(${curTX.toFixed(2)}px, ${curTY.toFixed(2)}px)`;
    const settled = Math.abs(targetTX - curTX) < 0.05 && Math.abs(targetTY - curTY) < 0.05;
    rafId = settled ? null : requestAnimationFrame(tick);
  };

  const kick = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

  heroSection.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * 1.6)));
    const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * 1.6)));
    targetTX = dx * 14;    // small drift toward the cursor — a "follow", not a real move
    targetTY = dy * 14;
    kick();
  });

  heroSection.addEventListener('mouseleave', () => {
    targetTX = 0; targetTY = 0;
    kick();
  });
})();

// Shorts: hover (or focus) a card to load a muted, looping preview inline;
// click (or Enter/Space) opens a lightbox with sound so the full clip plays
// without leaving the page.
(() => {
  const shortCards = document.querySelectorAll('.short-card[data-video-id]');
  if (!shortCards.length) return;

  const lightbox = document.getElementById('videoLightbox');
  const lightboxFrame = document.getElementById('videoLightboxFrame');

  const previewSrc = (id) =>
    `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0`;
  const watchSrc = (id) =>
    `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;

  shortCards.forEach(card => {
    const id = card.dataset.videoId;
    const thumb = card.querySelector('.short-thumb');
    let preview = null;
    let hoverTimer = null;

    const startPreview = () => {
      hoverTimer = setTimeout(() => {
        if (preview || !thumb) return;
        preview = document.createElement('iframe');
        preview.src = previewSrc(id);
        preview.allow = 'autoplay; encrypted-media';
        preview.title = 'Preview';
        thumb.appendChild(preview);
      }, 220); // short delay so a quick mouse pass-by doesn't spawn an iframe
    };
    const stopPreview = () => {
      clearTimeout(hoverTimer);
      if (preview) { preview.remove(); preview = null; }
    };

    card.addEventListener('mouseenter', startPreview);
    card.addEventListener('mouseleave', stopPreview);
    card.addEventListener('focus', startPreview);
    card.addEventListener('blur', stopPreview);

    const openLightbox = () => {
      if (!lightbox || !lightboxFrame) return;
      stopPreview();
      lightboxFrame.innerHTML = '';
      const player = document.createElement('iframe');
      player.src = watchSrc(id);
      player.allow = 'autoplay; encrypted-media; fullscreen';
      player.allowFullscreen = true;
      player.title = 'Video player';
      lightboxFrame.appendChild(player);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    };

    card.addEventListener('click', openLightbox);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); }
    });
  });

  const closeLightbox = () => {
    if (!lightbox || !lightboxFrame) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxFrame.innerHTML = ''; // clearing the src stops playback
    document.body.classList.remove('lightbox-open');
  };

  lightbox?.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeLightbox));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox?.classList.contains('is-open')) closeLightbox();
  });
})();

const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav nav');

if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
    menuBtn.classList.toggle('open');
  });
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nav?.classList.remove('open');
  });
});

const ring = document.querySelector('.cursor-ring');
const dot = document.querySelector('.cursor-dot');

window.addEventListener('mousemove', e => {
  if (!ring || !dot) return;
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
  ring.style.left = `${e.clientX}px`;
  ring.style.top = `${e.clientY}px`;
});

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    if (!ring) return;
    ring.style.width = '44px';
    ring.style.height = '44px';
    ring.style.borderColor = '#ffc900';
    ring.style.background = 'rgba(255,201,0,.15)';
  });
  el.addEventListener('mouseleave', () => {
    if (!ring) return;
    ring.style.width = '28px';
    ring.style.height = '28px';
    ring.style.borderColor = 'rgba(17,17,17,.4)';
    ring.style.background = 'transparent';
  });
});

const revealItems = document.querySelectorAll('.section, .stat, .project-card, .capability, .timeline-item, .quotes blockquote, .featured-quote, .edu-grid > div, .system-step, .teaser-card');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach(el => observer.observe(el));

// Safety net: if a browser never fires the observer for some reason (older
// browser, reduced-motion setup, etc.), don't leave content permanently
// invisible — reveal everything after a short delay regardless.
setTimeout(() => revealItems.forEach(el => el.classList.add('in-view')), 2500);

// Replace this text if you add your own analytics.
console.log('John Lexus Portfolio V3 loaded.');
