/**
 * Procedural placeholder for the LUIH "Winter Park Modern" residence.
 * Replace with /public/models/home.glb (see GlbHome + docs/MODEL_PIPELINE.md)
 * — the component/task mapping stays the same.
 *
 * Units: meters. +z = street (front), -z = pool / lake (rear), +y = up.
 */
import { box, ductRun, euler, polyline, rectMinus, rotY, seg, tile } from './geom'
import type { Inst, PartSpec, V3 } from './partTypes'
import {
  ALL_EXTERIOR,
  CMU_TOP,
  CMU_WALLS,
  F2_FLOOR,
  F2_TOP,
  F2_WALLS,
  LOW_ROOF_TOP,
  PARTITIONS,
  ROOF_TOP,
  SLAB,
  TIE_TOP,
  framing,
  freeSpans,
  masonry,
  skin,
  wallBox,
  wallLen,
  wallPoint,
  type Wall,
} from './walls'

type Rect = [number, number, number, number]

// Footprints (x0, z0, x1, z1)
const MAIN: Rect = [-10, -6, 3, 4]
const GARAGE: Rect = [3, -3, 11, 5]
const GREAT: Rect = [-10, -11, 3, -6] // incl. lanai x[-10,-7]
const PORTAL: Rect = [-3.4, 4, -0.1, 5.2]
export const LOT: Rect = [-16, -24, 16, 17]
export const POOL: Rect = [-7.5, -19.6, 2.5, -15.6]
const DECK: Rect = [-10.6, -21.6, 6.5, -12.7]
const DRIVE: Rect = [3.6, 5.3, 10.8, 17]
const PAD: Rect = [-12.5, -13.5, 13.2, 7.5]

const parts: PartSpec[] = []
const add = (p: PartSpec) => parts.push(p)

const slabBox = ([x0, z0, x1, z1]: Rect, y0: number, y1: number, extra: Partial<Inst> = {}) => box(x0, y0, z0, x1, y1, z1, extra)

/** Parallel-chord trusses spanning `span` axis, spaced along the other. */
function trusses(r: Rect, y0: number, y1: number, spanAlong: 'x' | 'z', spacing = 0.6, gBase = 0): Inst[] {
  const out: Inst[] = []
  const [x0, z0, x1, z1] = r
  const chord = 0.07
  const t = 0.045
  const n = Math.floor(((spanAlong === 'z' ? x1 - x0 : z1 - z0) - t) / spacing) + 1
  for (let i = 0; i < n; i++) {
    const g = gBase + i
    if (spanAlong === 'z') {
      const x = x0 + t / 2 + i * spacing
      out.push(box(x - t / 2, y0, z0, x + t / 2, y0 + chord, z1, { g }))
      out.push(box(x - t / 2, y1 - chord, z0, x + t / 2, y1, z1, { g }))
      const panels = Math.max(2, Math.round((z1 - z0) / 0.9))
      const pz = (z1 - z0) / panels
      for (let k = 0; k < panels; k++) {
        const za = z0 + k * pz
        const up = k % 2 === 0
        out.push(seg([x, up ? y0 + chord : y1 - chord, za], [x, up ? y1 - chord : y0 + chord, za + pz], 0.022, { g }))
      }
    } else {
      const z = z0 + t / 2 + i * spacing
      out.push(box(x0, y0, z - t / 2, x1, y0 + chord, z + t / 2, { g }))
      out.push(box(x0, y1 - chord, z - t / 2, x1, y1, z + t / 2, { g }))
      const panels = Math.max(2, Math.round((x1 - x0) / 0.9))
      const px = (x1 - x0) / panels
      for (let k = 0; k < panels; k++) {
        const xa = x0 + k * px
        const up = k % 2 === 0
        out.push(seg([xa, up ? y0 + chord : y1 - chord, z], [xa + px, up ? y1 - chord : y0 + chord, z], 0.022, { g }))
      }
    }
  }
  return out
}

/** Fascia ring (outer rect, thickness th) — sides: n,s,e,w selectable. */
function ring(r: Rect, y0: number, y1: number, th: number, sides = 'nsew', extra: Partial<Inst> = {}): Inst[] {
  const [x0, z0, x1, z1] = r
  const out: Inst[] = []
  if (sides.includes('n')) out.push(box(x0, y0, z1 - th, x1, y1, z1, extra))
  if (sides.includes('s')) out.push(box(x0, y0, z0, x1, y1, z0 + th, extra))
  if (sides.includes('e')) out.push(box(x1 - th, y0, z0, x1, y1, z1, extra))
  if (sides.includes('w')) out.push(box(x0, y0, z0, x0 + th, y1, z1, extra))
  return out
}

// ===========================================================================
// SITE
// ===========================================================================

// Existing scrub + young pines on the lot (cleared in Site Prep)
{
  const scrub: Inst[] = []
  const pines: Inst[] = []
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 46; i++) {
    const x = -14 + rnd() * 28
    const z = -22 + rnd() * 36
    const s = 0.7 + rnd() * 1.3
    scrub.push({ p: [x, s * 0.35, z], s: [s * 1.3, s * 0.8, s * 1.2], g: i, a: [x, 0, z] })
  }
  for (let i = 0; i < 9; i++) {
    const x = -12 + rnd() * 24
    const z = -18 + rnd() * 28
    const h = 4 + rnd() * 3
    pines.push({ p: [x, h * 0.55, z], s: [1.6, h * 0.8, 1.6], g: i, a: [x, 0, z] })
    pines.push({ p: [x, h * 0.25, z], s: [0.18, h * 0.5, 0.18], g: i, a: [x, 0, z], c: '#6b5a48' })
  }
  add({ id: 'existing-scrub', componentId: 'c-clearing', geo: 'sphere', mat: 'leafWild', inst: scrub, anim: 'grow', appearTask: '__always', disappearTask: 't-clearing' })
  add({ id: 'existing-pines', componentId: 'c-clearing', geo: 'cone', mat: 'leafPine', inst: pines, anim: 'grow', appearTask: '__always', disappearTask: 't-clearing' })
  add({
    id: 'lot-wild',
    componentId: 'c-clearing',
    geo: 'box',
    mat: 'grassWild',
    inst: [box(LOT[0], 0, LOT[1], LOT[2], 0.012, LOT[3])],
    anim: 'pop',
    appearTask: '__always',
    disappearTask: 't-clearing',
    disappearFade: true,
    inert: true,
    castShadow: false,
  })
}

// Construction dirt across the lot (after clearing, until sod)
add({
  id: 'lot-dirt',
  componentId: 'c-pad',
  geo: 'box',
  mat: 'dirt',
  inst: rectMinus(LOT, [POOL]).map((r) => slabBox(r, 0, 0.016)),
  anim: 'fade',
  appearTask: 't-clearing',
  disappearTask: 't-sod',
  disappearFade: true,
  inert: true,
  castShadow: false,
})
add({
  id: 'pool-area-dirt',
  componentId: 'c-pad',
  geo: 'box',
  mat: 'dirt',
  inst: [slabBox(POOL, 0, 0.016)],
  anim: 'fade',
  appearTask: 't-clearing',
  disappearTask: 't-pool-shell',
  disappearFade: true,
  inert: true,
  castShadow: false,
})
add({ id: 'pad', componentId: 'c-pad', geo: 'box', mat: 'sand', inst: [slabBox(PAD, 0, 0.15)], anim: 'rise', castShadow: false })

// Survey stakes + permit board
{
  const stakes: Inst[] = []
  const corners: [number, number][] = [
    [-10, 4], [3, 4], [3, 5], [11, 5], [11, -3], [3, -11], [-10, -11], [-10, -6],
  ]
  corners.forEach(([x, z], i) => {
    stakes.push(box(x - 0.025, 0, z - 0.025, x + 0.025, 0.9, z + 0.025, { g: i }))
    stakes.push(box(x - 0.03, 0.75, z - 0.03, x + 0.03, 0.85, z + 0.03, { g: i, c: '#e0577a' }))
  })
  stakes.push(box(-12.1, 0, 15.9, -12.0, 1.8, 16.0, { g: 9 }))
  stakes.push(box(-12.9, 1.0, 15.95, -11.2, 1.8, 16.0, { g: 9, c: '#f6f4ef' }))
  add({ id: 'survey', componentId: 'c-survey', geo: 'box', mat: 'stake', inst: stakes, anim: 'rise', disappearTask: 't-slab-pour', castShadow: true })
}

