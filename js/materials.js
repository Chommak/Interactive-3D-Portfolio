import * as THREE from 'three';
import { gradientMap } from './textures.js';

let gmap = null;
function gMap() {
  if (!gmap) gmap = gradientMap();
  return gmap;
}

// uniform เวลากลาง ใช้ด้วยกันทุก shader ที่แอนิเมตแบบ realtime
export const uTime = { value: 0 };

// cel shading แบบอนิเมะ
export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gMap(), ...opts });
}

// PBR (Metalness-Roughness) สำหรับโลหะ/พลาสติก
export function metal(color, roughness = 0.35) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness });
}
export function plastic(color, roughness = 0.5) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness });
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x332a4a, side: THREE.BackSide });

// เส้นขอบลายเส้นแบบอนิเมะ (inverted hull)
export function addOutline(mesh, thickness = 0.03) {
  const hull = new THREE.Mesh(mesh.geometry, outlineMat);
  hull.scale.setScalar(1 + thickness);
  hull.castShadow = false;
  hull.receiveShadow = false;
  hull.raycast = () => {};
  mesh.add(hull);
  return mesh;
}

// ใบไม้/กอหญ้าไหวตามลมแบบ realtime ด้วย vertex shader
export function sway(mat, amp = 0.05, freq = 1.6) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float swayMask = clamp(transformed.y, 0.0, 1.5);
        transformed.x += sin(uTime * ${freq.toFixed(2)} + transformed.x * 2.1 + transformed.z * 1.7) * ${amp.toFixed(3)} * swayMask;
        transformed.z += cos(uTime * ${(freq * 0.85).toFixed(2)} + transformed.y * 2.3) * ${amp.toFixed(3)} * swayMask;`
      );
  };
  return mat;
}

// ก้อนดอกไม้ไหวทั้งก้อน (จุดกำเนิดอยู่กลางก้อน)
export function swayWhole(mat, amp = 0.045) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader =
      'uniform float uTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.x += sin(uTime * 1.3 + transformed.y * 1.6) * ${amp.toFixed(3)};
        transformed.z += cos(uTime * 1.1 + transformed.x * 1.4) * ${amp.toFixed(3)};`
      );
  };
  return mat;
}
