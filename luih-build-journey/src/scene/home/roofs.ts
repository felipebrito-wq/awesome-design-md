/**
 * Roof geometry for pitched (hip / gable) roofs in world space, plus the
 * matching framing (common, jack and hip rafters). Used by the real-home
 * models; the flat-roof demo house doesn't need it.
 */
import * as THREE from 'three'
import { seg } from './geom'
import type { Inst, V3 } from './partTypes'

export interface HipRect {
  x0: number
  z0: number
  x1: number
  z1: number
  /** Eave height at the wall line. */
  y: number
  /** Rise per run (6:12 → 0.5). */
  pitch: number
  overhang: number
}

type Tri = [V3, V3, V3]

function pushFace(pos: number[], uv: number[], tris: Tri[], uAxis: THREE.Vector3, origin: V3, seam: number) {
  // UVs: u along eave (seam spacing), v up the slope — standing-seam texture runs downslope.
  const o = new THREE.Vector3(...origin)
  for (const t of tris) {
    for (const p of t) {
      pos.push(...p)
      const v = new THREE.Vector3(...p).sub(o)
      const u = v.dot(uAxis) / seam
      const up = Math.hypot(v.x - uAxis.x * v.dot(uAxis), v.y, v.z - uAxis.z * v.dot(uAxis))
      uv.push(u, up / 4)
    }
  }
}

/** Hip roof surface over a wall-line rectangle (expanded by the overhang). */
export function hipRoofGeometry(r: HipRect, seam = 0.45, lift = 0): THREE.BufferGeometry {
  const o = r.overhang
  const x0 = r.x0 - o
  const x1 = r.x1 + o
  const z0 = r.z0 - o
  const z1 = r.z1 + o
  const ye = r.y - o * r.pitch + lift
  const W = x1 - x0
  const D = z1 - z0
  const pos: number[] = []
  const uv: number[] = []
  if (W >= D) {
    const h = (D / 2) * r.pitch
    const zc = (z0 + z1) / 2
    const rx0 = x0 + D / 2
    const rx1 = x1 - D / 2
    const R0: V3 = [rx0, ye + h, zc]
    const R1: V3 = [rx1, ye + h, zc]
    const ex = new THREE.Vector3(1, 0, 0)
    const ez = new THREE.Vector3(0, 0, 1)
    pushFace(pos, uv, [[[x0, ye, z1], [x1, ye, z1], R1], [[x0, ye, z1], R1, R0]], ex, [x0, ye, z1], seam)
    pushFace(pos, uv, [[[x1, ye, z0], [x0, ye, z0], R0], [[x1, ye, z0], R0, R1]], ex, [x0, ye, z0], seam)
    pushFace(pos, uv, [[[x0, ye, z0], [x0, ye, z1], R0]], ez, [x0, ye, z0], seam)
    pushFace(pos, uv, [[[x1, ye, z1], [x1, ye, z0], R1]], ez, [x1, ye, z0], seam)
  } else {
    const h = (W / 2) * r.pitch
    const xc = (x0 + x1) / 2
    const rz0 = z0 + W / 2
    const rz1 = z1 - W / 2
    const R0: V3 = [xc, ye + h, rz0]
    const R1: V3 = [xc, ye + h, rz1]
    const ex = new THREE.Vector3(1, 0, 0)
    const ez = new THREE.Vector3(0, 0, 1)
    pushFace(pos, uv, [[[x1, ye, z1], [x1, ye, z0], R0], [[x1, ye, z1], R0, R1]], ez, [x1, ye, z0], seam)
    pushFace(pos, uv, [[[x0, ye, z0], [x0, ye, z1], R1], [[x0, ye, z0], R1, R0]], ez, [x0, ye, z0], seam)
    pushFace(pos, uv, [[[x0, ye, z1], [x1, ye, z1], R1]], ex, [x0, ye, z1], seam)
    pushFace(pos, uv, [[[x1, ye, z0], [x0, ye, z0], R0]], ex, [x0, ye, z0], seam)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/** Front-facing gable (ridge along z) projecting from a main roof. */
export function gableRoofGeometry(x0: number, x1: number, zFront: number, zBack: number, y: number, pitch: number, overhang: number): { roof: THREE.BufferGeometry; end: THREE.BufferGeometry } {
  const xa = x0 - overhang
  const xb = x1 + overhang
  const ye = y - overhang * pitch
  const xc = (x0 + x1) / 2
  const yr = y + ((x1 - x0) / 2) * pitch
  const zf = zFront + overhang
  const pos: number[] = []
  const uv: number[] = []
  const ez = new THREE.Vector3(0, 0, 1)
  pushFace(pos, uv, [[[xa, ye, zf], [xc, yr, zf], [xc, yr, zBack]], [[xa, ye, zf], [xc, yr, zBack], [xa, ye, zBack]]], ez, [xa, ye, zBack], 0.45)
  pushFace(pos, uv, [[[xc, yr, zf], [xb, ye, zf], [xb, ye, zBack]], [[xc, yr, zf], [xb, ye, zBack], [xc, yr, zBack]]], ez, [xb, ye, zBack], 0.45)
  const roof = new THREE.BufferGeometry()
  roof.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  roof.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  roof.computeVertexNormals()
  const end = new THREE.BufferGeometry()
  end.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, zFront, x1, y, zFront, xc, yr - 0.05, zFront], 3))
  end.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2))
  end.computeVertexNormals()
  return { roof, end }
}

