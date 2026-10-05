/**
 * 2623 S Bryant Cir — massing transcribed from the sealed construction set
 * (CADDesign / Carotti Engineering, R3 03-26-2025): A-1 site plan, A-3/A-4
 * floor plans, A-5/A-6 elevations. Plan units are FEET; helpers convert to
 * scene meters (+z = street, +x = garage side).
 *
 * Simplified: rooms collapsed to rectangles, openings approximate. Replace
 * with the BIM-derived GLB when available (docs/MODEL_PIPELINE.md).
 */
export const FT = 0.3048
/** plan x (ft, from left wall) → scene X (m) */
export const X = (x: number) => (x - 41.35) * FT
/** plan d (ft, depth back from garage face) → scene Z (m) */
export const Z = (d: number) => (34 - d) * FT

// Levels (m). FFE is 3.5 ft above grade (flood zone AE, DFE 13.5' NAVD).
export const GRADE = 0
export const FFE = 1.07
export const GAR_SLAB = 0.25
export const F1_BLOCK_TOP = FFE + 3.15
export const F1_TOP = FFE + 3.45 // tie beam top
export const F2_FLOOR = FFE + 3.87
export const F2_BLOCK_TOP = F2_FLOOR + 2.75
export const F2_TOP = F2_FLOOR + 3.05
export const GAR_BLOCK_TOP = GAR_SLAB + 3.35
export const GAR_TOP = GAR_SLAB + 3.65

export type Pt = [number, number] // plan (x ft, d ft)

/** First floor conditioned outline (clockwise from front-left), excludes garage. */
export const F1_OUTLINE: Pt[] = [
  [0.4, 7], [18.5, 7], [18.5, 9], [52, 9], [52, 23], [75, 23], [75, 69], [61, 69], [61, 50], [18.5, 50], [18.5, 54], [0.4, 54],
]
/** Garage walls (open polyline; shares house walls at x=52 and d=23). */
export const GARAGE_LINE: Pt[] = [[52, 9], [52, 0], [82.7, 0], [82.7, 23], [75, 23]]
export const GARAGE_RECT = { x0: 52, d0: 0, x1: 82.7, d1: 23 }

/** Second floor outline (balcony recess at front, open balcony + wet bar at rear). */
export const F2_OUTLINE: Pt[] = [
  [0.4, 13], [24, 13], [24, 15.5], [34, 15.5], [34, 13], [59, 13], [59, 17.5], [75, 17.5], [75, 69], [61, 69], [61, 64], [45, 64], [45, 52], [18.5, 52], [18.5, 57], [0.4, 57],
]

/** Hip-roof rectangles at the F2 plate (6:12) and garage (4:12). */
export const MAIN_ROOFS = [
  { x0: 0.4, d0: 13, x1: 18.5, d1: 57 },
  { x0: 18.5, d0: 13, x1: 59, d1: 52 },
  { x0: 59, d0: 17.5, x1: 75, d1: 69 },
  { x0: 45, d0: 52, x1: 61, d1: 64 },
]

export interface PlanOpening {
  floor: 1 | 2 | 0 // 0 = garage
  /** wall line: constant d (front/rear) or x (sides) */
  line: { d: number } | { x: number }
  from: number
  to: number
  sill: number // ft above floor
  head: number
  kind: 'window' | 'slider' | 'entry' | 'garage' | 'door'
}

const W = (floor: 1 | 2 | 0, line: { d: number } | { x: number }, from: number, to: number, sill: number, head: number, kind: PlanOpening['kind'] = 'window'): PlanOpening => ({ floor, line, from, to, sill, head, kind })

export const OPENINGS: PlanOpening[] = [
  // Front (A-5)
  W(1, { d: 7 }, 3, 9.5, 2, 8.5),
  W(1, { d: 9 }, 24.5, 31.5, 0, 9.5, 'entry'),
  W(1, { d: 9 }, 38, 41.5, 3, 10),
  W(0, { d: 0 }, 54.5, 70.5, 0, 8, 'garage'),
  W(0, { d: 0 }, 72.5, 81.5, 0, 8, 'garage'),
  W(2, { d: 13 }, 3, 10, 2, 8),
  W(2, { d: 15.5 }, 25, 33, 0, 8, 'slider'),
  W(2, { d: 13 }, 38, 41.5, 1, 7.5),
  W(2, { d: 13 }, 50, 53, 3, 6),
  W(2, { d: 17.5 }, 61, 72, 2, 8),
  // Rear (A-6)
  W(1, { d: 54 }, 3, 15, 1.5, 9.5),
  W(1, { d: 50 }, 20, 35, 0, 9, 'slider'),
  W(1, { d: 50 }, 38, 54, 0, 9, 'slider'),
  W(1, { d: 69 }, 63, 73, 1.5, 9.5),
  W(2, { d: 57 }, 3, 15, 2, 8),
  W(2, { d: 52 }, 21, 34, 2, 8),
  W(2, { d: 52 }, 38, 44, 0, 8, 'slider'),
  W(2, { d: 64 }, 47, 59, 2, 8),
  W(2, { d: 69 }, 63, 73, 2, 8),
  // Sides
  W(1, { x: 0.4 }, 24, 29, 2, 8.5),
  W(1, { x: 0.4 }, 38, 43, 2, 8.5),
  W(1, { x: 75 }, 28, 32, 3, 8),
  W(2, { x: 0.4 }, 30, 35, 2, 8),
  W(2, { x: 0.4 }, 44, 48, 2, 8),
  W(2, { x: 75 }, 24, 28, 2, 8),
  W(2, { x: 75 }, 56, 60, 2, 8),
  W(0, { x: 82.7 }, 10, 14, 4, 7),
]

/** Interior partitions (ft) — wood-framed. */
export const PARTITIONS_F1: [Pt, Pt][] = [
  [[0.4, 30], [18.5, 30]],
  [[36, 9], [36, 26]],
  [[46, 9], [46, 26]],
  [[60, 23], [60, 50]],
  [[18.5, 26], [46, 26]],
]
export const PARTITIONS_F2: [Pt, Pt][] = [
  [[18.5, 13], [18.5, 52]],
  [[0.4, 35], [18.5, 35]],
  [[34, 15.5], [34, 30]],
  [[46, 13], [46, 30]],
  [[18.5, 30], [59, 30]],
  [[59, 17.5], [59, 52]],
  [[59, 40], [75, 40]],
  [[61, 52], [75, 52]],
]

// Site (A-1)
export const LOT = { x0: -12, d0: -25, x1: 94, d1: 98 }
export const POOL = { x0: 4, d0: 64, x1: 32, d1: 78 }
export const LANAI = { x0: 37, d0: 50, x1: 59, d1: 64 }
export const DRIVE = { x0: 52, d0: -25, x1: 82.7, d1: 0 }
export const POND = { x0: -8, d0: -22, x1: 17, d1: -6 }
