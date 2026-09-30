/* ==========================================================
   VOID — animations.js
   Robot tracking, breathing, particles, intro, scroll reveals.
   Loads AFTER main.js (uses $, $$, RM from there).
   ========================================================== */

/* ==========================================================
   ROBOT — pointer / touch tracking, idle drift, breathing
   ========================================================== */
const head = $('#head');
const eyes = $('#eyes');

gsap.set(head, { svgOrigin: '200 300' });
gsap.set('#all', { svgOrigin: '200 480' });

const headRot    = gsap.quickTo(head, 'rotation', { duration: 0.8,  ease: 'power3.out' });
const headX      = gsap.quickTo(head, 'x',        { duration: 0.8,  ease: 'power3.out' });
const headY      = gsap.quickTo(head, 'y',        { duration: 0.8,  ease: 'power3.out' });
const headScaleX = gsap.quickTo(head, 'scaleX',   { duration: 0.8,  ease: 'power3.out' });
const eyesX      = gsap.quickTo(eyes, 'x',        { duration: 0.45, ease: 'power3.out' });
const eyesY      = gsap.quickTo(eyes, 'y',        { duration: 0.45, ease: 'power3.out' });

let lastInput = -1e4;

/* nx / ny are in the range -1 … 1 (left/up = negative) */
function look(nx, ny) {
  nx = Math.max(-1, Math.min(1, nx));
  ny = Math.max(-1, Math.min(1, ny));
  headRot(nx * 7);
  headX(nx * 14);
  headY(ny * 8);
  headScaleX(1 - Math.abs(nx) * 0.035);
  eyesX(nx * 12);
  eyesY(ny * 7);
}

function onPoint(x, y) {
  lastInput = performance.now();
  look((x / innerWidth - 0.5) * 2, (y / innerHeight - 0.5) * 2);
}

addEventListener('pointermove', (e) => onPoint(e.clientX, e.clientY), { passive: true });
addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); }, { passive: true });
addEventListener('touchmove',  (e) => { const t = e.touches[0]; if (t) onPoint(t.clientX, t.clientY); }, { passive: true });

if (!RM) {
  /* gentle idle drift when there has been no input for a while */
  gsap.ticker.add((time) => {
    if (performance.now() - lastInput > 2600) {
      look(Math.sin(time * 0.5) * 0.55, Math.cos(time * 0.35) * 0.22);
    }
  });

  /* breathing */
  gsap.to('#all', { scale: 1.014, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('#chest', { opacity: 0.45, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  /* random blinking */
  (function blink() {
    gsap.delayedCall(2.5 + Math.random() * 4, () => {
      gsap.fromTo('#eyes circle',
        { scaleY: 1 },
        { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, yoyo: true, repeat: 1 });
      blink();
    });
  })();
}

/* ==========================================================
   PARTICLES — light canvas dust, paused when hero is off-screen
   ========================================================== */
const canvas = $('#fx');
const ctx = canvas.getContext('2d');
let cw = 0;
let ch = 0;
let dpr = 1;
let heroVisible = true;
let lastWidth = innerWidth;

function sizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  cw = canvas.width = innerWidth * dpr;
  ch = canvas.height = $('.hero').offsetHeight * dpr;
}

sizeCanvas();
addEventListener('resize', () => {
  if (innerWidth !== lastWidth) {
    lastWidth = innerWidth;
    sizeCanvas();
  }
});

const particles = Array.from({ length: innerWidth < 700 ? 34 : 70 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.3 + 0.3,
  v: Math.random() * 0.0012 + 0.0003,
  a: Math.random() * 0.5 + 0.2,
  p: Math.random() * 6
}));

if (!RM) {
  requestAnimationFrame(function draw(t) {
    if (heroVisible) {
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#ffffff';
      for (const p of particles) {
        p.y -= p.v * 0.16;
        if (p.y < 0) p.y = 1;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(t / 1400 + p.p));
        ctx.beginPath();
        ctx.arc((p.x + Math.sin(t / 4000 + p.p) * 0.012) * cw, p.y * ch, p.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  });
}

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom top',
  onToggle: (self) => { heroVisible = self.isActive; }
});

/* ==========================================================
   INTRO — one orchestrated cinematic moment
   ========================================================== */
if (!RM) {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('#robot', { opacity: 0, filter: 'blur(26px)', scale: 1.1, duration: 2 })
    .from('#eyes', { opacity: 0, duration: 0.1, repeat: 5, yoyo: true }, '-=0.7')
    .from('.ch', { opacity: 0, y: 50, filter: 'blur(14px)', stagger: 0.09, duration: 1.1 }, '-=0.5')
    .from('.sub, .tiny', { opacity: 0, y: 14, filter: 'blur(8px)', stagger: 0.12, duration: 0.9 }, '-=0.6')
    .from('.cta', { opacity: 0, y: 20, scale: 0.9, duration: 0.9 }, '-=0.6');

  /* hero parallax: content drifts up and fades as you scroll away */
  gsap.to('#wrap', {
    yPercent: -10,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ==========================================================
   GLASS BUTTON — moving reflection + press animation
   ========================================================== */
const cta = $('#cta');

cta.addEventListener('pointermove', (e) => {
  const r = cta.getBoundingClientRect();
  cta.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
  cta.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
});

cta.addEventListener('pointerdown', () => gsap.to(cta, { scale: 0.95, duration: 0.15, ease: 'power2.out' }));
['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) =>
  cta.addEventListener(evt, () => gsap.to(cta, { scale: 1, duration: 0.6, ease: 'elastic.out(1,.5)', overwrite: 'auto' }))
);

/* ==========================================================
   FEED — scroll reveals + active nav dot
   ========================================================== */
const navButtons = $$('#dots button');

$$('.hero, .game').forEach((section, i) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => {
      if (self.isActive) navButtons.forEach((b, j) => b.classList.toggle('on', j === i));
    }
  });
});

if (!RM) {
  $$('.inner').forEach((inner) => {
    const section = inner.parentElement;

    /* whole post: blur + scale + fade in */
    gsap.fromTo(inner,
      { opacity: 0, scale: 0.92, y: 48, filter: 'blur(14px)' },
      {
        opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
        duration: 1, ease: 'power3.out', clearProps: 'filter',
        scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' }
      });

    /* inner pieces: staggered reveal */
    gsap.from($$('.meta, h2, .desc, .stage, .foot', inner), {
      opacity: 0, y: 18, stagger: 0.08, duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 65%', toggleActions: 'play none none reverse' }
    });
  });
}