/** Replace any NaN normal (degenerate input) with +Y so lighting and post-processing stay finite. */
export function sanitizeNormals(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.getAttribute('normal') as THREE.BufferAttribute | undefined
  if (!n) return g
  for (let i = 0; i < n.count; i++) if (!Number.isFinite(n.getX(i)) || !Number.isFinite(n.getY(i)) || !Number.isFinite(n.getZ(i))) n.setXYZ(i, 0, 1, 0)
  n.needsUpdate = true
  return g
}

export function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  for (const g of list) {
    const ng = g.index ? g.toNonIndexed() : g
    pos.push(...(ng.getAttribute('position').array as Float32Array))
    uv.push(...(ng.getAttribute('uv').array as Float32Array))
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  out.computeVertexNormals()
  return sanitizeNormals(out)
}

/** Common + jack + hip rafters and ridge for a hip roof (wall line, no tails). */
export function hipRafters(r: HipRect, spacing = 0.6, gBase = 0, rad = 0.03): Inst[] {
  const out: Inst[] = []
  const { x0, x1, z0, z1, y, pitch } = r
  const W = x1 - x0
  const D = z1 - z0
  let g = gBase
  const raf = (a: V3, b: V3) => out.push(seg(a, b, rad, { g: g++ }))
  if (W >= D) {
    const zc = (z0 + z1) / 2
    for (let x = x0 + spacing / 2; x < x1; x += spacing) {
      const run = Math.min(D / 2, x - x0, x1 - x)
      raf([x, y, z1], [x, y + run * pitch, z1 - run])
      raf([x, y, z0], [x, y + run * pitch, z0 + run])
    }
    for (let z = z0 + spacing / 2; z < z1; z += spacing) {
      const run = Math.min(z - z0, z1 - z)
      raf([x0, y, z], [x0 + run, y + run * pitch, z])
      raf([x1, y, z], [x1 - run, y + run * pitch, z])
    }
    const h = (D / 2) * pitch
    out.push(seg([x0 + D / 2, y + h, zc], [x1 - D / 2 + 0.001, y + h, zc], rad * 1.4, { g: gBase }))
    for (const [cx, cz, rx] of [[x0, z0, x0 + D / 2], [x0, z1, x0 + D / 2], [x1, z0, x1 - D / 2], [x1, z1, x1 - D / 2]] as const)
      out.push(seg([cx, y, cz], [rx, y + h, zc], rad * 1.3, { g: gBase }))
  } else {
    const xc = (x0 + x1) / 2
    for (let z = z0 + spacing / 2; z < z1; z += spacing) {
      const run = Math.min(W / 2, z - z0, z1 - z)
      raf([x0, y, z], [x0 + run, y + run * pitch, z])
      raf([x1, y, z], [x1 - run, y + run * pitch, z])
    }
    for (let x = x0 + spacing / 2; x < x1; x += spacing) {
      const run = Math.min(x - x0, x1 - x)
      raf([x, y, z0], [x, y + run * pitch, z0 + run])
      raf([x, y, z1], [x, y + run * pitch, z1 - run])
    }
    const h = (W / 2) * pitch
    out.push(seg([xc, y + h, z0 + W / 2], [xc, y + h, z1 - W / 2 + 0.001], rad * 1.4, { g: gBase }))
    for (const [cx, cz, rz] of [[x0, z0, z0 + W / 2], [x1, z0, z0 + W / 2], [x0, z1, z1 - W / 2], [x1, z1, z1 - W / 2]] as const)
      out.push(seg([cx, y, cz], [xc, y + h, rz], rad * 1.3, { g: gBase }))
  }
  return out
}

