/* ==========================================================
   VOID — main.js
   Functionality: utilities, game registry, feed, games, CTA, nav.
   Loads BEFORE animations.js (which animates what this builds).
   ========================================================== */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---------- utilities (shared with animations.js) ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }
};

const goTo = (target) => {
  const element = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!element) return;

  const y = element.getBoundingClientRect().top + window.scrollY;

  gsap.to(window, {
    duration: RM ? 0 : 1.8,
    scrollTo: {
      y: y,
      autoKill: false
    },
    ease: 'power3.inOut',
    overwrite: true
  });
};
};
/* ==========================================================
   GAME REGISTRY
   To add a game: push one entry here and write a mount function.
   Future hooks (accounts, leaderboards, achievements, daily
   challenges) can attach to this registry without touching
   the rendering code below.
   ========================================================== */
const GAMES = [
  { id: 'reaction',   title: 'Reaction Test',    desc: 'Wait for blue, then tap as fast as you can.',           mount: mountReaction },
  { id: 'memory',     title: 'Memory Challenge', desc: 'Watch the pattern. Repeat it. It grows every round.',   mount: mountMemory },
  { id: 'impossible', title: 'Impossible Button', desc: 'Press the button. It would rather you didn’t.',        mount: mountImpossible },
  { id: 'soon1',      title: 'Coming soon',      desc: 'A new challenge is being built.' },
  { id: 'soon2',      title: 'Coming soon',      desc: 'Another one is on the way.' }
];

/* ---------- render the feed ---------- */
const feed = $('#feed');

GAMES.forEach((game, i) => {
  const section = document.createElement('section');
  section.className = 'game' + (game.mount ? '' : ' soon');
  section.id = 'g-' + game.id;
  section.innerHTML = `
    <div class="inner">
      <div class="meta">
        <i class="av"></i>
        <span>void / ${game.id.replace(/\d/g, '')}</span>
        <span class="idx">${i + 1} / ${GAMES.length}</span>
      </div>
      <h2>${game.title}</h2>
      <p class="desc">${game.desc}</p>
      <div class="stage">${game.mount ? '' : '<i class="ring"></i>'}</div>
      ${game.mount ? '<div class="foot"></div>' : ''}
    </div>`;
  feed.appendChild(section);

  if (game.mount) game.mount($('.stage', section), $('.foot', section));
});

/* ---------- hero button: scroll to the feed ---------- */
$('#cta').addEventListener('click', () => goTo('#g-' + GAMES[0].id));

/* ---------- section dots (navigation) ---------- */
const dotsNav = $('#dots');
const sections = [$('#top'), ...$$('.game')];

sections.forEach((section, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', i ? 'Go to ' + GAMES[i - 1].title : 'Go to top');
  button.innerHTML = '<i></i>';
  button.addEventListener('click', () => goTo(section));
  dotsNav.appendChild(button);
});

/* ==========================================================
   GAME 1 — REACTION TEST
   ========================================================== */
function mountReaction(stage, foot) {
  stage.innerHTML = '<button class="rx" type="button"><span>Start<small>Tap the circle</small></span></button>';
  foot.innerHTML = '<span>Last<b id="rx-last">—</b></span><span>Best<b id="rx-best">—</b></span>';

  const pad = $('.rx', stage);
  const label = $('span', pad);
  const lastEl = $('#rx-last', foot);
  const bestEl = $('#rx-best', foot);

  let state = 'idle';
  let startTime = 0;
  let timer = null;
  let best = Number(store.get('void.rx')) || 0;
  if (best) bestEl.textContent = best + ' ms';

  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();

    if (state === 'idle') {
      state = 'wait';
      pad.className = 'rx wait';
      label.innerHTML = 'Wait…';
      timer = setTimeout(() => {
        state = 'go';
        pad.className = 'rx go';
        label.textContent = 'Tap!';
        startTime = performance.now();
      }, 1300 + Math.random() * 2800);

    } else if (state === 'wait') {
      clearTimeout(timer);
      state = 'idle';
      pad.className = 'rx';
      label.innerHTML = 'Too early<small>Tap to try again</small>';
      gsap.fromTo(pad, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,.3)' });

    } else {
      const ms = Math.round(performance.now() - startTime);
      state = 'idle';
      pad.className = 'rx';
      label.innerHTML = ms + ' ms<small>Tap to try again</small>';
      lastEl.textContent = ms + ' ms';
      if (!best || ms < best) {
        best = ms;
        store.set('void.rx', ms);
        bestEl.textContent = ms + ' ms';
      }
      gsap.fromTo(pad, { scale: 0.94 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.4)' });
    }
  });
}

