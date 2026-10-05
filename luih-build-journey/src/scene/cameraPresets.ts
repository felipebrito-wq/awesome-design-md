import type { V3 } from './home/partTypes'

export interface CameraPose {
  pos: V3
  target: V3
}

/** Stage + utility camera presets (fov 35). */
export const PRESETS: Record<string, CameraPose> = {
  overview: { pos: [34, 23, 40], target: [0, 1.4, -4] },
  site: { pos: [10, 46, 40], target: [0, 0, -3] },
  foundation: { pos: [24, 19, 25], target: [-0.5, 0.4, -3] },
  framing: { pos: [27, 13, 26], target: [0, 3.2, -3] },
  roughins: { pos: [18, 10.5, 12], target: [-2.5, 3.4, -3] },
  finishes: { pos: [10, 7.5, 33], target: [0, 3.0, 0] },
  complete: { pos: [-13, 5.8, -44], target: [-1.5, 2.6, -8] },
  front: { pos: [6, 4.2, 30], target: [0, 3.4, 0] },
  rear: { pos: [-13, 5.8, -44], target: [-1.5, 2.6, -8] },
  aerial: { pos: [0.5, 58, 4], target: [0, 0, -3] },
  interior: { pos: [-5.8, 1.7, -10.2], target: [1, 1.6, -3.5] },
}

/** Fixed jobsite camera stations — photos and Compare align on these. */
export const STATIONS: Record<string, CameraPose & { fov: number; label: string }> = {
  street: { pos: [7.4, 1.75, 26], target: [-1.5, 3.0, 0], fov: 44, label: 'Street — front' },
  'front-left': { pos: [-13.5, 1.8, 14.5], target: [-1, 2.4, -1.5], fov: 46, label: 'Front left' },
  'rear-pool': { pos: [-12.5, 1.75, -22.5], target: [-1.5, 2.8, -6], fov: 50, label: 'Rear — pool' },
  aerial: { pos: [20, 30, 27], target: [0, 0, -3.5], fov: 40, label: 'Drone' },
  'side-east': { pos: [14.8, 1.8, -14], target: [3, 2.4, -3], fov: 50, label: 'East side' },
  'int-great': { pos: [-6.2, 1.6, -10.4], target: [1.2, 1.7, -3.2], fov: 62, label: 'Great room' },
  'int-bath': { pos: [-5.9, 5.3, 3.6], target: [-9.5, 4.6, 0.6], fov: 66, label: 'Primary bath' },
  'int-garage': { pos: [4.0, 1.6, 4.4], target: [10.8, 1.5, -1.5], fov: 62, label: 'Garage' },
}

/** 2623 S Bryant Cir — framed for its footprint, grand oaks and lot. */
const FFE = 1.07
export const BRYANT_PRESETS: Record<string, CameraPose> = {
  overview: { pos: [15, 19, 37], target: [0, 3.6, -1.5] },
  site: { pos: [4, 54, 32], target: [0, 0, 0] },
  foundation: { pos: [20, 19, 32], target: [0, 1, 0] },
  framing: { pos: [26, 15, 32], target: [0, 4, 0] },
  roughins: { pos: [20, 11, 22], target: [-1, 4, 0] },
  finishes: { pos: [5, 6.5, 40], target: [0, 4.6, 2] },
  complete: { pos: [-12, 7.5, -42], target: [0, 4.2, -2] },
  front: { pos: [4, 4.5, 38], target: [0, 4.8, 2] },
  rear: { pos: [-12, 7.5, -42], target: [0, 4.2, -2] },
  aerial: { pos: [0.5, 62, 4], target: [0, 0, 0] },
  interior: { pos: [-3.5, FFE + 1.6, -3.4], target: [3.3, FFE + 1.5, -0.3] },
}
export const BRYANT_STATIONS: typeof STATIONS = {
  street: { pos: [7.5, 1.75, 30], target: [0, 4, 0], fov: 46, label: 'Street — front' },
  'front-left': { pos: [-13, 1.8, 16], target: [0, 3.6, 2], fov: 50, label: 'Front left' },
  'rear-pool': { pos: [-7, 1.8, -17.5], target: [1, 4, -2], fov: 56, label: 'Rear — pool' },
  aerial: { pos: [22, 32, 32], target: [0, 0, 0], fov: 42, label: 'Drone' },
  'side-east': { pos: [15, 1.8, -13], target: [4, 3.5, 0], fov: 54, label: 'East side' },
  'int-great': { pos: [-4, FFE + 1.6, -4], target: [3.4, FFE + 1.5, 1.2], fov: 64, label: 'Great room' },
  'int-garage': { pos: [5, 1.85, 9.2], target: [12, 1.5, 4.5], fov: 64, label: 'Garage' },
  'int-bath': { pos: [-9, FFE + 5.6, 4], target: [-11.5, FFE + 4.8, 6.5], fov: 66, label: 'Primary bath' },
  'elev-front': { pos: [0.5, 5.2, 120], target: [0.5, 5.2, 0], fov: 14, label: 'Front elevation' },
  'elev-rear': { pos: [0.5, 5.2, -120], target: [0.5, 5.2, 0], fov: 14, label: 'Rear elevation' },
}

let activeModel = 'demo'
export const setActiveModel = (m: string | undefined) => (activeModel = m ?? 'demo')
export const stationsFor = () => (activeModel === 'bryant' ? BRYANT_STATIONS : STATIONS)

export function resolvePose(key: string): (CameraPose & { fov?: number }) | undefined {
  if (key.startsWith('station:')) return stationsFor()[key.slice(8)]
  return (activeModel === 'bryant' ? BRYANT_PRESETS : PRESETS)[key]
}
