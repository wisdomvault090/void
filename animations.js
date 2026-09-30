/* ==========================================================
   VOID — animations.js
   FUTURISTIC 3D HUMANOID ROBOT
   Three.js + GSAP
   ========================================================== */

const canvas = $('#robotCanvas');
const robotContainer = $('#robot');

let robotScene;
let robotCamera;
let robotRenderer;
let robotRoot;

let robotHead;
let robotNeck;
let robotTorso;

let leftShoulder;
let rightShoulder;
let leftArm;
let rightArm;

let leftForearm;
let rightForearm;

let leftHand;
let rightHand;

let visor;
let reactor;

let robotReady = false;


/* ==========================================================
   MATERIALS
   ========================================================== */

function createRobotMaterials() {

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x111318,
    metalness: 0.92,
    roughness: 0.24
  });

  const blackMetal = new THREE.MeshStandardMaterial({
    color: 0x050609,
    metalness: 0.96,
    roughness: 0.18
  });

  const silverMetal = new THREE.MeshStandardMaterial({
    color: 0x444b55,
    metalness: 0.95,
    roughness: 0.2
  });

  const blueGlow = new THREE.MeshStandardMaterial({
    color: 0x0a5cff,
    emissive: 0x0066ff,
    emissiveIntensity: 4,
    metalness: 0.2,
    roughness: 0.15
  });

  const whiteGlow = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 3,
    metalness: 0.1,
    roughness: 0.15
  });

  return {
    darkMetal,
    blackMetal,
    silverMetal,
    blueGlow,
    whiteGlow
  };
}


/* ==========================================================
   BASIC PART HELPERS
   ========================================================== */

function box(w, h, d, material) {

  const geometry = new THREE.BoxGeometry(w, h, d);

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  return mesh;
}


function sphere(radius, material, segments = 20) {

  const geometry = new THREE.SphereGeometry(
    radius,
    segments,
    segments
  );

  return new THREE.Mesh(
    geometry,
    material
  );
}


function cylinder(radiusTop, radiusBottom, height, material, segments = 20) {

  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    segments
  );

  return new THREE.Mesh(
    geometry,
    material
  );
}


/* ==========================================================
   JOINT
   ========================================================== */

function makeJoint(materials) {

  const joint = new THREE.Group();

  const outer = sphere(
    0.25,
    materials.blackMetal,
    18
  );

  joint.add(outer);

  const glow = sphere(
    0.12,
    materials.blueGlow,
    16
  );

  joint.add(glow);

  return joint;
}


/* ==========================================================
   ARM
   ========================================================== */

function makeArm(side, materials) {

  const shoulder = new THREE.Group();

  const upper = new THREE.Group();
  const lower = new THREE.Group();
  const hand = new THREE.Group();

  const upperArmor = box(
    0.58,
    1.25,
    0.62,
    materials.darkMetal
  );

  upperArmor.position.y = -0.62;

  upper.add(upperArmor);


  /* armor highlight */

  const upperPanel = box(
    0.38,
    0.82,
    0.035,
    materials.silverMetal
  );

  upperPanel.position.set(
    0,
    -0.58,
    0.325
  );

  upper.add(upperPanel);


  /* elbow */

  const elbow = makeJoint(materials);

  elbow.position.y = -1.28;

  upper.add(elbow);


  const forearmArmor = box(
    0.52,
    1.15,
    0.56,
    materials.blackMetal
  );

  forearmArmor.position.y = -0.58;

  lower.add(forearmArmor);


  /* forearm energy strip */

  const energy = box(
    0.08,
    0.72,
    0.035,
    materials.blueGlow
  );

  energy.position.set(
    0,
    -0.56,
    0.30
  );

  lower.add(energy);


  /* wrist */

  const wrist = makeJoint(materials);

  wrist.position.y = -1.18;

  lower.add(wrist);


  /* palm */

  const palm = box(
    0.5,
    0.52,
    0.35,
    materials.darkMetal
  );

  palm.position.y = -0.30;

  hand.add(palm);


  /* fingers */

  for (let i = -1; i <= 1; i++) {

    const finger = box(
      0.11,
      0.42,
      0.16,
      materials.blackMetal
    );

    finger.position.set(
      i * 0.14,
      -0.67,
      0
    );

    finger.rotation.x = 0.12;

    hand.add(finger);
  }


  /* thumb */

  const thumb = box(
    0.13,
    0.32,
    0.16,
    materials.blackMetal
  );

  thumb.position.set(
    side === 'left' ? 0.30 : -0.30,
    -0.36,
    0
  );

  thumb.rotation.z =
    side === 'left'
      ? -0.55
      : 0.55;

  hand.add(thumb);


  shoulder.add(upper);

  upper.add(lower);

  lower.add(hand);

  return {
    shoulder,
    upper,
    lower,
    hand
  };
}


