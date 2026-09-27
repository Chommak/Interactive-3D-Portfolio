import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PROFILE } from './config.js';
import { ensureFonts } from './textures.js';
import { uTime } from './materials.js';
import { buildWorld } from './world.js';
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

const HOME_POS = new THREE.Vector3(8.6, 5.2, 8.2);
const HOME_TARGET = new THREE.Vector3(0, 1.1, 0);
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
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -7;
sun.shadow.camera.right = 7;
sun.shadow.camera.top = 7;
sun.shadow.camera.bottom = -7;
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

const { world, animators, refs } = buildWorld(photo);
scene.add(world);

const dayNight = createDayNight(refs, { hemi, sun, fog: scene.fog });

document.getElementById('hud-name').textContent = PROFILE.nameTh;
document.getElementById('hud-uni').textContent = PROFILE.university + ' • ' + PROFILE.faculty;

const btnRotate = document.getElementById('btn-rotate');
btnRotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  btnRotate.classList.toggle('off', !controls.autoRotate);
});
document.getElementById('btn-reset').addEventListener('click', () => {
  camera.position.copy(HOME_POS);
  controls.target.copy(HOME_TARGET);
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
  for (const fn of animators) fn(t, dt);
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
