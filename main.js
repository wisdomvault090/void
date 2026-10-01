/* ==========================================================
   VOID — main.js
   Games + navigation + CTA
   ========================================================== */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);


/* ==========================================================
   UTILITIES
   ========================================================== */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

const wait = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

const RM =
  window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;


/* ==========================================================
   LOCAL STORAGE
   ========================================================== */

const store = {

  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

};


/* ==========================================================
   SMOOTH SCROLL
   ========================================================== */

function goTo(target) {

  const element =
    typeof target === 'string'
      ? document.querySelector(target)
      : target;

  if (!element) return;

  const y =
    element.getBoundingClientRect().top +
    window.scrollY;

  gsap.to(window, {

    duration:
      RM ? 0 : 0.85,

    scrollTo: {
      y: y,
      autoKill: false
    },

    ease:
      'power3.inOut',

    overwrite:
      true

  });

}


/* ==========================================================
   GAME REGISTRY
   ========================================================== */

const GAMES = [

  {
    id: 'reaction',
    title: 'Reaction Test',
    desc: 'Wait for blue, then tap as fast as you can.',
    mount: mountReaction
  },

  {
    id: 'memory',
    title: 'Memory Challenge',
    desc: 'Watch the pattern. Repeat it. It grows every round.',
    mount: mountMemory
  },

  {
    id: 'impossible',
    title: 'Impossible Button',
    desc: 'Press the button. It would rather you didn’t.',
    mount: mountImpossible
  },

  {
    id: 'soon1',
    title: 'Coming soon',
    desc: 'A new challenge is being built.'
  },

  {
    id: 'soon2',
    title: 'Coming soon',
    desc: 'Another one is on the way.'
  }

];


/* =========================================================
   FEED / GAME REVEALS
   ========================================================= */

const animationFeed =
  document.getElementById("feed");

if (animationFeed) {

  const revealItems =
    animationFeed.children;

  Array.from(revealItems).forEach(
    item => {

      gsap.fromTo(
        item,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            once: true
          }
        }
      );

    }
  );
}

/* ==========================================================
   CTA
   ========================================================== */

const cta =
  $('#cta');


if (cta) {

  cta.addEventListener(
    'click',
    () => {

      goTo(
        '#g-' +
        GAMES[0].id
      );

    }
  );

}


/* ==========================================================
   NAVIGATION DOTS
   ========================================================== */

const dotsNav =
  $('#dots');

const sections =
  [
    $('#top'),
    ...$$('.game')
  ];


sections.forEach(
  (section, index) => {

    const button =
      document.createElement('button');

    button.type =
      'button';


    button.setAttribute(
      'aria-label',

      index === 0
        ? 'Go to top'
        : 'Go to ' +
          GAMES[index - 1].title
    );


    button.innerHTML =
      '<i></i>';


    button.addEventListener(
      'click',
      () => goTo(section)
    );


    dotsNav.appendChild(button);

  }
);


/* ==========================================================
   GAME 1 — REACTION TEST
   ========================================================== */