// Construction fence (privacy screen) with driveway gap
{
  const posts: Inst[] = []
  const screen: Inst[] = []
  const runs: [V3, V3][] = [
    [[-16, 0, 17], [2.8, 0, 17]],
    [[11.6, 0, 17], [16, 0, 17]],
    [[16, 0, 17], [16, 0, -24]],
    [[16, 0, -24], [-16, 0, -24]],
    [[-16, 0, -24], [-16, 0, 17]],
  ]
  let g = 0
  for (const [a, b] of runs) {
    const len = Math.hypot(b[0] - a[0], b[2] - a[2])
    const n = Math.ceil(len / 3)
    for (let i = 0; i < n; i++) {
      const t0 = i / n
      const t1 = (i + 1) / n
      const pa: V3 = [a[0] + (b[0] - a[0]) * t0, 0, a[2] + (b[2] - a[2]) * t0]
      const pb: V3 = [a[0] + (b[0] - a[0]) * t1, 0, a[2] + (b[2] - a[2]) * t1]
      posts.push(box(pa[0] - 0.03, 0, pa[2] - 0.03, pa[0] + 0.03, 1.85, pa[2] + 0.03, { g }))
      const along = Math.abs(b[0] - a[0]) > 0.1
      screen.push(
        along
          ? box(Math.min(pa[0], pb[0]), 0.05, pa[2] - 0.01, Math.max(pa[0], pb[0]), 1.8, pa[2] + 0.01, { g })
          : box(pa[0] - 0.01, 0.05, Math.min(pa[2], pb[2]), pa[0] + 0.01, 1.8, Math.max(pa[2], pb[2]), { g }),
      )
      g++
    }
  }
  add({ id: 'fence-posts', componentId: 'c-fence', geo: 'box', mat: 'steel', inst: posts, anim: 'rise', disappearTask: 't-demob', castShadow: false })
  add({ id: 'fence-screen', componentId: 'c-fence', geo: 'box', mat: 'fenceScreen', inst: screen, anim: 'rise', disappearTask: 't-demob' })
}

// Temporary facilities: power pole, sanitation, dumpster
add({
  id: 'temp-facilities',
  componentId: 'c-temp',
  geo: 'box',
  mat: 'white',
  anim: 'drop',
  disappearTask: 't-demob',
  inst: [
    box(13.0, 0, 15.0, 13.18, 5.2, 15.18, { g: 0, c: '#7a6a55' }),
    box(12.75, 4.7, 15.07, 13.43, 4.78, 15.11, { g: 0, c: '#7a6a55' }),
    box(12.86, 1.2, 15.18, 13.32, 1.75, 15.32, { g: 0, c: '#9aa0a4' }),
    box(13.2, 0, 11.0, 14.4, 2.3, 12.2, { g: 1, c: '#3e5a49' }),
    box(13.15, 2.3, 10.95, 14.45, 2.4, 12.25, { g: 1, c: '#e9e9e4' }),
    box(12.4, 0, 1.5, 14.9, 1.4, 7.5, { g: 2, c: '#2f4658' }),
    box(12.3, 1.4, 1.4, 15.0, 1.48, 7.6, { g: 2, c: '#263a49' }),
  ],
})

// Material deliveries: block pallets consumed as walls rise
{
  const pal: Inst[] = []
  let g = 0
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      const x = 4.2 + i * 1.6
      const z = 8.6 + j * 1.5
      pal.push(box(x, 0.15, z, x + 1.2, 0.3, z + 1.1, { g, c: '#8d7a62' }))
      pal.push(box(x + 0.05, 0.3, z + 0.05, x + 1.15, 1.2, z + 1.05, { g, c: '#a9a7a1' }))
      g++
    }
  add({ id: 'block-pallets', componentId: 'c-pallets', geo: 'box', mat: 'white', inst: pal, anim: 'pop', appearTask: 't-slab-pour', window: [0.7, 1], disappearTask: 't-cmu' })
  const lumber: Inst[] = []
  for (let i = 0; i < 4; i++) {
    const z = 8.4 + i * 1.3
    for (let k = 0; k < 4; k++) lumber.push(box(4.0, 0.16 + k * 0.14, z, 10.5, 0.29 + k * 0.14, z + 1.0, { g: i * 4 + k, c: k % 2 ? '#d8b98a' : '#cfae7d' }))
  }
  add({ id: 'lumber', componentId: 'c-pallets', geo: 'box', mat: 'white', inst: lumber, anim: 'pop', appearTask: 't-tiebeam', disappearTask: 't-dryin' })
}

// ===========================================================================
// FOUNDATION
// ===========================================================================

const footingLines: Wall[] = CMU_WALLS
add({
  id: 'trenches',
  componentId: 'c-trenches',
  geo: 'box',
  mat: 'trench',
  inst: footingLines.map((w, i) => wallBox({ ...w, y0: 0.15 }, -0.2, wallLen(w) + 0.2, 0, 0.008, -0.45, 0.2, { g: i })),
  anim: 'sweep',
  disappearTask: 't-footing-pour',
  disappearFade: true,
  castShadow: false,
  inert: false,
})
add({
  id: 'footings',
  componentId: 'c-footings',
  geo: 'box',
  mat: 'concreteFresh',
  inst: footingLines.map((w, i) => wallBox({ ...w, y0: 0.15 }, -0.2, wallLen(w) + 0.2, 0, 0.03, -0.4, 0.15, { g: i })),
  anim: 'sweep',
  castShadow: false,
})

// Under-slab plumbing + stub-ups
{
  const r = 0.055
  const y = 0.2
  const lines: Inst[] = [
    ...polyline([[-8.6, y, 2.6], [-8.6, y, -2.2], [10.2, y, -2.2], [10.2, y, 3.0], [12.5, y, 3.0]], r, { g: 0 }),
    ...polyline([[0.6, y, -5.4], [0.6, y, -2.2]], r * 0.8, { g: 1 }),
    ...polyline([[2.2, y, 1.6], [2.2, y, -2.2]], r * 0.8, { g: 1 }),
    ...polyline([[-6.8, y, 2.8], [-6.8, y, -2.2]], r * 0.8, { g: 1 }),
    ...polyline([[1.4, y, -0.8], [1.4, y, -2.2]], r * 0.8, { g: 1 }),
    ...polyline([[2.6, y, -9.0], [2.6, y, -2.2]], r * 0.8, { g: 1 }),
  ]
  const stubs: [number, number][] = [[0.6, -5.4], [2.2, 1.6], [-6.8, 2.8], [1.4, -0.8], [-8.6, 2.6], [2.6, -9.0], [9.6, -2.2]]
  stubs.forEach(([x, z], i) => lines.push(seg([x, y, z], [x, 0.85, z], r, { g: 2 + i * 0.2 })))
  add({ id: 'underground', componentId: 'c-underground', geo: 'cyl', mat: 'pvc', inst: lines, anim: 'rise', castShadow: false })
}

const SLABS: Rect[] = [MAIN, GARAGE, GREAT, PORTAL]
add({ id: 'vapor', componentId: 'c-vapor', geo: 'box', mat: 'vapor', inst: SLABS.map((r, i) => slabBox(r, 0.15, 0.158, { g: i })), anim: 'sweep', castShadow: false })
{
  const bars: Inst[] = []
  let g = 0
  for (const [x0, z0, x1, z1] of SLABS.slice(0, 3)) {
    for (let x = x0 + 0.3; x < x1; x += 0.6) bars.push(seg([x, 0.24, z0 + 0.1], [x, 0.24, z1 - 0.1], 0.011, { g: g++ }))
    for (let z = z0 + 0.3; z < z1; z += 0.6) bars.push(seg([x0 + 0.1, 0.25, z], [x1 - 0.1, 0.25, z], 0.011, { g: g++ }))
  }
  add({ id: 'rebar', componentId: 'c-rebar', geo: 'cyl', mat: 'rebar', inst: bars, anim: 'rise', castShadow: false })
}
add({ id: 'slab', componentId: 'c-slab', geo: 'box', mat: 'concrete', inst: SLABS.map((r, i) => slabBox(r, 0.15, SLAB, { g: i })), anim: 'rise' })

