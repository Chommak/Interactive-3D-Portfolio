import * as THREE from 'three';

const pair = (a, b) => [new THREE.Color(a), new THREE.Color(b)];
const P = {
  skyTop: pair('#7fc4ee', '#131a33'),
  skyBottom: pair('#ffe3ec', '#4b3a6b'),
  fog: pair('#e6ecf7', '#232338'),
  waterDeep: pair('#4f8fd6', '#1d3a6b'),
  waterShallow: pair('#a5dcf0', '#3f6ea8'),
  waterFoam: pair('#ffffff', '#7d8fb8'),
  hemiSky: pair('#cfe8ff', '#39456f'),
  hemiGround: pair('#ffd9e8', '#241d33'),
  dir: pair('#fff2df', '#bcd0ff'),
};
const lerp = (a, b, m) => a + (b - a) * m;

// m = 0 กลางวัน, m = 1 กลางคืน (เรียกทุกเฟรมเพื่อไล่ระดับเนียน ๆ)
export function createDayNight(refs, { hemi, sun, fog }) {
  return {
    setMix(m) {
      refs.skyMat.uniforms.uTop.value.lerpColors(P.skyTop[0], P.skyTop[1], m);
      refs.skyMat.uniforms.uBottom.value.lerpColors(P.skyBottom[0], P.skyBottom[1], m);
      refs.waterMat.uniforms.uDeep.value.lerpColors(P.waterDeep[0], P.waterDeep[1], m);
      refs.waterMat.uniforms.uShallow.value.lerpColors(P.waterShallow[0], P.waterShallow[1], m);
      refs.waterMat.uniforms.uFoam.value.lerpColors(P.waterFoam[0], P.waterFoam[1], m);
      fog.color.lerpColors(P.fog[0], P.fog[1], m);
      hemi.color.lerpColors(P.hemiSky[0], P.hemiSky[1], m);
      hemi.groundColor.lerpColors(P.hemiGround[0], P.hemiGround[1], m);
      hemi.intensity = lerp(0.9, 0.35, m);
      sun.color.lerpColors(P.dir[0], P.dir[1], m);
      sun.intensity = lerp(1.6, 0.4, m);
      refs.glowMat.emissiveIntensity = lerp(0.55, 1.9, m);
      refs.screenMat.emissiveIntensity = lerp(0.5, 0.95, m);
      for (const l of refs.pointLights) l.intensity = lerp(0, 1.5, m);
      refs.starsMat.opacity = m;
      refs.sunMesh.material.opacity = 1 - m;
      refs.moonMesh.material.opacity = m;
    },
  };
}
