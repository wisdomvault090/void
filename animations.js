/* =========================================================
   VOID — ROBOT + ANIMATIONS
   Fitted specifically for:
   #robot
   #robotCanvas
   ========================================================= */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);


/* =========================================================
   ROBOT
   ========================================================= */

const robotCanvas = document.getElementById("robotCanvas");
const robotBox = document.getElementById("robot");

let scene;
let camera;
let renderer;
let robotRoot;

let robotHead;
let robotFace;
let leftArm;
let rightArm;
let leftForearm;
let rightForearm;
let leftHand;
let rightHand;
let leftEye;
let rightEye;
let chestLight;

let robotReady = false;

const pointer = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0
};


/* ---------- MATERIALS ---------- */

const robotWhite = new THREE.MeshPhysicalMaterial({
  color: 0xe9edf2,
  metalness: 0.82,
  roughness: 0.22,
  clearcoat: 0.65,
  clearcoatRoughness: 0.18
});

const robotDark = new THREE.MeshPhysicalMaterial({
  color: 0x090d12,
  metalness: 0.9,
  roughness: 0.2,
  clearcoat: 0.7,
  clearcoatRoughness: 0.15
});

const robotBlue = new THREE.MeshBasicMaterial({
  color: 0x65bfff
});

const robotBlueSoft = new THREE.MeshPhysicalMaterial({
  color: 0x167dff,
  emissive: 0x0878ff,
  emissiveIntensity: 3.5,
  metalness: 0.2,
  roughness: 0.2
});


/* ---------- HELPERS ---------- */

function box(w, h, d, material, radius = 0) {

  let geometry;

  if (radius && THREE.CapsuleGeometry) {
    geometry = new THREE.BoxGeometry(w, h, d);
  } else {
    geometry = new THREE.BoxGeometry(w, h, d);
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}


function sphere(radius, material) {

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 24),
    material
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}


function cylinder(radiusTop, radiusBottom, height, material, segments = 24) {

  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      segments
    ),
    material
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}


/* =========================================================
   BUILD ROBOT
   ========================================================= */