function mountReaction(stage, foot) {

  stage.innerHTML = `

    <button
      class="rx"
      type="button"
    >

      <span>
        Start

        <small>
          Tap the circle
        </small>

      </span>

    </button>

  `;


  foot.innerHTML = `

    <span>
      Last
      <b id="rx-last">—</b>
    </span>

    <span>
      Best
      <b id="rx-best">—</b>
    </span>

  `;


  const pad =
    $('.rx', stage);

  const label =
    $('span', pad);

  const lastEl =
    $('#rx-last', foot);

  const bestEl =
    $('#rx-best', foot);


  let state =
    'idle';

  let startTime =
    0;

  let timer =
    null;


  let best =
    Number(
      store.get('void.rx')
    ) || 0;


  if (best) {

    bestEl.textContent =
      best + ' ms';

  }


  pad.addEventListener(
    'pointerdown',
    (event) => {

      event.preventDefault();


      /* START */

      if (state === 'idle') {

        state =
          'wait';


        pad.className =
          'rx wait';


        label.innerHTML =
          'Wait…';


        timer =
          setTimeout(
            () => {

              state =
                'go';


              pad.className =
                'rx go';


              label.textContent =
                'Tap!';


              startTime =
                performance.now();

            },

            1300 +
            Math.random() *
            2800

          );


        return;

      }


      /* TOO EARLY */

      if (state === 'wait') {

        clearTimeout(timer);


        state =
          'idle';


        pad.className =
          'rx';


        label.innerHTML =
          'Too early<small>Tap to try again</small>';


        gsap.fromTo(
          pad,

          {
            x: -10
          },

          {
            x: 0,
            duration: 0.6,
            ease: 'elastic.out(1,.3)'
          }
        );


        return;

      }


      /* RESULT */

      const ms =
        Math.round(
          performance.now() -
          startTime
        );


      state =
        'idle';


      pad.className =
        'rx';


      label.innerHTML =
        `${ms} ms<small>Tap to try again</small>`;


      lastEl.textContent =
        ms + ' ms';


      if (!best || ms < best) {

        best =
          ms;

        store.set(
          'void.rx',
          ms
        );

        bestEl.textContent =
          ms + ' ms';

      }


      gsap.fromTo(

        pad,

        {
          scale: 0.94
        },

        {
          scale: 1,
          duration: 0.8,
          ease: 'elastic.out(1,.4)'
        }

      );

    }
  );

}


/* ==========================================================
   GAME 2 — MEMORY
   ========================================================== */

function mountMemory(stage, foot) {

  stage.innerHTML = `

    <div class="mem">

      ${

        [0, 1, 2, 3]

          .map(
            i => `

              <button
                class="tile"
                type="button"
                aria-label="Tile ${i + 1}"
              ></button>

            `
          )

          .join('')

      }

    </div>


    <button
      class="glass pill"
      type="button"
    >
      Start
    </button>

  `;


  foot.innerHTML = `

    <span>
      Round
      <b id="mem-round">0</b>
    </span>

    <span>
      Best
      <b id="mem-best">0</b>
    </span>

  `;


  const tiles =
    $$('.tile', stage);

  const startBtn =
    $('.pill', stage);

  const board =
    $('.mem', stage);

  const roundEl =
    $('#mem-round', foot);

  const bestEl =
    $('#mem-best', foot);


  let sequence =
    [];

  let position =
    0;

  let busy =
    true;


  let best =
    Number(
      store.get('void.mem')
    ) || 0;


  bestEl.textContent =
    best;


  function flash(index) {

    tiles[index]
      .classList.add('on');


    setTimeout(
      () => {

        tiles[index]
          .classList.remove('on');

      },

      340
    );

  }


  async function nextRound() {

    sequence.push(
      Math.floor(
        Math.random() * 4
      )
    );


    roundEl.textContent =
      sequence.length;


    busy =
      true;


    position =
      0;


    for (
      const index
      of sequence
    ) {

      await wait(560);

      flash(index);

    }


    await wait(300);


    busy =
      false;

  }


  startBtn.addEventListener(
    'click',
    () => {

      sequence =
        [];

      startBtn.textContent =
        'Restart';

      nextRound();

    }
  );


  tiles.forEach(
    (tile, index) => {

      tile.addEventListener(
        'pointerdown',
        (event) => {

          event.preventDefault();


          if (busy)
            return;


          flash(index);


          if (
            index ===
            sequence[position]
          ) {

            position++;


            if (
              position ===
              sequence.length
            ) {

              busy =
                true;


              const round =
                sequence.length;


              if (round > best) {

                best =
                  round;


                store.set(
                  'void.mem',
                  round
                );


                bestEl.textContent =
                  best;

              }


              setTimeout(
                nextRound,
                800
              );

            }

          } else {

            busy =
              true;


            sequence =
              [];


            startBtn.textContent =
              'Try again';


            roundEl.textContent =
              0;


            gsap.fromTo(

              board,

              {
                x: -10
              },

              {
                x: 0,
                duration: 0.6,
                ease: 'elastic.out(1,.3)'
              }

            );

          }

        }
      );

    }
  );

}


