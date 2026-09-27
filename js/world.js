import * as THREE from 'three';
import { toon, metal, plastic, addOutline, sway, swayWhole } from './materials.js';
import * as TX from './textures.js';
import { skyMaterial, waterMaterial, petalMaterial } from './shaders.js';
import { PROFILE } from './config.js';

const GY = 0.5; // ระดับพื้นหญ้าบนเกาะ

export function buildWorld(photoTex) {
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
  const CAM = { x: 8.6, z: 8.2 };
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
    about: focusFrom(1.95, 1.62, 1.86, 2.7, 0.4),
    contact: focusFrom(-1.06, 1.42, 2.37, 3.1, 0.6),
    skills: focusFrom(-0.5, 1.5, -1.3, 2.5, 0.5),
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
  desk.position.set(-0.5, GY, -1.3);
  desk.rotation.y = 0.6;
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
  world.add(desk);

  // ---------- บัตรนักศึกษา (รูปถ่ายของตัวเองเป็น texture) ----------
  const card = new THREE.Group();
  card.position.set(-2.0, GY, 0.9);
  faceCam(card, -2.0, 0.9);
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
  torii.position.set(1.95, GY, 1.86);
  faceCam(torii, 1.95, 1.86);
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

  // โคมไฟข้างเสาโทริอิ
  torii.add(makeLantern(0.85, 1.5, 0.16, 0.7, animators, glowMat, lanternCapMat));
  world.add(torii);

  // ---------- ซุ้มกระดานข่าว 3 หัวข้อ (ABOUT / CONTACT / SKILLS) ----------
  const kiosk = new THREE.Group();
  kiosk.position.set(-1.06, GY, 2.37);
  faceCam(kiosk, -1.06, 2.37);
  const kLegGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.9, 7);
  [-1.58, 1.58].forEach((x) => {
    const leg = new THREE.Mesh(kLegGeo, toon('#8a5a44'));
    leg.position.set(x, 0.95, 0);
    leg.castShadow = true;
    kiosk.add(leg);
  });
  const rail = addOutline(new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.1, 0.09), toon('#8a5a44')), 0.03);
  rail.position.y = 1.86;
  rail.castShadow = true;
  kiosk.add(rail);
  const roof = addOutline(new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.08, 0.44), toon('#3b3350')), 0.03);
  roof.position.y = 2.0;
  roof.rotation.x = -0.14;
  roof.castShadow = true;
  kiosk.add(roof);
  const boards = [
    { key: 'about', title: 'ABOUT', lines: [PROFILE.nameTh, PROFILE.university] },
    { key: 'contact', title: 'CONTACT', lines: [PROFILE.email, PROFILE.phone] },
    { key: 'skills', title: 'SKILLS', lines: [PROFILE.skills.slice(0, 3).join(' • ')] },
  ];
  boards.forEach((b, i) => {
    const g = new THREE.Group();
    g.position.set((i - 1) * 1.12, 1.28, 0.06);
    const box = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.62, 0.05), toon('#c9955c')), 0.04);
    box.castShadow = true;
    g.add(box);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.54),
      new THREE.MeshBasicMaterial({ map: TX.boardTexture(b) })
    );
    plane.position.z = 0.03;
    g.add(plane);
    pick(plane, b.key, g);
    plane.userData.focus = FOCUS[b.key];
    kiosk.add(g);
  });
  world.add(kiosk);

  // ---------- เฟรมผลงานลอยได้ (เรียงเป็นแถวโค้งริมเกาะ หันเข้าหากล้อง) ----------
  const frameSpots = [
    [2.75, 1.72, 0.06],
    [2.3, 1.62, -1.5],
    [1.05, 1.72, -2.54],
  ];
  PROFILE.projects.forEach((pr, i) => {
    const [x, y, z] = frameSpots[i];
    const g = new THREE.Group();
    g.position.set(x, y, z);
    faceCam(g, x, z);
    const frame = addOutline(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.06), toon('#fff8f2')), 0.04);
    frame.castShadow = true;
    g.add(frame);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.79), new THREE.MeshBasicMaterial({ map: TX.projectTexture(pr, i) }));
    plane.position.z = 0.04;
    g.add(plane);
    pick(plane, 'project' + i, g);
    plane.userData.focus = focusFrom(x, y, z, 2.1, 0.3);
    animators.push((t) => {
      g.position.y = y + Math.sin(t * 1.1 + i * 2.1) * 0.07;
      g.rotation.z = Math.sin(t * 0.9 + i) * 0.03;
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
    [-1.2, 0.6, 1], [0.8, 1.9, 0.9], [-0.4, 2.4, 1.1], [1.9, 2.2, 0.8],
    [-2.9, 0.4, 1.2], [2.9, -0.9, 1], [-1.5, -2.6, 0.9], [0.9, -2.4, 1.1],
    [2.2, -2.0, 0.85], [-2.6, -0.6, 1], [-0.9, 1.5, 0.8], [1.6, 0.55, 0.95],
    [2.6, 1.6, 1.05], [-2.0, 2.2, 0.9],
  ].forEach(([x, z, s], i) => {
    const m = new THREE.Mesh(tuftGeo, i % 2 ? grassMatA : grassMatB);
    m.position.set(x, GY, z);
    m.scale.setScalar(s);
    m.rotation.y = i * 1.7;
    world.add(m);
  });

  const stepGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.08, 7);
  [[1.55, 1.5], [1.1, 1.0], [0.65, 0.5], [0.2, 0.0], [-0.25, -0.5]].forEach(([x, z], i) => {
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
  const hangB = new THREE.Vector3(1.95, 2.78, 1.86);
  const hangDir = hangB.clone().sub(hangA);
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, hangDir.length(), 4), stringMat);
  line.position.copy(hangA).add(hangB).multiplyScalar(0.5);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hangDir.clone().normalize());
  world.add(line);
  [0.22, 0.45, 0.68, 0.88].forEach((t, i) => {
    const p = hangA.clone().lerp(hangB, t);
    p.y -= Math.sin(t * Math.PI) * 0.35;
    const l = makeLantern(p.x, p.y, p.z, i * 1.3, animators, glowMat, lanternCapMat);
    l.scale.setScalar(0.8);
    world.add(l);
  });

  [[3.05, 0.75], [0.85, 3.05], [-2.85, 1.5]].forEach(([x, z]) => {
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

  const pointLights = [new THREE.PointLight(0xffb46b, 0, 7, 2), new THREE.PointLight(0xffb46b, 0, 7, 2)];
  pointLights[0].position.set(0.9, GY + 1.2, 2.6);
  pointLights[1].position.set(-1.6, GY + 1.7, -1.2);
  pointLights.forEach((l) => world.add(l));

  const refs = { skyMat, waterMat, glowMat, screenMat, starsMat, sunMesh, moonMesh, pointLights };
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