// ===========================================================================
// STRUCTURE
// ===========================================================================

add({ id: 'cmu', componentId: 'c-cmu', geo: 'box', mat: 'white', inst: masonry(CMU_WALLS), anim: 'sweep', overlap: 0.12 })
{
  const beams: Inst[] = CMU_WALLS.map((w, i) => wallBox(w, 0, wallLen(w), CMU_TOP - SLAB, TIE_TOP - SLAB, -w.t, 0, { g: i }))
  beams.push(box(-7, CMU_TOP, -6.2, 3, TIE_TOP, -5.8, { g: 12 })) // flush beam over great-room opening
  add({ id: 'tiebeam', componentId: 'c-tiebeam', geo: 'box', mat: 'concrete', inst: beams, anim: 'sweep' })
}
{
  const fl = trusses([MAIN[0] + 0.2, MAIN[1] + 0.2, MAIN[2] - 0.2, MAIN[3] - 0.2], TIE_TOP, F2_FLOOR - 0.02, 'z', 0.6)
  const rim = ring([MAIN[0], MAIN[1], MAIN[2], MAIN[3]], TIE_TOP, F2_FLOOR - 0.02, 0.05, 'nsew', { g: 30 })
  add({ id: 'floor-trusses', componentId: 'c-floor-system', geo: 'box', mat: 'lumber', inst: [...fl.filter((x) => !x.q), ...rim], anim: 'drop', dropH: 1.4 })
  add({ id: 'floor-webs', componentId: 'c-floor-system', geo: 'cyl', mat: 'lumber', inst: fl.filter((x) => x.q), anim: 'drop', dropH: 1.4, castShadow: false })
  add({
    id: 'subfloor',
    componentId: 'c-floor-system',
    geo: 'box',
    mat: 'osb',
    inst: tile([MAIN[0], MAIN[1], MAIN[2], MAIN[3]], 2.4, 1.2, 0.01, F2_FLOOR - 0.02, F2_FLOOR, true),
    anim: 'pop',
    window: [0.55, 1],
  })
}
add({ id: 'f2-framing', componentId: 'c-walls-f2', geo: 'box', mat: 'lumber', inst: framing(F2_WALLS), anim: 'rise', overlap: 0.3 })
add({ id: 'partitions', componentId: 'c-partitions', geo: 'box', mat: 'lumber', inst: framing(PARTITIONS), anim: 'rise', overlap: 0.25 })
{
  const up = trusses([MAIN[0] + 0.1, MAIN[1], MAIN[2] - 0.1, MAIN[3]], F2_TOP, ROOF_TOP, 'z', 0.6)
  const gr = trusses([GREAT[0], GREAT[1] - 1.55, GREAT[2], GREAT[3]], TIE_TOP, LOW_ROOF_TOP, 'z', 0.6, 40)
  const ga = trusses([GARAGE[0], GARAGE[1] - 0.45, GARAGE[2] + 0.45, GARAGE[3] + 0.5], TIE_TOP, LOW_ROOF_TOP, 'x', 0.6, 80)
  const all = [...up, ...gr, ...ga]
  const post = [box(-10.35, SLAB, -12.45, -10.15, TIE_TOP, -12.25, { g: 39, c: '#26292c' })]
  add({ id: 'roof-trusses', componentId: 'c-roof-trusses', geo: 'box', mat: 'lumber', inst: [...all.filter((x) => !x.q), ...post], anim: 'drop', dropH: 2.2 })
  add({ id: 'roof-webs', componentId: 'c-roof-trusses', geo: 'cyl', mat: 'lumber', inst: all.filter((x) => x.q), anim: 'drop', dropH: 2.2, castShadow: false })
}
{
  const deck: Inst[] = [
    ...tile([-10.6, -6.6, 3.6, 4.6], 2.4, 1.2, 0.01, ROOF_TOP, ROOF_TOP + 0.02),
    ...tile([-10.6, -12.7, 3.6, -6.05], 2.4, 1.2, 0.01, LOW_ROOF_TOP, LOW_ROOF_TOP + 0.02).map((x) => ({ ...x, g: (x.g ?? 0) + 20 })),
    ...tile([3.05, -3.6, 11.6, 5.6], 2.4, 1.2, 0.01, LOW_ROOF_TOP, LOW_ROOF_TOP + 0.02).map((x) => ({ ...x, g: (x.g ?? 0) + 40 })),
  ]
  add({ id: 'roof-deck', componentId: 'c-sheathing', geo: 'box', mat: 'osb', inst: deck, anim: 'pop', window: [0.35, 1] })
  add({ id: 'wall-sheathing', componentId: 'c-sheathing', geo: 'box', mat: 'osb', inst: skin(F2_WALLS, 0, 0.012, { vStart: -0.37 }), anim: 'pop', window: [0, 0.5] })
}

// ===========================================================================
// MEP
// ===========================================================================

const Y1 = TIE_TOP + 0.17 // first-floor ceiling chase (inside floor trusses)
const YA = F2_TOP + 0.17 // attic chase

// Plumbing supply (blue PEX — hot/cold pairs)
{
  const r = 0.03
  const runs: V3[][] = [
    [[10.3, SLAB, -2.4], [10.3, Y1, -2.4], [-8.4, Y1, -2.4]],
    [[0.6, Y1, -2.4], [0.6, Y1, -5.4], [0.6, 1.0, -5.4]],
    [[2.2, Y1, -2.4], [2.2, Y1, 1.6], [2.2, 0.9, 1.6]],
    [[2.6, Y1, -2.4], [2.6, Y1, -9.0], [2.6, 1.0, -9.0]],
    [[-6.8, Y1, -2.4], [-6.8, Y1, 2.8], [-6.8, F2_FLOOR + 0.6, 2.8], [-9.3, F2_FLOOR + 0.6, 2.8], [-9.3, F2_FLOOR + 1.0, 2.8]],
    [[-6.8, F2_FLOOR + 0.6, 2.8], [-6.8, F2_FLOOR + 0.6, 0.4], [-7.6, F2_FLOOR + 0.6, 0.4], [-7.6, F2_FLOOR + 1.0, 0.4]],
    [[1.4, Y1, -2.4], [1.4, F2_FLOOR + 0.6, -2.4], [1.4, F2_FLOOR + 0.6, -0.4], [2.4, F2_FLOOR + 0.6, -0.4], [2.4, F2_FLOOR + 1.0, -0.4]],
    [[10.3, 0.4, -2.4], [11.4, 0.4, -2.4], [11.4, 0.4, -2.6]],
  ]
  const inst: Inst[] = []
  runs.forEach((pts, i) => {
    inst.push(...polyline(pts, r, { g: i }))
    inst.push(...polyline(pts.map(([x, y, z]) => [x + 0.07, y + 0.0, z + 0.07] as V3), r, { g: i, c: '#5d9be0' }))
  })
  inst.push(seg([10.3, SLAB, -2.6], [10.3, 1.9, -2.6], 0.3, { g: 0, c: '#c9cdd2' })) // water heater
  add({ id: 'plb-supply', componentId: 'c-plb-supply', geo: 'cyl', mat: 'white', inst: inst.map((x) => ({ ...x, c: x.c ?? '#3f86d6' })), anim: 'rise', castShadow: false })
}

// Drain / waste / vent (white PVC): stacks through roof + upstairs drains
{
  const r = 0.05
  const inst: Inst[] = [
    seg([-6.8, 0.85, 2.8], [-6.8, ROOF_TOP + 0.45, 2.8], r, { g: 0 }),
    seg([1.4, 0.85, -0.8], [1.4, ROOF_TOP + 0.45, -0.8], r, { g: 0 }),
    seg([9.6, 0.85, -2.2], [9.6, LOW_ROOF_TOP + 0.4, -2.2], r * 0.8, { g: 0 }),
    ...polyline([[-9.3, F2_FLOOR - 0.1, 2.8], [-6.8, F2_FLOOR - 0.15, 2.8]], r * 0.8, { g: 1 }),
    ...polyline([[-7.6, F2_FLOOR - 0.1, 0.4], [-7.6, F2_FLOOR - 0.1, 2.8]], r * 0.8, { g: 1 }),
    ...polyline([[2.4, F2_FLOOR - 0.1, -0.4], [1.4, F2_FLOOR - 0.15, -0.4], [1.4, F2_FLOOR - 0.15, -0.8]], r * 0.8, { g: 1 }),
    ...polyline([[-4.2, F2_FLOOR - 0.1, -5.0], [-4.2, F2_FLOOR - 0.15, 2.8], [-6.8, F2_FLOOR - 0.15, 2.8]], r * 0.8, { g: 2 }),
  ]
  add({ id: 'plb-dwv', componentId: 'c-plb-dwv', geo: 'cyl', mat: 'pvc', inst, anim: 'rise', castShadow: false })
}