/* ==========================================================
   GAME 3 — IMPOSSIBLE BUTTON
   ========================================================== */

function mountImpossible(stage, foot) {

  stage.innerHTML = `

    <div class="zone">

      <button
        class="imp"
        type="button"
      >
        Press me
      </button>

    </div>


    <p
      class="msg"
      aria-live="polite"
    >
      Go on. Try.
    </p>

  `;


  foot.innerHTML = `

    <span>
      Dodges
      <b id="imp-count">0</b>
    </span>

    <span>
      Status
      <b id="imp-status">
        Impossible
      </b>
    </span>

  `;


  const zone =
    $('.zone', stage);

  const button =
    $('.imp', stage);

  const message =
    $('.msg', stage);

  const countEl =
    $('#imp-count', foot);

  const statusEl =
    $('#imp-status', foot);


  const MAX_DODGES =
    10;


  const lines = [

    'Nope.',
    'Too slow.',
    'Not today.',
    'Almost. Not really.',
    'Nice try.',
    'Still no.',
    'Getting tired of this?'

  ];


  let dodges =
    0;

  let yielded =
    false;


  function dodge(event) {

    if (yielded)
      return;


    event.preventDefault();


    dodges++;


    countEl.textContent =
      dodges;


    if (
      dodges >=
      MAX_DODGES
    ) {

      yielded =
        true;


      statusEl.textContent =
        'Possible';


      button.textContent =
        'Fine. Press it.';


      message.textContent =
        'It gave up.';


      gsap.to(
        button,
        {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'power3.out'
        }
      );


      return;

    }


    const maxX =
      (
        zone.clientWidth -
        button.offsetWidth
      ) / 2;


    const maxY =
      (
        zone.clientHeight -
        button.offsetHeight
      ) / 2;


    gsap.to(
      button,
      {

        x:
          gsap.utils.random(
            -maxX,
            maxX
          ),

        y:
          gsap.utils.random(
            -maxY,
            maxY
          ),

        duration:
          0.35,

        ease:
          'power3.out'

      }
    );


    message.textContent =
      lines[
        dodges %
        lines.length
      ];

  }


  button.addEventListener(
    'pointerenter',
    event => {

      if (
        event.pointerType ===
        'mouse'
      ) {

        dodge(event);

      }

    }
  );


  button.addEventListener(
    'pointerdown',
    event => {

      if (
        event.pointerType !==
        'mouse'
      ) {

        dodge(event);

      }

    }
  );


  button.addEventListener(
    'click',
    () => {

      if (!yielded)
        return;


      message.textContent =
        'You did it. It let you.';


      gsap.fromTo(

        button,

        {
          scale: 0.9
        },

        {
          scale: 1,
          duration: 0.8,
          ease: 'elastic.out(1,.4)'
        }

      );

    }
  );

}


/* ==========================================================
   INITIAL NAV STATE
   ========================================================== */

const firstDot =
  $('#dots button');


if (firstDot) {

  firstDot.classList.add('on');

}


/* ==========================================================
   KEYBOARD NAVIGATION
   ========================================================== */

window.addEventListener(
  'keydown',
  event => {

    if (
      event.key !==
      'Escape'
    ) {

      return;

    }


    /* Escape returns to hero */

    goTo('#top');

  }
);


/* ==========================================================
   PREVENT ACCIDENTAL DOUBLE-TAP ZOOM
   ========================================================== */

document.addEventListener(
  'dblclick',
  event => {

    if (
      event.target.closest(
        'button'
      )
    ) {

      event.preventDefault();

    }

  }
);
