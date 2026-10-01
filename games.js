/* ==========================================================
   VOID — games.js   (games 4–23)
   Load order:  gsap → games.js → main.js → animations.js
   Only function declarations + vx* helpers live at top level, so
   nothing collides with main.js / animations.js globals. Helpers
   use $, $$, wait, store from main.js at call time only.
   ========================================================== */

/* ---------- shared helpers ---------- */
const vxRnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const vxPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const vxShuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const vxSec = (ms) => (ms / 1000).toFixed(1) + 's';

/* best score: returns a number, or null when nothing is stored */
const vxBest = (key) => {
  const raw = store.get('void.' + key);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
};

/* saves when better; returns true if it is a new best */
function vxSave(key, val, lower) {
  const cur = vxBest(key);
  if (cur === null || (lower ? val < cur : val > cur)) {
    store.set('void.' + key, val);
    return true;
  }
  return false;
}

/* foot stats: [[label, value], …] → array of <b> elements */
function vxFoot(foot, items) {
  foot.innerHTML = items.map((it) => `<span>${it[0]}<b>${it[1]}</b></span>`).join('');
  return $$('b', foot);
}

const vxShake = (el) => gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,.3)' });
const vxPop = (el) => gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1,.4)' });

/* fast pointer tap + keyboard fallback */
function vxTap(el, fn) {
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(e); });
  el.addEventListener('click', (e) => { if (e.detail === 0) fn(e); });
}

/* delegated tap on children matching sel */
function vxOn(root, sel, fn) {
  const go = (e) => {
    const el = e.target.closest(sel);
    if (el && !el.disabled) fn(el, e);
  };
  root.addEventListener('pointerdown', (e) => { e.preventDefault(); go(e); });
  root.addEventListener('click', (e) => { if (e.detail === 0) go(e); });
}

/* countdown: tick(msLeft) every 100 ms, end() at zero */
function vxClock(ms, tick, end) {
  const c = {
    on: false,
    t: 0,
    endAt: 0,
    start() {
      c.on = true;
      c.endAt = performance.now() + ms;
      clearInterval(c.t);
      c.t = setInterval(() => {
        const left = Math.max(0, c.endAt - performance.now());
        tick(left);
        if (left <= 0) { c.stop(); end(); }
      }, 100);
      tick(ms);
    },
    stop() { c.on = false; clearInterval(c.t); },
    add(d) { c.endAt += d; }
  };
  return c;
}

/* dim placeholder grid shown before a run */
function vxIdleGrid(grid, n) {
  grid.style.setProperty('--n', n);
  grid.innerHTML = '<button class="vx-cell off" type="button" disabled></button>'.repeat(n * n);
}

/* shortest distance from point to segment */
function vxSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* ---------- number-sequence generator (Sequence Logic + Final Test) ---------- */
const vxSeq6 = (f) => Array.from({ length: 6 }, (_, i) => f(i));

const vxSeqGens = [
  [ /* tier 0 */
    () => { const a = vxRnd(1, 20), d = vxRnd(2, 9); return [vxSeq6((i) => a + d * i), 'Add ' + d + ' each time.']; },
    () => { const a = vxRnd(40, 90), d = vxRnd(2, 8); return [vxSeq6((i) => a - d * i), 'Subtract ' + d + ' each time.']; }
  ],
  [ /* tier 1 */
    () => { const a = vxRnd(1, 4), k = vxRnd(2, 3); return [vxSeq6((i) => a * Math.pow(k, i)), 'Multiply by ' + k + ' each time.']; },
    () => { const k = vxRnd(1, 4); return [vxSeq6((i) => (i + k) * (i + k)), 'Square numbers.']; },
    () => {
      const a = vxRnd(1, 9), d = vxRnd(1, 3), e = vxRnd(1, 3);
      return [vxSeq6((i) => a + d * i + (e * i * (i - 1)) / 2), 'The step grows by ' + e + ' each time.'];
    }
  ],
  [ /* tier 2 */
    () => {
      const s = [vxRnd(1, 4), vxRnd(2, 6)];
      while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]);
      return [s, 'Each number is the sum of the previous two.'];
    },
    () => {
      const c = vxRnd(1, 5);
      const s = [vxRnd(1, 5)];
      for (let i = 0; i < 5; i++) s.push(i % 2 === 0 ? s[i] * 2 : s[i] + c);
      return [s, 'Alternately ×2 and +' + c + '.'];
    },
    () => {
      const a = vxRnd(1, 9), b = vxRnd(20, 40), d1 = vxRnd(2, 5), d2 = vxRnd(2, 5);
      return [vxSeq6((i) => (i % 2 === 0 ? a + d1 * (i / 2) : b - d2 * ((i - 1) / 2))), 'Two interleaved sequences.'];
    },
    () => [vxSeq6((i) => (i + 1) * (i + 1) * (i + 1)), 'Cube numbers.']
  ]
];

function vxSeqQuestion(tier) {
  const pool = vxSeqGens[Math.random() < 0.7 ? tier : vxRnd(0, tier)];
  const made = vxPick(pool)();
  const s = made[0];
  const answer = s[5];
  const lastDiff = s[4] - s[3];
  const opts = new Set([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 80) {
    const span = Math.max(3, Math.round(Math.abs(answer) * 0.15) + 2);
    const c = guard % 4 === 0 ? s[4] + lastDiff : answer + vxPick([-1, 1]) * vxRnd(1, span);
    if (c !== answer && c >= 0) opts.add(c);
  }
  while (opts.size < 4) opts.add(answer + opts.size * 7 + 1);
  return { shown: s.slice(0, 5), answer, options: vxShuffle([...opts]), rule: made[1] };
}

/* ==========================================================
   GAME 4 — STROOP TEST
   ========================================================== */
function mountStroop(stage, foot) {
  const C = [['RED', '#ff3b30'], ['BLUE', '#0070f3'], ['GREEN', '#34c759'], ['YELLOW', '#ffd60a']];
  stage.innerHTML =
    '<div class="vx-box"><div class="vx-big">READY</div></div>' +
    '<div class="vx-opts">' + C.map((c, i) => `<button class="vx-opt" type="button" data-i="${i}">${c[0]}</button>`).join('') + '</div>' +
    '<p class="msg" aria-live="polite">Pick the color of the ink, not the word. 30 seconds.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [scoreEl, timeEl, bestEl] = vxFoot(foot, [['Score', 0], ['Time', '30.0s'], ['Best', vxBest('stroop') || 0]]);

  const box = $('.vx-box', stage);
  const word = $('.vx-big', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let cur = -1;
  let right = 0;
  let wrong = 0;

  const score = () => Math.max(0, right - wrong);
  const clock = vxClock(30000, (l) => { timeEl.textContent = vxSec(l); }, finish);

  function next() {
    const w = vxRnd(0, 3);
    let c = w;
    if (Math.random() < 0.75) while (c === w) c = vxRnd(0, 3);
    cur = c;
    word.textContent = C[w][0];
    word.style.color = C[c][1];
  }

  function finish() {
    word.style.color = '';
    word.textContent = score() + ' pts';
    msg.textContent = right + ' right · ' + wrong + ' wrong';
    startBtn.textContent = 'Play again';
    if (vxSave('stroop', score())) bestEl.textContent = score();
    vxPop(box);
  }

  startBtn.addEventListener('click', () => {
    right = 0;
    wrong = 0;
    scoreEl.textContent = 0;
    msg.textContent = 'Go!';
    startBtn.textContent = 'Restart';
    clock.start();
    next();
  });

  vxOn($('.vx-opts', stage), '.vx-opt', (btn) => {
    if (!clock.on) return;
    if (Number(btn.dataset.i) === cur) right++;
    else { wrong++; vxShake(box); }
    scoreEl.textContent = score();
    next();
  });
}

/* ==========================================================
   GAME 5 — STOP AT ONE SECOND
   ========================================================== */
function mountOneSecond(stage, foot) {
  stage.innerHTML =
    '<button class="rx vx-pad" type="button"><span>Start<small>Stop at exactly 1.000s</small></span></button>' +
    '<p class="msg" aria-live="polite">The numbers vanish after 0.4s. Count it in your head.</p>';
  const fmt = (v) => (v === null ? '—' : '±' + v + ' ms');
  const [lastEl, bestEl, triesEl] = vxFoot(foot, [['Last', '—'], ['Best', fmt(vxBest('onesecond'))], ['Tries', 0]]);

  const pad = $('.rx', stage);
  const label = $('span', pad);
  const msg = $('.msg', stage);
  let running = false;
  let t0 = 0;
  let raf = 0;
  let tries = 0;

  function tick() {
    if (!running) return;
    const t = performance.now() - t0;
    if (t > 3000) { stop(); return; }
    label.innerHTML = (t < 400 ? (t / 1000).toFixed(3) : '?.???') + '<small>Tap to stop</small>';
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
    running = false;
    const t = performance.now() - t0;
    const diff = Math.round(t - 1000);
    pad.className = 'rx vx-pad';
    label.innerHTML = (t / 1000).toFixed(3) + 's<small>' + (diff >= 0 ? '+' : '') + diff + ' ms · tap to retry</small>';
    tries++;
    triesEl.textContent = tries;
    lastEl.textContent = (diff >= 0 ? '+' : '') + diff + ' ms';
    msg.textContent = diff === 0 ? 'Perfect. Exactly one second.' : Math.abs(diff) <= 25 ? 'So close.' : Math.abs(diff) <= 120 ? 'Nice feel for time.' : 'Time is slippery.';
    if (vxSave('onesecond', Math.abs(diff), true)) bestEl.textContent = fmt(Math.abs(diff));
    vxPop(pad);
  }

  vxTap(pad, () => {
    if (running) { stop(); return; }
    running = true;
    t0 = performance.now();
    pad.className = 'rx vx-pad go';
    tick();
  });
}

/* ==========================================================
   GAME 6 — NUMBER MEMORY
   ========================================================== */
function mountNumbers(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box"><div class="vx-big">Ready</div></div>' +
    '<div class="vx-bar" style="visibility:hidden"><i></i></div>' +
    '<div class="vx-row" hidden><input class="vx-input" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="20" aria-label="Type the number"><button class="glass pill" type="button" data-ok>OK</button></div>' +
    '<p class="msg" aria-live="polite">Memorize the number, then type it back.</p>' +
    '<button class="glass pill" type="button" data-go>Start</button>';
  const [levelEl, bestEl] = vxFoot(foot, [['Digits', 3], ['Best', vxBest('numbers') || 0]]);

  const box = $('.vx-box', stage);
  const big = $('.vx-big', stage);
  const bar = $('.vx-bar', stage);
  const fill = $('i', bar);
  const row = $('.vx-row', stage);
  const input = $('.vx-input', stage);
  const okBtn = $('[data-ok]', stage);
  const startBtn = $('[data-go]', stage);
  const msg = $('.msg', stage);

  let level = 3;
  let run = 0;
  let target = '';
  let phase = 'idle';

  const gen = (n) => {
    let s = String(vxRnd(1, 9));
    while (s.length < n) s += vxRnd(0, 9);
    return s;
  };

  async function round() {
    const id = ++run;
    phase = 'show';
    target = gen(level);
    levelEl.textContent = level;
    row.hidden = true;
    input.value = '';
    big.textContent = target;
    msg.textContent = 'Memorize…';
    const dur = 900 + level * 400;
    bar.style.visibility = 'visible';
    gsap.fromTo(fill, { scaleX: 1 }, { scaleX: 0, duration: dur / 1000, ease: 'none' });
    await wait(dur);
    if (id !== run) return;
    phase = 'input';
    big.textContent = '?';
    bar.style.visibility = 'hidden';
    row.hidden = false;
    msg.textContent = 'Type what you saw.';
    input.focus();
  }

  function submit() {
    if (phase !== 'input') return;
    const v = input.value.trim();
    if (!v) return;
    phase = 'idle';
    row.hidden = true;
    if (v === target) {
      if (vxSave('numbers', level)) bestEl.textContent = level;
      level++;
      big.textContent = '✓';
      msg.textContent = 'Correct. ' + level + ' digits next.';
      const id = run;
      setTimeout(() => { if (id === run) round(); }, 800);
    } else {
      big.textContent = target;
      msg.textContent = 'It was ' + target + '. You typed ' + v + '.';
      startBtn.textContent = 'Try again';
      level = 3;
      vxShake(box);
    }
  }

  startBtn.addEventListener('click', () => {
    level = 3;
    startBtn.textContent = 'Restart';
    round();
  });
  okBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });
}