/** Canvas texture: standing-seam metal (seams along v). */
export function seamTexture(base = '#1d2124', seam = '#3a4046'): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 64, 64)
  ctx.fillStyle = seam
  ctx.fillRect(0, 0, 4, 64)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fillRect(4, 0, 2, 64)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Single-slope (shed) roof over a wall-line rectangle, high side toward `high` (-z / +z / -x / +x). */
export function shedRoofGeometry(r: HipRect, high: 'z0' | 'z1' | 'x0' | 'x1', seam = 0.45, lift = 0): THREE.BufferGeometry {
  const o = r.overhang
  const x0 = r.x0 - (high === 'x0' ? 0 : o)
  const x1 = r.x1 + (high === 'x1' ? 0 : o)
  const z0 = r.z0 - (high === 'z0' ? 0 : o)
  const z1 = r.z1 + (high === 'z1' ? 0 : o)
  const run = high === 'z0' || high === 'z1' ? r.z1 - r.z0 : r.x1 - r.x0
  const yLow = r.y - o * r.pitch + lift
  const yHigh = r.y + run * r.pitch + lift
  const y = (x: number, z: number) => {
    if (high === 'z0') return yLow + ((z1 - z) / (z1 - z0)) * (yHigh - yLow)
    if (high === 'z1') return yLow + ((z - z0) / (z1 - z0)) * (yHigh - yLow)
    if (high === 'x0') return yLow + ((x1 - x) / (x1 - x0)) * (yHigh - yLow)
    return yLow + ((x - x0) / (x1 - x0)) * (yHigh - yLow)
  }
  const P = (x: number, z: number): V3 => [x, y(x, z), z]
  const pos: number[] = []
  const uv: number[] = []
  const along = high === 'z0' || high === 'z1' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
  pushFace(pos, uv, [[P(x0, z1), P(x1, z1), P(x1, z0)], [P(x0, z1), P(x1, z0), P(x0, z0)]], along, P(x0, z0), seam)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/**
 * Clip a triangle soup to the half-space `axis {<,>} value` (keeps the side
 * given by `keep`). Used for lean-to hips that die into a wall.
 */
export function clipGeometry(g: THREE.BufferGeometry, axis: 'x' | 'z', value: number, keep: 'lt' | 'gt'): THREE.BufferGeometry {
  const src = g.index ? g.toNonIndexed() : g
  const P = src.getAttribute('position')
  const U = src.getAttribute('uv')
  const ai = axis === 'x' ? 0 : 2
  const inside = (v: number[]) => (keep === 'lt' ? v[ai] <= value + 1e-6 : v[ai] >= value - 1e-6)
  const pos: number[] = []
  const uv: number[] = []
  for (let t = 0; t < P.count; t += 3) {
    const poly: number[][] = []
    for (let k = 0; k < 3; k++) poly.push([P.getX(t + k), P.getY(t + k), P.getZ(t + k), U.getX(t + k), U.getY(t + k)])
    const out: number[][] = []
    for (let k = 0; k < 3; k++) {
      const a = poly[k]
      const b = poly[(k + 1) % 3]
      const ia = inside(a)
      const ib = inside(b)
      if (ia) out.push(a)
      if (ia !== ib) {
        const s = (value - a[ai]) / (b[ai] - a[ai])
        out.push(a.map((v, j) => v + (b[j] - v) * s))
      }
    }
    for (let k = 1; k + 1 < out.length; k++) {
      const [a, b, c] = [out[0], out[k], out[k + 1]]
      // Skip slivers: zero-area triangles give NaN normals, which post-processing (bloom/AO) smears across the frame
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
      const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
      const area = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
      if (area < 1e-6) continue
      for (const v of [a, b, c]) {
        pos.push(v[0], v[1], v[2])
        uv.push(v[3], v[4])
      }
    }
  }
  const res = new THREE.BufferGeometry()
  res.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  res.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  res.computeVertexNormals()
  return sanitizeNormals(res)
}

/** Height of a hip roof surface (wall-line rect, overhang ignored) at (x, z); -Infinity outside the eave footprint. */
export function hipHeightAt(r: HipRect, x: number, z: number): number {
  const o = r.overhang
  if (x < r.x0 - o || x > r.x1 + o || z < r.z0 - o || z > r.z1 + o) return -Infinity
  const dEdge = Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z)
  return r.y + dEdge * r.pitch
}