/* ==========================================================
   HEAD
   ========================================================== */

function makeHead(materials) {

  const head = new THREE.Group();

  const skull = box(
    1.62,
    1.55,
    1.38,
    materials.blackMetal
  );

  skull.position.y = 0;

  head.add(skull);


  /* jaw */

  const jaw = box(
    1.28,
    0.48,
    1.12,
    materials.darkMetal
  );

  jaw.position.set(
    0,
    -0.68,
    0
  );

  head.add(jaw);


  /* visor */

  const visorGeometry =
    new THREE.BoxGeometry(
      1.28,
      0.32,
      0.08
    );

  visor = new THREE.Mesh(
    visorGeometry,
    materials.blueGlow
  );

  visor.position.set(
    0,
    0.08,
    0.71
  );

  head.add(visor);


  /* side plates */

  const sideL = box(
    0.18,
    0.78,
    0.9,
    materials.silverMetal
  );

  sideL.position.set(
    -0.86,
    0,
    0
  );

  head.add(sideL);


  const sideR = sideL.clone();

  sideR.position.x = 0.86;

  head.add(sideR);


  /* top antenna */

  const antenna = cylinder(
    0.055,
    0.055,
    0.35,
    materials.silverMetal,
    10
  );

  antenna.position.y = 0.92;

  head.add(antenna);


  const antennaLight = sphere(
    0.09,
    materials.blueGlow,
    12
  );

  antennaLight.position.y = 1.12;

  head.add(antennaLight);


  return head;
}


/* ==========================================================
   TORSO
   ========================================================== */

function makeTorso(materials) {

  const torso = new THREE.Group();


  /* main chest */

  const chest = box(
    2.55,
    2.55,
    1.22,
    materials.darkMetal
  );

  chest.position.y = 0;

  torso.add(chest);


  /* shoulder armor */

  const shoulderBar = box(
    3.05,
    0.42,
    1.28,
    materials.blackMetal
  );

  shoulderBar.position.y = 1.02;

  torso.add(shoulderBar);


  /* central chest plate */

  const chestPlate = box(
    1.48,
    1.38,
    0.12,
    materials.silverMetal
  );

  chestPlate.position.set(
    0,
    0.22,
    0.66
  );

  torso.add(chestPlate);


  /* blue chest core */

  const coreOuter = sphere(
    0.42,
    materials.blackMetal,
    24
  );

  coreOuter.position.set(
    0,
    0.22,
    0.78
  );

  torso.add(coreOuter);


  reactor = sphere(
    0.23,
    materials.blueGlow,
    24
  );

  reactor.position.set(
    0,
    0.22,
    0.99
  );

  torso.add(reactor);


  /* abdominal plates */

  for (let i = 0; i < 3; i++) {

    const plate = box(
      1.5 - i * 0.08,
      0.32,
      0.9,
      materials.blackMetal
    );

    plate.position.set(
      0,
      -0.78 - i * 0.34,
      0.1
    );

    torso.add(plate);
  }


  return torso;
}


/* ==========================================================
   LEGS
   ========================================================== */