/* ==========================================================
   GAME 7 — HIDDEN DOT
   ========================================================== */
function mountHiddenDot(stage, foot) {
  stage.innerHTML =
    '<div class="vx-board"><p class="vx-cap">Find the tiny dot.<br>Tap where you think it hides.</p></div>' +
    '<p class="msg" aria-live="polite">Every miss adds 0.5 seconds.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const sec = (ms) => (ms / 1000).toFixed(2) + 's';
  const b0 = vxBest('hiddendot');
  const [lastEl, bestEl, missEl] = vxFoot(foot, [['Last', '—'], ['Best', b0 === null ? '—' : sec(b0)], ['Misses', 0]]);

  const board = $('.vx-board', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let live = false;
  let t0 = 0;
  let misses = 0;
  let fx = 0;
  let fy = 0;
  let dot = null;
  let hint = 0;

  function start() {
    board.innerHTML = '';
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('i');
      const z = vxRnd(2, 4);
      s.className = 'vx-speck';
      s.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;width:${z}px;height:${z}px;opacity:${(0.05 + Math.random() * 0.12).toFixed(2)}`;
      board.appendChild(s);
    }
    fx = 0.06 + Math.random() * 0.88;
    fy = 0.06 + Math.random() * 0.88;
    dot = document.createElement('i');
    dot.className = 'vx-dot';
    dot.style.left = fx * 100 + '%';
    dot.style.top = fy * 100 + '%';
    board.appendChild(dot);
    misses = 0;
    missEl.textContent = 0;
    msg.textContent = 'Searching…';
    startBtn.textContent = 'Skip';
    live = true;
    t0 = performance.now();
    clearTimeout(hint);
    hint = setTimeout(() => { if (dot) dot.classList.add('hint'); }, 9000);
  }

  startBtn.addEventListener('click', start);

  board.addEventListener('pointerdown', (e) => {
    if (!live) return;
    const r = board.getBoundingClientRect();
    const d = Math.hypot(e.clientX - r.left - fx * r.width, e.clientY - r.top - fy * r.height);
    if (d <= 24) {
      live = false;
      clearTimeout(hint);
      const ms = Math.round(performance.now() - t0) + misses * 500;
      dot.classList.remove('hint');
      gsap.to(dot, { opacity: 1, scale: 2.6, duration: 0.4, ease: 'power2.out' });
      lastEl.textContent = sec(ms);
      msg.textContent = 'Found in ' + sec(ms) + (misses ? ' (incl. ' + misses + ' miss' + (misses > 1 ? 'es' : '') + ')' : '');
      startBtn.textContent = 'Next';
      if (vxSave('hiddendot', ms, true)) bestEl.textContent = sec(ms);
    } else {
      misses++;
      missEl.textContent = misses;
      msg.textContent = 'Miss. +0.5s';
      vxShake(board);
    }
  });
}

/* ==========================================================
   GAME 8 — PATTERN FINDER
   ========================================================== */
function mountOddOne(stage, foot) {
  const P = [['O', 'Q'], ['E', 'F'], ['C', 'G'], ['5', 'S'], ['8', 'B'], ['n', 'h'], ['P', 'R'], ['u', 'v'], ['D', 'O'], ['M', 'N']];
  stage.innerHTML =
    '<div class="vx-grid"></div>' +
    '<p class="msg" aria-live="polite">One symbol is different. Wrong taps cost 2 seconds.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [scoreEl, timeEl, bestEl] = vxFoot(foot, [['Score', 0], ['Time', '30.0s'], ['Best', vxBest('oddone') || 0]]);

  const grid = $('.vx-grid', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let score = 0;
  let odd = -1;
  const clock = vxClock(30000, (l) => { timeEl.textContent = vxSec(l); }, finish);
  vxIdleGrid(grid, 3);

  function build() {
    const n = Math.min(7, 3 + Math.floor(score / 3));
    const pair = vxPick(P);
    const flip = Math.random() < 0.5;
    const base = flip ? pair[0] : pair[1];
    const diff = flip ? pair[1] : pair[0];
    odd = vxRnd(0, n * n - 1);
    grid.style.setProperty('--n', n);
    grid.innerHTML = Array.from({ length: n * n }, (_, i) => `<button class="vx-cell" type="button">${i === odd ? diff : base}</button>`).join('');
  }

  function finish() {
    vxIdleGrid(grid, 3);
    msg.textContent = 'Time. You found ' + score + '.';
    startBtn.textContent = 'Play again';
    if (vxSave('oddone', score)) bestEl.textContent = score;
  }

  startBtn.addEventListener('click', () => {
    score = 0;
    scoreEl.textContent = 0;
    msg.textContent = 'Find the odd one.';
    startBtn.textContent = 'Restart';
    clock.start();
    build();
  });

  vxOn(grid, '.vx-cell', (cell) => {
    if (!clock.on) return;
    const i = $$('.vx-cell', grid).indexOf(cell);
    if (i === odd) {
      score++;
      scoreEl.textContent = score;
      build();
    } else {
      clock.add(-2000);
      vxShake(cell);
    }
  });
}

/* ==========================================================
   GAME 9 — FOCUS CHALLENGE
   ========================================================== */
function mountFocus(stage, foot) {
  const T = ['◆', '★', '●', '▲', '■'];
  const D = ['◇', '☆', '○', '△', '□', '◈', '✦', '◉', '▽', '◐'];
  stage.innerHTML =
    '<div class="vx-box vx-sm"><div class="vx-mid">Tap only <span class="vx-tg">—</span></div></div>' +
    '<div class="vx-grid"></div>' +
    '<p class="msg" aria-live="polite">Everything else is a distraction. Wrong taps cost a point.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [scoreEl, timeEl, bestEl] = vxFoot(foot, [['Score', 0], ['Time', '30.0s'], ['Best', vxBest('focus') || 0]]);

  const grid = $('.vx-grid', stage);
  const tg = $('.vx-tg', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let score = 0;
  let rounds = 0;
  let left = 0;
  let target = '';
  let jit = 0;
  const clock = vxClock(30000, (l) => { timeEl.textContent = vxSec(l); }, finish);
  vxIdleGrid(grid, 4);

  function round() {
    let t;
    do t = vxPick(T); while (t === target);
    target = t;
    tg.textContent = t;
    const n = Math.min(6, 4 + Math.floor(rounds / 3));
    const count = Math.min(6, 3 + Math.floor(rounds / 2));
    const pool = T.filter((x) => x !== t).concat(D);
    const hit = new Set(vxShuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, count));
    left = count;
    grid.style.setProperty('--n', n);
    grid.innerHTML = Array.from({ length: n * n }, (_, i) =>
      `<button class="vx-cell" type="button" data-t="${hit.has(i) ? 1 : 0}">${hit.has(i) ? t : vxPick(pool)}</button>`).join('');
    rounds++;
  }

  function finish() {
    clearInterval(jit);
    vxIdleGrid(grid, 4);
    tg.textContent = '—';
    msg.textContent = 'Time. Final score ' + score + '.';
    startBtn.textContent = 'Play again';
    if (vxSave('focus', score)) bestEl.textContent = score;
  }

  startBtn.addEventListener('click', () => {
    score = 0;
    rounds = 0;
    target = '';
    scoreEl.textContent = 0;
    msg.textContent = 'Stay locked on the target.';
    startBtn.textContent = 'Restart';
    clock.start();
    round();
    clearInterval(jit);
    jit = setInterval(() => {
      const cells = $$('.vx-cell[data-t="0"]:not(.off)', grid);
      for (let k = 0; k < 2 && cells.length; k++) {
        gsap.fromTo(vxPick(cells), { scale: 1.2, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' });
      }
    }, 650);
  });

  vxOn(grid, '.vx-cell', (cell) => {
    if (!clock.on) return;
    if (cell.dataset.t === '1') {
      score++;
      cell.textContent = '';
      cell.disabled = true;
      cell.classList.add('off');
      left--;
      if (!left) round();
    } else {
      score = Math.max(0, score - 1);
      vxShake(cell);
    }
    scoreEl.textContent = score;
  });
}

/* ==========================================================
   GAME 10 — RHYTHM TAP
   ========================================================== */
function mountRhythm(stage, foot) {
  stage.innerHTML =
    '<button class="rx vx-pad" type="button"><span>Start<small>Watch 4 beats, then keep the tempo</small></span></button>' +
    '<p class="msg" aria-live="polite">After 4 beats the circle goes quiet. Tap 8 times at the same tempo.</p>';
  const fmt = (v) => (v === null ? '—' : v + '%');
  const [lastEl, bestEl, bpmEl] = vxFoot(foot, [['Last', '—'], ['Best', fmt(vxBest('rhythm'))], ['BPM', '—']]);

  const pad = $('.rx', stage);
  const label = $('span', pad);
  const msg = $('.msg', stage);
  let phase = 'idle';
  let run = 0;
  let T = 700;
  let taps = [];

  async function begin() {
    const id = ++run;
    phase = 'guide';
    taps = [];
    T = vxRnd(480, 820);
    bpmEl.textContent = Math.round(60000 / T);
    msg.textContent = 'Watch the beat…';
    for (let i = 1; i <= 4; i++) {
      if (id !== run) return;
      pad.className = 'rx vx-pad go';
      label.innerHTML = i + '<small>listen</small>';
      await wait(110);
      if (id !== run) return;
      pad.className = 'rx vx-pad';
      await wait(T - 110);
    }
    if (id !== run) return;
    phase = 'tap';
    label.innerHTML = 'Your turn<small>0 / 8</small>';
    msg.textContent = 'Keep the tempo. No more guide.';
  }

  function finish() {
    phase = 'idle';
    const iv = [];
    for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
    const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
    const err = iv.reduce((a, b) => a + Math.abs(b - T), 0) / iv.length;
    const acc = Math.max(0, Math.round(100 * (1 - (err / T) * 2.5)));
    pad.className = 'rx vx-pad';
    label.innerHTML = acc + '%<small>off by ' + Math.round(err) + ' ms avg · tap to retry</small>';
    lastEl.textContent = acc + '%';
    msg.textContent = 'Target ' + T + ' ms · you averaged ' + Math.round(mean) + ' ms (' + (mean < T ? 'rushing' : 'dragging') + ').';
    if (vxSave('rhythm', acc)) bestEl.textContent = acc + '%';
    vxPop(pad);
  }

  vxTap(pad, () => {
    if (phase === 'guide') return;
    if (phase === 'idle') { begin(); return; }
    taps.push(performance.now());
    label.innerHTML = 'Your turn<small>' + taps.length + ' / 8</small>';
    gsap.fromTo(pad, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: 'power2.out' });
    if (taps.length === 8) finish();
  });
}

/* ==========================================================
   GAME 11 — LUCKY BOX
   ========================================================== */
function mountLucky(stage, foot) {
  stage.innerHTML =
    '<div class="vx-grid"></div>' +
    '<p class="msg" aria-live="polite">One box hides the reward. Trust your gut.</p>';
  const [streakEl, bestEl, rateEl] = vxFoot(foot, [['Streak', 0], ['Best', vxBest('lucky') || 0], ['Luck', '—']]);

  const grid = $('.vx-grid', stage);
  const msg = $('.msg', stage);
  let streak = 0;
  let wins = 0;
  let plays = 0;
  let reward = 0;
  let locked = false;

  function deal() {
    const count = Math.min(6, 3 + Math.floor(streak / 2));
    reward = vxRnd(0, count - 1);
    locked = false;
    grid.style.setProperty('--n', count === 6 ? 3 : count);
    grid.innerHTML = Array.from({ length: count }, (_, i) => `<button class="vx-cell" type="button" aria-label="Box ${i + 1}">?</button>`).join('');
    gsap.from($$('.vx-cell', grid), { scale: 0.8, opacity: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' });
    msg.textContent = count + ' boxes. Pick one.';
  }

  vxOn(grid, '.vx-cell', (cell) => {
    if (locked) return;
    locked = true;
    const cells = $$('.vx-cell', grid);
    const pick = cells.indexOf(cell);
    const won = pick === reward;
    plays++;
    cells.forEach((c, i) => {
      c.textContent = i === reward ? '◆' : i === pick ? '×' : '·';
      c.classList.add(i === reward ? 'win' : 'lose');
    });
    gsap.fromTo(cell, { scale: 0.88 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,.4)' });
    if (won) {
      wins++;
      streak++;
      if (vxSave('lucky', streak)) bestEl.textContent = streak;
      msg.textContent = 'Lucky. Streak ' + streak + '.';
    } else {
      streak = 0;
      msg.textContent = 'Empty. Streak reset.';
    }
    streakEl.textContent = streak;
    rateEl.textContent = Math.round((wins / plays) * 100) + '%';
    setTimeout(deal, 1300);
  });

  deal();
}

/* ==========================================================
   GAME 12 — SEQUENCE LOGIC
   ========================================================== */
function mountSequence(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box"><div class="vx-num">Ready?</div></div>' +
    '<div class="vx-opts"></div>' +
    '<p class="msg" aria-live="polite">Find the rule. Predict the next number. One mistake ends the run.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [streakEl, bestEl] = vxFoot(foot, [['Streak', 0], ['Best', vxBest('sequence') || 0]]);

  const box = $('.vx-box', stage);
  const num = $('.vx-num', stage);
  const opts = $('.vx-opts', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let streak = 0;
  let q = null;
  let live = false;

  function ask() {
    q = vxSeqQuestion(Math.min(2, Math.floor(streak / 3)));
    num.textContent = q.shown.join(', ') + ', ?';
    opts.innerHTML = q.options.map((o) => `<button class="vx-opt" type="button" data-v="${o}">${o}</button>`).join('');
    msg.textContent = 'What comes next?';
    live = true;
  }

  vxOn(opts, '.vx-opt', (btn) => {
    if (!live) return;
    live = false;
    const ok = Number(btn.dataset.v) === q.answer;
    if (ok) {
      btn.classList.add('ok');
      streak++;
      streakEl.textContent = streak;
      if (vxSave('sequence', streak)) bestEl.textContent = streak;
      setTimeout(ask, 650);
    } else {
      btn.classList.add('no');
      $$('.vx-opt', opts).forEach((b) => { if (Number(b.dataset.v) === q.answer) b.classList.add('ok'); });
      msg.textContent = 'The answer was ' + q.answer + '. ' + q.rule;
      startBtn.textContent = 'Play again';
      vxShake(box);
    }
  });

  startBtn.addEventListener('click', () => {
    streak = 0;
    streakEl.textContent = 0;
    startBtn.textContent = 'Restart';
    ask();
  });
}

/* ==========================================================
   GAME 13 — COLOR MEMORY
   ========================================================== */
const vxCols = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0070f3', '#af52de'];

function mountColors(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box"><div class="vx-big">Ready</div></div>' +
    '<div class="vx-pips"></div>' +
    '<div class="vx-swatches">' + vxCols.map((c, i) => `<button class="vx-sw" type="button" data-i="${i}" aria-label="Color ${i + 1}" style="background:${c}"></button>`).join('') + '</div>' +
    '<p class="msg" aria-live="polite">Watch the colors flash. Repeat them in order.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [levelEl, bestEl] = vxFoot(foot, [['Length', 0], ['Best', vxBest('colors') || 0]]);

  const box = $('.vx-box', stage);
  const big = $('.vx-big', stage);
  const pips = $('.vx-pips', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let seq = [];
  let picks = 0;
  let busy = true;
  let run = 0;

  const renderPips = (n, colors) => {
    pips.innerHTML = Array.from({ length: n }, (_, i) =>
      `<i class="vx-pip"${colors && colors[i] !== undefined ? ` style="background:${vxCols[colors[i]]}"` : ''}></i>`).join('');
  };

  const add = () => {
    let c;
    do c = vxRnd(0, 5); while (c === seq[seq.length - 1]);
    seq.push(c);
  };

  async function play() {
    const id = ++run;
    busy = true;
    picks = 0;
    levelEl.textContent = seq.length;
    renderPips(seq.length);
    big.textContent = '';
    msg.textContent = 'Watch…';
    await wait(500);
    for (const ci of seq) {
      if (id !== run) return;
      box.style.background = vxCols[ci];
      box.style.boxShadow = '0 0 70px ' + vxCols[ci];
      await wait(620);
      box.style.background = '';
      box.style.boxShadow = '';
      await wait(220);
    }
    if (id !== run) return;
    big.textContent = '?';
    msg.textContent = 'Repeat the colors in order.';
    busy = false;
  }

  vxOn($('.vx-swatches', stage), '.vx-sw', (sw) => {
    if (busy) return;
    const ci = Number(sw.dataset.i);
    gsap.fromTo(sw, { scale: 0.88 }, { scale: 1, duration: 0.4, ease: 'power2.out' });
    if (ci === seq[picks]) {
      $$('.vx-pip', pips)[picks].style.background = vxCols[ci];
      picks++;
      if (picks === seq.length) {
        busy = true;
        if (vxSave('colors', seq.length)) bestEl.textContent = seq.length;
        msg.textContent = 'Perfect. Longer next.';
        const id = run;
        setTimeout(() => { if (id === run) { add(); play(); } }, 900);
      }
    } else {
      busy = true;
      renderPips(seq.length, seq);
      msg.textContent = 'Wrong. That was the sequence.';
      startBtn.textContent = 'Try again';
      vxShake(box);
    }
  });

  startBtn.addEventListener('click', () => {
    seq = [];
    add(); add(); add();
    startBtn.textContent = 'Restart';
    play();
  });
}

/* ==========================================================
   GAME 14 — ATTENTION TEST
   ========================================================== */
function mountAttention(stage, foot) {
  const S = ['◆', '●', '▲', '■', '★', '✚', '◐'];
  stage.innerHTML =
    '<button class="rx vx-pad" type="button"><span>Start<small>Tap only for the target</small></span></button>' +
    '<p class="msg" aria-live="polite">A stream of symbols is coming. 30 seconds.</p>';
  const [scoreEl, timeEl, bestEl] = vxFoot(foot, [['Score', 0], ['Time', '30.0s'], ['Best', vxBest('attention') || 0]]);

  const pad = $('.rx', stage);
  const label = $('span', pad);
  const msg = $('.msg', stage);
  let run = 0;
  let target = '';
  let others = [];
  let cur = null;
  let hits = 0;
  let fa = 0;
  let misses = 0;

  const score = () => Math.max(0, hits - fa);
  const clock = vxClock(30000, (l) => { timeEl.textContent = vxSec(l); }, finish);

  async function loop(id) {
    while (clock.on && id === run) {
      const isT = Math.random() < 0.3;
      cur = { isT, tapped: false };
      label.innerHTML = '<span class="vx-sym">' + (isT ? target : vxPick(others)) + '</span>';
      await wait(Math.max(480, 850 - hits * 12));
      if (id !== run) return;
      if (cur.isT && !cur.tapped) misses++;
      cur = null;
      label.innerHTML = '<span class="vx-sym">&nbsp;</span>';
      await wait(vxRnd(250, 450));
    }
  }

  function finish() {
    run++;
    cur = null;
    pad.className = 'rx vx-pad';
    label.innerHTML = score() + ' pts<small>tap to retry</small>';
    msg.textContent = hits + ' hits · ' + fa + ' false taps · ' + misses + ' missed';
    if (vxSave('attention', score())) bestEl.textContent = score();
    vxPop(pad);
  }

  function begin() {
    target = vxPick(S);
    others = S.filter((x) => x !== target);
    hits = 0;
    fa = 0;
    misses = 0;
    scoreEl.textContent = 0;
    msg.textContent = 'Tap only when you see ' + target;
    pad.className = 'rx vx-pad';
    const id = ++run;
    clock.start();
    loop(id);
  }

  vxTap(pad, () => {
    if (!clock.on) { begin(); return; }
    if (cur && cur.isT) {
      if (!cur.tapped) {
        cur.tapped = true;
        hits++;
        pad.className = 'rx vx-pad go';
        setTimeout(() => { pad.className = 'rx vx-pad'; }, 140);
      }
    } else {
      fa++;
      vxShake(pad);
    }
    scoreEl.textContent = score();
  });
}

/* ==========================================================
   GAME 15 — BALANCE DOT
   ========================================================== */
function mountBalance(stage, foot) {
  stage.innerHTML =
    '<div class="vx-board"><i class="vx-zone"></i><i class="vx-ball"></i><p class="vx-cap">Move the ring to follow the dot.<br>Press Start, then drag.</p></div>' +
    '<div class="vx-bar"><i></i></div>' +
    '<p class="msg" aria-live="polite">The dot gets faster the longer you last.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const b0 = vxBest('balance');
  const [timeEl, bestEl] = vxFoot(foot, [['Time', '0.0s'], ['Best', b0 === null ? '—' : b0.toFixed(1) + 's']]);

  const board = $('.vx-board', stage);
  const zone = $('.vx-zone', stage);
  const ball = $('.vx-ball', stage);
  const cap = $('.vx-cap', stage);
  const fill = $('.vx-bar i', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);

  let live = false;
  let raf = 0;
  let last = 0;
  let t = 0;
  let bal = 100;
  let S = 300;
  let R = 42;
  let bx = 0, by = 0, ang = 0;
  let zx = 0, zy = 0, tx = 0, ty = 0;

  const render = () => {
    zone.style.transform = `translate(${zx}px,${zy}px)`;
    ball.style.transform = `translate(${bx}px,${by}px)`;
  };

  function size() {
    S = board.clientWidth || 300;
    R = S * 0.14;
    zone.style.width = zone.style.height = R * 2 + 'px';
    zone.style.margin = `${-R}px 0 0 ${-R}px`;
  }

  function reset() {
    size();
    bx = zx = tx = S / 2;
    by = zy = ty = S / 2;
    render();
  }

  function step(now) {
    if (!live) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    ang += (Math.random() - 0.5) * dt * 14;
    const sp = Math.min(230, 70 + t * 7) * (S / 440);
    bx += Math.cos(ang) * sp * dt;
    by += Math.sin(ang) * sp * dt;
    const m = 10;
    if (bx < m) { bx = m; ang = Math.PI - ang; }
    if (bx > S - m) { bx = S - m; ang = Math.PI - ang; }
    if (by < m) { by = m; ang = -ang; }
    if (by > S - m) { by = S - m; ang = -ang; }
    const k = Math.min(1, dt * 9);
    zx += (tx - zx) * k;
    zy += (ty - zy) * k;
    const inside = Math.hypot(bx - zx, by - zy) < R - 6;
    bal = Math.min(100, bal + (inside ? 22 : -60) * dt);
    render();
    zone.classList.toggle('out', !inside);
    fill.style.transform = `scaleX(${Math.max(0, bal) / 100})`;
    timeEl.textContent = t.toFixed(1) + 's';
    if (bal <= 0) { end(); return; }
    raf = requestAnimationFrame(step);
  }

  function end() {
    live = false;
    cancelAnimationFrame(raf);
    board.classList.remove('live');
    const score = Math.round(t * 10) / 10;
    msg.textContent = 'You held balance for ' + score.toFixed(1) + 's.';
    startBtn.textContent = 'Play again';
    if (vxSave('balance', score)) bestEl.textContent = score.toFixed(1) + 's';
  }

  function move(e) {
    if (!live) return;
    const r = board.getBoundingClientRect();
    tx = Math.max(0, Math.min(S, e.clientX - r.left));
    ty = Math.max(0, Math.min(S, e.clientY - r.top));
  }

  board.addEventListener('pointerdown', move);
  board.addEventListener('pointermove', move);

  startBtn.addEventListener('click', () => {
    cancelAnimationFrame(raf);
    reset();
    cap.hidden = true;
    ang = Math.random() * Math.PI * 2;
    t = 0;
    bal = 100;
    live = true;
    board.classList.add('live');
    startBtn.textContent = 'Restart';
    msg.textContent = 'Drag to move the ring.';
    last = performance.now();
    raf = requestAnimationFrame(step);
  });

  reset();
}

/* ==========================================================
   GAME 16 — PRECISION DRAG
   ========================================================== */
function mountPrecisionDrag(stage, foot) {
  stage.innerHTML =
    '<div class="vx-board"><svg class="vx-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><i class="vx-grab" role="button" aria-label="Drag handle"></i></div>' +
    '<p class="msg" aria-live="polite">Grab the dot and drag it to the ring. Stay inside the lane.</p>' +
    '<button class="glass pill" type="button">New path</button>';
  const [levelEl, timeEl, bestEl] = vxFoot(foot, [['Level', 1], ['Time', '0.0s'], ['Best', vxBest('drag') || 0]]);

  const board = $('.vx-board', stage);
  const svg = $('.vx-svg', stage);
  const grab = $('.vx-grab', stage);
  const msg = $('.msg', stage);
  const newBtn = $('.pill', stage);

  let level = 1;
  let pts = [];
  let lane = 9;
  let drag = false;
  let started = false;
  let t0 = 0;
  let px = 0;
  let py = 0;
  let offX = 0;
  let offY = 0;
  let won = false;

  const place = (x, y) => { grab.style.left = x + '%'; grab.style.top = y + '%'; };
  const toU = (e) => {
    const r = board.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };
  const dist = (x, y) => {
    let m = 1e9;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = vxSegDist(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < m) m = d;
    }
    return m;
  };

  function newPath() {
    const lv = Math.min(level, 6);
    const a1 = 12 + lv * 2.2;
    const a2 = 3 + lv * 1.6;
    const k1 = 0.9 + Math.random() * 0.6;
    const k2 = 1.8 + Math.random() * 1.4;
    const p1 = Math.random() * 6.28;
    const p2 = Math.random() * 6.28;
    lane = Math.max(4.5, 10 - level * 0.8);
    pts = [];
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      pts.push([8 + 84 * u, 50 + a1 * Math.sin(6.283 * k1 * u + p1) + a2 * Math.sin(6.283 * k2 * u + p2)]);
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('');
    const end = pts[pts.length - 1];
    svg.innerHTML =
      `<path d="${d}" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="${lane}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width=".4" stroke-dasharray="1.5 1.5"/>` +
      `<circle cx="${end[0]}" cy="${end[1]}" r="4.2" fill="rgba(0,112,243,.2)" stroke="#0070f3" stroke-width=".8"/>`;
    place(pts[0][0], pts[0][1]);
    px = pts[0][0];
    py = pts[0][1];
    drag = false;
    started = false;
    won = false;
    levelEl.textContent = level;
    timeEl.textContent = '0.0s';
    msg.textContent = 'Grab the dot and drag it to the ring. Stay inside the lane.';
  }

  function fail() {
    drag = false;
    started = false;
    place(pts[0][0], pts[0][1]);
    px = pts[0][0];
    py = pts[0][1];
    msg.textContent = 'You left the lane. Try again.';
    vxShake(board);
  }

  grab.addEventListener('pointerdown', (e) => {
    if (won) return;
    e.preventDefault();
    grab.setPointerCapture(e.pointerId);
    const u = toU(e);
    offX = u[0] - px;
    offY = u[1] - py;
    drag = true;
    if (!started) { started = true; t0 = performance.now(); }
    msg.textContent = 'Steady…';
  });

  grab.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const u = toU(e);
    const x = u[0] - offX;
    const y = u[1] - offY;
    const steps = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / 1.2));
    for (let s = 1; s <= steps; s++) {
      const ix = px + ((x - px) * s) / steps;
      const iy = py + ((y - py) * s) / steps;
      if (dist(ix, iy) > lane / 2) { fail(); return; }
    }
    px = x;
    py = y;
    place(px, py);
    timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's';
    const end = pts[pts.length - 1];
    if (Math.hypot(px - end[0], py - end[1]) < 4) {
      drag = false;
      won = true;
      const sec = (performance.now() - t0) / 1000;
      msg.textContent = 'Level ' + level + ' cleared in ' + sec.toFixed(2) + 's.';
      if (vxSave('drag', level)) bestEl.textContent = level;
      level++;
      vxPop(board);
      setTimeout(newPath, 1100);
    }
  });

  ['pointerup', 'pointercancel'].forEach((evt) => grab.addEventListener(evt, () => {
    if (!drag) return;
    drag = false;
    started = false;
    place(pts[0][0], pts[0][1]);
    px = pts[0][0];
    py = pts[0][1];
    msg.textContent = 'Let go too soon. Try again.';
  }));

  newBtn.addEventListener('click', newPath);
  newPath();
}

