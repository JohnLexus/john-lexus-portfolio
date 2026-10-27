// Preloader: two panels glitch-jitter then wipe open on load, revealing the
// page. Hero content (kicker, CTAs, paragraph) fades up right after, and the
// headline runs its own typewriter animation (see below).
(() => {
  const preloader = document.querySelector('.preloader');
  const heroReveal = document.querySelectorAll('.hero-reveal');
  if (!preloader) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    document.body.classList.remove('loading');
    preloader.classList.add('done');
    heroReveal.forEach(el => el.classList.add('in-view'));
    typeHeroTitle();
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.body.classList.remove('loading');
      preloader.classList.add('done');
      heroReveal.forEach((el, i) => {
        setTimeout(() => el.classList.add('in-view'), i * 120);
      });
      setTimeout(typeHeroTitle, 200);
    }, 1250);
  });
})();

// Hero headline: splits into one <span class="char"> per letter (keeping
// <em> and <br> intact) and reveals them in sequence with a brief lime
// glitch-flash before each character settles to its final color. Characters
// are grouped per word in a nowrap wrapper so a line only ever breaks
// between words, never mid-letter.
function typeHeroTitle() {
  const h1 = document.getElementById('heroTitle');
  if (!h1 || h1.dataset.typed) return;
  h1.dataset.typed = 'true';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    h1.classList.add('is-typed');
    return;
  }

  const makeChar = (ch) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch;
    return span;
  };

  const walk = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(piece => {
          if (piece === '') return;
          if (/^\s+$/.test(piece)) {
            frag.appendChild(document.createTextNode(piece));
          } else {
            const word = document.createElement('span');
            word.className = 'char-word';
            [...piece].forEach(ch => word.appendChild(makeChar(ch)));
            frag.appendChild(word);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(h1);

  const chars = h1.querySelectorAll('.char');
  const stagger = 26; // ms between characters
  chars.forEach((span, i) => { span.style.transitionDelay = (i * stagger) + 'ms'; });

  h1.classList.add('is-typing');
  setTimeout(() => h1.classList.add('is-typed'), 20);

  const totalMs = chars.length * stagger + 420;
  setTimeout(() => h1.classList.remove('is-typing'), totalMs);
}

// Reels carousel: auto-scrolls slowly via native scrollLeft, can also be
// dragged/scrubbed directly or skipped with the prev/next buttons.
(() => {
  const track = document.getElementById('reelsTrack');
  const carousel = document.querySelector('.reels-carousel');
  if (!track || !carousel) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const halfWidth = () => track.scrollWidth / 2;
  const wrap = () => {
    if (track.scrollLeft >= halfWidth()) track.scrollLeft -= halfWidth();
    else if (track.scrollLeft <= 0) track.scrollLeft += halfWidth();
  };

  // Eased velocity instead of a hard on/off switch, so hovering, dragging or
  // resuming glides to a stop/start rather than snapping.
  const CRUISE_SPEED = 1.1;
  let velocity = 0;
  let targetVelocity = CRUISE_SPEED;
  let resumeTimer = null;
  const pauseAuto = () => { targetVelocity = 0; clearTimeout(resumeTimer); };
  const scheduleResume = (delay = 1200) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { targetVelocity = CRUISE_SPEED; }, delay);
  };

  if (!reduceMotion) {
    setInterval(() => {
      velocity += (targetVelocity - velocity) * 0.08;
      if (Math.abs(velocity) > 0.01) {
        track.scrollLeft += velocity;
        wrap();
      }
    }, 16);
  }

  carousel.addEventListener('mouseenter', pauseAuto);
  carousel.addEventListener('mouseleave', () => scheduleResume(400));
  carousel.addEventListener('focusin', pauseAuto);
  carousel.addEventListener('focusout', () => scheduleResume(400));

  carousel.querySelectorAll('.reels-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      pauseAuto();
      const dir = btn.classList.contains('prev') ? -1 : 1;
      track.scrollLeft += dir * (track.clientWidth * 0.6);
      wrap();
      scheduleResume(2200);
    });
  });

  let isDown = false, dragged = false, startX = 0, startScroll = 0;
  track.addEventListener('mousedown', (e) => {
    isDown = true; dragged = false;
    startX = e.pageX;
    startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    pauseAuto();
  });
  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 4) dragged = true;
    track.scrollLeft = startScroll - dx;
    wrap();
  });
  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('is-dragging');
    scheduleResume(1000);
  });
  track.addEventListener('click', (e) => {
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
  }, true);

  // Touch devices never fire mouseenter/mouseleave, so without this the
  // carousel would auto-scroll under a finger drag and then never resume
  // once the user lets go. Pause on touch, resume shortly after release.
  track.addEventListener('touchstart', pauseAuto, { passive: true });
  track.addEventListener('touchend', () => scheduleResume(600), { passive: true });
  track.addEventListener('touchcancel', () => scheduleResume(600), { passive: true });
})();

// Mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuBtn.classList.toggle('open');
  });
}

// Scroll-reveal for sections/cards
const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
revealItems.forEach(el => observer.observe(el));

// Safety net in case the observer never fires
setTimeout(() => revealItems.forEach(el => el.classList.add('in-view')), 2000);

// Portrait flip: click (or Enter/Space) turns the photo to its back, which
// shows the full name and title. Click again to flip back.
(() => {
  const card = document.getElementById('heroFlip');
  if (!card) return;
  const toggle = () => {
    const on = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', String(on));
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
})();