// HVAC — first floor: trunk in floor-truss chase + flex branches + boots
{
  const trunk = ductRun([[2.3, 2.1, 3.1], [2.3, Y1, 3.1], [2.3, Y1, 1.0], [-9.0, Y1, 1.0]], 0.5, 0.24, { g: 0 })
  const great = ductRun([[-1.0, Y1, 1.0], [-1.0, Y1, -5.6], [-1.0, TIE_TOP + 0.12, -7.0], [-1.0, TIE_TOP + 0.12, -8.6], [-6.0, TIE_TOP + 0.12, -8.6]], 0.4, 0.22, { g: 1 })
  const g2 = ductRun([[-1.0, TIE_TOP + 0.12, -8.6], [2.4, TIE_TOP + 0.12, -8.6]], 0.4, 0.22, { g: 1 })
  const flex: Inst[] = []
  const boots: Inst[] = []
  const targets: [number, number, number][] = [
    [-8.5, 1.0, 3.0], [-6.5, 1.0, -3.5], [-4.5, 1.0, 3.0], [-3.0, 1.0, -4.5], [-1.5, 1.0, 2.6], [1.5, 1.0, -4.2],
    [-5.0, -8.6, -10.2], [-2.5, -8.6, -10.2], [0.5, -8.6, -10.2], [2.0, -8.6, -7.2],
  ]
  targets.forEach(([x, zFrom, zTo], i) => {
    const y = zFrom === 1.0 ? Y1 : TIE_TOP + 0.12
    flex.push(...polyline([[x, y, zFrom], [x, y - 0.02, zTo]], 0.09, { g: 2 + i * 0.3 }))
    boots.push(box(x - 0.2, TIE_TOP - 0.06, zTo - 0.12, x + 0.2, TIE_TOP, zTo + 0.12, { g: 2 + i * 0.3 }))
  })
  add({ id: 'hvac-f1-trunk', componentId: 'c-hvac-f1', geo: 'box', mat: 'duct', inst: [...trunk, ...great, ...g2, ...boots], anim: 'sweep', castShadow: false })
  add({ id: 'hvac-f1-flex', componentId: 'c-hvac-f1', geo: 'cyl', mat: 'ductFlex', inst: flex, anim: 'rise', castShadow: false })
}

// HVAC — second floor & attic
{
  const trunk = ductRun([[-1.6, YA, -2.2], [-9.2, YA, -2.2]], 0.45, 0.22, { g: 0 })
  const t2 = ductRun([[-0.4, YA, -2.2], [2.4, YA, -2.2]], 0.4, 0.22, { g: 0 })
  const flex: Inst[] = []
  const boots: Inst[] = []
  const targets: [number, number][] = [[-8.6, -4.6], [-6.0, -4.2], [-8.2, 2.6], [-4.2, 2.6], [-1.8, -4.8], [1.4, -4.4], [1.4, 0.0], [1.4, 2.8], [-1.8, 2.4]]
  targets.forEach(([x, z], i) => {
    flex.push(seg([x, YA, -2.2], [x, YA - 0.02, z], 0.08, { g: 1 + i * 0.4 }))
    boots.push(box(x - 0.18, F2_TOP - 0.06, z - 0.12, x + 0.18, F2_TOP, z + 0.12, { g: 1 + i * 0.4 }))
  })
  boots.push(box(-1.0, F2_TOP - 0.1, -2.6, -0.2, F2_TOP, -1.8, { g: 0.5 }))
  add({ id: 'hvac-f2-trunk', componentId: 'c-hvac-f2', geo: 'box', mat: 'duct', inst: [...trunk, ...t2, ...boots], anim: 'sweep', castShadow: false })
  add({ id: 'hvac-f2-flex', componentId: 'c-hvac-f2', geo: 'cyl', mat: 'ductFlex', inst: flex, anim: 'rise', castShadow: false })
}

// HVAC equipment: condensers on side-yard pad, air handlers
add({
  id: 'hvac-equip',
  componentId: 'c-hvac-equip',
  geo: 'box',
  mat: 'equipment',
  anim: 'drop',
  dropH: 1.5,
  inst: [
    box(11.4, 0.0, -2.3, 12.9, 0.1, 0.9, { g: 0, c: '#bdbab3' }),
    box(11.6, 0.1, -2.1, 12.5, 1.0, -1.2, { g: 1 }),
    box(11.6, 0.1, -0.6, 12.5, 1.0, 0.3, { g: 2 }),
    box(11.7, 1.0, -2.0, 12.4, 1.03, -1.3, { g: 1, c: '#2c2f33' }),
    box(11.7, 1.0, -0.5, 12.4, 1.03, 0.2, { g: 2, c: '#2c2f33' }),
    box(1.95, SLAB, 2.75, 2.65, 2.1, 3.45, { g: 3 }),
    box(-2.0, F2_TOP + 0.02, -2.6, -0.6, F2_TOP + 0.34, -1.8, { g: 4 }),
  ],
})

// Electrical: auto-derived from walls (receptacle runs, boxes, switch drops)
function electrical(walls: Wall[], panel: V3, gBase = 0): Inst[] {
  const out: Inst[] = []
  const r = 0.022
  walls.forEach((w, wi) => {
    const g = gBase + wi
    const wo = w.kind === 'cmu' ? -w.t - 0.015 : -w.t / 2
    const L = wallLen(w)
    for (const [u0, u1] of freeSpans(w, 0.3, 0.42)) {
      if (u1 - u0 < 0.4) continue
      out.push(seg(wallPoint(w, u0 + 0.1, 0.36, wo), wallPoint(w, u1 - 0.1, 0.36, wo), r, { g }))
      for (let u = u0 + 0.6; u < u1 - 0.3; u += 2.4) {
        const p = wallPoint(w, u, 0.36, wo)
        out.push(box(p[0] - 0.05, p[1] - 0.06, p[2] - 0.05, p[0] + 0.05, p[1] + 0.06, p[2] + 0.05, { g }))
      }
    }
    for (const op of w.openings) {
      if (op.kind !== 'door' && op.kind !== 'entry' && op.kind !== 'slider') continue
      const u = Math.min(L - 0.1, op.u1 + 0.2)
      out.push(seg(wallPoint(w, u, w.h - 0.05, wo), wallPoint(w, u, 1.2, wo), r, { g }))
      const p = wallPoint(w, u, 1.2, wo)
      out.push(box(p[0] - 0.05, p[1] - 0.07, p[2] - 0.05, p[0] + 0.05, p[1] + 0.07, p[2] + 0.05, { g }))
    }
    // Home run: along the wall's ceiling chase to the interior spine (x=2.6), then to the panel.
    const mid = wallPoint(w, L / 2, w.h - 0.05, wo)
    const y = mid[1] + 0.12
    if (mid[0] > 3.05) {
      if (Math.abs(panel[0] - mid[0]) > 0.3) out.push(seg([mid[0], y, mid[2]], [panel[0], y, mid[2]], r, { g }))
    } else {
      out.push(...polyline([[mid[0], y, mid[2]], [2.6, y, mid[2]], [2.6, y, 0.5]], r, { g }))
      if (panel[0] > 3) out.push(seg([2.6, y, 0.5], [panel[0], y, 0.5], r, { g }))
    }
  })
  return out
}
{
  const f1 = electrical([...CMU_WALLS, ...PARTITIONS.filter((p) => p.floor === 1)], [10.6, 0, 0.5])
  const cans: Inst[] = []
  for (const [x, z] of [[-8, 2], [-6, -3], [-3.5, -3], [-1, -3], [1.5, -3], [-5, -8.5], [-2, -8.5], [1, -8.5], [-8.5, -8.5], [-2.5, 2.5], [1.5, 2.2], [7, 1], [7, -1.5]] as [number, number][]) {
    cans.push(seg([x, TIE_TOP - 0.1, z], [x, TIE_TOP, z], 0.07, { g: 20 }))
  }
  add({ id: 'elec-f1', componentId: 'c-elec-f1', geo: 'cyl', mat: 'wire', inst: [...f1.filter((x) => x.q), ...cans], anim: 'rise', castShadow: false })
  add({ id: 'elec-f1-boxes', componentId: 'c-elec-f1', geo: 'box', mat: 'wire', inst: f1.filter((x) => !x.q), anim: 'pop', castShadow: false })
  const f2 = electrical([...F2_WALLS, ...PARTITIONS.filter((p) => p.floor === 2)], [2.6, 0, 2.5])
  const cans2: Inst[] = []
  for (const [x, z] of [[-8, -3.5], [-5, -3.5], [-8, 2], [-4.2, 2], [-1.8, -3], [-1.8, 2], [1.4, -3.5], [1.4, 2.6]] as [number, number][]) {
    cans2.push(seg([x, F2_TOP - 0.1, z], [x, F2_TOP, z], 0.07, { g: 20 }))
  }
  add({ id: 'elec-f2', componentId: 'c-elec-f2', geo: 'cyl', mat: 'wire', inst: [...f2.filter((x) => x.q), ...cans2], anim: 'rise', castShadow: false })
  add({ id: 'elec-f2-boxes', componentId: 'c-elec-f2', geo: 'box', mat: 'wire', inst: f2.filter((x) => !x.q), anim: 'pop', castShadow: false })
}
add({
  id: 'elec-service',
  componentId: 'c-elec-service',
  geo: 'box',
  mat: 'panel',
  anim: 'drop',
  dropH: 0.8,
  inst: [
    box(10.72, 0.9, 2.0, 10.8, 2.0, 2.6, { g: 0 }),
    box(10.72, 0.9, 2.8, 10.8, 2.0, 3.4, { g: 1 }),
    box(11.05, 1.3, 2.2, 11.25, 1.9, 2.55, { g: 2, c: '#7d8288' }),
    box(11.1, 0.15, 2.3, 11.2, 1.3, 2.4, { g: 2, c: '#7d8288' }),
  ],
})