/* ==========================================================
   GAME 17 — HUMAN OR AI
   (Samples are written for this game, not scraped from anywhere.)
   ========================================================== */
const vxTexts = [
  { ai: 0, t: "ok so i finally tried that ramen place on 5th and honestly?? broth was great but they gave me like 3 slices of pork. never again lol", tell: 'Casual, specific and a little grumpy.' },
  { ai: 0, t: "My grandmother used to hum while she kneaded dough. Never a real song. Just whatever was in her head. I still catch myself doing it.", tell: 'An odd, personal detail nobody would invent.' },
  { ai: 0, t: "Traffic was a nightmare, got to the meeting 20 mins late and Dave had already eaten my donut. Not even sorry.", tell: 'Named person, petty detail, real voice.' },
  { ai: 0, t: "can't sleep. the fridge keeps making that noise again and now i'm convinced it's haunted. or dying. same thing at this point", tell: 'Lowercase rambling with a joke that lands sideways.' },
  { ai: 0, t: "Honestly I think the second season dragged. The cooking competition stuff was fun but that whole subplot with the landlord? Skip it.", tell: 'A strong, specific opinion with no hedging.' },
  { ai: 0, t: "Lost my keys for the third time this week. Found them in the freezer. Don't ask. I don't have an answer.", tell: 'Absurd specifics and dry humor.' },
  { ai: 0, t: "tbh the best part of the trip was getting lost. we ended up at some tiny bakery and the owner just gave us free bread", tell: 'A messy story with an unplanned detail.' },
  { ai: 0, t: "He said he'd call back in five minutes. That was Tuesday.", tell: 'Short, deadpan, no filler.' },
  { ai: 0, t: "Mum's recipe says 'a bit of butter'. How much is a bit?? I've ruined this cake twice now.", tell: 'Frustration, a real quirk, a personal stake.' },
  { ai: 0, t: "Went for a run, got rained on, stepped in a puddle that was definitely deeper than it looked. 10/10 would not recommend.", tell: 'Sarcasm and a lived-in moment.' },
  { ai: 0, t: "my cat just stared at the wall for 20 minutes and then sprinted away. i have so many questions", tell: 'Unfiltered and oddly specific.' },
  { ai: 0, t: "The print shop closed early so I got the posters done at the library instead. Librarian was weirdly nice about it.", tell: 'Mundane detail an AI would likely skip.' },
  { ai: 1, t: "Time management is a crucial skill that can significantly improve both your productivity and overall well-being. By prioritizing tasks and setting clear goals, you can achieve more in less time.", tell: 'Polished, generic, zero specifics.' },
  { ai: 1, t: "Certainly! Here are three key benefits of regular exercise: improved cardiovascular health, enhanced mood, and better sleep quality.", tell: 'The cheerful “Certainly!” and neat list of three.' },
  { ai: 1, t: "In today's fast-paced world, maintaining a healthy work-life balance is more important than ever. It's essential to take breaks, set boundaries, and prioritize self-care.", tell: 'Stock opener plus a checklist of safe advice.' },
  { ai: 1, t: "Autumn is a season of transformation, where golden leaves dance in the crisp air and the world prepares for quiet reflection.", tell: 'Ornate imagery, nothing actually observed.' },
  { ai: 1, t: "While opinions on remote work vary, it is important to consider both the advantages, such as flexibility, and the challenges, such as isolation.", tell: 'Perfectly balanced, commits to nothing.' },
  { ai: 1, t: "Travel offers a unique opportunity to broaden your horizons, experience diverse cultures, and create lasting memories.", tell: 'Brochure language with no actual trip in it.' },
  { ai: 1, t: "To summarize, effective communication relies on active listening, clarity, and empathy, all of which foster stronger relationships.", tell: 'A tidy summary nobody asked for.' },
  { ai: 1, t: "Coffee is more than just a beverage; it is a ritual that brings people together and sparks creativity across the globe.", tell: 'The “more than just…” construction.' },
  { ai: 1, t: "Learning a new language can be a rewarding journey that opens doors to new opportunities and perspectives.", tell: 'Smooth, safe and empty.' },
  { ai: 1, t: "There are several factors to consider when choosing a laptop, including performance, battery life, portability, and budget.", tell: 'A balanced list with no opinion.' },
  { ai: 1, t: "Technology continues to reshape the way we live, work, and connect, presenting both exciting opportunities and important challenges.", tell: 'Grand statement, no detail.' },
  { ai: 1, t: "Sleep is a fundamental pillar of health, playing a vital role in memory consolidation, emotional regulation, and physical recovery.", tell: 'Encyclopedic tone and a triplet.' }
];

