import * as THREE from 'three';
import { uTime } from './materials.js';

// โดมท้องฟ้าไล่สีพาสเทล
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#7fc4ee') },
      uBottom: { value: new THREE.Color('#ffe3ec') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        vec3 col = mix(uBottom, uTop, smoothstep(0.02, 0.45, h));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ผิวน้ำ: คลื่นซายน์ซ้อนกันใน vertex shader + ไล่สีแบบ cel ใน fragment
export function waterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uDeep: { value: new THREE.Color('#4f8fd6') },
      uShallow: { value: new THREE.Color('#a5dcf0') },
      uFoam: { value: new THREE.Color('#ffffff') },
      uIslandR: { value: 3.62 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vWave;
      varying vec2 vXZ;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 1.3 + uTime * 1.5) * 0.10
                + cos(p.z * 1.2 + uTime * 1.1) * 0.10
                + sin((p.x + p.z) * 0.7 - uTime * 0.8) * 0.06;
        p.y += w;
        vWave = w;
        vXZ = p.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform float uIslandR;
      varying float vWave;
      varying vec2 vXZ;
      void main() {
        float band = floor(vWave * 10.0) / 10.0;
        vec3 col = mix(uDeep, uShallow, smoothstep(-0.12, 0.14, band));
        float crest = smoothstep(0.19, 0.23, vWave);
        float r = length(vXZ);
        float shore = 1.0 - smoothstep(uIslandR + 0.10, uIslandR + 0.55, r);
        col = mix(col, uFoam, max(crest * 0.7, shore * 0.75));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// กลีบซากุระปลิว: คำนวณตำแหน่งตก/หมุนวนใน vertex shader ทั้งหมด
export function petalMaterial(map) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime,
      uMap: { value: map },
      uCenter: { value: new THREE.Vector3() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCenter;
      attribute vec3 aSeed;
      attribute float aScale;
      varying float vFade;
      void main() {
        float speed = 0.35 + aSeed.x * 0.30;
        float life = mod(uTime * speed + aSeed.y * 9.0, 8.0);
        float y = 1.6 - life * 0.35;
        float ang = aSeed.z * 6.2831 + uTime * (0.5 + aSeed.x * 0.7);
        float rad = 0.5 + life * 0.24 + sin(uTime * 0.8 + aSeed.y * 6.2831) * 0.15;
        vec3 p = uCenter + vec3(cos(ang) * rad, y, sin(ang) * rad);
        p.x += sin(uTime * 1.7 + aSeed.y * 6.2831) * 0.25;
        vFade = smoothstep(-0.15, 0.55, y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aScale * 95.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vFade;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        float a = t.a * vFade;
        if (a < 0.02) discard;
        gl_FragColor = vec4(t.rgb, a);
      }`,
  });
}