// Low voltage: media panel, data/TV drops, speakers, cameras, WAPs
{
  const r = 0.022
  const yv = TIE_TOP + 0.05
  const runs: Inst[] = [
    ...polyline([[10.6, 1.4, -1.6], [10.6, yv, -1.6], [-6.6, yv, -1.6]], r, { g: 0 }),
    ...polyline([[-6.6, yv, -1.6], [-6.6, yv, -9.0], [-6.85, 1.6, -9.0]], r, { g: 1 }),
    ...polyline([[-8.0, yv, -1.6], [-8.0, yv, 2.6], [-9.75, 0.4, 2.6]], r, { g: 2 }),
    ...polyline([[0.4, yv, -1.6], [0.4, F2_FLOOR + 0.1, -1.6], [-6.0, F2_FLOOR + 0.1, -1.6], [-6.0, F2_FLOOR + 0.1, -5.7]], r, { g: 3 }),
    ...polyline([[0.4, F2_FLOOR + 0.1, -1.6], [2.6, F2_FLOOR + 0.1, -3.0]], r, { g: 3 }),
  ]
  add({ id: 'lv-runs', componentId: 'c-lv', geo: 'cyl', mat: 'lv', inst: runs, anim: 'rise', castShadow: false })
  add({ id: 'lv-panel', componentId: 'c-lv', geo: 'box', mat: 'lv', inst: [box(10.72, 1.1, -2.0, 10.8, 1.9, -1.2)], anim: 'drop', dropH: 0.6, castShadow: false })
  const av: Inst[] = []
  for (const [x, z] of [[-5, -7.6], [-5, -10], [0, -7.6], [0, -10], [-8.5, -8.5], [-6.5, -2.5], [-6.5, 2.6]] as [number, number][]) av.push(seg([x, TIE_TOP - 0.05, z], [x, TIE_TOP, z], 0.12, { g: 0 }))
  for (const [x, z] of [[-1.8, -1.2], [1.0, 0]] as [number, number][]) av.push(seg([x, F2_TOP - 0.04, z], [x, F2_TOP, z], 0.11, { g: 1 }))
  for (const [x, y, z] of [[-10.5, 6.75, 4.5], [3.5, 6.75, 4.5], [-10.5, 6.75, -6.5], [11.5, 3.55, 5.5], [-10.5, 3.55, -12.6]] as V3[]) av.push(seg([x, y, z], [x, y - 0.14, z], 0.06, { g: 2 }))
  add({ id: 'lv-av', componentId: 'c-lv-av', geo: 'cyl', mat: 'lv', inst: av, anim: 'pop', castShadow: false })
}

// ===========================================================================
// ENVELOPE
// ===========================================================================

const extF1 = CMU_WALLS.filter((w) => w.skin === 'ext')
const stuccoH = (w: Wall) => (w.floor === 2 ? ROOF_TOP - 0.15 - w.y0 : w.id.startsWith('m-') ? F2_FLOOR - w.y0 : TIE_TOP - w.y0)

add({
  id: 'lath',
  componentId: 'c-lath',
  geo: 'box',
  mat: 'wrap',
  inst: [...skin(extF1, 0.004, 0.016, { h: stuccoH }), ...skin(F2_WALLS, 0.012, 0.024, { h: stuccoH }).map((x) => ({ ...x, g: (x.g ?? 0) + 20 }))],
  anim: 'pop',
  castShadow: false,
})
add({
  id: 'stucco',
  componentId: 'c-stucco',
  geo: 'box',
  mat: 'stucco',
  inst: [...skin(extF1, 0.016, 0.04, { h: stuccoH }), ...skin(F2_WALLS, 0.024, 0.048, { h: stuccoH }).map((x) => ({ ...x, g: (x.g ?? 0) + 20 }))],
  anim: 'rise',
  window: [0.05, 0.85],
})

// Windows, sliders and glazing — derived from wall openings
{
  const frames: Inst[] = []
  const glass: Inst[] = []
  const doors: Inst[] = []
  const garage: Inst[] = []
  let g = 0
  for (const w of ALL_EXTERIOR) {
    const base = w.kind === 'cmu' ? -0.09 : -0.05
    for (const op of w.openings) {
      const f = 0.06
      const d0 = base - 0.05
      const d1 = base + 0.05
      if (op.kind === 'window' || op.kind === 'slider') {
        frames.push(wallBox(w, op.u0, op.u1, op.v0, op.v0 + f, d0, d1, { g }))
        frames.push(wallBox(w, op.u0, op.u1, op.v1 - f, op.v1, d0, d1, { g }))
        frames.push(wallBox(w, op.u0, op.u0 + f, op.v0, op.v1, d0, d1, { g }))
        frames.push(wallBox(w, op.u1 - f, op.u1, op.v0, op.v1, d0, d1, { g }))
        const width = op.u1 - op.u0
        const panes = Math.max(1, Math.round(width / (op.kind === 'slider' ? 2.4 : 1.8)))
        for (let i = 1; i < panes; i++) {
          const u = op.u0 + (width * i) / panes
          frames.push(wallBox(w, u - 0.03, u + 0.03, op.v0, op.v1, d0, d1, { g }))
        }
        glass.push(wallBox(w, op.u0 + f, op.u1 - f, op.v0 + f, op.v1 - f, base - 0.01, base + 0.01, { g }))
        g++
      } else if (op.kind === 'entry') {
        doors.push(wallBox(w, op.u0 + 0.5, op.u1 - 0.3, op.v0, op.v1, base - 0.03, base + 0.03, { g: 0, c: '#8b5e3c' }))
        doors.push(wallBox(w, op.u0, op.u0 + 0.5, op.v0, op.v1, base - 0.02, base + 0.02, { g: 0, c: '#2b3a44' }))
        doors.push(wallBox(w, op.u1 - 0.3, op.u1, op.v0, op.v1, base - 0.02, base + 0.02, { g: 0, c: '#2b3a44' }))
        doors.push(wallBox(w, op.u1 - 0.75, op.u1 - 0.7, 0.9, 1.9, base + 0.03, base + 0.09, { g: 0, c: '#1b1d20' }))
      } else if (op.kind === 'door') {
        if (w.skin === 'ext') doors.push(wallBox(w, op.u0, op.u1, op.v0, op.v1, base - 0.03, base + 0.03, { g: 1, c: '#2a2c2f' }))
      } else if (op.kind === 'garage') {
        const slats = 10
        for (let i = 0; i < slats; i++) {
          const v0 = op.v0 + ((op.v1 - op.v0) * i) / slats
          const v1 = v0 + (op.v1 - op.v0) / slats - 0.012
          garage.push(wallBox(w, op.u0, op.u1, v0, v1, base - 0.02, base + 0.03, { g: i }))
        }
      }
    }
  }
  add({ id: 'window-frames', componentId: 'c-windows', geo: 'box', mat: 'frame', inst: frames, anim: 'drop', dropH: 0.5 })
  add({ id: 'glazing', componentId: 'c-windows', geo: 'box', mat: 'glass', inst: glass, anim: 'fade', window: [0.15, 1], castShadow: false })
  add({ id: 'entry-door', componentId: 'c-doors', geo: 'box', mat: 'white', inst: doors, anim: 'pop', window: [0.7, 1] })
  add({ id: 'garage-doors', componentId: 'c-garage-doors', geo: 'box', mat: 'garageDoor', inst: garage, anim: 'rise' })
}

