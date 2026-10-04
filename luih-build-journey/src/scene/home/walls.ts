/**
 * Single source of truth for the house shell: walls + openings.
 * Masonry, framing, sheathing, lath, stucco, insulation, drywall, windows and
 * electrical rough are ALL derived from these definitions — so every stage
 * shows the same building.
 */
import { box } from './geom'
import type { Inst } from './partTypes'

export type OpeningKind = 'window' | 'door' | 'slider' | 'garage' | 'entry'

export interface Opening {
  u0: number
  u1: number
  v0: number
  v1: number
  kind: OpeningKind
}

export interface Wall {
  id: string
  a: [number, number]
  b: [number, number]
  /** Outward normal (x, z). For interior walls any perpendicular. */
  n: [number, number]
  y0: number
  h: number
  t: number
  kind: 'cmu' | 'wood'
  skin: 'ext' | 'int'
  floor: 1 | 2
  openings: Opening[]
}

// Levels (meters)
export const SLAB = 0.3
export const CMU_TOP = 3.1
export const TIE_TOP = 3.4
export const F2_FLOOR = 3.77
export const F2_TOP = 6.6
export const ROOF_TOP = 6.95
export const LOW_ROOF_TOP = 3.72

const o = (u0: number, u1: number, v0: number, v1: number, kind: OpeningKind = 'window'): Opening => ({ u0, u1, v0, v1, kind })

const cmu = (id: string, a: [number, number], b: [number, number], n: [number, number], openings: Opening[] = [], skin: Wall['skin'] = 'ext'): Wall => ({
  id,
  a,
  b,
  n,
  y0: SLAB,
  h: CMU_TOP - SLAB,
  t: 0.2,
  kind: 'cmu',
  skin,
  floor: 1,
  openings,
})

const wood = (id: string, a: [number, number], b: [number, number], n: [number, number], openings: Opening[] = [], floor: 1 | 2 = 2, skin: Wall['skin'] = 'ext'): Wall => ({
  id,
  a,
  b,
  n,
  y0: floor === 2 ? F2_FLOOR : SLAB,
  h: floor === 2 ? F2_TOP - F2_FLOOR : TIE_TOP - SLAB - 0.02,
  t: skin === 'ext' ? 0.14 : 0.1,
  kind: 'wood',
  skin,
  floor,
  openings,
})

export const CMU_WALLS: Wall[] = [
  cmu('m-front', [-10, 4], [3, 4], [0, 1], [o(1.0, 4.6, 0.5, 2.6), o(7.0, 9.4, 0, 2.7, 'entry'), o(11.2, 12.2, 0.4, 2.6)]),
  cmu('m-west', [-10, -6], [-10, 4], [-1, 0], [o(1.2, 4.8, 0.5, 2.6), o(6.5, 8.5, 0.5, 2.6)]),
  cmu('m-rear-lanai', [-10, -6], [-7, -6], [0, -1], [o(0.4, 2.6, 0, 2.6, 'slider')]),
  cmu('m-east', [3, -6], [3, -3], [1, 0], [o(0.8, 2.2, 0.5, 2.6)]),
  cmu('garage-house', [3, -3], [3, 4], [1, 0], [o(5.2, 6.2, 0, 2.4, 'door')], 'int'),
  cmu('g-front', [3, 5], [11, 5], [0, 1], [o(0.6, 3.7, 0, 2.5, 'garage'), o(4.3, 7.4, 0, 2.5, 'garage')]),
  cmu('g-west', [3, 4], [3, 5], [-1, 0]),
  cmu('g-east', [11, -3], [11, 5], [1, 0], [o(3, 5, 1.4, 2.4)]),
  cmu('g-rear', [3, -3], [11, -3], [0, -1], [o(6, 7, 0, 2.4, 'door')]),
  cmu('r-west', [-7, -11], [-7, -6], [-1, 0], [o(0.3, 4.7, 0, 2.75, 'slider')]),
  cmu('r-rear', [-7, -11], [3, -11], [0, -1], [o(0.3, 9.7, 0, 2.75, 'slider')]),
  cmu('r-east', [3, -11], [3, -6], [1, 0], [o(1, 4, 1.0, 2.6)]),
]

