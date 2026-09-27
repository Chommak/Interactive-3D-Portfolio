import * as THREE from 'three';
import { PROFILE } from './config.js';

const panelEl = document.getElementById('panel');
const bodyEl = document.getElementById('panel-body');

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function row(k, v) {
  return `<div class="row"><span class="k">${esc(k)}</span><span class="v">${v}</span></div>`;
}

function chips(list, blue) {
  return `<div class="chips">${list.map((s) => `<span class="chip${blue ? ' blue' : ''}">${esc(s)}</span>`).join('')}</div>`;
}

function panelHTML(key) {
  const p = PROFILE;
  if (key === 'about') {
    return `
      <h2>${esc(p.nameTh)}</h2>
      <div class="sub">${esc(p.nameEn)} • ชื่อเล่น ${esc(p.nickname)}</div>
      ${row('รหัสนักศึกษา', esc(p.studentId))}
      ${row('มหาวิทยาลัย', esc(p.university))}
      ${row('คณะ', esc(p.faculty))}
      ${row('สาขา', esc(p.major))}
      <p class="desc">${esc(p.bio)}</p>`;
  }
  if (key === 'contact') {
    return `
      <h2>ช่องทางติดต่อ</h2>
      <div class="sub">คลิกป้าย CONTACT ในฉากหรือเปิดจากตรงนี้ก็ได้</div>
      ${row('ที่อยู่', esc(p.address))}
      ${row('อีเมล', `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`)}
      ${row('โทรศัพท์', `<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`)}
      ${p.socials.map((s) => row(s.label, `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`)).join('')}`;
  }
  if (key === 'skills') {
    return `
      <h2>ทักษะ</h2>
      <div class="sub">เครื่องมือที่ใช้เป็นประจำ</div>
      ${chips(p.skills)}
      ${chips(['Cel Shading', 'Vertex Shader', 'PBR', '3D Picking'], true)}`;
  }
  if (key === 'portfolio') {
    return `
      <h2>พอร์ตโฟลิโอ</h2>
      <div class="sub">ผลงานทั้งหมด — คลิกเฟรมลอยในฉากเพื่อดูรายละเอียด</div>
      ${p.projects.map((pr, i) => row('ชิ้นที่ ' + (i + 1), esc(pr.title))).join('')}
      <p class="desc">${esc(p.bio)}</p>`;
  }
  if (key.startsWith('project')) {
    const i = Number(key.slice(7));
    const pr = p.projects[i];
    return `
      <h2>${esc(pr.title)}</h2>
      <div class="sub">โปรเจกต์ชิ้นที่ ${i + 1}</div>
      <p class="desc">${esc(pr.desc)}</p>
      ${chips(pr.tags)}`;
  }
  return '';
}

export function createInteraction(dom, camera, pickables, onFocus) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const roots = [...new Set(pickables.map((m) => m.userData.hoverRoot))];
  let inside = false;
  let downPos = null;
  let hovered = null;

  function setNDC(e) {
    const r = dom.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  function pickAt() {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    return hits.length ? hits[0].object : null;
  }

  dom.addEventListener('pointermove', (e) => {
    setNDC(e);
    inside = true;
  });
  dom.addEventListener('pointerleave', () => {
    inside = false;
  });
  dom.addEventListener('pointerdown', (e) => {
    downPos = [e.clientX, e.clientY];
  });
  dom.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const dx = e.clientX - downPos[0];
    const dy = e.clientY - downPos[1];
    downPos = null;
    if (dx * dx + dy * dy > 36) return; // ลากหมุนกล้อง ไม่ถือว่าคลิก
    setNDC(e);
    const hit = pickAt();
    if (hit) {
      open(hit.userData.panelKey);
      hit.userData.hoverRoot.userData.popT = 0;
      if (hit.userData.focus && onFocus) onFocus(hit.userData.focus);
    } else close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  document.getElementById('panel-close').addEventListener('click', close);

  function open(key) {
    bodyEl.innerHTML = panelHTML(key);
    panelEl.classList.add('open');
  }
  function close() {
    panelEl.classList.remove('open');
  }

  function update(dt) {
    hovered = null;
    if (inside) {
      const hit = pickAt();
      if (hit) hovered = hit.userData.hoverRoot;
      dom.style.cursor = hit ? 'pointer' : 'grab';
    } else {
      dom.style.cursor = 'default';
    }
    for (const r of roots) {
      const target = r === hovered ? 1.07 : 1.0;
      const next = r.scale.x + (target - r.scale.x) * 0.15;
      let bounce = 0;
      if (r.userData.popT !== undefined && r.userData.popT < 2) {
        r.userData.popT += dt;
        bounce = Math.exp(-3.5 * r.userData.popT) * Math.sin(10 * r.userData.popT) * 0.12;
      }
      r.scale.setScalar(next + bounce);
    }
  }

  return { update, open, close };
}
