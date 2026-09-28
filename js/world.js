import * as THREE from 'three';
import { toon, metal, plastic, addOutline, sway, swayWhole } from './materials.js';
import * as TX from './textures.js';
import { skyMaterial, waterMaterial, petalMaterial } from './shaders.js';
import { PROFILE } from './config.js';

const GY = 0.5; // ระดับพื้นหญ้าบนเกาะ

export function buildWorld(photoTex, projImgs = []) {
  const world = new THREE.Group();
  const pickables = [];
  const animators = [];
  const glowMat = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ff9d4d', emissiveIntensity: 0.55, roughness: 0.6, metalness: 0 });
  const lanternCapMat = metal('#3b3350', 0.5);

  const pick = (mesh, key, root) => {
    mesh.userData.panelKey = key;
    mesh.userData.hoverRoot = root || mesh;
    pickables.push(mesh);
    return mesh;
  };

  // หันหน้าวัตถุเข้าหากล้องเริ่มต้น เพื่อให้ป้าย/เฟรมอ่านง่ายจากมุมแรกเห็น
  const CAM = { x: 10.3, z: 9.9 };
  const faceCam = (obj, x, z) => {
    obj.rotation.y = Math.atan2(CAM.x - x, CAM.z - z);
  };
  const focusFrom = (x, y, z, dist, lift) => {
    const dx = CAM.x - x;
    const dz = CAM.z - z;
    const l = Math.hypot(dx, dz);
    return { pos: [x + (dx / l) * dist, y + lift, z + (dz / l) * dist], target: [x, y, z] };
  };
  const FOCUS = {
    about: focusFrom(0.2, 1.62, -2.9, 2.7, 0.4),
    contact: focusFrom(-1.9, 1.2, 1.7, 2.6, 0.4),
    skills: focusFrom(0.2, 1.5, -1.4, 2.5, 0.5),
    sign: focusFrom(-1.9, 1.3, 1.7, 2.7, 0.4),
    hub: focusFrom(-1.9, 1.2, 1.7, 3.0, 0.5),
  };

  // ---------- ท้องฟ้า + น้ำ ----------
  const skyMat = skyMaterial();
  world.add(new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), skyMat));

  const waterMat = waterMaterial();
  const waterGeo = new THREE.PlaneGeometry(9.8, 9.8, 56, 56);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = -0.2;
  world.add(water);

  // ---------- เกาะลอยน้ำ (พื้นที่ใช้งานจริง ~7x7 อยู่ในกรอบ 10x10) ----------
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.3, 0.5, 12), toon('#8fd07a'));
  grass.position.y = 0.25;
  grass.receiveShadow = true;
  addOutline(grass, 0.02);
  world.add(grass);

  const rock = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 0.7, 2.4, 10), toon('#a98274'));
  rock.position.y = -1.2;
  addOutline(rock, 0.02);
  world.add(rock);

  const shoreRockGeo = new THREE.SphereGeometry(0.32, 7, 5);
  [0.4, 1.7, 2.9, 4.1, 5.3].forEach((a, i) => {
    const m = new THREE.Mesh(shoreRockGeo, toon(i % 2 ? '#dfe5ee' : '#c9d2e0'));
    m.position.set(Math.cos(a) * 4.45, -0.18, Math.sin(a) * 4.45);
    m.scale.set(1 + (i % 3) * 0.25, 0.55, 0.8 + (i % 2) * 0.3);
    m.rotation.y = a;
    world.add(m);
  });

  // ---------- ต้นซากุระ + กลีบปลิว ----------
  const tree = new THREE.Group();
  tree.position.set(-2.2, GY, -1.5);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.6, 7), toon('#8a5a44'));
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  addOutline(trunk, 0.06);
  tree.add(trunk);

  const blossomMat = swayWhole(toon('#f9b8cf'), 0.05);
  const puffGeo = new THREE.IcosahedronGeometry(0.75, 1);
  [[0, 1.95, 0, 1.0], [0.62, 1.6, 0.2, 0.7], [-0.55, 1.7, -0.15, 0.65], [0.1, 2.35, -0.3, 0.6]].forEach(([x, y, z, s]) => {
    const m = new THREE.Mesh(puffGeo, blossomMat);
    m.position.set(x, y, z);
    m.scale.setScalar(s);
    m.castShadow = true;
    addOutline(m, 0.05);
    tree.add(m);
  });
  world.add(tree);

  const petalMat = petalMaterial(TX.petalTexture());
  petalMat.uniforms.uCenter.value.set(-2.2, GY + 1.5, -1.5);
  const PN = 160;
  const pPos = new Float32Array(PN * 3);
  const pSeed = new Float32Array(PN * 3);
  const pScale = new Float32Array(PN);
  for (let i = 0; i < PN; i++) {
    pSeed[i * 3] = Math.random();
    pSeed[i * 3 + 1] = Math.random();
    pSeed[i * 3 + 2] = Math.random();
    pScale[i] = 0.5 + Math.random() * 0.8;
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  petalGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 3));
  petalGeo.setAttribute('aScale', new THREE.BufferAttribute(pScale, 1));
  const petals = new THREE.Points(petalGeo, petalMat);
  petals.frustumCulled = false;
  world.add(petals);

  // ---------- โต๊ะทำงาน + จอคอม (PBR) ----------
  const desk = new THREE.Group();
  desk.position.set(0.2, GY, -1.4);
  faceCam(desk, 0.2, -1.4);
  const top = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.85), toon('#d9a86c')), 0.03);
  top.position.y = 0.72;
  top.castShadow = true;
  top.receiveShadow = true;
  desk.add(top);
  const legGeo = new THREE.BoxGeometry(0.07, 0.72, 0.07);
  [[-0.78, -0.35], [0.78, -0.35], [-0.78, 0.35], [0.78, 0.35]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, toon('#b9834a'));
    leg.position.set(x, 0.36, z);
    leg.castShadow = true;
    desk.add(leg);
  });

  const monitor = new THREE.Group();
  monitor.position.set(0, 0.76, -0.25);
  const mStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 8), metal('#9aa7b8', 0.3));
  mStand.position.y = 0.14;
  monitor.add(mStand);
  const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.03, 10), metal('#9aa7b8', 0.3));
  mBase.position.y = 0.015;
  monitor.add(mBase);
  const mFrame = addOutline(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.62, 0.05), plastic('#2e2a3f', 0.45)), 0.04);
  mFrame.position.y = 0.58;
  mFrame.castShadow = true;
  monitor.add(mFrame);
  const screenTex = TX.screenTexture(PROFILE);
  const projectTexs = PROFILE.projects.map((pr, i) => TX.projectTexture(pr, i, projImgs[i]));
  const screenMat = new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.54), screenMat);
  screen.position.set(0, 0.58, 0.028);
  monitor.add(screen);
  pick(screen, 'portfolio', monitor);
  screen.userData.focus = FOCUS.skills;
  desk.add(monitor);

  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.18), plastic('#e8f1fb', 0.6));
  keyboard.position.set(0, 0.775, 0.14);
  desk.add(keyboard);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 10), plastic('#f7a8c4', 0.5));
  mug.position.set(0.62, 0.81, 0.12);
  desk.add(mug);
  const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.22), toon('#8ec9f0'));
  book1.position.set(-0.6, 0.785, -0.15);
  desk.add(book1);
  const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.2), toon('#f7a8c4'));
  book2.position.set(-0.6, 0.835, -0.15);
  book2.rotation.y = 0.3;
  desk.add(book2);

  const chair = new THREE.Group();
  chair.position.set(0.05, 0, 0.85);
  chair.rotation.y = 0.25;
  const seat = addOutline(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.4), toon('#bcd7f2')), 0.05);
  seat.position.y = 0.45;
  seat.castShadow = true;
  chair.add(seat);
  const back = addOutline(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.06), toon('#bcd7f2')), 0.05);
  back.position.set(0, 0.72, -0.2);
  back.castShadow = true;
  chair.add(back);
  const cPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), metal('#9aa7b8', 0.35));
  cPost.position.y = 0.22;
  chair.add(cPost);
  const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.04, 10), metal('#9aa7b8', 0.35));
  cBase.position.y = 0.02;
  chair.add(cBase);
  desk.add(chair);

  // เสื่อทาทามิรองโซนโต๊ะ ให้เป็น "มุมห้อง" กลางเกาะ
  const tatami = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1.9), toon('#cfe0a8'));
  tatami.position.set(0, 0.02, 0.15);
  tatami.receiveShadow = true;
  desk.add(tatami);

  // แมวกวักนำโชคบนโต๊ะ
  const neko = new THREE.Group();
  neko.position.set(0.62, 0.8, -0.12);
  const nekoMat = toon('#fff8f2');
  const nBody = new THREE.Mesh(new THREE.SphereGeometry(0.09, 9, 7), nekoMat);
  nBody.scale.y = 1.1;
  neko.add(nBody);
  const nHead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 9, 7), nekoMat);
  nHead.position.y = 0.13;
  neko.add(nHead);
  [-0.045, 0.045].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 5), nekoMat);
    ear.position.set(x, 0.2, 0);
    neko.add(ear);
  });
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.03, 7, 5), nekoMat);
  paw.position.set(0.07, 0.17, 0.03);
  neko.add(paw);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 10), toon('#e2574c'));
  collar.position.y = 0.08;
  collar.rotation.x = Math.PI / 2;
  neko.add(collar);
  desk.add(neko);

  // บอนไซจิ๋วข้างจอ
  const bonsai = new THREE.Group();
  bonsai.position.set(-0.62, 0.79, 0.15);
  const bPot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.07, 8), toon('#8a5a44'));
  bPot.position.y = 0.035;
  bonsai.add(bPot);
  const bTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.12, 5), toon('#8a5a44'));
  bTrunk.position.y = 0.12;
  bonsai.add(bTrunk);
  const bFol = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), swayWhole(toon('#6fbf62'), 0.02));
  bFol.position.y = 0.2;
  bonsai.add(bFol);
  desk.add(bonsai);

  world.add(desk);

  // ---------- บัตรนักศึกษา (รูปถ่ายของตัวเองเป็น texture) ----------
  const card = new THREE.Group();
  card.position.set(-2.3, GY, -0.6);
  faceCam(card, -2.3, -0.6);
  const easelMat = toon('#b9834a');
  [-0.35, 0.35].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.15, 6), easelMat);
    leg.position.set(x, 0.55, -0.08);
    leg.rotation.x = -0.12;
    leg.castShadow = true;
    card.add(leg);
  });
  const cardFrame = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.7, 0.05), toon('#fff8f2')), 0.04);
  cardFrame.position.set(0, 1.0, 0);
  cardFrame.rotation.x = -0.12;
  cardFrame.castShadow = true;
  card.add(cardFrame);
  const cardPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), new THREE.MeshBasicMaterial({ map: TX.cardTexture(PROFILE, photoTex) }));
  cardPlane.position.set(0, 1.0, 0.03);
  cardPlane.rotation.x = -0.12;
  card.add(cardPlane);
  pick(cardPlane, 'about', card);
  cardPlane.userData.focus = FOCUS.about;
  world.add(card);

  // ---------- เสาโทริอิ + ป้ายชื่อ ----------
  const torii = new THREE.Group();
  torii.position.set(0.2, GY, -2.9);
  faceCam(torii, 0.2, -2.9);
  const pillarGeo = new THREE.CylinderGeometry(0.09, 0.12, 2.1, 8);
  [-0.85, 0.85].forEach((x) => {
    const p = addOutline(new THREE.Mesh(pillarGeo, toon('#e2574c')), 0.05);
    p.position.set(x, 1.05, 0);
    p.castShadow = true;
    torii.add(p);
  });
  const beam1 = addOutline(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.2), toon('#e2574c')), 0.05);
  beam1.position.y = 2.16;
  beam1.castShadow = true;
  torii.add(beam1);
  const cap = addOutline(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.26), toon('#3b3350')), 0.05);
  cap.position.y = 2.32;
  cap.castShadow = true;
  torii.add(cap);
  const beam2 = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.12, 0.15), toon('#e2574c'));
  beam2.position.y = 1.76;
  torii.add(beam2);

  const nameBoard = new THREE.Group();
  nameBoard.position.set(0, 1.32, 0);
  const nbBack = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 0.06), toon('#fff8f2')), 0.04);
  nbBack.castShadow = true;
  nameBoard.add(nbBack);
  const namePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.66), new THREE.MeshBasicMaterial({ map: TX.nameTexture(PROFILE) }));
  namePlane.position.z = 0.035;
  nameBoard.add(namePlane);
  pick(namePlane, 'about', nameBoard);
  namePlane.userData.focus = FOCUS.about;
  torii.add(nameBoard);

  // โคมไฟแขวนนอกเสาโทริอิทั้งสองข้าง (เลี่ยงทับป้ายชื่อตรงกลาง)
  torii.add(makeLantern(-1.15, 1.62, 0.12, 0.7, animators, glowMat, lanternCapMat));
  torii.add(makeLantern(1.15, 1.62, 0.12, 2.1, animators, glowMat, lanternCapMat));
  world.add(torii);

  // ---------- เสาป้ายไม้ 3 กระดานเรียงแนวตั้ง (ABOUT / CONTACT / SKILLS) ----------
  const signPost = new THREE.Group();
  signPost.position.set(-1.9, GY, 1.7);
  faceCam(signPost, -1.9, 1.7);
  const spWood = toon('#8a5a44');
  const spWoodDark = toon('#6e4634');
  // ฐานหินเตี้ยรองรับ → เห็นชัดว่าเสาปักลงพื้น ไม่ลอย
  const spCurb = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.94, 0.12, 8), toon('#c9d2e0'));
  spCurb.position.y = 0.06;
  spCurb.receiveShadow = true;
  signPost.add(spCurb);
  // เสาไม้คู่ปักลงฐาน
  [-0.62, 0.62].forEach((x) => {
    const post = addOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 2.2, 7), spWood), 0.03);
    post.position.set(x, 1.12, 0);
    post.castShadow = true;
    signPost.add(post);
  });
  // คานขวางด้านหลังยึดกระดานเข้ากับเสาทั้งสองข้าง
  [1.9, 1.26, 0.62].forEach((y) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.09, 0.07), spWoodDark);
    rail.position.set(0, y, -0.03);
    rail.castShadow = true;
    signPost.add(rail);
  });
  // หลังคาจั่วคลุมด้านบนกันแดดฝน
  const roofA = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 0.4), toon('#3b3350'));
  roofA.position.set(0, 2.28, -0.16);
  roofA.rotation.x = -0.5;
  roofA.castShadow = true;
  signPost.add(roofA);
  const roofB = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 0.4), toon('#3b3350'));
  roofB.position.set(0, 2.28, 0.16);
  roofB.rotation.x = 0.5;
  roofB.castShadow = true;
  signPost.add(roofB);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.09, 0.12), toon('#2a2440'));
  ridge.position.y = 2.4;
  signPost.add(ridge);
  const boards = [
    { key: 'about', title: 'ABOUT', lines: [PROFILE.nameTh, PROFILE.university] },
    { key: 'contact', title: 'CONTACT', lines: [PROFILE.email, PROFILE.phone] },
    { key: 'skills', title: 'SKILLS', lines: [PROFILE.skills.slice(0, 3).join(' • ')] },
  ];
  boards.forEach((b, i) => {
    const g = new THREE.Group();
    g.position.set(0, 1.88 - i * 0.64, 0.06);
    g.rotation.z = i % 2 ? 0.03 : -0.03;
    const box = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.58, 0.05), toon('#c9955c')), 0.04);
    box.castShadow = true;
    g.add(box);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.04, 0.52),
      new THREE.MeshBasicMaterial({ map: TX.boardTexture(b) })
    );
    plane.position.z = 0.03;
    g.add(plane);
    pick(plane, b.key, g);
    plane.userData.focus = FOCUS.sign;
    signPost.add(g);
  });
  world.add(signPost);

  // ---------- แกลเลอรีผลงาน: แท่นโปสเตอร์ตั้งพื้นเรียงโค้งริมเกาะขวา ----------
  const standSpots = [
    [2.7, 0.7],
    [2.9, -0.7],
    [2.1, -2.0],
  ];
  PROFILE.projects.forEach((pr, i) => {
    const [x, z] = standSpots[i];
    const g = new THREE.Group();
    g.position.set(x, GY, z);
    faceCam(g, x, z);
    // แท่นหินรองขา → เห็นชัดว่าตั้งพื้นไม่ลอย
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.08, 7), toon('#c9d2e0'));
    foot.position.y = 0.04;
    foot.receiveShadow = true;
    g.add(foot);
    // ขา easel คู่ปักลงแท่น
    const sLegGeo = new THREE.CylinderGeometry(0.04, 0.055, 1.55, 6);
    [-0.44, 0.44].forEach((lx) => {
      const leg = new THREE.Mesh(sLegGeo, toon('#8a5a44'));
      leg.position.set(lx, 0.78, -0.06);
      leg.rotation.x = -0.1;
      leg.castShadow = true;
      g.add(leg);
    });
    // คานล่าง + คานบนยึดขาเป็นโครงเดียวกัน
    const braceGeo = new THREE.BoxGeometry(0.98, 0.06, 0.06);
    const braceLow = new THREE.Mesh(braceGeo, toon('#6e4634'));
    braceLow.position.set(0, 0.34, -0.09);
    g.add(braceLow);
    const braceTop = new THREE.Mesh(braceGeo, toon('#6e4634'));
    braceTop.position.set(0, 1.5, -0.12);
    braceTop.castShadow = true;
    g.add(braceTop);
    // แผงโปสเตอร์ยึดคร่อมระหว่างขา
    const panel = new THREE.Group();
    panel.position.set(0, 1.02, 0.02);
    panel.rotation.x = -0.08;
    const frame = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.8, 0.05), toon('#fff8f2')), 0.04);
    frame.castShadow = true;
    panel.add(frame);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.94, 0.7),
      new THREE.MeshBasicMaterial({ map: projectTexs[i], side: THREE.DoubleSide })
    );
    plane.position.z = 0.03;
    panel.add(plane);
    pick(plane, 'project' + i, g);
    plane.userData.focus = focusFrom(x, 1.05, z, 2.0, 0.35);
    g.add(panel);
    animators.push((t) => {
      panel.rotation.z = Math.sin(t * 0.9 + i) * 0.02;
    });
    world.add(g);
  });

  // โคมไฟข้างต้นซากุระ
  tree.add(makeLantern(0.8, 1.35, 0.4, 2.1, animators, glowMat, lanternCapMat));

  // ---------- กอหญ้าไหว + ก้อนหินทางเดิน ----------
  const grassMatA = sway(toon('#6fbf62'), 0.06, 1.8);
  const grassMatB = sway(toon('#57ad57'), 0.05, 1.4);
  const tuftGeo = new THREE.ConeGeometry(0.05, 0.3, 5);
  tuftGeo.translate(0, 0.15, 0);
  [
    [-0.9, 0.9, 1], [-2.3, 2.3, 0.9], [1.3, 1.9, 1.1], [2.0, 1.6, 0.8],
    [-2.8, 1.2, 1.2], [-1.3, -1.9, 1], [-0.9, -2.6, 0.9], [1.2, -2.7, 1.1],
    [2.4, -2.6, 0.85], [-2.7, -1.9, 1], [1.6, 0.2, 0.8], [-0.4, 0.2, 0.95],
  ].forEach(([x, z, s], i) => {
    const m = new THREE.Mesh(tuftGeo, i % 2 ? grassMatA : grassMatB);
    m.position.set(x, GY, z);
    m.scale.setScalar(s);
    m.rotation.y = i * 1.7;
    world.add(m);
  });

  const stepGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.08, 7);
  [[0.7, 2.3], [0.6, 1.6], [0.5, 0.9], [0.4, 0.2], [0.3, -0.5]].forEach(([x, z], i) => {
    const m = new THREE.Mesh(stepGeo, toon('#cfd6e4'));
    m.position.set(x, GY + 0.02, z);
    m.rotation.y = i * 0.9;
    m.receiveShadow = true;
    world.add(m);
  });

  // ---------- เมฆลอย ----------
  const cloudMat = toon('#ffffff');
  [[-6, 5.2, -4, 1.2], [4.5, 6.0, -6.5, 1.5], [7, 4.6, 3.5, 1.0]].forEach(([x, y, z, s], i) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.scale.setScalar(s);
    [[0, 0, 0, 0.55], [0.5, -0.08, 0.1, 0.4], [-0.5, -0.1, -0.05, 0.38]].forEach(([cx, cy, cz, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cloudMat);
      m.position.set(cx, cy, cz);
      g.add(m);
    });
    world.add(g);
    animators.push((t, dt) => {
      g.position.x += dt * 0.25;
      if (g.position.x > 11) g.position.x = -11;
      g.position.y = y + Math.sin(t * 0.5 + i) * 0.15;
    });
  });

  // ---------- ดวงอาทิตย์ / ดวงจันทร์ / ดาว ----------
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#ffd98e', fog: false, transparent: true })
  );
  sunMesh.position.set(-9.6, 6.3, -10.3);
  sunMesh.scale.setScalar(1.4);
  world.add(sunMesh);
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#f4f6ff', fog: false, transparent: true, opacity: 0 })
  );
  moonMesh.position.set(-5.75, 6.1, -13.5);
  moonMesh.scale.setScalar(1.5);
  world.add(moonMesh);

  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const SN = 220;
  const sPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(26);
    if (v.y < 2) v.y = Math.abs(v.y) + 2;
    sPos.set([v.x, v.y, v.z], i * 3);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  world.add(new THREE.Points(starsGeo, starsMat));

  // ---------- สายโคมไฟ + โคมไฟตั้งพื้น สำหรับโหมดกลางคืน ----------
  const stringMat = plastic('#3b3350', 0.7);
  const hangA = new THREE.Vector3(-2.1, 2.75, -1.8);
  const hangB = new THREE.Vector3(0.2, 2.78, -2.9);
  const hangDir = hangB.clone().sub(hangA);
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, hangDir.length(), 4), stringMat);
  line.position.copy(hangA).add(hangB).multiplyScalar(0.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hangDir.clone().normalize());
  world.add(line);
  [0.16, 0.38, 0.6].forEach((t, i) => {
    const p = hangA.clone().lerp(hangB, t);
    p.y -= Math.sin(t * Math.PI) * 0.4;
    const l = makeLantern(p.x, p.y, p.z, i * 1.3, animators, glowMat, lanternCapMat);
    l.scale.setScalar(0.8);
    world.add(l);
  });

  [[2.2, 1.9], [-1.4, 2.6]].forEach(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, GY, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.85, 6), toon('#8a8fa0'));
    pole.position.y = 0.42;
    pole.castShadow = true;
    g.add(pole);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glowMat);
    body.scale.y = 1.2;
    body.position.y = 0.95;
    g.add(body);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.12, 6), lanternCapMat);
    cap.position.y = 1.12;
    g.add(cap);
    world.add(g);
  });

  // ---------- ของตกแต่งสไตล์ญี่ปุ่น ----------
  // โคมหิน (ishidoro) ขนาบทางเดิน ตัวโคมเรืองแสงตอนกลางคืน
  function stoneLantern(x, z) {
    const g = new THREE.Group();
    g.position.set(x, GY, z);
    const stone = toon('#c9d2e0');
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 7), stone);
    base.position.y = 0.06;
    base.receiveShadow = true;
    g.add(base);
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 7), stone);
    pil.position.y = 0.36;
    g.add(pil);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.07, 7), stone);
    plat.position.y = 0.64;
    g.add(plat);
    const fire = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), glowMat);
    fire.position.y = 0.8;
    g.add(fire);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 6), toon('#8a8fa0'));
    roof.position.y = 0.98;
    g.add(roof);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 7, 5), stone);
    knob.position.y = 1.08;
    g.add(knob);
    world.add(g);
  }
  stoneLantern(-0.6, 2.5);
  stoneLantern(1.5, 2.3);

  // รั้วไม้ไผ่เตี้ยเลียบขอบเกาะด้านหลัง กันฉากหลุดขอบ
  const fenceMat = toon('#b9834a');
  const fPostGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.55, 6);
  const fRailGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.95, 5);
  function fenceArc(a0, a1, n) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const p = new THREE.Mesh(fPostGeo, fenceMat);
      p.position.set(Math.cos(a) * 3.15, GY + 0.27, Math.sin(a) * 3.15);
      world.add(p);
      if (i < n) {
        const a2 = a0 + ((a1 - a0) * (i + 0.5)) / n;
        const r = new THREE.Mesh(fRailGeo, fenceMat);
        r.position.set(Math.cos(a2) * 3.15, GY + 0.36, Math.sin(a2) * 3.15);
        r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.sin(a2), 0, Math.cos(a2)));
        world.add(r);
      }
    }
  }
  fenceArc(2.7, 4.1, 3);
  fenceArc(-1.2, 0.2, 3);

  // ชั้นแขวนแผ่นป้ายอธิษฐาน (ema) ข้างโทริอิ
  const ema = new THREE.Group();
  ema.position.set(-1.6, GY, -1.6);
  faceCam(ema, -1.6, -1.6);
  [-0.5, 0.5].forEach((x) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.9, 6), toon('#8a5a44'));
    p.position.set(x, 0.45, 0);
    p.castShadow = true;
    ema.add(p);
  });
  const eRail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), toon('#8a5a44'));
  eRail.position.y = 0.86;
  eRail.rotation.z = Math.PI / 2;
  ema.add(eRail);
  [-0.36, -0.12, 0.12, 0.36].forEach((x, i) => {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.02), toon(i % 2 ? '#f7e6c9' : '#fff8f2'));
    pl.position.set(x, 0.66, 0.02);
    pl.rotation.z = (i % 2 ? 1 : -1) * 0.12;
    ema.add(pl);
  });
  world.add(ema);

  // ฉากโชจิพับได้ เป็นฉากหลังมุมโต๊ะ
  const shoji = new THREE.Group();
  shoji.position.set(-0.9, GY, -2.4);
  shoji.rotation.y = 0.9;
  const shojiMat = new THREE.MeshStandardMaterial({ color: '#fdf6ec', roughness: 0.9, metalness: 0 });
  [-0.44, 0.44].forEach((x, i) => {
    const pan = addOutline(new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.5, 0.05), shojiMat), 0.03);
    pan.position.set(x, 0.75, 0.06);
    pan.rotation.y = i ? -0.3 : 0.3;
    pan.castShadow = true;
    shoji.add(pan);
  });
  world.add(shoji);

  // เสาโคมแขวนเหนือโต๊ะทำงาน
  const dLamp = new THREE.Group();
  dLamp.position.set(1.45, GY, -1.75);
  const lPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 1.95, 6), toon('#3b3350'));
  lPost.position.y = 0.97;
  lPost.castShadow = true;
  dLamp.add(lPost);
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 5), toon('#3b3350'));
  lArm.position.set(-0.28, 1.9, 0.12);
  lArm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.92, 0, 0.4));
  dLamp.add(lArm);
  dLamp.add(makeLantern(-0.55, 1.72, 0.24, 1.7, animators, glowMat, lanternCapMat));
  world.add(dLamp);

  const pointLights = [new THREE.PointLight(0xffb46b, 0, 7, 2), new THREE.PointLight(0xffb46b, 0, 7, 2)];
  pointLights[0].position.set(0.8, GY + 1.2, 2.6);
  pointLights[1].position.set(0.2, GY + 1.7, -2.0);
  pointLights.forEach((l) => world.add(l));

  const refs = { skyMat, waterMat, glowMat, screenMat, starsMat, sunMesh, moonMesh, pointLights, screenTex, projectTexs, hubFocus: FOCUS.hub, monitorFocus: FOCUS.skills };
  return { world, pickables, animators, refs };
}

// โคมไฟกระดาษ: ตัวโคมเป็นวัสดุ PBR แบบ emissive
function makeLantern(x, y, z, phase, animators, glowMat, capMat) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 5), plastic('#3b3350', 0.7));
  string.position.y = 0.28;
  g.add(string);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), glowMat);
  body.scale.y = 1.25;
  g.add(body);
  const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8);
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.y = 0.18;
  g.add(capTop);
  const capBot = new THREE.Mesh(capGeo, capMat);
  capBot.position.y = -0.18;
  g.add(capBot);
  animators.push((t) => {
    g.rotation.z = Math.sin(t * 1.4 + phase) * 0.12;
    g.rotation.x = Math.cos(t * 1.1 + phase) * 0.08;
  });
  return g;
}
