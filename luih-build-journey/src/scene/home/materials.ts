import * as THREE from 'three'
import { applyFocusFade } from '../focusFade'
import { SYSTEM_INDEX } from '@/domain/layers'
import { seamTexture } from './roofs'

interface MatDef {
  color: string
  roughness?: number
  metalness?: number
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  side?: THREE.Side
  /** World-space lap-siding reveal lines (7"). */
  lap?: boolean
  map?: 'seam'
}

/** Architectural palette — warm, desaturated, Central-Florida modern. */
export const MATERIALS: Record<string, MatDef> = {
  white: { color: '#ffffff', roughness: 0.8 },
  grassWild: { color: '#7f8a55', roughness: 1 },
  dirt: { color: '#b89f7a', roughness: 1 },
  sand: { color: '#c2a883', roughness: 1 },
  trench: { color: '#6e5a45', roughness: 1 },
  concrete: { color: '#bdbab3', roughness: 0.92 },
  concreteFresh: { color: '#a8a49c', roughness: 0.9 },
  lumber: { color: '#dcbf8f', roughness: 0.78 },
  osb: { color: '#c79f69', roughness: 0.9 },
  vapor: { color: '#23272a', roughness: 0.35 },
  rebar: { color: '#6a4a36', roughness: 0.6, metalness: 0.4 },
  pvc: { color: SYSTEM_INDEX.drain.color, roughness: 0.4 },
  duct: { color: SYSTEM_INDEX.hvac.color, roughness: 0.32, metalness: 0.85 },
  ductFlex: { color: '#d3d6d9', roughness: 0.45, metalness: 0.6 },
  wire: { color: SYSTEM_INDEX.electrical.color, roughness: 0.5 },
  lv: { color: SYSTEM_INDEX.lowvoltage.color, roughness: 0.5 },
  panel: { color: '#9aa0a6', roughness: 0.45, metalness: 0.5 },
  equipment: { color: '#c9ccd0', roughness: 0.4, metalness: 0.55 },
  wrap: { color: '#dfe3e6', roughness: 0.7 },
  stucco: { color: '#f2eee7', roughness: 0.93 },
  fascia: { color: '#1f2226', roughness: 0.45, metalness: 0.35 },
  membrane: { color: '#d9d7d1', roughness: 0.85 },
  frame: { color: '#1b1d20', roughness: 0.4, metalness: 0.4 },
  glass: { color: '#1e2a33', roughness: 0.03, metalness: 0.75, opacity: 0.78 },
  wood: { color: '#a8774d', roughness: 0.62 },
  garageDoor: { color: '#6b4c35', roughness: 0.6 },
  insulation: { color: '#ead9a6', roughness: 1 },
  drywall: { color: '#d6d4ce', roughness: 0.95 },
  tile: { color: '#e6e0d6', roughness: 0.35 },
  oak: { color: '#c39a6b', roughness: 0.55 },
  cabinet: { color: '#b48d63', roughness: 0.55 },
  counter: { color: '#f3f1ec', roughness: 0.18 },
  ceramic: { color: '#f8f8f6', roughness: 0.15 },
  bulb: { color: '#fff4e2', roughness: 0.4, emissive: '#ffcf8a', emissiveIntensity: 0 },
  fabric: { color: '#d9d2c5', roughness: 0.95 },
  paver: { color: '#e5dbc8', roughness: 0.85 },
  water: { color: '#3ba3bd', roughness: 0.05, metalness: 0.15, opacity: 0.82 },
  poolShell: { color: '#9aa0a3', roughness: 0.9, side: THREE.DoubleSide },
  coping: { color: '#efe7d8', roughness: 0.8 },
  sod: { color: '#6f8b4c', roughness: 1 },
  hedge: { color: '#40593a', roughness: 1 },
  leaf: { color: '#4f6b3e', roughness: 1 },
  leafWild: { color: '#6b7744', roughness: 1 },
  leafPine: { color: '#4b5d3a', roughness: 1 },
  palmTrunk: { color: '#8f7f69', roughness: 0.95 },
  palmFrond: { color: '#56763a', roughness: 0.8, side: THREE.DoubleSide },
  mulch: { color: '#4a3a2c', roughness: 1 },
  fenceScreen: { color: '#343a38', roughness: 0.95 },
  steel: { color: '#3a3e42', roughness: 0.5, metalness: 0.6 },
  stake: { color: '#d9c2a0', roughness: 0.8 },
  // — Real-home finishes (2623 S Bryant Cir spec book) —
  siding: { color: '#f1f0eb', roughness: 0.7, lap: true },
  sidingPrimed: { color: '#dedcd5', roughness: 0.8, lap: true },
  stuccoRaw: { color: '#cfcac1', roughness: 0.95 },
  roofMetal: { color: '#ffffff', roughness: 0.4, metalness: 0.55, map: 'seam', side: THREE.DoubleSide },
  underlay: { color: '#3d4146', roughness: 0.95, side: THREE.DoubleSide },
  roofDeck: { color: '#c79f69', roughness: 0.9, side: THREE.DoubleSide },
  soffit: { color: '#e2e3df', roughness: 0.9 },
  lvp: { color: '#8b6b4f', roughness: 0.55 },
  ashCabinet: { color: '#cbc2b4', roughness: 0.6 },
  quartz: { color: '#f2f0eb', roughness: 0.2 },
  poolDeck: { color: '#e3dac8', roughness: 0.85 },
  poolWater: { color: '#2a86b8', roughness: 0.05, metalness: 0.15, opacity: 0.85 },
  paverGray: { color: '#a3a39d', roughness: 0.9 },
  screen: { color: '#1b1e21', roughness: 0.6, opacity: 0.32, side: THREE.DoubleSide },
  trimWhite: { color: '#f7f7f4', roughness: 0.6 },
  oldHouse: { color: '#d8cfbf', roughness: 0.95 },
  oldRoof: { color: '#6d6158', roughness: 0.95 },
  barricade: { color: '#e8772e', roughness: 0.7 },
  grassLot: { color: '#7c9150', roughness: 1 },
}

export function makeMaterial(key: string): THREE.MeshStandardMaterial {
  const d = MATERIALS[key] ?? MATERIALS.white
  const m = new THREE.MeshStandardMaterial({
    color: d.color,
    roughness: d.roughness ?? 0.8,
    metalness: d.metalness ?? 0,
    transparent: (d.opacity ?? 1) < 1,
    opacity: d.opacity ?? 1,
    emissive: new THREE.Color(d.emissive ?? '#000000'),
    emissiveIntensity: d.emissiveIntensity ?? 1,
    side: d.side ?? THREE.FrontSide,
    depthWrite: (d.opacity ?? 1) >= 1,
  })
  m.userData.baseOpacity = d.opacity ?? 1
  m.userData.baseColor = d.color
  if (d.map === 'seam') m.map = (SEAM ??= seamTexture())
  if (d.lap) patchLapSiding(m)
  if (key === 'palmFrond' || key === 'palmTrunk') applyFocusFade(m)
  return m
}

let SEAM: THREE.Texture | undefined

/** Darkens a thin reveal every 7" in world Y — lap siding without UVs. */
function patchLapSiding(m: THREE.MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLapWorld;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLapWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLapWorld;')
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\nfloat lapF = fract(vLapWorld.y / 0.178);\ndiffuseColor.rgb *= mix(0.78, 1.0, smoothstep(0.0, 0.07, lapF));',
      )
  }
  m.customProgramCacheKey = () => 'lap-siding'
}

export const GHOST_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#20a483',
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
})
