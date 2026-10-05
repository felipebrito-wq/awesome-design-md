import * as THREE from 'three'

/**
 * Focus on the house: context geometry (trees, neighbors, yard palms) that sits between
 * the camera and the home dissolves with a screen-door dither, so it never hides the build.
 * `FOCUS_NEAR` = view distance below which fading starts (updated per frame by the Site).
 */
export const FOCUS_NEAR = { value: 0 }

export function applyFocusFade(m: THREE.Material) {
  const prev = m.onBeforeCompile
  m.onBeforeCompile = (shader, r) => {
    prev?.call(m, shader, r)
    shader.uniforms.uFocusNear = FOCUS_NEAR
    // Per-object distance (instance origin) so a tree/neighbor fades as a whole, not in bands
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vFocusD;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        #ifdef USE_INSTANCING
          vFocusD = length((modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
        #else
          vFocusD = length((modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
        #endif`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFocusNear;\nvarying float vFocusD;')
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        if (uFocusNear > 0.0) {
          float fk = smoothstep(0.96, 1.0, vFocusD / uFocusNear);
          float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          if (fk < 0.999 && fk * 0.92 < ign) discard;
        }`,
      )
  }
  const key = m.customProgramCacheKey?.bind(m)
  m.customProgramCacheKey = () => (key ? key() : '') + '|focus-fade'
  return m
}