function buildRobot() {

  robotRoot = new THREE.Group();

  /*
     Overall robot scale.
     Everything is deliberately compact so it fits
     inside the VOID hero instead of taking over screen.
  */
  robotRoot.scale.set(1.05, 1.05, 1.05);


  /* ---------- TORSO ---------- */

  const torso = new THREE.Group();

  const chest = box(
    2.25,
    2.35,
    1.15,
    robotWhite
  );

  chest.position.y = 3.65;

  torso.add(chest);


  /* chest center dark panel */

  const chestPanel = box(
    1.35,
    1.25,
    0.08,
    robotDark
  );

  chestPanel.position.set(
    0,
    3.75,
    0.62
  );

  torso.add(chestPanel);


  /* chest blue reactor */

  chestLight = sphere(
    0.22,
    robotBlueSoft
  );

  chestLight.position.set(
    0,
    3.75,
    0.72
  );

  torso.add(chestLight);


  /* small chest lines */

  for (let i = -1; i <= 1; i++) {

    const line = box(
      0.65,
      0.035,
      0.025,
      robotBlue
    );

    line.position.set(
      0,
      3.35 + i * 0.16,
      0.69
    );

    torso.add(line);
  }


  /* ---------- WAIST ---------- */

  const waist = cylinder(
    0.58,
    0.72,
    0.45,
    robotDark
  );

  waist.position.y = 2.28;

  torso.add(waist);


  robotRoot.add(torso);


  /* =======================================================
     HEAD
     ======================================================= */

  robotHead = new THREE.Group();

  robotHead.position.y = 5.55;


  const headShell = box(
    1.72,
    1.45,
    1.35,
    robotWhite
  );

  robotHead.add(headShell);


  /* face visor */

  robotFace = box(
    1.36,
    0.58,
    0.08,
    robotDark
  );

  robotFace.position.set(
    0,
    -0.05,
    0.72
  );

  robotHead.add(robotFace);


  /* eyes */

  leftEye = sphere(
    0.085,
    robotBlueSoft
  );

  rightEye = sphere(
    0.085,
    robotBlueSoft
  );

  leftEye.position.set(
    -0.36,
    -0.05,
    0.79
  );

  rightEye.position.set(
    0.36,
    -0.05,
    0.79
  );

  robotHead.add(leftEye);
  robotHead.add(rightEye);


  /* head side panels */

  const sideL = box(
    0.15,
    0.72,
    0.8,
    robotDark
  );

  const sideR = sideL.clone();

  sideL.position.set(
    -0.9,
    0,
    0
  );

  sideR.position.set(
    0.9,
    0,
    0
  );

  robotHead.add(sideL);
  robotHead.add(sideR);


  /* antenna */

  const antenna = cylinder(
    0.035,
    0.035,
    0.3,
    robotDark
  );

  antenna.position.y = 0.85;

  robotHead.add(antenna);


  const antennaLight = sphere(
    0.075,
    robotBlueSoft
  );

  antennaLight.position.y = 1.03;

  robotHead.add(antennaLight);


  robotRoot.add(robotHead);


  /* =======================================================
     ARMS
     ======================================================= */

  function createArm(side) {

    const arm = new THREE.Group();

    const upper = box(
      0.58,
      1.65,
      0.58,
      robotWhite
    );

    upper.position.y = -0.85;

    arm.add(upper);


    const shoulder = sphere(
      0.42,
      robotDark
    );

    shoulder.position.y = 0.05;

    arm.add(shoulder);


    const elbow = sphere(
      0.30,
      robotDark
    );

    elbow.position.y = -1.7;

    arm.add(elbow);


    const forearm = new THREE.Group();

    forearm.position.y = -1.7;

    const lower = box(
      0.52,
      1.55,
      0.52,
      robotWhite
    );

    lower.position.y = -0.78;

    forearm.add(lower);


    /* hand */

    const hand = new THREE.Group();

    hand.position.y = -1.58;


    const palm = box(
      0.58,
      0.5,
      0.48,
      robotDark
    );

    hand.add(palm);


    /* fingers */

    for (let i = -1; i <= 1; i++) {

      const finger = box(
        0.11,
        0.42,
        0.12,
        robotWhite
      );

      finger.position.set(
        i * 0.16,
        -0.4,
        0.02
      );

      hand.add(finger);
    }


    /* thumb */

    const thumb = box(
      0.13,
      0.35,
      0.13,
      robotWhite
    );

    thumb.position.set(
      side * 0.34,
      -0.05,
      0
    );

    thumb.rotation.z = side * -0.55;

    hand.add(thumb);


    forearm.add(hand);
    arm.add(forearm);

    arm.position.x = side * 1.48;
    arm.position.y = 4.35;

    arm.rotation.z = side * 0.08;

    robotRoot.add(arm);

    return {
      arm,
      forearm,
      hand
    };
  }


  const left = createArm(-1);
  const right = createArm(1);

  leftArm = left.arm;
  leftForearm = left.forearm;
  leftHand = left.hand;

  rightArm = right.arm;
  rightForearm = right.forearm;
  rightHand = right.hand;


  /* =======================================================
     LEGS
     ======================================================= */

  function createLeg(side) {

    const leg = new THREE.Group();

    const thigh = box(
      0.72,
      1.55,
      0.72,
      robotWhite
    );

    thigh.position.y = -0.8;

    leg.add(thigh);


    const knee = sphere(
      0.32,
      robotDark
    );

    knee.position.y = -1.65;

    leg.add(knee);


    const shin = box(
      0.62,
      1.55,
      0.62,
      robotWhite
    );

    shin.position.y = -2.45;

    leg.add(shin);


    const foot = box(
      0.72,
      0.42,
      1.25,
      robotDark
    );

    foot.position.set(
      0,
      -3.35,
      0.18
    );

    leg.add(foot);


    leg.position.x = side * 0.58;
    leg.position.y = 2.1;

    robotRoot.add(leg);

    return leg;
  }


  createLeg(-1);
  createLeg(1);


  /* ---------- POSITION ---------- */

  robotRoot.position.y = -2.85;

  robotRoot.rotation.y = 0;

  scene.add(robotRoot);

  robotReady = true;
}


/* =========================================================
   THREE SETUP
   ========================================================= */