// Roofing: membrane, black fascia, wood soffits
{
  const membrane: Inst[] = [
    box(-10.6, ROOF_TOP + 0.02, -6.6, 3.6, ROOF_TOP + 0.05, 4.6, { g: 0 }),
    box(-10.6, LOW_ROOF_TOP + 0.02, -12.7, 3.6, LOW_ROOF_TOP + 0.05, -6.05, { g: 1 }),
    box(3.05, LOW_ROOF_TOP + 0.02, -3.6, 11.6, LOW_ROOF_TOP + 0.05, 5.6, { g: 2 }),
  ]
  add({ id: 'roof-membrane', componentId: 'c-roofing', geo: 'box', mat: 'membrane', inst: membrane, anim: 'sweep', window: [0, 0.6] })
  const fascia: Inst[] = [
    ...ring([-10.7, -6.7, 3.7, 4.7], ROOF_TOP - 0.2, ROOF_TOP + 0.3, 0.1, 'nsew', { g: 0 }),
    ...ring([-10.7, -12.8, 3.7, -6.0], TIE_TOP + 0.05, LOW_ROOF_TOP + 0.25, 0.1, 'swe', { g: 1 }),
    ...ring([3.0, -3.7, 11.7, 5.7], TIE_TOP + 0.05, LOW_ROOF_TOP + 0.25, 0.1, 'nse', { g: 2 }),
    box(3.0, TIE_TOP + 0.05, 4.0, 3.1, LOW_ROOF_TOP + 0.25, 5.7, { g: 2 }),
  ]
  add({ id: 'fascia', componentId: 'c-roofing', geo: 'box', mat: 'fascia', inst: fascia, anim: 'sweep', window: [0.5, 1] })
  const soffit: Inst[] = [
    ...rectMinus([-10.6, -6.6, 3.6, 4.6], [[-10.05, -6.05, 3.05, 4.05]]).map((r) => slabBox(r, ROOF_TOP - 0.21, ROOF_TOP - 0.19, { g: 0 })),
    ...rectMinus([-10.6, -12.7, 3.6, -6.05], [[-7.05, -11.05, 3.05, -6.05]]).map((r) => slabBox(r, TIE_TOP - 0.02, TIE_TOP, { g: 1 })),
    ...rectMinus([3.05, -3.6, 11.6, 5.6], [[3.05, -3.05, 11.05, 5.05]]).map((r) => slabBox(r, TIE_TOP + 0.04, TIE_TOP + 0.06, { g: 2 })),
  ]
  const portal: Inst[] = [
    box(PORTAL[0], SLAB, PORTAL[1] + 0.05, PORTAL[0] + 0.28, ROOF_TOP + 0.3, PORTAL[3], { g: 3 }),
    box(PORTAL[2] - 0.28, SLAB, PORTAL[1] + 0.05, PORTAL[2], ROOF_TOP + 0.3, PORTAL[3], { g: 3 }),
    box(PORTAL[0], ROOF_TOP - 0.2, PORTAL[1] + 0.05, PORTAL[2], ROOF_TOP + 0.3, PORTAL[3], { g: 3 }),
    box(PORTAL[0], F2_FLOOR - 0.1, PORTAL[1] + 0.05, PORTAL[2], F2_FLOOR + 0.25, PORTAL[3], { g: 3 }),
  ]
  add({ id: 'wood-cladding', componentId: 'c-wood-cladding', geo: 'box', mat: 'wood', inst: [...soffit, ...portal], anim: 'pop', appearTask: 't-stucco', window: [0.7, 1] })
}

// ===========================================================================
// INTERIOR
// ===========================================================================