function mountHumanAI(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box"><p class="vx-text">Is it written by a person or by an AI? 10 rounds.</p></div>' +
    '<div class="vx-opts"><button class="vx-opt" type="button" data-a="0" disabled>Human</button><button class="vx-opt" type="button" data-a="1" disabled>AI</button></div>' +
    '<p class="msg" aria-live="polite">Samples are written for this game. Real-world detection is far harder.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [roundEl, scoreEl, bestEl] = vxFoot(foot, [['Round', '0 / 10'], ['Score', 0], ['Best', vxBest('humanai') || 0]]);

  const box = $('.vx-box', stage);
  const text = $('.vx-text', stage);
  const opts = $('.vx-opts', stage);
  const btns = $$('.vx-opt', stage);
  const msg = $('.msg', stage);
  const nextBtn = $('.pill', stage);
  let deck = [];
  let i = 0;
  let score = 0;
  let phase = 'idle';

  function ask() {
    const q = deck[i];
    phase = 'ask';
    text.textContent = q.t;
    btns.forEach((b) => { b.disabled = false; b.classList.remove('ok', 'no'); });
    roundEl.textContent = (i + 1) + ' / 10';
    msg.textContent = 'Human or AI?';
    nextBtn.hidden = true;
    gsap.fromTo(box, { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.35 });
  }

  vxOn(opts, '.vx-opt', (btn) => {
    if (phase !== 'ask') return;
    phase = 'reveal';
    const q = deck[i];
    const pick = Number(btn.dataset.a);
    const ok = pick === q.ai;
    if (ok) score++;
    scoreEl.textContent = score;
    btns.forEach((b) => {
      b.disabled = true;
      if (Number(b.dataset.a) === q.ai) b.classList.add('ok');
      else if (b === btn) b.classList.add('no');
    });
    msg.textContent = (ok ? 'Correct. ' : 'Not quite. ') + 'It was ' + (q.ai ? 'AI-style' : 'human-style') + '. ' + q.tell;
    nextBtn.hidden = false;
    nextBtn.textContent = i === 9 ? 'See result' : 'Next';
  });

  nextBtn.addEventListener('click', () => {
    if (phase === 'idle' || phase === 'done') {
      deck = vxShuffle(vxTexts).slice(0, 10);
      i = 0;
      score = 0;
      scoreEl.textContent = 0;
      ask();
    } else if (phase === 'reveal') {
      if (i === 9) {
        phase = 'done';
        text.textContent = score + ' / 10 correct';
        btns.forEach((b) => { b.disabled = true; b.classList.remove('ok', 'no'); });
        msg.textContent = score >= 8 ? 'Sharp eye.' : score >= 5 ? 'Better than a coin flip.' : 'The machines are winning.';
        if (vxSave('humanai', score)) bestEl.textContent = score;
        nextBtn.textContent = 'Play again';
        vxPop(box);
      } else {
        i++;
        ask();
      }
    }
  });
}