function initRobot() {

  if (!robotCanvas || !robotBox) return;

  scene = new THREE.Scene();

  /*
     Transparent scene so VOID's black background
     remains visible.
  */
  scene.background = null;


  /* camera */

  camera = new THREE.PerspectiveCamera(
    35,
    1,
    0.1,
    100
  );

  camera.position.set(
    0,
    2.8,
    14
  );

  camera.lookAt(
    0,
    2.6,
    0
  );


  /* renderer */

  renderer = new THREE.WebGLRenderer({
    canvas: robotCanvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.7)
  );

  renderer.setClearColor(
    0x000000,
    0
  );

  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  renderer.outputEncoding =
    THREE.sRGBEncoding;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.1;


  /* ---------- LIGHTING ---------- */

  const ambient = new THREE.AmbientLight(
    0xffffff,
    1.2
  );

  scene.add(ambient);


  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3
  );

  keyLight.position.set(
    5,
    9,
    10
  );

  keyLight.castShadow = true;

  scene.add(keyLight);


  const blueLight = new THREE.PointLight(
    0x1688ff,
    10,
    15
  );

  blueLight.position.set(
    0,
    4,
    4
  );

  scene.add(blueLight);


  const rimLight = new THREE.PointLight(
    0x4db5ff,
    6,
    12
  );

  rimLight.position.set(
    -5,
    4,
    -3
  );

  scene.add(rimLight);


  buildRobot();

  resizeRobot();

  window.addEventListener(
    "resize",
    resizeRobot
  );


  /* ---------- MOUSE ---------- */

  window.addEventListener(
    "pointermove",
    function (event) {

      pointer.targetX =
        (event.clientX / window.innerWidth - 0.5) * 2;

      pointer.targetY =
        (event.clientY / window.innerHeight - 0.5) * 2;

    },
    { passive: true }
  );


  /* ---------- TOUCH ---------- */

  window.addEventListener(
    "touchmove",
    function (event) {

      if (!event.touches[0]) return;

      pointer.targetX =
        (event.touches[0].clientX /
          window.innerWidth - 0.5) * 2;

      pointer.targetY =
        (event.touches[0].clientY /
          window.innerHeight - 0.5) * 2;

    },
    { passive: true }
  );


  animateRobot();
}


/* =========================================================
   RESPONSIVE SIZE
   ========================================================= */

function resizeRobot() {

  if (!renderer || !camera || !robotBox) return;

  const width =
    robotBox.clientWidth || 500;

  const height =
    robotBox.clientHeight || 500;

  renderer.setSize(
    width,
    height,
    false
  );

  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();


  /*
     Keep robot visually similar on all screens.
  */

  if (window.innerWidth <= 700) {

    robotRoot.scale.set(
      0.82,
      0.82,
      0.82
    );

    camera.position.z = 15.5;

  } else {

    robotRoot.scale.set(
      1.05,
      1.05,
      1.05
    );

    camera.position.z = 14;
  }

  camera.lookAt(
    0,
    2.6,
    0
  );
}


/* =========================================================
   ROBOT ANIMATION
   ========================================================= */

const robotClock =
  new THREE.Clock();

function animateRobot() {

  requestAnimationFrame(
    animateRobot
  );

  if (!robotReady) return;

  const time =
    robotClock.getElapsedTime();


  /* smooth cursor */

  pointer.x +=
    (pointer.targetX - pointer.x) * 0.055;

  pointer.y +=
    (pointer.targetY - pointer.y) * 0.055;


  /* ---------- HEAD TRACKING ---------- */

  robotHead.rotation.y =
    pointer.x * 0.38;

  robotHead.rotation.x =
    pointer.y * 0.14;


  /* ---------- BODY TRACKING ---------- */

  robotRoot.rotation.y +=
    (
      pointer.x * 0.10 -
      robotRoot.rotation.y
    ) * 0.025;


  /* ---------- IDLE BREATHING ---------- */

  const breathing =
    Math.sin(time * 1.7) * 0.025;

  robotRoot.position.y =
    -2.85 + breathing;


  /* ---------- ARM IDLE ---------- */

  leftArm.rotation.z =
    -0.08 +
    Math.sin(time * 1.25) * 0.025;

  rightArm.rotation.z =
    0.08 -
    Math.sin(time * 1.25) * 0.025;


  leftForearm.rotation.x =
    Math.sin(time * 1.1) * 0.025;

  rightForearm.rotation.x =
    Math.sin(time * 1.1 + 1) * 0.025;


  /* ---------- CHEST LIGHT ---------- */

  const pulse =
    0.7 +
    Math.sin(time * 3) * 0.25;

  chestLight.material.emissiveIntensity =
    3.5 * pulse;


  /* ---------- EYES ---------- */

  leftEye.material.emissiveIntensity =
    2 + Math.sin(time * 2.5) * 0.4;

  rightEye.material.emissiveIntensity =
    2 + Math.sin(time * 2.5) * 0.4;


  /* ---------- CAMERA FLOAT ---------- */

  camera.position.x +=
    (
      pointer.x * 0.55 -
      camera.position.x
    ) * 0.018;

  camera.position.y +=
    (
      2.8 -
      pointer.y * 0.25 -
      camera.position.y
    ) * 0.018;

  camera.lookAt(
    0,
    2.65,
    0
  );


  renderer.render(
    scene,
    camera
  );
}