export const F2_WALLS: Wall[] = [
  wood('f2-front', [-10, 4], [3, 4], [0, 1], [o(0.6, 6.0, 0.6, 2.3), o(10.0, 12.0, 0.2, 2.4)]),
  wood('f2-west', [-10, -6], [-10, 4], [-1, 0], [o(1.5, 4.0, 0.6, 2.3), o(6.3, 8.7, 0.6, 2.3)]),
  wood('f2-rear', [-10, -6], [3, -6], [0, -1], [o(0.8, 6.2, 0.2, 2.4, 'slider'), o(9.6, 12.2, 0.6, 2.3)]),
  wood('f2-east', [3, -6], [3, 4], [1, 0], [o(1.5, 3.5, 0.6, 2.3), o(7.0, 8.6, 0.6, 2.3)]),
]

export const PARTITIONS: Wall[] = [
  wood('p1', [-10, 0.5], [-5, 0.5], [0, 1], [o(3.6, 4.6, 0, 2.3, 'door')], 1, 'int'),
  wood('p2', [-5, 0.5], [-5, 4], [1, 0], [o(0.5, 1.5, 0, 2.3, 'door')], 1, 'int'),
  wood('p3', [0, 0.5], [0, 4], [1, 0], [o(0.4, 1.3, 0, 2.3, 'door')], 1, 'int'),
  wood('p4', [0, 0.5], [3, 0.5], [0, 1], [], 1, 'int'),
  wood('q1', [-3, -6], [-3, 4], [1, 0], [o(3.5, 4.4, 0, 2.2, 'door'), o(6, 6.9, 0, 2.2, 'door')], 2, 'int'),
  wood('q2', [-10, -0.5], [-3, -0.5], [0, 1], [o(4.6, 5.5, 0, 2.2, 'door')], 2, 'int'),
  wood('q3', [-5.5, -0.5], [-5.5, 4], [1, 0], [o(1, 1.9, 0, 2.2, 'door')], 2, 'int'),
  wood('q4', [-0.5, -6], [-0.5, 4], [1, 0], [o(3.5, 4.4, 0, 2.2, 'door'), o(5.6, 6.4, 0, 2.2, 'door'), o(7.6, 8.4, 0, 2.2, 'door')], 2, 'int'),
  wood('q5', [-0.5, -1], [3, -1], [0, 1], [], 2, 'int'),
  wood('q6', [-0.5, 1], [3, 1], [0, 1], [], 2, 'int'),
]

export const ALL_EXTERIOR = [...CMU_WALLS, ...F2_WALLS]

// ---------------------------------------------------------------------------

export const wallLen = (w: Wall) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])

/** Box in wall-local coords: u along, v up (from y0), w outward from wall line. */
export function wallBox(w: Wall, u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, extra: Partial<Inst> = {}): Inst {
  const L = wallLen(w)
  const dx = (w.b[0] - w.a[0]) / L
  const dz = (w.b[1] - w.a[1]) / L
  const [nx, nz] = w.n
  const xa = w.a[0] + dx * u0 + nx * w0
  const za = w.a[1] + dz * u0 + nz * w0
  const xb = w.a[0] + dx * u1 + nx * w1
  const zb = w.a[1] + dz * u1 + nz * w1
  return box(Math.min(xa, xb), w.y0 + v0, Math.min(za, zb), Math.max(xa, xb), w.y0 + v1, Math.max(za, zb), extra)
}

/** Point on wall in world coords. */
export function wallPoint(w: Wall, u: number, v: number, wo: number): [number, number, number] {
  const L = wallLen(w)
  const dx = (w.b[0] - w.a[0]) / L
  const dz = (w.b[1] - w.a[1]) / L
  return [w.a[0] + dx * u + w.n[0] * wo, w.y0 + v, w.a[1] + dz * u + w.n[1] * wo]
}

/** u-spans of the wall not blocked by openings within band [v0, v1]. */
export function freeSpans(w: Wall, v0: number, v1: number, from = 0, to = wallLen(w)): [number, number][] {
  const blocks = w.openings
    .filter((op) => op.v0 < v1 - 1e-6 && op.v1 > v0 + 1e-6)
    .map((op) => [op.u0, op.u1] as [number, number])
    .sort((a, b) => a[0] - b[0])
  const spans: [number, number][] = []
  let cur = from
  for (const [a, b] of blocks) {
    if (a > cur + 1e-3) spans.push([cur, Math.min(a, to)])
    cur = Math.max(cur, b)
  }
  if (cur < to - 1e-3) spans.push([cur, to])
  return spans.filter(([a, b]) => b - a > 0.02)
}