function makeLeg(side, materials) {

  const leg = new THREE.Group();

  const thigh = box(
    0.78,
    1.45,
    0.78,
    materials.darkMetal
  );

  thigh.position.y = -0.75;

  leg.add(thigh);


  const knee = makeJoint(materials);

  knee.position.y = -1.52;

  leg.add(knee);


  const shin = box(
    0.68,
    1.55,
    0.68,
    materials.blackMetal
  );

  shin.position.y = -2.30;

  leg.add(shin);


  const foot = box(
    0.84,
    0.42,
    1.38,
    materials.darkMetal
  );

  foot.position.set(
    0,
    -3.18,
    0.22
  );

  leg.add(foot);


  return leg;
}


/* ==========================================================
   BUILD ROBOT
   ========================================================== */

function buildRobot() {

  const materials = createRobotMaterials();

  robotRoot = new THREE.Group();

  robotRoot.scale.set(
    1.05,
    1.05,
    1.05
  );


  /* torso */

  robotTorso = makeTorso(materials);

  robotTorso.position.y = 1.9;

  robotRoot.add(robotTorso);


  /* neck */

  robotNeck = cylinder(
    0.32,
    0.38,
    0.48,
    materials.blackMetal,
    20
  );

  robotNeck.position.y = 3.45;

  robotRoot.add(robotNeck);


  /* head */

  robotHead = makeHead(materials);

  robotHead.position.y = 4.35;

  robotRoot.add(robotHead);


  /* arms */

  const left = makeArm(
    'left',
    materials
  );

  const right = makeArm(
    'right',
    materials
  );


  leftShoulder = left.shoulder;
  rightShoulder = right.shoulder;

  leftArm = left.upper;
  rightArm = right.upper;

  leftForearm = left.lower;
  rightForearm = right.lower;

  leftHand = left.hand;
  rightHand = right.hand;


  leftShoulder.position.set(
    -1.63,
    2.78,
    0
  );

  rightShoulder.position.set(
    1.63,
    2.78,
    0
  );


  robotRoot.add(leftShoulder);
  robotRoot.add(rightShoulder);


  /* legs */

  const leftLeg =
    makeLeg('left', materials);

  const rightLeg =
    makeLeg('right', materials);


  leftLeg.position.set(
    -0.72,
    0.55,
    0
  );

  rightLeg.position.set(
    0.72,
    0.55,
    0
  );


  robotRoot.add(leftLeg);
  robotRoot.add(rightLeg);


  robotScene.add(robotRoot);
}


/* ==========================================================
   THREE.JS SCENE
   ========================================================== */

function initRobot() {

  if (!canvas || !robotContainer) return;

  robotScene = new THREE.Scene();


  /* camera */

  robotCamera =
    new THREE.PerspectiveCamera(
      34,
      robotContainer.clientWidth /
      robotContainer.clientHeight,
      0.1,
      100
    );

  robotCamera.position.set(
    0,
    1.7,
    12
  );


  /* renderer */

  robotRenderer =
    new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });


  robotRenderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 700 ? 1.2 : 1.6
    )
  );


  robotRenderer.setSize(
    robotContainer.clientWidth,
    robotContainer.clientHeight,
    false
  );


  /* lighting */

  const ambient =
    new THREE.AmbientLight(
      0xffffff,
      1.25
    );

  robotScene.add(ambient);


  const blueLight =
    new THREE.PointLight(
      0x006eff,
      5,
      10
    );

  blueLight.position.set(
    -3,
    4,
    5
  );

  robotScene.add(blueLight);


  const whiteLight =
    new THREE.PointLight(
      0xffffff,
      3,
      9
    );

  whiteLight.position.set(
    3,
    5,
    4
  );

  robotScene.add(whiteLight);


  const rimLight =
    new THREE.PointLight(
      0x0066ff,
      4,
      8
    );

  rimLight.position.set(
    0,
    2,
    -4
  );

  robotScene.add(rimLight);


  buildRobot();

  robotReady = true;

  resizeRobot();

  animateRobot();
}


/* ==========================================================
   RESIZE
   ========================================================== */

function resizeRobot() {

  if (!robotReady) return;

  const width =
    robotContainer.clientWidth;

  const height =
    robotContainer.clientHeight;

  robotCamera.aspect =
    width / height;

  robotCamera.updateProjectionMatrix();


  robotRenderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 700 ? 1.2 : 1.6
    )
  );


  robotRenderer.setSize(
    width,
    height,
    false
  );
}