/* ==========================================================
   GAME 2 — MEMORY CHALLENGE
   ========================================================== */
function mountMemory(stage, foot) {
  stage.innerHTML =
    '<div class="mem">' +
    [0, 1, 2, 3].map((i) => `<button class="tile" type="button" aria-label="Tile ${i + 1}"></button>`).join('') +
    '</div><button class="glass pill" type="button">Start</button>';
  foot.innerHTML = '<span>Round<b id="mem-round">0</b></span><span>Best<b id="mem-best">0</b></span>';

  const tiles = $$('.tile', stage);
  const startBtn = $('.pill', stage);
  const board = $('.mem', stage);
  const roundEl = $('#mem-round', foot);
  const bestEl = $('#mem-best', foot);

  let seq = [];
  let pos = 0;
  let busy = true;
  let best = Number(store.get('void.mem')) || 0;
  bestEl.textContent = best;

  const flash = (i) => {
    tiles[i].classList.add('on');
    setTimeout(() => tiles[i].classList.remove('on'), 340);
  };

  async function nextRound() {
    seq.push(Math.floor(Math.random() * 4));
    roundEl.textContent = seq.length;
    busy = true;
    pos = 0;
    for (const i of seq) {
      await wait(560);
      flash(i);
    }
    await wait(300);
    busy = false;
  }

  startBtn.addEventListener('click', () => {
    seq = [];
    startBtn.textContent = 'Restart';
    nextRound();
  });

  tiles.forEach((tile, i) => {
    tile.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (busy) return;
      flash(i);

      if (i === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          busy = true;
          const round = seq.length;
          if (round > best) {
            best = round;
            store.set('void.mem', round);
            bestEl.textContent = round;
          }
          setTimeout(nextRound, 800);
        }
      } else {
        busy = true;
        seq = [];
        startBtn.textContent = 'Try again';
        roundEl.textContent = 0;
        gsap.fromTo(board, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,.3)' });
      }
    });
  });
}

/* ==========================================================
   GAME 3 — IMPOSSIBLE BUTTON
   ========================================================== */
function mountImpossible(stage, foot) {
  stage.innerHTML =
    '<div class="zone"><button class="imp" type="button">Press me</button></div>' +
    '<p class="msg" aria-live="polite">Go on. Try.</p>';
  foot.innerHTML = '<span>Dodges<b id="imp-count">0</b></span><span>Status<b id="imp-status">Impossible</b></span>';

  const zone = $('.zone', stage);
  const btn = $('.imp', stage);
  const msg = $('.msg', stage);
  const countEl = $('#imp-count', foot);
  const statusEl = $('#imp-status', foot);

  const MAX_DODGES = 10;
  const lines = ['Nope.', 'Too slow.', 'Not today.', 'Almost. Not really.', 'Nice try.', 'Still no.', 'Getting tired of this?'];
  let dodges = 0;
  let yielded = false;

  function dodge(e) {
    if (yielded) return;
    e.preventDefault();
    dodges++;
    countEl.textContent = dodges;

    if (dodges >= MAX_DODGES) {
      yielded = true;
      statusEl.textContent = 'Possible';
      btn.textContent = 'Fine. Press it.';
      msg.textContent = 'It gave up.';
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'power3.out' });
      return;
    }

    const maxX = (zone.clientWidth - btn.offsetWidth) / 2;
    const maxY = (zone.clientHeight - btn.offsetHeight) / 2;
    gsap.to(btn, {
      x: gsap.utils.random(-maxX, maxX),
      y: gsap.utils.random(-maxY, maxY),
      duration: 0.35,
      ease: 'power3.out'
    });
    msg.textContent = lines[dodges % lines.length];
  }

  btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(e); });
  btn.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') dodge(e); });
  btn.addEventListener('click', () => {
    if (!yielded) return;
    msg.textContent = 'You did it. It let you.';
    gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.4)' });
  });
}