const intWalls = [...CMU_WALLS, ...F2_WALLS]
add({
  id: 'insulation',
  componentId: 'c-insulation',
  geo: 'box',
  mat: 'insulation',
  inst: [
    ...skin(F2_WALLS, -0.13, -0.015),
    ...skin(extF1, -0.225, -0.2).map((x) => ({ ...x, g: (x.g ?? 0) + 10 })),
    box(-10, ROOF_TOP - 0.16, -6, 3, ROOF_TOP - 0.02, 4, { g: 30 }),
    box(-10, LOW_ROOF_TOP - 0.14, -11, 3, LOW_ROOF_TOP - 0.02, -6.05, { g: 31 }),
  ],
  anim: 'pop',
  castShadow: false,
})
{
  const inside = (w: Wall) => (w.kind === 'cmu' ? [-0.24, -0.225] : [-w.t - 0.013, -w.t]) as [number, number]
  const dw: Inst[] = []
  intWalls.forEach((w, i) => {
    if (w.id === 'g-front' || w.id === 'g-east' || w.id === 'g-rear' || w.id === 'g-west') return
    const [a, b] = inside(w)
    skin([w], a, b).forEach((x) => dw.push({ ...x, g: i }))
  })
  PARTITIONS.forEach((w, i) => {
    skin([w], -w.t - 0.013, -w.t).forEach((x) => dw.push({ ...x, g: 30 + i }))
    skin([w], 0, 0.013).forEach((x) => dw.push({ ...x, g: 30 + i }))
  })
  // ceilings
  dw.push(...tile([-10, -6, 3, 4], 2.4, 1.2, 0.004, TIE_TOP - 0.02, TIE_TOP - 0.005).map((x) => ({ ...x, g: 50 })))
  dw.push(...tile([-7, -11, 3, -6], 2.4, 1.2, 0.004, TIE_TOP - 0.02, TIE_TOP - 0.005).map((x) => ({ ...x, g: 51 })))
  dw.push(...tile([-10, -6, 3, 4], 2.4, 1.2, 0.004, F2_TOP - 0.02, F2_TOP - 0.005).map((x) => ({ ...x, g: 52 })))
  add({ id: 'drywall', componentId: 'c-drywall', geo: 'box', mat: 'drywall', inst: dw, anim: 'pop', colorTo: { task: 't-paint', color: '#f6f2ea' }, overlap: 0.08 })
}
add({
  id: 'floor-tile',
  componentId: 'c-flooring',
  geo: 'box',
  mat: 'tile',
  inst: [...tile([-10, -6, 3, 4], 1.2, 0.6, 0.004, SLAB, SLAB + 0.012), ...tile([-7, -11, 3, -6], 1.2, 0.6, 0.004, SLAB, SLAB + 0.012).map((x) => ({ ...x, g: (x.g ?? 0) + 20 }))],
  anim: 'pop',
  window: [0, 0.55],
  castShadow: false,
})
add({
  id: 'floor-oak',
  componentId: 'c-flooring',
  geo: 'box',
  mat: 'oak',
  inst: tile([-10, -6, 3, 4], 2.2, 0.22, 0.003, F2_FLOOR, F2_FLOOR + 0.014, false),
  anim: 'pop',
  window: [0.5, 1],
  castShadow: false,
})
add({
  id: 'cabinetry',
  componentId: 'c-cabinetry',
  geo: 'box',
  mat: 'cabinet',
  anim: 'drop',
  dropH: 0.6,
  inst: [
    box(-2.2, SLAB, -4.4, 1.4, SLAB + 0.88, -3.3, { g: 0 }),
    box(2.25, SLAB, -5.8, 2.85, SLAB + 0.88, -1.4, { g: 1 }),
    box(2.25, SLAB, -1.3, 2.85, SLAB + 2.6, 0.3, { g: 2 }),
    box(-9.85, F2_FLOOR, 1.0, -9.3, F2_FLOOR + 0.85, 3.6, { g: 3 }),
    box(2.35, F2_FLOOR, -0.9, 2.85, F2_FLOOR + 0.85, 0.2, { g: 4 }),
    box(-6.9, SLAB, -10.85, -2.5, SLAB + 0.55, -10.45, { g: 5 }),
  ],
})
add({
  id: 'countertops',
  componentId: 'c-counters',
  geo: 'box',
  mat: 'counter',
  anim: 'drop',
  dropH: 0.4,
  inst: [
    box(-2.25, SLAB + 0.88, -4.45, 1.45, SLAB + 0.92, -3.25, { g: 0 }),
    box(-2.25, SLAB, -4.45, -2.2, SLAB + 0.92, -3.25, { g: 0 }),
    box(1.4, SLAB, -4.45, 1.45, SLAB + 0.92, -3.25, { g: 0 }),
    box(2.2, SLAB + 0.88, -5.85, 2.88, SLAB + 0.92, -1.35, { g: 1 }),
    box(-9.88, F2_FLOOR + 0.85, 0.95, -9.25, F2_FLOOR + 0.89, 3.65, { g: 2 }),
    box(2.3, F2_FLOOR + 0.85, -0.95, 2.88, F2_FLOOR + 0.89, 0.25, { g: 3 }),
  ],
})
add({
  id: 'fixtures',
  componentId: 'c-fixtures',
  geo: 'box',
  mat: 'ceramic',
  anim: 'grow',
  inst: [
    { ...box(-8.6, F2_FLOOR, -0.1, -6.6, F2_FLOOR + 0.55, 0.8), g: 0, a: [-7.6, F2_FLOOR, 0.35] },
    { ...box(-9.8, F2_FLOOR + 0.89, 1.6, -9.4, F2_FLOOR + 1.0, 2.1), g: 1, a: [-9.6, F2_FLOOR + 0.89, 1.85] },
    { ...box(-9.8, F2_FLOOR + 0.89, 2.6, -9.4, F2_FLOOR + 1.0, 3.1), g: 1, a: [-9.6, F2_FLOOR + 0.89, 2.85] },
    { ...box(-9.85, F2_FLOOR, 3.2, -9.3, F2_FLOOR + 2.1, 3.95), g: 2, a: [-9.6, F2_FLOOR, 3.6], c: '#b9c3c8' },
    { ...box(0.2, SLAB + 0.92, -5.2, 0.8, SLAB + 0.96, -4.6), g: 3, a: [0.5, SLAB + 0.92, -4.9], c: '#2b2d30' },
    { ...box(1.7, SLAB + 0.92, -3.9, 1.75, SLAB + 1.25, -3.8), g: 3, a: [1.7, SLAB + 0.92, -3.85], c: '#1d1f22' },
  ],
})
add({
  id: 'interior-lighting',
  componentId: 'c-lighting',
  geo: 'cyl',
  mat: 'bulb',
  anim: 'pop',
  glow: { task: 't-handover', color: '#ffcf8a', intensity: 6 },
  castShadow: false,
  inst: [
    ...[[-1.6, -3.85], [-0.4, -3.85], [0.8, -3.85]].map(([x, z]) => seg([x, TIE_TOP - 0.9, z], [x, TIE_TOP - 0.5, z], 0.13, { g: 0 })),
    ...[[-8, 2], [-6, -3], [-3.5, -3], [-5, -8.5], [-2, -8.5], [1, -8.5], [-8.5, -8.5], [-2.5, 2.5], [1.5, 2.2], [-5, -10], [0, -10]].map(([x, z]) => seg([x, TIE_TOP - 0.035, z], [x, TIE_TOP - 0.02, z], 0.07, { g: 1 })),
    ...[[-8, -3.5], [-5, -3.5], [-8, 2], [-4.2, 2], [-1.8, -3], [-1.8, 2], [1.4, -3.5], [1.4, 2.6]].map(([x, z]) => seg([x, F2_TOP - 0.035, z], [x, F2_TOP - 0.02, z], 0.07, { g: 2 })),
    ...[[-8.8, -12.0], [-5.5, -12.0], [-2.0, -12.0], [1.5, -12.0], [-8.6, -9.0], [-8.6, -7.0]].map(([x, z]) => seg([x, TIE_TOP - 0.035, z], [x, TIE_TOP - 0.02, z], 0.07, { g: 3 })),
  ],
})
// Staging furniture appears for the homeowner walkthrough
add({
  id: 'staging',
  componentId: 'c-fixtures',
  appearTask: 't-walkthrough',
  geo: 'box',
  mat: 'fabric',
  anim: 'grow',
  inst: [
    { ...box(-5.6, SLAB, -9.8, -3.0, SLAB + 0.42, -8.9), g: 0, a: [-4.3, SLAB, -9.3] },
    { ...box(-5.6, SLAB, -9.8, -5.2, SLAB + 0.75, -8.0), g: 0, a: [-5.4, SLAB, -8.9] },
    { ...box(-4.6, SLAB, -8.0, -3.6, SLAB + 0.35, -7.3), g: 1, a: [-4.1, SLAB, -7.6], c: '#8a6a4f' },
    { ...box(-9.5, SLAB, -4.2, -7.5, SLAB + 0.75, -2.4), g: 2, a: [-8.5, SLAB, -3.3], c: '#6b4e37' },
    { ...box(-9.2, SLAB, -13.6, -8.4, SLAB - 0.05 + 0.4, -11.6), g: 3, a: [-8.8, SLAB, -12.6] },
    { ...box(-7.9, SLAB, -13.6, -7.1, SLAB - 0.05 + 0.4, -11.6), g: 3, a: [-7.5, SLAB, -12.6] },
    { ...box(-2.4, 0.06, -14.6, -0.6, 0.38, -13.9), g: 4, a: [-1.5, 0.06, -14.2] },
    { ...box(0.2, 0.06, -14.6, 2.0, 0.38, -13.9), g: 4, a: [1.1, 0.06, -14.2] },
    { ...box(-8.6, F2_FLOOR, -5.4, -6.4, F2_FLOOR + 0.55, -3.2), g: 5, a: [-7.5, F2_FLOOR, -4.3] },
  ],
})

// ===========================================================================
// EXTERIOR
// ===========================================================================

// Pool: shell (shotcrete → plaster), coping, water
{
  const [x0, z0, x1, z1] = POOL
  const d = -1.7
  const t = 0.2
  const shell: Inst[] = [
    box(x0, d, z0, x1, d + t, z1, { g: 0 }),
    box(x0, d, z0, x0 + t, 0, z1, { g: 1 }),
    box(x1 - t, d, z0, x1, 0, z1, { g: 1 }),
    box(x0, d, z0, x1, 0, z0 + t, { g: 1 }),
    box(x0, d, z1 - t, x1, 0, z1, { g: 1 }),
  ]
  add({ id: 'pool-shell', componentId: 'c-pool', geo: 'box', mat: 'poolShell', inst: shell, anim: 'pop', colorTo: { task: 't-pool-finish', color: '#dfeef1' }, castShadow: false })
  add({ id: 'pool-coping', componentId: 'c-pool-finish', geo: 'box', mat: 'coping', inst: ring([x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35], 0, 0.06, 0.4, 'nsew', { g: 0 }), anim: 'sweep', window: [0, 0.5] })
  add({
    id: 'pool-water',
    componentId: 'c-pool-finish',
    geo: 'box',
    mat: 'water',
    inst: [box(x0 + t, d + t, z0 + t, x1 - t, -0.12, z1 - t)],
    anim: 'rise',
    window: [0.7, 1],
    glow: { task: 't-landscape-lighting', color: '#58c6e0', intensity: 0.7 },
    castShadow: false,
  })
}

