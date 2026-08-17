document.documentElement.classList.add('js');

// Shorts carousel — nav arrows scroll the track by roughly one "page" of cards.
const shortsTrack = document.querySelector('.shorts-track');
if (shortsTrack) {
  document.querySelectorAll('.carousel-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.classList.contains('prev') ? -1 : 1;
      shortsTrack.scrollBy({ left: dir * (shortsTrack.clientWidth * 0.8), behavior: 'smooth' });
    });
  });
}

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

// Hero headline cycler — swaps the big role statement every few seconds,
// pausing on the last ("I BUILD SYSTEMS.") slightly longer since it's the
// core positioning line.
const cycleSpans = document.querySelectorAll('.hero-cycle .cycle-track span');
if (cycleSpans.length > 1) {
  let cycleIndex = 0;
  setInterval(() => {
    cycleSpans[cycleIndex].classList.remove('active');
    cycleIndex = (cycleIndex + 1) % cycleSpans.length;
    cycleSpans[cycleIndex].classList.add('active');
  }, 2600);
}

const revealItems = document.querySelectorAll('.section, .stat, .project-card, .capability, .timeline-item, .quotes blockquote, .edu-grid > div, .system-step');
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