initRobot();


/* =========================================================
   VOID HERO EFFECTS
   ========================================================= */

/* ---------- HERO LETTER INTRO ---------- */

const heroLetters =
  document.querySelectorAll(".hero .ch");

if (heroLetters.length) {

  gsap.fromTo(
    heroLetters,
    {
      y: 80,
      opacity: 0,
      rotationX: 70
    },
    {
      y: 0,
      opacity: 1,
      rotationX: 0,
      duration: 1.15,
      stagger: 0.08,
      ease: "power4.out",
      delay: 0.2
    }
  );
}


/* ---------- SUBTEXT ---------- */

const heroSub =
  document.querySelector(".hero .sub");

const heroTiny =
  document.querySelector(".hero .tiny");

if (heroSub) {

  gsap.fromTo(
    heroSub,
    {
      opacity: 0,
      y: 25
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.65,
      ease: "power3.out"
    }
  );
}

if (heroTiny) {

  gsap.fromTo(
    heroTiny,
    {
      opacity: 0,
      y: 20
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.8,
      ease: "power3.out"
    }
  );
}


/* ---------- ROBOT ENTRANCE ---------- */

if (robotBox) {

  gsap.fromTo(
    robotBox,
    {
      opacity: 0,
      scale: 0.92,
      y: 35
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1.25,
      delay: 0.15,
      ease: "power4.out"
    }
  );
}


/* =========================================================
   CTA
   ========================================================= */

const animationCta =
  document.getElementById("cta");

if (animationCta) {

  animationCta.addEventListener(
    "mouseenter",
    () => {

      gsap.to(
        animationCta,
        {
          y: -3,
          scale: 1.025,
          duration: 0.25,
          ease: "power2.out"
        }
      );

    }
  );


  animationCta.addEventListener(
    "mouseleave",
    () => {

      gsap.to(
        animationCta,
        {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        }
      );

    }
  );
}


/* =========================================================
   DOT NAVIGATION
   ========================================================= */

const animationNavButtons =
  document.querySelectorAll("#dots button");

if (animationNavButtons.length) {

  animationNavButtons.forEach(
    button => {

      button.addEventListener(
        "mouseenter",
        () => {

          gsap.to(
            button,
            {
              scale: 1.25,
              duration: 0.2,
              ease: "power2.out"
            }
          );

        }
      );


      button.addEventListener(
        "mouseleave",
        () => {

          gsap.to(
            button,
            {
              scale: 1,
              duration: 0.2,
              ease: "power2.out"
            }
          );

        }
      );

    }
  );
}


/* =========================================================
   FEED / GAME REVEALS
   ========================================================= */

const feed =
  document.getElementById("feed");

if (feed) {

  const revealItems =
    feed.children;

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


/* =========================================================
   HERO PARALLAX
   ========================================================= */

const heroWrap =
  document.getElementById("wrap");

if (heroWrap) {

  gsap.to(
    heroWrap,
    {
      y: -70,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    }
  );
}


/* =========================================================
   ROBOT SCROLL FADE
   ========================================================= */

if (robotBox) {

  gsap.to(
    robotBox,
    {
      opacity: 0,
      scale: 0.9,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "35% top",
        end: "90% top",
        scrub: 1
      }
    }
  );
}