/* ==========================================================
   GAME 18 — REALITY CHECK (optical illusions, pure SVG)
   ========================================================== */
const vxSvg = (inner) => `<svg viewBox="0 0 300 200" role="img" aria-label="Optical illusion">${inner}</svg>`;

const vxIll = [
  { /* Müller-Lyer */
    q: 'Which line is longer?', a: 'Top', b: 'Bottom', adj: 'longer',
    draw(tr, d) {
      const L = 150;
      const la = tr === 'a' ? L * (1 + d) : L;
      const lb = tr === 'b' ? L * (1 + d) : L;
      const row = (y, l, tails) => {
        const x1 = 150 - l / 2;
        const x2 = 150 + l / 2;
        const s = tails ? -13 : 13;
        return `<path d="M${x1} ${y}H${x2}M${x1} ${y}l${s} -13M${x1} ${y}l${s} 13M${x2} ${y}l${-s} -13M${x2} ${y}l${-s} 13"/>`;
      };
      const g = [150 - la / 2, 150 + la / 2, 150 - lb / 2, 150 + lb / 2].map((x) => `<line x1="${x}" y1="25" x2="${x}" y2="175"/>`).join('');
      return vxSvg(
        `<g class="vx-guide" stroke="#0070f3" stroke-width="1.4" stroke-dasharray="4 4">${g}</g>` +
        `<g fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${row(65, la, false)}${row(140, lb, true)}</g>`
      );
    }
  },
  { /* Ponzo */
    q: 'Which bar is longer?', a: 'Top', b: 'Bottom', adj: 'longer',
    draw(tr, d) {
      const L = 44;
      const la = tr === 'a' ? L * (1 + d) : L;
      const lb = tr === 'b' ? L * (1 + d) : L;
      const bar = (y, l) => `<line x1="${150 - l / 2}" y1="${y}" x2="${150 + l / 2}" y2="${y}" stroke="#0070f3" stroke-width="6"/>`;
      const g = [150 - la / 2, 150 + la / 2, 150 - lb / 2, 150 + lb / 2].map((x) => `<line x1="${x}" y1="30" x2="${x}" y2="165"/>`).join('');
      return vxSvg(
        '<g stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-linecap="round"><line x1="70" y1="192" x2="135" y2="8"/><line x1="230" y1="192" x2="165" y2="8"/></g>' +
        bar(50, la) + bar(145, lb) +
        `<g class="vx-guide" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 4">${g}</g>`
      );
    }
  },
  { /* Ebbinghaus */
    q: 'Which center circle is bigger?', a: 'Left', b: 'Right', adj: 'bigger',
    draw(tr, d) {
      const r = 18;
      const ra = tr === 'a' ? r * (1 + d) : r;
      const rb = tr === 'b' ? r * (1 + d) : r;
      const ring = (cx, cy, R, n, rr) => Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2;
        return `<circle cx="${(cx + Math.cos(t) * R).toFixed(1)}" cy="${(cy + Math.sin(t) * R).toFixed(1)}" r="${rr}"/>`;
      }).join('');
      return vxSvg(
        `<g fill="rgba(255,255,255,.3)">${ring(85, 100, 54, 6, 22)}${ring(215, 100, 31, 6, 7)}</g>` +
        `<g fill="#0070f3"><circle cx="85" cy="100" r="${ra.toFixed(1)}"/><circle cx="215" cy="100" r="${rb.toFixed(1)}"/></g>` +
        `<g class="vx-guide" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 3"><circle cx="85" cy="100" r="${r}"/><circle cx="215" cy="100" r="${r}"/></g>`
      );
    }
  },
  { /* simultaneous contrast */
    q: 'Which square is darker?', a: 'Left', b: 'Right', adj: 'darker',
    draw(tr, d) {
      const D = Math.round(d * 150);
      const ga = tr === 'a' ? 128 - D : 128;
      const gb = tr === 'b' ? 128 - D : 128;
      return vxSvg(
        '<rect x="15" y="25" width="125" height="150" rx="14" fill="#0a0a0a" stroke="rgba(255,255,255,.2)"/>' +
        '<rect x="160" y="25" width="125" height="150" rx="14" fill="#e8e8e8"/>' +
        `<rect x="55" y="77" width="46" height="46" rx="6" fill="rgb(${ga},${ga},${ga})"/>` +
        `<rect x="199" y="77" width="46" height="46" rx="6" fill="rgb(${gb},${gb},${gb})"/>`
      );
    }
  }
];

