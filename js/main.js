import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PROFILE } from './config.js';
import { ensureFonts } from './textures.js';
import { uTime } from './materials.js';
import { buildWorld } from './world.js';
import { createInteraction } from './interaction.js';
import { createDayNight } from './daynight.js';
import { createMusic } from './audio.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe6ecf7, 17, 34);

const HOME_POS = new THREE.Vector3(10.3, 6.0, 9.9);
const HOME_TARGET = new THREE.Vector3(0, 1.0, 0);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.copy(HOME_POS);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 4.5;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

const hemi = new THREE.HemisphereLight(0xcfe8ff, 0xffd9e8, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2df, 1.6);
sun.position.set(5, 8, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -6;
sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 25;
sun.shadow.bias = -0.0006;
scene.add(sun);

// รูปถ่ายของตัวเอง: วางไฟล์ที่ assets/photo.jpg แล้วจะกลายเป็น texture บนบัตรนักศึกษา
function loadPhoto() {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      './assets/photo.jpg',
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        resolve(t);
      },
      undefined,
      () => resolve(null)
    );
  });
}

const photo = await loadPhoto();
await ensureFonts();

// ภาพประกอบผลงานแต่ละชิ้น (ขาดก็ได้ โปสเตอร์จะวาดแบบไม่มีรูป)
function loadImage(url) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = url;
  });
}
const projImgs = await Promise.all(PROFILE.projects.map((pr) => loadImage(pr.img)));

const { world, pickables, animators, refs } = buildWorld(photo, projImgs);
scene.add(world);

const dayNight = createDayNight(refs, { hemi, sun, fog: scene.fog });
const vec = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const interaction = createInteraction(renderer.domElement, camera, pickables, {
  onFocus: (f) => flyTo(vec(f.pos), vec(f.target)),
  onShowProject: (i, fly) => {
    const tex = i >= 0 ? refs.projectTexs[i] : refs.screenTex;
    refs.screenMat.map = tex;
    refs.screenMat.emissiveMap = tex;
    refs.screenMat.needsUpdate = true;
    if (fly && i >= 0) flyTo(vec(refs.monitorFocus.pos), vec(refs.monitorFocus.target));
  },
  onBack: () => flyTo(vec(refs.hubFocus.pos), vec(refs.hubFocus.target)),
});

document.getElementById('hud-name').textContent = PROFILE.nameTh;
document.getElementById('hud-uni').textContent = PROFILE.university + ' • ' + PROFILE.faculty;

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('off', !controls.autoRotate);
});
document.getElementById('btn-reset').addEventListener('click', () => {
  flyTo(HOME_POS, HOME_TARGET, 1.2);
});

// กล้องบินเข้าหามุม_focus_เมื่อคลิกป้าย/เฟรม (tween เองใน render loop)
const fly = { t: 1, dur: 1.4, fromP: new THREE.Vector3(), toP: new THREE.Vector3(), fromT: new THREE.Vector3(), toT: new THREE.Vector3() };
function flyTo(pos, target, dur = 1.4) {
  fly.fromP.copy(camera.position);
  fly.toP.copy(pos);
  fly.fromT.copy(controls.target);
  fly.toT.copy(target);
  fly.t = 0;
  fly.dur = dur;
  controls.autoRotate = false;
  btnRotate.classList.add('off');
}
controls.addEventListener('start', () => {
  fly.t = 1; // ผู้ใช้ลากกล้องเอง = ยกเลิกเที่ยวบิน
});

const music = createMusic();
const btnMusic = document.getElementById('btn-music');
btnMusic.addEventListener('click', async () => {
  const on = await music.toggle();
  btnMusic.classList.toggle('off', !on);
});

let nightTarget = 0;
let nightMix = 0;
const btnNight = document.getElementById('btn-night');
btnNight.addEventListener('click', () => {
  nightTarget = nightTarget ? 0 : 1;
  btnNight.textContent = nightTarget ? '☀' : '☾';
});

const statsEl = document.getElementById('stats');
let frames = 0;
let acc = 0;

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  uTime.value = t;
  nightMix += (nightTarget - nightMix) * Math.min(1, dt * 2.5);
  dayNight.setMix(nightMix);
  refs.meteors.setNight(nightMix);
  for (const fn of animators) fn(t, dt);
  if (fly.t < 1) {
    fly.t = Math.min(1, fly.t + dt / fly.dur);
    const e = fly.t < 0.5 ? 4 * fly.t ** 3 : 1 - (-2 * fly.t + 2) ** 3 / 2;
    camera.position.lerpVectors(fly.fromP, fly.toP, e);
    camera.position.y += Math.sin(e * Math.PI) * 0.45; // โค้งลอยขึ้นกลางทางให้ดู cinematic
    controls.target.lerpVectors(fly.fromT, fly.toT, e);
  }
  interaction.update(dt);
  controls.update();
  renderer.render(scene, camera);
  frames++;
  acc += dt;
  if (acc >= 0.5) {
    const info = renderer.info.render;
    statsEl.textContent = `${Math.round(frames / acc)} FPS • ${info.triangles.toLocaleString()} tris • ${info.calls} draws`;
    frames = 0;
    acc = 0;
  }
}
tick();
document.getElementById('loading').classList.add('hidden');

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(document.getElementById('app'));
resize();