/** Rectangles covering the wall face minus openings, over [0, h]. */
export function wallPieces(w: Wall, h = w.h, vStart = 0): [number, number, number, number][] {
  const cuts = new Set<number>([vStart, h])
  for (const op of w.openings) {
    if (op.v0 > vStart && op.v0 < h) cuts.add(op.v0)
    if (op.v1 > vStart && op.v1 < h) cuts.add(op.v1)
  }
  const vs = [...cuts].sort((a, b) => a - b)
  const out: [number, number, number, number][] = []
  for (let i = 0; i < vs.length - 1; i++) {
    for (const [u0, u1] of freeSpans(w, vs[i], vs[i + 1])) out.push([u0, u1, vs[i], vs[i + 1]])
  }
  return out
}

/** Layered skin (sheathing / lath / stucco / insulation / drywall). */
export function skin(walls: Wall[], w0: number, w1: number, opts: { h?: (w: Wall) => number; vStart?: number; group?: 'wall' | 'piece' } = {}): Inst[] {
  const out: Inst[] = []
  walls.forEach((w, wi) => {
    const h = opts.h ? opts.h(w) : w.h
    wallPieces(w, h, opts.vStart ?? 0).forEach(([u0, u1, v0, v1], pi) => {
      out.push(wallBox(w, u0, u1, v0, v1, w0, w1, { g: opts.group === 'piece' ? wi * 20 + pi : wi }))
    })
  })
  return out
}

/** Wood stud framing (plates, studs, headers, sills, cripples). */
export function framing(walls: Wall[], spacing = 0.6, gOffset = 0): Inst[] {
  const out: Inst[] = []
  walls.forEach((w, wi) => {
    const g = gOffset + wi
    const L = wallLen(w)
    const t = w.t
    const plate = 0.04
    const sw = 0.045
    out.push(wallBox(w, 0, L, 0, plate, -t, 0, { g }))
    out.push(wallBox(w, 0, L, w.h - plate * 2, w.h, -t, 0, { g }))
    const studH0 = plate
    const studH1 = w.h - plate * 2
    const positions: number[] = []
    for (let u = 0; u <= L - sw + 1e-3; u += spacing) positions.push(u)
    positions.push(L - sw)
    for (const op of w.openings) positions.push(op.u0 - sw, op.u1)
    const uniq = [...new Set(positions.map((x) => Math.round(x * 1000) / 1000))].filter((u) => u >= 0 && u <= L - sw).sort((a, b) => a - b)
    for (const u of uniq) {
      const op = w.openings.find((x) => u + sw > x.u0 + 1e-3 && u < x.u1 - 1e-3)
      if (!op) {
        out.push(wallBox(w, u, u + sw, studH0, studH1, -t, 0, { g }))
      } else {
        if (op.v0 > studH0 + 0.05) out.push(wallBox(w, u, u + sw, studH0, op.v0 - 0.04, -t, 0, { g }))
        if (op.v1 + 0.25 < studH1 - 0.05) out.push(wallBox(w, u, u + sw, op.v1 + 0.25, studH1, -t, 0, { g }))
      }
    }
    for (const op of w.openings) {
      out.push(wallBox(w, op.u0 - sw, op.u1 + sw, op.v1, op.v1 + 0.25, -t, 0, { g }))
      if (op.v0 > 0.05) out.push(wallBox(w, op.u0, op.u1, op.v0 - 0.04, op.v0, -t, 0, { g }))
    }
  })
  return out
}

/** CMU coursing: 0.2 m courses, rising course by course (g = course). */
export function masonry(walls: Wall[]): Inst[] {
  const out: Inst[] = []
  const courses = Math.round((CMU_TOP - SLAB) / 0.2)
  const shades = ['#a9a7a1', '#a3a19b', '#adaba5', '#a6a49e']
  for (let k = 0; k < courses; k++) {
    const v0 = k * 0.2
    const v1 = v0 + 0.188
    walls.forEach((w, wi) => {
      for (const [u0, u1] of freeSpans(w, v0, v1)) {
        out.push(wallBox(w, u0, u1, v0, v1, -w.t, 0, { g: k, c: shades[(k + wi) % shades.length] }))
      }
    })
  }
  return out
}