window.addEventListener(
  'resize',
  resizeRobot
);


/* ==========================================================
   MOUSE TRACKING
   ========================================================== */

let mouseX = 0;
let mouseY = 0;

let targetX = 0;
let targetY = 0;


window.addEventListener(
  'pointermove',
  (e) => {

    mouseX =
      (e.clientX /
      window.innerWidth - 0.5) * 2;

    mouseY =
      (e.clientY /
      window.innerHeight - 0.5) * 2;

  },
  { passive: true }
);


/* ==========================================================
   ROBOT ANIMATION LOOP
   ========================================================== */

function animateRobot(time = 0) {

  requestAnimationFrame(
    animateRobot
  );

  if (!robotReady) return;


  const t =
    time * 0.001;


  /* smooth mouse */

  targetX +=
    (mouseX - targetX) * 0.045;

  targetY +=
    (mouseY - targetY) * 0.045;


  /* whole robot tracking */

  robotRoot.rotation.y =
    targetX * 0.22;

  robotRoot.rotation.x =
    targetY * 0.055;


  /* head independently tracks cursor */

  robotHead.rotation.y =
    targetX * 0.32;

  robotHead.rotation.x =
    targetY * 0.16;


  /* neck */

  robotNeck.rotation.y =
    targetX * 0.18;


  /* shoulders follow slightly */

  leftShoulder.rotation.z =
    -0.08 -
    targetX * 0.06;

  rightShoulder.rotation.z =
    0.08 -
    targetX * 0.06;


  /* arms idle movement */

  leftArm.rotation.z =
    Math.sin(t * 1.1) * 0.035;

  rightArm.rotation.z =
    -Math.sin(t * 1.1) * 0.035;


  /* forearms */

  leftForearm.rotation.z =
    Math.sin(t * 1.4 + 1) * 0.055;

  rightForearm.rotation.z =
    Math.sin(t * 1.3 + 2) * 0.055;


  /* hands subtly react */

  leftHand.rotation.z =
    Math.sin(t * 1.7) * 0.06;

  rightHand.rotation.z =
    Math.sin(t * 1.5 + 1) * 0.06;


  /* breathing */

  const breathing =
    1 +
    Math.sin(t * 1.7) * 0.008;

  robotTorso.scale.y =
    breathing;


  /* floating */

  robotRoot.position.y =
    Math.sin(t * 0.75) * 0.06;


  /* reactor pulse */

  if (reactor) {

    const pulse =
      1 +
      Math.sin(t * 3.2) * 0.12;

    reactor.scale.setScalar(
      pulse
    );
  }


  /* visor pulse */

  if (visor) {

    visor.material.emissiveIntensity =
      3.4 +
      Math.sin(t * 2.5) * 0.7;
  }


  robotRenderer.render(
    robotScene,
    robotCamera
  );
}


/* ==========================================================
   START
   ========================================================== */

if (window.THREE) {
  initRobot();
}


/* ==========================================================
   HERO PARTICLES
   ========================================================== */

const fx =
  $('#fx');

const ctx =
  fx.getContext('2d');

let cw = 0;
let ch = 0;
let dpr = 1;

let heroVisible = true;

let lastWidth =
  innerWidth;


function sizeCanvas() {

  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      1.5
    );

  cw =
    fx.width =
    innerWidth * dpr;

  ch =
    fx.height =
    $('.hero').offsetHeight * dpr;
}


sizeCanvas();


window.addEventListener(
  'resize',
  () => {

    if (innerWidth !== lastWidth) {

      lastWidth =
        innerWidth;

      sizeCanvas();
    }

  }
);


const particles =
  Array.from(
    {
      length:
        innerWidth < 700
          ? 30
          : 65
    },
    () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      v: Math.random() * 0.0012 + 0.0003,
      a: Math.random() * 0.5 + 0.2,
      p: Math.random() * 6
    })
  );


