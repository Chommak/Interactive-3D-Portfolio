import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function ensureFonts() {
  return Promise.all([
    document.fonts.load('300 30px "Mitr"'),
    document.fonts.load('400 30px "Mitr"'),
    document.fonts.load('500 44px "Mitr"'),
    document.fonts.load('600 52px "Mitr"'),
    document.fonts.load('700 64px "Mitr"'),
  ]).then(() => document.fonts.ready);
}

// gradient map 3 ขั้นสำหรับ MeshToonMaterial (cel shading)
export function gradientMap() {
  const data = new Uint8Array([96, 170, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// วาดรูปให้เต็มกรอบโดยรักษาอัตราส่วน (cover)
function drawCover(ctx, image, x, y, w, h) {
  const iw = image.width || 1;
  const ih = image.height || 1;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// ตัดบรรทัดทีละตัวอักษร (รองรับภาษาไทยซึ่งไม่มีช่องว่างระหว่างคำ)
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let cy = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineHeight;
}

// ป้ายไม้กระดานข้อความ (ABOUT / CONTACT / SKILLS)
export function boardTexture({ title, lines, bg = '#f7e6c9', ink = '#54402c', accent = '#b9834a' }) {
  const c = makeCanvas(512, 288);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = 'rgba(120, 84, 48, 0.16)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 30 + i * 46);
    ctx.bezierCurveTo(170, 18 + i * 46, 340, 46 + i * 46, 512, 26 + i * 46);
    ctx.stroke();
  }
  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  roundRect(ctx, 8, 8, 496, 272, 22);
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 46px "Mitr"';
  ctx.fillText(title, 256, 52);
  ctx.font = '300 30px "Mitr"';
  let y = 116;
  for (const ln of lines) y = wrapText(ctx, ln, 256, y, 440, 40);
  return toTexture(c);
}

// ป้ายชื่อใต้เสาโทริอิ
export function nameTexture(p) {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff8f2';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#e2574c';
  ctx.lineWidth = 14;
  roundRect(ctx, 10, 10, 492, 236, 26);
  ctx.stroke();
  ctx.fillStyle = '#3b3350';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 52px "Mitr"';
  ctx.fillText(p.nameTh, 256, 78);
  ctx.font = '300 30px "Mitr"';
  ctx.fillStyle = '#6b6285';
  ctx.fillText(p.university, 256, 140);
  ctx.font = '300 26px "Mitr"';
  ctx.fillText(p.nameEn + '  •  ID ' + p.studentId, 256, 190);
  return toTexture(c);
}

// บัตรประจำตัว + รูปถ่าย (ใช้ assets/photo.jpg ถ้ามี)
export function cardTexture(p, photo) {
  const c = makeCanvas(512, 320);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#8ec9f0';
  ctx.fillRect(0, 0, 512, 64);
  ctx.fillStyle = '#fff8f2';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '500 34px "Mitr"';
  ctx.fillText('STUDENT CARD', 24, 33);
  if (photo) {
    ctx.save();
    roundRect(ctx, 28, 92, 150, 180, 16);
    ctx.clip();
    ctx.drawImage(photo.image, 28, 92, 150, 180);
    ctx.restore();
  } else {
    ctx.fillStyle = '#fff8f2';
    roundRect(ctx, 28, 92, 150, 180, 16);
    ctx.fill();
    ctx.fillStyle = '#f7a8c4';
    ctx.beginPath();
    ctx.arc(103, 165, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b3350';
    ctx.font = '300 22px "Mitr"';
    ctx.textAlign = 'center';
    ctx.fillText('your photo', 103, 240);
    ctx.textAlign = 'left';
  }
  ctx.strokeStyle = '#3b3350';
  ctx.lineWidth = 5;
  roundRect(ctx, 28, 92, 150, 180, 16);
  ctx.stroke();
  ctx.fillStyle = '#3b3350';
  ctx.font = '500 34px "Mitr"';
  ctx.fillText(p.nameTh, 200, 120);
  ctx.font = '300 26px "Mitr"';
  ctx.fillStyle = '#6b6285';
  ctx.fillText('ID ' + p.studentId, 200, 162);
  wrapTextLeft(ctx, p.university, 200, 204, 288, 32);
  ctx.font = '300 24px "Mitr"';
  ctx.fillStyle = '#d16ba5';
  ctx.fillText(p.email, 200, 280);
  ctx.strokeStyle = '#3b3350';
  ctx.lineWidth = 8;
  roundRect(ctx, 6, 6, 500, 308, 20);
  ctx.stroke();
  return toTexture(c);
}

function wrapTextLeft(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let cy = y;
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// หน้าจอคอมโชว์พอร์ตโฟลิโอ
export function screenTexture(p) {
  const c = makeCanvas(512, 320);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#171c30';
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#232a45';
  ctx.fillRect(0, 0, 512, 44);
  ['#f7a8c4', '#ffd98e', '#b8e6a5'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(26 + i * 26, 22, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#8ec9f0';
  ctx.font = '600 40px "Mitr"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PORTFOLIO', 24, 82);
  ctx.font = '300 24px "Mitr"';
  ctx.fillStyle = '#cdd6f4';
  p.projects.forEach((pr, i) => {
    ctx.fillStyle = pr.color;
    ctx.fillRect(24, 112 + i * 40, 14, 14);
    ctx.fillStyle = '#cdd6f4';
    ctx.fillText(pr.title, 48, 120 + i * 40);
  });
  ctx.fillStyle = '#f7a8c4';
  ctx.font = '300 22px "Mitr"';
  ctx.fillText(p.email + '  •  ' + p.phone, 24, 288);
  return toTexture(c);
}

// โปสเตอร์ผลงานแต่ละชิ้น
export function projectTexture(pr, index, img) {
  const c = makeCanvas(512, 384);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff8f2';
  ctx.fillRect(0, 0, 512, 384);
  ctx.fillStyle = pr.color;
  ctx.fillRect(0, 0, 512, 150);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(430, 40, 60, 0, Math.PI * 2);
  ctx.arc(360, 110, 34, 0, Math.PI * 2);
  ctx.fill();
  if (img) {
    ctx.save();
    roundRect(ctx, 372, 22, 116, 106, 14);
    ctx.clip();
    drawCover(ctx, img.image || img, 372, 22, 116, 106);
    ctx.restore();
    ctx.strokeStyle = '#3b3350';
    ctx.lineWidth = 5;
    roundRect(ctx, 372, 22, 116, 106, 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#3b3350';
  ctx.font = '700 90px "Mitr"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('0' + (index + 1), 26, 80);
  ctx.fillStyle = '#3b3350';
  ctx.font = '600 44px "Mitr"';
  ctx.fillText(pr.title, 26, 190);
  ctx.font = '300 26px "Mitr"';
  ctx.fillStyle = '#6b6285';
  wrapTextLeft(ctx, pr.desc, 26, 240, 460, 34);
  ctx.font = '400 24px "Mitr"';
  ctx.fillStyle = '#d16ba5';
  ctx.fillText(pr.tags.join('  •  '), 26, 352);
  ctx.strokeStyle = '#3b3350';
  ctx.lineWidth = 10;
  roundRect(ctx, 5, 5, 502, 374, 18);
  ctx.stroke();
  return toTexture(c);
}

// กลีบซากุระสำหรับ particle (points sprite)
export function petalTexture() {
  const c = makeCanvas(64, 64);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  g.addColorStop(0, 'rgba(255, 236, 244, 1)');
  g.addColorStop(1, 'rgba(247, 168, 196, 1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(32, 34, 22, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(32, 2);
  ctx.lineTo(22, 20);
  ctx.lineTo(42, 20);
  ctx.closePath();
  ctx.fill();
  return toTexture(c);
}
