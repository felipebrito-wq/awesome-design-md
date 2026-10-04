import * as THREE from 'three'
import { SYSTEM_INDEX } from '@/domain/layers'

interface MatDef {
  color: string
  roughness?: number
  metalness?: number
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  side?: THREE.Side
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
  glass: { color: '#2d3d48', roughness: 0.04, metalness: 0.6, opacity: 0.42 },
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
  palmFrond: { color: '#5e7d3e', roughness: 0.9, side: THREE.DoubleSide },
  mulch: { color: '#4a3a2c', roughness: 1 },
  fenceScreen: { color: '#343a38', roughness: 0.95 },
  steel: { color: '#3a3e42', roughness: 0.5, metalness: 0.6 },
  stake: { color: '#d9c2a0', roughness: 0.8 },
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
  return m
}

export const GHOST_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#4f7cac',
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
})