function mountIllusion(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box vx-ill"><p class="vx-text" style="text-align:center">Your eyes will lie to you. 8 rounds.</p></div>' +
    '<div class="vx-opts c3"><button class="vx-opt" type="button" data-v="a" disabled>—</button><button class="vx-opt" type="button" data-v="b" disabled>—</button><button class="vx-opt" type="button" data-v="same" disabled>Same</button></div>' +
    '<p class="msg" aria-live="polite">Trust your measurements, not your eyes.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [roundEl, scoreEl, bestEl] = vxFoot(foot, [['Round', '0 / 8'], ['Score', 0], ['Best', vxBest('illusion') || 0]]);

  const box = $('.vx-box', stage);
  const opts = $('.vx-opts', stage);
  const btns = $$('.vx-opt', stage);
  const msg = $('.msg', stage);
  const nextBtn = $('.pill', stage);
  let order = [];
  let i = 0;
  let score = 0;
  let phase = 'idle';
  let ill = null;
  let truth = 'same';

  function ask() {
    ill = vxIll[order[i]];
    truth = vxPick(['same', 'a', 'b']);
    box.innerHTML = ill.draw(truth, 0.1 + Math.random() * 0.04);
    btns[0].textContent = ill.a;
    btns[1].textContent = ill.b;
    btns.forEach((b) => { b.disabled = false; b.classList.remove('ok', 'no'); });
    roundEl.textContent = (i + 1) + ' / 8';
    msg.textContent = ill.q;
    phase = 'ask';
    nextBtn.hidden = true;
    gsap.fromTo(box, { opacity: 0.2 }, { opacity: 1, duration: 0.35 });
  }

  vxOn(opts, '.vx-opt', (btn) => {
    if (phase !== 'ask') return;
    phase = 'reveal';
    const ok = btn.dataset.v === truth;
    if (ok) score++;
    scoreEl.textContent = score;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.dataset.v === truth) b.classList.add('ok');
      else if (b === btn) b.classList.add('no');
    });
    const guide = $('.vx-guide', box);
    if (guide) gsap.to(guide, { opacity: 1, duration: 0.5 });
    msg.textContent = (ok ? 'Correct. ' : 'Not quite. ') +
      (truth === 'same' ? 'They were identical.' : 'The ' + (truth === 'a' ? ill.a : ill.b).toLowerCase() + ' one was ' + ill.adj + '.');
    nextBtn.hidden = false;
    nextBtn.textContent = i === 7 ? 'See result' : 'Next';
  });

  nextBtn.addEventListener('click', () => {
    if (phase === 'idle' || phase === 'done') {
      order = vxShuffle([0, 1, 2, 3, 0, 1, 2, 3]);
      i = 0;
      score = 0;
      scoreEl.textContent = 0;
      ask();
    } else if (phase === 'reveal') {
      if (i === 7) {
        phase = 'done';
        box.innerHTML = '<p class="vx-big">' + score + ' / 8</p>';
        btns.forEach((b) => { b.disabled = true; b.classList.remove('ok', 'no'); });
        msg.textContent = score >= 7 ? 'Nearly immune.' : score >= 4 ? 'Your brain took the bait sometimes.' : 'Your eyes are very persuasive.';
        if (vxSave('illusion', score)) bestEl.textContent = score;
        nextBtn.textContent = 'Play again';
        vxPop(box);
      } else {
        i++;
        ask();
      }
    }
  });
}