// Driveway: large-format pads with grass joints (house → street)
{
  const pads: Inst[] = []
  const cols: [number, number][] = [[DRIVE[0], DRIVE[0] + 2.3], [DRIVE[0] + 2.45, DRIVE[0] + 4.75], [DRIVE[0] + 4.9, DRIVE[2]]]
  let row = 0
  for (let z = DRIVE[1]; z < DRIVE[3] - 0.2; z += 1.15, row++) {
    for (const [a, b] of cols) pads.push(box(a, 0.0, z, b, 0.07, Math.min(z + 1.0, DRIVE[3]), { g: row }))
  }
  pads.push(box(DRIVE[0] - 0.4, 0.0, 17.1, DRIVE[2] + 0.4, 0.06, 19.4, { g: row }))
  // front walk: stepping pads from portal to sidewalk
  let k = 0
  for (let z = 5.4; z < 17; z += 0.95, k++) pads.push(box(-2.6, 0.0, z, -0.9, 0.06, z + 0.6, { g: k }))
  add({ id: 'driveway', componentId: 'c-driveway', geo: 'box', mat: 'paver', inst: pads, anim: 'pop' })
}
{
  const deckRects = rectMinus(DECK, [[POOL[0] - 0.35, POOL[1] - 0.35, POOL[2] + 0.35, POOL[3] + 0.35], [-10.0, -12.7, 3.0, -11.0]])
  const pav: Inst[] = []
  deckRects.forEach((r) => pav.push(...tile(r, 0.9, 0.9, 0.012, 0, 0.05)))
  pav.push(...tile([-10, -11, -7, -6], 0.9, 0.9, 0.012, SLAB, SLAB + 0.02).map((x) => ({ ...x, g: 40 })))
  add({ id: 'pool-deck', componentId: 'c-pool-deck', geo: 'box', mat: 'paver', inst: pav, anim: 'pop', castShadow: false })
}

// Sod rolled out in strips (excludes hardscape footprints)
{
  const holes: Rect[] = [DECK, [DRIVE[0] - 0.05, DRIVE[1], DRIVE[2] + 0.05, 17.0], [-12.5, -12.7, 13.2, 7.5]]
  const strips: Inst[] = []
  let g = 0
  for (let z = LOT[1]; z < LOT[3]; z += 1.2) {
    for (const r of rectMinus([LOT[0], z, LOT[2], Math.min(z + 1.18, LOT[3])], holes)) strips.push(box(r[0], 0.0, r[1], r[2], 0.03, r[3], { g }))
    g++
  }
  add({ id: 'sod', componentId: 'c-sod', geo: 'box', mat: 'sod', inst: strips, anim: 'sweep', castShadow: false, inert: false })
}

// Palms, hedges and beds
{
  const palms: [number, number, number][] = [
    [-12.5, 9, 7.5], [-8.5, 12.5, 6.5], [13.5, 13.5, 7.2], [-12.8, -15, 7.8], [-12.2, -19.5, 6.8], [5.5, -14.2, 7.2], [7.5, -19.8, 6.4], [-5.0, 6.8, 5.6],
  ]
  const trunks: Inst[] = []
  const fronds: Inst[] = []
  palms.forEach(([x, z, h], i) => {
    const a: V3 = [x, 0, z]
    trunks.push({ ...seg([x, 0, z], [x + 0.15, h, z + 0.1], 0.17), g: i, a })
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2 + i * 0.7
      const L = 2.9 + (k % 2) * 0.4
      const tilt = k % 4 === 0 ? 0.25 : -0.28 - (k % 3) * 0.16
      const cx = x + 0.15 + Math.cos(ang) * L * 0.45
      const cz = z + 0.1 + Math.sin(ang) * L * 0.45
      fronds.push({ p: [cx, h + Math.sin(tilt) * L * 0.45 + 0.15, cz], s: [L, 0.04, 0.62], q: euler(0, -ang, tilt), g: i, a })
    }
    trunks.push({ p: [x + 0.15, h + 0.05, z + 0.1], s: [0.55, 0.7, 0.55], g: i, a, c: '#6f6a4c' })
  })
  add({ id: 'palm-trunks', componentId: 'c-planting', geo: 'cyl', mat: 'palmTrunk', inst: trunks, anim: 'grow' })
  add({ id: 'palm-fronds', componentId: 'c-planting', geo: 'box', mat: 'palmFrond', inst: fronds, anim: 'grow' })
  const hedges: Inst[] = []
  const hedgeRuns: Rect[] = [
    [-15.6, -23.6, -14.8, 16.0], [14.8, -23.6, 15.6, 16.0], [-14.8, 15.6, 2.6, 16.4], [11.8, 15.6, 14.8, 16.4],
    [-10.4, 4.6, -3.8, 5.3], [-0.1, 4.6, 3.0, 5.3], [11.3, -2.6, 12.9, -2.3],
  ]
  hedgeRuns.forEach((r, i) => hedges.push({ ...box(r[0], 0, r[1], r[2], i < 4 ? 1.9 : 0.75, r[3]), g: i }))
  add({ id: 'hedges', componentId: 'c-planting', geo: 'box', mat: 'hedge', inst: hedges, anim: 'rise' })
  const shrubs: Inst[] = []
  let s = 3
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 26; i++) {
    const side = i % 2 === 0
    const x = side ? -10.2 + rnd() * 6 : 11.6 + rnd() * 2.6
    const z = side ? 5.6 + rnd() * 1.2 : 1 + rnd() * 3.5
    const r = 0.35 + rnd() * 0.3
    shrubs.push({ p: [x, r * 0.7, z], s: [r * 2, r * 1.5, r * 2], g: i, a: [x, 0, z] })
  }
  add({ id: 'shrubs', componentId: 'c-planting', geo: 'sphere', mat: 'leaf', inst: shrubs, anim: 'grow', castShadow: false })
  add({
    id: 'beds',
    componentId: 'c-planting',
    geo: 'box',
    mat: 'mulch',
    inst: [box(-10.6, 0, 5.3, -3.6, 0.04, 7.0, { g: 0 }), box(11.2, 0, 0.6, 14.4, 0.04, 5.0, { g: 1 }), box(-0.1, 0, 5.3, 3.4, 0.04, 6.4, { g: 2 })],
    anim: 'pop',
    castShadow: false,
  })
}

// Landscape lighting: path lights + uplights
{
  const lights: Inst[] = []
  for (let z = 6.5; z < 16.5; z += 2.4) {
    lights.push(seg([-3.0, 0, z], [-3.0, 0.55, z], 0.05, { g: 0 }))
    lights.push(seg([3.2, 0, z], [3.2, 0.55, z], 0.05, { g: 0 }))
  }
  for (const [x, z] of [[-12.5, 9], [-8.5, 12.5], [13.5, 13.5], [-12.8, -15], [5.5, -14.2], [7.5, -19.8], [-5.0, 6.8]] as [number, number][]) {
    lights.push(seg([x + 0.5, 0, z + 0.5], [x + 0.5, 0.18, z + 0.5], 0.09, { g: 1 }))
  }
  for (const [x, z] of [[-10.2, 4.2], [-3.6, 4.2], [0.2, 4.2], [10.8, 5.2], [3.4, 5.2]] as [number, number][]) {
    lights.push(seg([x, 2.4, z], [x, 2.6, z + 0.05], 0.06, { g: 2 }))
  }
  add({
    id: 'landscape-lights',
    componentId: 'c-ext-lighting',
    geo: 'cyl',
    mat: 'bulb',
    inst: lights,
    anim: 'grow',
    glow: { task: 't-landscape-lighting', color: '#ffd59a', intensity: 5 },
    castShadow: false,
  })
}

// Used by rotY import for palms (kept for future orientation needs)
void rotY

export const HOUSE_PARTS: PartSpec[] = parts
