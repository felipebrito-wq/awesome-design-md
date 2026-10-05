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
  return out
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