/* ==========================================================
   GAME 19 — FEAR METER (entertainment only)
   ========================================================== */
const vxFearQ = [
  ['You hear a noise downstairs at 3 a.m.', ['Go and check it', 'Listen a minute, then check', 'Text someone, stay put', 'Hide under the blanket']],
  ['You are standing on a high balcony.', ['Totally fine', 'A little tingle', 'Dizzy', 'I need to step back']],
  ['An unknown number calls you.', ['Answer it', 'Let it go to voicemail', 'Search the number first', 'Block it']],
  ['You must speak to 200 people tomorrow.', ['Bring it on', 'Nervous, but fine', 'Rehearse obsessively', 'Hard pass']],
  ['The lights go out in a storm.', ['Candles. Vibes.', 'Find a flashlight', 'Check on everyone', 'Panic a little']],
  ['Deep water. You cannot see the bottom.', ['Dive in', 'Swim cautiously', 'Stay near the edge', 'Not a chance']],
  ['A big life decision with no safe option.', ['Jump', 'List pros and cons', 'Delay it', 'Avoid it']],
  ['You are alone in an empty building at night.', ['Peaceful', 'Slightly aware', 'Keep looking behind me', 'Leave right now']]
];

const vxFearTypes = [
  [20, 'Void Walker', 'Darkness shrugs at you. Quietly unbothered, possibly suspicious.'],
  [40, 'Steady Nerve', 'You feel fear and keep moving. Calm under mild pressure.'],
  [60, 'Cautious Mind', 'A balanced radar. You notice threats early and decide fast.'],
  [80, 'Alert Wire', 'Your instincts run hot. Great at spotting trouble, quick to flinch.'],
  [100, 'Full Alarm', 'Every shadow gets a briefing. Deeply careful, maybe a little tired.']
];

function mountFear(stage, foot) {
  stage.innerHTML =
    '<div class="vx-box"><div class="vx-mid">Answer honestly.<small>8 questions. Entertainment only.</small></div></div>' +
    '<div class="vx-bar"><i></i></div>' +
    '<div class="vx-opts c1" hidden></div>' +
    '<p class="msg" aria-live="polite">Not a psychological assessment. Just for fun.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const last0 = vxBest('fear.last');
  const [qEl, lastEl, peakEl] = vxFoot(foot, [['Question', '0 / 8'], ['Last', last0 === null ? '—' : last0 + '%'], ['Peak', (vxBest('fear') || 0) + '%']]);

  const box = $('.vx-box', stage);
  const fill = $('.vx-bar i', stage);
  const opts = $('.vx-opts', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let i = 0;
  let total = 0;
  let live = false;
  fill.style.transform = 'scaleX(0)';

  function ask() {
    const q = vxFearQ[i];
    box.innerHTML = '<div class="vx-mid">' + q[0] + '</div>';
    opts.innerHTML = q[1].map((o, k) => `<button class="vx-opt" type="button" data-s="${k}">${o}</button>`).join('');
    opts.hidden = false;
    qEl.textContent = (i + 1) + ' / 8';
    gsap.to(fill, { scaleX: i / 8, duration: 0.4 });
    live = true;
  }

  function result() {
    const idx = Math.round((total / (vxFearQ.length * 3)) * 100);
    const type = vxFearTypes.find((t) => idx <= t[0]);
    opts.hidden = true;
    box.innerHTML = '<div><div class="vx-big">' + idx + '%</div><div class="vx-mid" style="margin-top:10px">' + type[1] + '</div><small>' + type[2] + '</small></div>';
    gsap.to(fill, { scaleX: idx / 100, duration: 0.9, ease: 'power3.out' });
    msg.textContent = 'Fear Index — entertainment only, not a diagnosis.';
    qEl.textContent = '8 / 8';
    lastEl.textContent = idx + '%';
    store.set('void.fear.last', idx);
    if (vxSave('fear', idx)) peakEl.textContent = idx + '%';
    startBtn.hidden = false;
    startBtn.textContent = 'Retake';
    vxPop(box);
  }

  vxOn(opts, '.vx-opt', (btn) => {
    if (!live) return;
    live = false;
    total += Number(btn.dataset.s);
    btn.classList.add('ok');
    setTimeout(() => {
      i++;
      if (i >= vxFearQ.length) result();
      else ask();
    }, 260);
  });

  startBtn.addEventListener('click', () => {
    i = 0;
    total = 0;
    startBtn.hidden = true;
    msg.textContent = 'Pick the answer that feels most like you.';
    gsap.set(fill, { scaleX: 0 });
    ask();
  });
}

/* ==========================================================
   GAME 20 — THE FINAL TEST  (memory → reaction → logic)
   ========================================================== */
function mountFinal(stage, foot) {
  stage.innerHTML = '<div class="vx-view"><div class="vx-box"><div class="vx-mid">Three stages.<small>Memory · Reaction · Logic</small></div></div></div><button class="glass pill" type="button">Begin</button>';
  const b0 = vxBest('final');
  const [stageEl, lastEl, bestEl] = vxFoot(foot, [['Stage', '—'], ['Last', '—'], ['Best', b0 === null ? '—' : b0]]);

  const view = $('.vx-view', stage);
  const btn = $('.pill', stage);

  const show = (html) => {
    view.innerHTML = html;
    gsap.from(view, { opacity: 0, y: 10, duration: 0.35 });
  };

  async function banner(n, title, sub) {
    stageEl.textContent = n + ' / 3';
    show('<div class="vx-box"><div class="vx-mid">' + title + '<small>' + sub + '</small></div></div>');
    await wait(1100);
  }

  async function memory() {
    await banner(1, 'Memory', 'Remember the code');
    const code = String(vxRnd(10000, 99999));
    show('<div class="vx-box"><div class="vx-big">' + code + '</div></div><div class="vx-bar"><i></i></div>');
    gsap.fromTo($('.vx-bar i', view), { scaleX: 1 }, { scaleX: 0, duration: 2.2, ease: 'none' });
    await wait(2200);
    show('<div class="vx-box"><div class="vx-big">?</div></div><div class="vx-row"><input class="vx-input" type="text" inputmode="numeric" maxlength="5" autocomplete="off" aria-label="Type the code"><button class="glass pill" type="button">OK</button></div>');
    const input = $('.vx-input', view);
    const ok = $('.pill', view);
    input.focus();
    return new Promise((res) => {
      let fin = false;
      const done = () => {
        if (fin) return;
        fin = true;
        const v = input.value;
        let c = 0;
        for (let k = 0; k < 5; k++) if (v[k] === code[k]) c++;
        res(c * 20);
      };
      ok.addEventListener('click', done);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
      input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, ''); });
    });
  }

  async function reaction() {
    await banner(2, 'Reaction', 'Tap the instant it turns blue');
    show('<button class="rx vx-pad wait" type="button"><span>Wait…</span></button>');
    const pad = $('.rx', view);
    const label = $('span', pad);
    return new Promise((res) => {
      let go = false;
      let fin = false;
      let t0 = 0;
      const timer = setTimeout(() => {
        go = true;
        pad.className = 'rx vx-pad go';
        label.textContent = 'Tap!';
        t0 = performance.now();
      }, 1200 + Math.random() * 2200);
      vxTap(pad, async () => {
        if (fin) return;
        fin = true;
        clearTimeout(timer);
        let sc = 0;
        if (!go) {
          label.innerHTML = 'Too early';
        } else {
          const ms = Math.round(performance.now() - t0);
          sc = Math.max(0, Math.min(100, Math.round(100 * (1 - (ms - 180) / 420))));
          pad.className = 'rx vx-pad';
          label.innerHTML = ms + ' ms';
        }
        await wait(900);
        res(sc);
      });
    });
  }

  async function logic() {
    await banner(3, 'Logic', 'Predict the next number');
    const q = vxSeqQuestion(1);
    show('<div class="vx-box"><div class="vx-num">' + q.shown.join(', ') + ', ?</div></div><div class="vx-bar"><i></i></div><div class="vx-opts">' +
      q.options.map((o) => `<button class="vx-opt" type="button" data-v="${o}">${o}</button>`).join('') + '</div>');
    const t0 = performance.now();
    return new Promise((res) => {
      let fin = false;
      const finish = async (v, pick) => {
        if (fin) return;
        fin = true;
        tw.kill();
        const t = (performance.now() - t0) / 1000;
        const sc = v === q.answer ? Math.round(60 + 40 * Math.max(0, 1 - t / 15)) : 0;
        $$('.vx-opt', view).forEach((b) => {
          b.disabled = true;
          if (Number(b.dataset.v) === q.answer) b.classList.add('ok');
          else if (b === pick) b.classList.add('no');
        });
        await wait(1100);
        res(sc);
      };
      const tw = gsap.fromTo($('.vx-bar i', view), { scaleX: 1 }, { scaleX: 0, duration: 15, ease: 'none', onComplete: () => finish(null, null) });
      vxOn($('.vx-opts', view), '.vx-opt', (b) => finish(Number(b.dataset.v), b));
    });
  }

  async function play() {
    btn.hidden = true;
    const a = await memory();
    const b = await reaction();
    const c = await logic();
    const total = Math.round((a + b + c) / 3);
    const rank = total >= 90 ? 'Void Master' : total >= 75 ? 'Sharp Mind' : total >= 55 ? 'Steady Operator' : total >= 35 ? 'Warming Up' : 'Rest First';
    stageEl.textContent = '—';
    lastEl.textContent = total;
    if (vxSave('final', total)) bestEl.textContent = total;
    show('<div class="vx-box"><div><div class="vx-big">' + total + '</div><div class="vx-mid" style="margin-top:10px">' + rank + '</div><small>Memory ' + a + ' · Reaction ' + b + ' · Logic ' + c + '</small></div></div>');
    vxPop(view);
    btn.hidden = false;
    btn.textContent = 'Play again';
  }

  btn.addEventListener('click', play);
}

