import * as THREE from 'three'
import type { Inst, V3 } from './partTypes'

export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, extra: Partial<Inst> = {}): Inst => ({
  p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  s: [Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)],
  ...extra,
})

const UP = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _d = new THREE.Vector3()

/** Cylinder/strut from a → b with local +Y along the segment (rise grows a→b). */
export function seg(a: V3, b: V3, r: number, extra: Partial<Inst> = {}): Inst {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const len = _d.length()
  _q.setFromUnitVectors(UP, _d.normalize())
  return {
    p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    s: [r * 2, len, r * 2],
    q: [_q.x, _q.y, _q.z, _q.w],
    ...extra,
  }
}

export const polyline = (pts: V3[], r: number, extra: Partial<Inst> = {}): Inst[] =>
  pts.slice(1).map((b, i) => seg(pts[i], b, r, extra))

/**
 * Rectangular duct from a → b with local +X along the segment (sweep grows a→b).
 * Axis-aligned segments only.
 */
export function duct(a: V3, b: V3, w: number, h: number, extra: Partial<Inst> = {}): Inst {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  const e = new THREE.Euler()
  if (Math.abs(dy) > 1e-6) e.set(0, 0, dy > 0 ? Math.PI / 2 : -Math.PI / 2)
  else e.set(0, Math.atan2(-dz, dx), 0)
  _q.setFromEuler(e)
  return {
    p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    s: [len, h, w],
    q: [_q.x, _q.y, _q.z, _q.w],
    ...extra,
  }
}

export const ductRun = (pts: V3[], w: number, h: number, extra: Partial<Inst> = {}) =>
  pts.slice(1).map((b, i) => duct(pts[i], b, w, h, extra))

export function rotY(angle: number): [number, number, number, number] {
  _q.setFromEuler(new THREE.Euler(0, angle, 0))
  return [_q.x, _q.y, _q.z, _q.w]
}

export function euler(x: number, y: number, z: number): [number, number, number, number] {
  _q.setFromEuler(new THREE.Euler(x, y, z, 'YXZ'))
  return [_q.x, _q.y, _q.z, _q.w]
}

type Rect = [number, number, number, number] // x0,z0,x1,z1

/** Subtracts axis-aligned holes from a rect → list of rects. */
export function rectMinus(r: Rect, holes: Rect[]): Rect[] {
  let out: Rect[] = [r]
  for (const h of holes) {
    const next: Rect[] = []
    for (const [x0, z0, x1, z1] of out) {
      const hx0 = Math.max(x0, h[0])
      const hz0 = Math.max(z0, h[1])
      const hx1 = Math.min(x1, h[2])
      const hz1 = Math.min(z1, h[3])
      if (hx0 >= hx1 || hz0 >= hz1) {
        next.push([x0, z0, x1, z1])
        continue
      }
      if (z0 < hz0) next.push([x0, z0, x1, hz0])
      if (hz1 < z1) next.push([x0, hz1, x1, z1])
      if (x0 < hx0) next.push([x0, hz0, hx0, hz1])
      if (hx1 < x1) next.push([hx1, hz0, x1, hz1])
    }
    out = next
  }
  return out
}

/** Tiles a rect with w×d pieces (gap between), row-major along z. */
export function tile(r: Rect, w: number, d: number, gap: number, y0: number, y1: number, rowAlongX = true): Inst[] {
  const [x0, z0, x1, z1] = r
  const out: Inst[] = []
  let row = 0
  if (rowAlongX) {
    for (let z = z0; z < z1 - 1e-3; z += d + gap, row++) {
      const ze = Math.min(z + d, z1)
      const off = row % 2 ? w / 2 : 0
      for (let x = x0 - off; x < x1 - 1e-3; x += w + gap) {
        const xs = Math.max(x, x0)
        const xe = Math.min(x + w, x1)
        if (xe - xs > 0.05) out.push(box(xs, y0, z, xe, y1, ze, { g: row }))
      }
    }
  } else {
    for (let x = x0; x < x1 - 1e-3; x += w + gap, row++) {
      const xe = Math.min(x + w, x1)
      const off = row % 2 ? d / 2 : 0
      for (let z = z0 - off; z < z1 - 1e-3; z += d + gap) {
        const zs = Math.max(z, z0)
        const ze = Math.min(z + d, z1)
        if (ze - zs > 0.05) out.push(box(x, y0, zs, xe, y1, ze, { g: row }))
      }
    }
  }
  return out
}