if (!RM) {

  requestAnimationFrame(
    function draw(t) {

      if (heroVisible) {

        ctx.clearRect(
          0,
          0,
          cw,
          ch
        );

        ctx.fillStyle =
          '#ffffff';

        for (const p of particles) {

          p.y -=
            p.v * 0.16;

          if (p.y < 0)
            p.y = 1;

          ctx.globalAlpha =
            p.a *
            (
              0.55 +
              0.45 *
              Math.sin(
                t / 1400 + p.p
              )
            );

          ctx.beginPath();

          ctx.arc(
            (
              p.x +
              Math.sin(
                t / 4000 + p.p
              ) * 0.012
            ) * cw,

            p.y * ch,

            p.r * dpr,

            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      }

      requestAnimationFrame(draw);
    }
  );
}


/* ==========================================================
   HERO VISIBILITY
   ========================================================== */

ScrollTrigger.create({

  trigger: '.hero',

  start: 'top top',

  end: 'bottom top',

  onToggle: (self) => {

    heroVisible =
      self.isActive;

  }

});


/* ==========================================================
   INTRO
   ========================================================== */

if (!RM) {

  gsap.timeline({
    defaults: {
      ease: 'power3.out'
    }
  })

  .from('#robot', {
    opacity: 0,
    filter: 'blur(20px)',
    scale: 0.9,
    duration: 1.8
  })

  .from('.ch', {
    opacity: 0,
    y: 50,
    filter: 'blur(14px)',
    stagger: 0.09,
    duration: 1.1
  }, '-=0.8')

  .from('.sub, .tiny', {
    opacity: 0,
    y: 14,
    filter: 'blur(8px)',
    stagger: 0.12,
    duration: 0.9
  }, '-=0.6')

  .from('.cta', {
    opacity: 0,
    y: 20,
    scale: 0.9,
    duration: 0.9
  }, '-=0.6');


  /* hero parallax */

  gsap.to('#wrap', {

    yPercent: -10,

    opacity: 0.15,

    ease: 'none',

    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }

  });

}


/* ==========================================================
   CTA GLASS REFLECTION
   ========================================================== */



cta.addEventListener(
  'pointermove',
  (e) => {

    const r =
      cta.getBoundingClientRect();

    cta.style.setProperty(
      '--mx',
      (
        (e.clientX - r.left) /
        r.width
      ) * 100 + '%'
    );

    cta.style.setProperty(
      '--my',
      (
        (e.clientY - r.top) /
        r.height
      ) * 100 + '%'
    );

  }
);


cta.addEventListener(
  'pointerdown',
  () =>
    gsap.to(
      cta,
      {
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.out'
      }
    )
);


[
  'pointerup',
  'pointerleave',
  'pointercancel'
].forEach(
  (evt) =>

    cta.addEventListener(
      evt,
      () =>
        gsap.to(
          cta,
          {
            scale: 1,
            duration: 0.6,
            ease: 'elastic.out(1,.5)',
            overwrite: 'auto'
          }
        )
    )
);


/* ==========================================================
   FEED — ACTIVE DOTS
   ========================================================== */

const navButtons =
  $$('#dots button');


$$('.hero, .game')
.forEach(
  (section, i) => {

    ScrollTrigger.create({

      trigger: section,

      start: 'top 55%',

      end: 'bottom 55%',

      onToggle: (self) => {

        if (self.isActive) {

          navButtons.forEach(
            (b, j) =>
              b.classList.toggle(
                'on',
                j === i
              )
          );

        }

      }

    });

  }
);


/* ==========================================================
   FEED REVEALS
   ========================================================== */

if (!RM) {

  $$('.inner')
  .forEach(
    (inner) => {

      const section =
        inner.parentElement;


      gsap.fromTo(
        inner,

        {
          opacity: 0,
          scale: 0.92,
          y: 48,
          filter: 'blur(14px)'
        },

        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
          clearProps: 'filter',

          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions:
              'play none none reverse'
          }

        }
      );


      gsap.from(
        $$('.meta, h2, .desc, .stage, .foot', inner),

        {
          opacity: 0,
          y: 18,
          stagger: 0.08,
          duration: 0.8,
          ease: 'power2.out',

          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions:
              'play none none reverse'
          }

        }
      );

    }
  );

}