/* ==========================================================
   GAME 21 — DECISION LAB
   ========================================================== */
const vxPairs = [
  ['Pizza', 'Burgers'], ['Mountains', 'Beach'], ['Past', 'Future'], ['Save', 'Spend'], ['Night', 'Morning'],
  ['Cats', 'Dogs'], ['Fame', 'Fortune'], ['Calm', 'Chaos'], ['Plan', 'Improvise'], ['Truth', 'Comfort'],
  ['Coffee', 'Tea'], ['Fly', 'Invisible'], ['Read minds', 'Rewind time'], ['City', 'Countryside']
];

function mountDecision(stage, foot) {
  const ROUNDS = 8;
  const LIMIT = 6000;
  stage.innerHTML =
    '<div class="vx-box vx-sm"><div class="vx-mid">Choose between two options.<small>Go with your gut.</small></div></div>' +
    '<div class="vx-bar" style="visibility:hidden"><i></i></div>' +
    '<div class="vx-opts"><button class="vx-opt vx-lg" type="button" data-k="0" disabled>—</button><button class="vx-opt vx-lg" type="button" data-k="1" disabled>—</button></div>' +
    '<p class="msg" aria-live="polite">8 choices. Your speed is the score.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const b0 = vxBest('decision');
  const [roundEl, avgEl, bestEl] = vxFoot(foot, [['Round', '0 / ' + ROUNDS], ['Avg', '—'], ['Best', b0 === null ? '—' : b0 + ' ms']]);

  const box = $('.vx-box', stage);
  const bar = $('.vx-bar', stage);
  const fill = $('i', bar);
  const opts = $('.vx-opts', stage);
  const btns = $$('.vx-opt', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let order = [];
  let i = 0;
  let times = [];
  let t0 = 0;
  let live = false;
  let tw = null;

  function ask() {
    const pair = vxShuffle(order[i]);
    btns.forEach((b, k) => { b.textContent = pair[k]; b.disabled = false; b.classList.remove('ok', 'no'); });
    box.innerHTML = '<div class="vx-mid">Which one?</div>';
    roundEl.textContent = (i + 1) + ' / ' + ROUNDS;
    bar.style.visibility = 'visible';
    live = true;
    t0 = performance.now();
    tw = gsap.fromTo(fill, { scaleX: 1 }, { scaleX: 0, duration: LIMIT / 1000, ease: 'none', onComplete: () => pick(-1) });
  }

  function pick(k) {
    if (!live) return;
    live = false;
    if (tw) tw.kill();
    const ms = k < 0 ? LIMIT : Math.round(performance.now() - t0);
    times.push(ms);
    btns.forEach((b) => { b.disabled = true; });
    if (k >= 0) btns[k].classList.add('ok');
    avgEl.textContent = Math.round(times.reduce((a, b) => a + b, 0) / times.length) + ' ms';
    if (i + 1 >= ROUNDS) setTimeout(result, 450);
    else setTimeout(() => { i++; ask(); }, 450);
  }

  function result() {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const profile = avg < 900 ? 'Pure Instinct' : avg < 1500 ? 'Decisive' : avg < 2500 ? 'Thoughtful' : 'Overthinker';
    bar.style.visibility = 'hidden';
    box.innerHTML = '<div><div class="vx-big">' + avg + '<span style="font-size:.4em"> ms</span></div><div class="vx-mid" style="margin-top:10px">' + profile + '</div><small>Fastest ' + Math.min.apply(null, times) + ' ms · slowest ' + Math.max.apply(null, times) + ' ms</small></div>';
    btns.forEach((b) => { b.textContent = '—'; b.classList.remove('ok'); b.disabled = true; });
    msg.textContent = 'Average decision time across ' + ROUNDS + ' choices.';
    if (vxSave('decision', avg, true)) bestEl.textContent = avg + ' ms';
    startBtn.textContent = 'Play again';
    vxPop(box);
  }

  vxOn(opts, '.vx-opt', (b) => pick(Number(b.dataset.k)));

  startBtn.addEventListener('click', () => {
    if (tw) tw.kill();
    order = vxShuffle(vxPairs).slice(0, ROUNDS);
    i = 0;
    times = [];
    avgEl.textContent = '—';
    startBtn.textContent = 'Restart';
    msg.textContent = 'Pick fast. Gut first.';
    ask();
  });
}

/* ==========================================================
   GAME 22 — OBSERVATION RACE
   ========================================================== */
function mountObserve(stage, foot) {
  stage.innerHTML =
    '<div class="vx-grid"></div>' +
    '<p class="msg" aria-live="polite">One tile glows slightly. Find it. Misses cost 1 second.</p>' +
    '<button class="glass pill" type="button">Start</button>';
  const [scoreEl, timeEl, bestEl] = vxFoot(foot, [['Found', 0], ['Time', '30.0s'], ['Best', vxBest('observe') || 0]]);

  const grid = $('.vx-grid', stage);
  const msg = $('.msg', stage);
  const startBtn = $('.pill', stage);
  let score = 0;
  let hl = -1;
  const clock = vxClock(30000, (l) => { timeEl.textContent = vxSec(l); }, finish);
  vxIdleGrid(grid, 3);

  function build() {
    const n = Math.min(6, 3 + Math.floor(score / 4));
    const alpha = Math.max(0.12, 0.5 - score * 0.03);
    let k;
    do k = vxRnd(0, n * n - 1); while (k === hl && n * n > 1);
    hl = k;
    grid.style.setProperty('--n', n);
    grid.innerHTML = Array.from({ length: n * n }, (_, i) =>
      `<button class="vx-cell${i === hl ? ' hl' : ''}" type="button"${i === hl ? ` style="--hl:${alpha.toFixed(2)}"` : ''} aria-label="Tile ${i + 1}"></button>`).join('');
  }

  function finish() {
    vxIdleGrid(grid, 3);
    hl = -1;
    msg.textContent = 'Time. You spotted ' + score + '.';
    startBtn.textContent = 'Play again';
    if (vxSave('observe', score)) bestEl.textContent = score;
  }

  startBtn.addEventListener('click', () => {
    score = 0;
    hl = -1;
    scoreEl.textContent = 0;
    msg.textContent = 'Find the glowing tile.';
    startBtn.textContent = 'Restart';
    clock.start();
    build();
  });

  vxOn(grid, '.vx-cell', (cell) => {
    if (!clock.on) return;
    if (cell.classList.contains('hl')) {
      score++;
      scoreEl.textContent = score;
      build();
    } else {
      clock.add(-1000);
      vxShake(cell);
    }
  });
}

/* ==========================================================
   GAME 23 — REVERSE REACTION
   ========================================================== */
function mountReverse(stage, foot) {
  stage.innerHTML =
    '<button class="rx vx-pad" type="button"><span>Start<small>Tap only when the blue disappears</small></span></button>' +
    '<p class="msg" aria-live="polite">Watch the signal. React when it vanishes.</p>';
  const b0 = vxBest('reverse');
  const [lastEl, bestEl] = vxFoot(foot, [['Last', '—'], ['Best', b0 === null ? '—' : b0 + ' ms']]);

  const pad = $('.rx', stage);
  const label = $('span', pad);
  let state = 'idle';
  let timer = null;
  let t0 = 0;

  vxTap(pad, () => {
    if (state === 'idle') {
      state = 'lit';
      pad.className = 'rx vx-pad go';
      label.textContent = 'Hold…';
      timer = setTimeout(() => {
        state = 'dark';
        pad.className = 'rx vx-pad wait';
        label.textContent = '';
        t0 = performance.now();
      }, 1500 + Math.random() * 2800);
    } else if (state === 'lit') {
      clearTimeout(timer);
      state = 'idle';
      pad.className = 'rx vx-pad';
      label.innerHTML = 'Too early<small>It was still on. Tap to retry</small>';
      vxShake(pad);
    } else {
      const ms = Math.round(performance.now() - t0);
      state = 'idle';
      pad.className = 'rx vx-pad';
      label.innerHTML = ms + ' ms<small>Tap to try again</small>';
      lastEl.textContent = ms + ' ms';
      if (vxSave('reverse', ms, true)) bestEl.textContent = ms + ' ms';
      vxPop(pad);
    }
  });
}
