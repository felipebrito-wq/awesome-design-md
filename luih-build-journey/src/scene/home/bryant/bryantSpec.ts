/**
 * Procedural build-up of 2623 S Bryant Cir, driven by its real Buildertrend
 * schedule (task ids = slug of the BT schedule item, see
 * scripts/import-buildertrend.mjs). Same PartSpec contract as the demo house.
 */
import type { ComponentRecord } from '@/domain/types'
import { box, polyline, rectMinus, seg, tile, euler } from '../geom'
import type { Inst, PartSpec, V3 } from '../partTypes'
import { gableRoofGeometry, hipRafters, hipRoofGeometry, mergeGeometries, type HipRect } from '../roofs'
import { framing, freeSpans, masonry, skin, wallBox, wallLen, wallPoint, type Opening, type Wall } from '../walls'
import {
  DRIVE, F1_BLOCK_TOP, F1_OUTLINE, F1_TOP, F2_BLOCK_TOP, F2_FLOOR, F2_OUTLINE, F2_TOP, FFE, FT, GARAGE_LINE, GARAGE_RECT,
  GAR_BLOCK_TOP, GAR_SLAB, GAR_TOP, LANAI, LOT, MAIN_ROOFS, OPENINGS, PARTITIONS_F1, PARTITIONS_F2, POND, POOL, X, Z, type Pt,
} from './plan'

type R = { x0: number; d0: number; x1: number; d1: number }
const rect = (r: R, y0: number, y1: number, extra: Partial<Inst> = {}) => box(X(r.x0), y0, Z(r.d1), X(r.x1), y1, Z(r.d0), extra)
const sceneRect = (r: R): [number, number, number, number] => [X(r.x0), Z(r.d1), X(r.x1), Z(r.d0)]
const T = (name: string) => 'bt-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------------------------------------------------------------------------
// Components ↔ Buildertrend schedule items
// ---------------------------------------------------------------------------
const C = (id: string, name: string, layer: string, task: string, location: string, specs?: Record<string, string>, system?: ComponentRecord['system']): ComponentRecord => ({
  id, name, layer, taskId: T(task), location, specs, system,
})
export const BRYANT_COMPONENTS: ComponentRecord[] = [
  C('c-existing-home', 'Existing Residence (demolished)', 'site.existing', 'Demolition Permit', 'Lot'),
  C('c-existing-trees', 'Removed Trees (permitted)', 'site.existing', 'Tree Removal Permit', 'Lot', { Removed: '32" laurel oak (hazard), two 12" ROW oaks' }),
  C('c-stakeout', 'Building Stake Out', 'site.temp', 'Survey: Building Stake Out', 'Lot'),
  C('c-temp', 'Temporary Facilities & Tree Protection', 'site.temp', 'Survey: Building Stake Out', 'Lot', { 'Tree protection': 'Grand oak barricades per Arborist report' }),
  C('c-footings', 'Stem Wall Footings', 'foundation.footings', 'Shell: Stem Wall Base Concrete Pouring', 'Perimeter', { Type: 'Continuous footing' }, 'structure'),
  C('c-trenches', 'Footing Excavation & Prep', 'site.excavation', 'Shell: Stem Wall Prep', 'Perimeter'),
  C('c-stemwall', 'CMU Stem Wall', 'foundation.footings', 'Shell: Stem Wall Block', 'Perimeter', { Height: '3\'-6" — raised above DFE 13.5\' NAVD', Vents: '8×16 Smart Vent flood vents' }, 'structure'),
  C('c-backfill', 'Backfill & Compaction', 'site.terrain', 'Grading: Backfilling Stemwall', 'Inside stem wall'),
  C('c-ug-plumbing', 'Underground Plumbing', 'foundation.underground', 'Plumbing: Underground Plumbing', 'Under slab', undefined, 'drain'),
  C('c-ug-electric', 'Underground Electrical', 'foundation.underground', 'Electric: Underground Electrical', 'Under slab', undefined, 'electrical'),
  C('c-slab-prep', 'Vapor Barrier & Reinforcement', 'foundation.rebar', 'Shell: Foundation Prep', 'Slab', undefined, 'structure'),
  C('c-slab', 'Slab', 'foundation.slab', 'Shell: Slab Pouring', 'Whole house', { 'Main FFE': '13.5\' NAVD (+3\'-6")', Garage: 'At grade + 10"' }, 'structure'),
  C('c-block-delivery', 'Block & Lintel Delivery', 'site.temp', 'Shell: Deliver Block & Lintel', 'Driveway'),
  C('c-cmu-1', 'First-Floor CMU Walls', 'structure.masonry', 'Shell: Block Wall Up', 'First floor', { Block: '8" CMU', Lintels: 'Precast, filled cells @ rebar' }, 'structure'),
  C('c-tiebeam-1', 'First-Floor Tie Beam & Lintels', 'structure.masonry', 'Shell: Block & Lintel Pouring', 'First floor', undefined, 'structure'),
  C('c-framing-1', 'First-Floor Partitions', 'structure.floor1', 'Shell: Framing First Floor', 'First floor', undefined, 'structure'),
  C('c-floor-trusses', 'Second-Floor Trusses & Subfloor', 'structure.floor2', 'Shell: First Floor Trusses Installation', 'Between floors', { Note: 'TJI extra service CO 04/28' }, 'structure'),
  C('c-cmu-2', 'Second-Floor CMU Walls', 'structure.masonry', 'Shell: Block Wall Up (2nd Floor)', 'Second floor', { Block: '8" CMU' }, 'structure'),
  C('c-tiebeam-2', 'Second-Floor Tie Beam', 'structure.masonry', 'Shell: Block & Lintel Pouring (2nd Floor)', 'Second floor', undefined, 'structure'),
  C('c-framing-2', 'Second-Floor Partitions', 'structure.floor2', 'Shell: Framing 2nd Floor', 'Second floor', undefined, 'structure'),
  C('c-roof-trusses', 'Roof Trusses (hip, 6:12)', 'structure.roof', 'Shell: Roof Trusses Installation', 'Roof', { Pitch: '6:12 main · 4:12 garage · 12:12 front gable' }, 'structure'),
  C('c-stairs', 'Stair', 'structure.floor1', 'Shell: Stairs Installation', 'Foyer', undefined, 'structure'),
  C('c-safety-rail', 'Fall-Protection Railings (temporary)', 'site.temp', 'Shell: Safety Railings', 'Openings & balconies'),
  C('c-dry-in', 'Roof Sheathing & Dry-In', 'structure.sheathing', 'Roofing: Roofing Dry-In', 'Roof', undefined, 'structure'),
  C('c-roofing', 'Roofing', 'envelope.roof', 'Roofing: Roofing Shingles Installation', 'Roof', { Visible: 'Black standing-seam metal', 'Non-visible': 'Black shingles' }),
  C('c-windows', 'Windows & Sliders', 'envelope.windows', 'Windows: Windows/Sliders Installation', 'Exterior', { Brand: 'PGT', Frames: 'Black aluminum, reinforced', Glass: 'Impact-resistant' }),
  C('c-entry-door', 'Entry Doors', 'envelope.doors', 'Doors: Exterior Door Installation', 'Entry', { Door: 'Black aluminum & glass, elliptical transom', Hardware: 'Vertical bar, brushed nickel' }),
  C('c-plumbing', 'Plumbing Rough-In', 'mep.plumbing-supply', 'Plumbing: Plumbing Rough', 'Throughout', { Note: '2 water heaters (rev. 05/2026)' }, 'plumbing'),
  C('c-hvac', 'HVAC Rough-In', 'mep.hvac-ducts', 'HVAC: HVAC Rough Installation', 'Ceilings & attic', { Systems: '2 AC systems (rev. 07/2026)', 'Mech room': '2nd floor' }, 'hvac'),
  C('c-hvac-equip', 'AC Condensers', 'mep.hvac-equipment', 'Trim: HVAC Trim Installation', 'Right side yard', { Mounting: 'Raised concrete pad above DFE' }, 'hvac'),
  C('c-electrical', 'Electrical Rough-In', 'mep.electrical', 'Electric: Electrical Rough', 'Throughout', { Service: 'Meter & panel above DFE', Notes: 'USB at headboards · future elevator circuit' }, 'electrical'),
  C('c-gas', 'Gas Rough-In', 'mep.plumbing-supply', 'Gas: Gas Rough In', 'Kitchen & outdoor kitchen', { Tank: 'Buried LP tank' }, 'plumbing'),
  C('c-lowvoltage', 'Low Voltage Rough-In', 'mep.low-voltage', 'Electric: Low Voltage Rough-In', 'Throughout', undefined, 'lowvoltage'),
  C('c-insulation', 'Insulation', 'interior.insulation', 'Insulation: Insulation installation', 'Walls & attic', { Block: 'R-4.1 foil', Attic: 'Open-cell foam R-20' }),
  C('c-drywall', 'Drywall', 'interior.drywall', 'Drywall: Drywall Hang', 'Throughout', { Walls: 'SW7647 Crushed Ice', Ceilings: 'SW7006 Extra White' }),
  C('c-lath', 'Stucco Lath', 'envelope.waterproofing', 'Stucco: Stucco Lath Installation', 'Rear & base'),
  C('c-stucco', 'Stucco', 'envelope.cladding', 'Stucco: Stucco Application', 'Rear & stem wall base', { Finish: 'Sand blast · SW7006 Extra White' }),
  C('c-siding', 'Lap Siding', 'envelope.cladding', 'Siding: Siding Installation', 'Front & sides', { Profile: '8" lap', Color: 'SW7006 Extra White' }),
  C('c-soffit', 'Soffit & Fascia', 'envelope.roof', 'Trim: Soffit and Fascia Installation', 'Eaves', { Soffit: 'Vented aluminum, white', Fascia: 'Black' }),
  C('c-gutters', 'Gutters & Downspouts', 'envelope.roof', 'Gutters: Gutters Installation', 'Eaves', { Color: 'Black' }),
  C('c-flooring', 'Flooring', 'interior.flooring', 'Flooring: Floor Installation', 'Throughout', { Type: 'MSI Daria Umber LVP' }),
  C('c-tile', 'Tile', 'interior.flooring', 'Tile: Shower and Floor Tiles Installation', 'Baths & lanai', { Baths: 'Andover White porcelain', Lanai: 'District Gray porcelain' }),
  C('c-cabinets', 'Cabinetry', 'interior.cabinetry', 'Cabinets: Cabinets Installation', 'Kitchen & baths', { Style: '5-piece shaker · Como Ash 2', Hardware: 'Black matte' }),
  C('c-counters', 'Countertops', 'interior.countertops', 'Countertops: Countertops Installation', 'Kitchen & baths', { Material: 'Premium quartz — Calacatta' }),
  C('c-interior-doors', 'Interior Doors', 'interior.fixtures', 'Doors: Interior & Closets Doors Installation', 'Throughout', { Doors: 'Pre-hung, white smooth', Hardware: 'Black aluminum' }),
  C('c-garage-doors', 'Garage Doors', 'envelope.doors', 'Doors: Garage Door Installation', 'Garage', { Style: 'Carriage, 16\'×8\' + 9\'×8\'' }),
  C('c-railings', 'Balcony & Exterior Railings', 'envelope.doors', 'Exterior Railings & Awnings', 'Balconies & stairs'),
  C('c-fixtures', 'Plumbing Fixtures', 'interior.fixtures', 'Plumbing: Plumbing Trim', 'Baths & kitchen', { Faucets: 'Delta, matte black' }),
  C('c-lighting', 'Lighting', 'interior.lighting', 'Trim: Lighting Fixtures', 'Throughout'),
  C('c-pool-dig', 'Pool Excavation', 'exterior.pool', 'Pool Excavation', 'Rear yard'),
  C('c-pool', 'Pool Shell', 'exterior.pool', 'Gunite/Shotcrete Application', 'Rear yard', { Finish: 'Natural quartz aggregate — Blue Quartz', Tile: '6×6 Arb Aqua' }),
  C('c-pool-finish', 'Pool Plaster & Water', 'exterior.pool', 'Plaster Application', 'Rear yard'),
  C('c-pool-deck', 'Pool Deck & Coping', 'exterior.hardscape', 'Deck Construction', 'Rear yard', { Stone: 'Diana Royal Leather' }),
  C('c-summer-kitchen', 'Summer Kitchen', 'exterior.hardscape', 'Summer Kitchen: Frame Installation', 'Lanai'),
  C('c-drive', 'Driveway & Walks', 'exterior.driveway', 'Pavers: Driveway & Walkway Installation', 'Front yard', { Pavers: 'Gray' }),
  C('c-apron', 'Sidewalk & Apron', 'exterior.driveway', 'Shell: Pour Sidewalk and Apron', 'Right-of-way', { Note: 'Unreinforced concrete apron (City of Tampa)' }),
  C('c-landscape', 'Landscaping & Sod', 'exterior.landscaping', 'Landscaping: Landscaping Installation', 'Lot'),
  C('c-fence', 'Fence', 'exterior.hardscape', 'Fence: Fence Installation', 'Sides & rear'),
  C('c-staging', 'Staging', 'interior.fixtures', 'Staging', 'Main living'),
]

const parts: PartSpec[] = []
const add = (p: PartSpec) => parts.push(p)

// ---------------------------------------------------------------------------
// Walls from plan outlines
// ---------------------------------------------------------------------------
function inside(poly: Pt[], x: number, d: number) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, di] = poly[i]
    const [xj, dj] = poly[j]
    if (di > d !== dj > d && x < ((xj - xi) * (d - di)) / (dj - di) + xi) c = !c
  }
  return c
}

const shared = (a: Pt, b: Pt) => (a[0] === 52 && b[0] === 52 && Math.max(a[1], b[1]) <= 23) || (a[1] === 23 && b[1] === 23 && Math.min(a[0], b[0]) >= 52)

function buildWalls(pts: Pt[], closed: boolean, floor: 0 | 1 | 2, y0: number, h: number, prefix: string, poly: Pt[]): Wall[] {
  const out: Wall[] = []
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    if (floor === 0 && shared(a, b)) continue
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    let pn: [number, number] = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len]
    const mx = (a[0] + b[0]) / 2
    const md = (a[1] + b[1]) / 2
    if (inside(poly, mx + pn[0] * 0.5, md + pn[1] * 0.5)) pn = [-pn[0], -pn[1]]
    const A: [number, number] = [X(a[0]), Z(a[1])]
    const B: [number, number] = [X(b[0]), Z(b[1])]
    const alongX = a[1] === b[1]
    const openings: Opening[] = OPENINGS.filter((o) => {
      if (o.floor !== floor) return false
      if ('d' in o.line) return alongX && Math.abs(o.line.d - a[1]) < 0.6 && o.from >= Math.min(a[0], b[0]) - 0.1 && o.to <= Math.max(a[0], b[0]) + 0.1
      return !alongX && Math.abs(o.line.x - a[0]) < 0.6 && o.from >= Math.min(a[1], b[1]) - 0.1 && o.to <= Math.max(a[1], b[1]) + 0.1
    }).map((o) => {
      const ga = alongX ? [X(o.from), X(o.to)] : [Z(o.from), Z(o.to)]
      const base = alongX ? A[0] : A[1]
      const u0 = Math.min(Math.abs(ga[0] - base), Math.abs(ga[1] - base))
      const u1 = Math.max(Math.abs(ga[0] - base), Math.abs(ga[1] - base))
      return { u0, u1, v0: o.sill * FT, v1: o.head * FT, kind: o.kind }
    })
    out.push({
      id: `${prefix}-${i}`,
      a: A,
      b: B,
      n: [pn[0], -pn[1]],
      y0,
      h,
      t: 0.2,
      kind: 'cmu',
      skin: floor !== 0 && shared(a, b) ? 'int' : 'ext',
      floor: floor === 2 ? 2 : 1,
      openings,
    })
  }
  return out
}

const WALLS_1 = buildWalls(F1_OUTLINE, true, 1, FFE, F1_BLOCK_TOP - FFE, 'f1', F1_OUTLINE)
const WALLS_2 = buildWalls(F2_OUTLINE, true, 2, F2_FLOOR, F2_BLOCK_TOP - F2_FLOOR, 'f2', F2_OUTLINE)
const GAR_POLY: Pt[] = [[52, 0], [82.7, 0], [82.7, 23], [52, 23]]
const WALLS_G = buildWalls(GARAGE_LINE, false, 0, GAR_SLAB, GAR_BLOCK_TOP - GAR_SLAB, 'g', GAR_POLY)
const EXT = [...WALLS_1, ...WALLS_2, ...WALLS_G].filter((w) => w.skin === 'ext')
const isRear = (w: Wall) => w.n[1] < -0.5
const SIDING = EXT.filter((w) => !isRear(w))
const STUCCO = EXT.filter(isRear)

const partition = (seg2: [Pt, Pt], floor: 1 | 2, i: number): Wall => ({
  id: `p${floor}-${i}`,
  a: [X(seg2[0][0]), Z(seg2[0][1])],
  b: [X(seg2[1][0]), Z(seg2[1][1])],
  n: seg2[0][0] === seg2[1][0] ? [1, 0] : [0, 1],
  y0: floor === 1 ? FFE : F2_FLOOR,
  h: floor === 1 ? F1_TOP - FFE - 0.02 : F2_TOP - F2_FLOOR - 0.02,
  t: 0.1,
  kind: 'wood',
  skin: 'int',
  floor,
  openings: [{ u0: 0.8, u1: 1.7, v0: 0, v1: 2.1, kind: 'door' }],
})
const PART_1 = PARTITIONS_F1.map((s, i) => partition(s, 1, i))
const PART_2 = PARTITIONS_F2.map((s, i) => partition(s, 2, i))

// Floor-plate rectangles (ft) used for slabs, floors, ceilings
const F1_RECTS: R[] = [
  { x0: 0.4, d0: 7, x1: 18.5, d1: 54 },
  { x0: 18.5, d0: 9, x1: 52, d1: 50 },
  { x0: 52, d0: 23, x1: 61, d1: 50 },
  { x0: 60, d0: 23, x1: 75, d1: 69 },
]
const F2_RECTS: R[] = [
  { x0: 0.4, d0: 13, x1: 18.5, d1: 57 },
  { x0: 18.5, d0: 13, x1: 59, d1: 52 },
  { x0: 59, d0: 17.5, x1: 75, d1: 69 },
  { x0: 45, d0: 52, x1: 61, d1: 64 },
]

// ===========================================================================
// SITE — before
// ===========================================================================
add({
  id: 'existing-home',
  componentId: 'c-existing-home',
  geo: 'box',
  mat: 'white',
  anim: 'pop',
  appearTask: '__always',
  disappearTask: T('Demolition Permit'),
  disappearWindow: [0.96, 1],
  inst: [
    { ...rect({ x0: 12, d0: 2, x1: 66, d1: 42 }, 0, 3.0), c: '#d6ccbc', g: 0 },
    { ...rect({ x0: 11, d0: 1, x1: 67, d1: 43 }, 3.0, 3.25), c: '#5d544c', g: 0 },
    { ...box(X(14), 3.25, Z(40), X(64), 4.6, Z(4), { q: euler(0, 0, 0) }), c: '#6a5f56', g: 0 },
    { ...rect({ x0: 50, d0: -25, x1: 62, d1: 2 }, 0, 0.04), c: '#9b968c', g: 1 },
  ],
})
add({
  id: 'existing-trees',
  componentId: 'c-existing-trees',
  geo: 'sphere',
  mat: 'leafWild',
  anim: 'grow',
  appearTask: '__always',
  disappearTask: T('Tree Removal Permit'),
  disappearWindow: [0.97, 1],
  inst: [
    { p: [X(30), 7.5, Z(56)], s: [9, 5.5, 9], a: [X(30), 0, Z(56)], g: 0 },
    { p: [X(30), 2.6, Z(56)], s: [0.9, 5.2, 0.9], a: [X(30), 0, Z(56)], g: 0, c: '#5d4f42' },
    { p: [X(40), 5.0, Z(-30)], s: [5, 3.4, 5], a: [X(40), 0, Z(-30)], g: 1 },
    { p: [X(72), 5.0, Z(-30)], s: [5, 3.4, 5], a: [X(72), 0, Z(-30)], g: 1 },
  ],
})
add({ id: 'lot-grass-before', componentId: 'c-existing-home', geo: 'box', mat: 'grassWild', anim: 'pop', appearTask: '__always', disappearTask: T('Survey: Building Stake Out'), disappearFade: true, inert: true, castShadow: false, inst: [rect(LOT, 0, 0.012)] })
add({
  id: 'lot-dirt',
  componentId: 'c-backfill',
  geo: 'box',
  mat: 'dirt',
  anim: 'fade',
  appearTask: T('Survey: Building Stake Out'),
  disappearTask: T('Landscaping: Landscaping Installation'),
  disappearFade: true,
  inert: true,
  castShadow: false,
  inst: rectMinus([X(LOT.x0), Z(LOT.d1), X(LOT.x1), Z(LOT.d0)], [sceneRect(POOL)]).map((r) => box(r[0], 0, r[1], r[2], 0.016, r[3])),
})
add({ id: 'pool-area-dirt', componentId: 'c-pool-dig', geo: 'box', mat: 'dirt', anim: 'fade', appearTask: T('Survey: Building Stake Out'), disappearTask: T('Pool Excavation'), disappearFade: true, inert: true, castShadow: false, inst: [rect(POOL, 0, 0.016)] })

// Stake out + temporary facilities + grand-tree barricades
{
  const stakes: Inst[] = []
  ;[...F1_OUTLINE, ...GARAGE_LINE].forEach(([x, d], i) => {
    stakes.push(box(X(x) - 0.025, 0, Z(d) - 0.025, X(x) + 0.025, 0.9, Z(d) + 0.025, { g: i }))
    stakes.push(box(X(x) - 0.03, 0.75, Z(d) - 0.03, X(x) + 0.03, 0.85, Z(d) + 0.03, { g: i, c: '#e0577a' }))
  })
  add({ id: 'stakes', componentId: 'c-stakeout', geo: 'box', mat: 'stake', inst: stakes, anim: 'rise', disappearTask: T('Shell: Slab Pouring') })
  const fence: Inst[] = []
  const runs: [Pt, Pt][] = [[[LOT.x0, LOT.d0 + 1], [48, LOT.d0 + 1]], [[86, LOT.d0 + 1], [LOT.x1, LOT.d0 + 1]], [[LOT.x1, LOT.d0 + 1], [LOT.x1, LOT.d1]], [[LOT.x1, LOT.d1], [LOT.x0, LOT.d1]], [[LOT.x0, LOT.d1], [LOT.x0, LOT.d0 + 1]]]
  let g = 0
  for (const [a, b] of runs) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.ceil(len / 10)
    for (let i = 0; i < n; i++) {
      const p0 = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]
      const p1 = [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n]
      fence.push(box(X(p0[0]) - 0.03, 0, Z(p0[1]) - 0.03, X(p0[0]) + 0.03, 1.85, Z(p0[1]) + 0.03, { g, c: '#3a3e42' }))
      fence.push(box(Math.min(X(p0[0]), X(p1[0])) - 0.01, 0.05, Math.min(Z(p0[1]), Z(p1[1])) - 0.01, Math.max(X(p0[0]), X(p1[0])) + 0.01, 1.8, Math.max(Z(p0[1]), Z(p1[1])) + 0.01, { g, c: '#2f4a3c' }))
      g++
    }
  }
  fence.push(box(X(88), 0, Z(-18), X(91.5), 2.3, Z(-14), { g: g + 1, c: '#3e5a49' }))
  fence.push(box(X(84), 0, Z(-4), X(92), 1.4, Z(14), { g: g + 2, c: '#2f4658' }))
  // grand-tree protection barricades (orange) — front-left 32" oak, right-side 26" oak
  for (const [cx, cd, r] of [[-6, -16, 14], [96, 52, 12]] as const) {
    for (let k = 0; k < 10; k++) {
      const a0 = (k / 10) * Math.PI * 2
      const a1 = ((k + 1) / 10) * Math.PI * 2
      fence.push({ ...seg([X(cx + Math.cos(a0) * r), 0.6, Z(cd + Math.sin(a0) * r)], [X(cx + Math.cos(a1) * r), 0.6, Z(cd + Math.sin(a1) * r)], 0.02), g: g + 3, c: '#e8772e' })
    }
  }
  add({ id: 'temp-site', componentId: 'c-temp', geo: 'box', mat: 'white', inst: fence.filter((x) => !x.q), anim: 'rise', disappearTask: T('Cleaning: Final Clean and Pressure Washing') })
  add({ id: 'temp-barricades', componentId: 'c-temp', geo: 'cyl', mat: 'barricade', inst: fence.filter((x) => x.q), anim: 'pop', disappearTask: T('Landscaping: Landscaping Installation'), castShadow: false })
}

// ===========================================================================
// FOUNDATION — stem wall, backfill, slab
// ===========================================================================
const STEM = buildWalls(F1_OUTLINE, true, 1, 0, FFE - 0.12, 'stem', F1_OUTLINE).map((w) => ({ ...w, openings: [] }))
const STEM_G = buildWalls(GARAGE_LINE, false, 0, 0, 0.2, 'stemg', GAR_POLY).map((w) => ({ ...w, openings: [] }))
add({
  id: 'trenches',
  componentId: 'c-trenches',
  geo: 'box',
  mat: 'trench',
  anim: 'sweep',
  disappearTask: T('Shell: Stem Wall Base Concrete Pouring'),
  disappearFade: true,
  castShadow: false,
  inst: [...STEM, ...STEM_G].map((w, i) => wallBox({ ...w, y0: 0 }, -0.2, wallLen(w) + 0.2, 0, 0.01, -0.5, 0.25, { g: i })),
})
add({ id: 'footings', componentId: 'c-footings', geo: 'box', mat: 'concreteFresh', anim: 'sweep', castShadow: false, inst: [...STEM, ...STEM_G].map((w, i) => wallBox({ ...w, y0: 0 }, -0.2, wallLen(w) + 0.2, 0, 0.05, -0.45, 0.2, { g: i })) })
add({ id: 'stemwall', componentId: 'c-stemwall', geo: 'box', mat: 'white', anim: 'sweep', overlap: 0.25, inst: [...masonry(STEM), ...masonry(STEM_G)] })
add({ id: 'backfill', componentId: 'c-backfill', geo: 'box', mat: 'sand', anim: 'rise', castShadow: false, inst: F1_RECTS.map((r, i) => rect(r, 0.02, FFE - 0.14, { g: i })) })
{
  const y = FFE - 0.13
  const r = 0.055
  const ug: Inst[] = [
    ...polyline([[X(8), y, Z(14)], [X(8), y, Z(30)], [X(50), y, Z(30)], [X(66), y, Z(30)], [X(66), y, Z(60)]], r, { g: 0 }),
    ...polyline([[X(66), y, Z(30)], [X(66), y, Z(24)], [X(90), y - 0.6, Z(-20)]], r, { g: 0 }),
    ...polyline([[X(51), y, Z(35)], [X(51), y, Z(30)]], r * 0.8, { g: 1 }),
    ...polyline([[X(64), y, Z(30)], [X(64), y, Z(28)]], r * 0.8, { g: 1 }),
  ]
  for (const [x, d] of [[8, 14], [51, 35], [64, 28], [66, 55], [27, 35], [8, 20]] as const) ug.push(seg([X(x), y, Z(d)], [X(x), FFE + 0.5, Z(d)], r, { g: 2 }))
  add({ id: 'ug-plumbing', componentId: 'c-ug-plumbing', geo: 'cyl', mat: 'pvc', inst: ug, anim: 'rise', castShadow: false })
  add({ id: 'ug-electric', componentId: 'c-ug-electric', geo: 'cyl', mat: 'wire', anim: 'rise', castShadow: false, inst: polyline([[X(80), 0.2, Z(-24)], [X(78), y, Z(26)], [X(62), y, Z(26)]], 0.035, { g: 0 }) })
}
add({ id: 'vapor', componentId: 'c-slab-prep', geo: 'box', mat: 'vapor', anim: 'sweep', castShadow: false, inst: [...F1_RECTS.map((r, i) => rect(r, FFE - 0.14, FFE - 0.13, { g: i })), rect(GARAGE_RECT, 0.02, 0.03, { g: 5 })] })
add({ id: 'slab', componentId: 'c-slab', geo: 'box', mat: 'concrete', anim: 'rise', inst: [...F1_RECTS.map((r, i) => rect(r, FFE - 0.12, FFE, { g: i })), rect(GARAGE_RECT, 0.02, GAR_SLAB, { g: 5 }), rect(LANAI, FFE - 0.12, FFE, { g: 6 }), rect({ x0: 18.5, d0: 50, x1: 37, d1: 53 }, FFE - 0.12, FFE, { g: 6 })] })
// Entry stoop, stairs and raised planters (cast with the slab)
{
  const steps: Inst[] = [rect({ x0: 23, d0: 4.5, x1: 33, d1: 9 }, 0, FFE, { g: 0 })]
  for (let i = 0; i < 6; i++) {
    const h = FFE - (i + 1) * (FFE / 6)
    steps.push(rect({ x0: 25, d0: 4.5 - (i + 1) * 0.9, x1: 31, d1: 4.5 - i * 0.9 }, 0, Math.max(h, 0.05), { g: 1 }))
  }
  steps.push(rect({ x0: 18.5, d0: 3.5, x1: 23, d1: 7 }, 0, 0.75, { g: 2, c: '#bdbab3' }), rect({ x0: 33, d0: 3.5, x1: 40, d1: 9 }, 0, 0.75, { g: 2, c: '#bdbab3' }))
  // rear stairs: lanai → pool deck
  for (let i = 0; i < 6; i++) steps.push(rect({ x0: 33.5 - i * 0.9, d0: 55, x1: 37 - i * 0.9, d1: 62 }, 0, FFE - i * (FFE / 6), { g: 3 }))
  add({ id: 'stoop', componentId: 'c-slab', geo: 'box', mat: 'white', inst: steps.map((s) => ({ ...s, c: s.c ?? '#c3bfb7' })), anim: 'rise' })
}

// ===========================================================================
// STRUCTURE — two floors of CMU, trusses, hip roofs
// ===========================================================================
add({ id: 'pallets-1', componentId: 'c-block-delivery', geo: 'box', mat: 'white', anim: 'pop', disappearTask: T('Shell: Block Wall Up (2nd Floor)'), inst: Array.from({ length: 10 }, (_, i) => box(X(56 + (i % 5) * 5), 0.25, Z(-6 - Math.floor(i / 5) * 5), X(59.6 + (i % 5) * 5), 1.2, Z(-9.6 - Math.floor(i / 5) * 5), { g: i, c: i % 2 ? '#a9a7a1' : '#a3a19b' })) })
add({ id: 'cmu-1', componentId: 'c-cmu-1', geo: 'box', mat: 'white', inst: [...masonry(WALLS_1), ...masonry(WALLS_G)], anim: 'sweep', overlap: 0.12 })
add({
  id: 'tiebeam-1',
  componentId: 'c-tiebeam-1',
  geo: 'box',
  mat: 'concrete',
  anim: 'sweep',
  inst: [
    ...WALLS_1.map((w, i) => wallBox(w, 0, wallLen(w), F1_BLOCK_TOP - FFE, F1_TOP - FFE, -w.t, 0, { g: i })),
    ...WALLS_G.map((w, i) => wallBox(w, 0, wallLen(w), GAR_BLOCK_TOP - GAR_SLAB, GAR_TOP - GAR_SLAB, -w.t, 0, { g: 20 + i })),
    ...WALLS_1.flatMap((w, i) => w.openings.map((o) => wallBox(w, o.u0 - 0.2, o.u1 + 0.2, o.v1, Math.min(o.v1 + 0.2, F1_BLOCK_TOP - FFE), -w.t, 0, { g: i }))),
  ],
})
add({ id: 'framing-1', componentId: 'c-framing-1', geo: 'box', mat: 'lumber', inst: framing(PART_1), anim: 'rise', overlap: 0.3 })
{
  const tr: Inst[] = []
  F2_RECTS.forEach((r, i) => {
    const xs = [X(r.x0) + 0.1, X(r.x1) - 0.1]
    for (let x = xs[0]; x < xs[1]; x += 0.6) {
      tr.push(box(x - 0.02, F1_TOP, Z(r.d1) + 0.1, x + 0.02, F1_TOP + 0.06, Z(r.d0) - 0.1, { g: i * 100 + x }))
      tr.push(box(x - 0.02, F2_FLOOR - 0.08, Z(r.d1) + 0.1, x + 0.02, F2_FLOOR - 0.02, Z(r.d0) - 0.1, { g: i * 100 + x }))
    }
  })
  tr.push(rect(LANAI, F1_TOP, F2_FLOOR - 0.02, { g: 999, c: '#bdbab3' }))
  add({ id: 'floor-trusses', componentId: 'c-floor-trusses', geo: 'box', mat: 'white', anim: 'drop', dropH: 1.2, inst: tr.map((t) => ({ ...t, c: t.c ?? '#dcbf8f' })) })
  add({ id: 'subfloor', componentId: 'c-floor-trusses', geo: 'box', mat: 'osb', anim: 'pop', window: [0.55, 1], inst: F2_RECTS.flatMap((r, i) => tile([X(r.x0), Z(r.d1), X(r.x1), Z(r.d0)], 2.4, 1.2, 0.01, F2_FLOOR - 0.02, F2_FLOOR).map((t) => ({ ...t, g: (t.g ?? 0) + i * 20 }))) })
}
add({ id: 'pallets-2', componentId: 'c-block-delivery', geo: 'box', mat: 'white', anim: 'pop', appearTask: T('Shell: Deliver Block & Lintel (2nd Floor)'), disappearTask: T('Shell: Block Wall Up (2nd Floor)'), inst: Array.from({ length: 6 }, (_, i) => box(X(56 + (i % 3) * 6), F2_FLOOR, Z(30 + Math.floor(i / 3) * 6), X(59.6 + (i % 3) * 6), F2_FLOOR + 0.9, Z(26.4 + Math.floor(i / 3) * 6), { g: i, c: '#a6a49e' })) })
add({ id: 'cmu-2', componentId: 'c-cmu-2', geo: 'box', mat: 'white', inst: masonry(WALLS_2), anim: 'sweep', overlap: 0.12 })
add({
  id: 'tiebeam-2',
  componentId: 'c-tiebeam-2',
  geo: 'box',
  mat: 'concrete',
  anim: 'sweep',
  inst: [...WALLS_2.map((w, i) => wallBox(w, 0, wallLen(w), F2_BLOCK_TOP - F2_FLOOR, F2_TOP - F2_FLOOR, -w.t, 0, { g: i })), ...WALLS_2.flatMap((w, i) => w.openings.map((o) => wallBox(w, o.u0 - 0.2, o.u1 + 0.2, o.v1, Math.min(o.v1 + 0.2, F2_BLOCK_TOP - F2_FLOOR), -w.t, 0, { g: i })))],
})
add({ id: 'framing-2', componentId: 'c-framing-2', geo: 'box', mat: 'lumber', inst: framing(PART_2), anim: 'rise', overlap: 0.3 })
{
  // Stair: straight run in the foyer (x 36–46, d 12–26)
  const st: Inst[] = []
  const n = 18
  for (let i = 0; i < n; i++) {
    const y = FFE + ((i + 1) * (F2_FLOOR - FFE)) / n
    st.push(box(X(37), y - 0.04, Z(12 + i * 0.75 + 0.75), X(41), y, Z(12 + i * 0.75), { g: i }))
  }
  st.push(seg([X(37), FFE, Z(12)], [X(37), F2_FLOOR, Z(26)], 0.05, { g: 0 }), seg([X(41), FFE, Z(12)], [X(41), F2_FLOOR, Z(26)], 0.05, { g: 0 }))
  add({ id: 'stairs', componentId: 'c-stairs', geo: 'box', mat: 'lumber', inst: st.filter((s) => !s.q), anim: 'pop' })
}

// Roofs
const MAIN: HipRect[] = MAIN_ROOFS.map((r) => ({ x0: X(r.x0), x1: X(r.x1), z0: Z(r.d1), z1: Z(r.d0), y: F2_TOP, pitch: 0.5, overhang: 0.6 }))
const GAR: HipRect = { x0: X(GARAGE_RECT.x0), x1: X(GARAGE_RECT.x1), z0: Z(GARAGE_RECT.d1), z1: Z(GARAGE_RECT.d0), y: GAR_TOP, pitch: 0.34, overhang: 0.6 }
const BAY: HipRect = { x0: X(1.5), x1: X(10.5), z0: Z(7), z1: Z(4.6), y: FFE + 3.0, pitch: 0.34, overhang: 0.4 }
const ALL_HIPS = [...MAIN, GAR, BAY]
const gable = gableRoofGeometry(X(23), X(35), Z(10.5), Z(22), F2_TOP, 1.0, 0.4)
{
  const raf = ALL_HIPS.flatMap((r, i) => hipRafters({ ...r, y: r.y - 0.09 }, 0.6, i * 400))
  add({ id: 'roof-trusses', componentId: 'c-roof-trusses', geo: 'cyl', mat: 'lumber', inst: raf, anim: 'rise', overlap: 0.08, castShadow: false })
  const deck = mergeGeometries([...ALL_HIPS.map((r) => hipRoofGeometry(r, 1.2, 0)), gable.roof])
  add({ id: 'roof-deck', componentId: 'c-dry-in', geo: 'box', custom: deck, mat: 'roofDeck', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', window: [0, 0.45] })
  const under = mergeGeometries([...ALL_HIPS.map((r) => hipRoofGeometry(r, 1.2, 0.012)), gableRoofGeometry(X(23), X(35), Z(10.5), Z(22), F2_TOP + 0.012, 1.0, 0.4).roof])
  add({ id: 'roof-underlay', componentId: 'c-dry-in', geo: 'box', custom: under, mat: 'underlay', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', window: [0.5, 1] })
  const metal = mergeGeometries([...ALL_HIPS.map((r) => hipRoofGeometry(r, 0.45, 0.03)), gableRoofGeometry(X(23), X(35), Z(10.5), Z(22), F2_TOP + 0.03, 1.0, 0.4).roof])
  add({ id: 'roof-metal', componentId: 'c-roofing', geo: 'box', custom: metal, mat: 'roofMetal', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade' })
  add({ id: 'gable-end', componentId: 'c-siding', geo: 'box', custom: gable.end, mat: 'siding', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', colorTo: { task: T('Paint: Exterior'), color: '#f6f5f0' } })
}
// Soffit + fascia (clip edges that run inside another roof)
{
  const fas: Inst[] = []
  const sof: Inst[] = []
  const covered = (x: number, z: number, self: HipRect) => MAIN.some((o) => o !== self && x > o.x0 - 0.05 && x < o.x1 + 0.05 && z > o.z0 - 0.05 && z < o.z1 + 0.05)
  ALL_HIPS.forEach((r, ri) => {
    const o = r.overhang
    const ye = r.y - o * r.pitch
    const edges: [V3, V3][] = [
      [[r.x0 - o, ye, r.z1 + o], [r.x1 + o, ye, r.z1 + o]],
      [[r.x0 - o, ye, r.z0 - o], [r.x1 + o, ye, r.z0 - o]],
      [[r.x0 - o, ye, r.z0 - o], [r.x0 - o, ye, r.z1 + o]],
      [[r.x1 + o, ye, r.z0 - o], [r.x1 + o, ye, r.z1 + o]],
    ]
    for (const [a, b] of edges) {
      const steps = 24
      for (let k = 0; k < steps; k++) {
        const t0 = k / steps
        const t1 = (k + 1) / steps
        const pa: V3 = [a[0] + (b[0] - a[0]) * t0, ye, a[2] + (b[2] - a[2]) * t0]
        const pb: V3 = [a[0] + (b[0] - a[0]) * t1, ye, a[2] + (b[2] - a[2]) * t1]
        const mid = [(pa[0] + pb[0]) / 2, (pa[2] + pb[2]) / 2]
        if (ri < MAIN.length && covered(mid[0], mid[1], r)) continue
        fas.push(box(Math.min(pa[0], pb[0]) - 0.03, ye - 0.22, Math.min(pa[2], pb[2]) - 0.03, Math.max(pa[0], pb[0]) + 0.03, ye + 0.02, Math.max(pa[2], pb[2]) + 0.03, { g: ri }))
      }
    }
    for (const sr of rectMinus([r.x0 - o, r.z0 - o, r.x1 + o, r.z1 + o], [[r.x0, r.z0, r.x1, r.z1]])) sof.push(box(sr[0], ye - 0.2, sr[1], sr[2], ye - 0.18, sr[3], { g: ri }))
  })
  add({ id: 'fascia', componentId: 'c-soffit', geo: 'box', mat: 'fascia', inst: fas, anim: 'sweep', castShadow: false })
  add({ id: 'soffit', componentId: 'c-soffit', geo: 'box', mat: 'soffit', inst: sof, anim: 'pop', castShadow: false })
  add({ id: 'gutters', componentId: 'c-gutters', geo: 'box', mat: 'fascia', inst: fas.filter((_, i) => i % 1 === 0).map((f) => ({ ...f, p: [f.p[0], f.p[1] - 0.05, f.p[2]] as V3, s: [f.s[0] + 0.12, 0.12, f.s[2] + 0.12] as V3 })), anim: 'sweep', castShadow: false })
}
// Temporary fall protection, then the finished balcony railings
{
  const rails = (y: number, r: R, sides: string): Inst[] => {
    const out: Inst[] = []
    const yb = y + 1.0
    if (sides.includes('f')) out.push(box(X(r.x0), yb - 0.04, Z(r.d0) - 0.03, X(r.x1), yb, Z(r.d0) + 0.03))
    if (sides.includes('l')) out.push(box(X(r.x0) - 0.03, yb - 0.04, Z(r.d1), X(r.x0) + 0.03, yb, Z(r.d0)))
    if (sides.includes('r')) out.push(box(X(r.x1) - 0.03, yb - 0.04, Z(r.d1), X(r.x1) + 0.03, yb, Z(r.d0)))
    if (sides.includes('b')) out.push(box(X(r.x0), yb - 0.04, Z(r.d1) - 0.03, X(r.x1), yb, Z(r.d1) + 0.03))
    for (let x = r.x0; x <= r.x1 + 0.01; x += 3) if (sides.includes('f')) out.push(box(X(x) - 0.03, y, Z(r.d0) - 0.03, X(x) + 0.03, yb, Z(r.d0) + 0.03))
    for (let x = r.x0; x <= r.x1 + 0.01; x += 3) if (sides.includes('b')) out.push(box(X(x) - 0.03, y, Z(r.d1) - 0.03, X(x) + 0.03, yb, Z(r.d1) + 0.03))
    return out
  }
  const FRONT_BAL: R = { x0: 24, d0: 10.5, x1: 34, d1: 15.5 }
  const REAR_BAL: R = { x0: 37, d0: 52, x1: 45, d1: 64 }
  add({ id: 'balcony-slabs', componentId: 'c-floor-trusses', geo: 'box', mat: 'concrete', anim: 'drop', dropH: 1, inst: [rect(FRONT_BAL, F2_FLOOR - 0.3, F2_FLOOR, { g: 0 }), ...[24.3, 33.7].map((x) => box(X(x) - 0.18, FFE, Z(10.7) - 0.18, X(x) + 0.18, F2_FLOOR - 0.3, Z(10.7) + 0.18, { g: 1 }))] })
  add({ id: 'safety-rails', componentId: 'c-safety-rail', geo: 'box', mat: 'white', inst: [...rails(F2_FLOOR, FRONT_BAL, 'flr'), ...rails(F2_FLOOR, REAR_BAL, 'blr')].map((x) => ({ ...x, c: '#d4a017' })), anim: 'pop', disappearTask: T('Exterior Railings & Awnings'), castShadow: false })
  add({ id: 'railings', componentId: 'c-railings', geo: 'box', mat: 'frame', inst: [...rails(F2_FLOOR, FRONT_BAL, 'flr'), ...rails(F2_FLOOR, REAR_BAL, 'blr')], anim: 'pop', castShadow: false })
  // Lanai screen enclosure
  const scr: Inst[] = []
  for (const [a, b] of [[[37, 64], [59, 64]], [[37, 50], [37, 64]]] as [Pt, Pt][]) {
    scr.push(box(Math.min(X(a[0]), X(b[0])) - 0.02, FFE, Math.min(Z(a[1]), Z(b[1])) - 0.02, Math.max(X(a[0]), X(b[0])) + 0.02, F2_FLOOR - 0.3, Math.max(Z(a[1]), Z(b[1])) + 0.02, { g: 0 }))
  }
  add({ id: 'lanai-screen', componentId: 'c-railings', geo: 'box', mat: 'screen', inst: scr, anim: 'fade', castShadow: false })
}

// ===========================================================================
// ENVELOPE — windows, doors, stucco, siding
// ===========================================================================
{
  const frames: Inst[] = []
  const glass: Inst[] = []
  const entry: Inst[] = []
  const garage: Inst[] = []
  let g = 0
  for (const w of [...WALLS_1, ...WALLS_2, ...WALLS_G]) {
    const base = -0.1
    for (const op of w.openings) {
      const f = 0.06
      const d0 = base - 0.05
      const d1 = base + 0.05
      if (op.kind === 'garage') {
        for (let i = 0; i < 8; i++) {
          const v0 = op.v0 + ((op.v1 - op.v0) * i) / 8
          garage.push(wallBox(w, op.u0, op.u1, v0, v0 + (op.v1 - op.v0) / 8 - 0.015, base - 0.02, base + 0.03, { g: i }))
        }
        continue
      }
      if (op.kind === 'entry') {
        entry.push(wallBox(w, op.u0, op.u1, op.v0, op.v1, base - 0.03, base + 0.03, { g: 0, c: '#1b1d20' }))
        glass.push(wallBox(w, op.u0 + 0.12, op.u1 - 0.12, op.v0 + 0.1, op.v1 - 0.12, base + 0.03, base + 0.05, { g: 99 }))
        continue
      }
      frames.push(wallBox(w, op.u0, op.u1, op.v0, op.v0 + f, d0, d1, { g }))
      frames.push(wallBox(w, op.u0, op.u1, op.v1 - f, op.v1, d0, d1, { g }))
      frames.push(wallBox(w, op.u0, op.u0 + f, op.v0, op.v1, d0, d1, { g }))
      frames.push(wallBox(w, op.u1 - f, op.u1, op.v0, op.v1, d0, d1, { g }))
      const width = op.u1 - op.u0
      const panes = Math.max(1, Math.round(width / (op.kind === 'slider' ? 1.2 : 0.95)))
      for (let i = 1; i < panes; i++) {
        const u = op.u0 + (width * i) / panes
        frames.push(wallBox(w, u - 0.025, u + 0.025, op.v0, op.v1, d0, d1, { g }))
      }
      if (op.kind === 'window' && op.v1 - op.v0 > 1.6) frames.push(wallBox(w, op.u0, op.u1, op.v1 - 0.45, op.v1 - 0.4, d0, d1, { g }))
      glass.push(wallBox(w, op.u0 + f, op.u1 - f, op.v0 + f, op.v1 - f, base - 0.01, base + 0.01, { g }))
      g++
    }
  }
  add({ id: 'window-frames', componentId: 'c-windows', geo: 'box', mat: 'frame', inst: frames, anim: 'drop', dropH: 0.5 })
  add({ id: 'glazing', componentId: 'c-windows', geo: 'box', mat: 'glass', inst: glass, anim: 'fade', window: [0.1, 1], castShadow: false })
  add({ id: 'entry-door', componentId: 'c-entry-door', geo: 'box', mat: 'white', inst: entry, anim: 'pop', window: [0.5, 1] })
  add({ id: 'garage-doors', componentId: 'c-garage-doors', geo: 'box', mat: 'frame', inst: garage, anim: 'rise' })
}
const skinH = (w: Wall) => w.h + (w.floor === 2 ? F2_TOP - F2_BLOCK_TOP : w.y0 === GAR_SLAB ? GAR_TOP - GAR_BLOCK_TOP : F2_FLOOR - F1_BLOCK_TOP)
add({ id: 'lath', componentId: 'c-lath', geo: 'box', mat: 'wrap', anim: 'pop', castShadow: false, inst: [...skin(STUCCO, 0.004, 0.014, { h: skinH }), ...skin(STEM, 0.004, 0.014).map((x) => ({ ...x, g: (x.g ?? 0) + 40 }))] })
add({ id: 'stucco', componentId: 'c-stucco', geo: 'box', mat: 'stuccoRaw', anim: 'rise', colorTo: { task: T('Paint: Exterior'), color: '#f4f3ee' }, inst: [...skin(STUCCO, 0.014, 0.035, { h: skinH }), ...skin(STEM, 0.014, 0.035).map((x) => ({ ...x, g: (x.g ?? 0) + 40 }))] })
add({ id: 'siding', componentId: 'c-siding', geo: 'box', mat: 'sidingPrimed', anim: 'rise', colorTo: { task: T('Paint: Exterior'), color: '#f6f5f0' }, inst: skin(SIDING, 0.02, 0.045, { h: skinH }) })
// White trim bands (1x16 stucco banding / Hardie trim at floor lines)
add({
  id: 'trim-bands',
  componentId: 'c-siding',
  geo: 'box',
  mat: 'trimWhite',
  anim: 'sweep',
  castShadow: false,
  inst: [...EXT.filter((w) => w.y0 !== GAR_SLAB).map((w, i) => wallBox(w, -0.05, wallLen(w) + 0.05, (w.floor === 2 ? -0.35 : -0.05), (w.floor === 2 ? 0.0 : 0.15), 0.045, 0.07, { g: i }))],
})

// ===========================================================================
// MEP rough-in
// ===========================================================================
const Y1 = (F1_TOP + F2_FLOOR) / 2
const YA = F2_TOP + 0.3
{
  const r = 0.03
  const sup: Inst[] = []
  const runs: V3[][] = [
    [[X(66), FFE + 0.3, Z(42)], [X(66), Y1, Z(42)], [X(8), Y1, Z(42)], [X(8), Y1, Z(14)], [X(8), FFE + 1.0, Z(14)]],
    [[X(51), Y1, Z(42)], [X(51), Y1, Z(35)], [X(51), FFE + 1, Z(35)]],
    [[X(27), Y1, Z(42)], [X(27), F2_FLOOR + 1, Z(35)]],
    [[X(8), Y1, Z(20)], [X(8), F2_FLOOR + 1, Z(20)]],
    [[X(66), Y1, Z(42)], [X(66), F2_FLOOR + 1, Z(30)]],
    [[X(66), Y1, Z(42)], [X(66), F2_FLOOR + 1, Z(55)]],
  ]
  runs.forEach((pts, i) => {
    sup.push(...polyline(pts, r, { g: i, c: '#3f86d6' }))
    sup.push(...polyline(pts.map(([x, y, z]) => [x + 0.08, y, z + 0.08] as V3), r, { g: i, c: '#d65a4a' }))
  })
  sup.push(seg([X(64), FFE, Z(44)], [X(64), FFE + 1.8, Z(44)], 0.28, { g: 0, c: '#c9cdd2' }), seg([X(70), FFE, Z(44)], [X(70), FFE + 1.8, Z(44)], 0.28, { g: 1, c: '#c9cdd2' }))
  const dwv = [[8, 14], [51, 35], [27, 35], [8, 20], [66, 30], [66, 55]].map(([x, d], i) => seg([X(x), FFE + 0.5, Z(d)], [X(x), F2_TOP + 1.2, Z(d)], 0.05, { g: 10 + i, c: '#f4f3ef' }))
  add({ id: 'plumbing', componentId: 'c-plumbing', geo: 'cyl', mat: 'white', inst: [...sup, ...dwv], anim: 'rise', castShadow: false })
  const gas = polyline([[X(-2), 0.3, Z(10)], [X(-2), 0.3, Z(36)], [X(51), Y1 - 0.1, Z(36)], [X(51), FFE + 0.9, Z(34)]], 0.025, { g: 0 })
  gas.push(...polyline([[X(40), Y1 - 0.1, Z(36)], [X(40), Y1 - 0.1, Z(58)], [X(48), FFE + 0.9, Z(60)]], 0.025, { g: 1 }))
  add({ id: 'gas', componentId: 'c-gas', geo: 'cyl', mat: 'white', inst: gas.map((x) => ({ ...x, c: '#e4c33a' })), anim: 'rise', castShadow: false })
}
{
  const duct = (pts: V3[], w = 0.45, h = 0.22) =>
    pts.slice(1).map((b, i) => {
      const a = pts[i]
      return box(Math.min(a[0], b[0]) - w / 2, Math.min(a[1], b[1]) - h / 2, Math.min(a[2], b[2]) - w / 2, Math.max(a[0], b[0]) + w / 2, Math.max(a[1], b[1]) + h / 2, Math.max(a[2], b[2]) + w / 2, { g: i })
    })
  const trunks = [
    ...duct([[X(66), FFE + 2, Z(42)], [X(66), Y1, Z(42)], [X(4), Y1, Z(42)]]),
    ...duct([[X(30), Y1, Z(42)], [X(30), Y1, Z(14)]]),
    ...duct([[X(50), YA, Z(20)], [X(4), YA, Z(30)]].map((p) => p) as V3[]),
    ...duct([[X(50), YA, Z(20)], [X(72), YA, Z(20)], [X(72), YA, Z(66)]]),
  ]
  const flex: Inst[] = []
  for (const [x, d] of [[6, 20], [12, 46], [24, 46], [40, 46], [52, 30], [56, 46], [68, 60], [24, 18]] as const) flex.push(seg([X(x), Y1, Z(42)], [X(x), Y1 - 0.05, Z(d)], 0.09, { g: 5 }))
  for (const [x, d] of [[8, 50], [8, 20], [28, 40], [40, 20], [66, 30], [66, 60], [52, 58]] as const) flex.push(seg([X(x), YA, Z(30)], [X(x), YA - 0.05, Z(d)], 0.08, { g: 6 }))
  add({ id: 'hvac-trunks', componentId: 'c-hvac', geo: 'box', mat: 'duct', inst: [...trunks, box(X(64.5), FFE, Z(43), X(67.5), FFE + 2.0, Z(41), { g: 0 }), box(X(48), F2_FLOOR, Z(22), X(52), F2_FLOOR + 1.9, Z(18), { g: 0 })], anim: 'sweep', castShadow: false })
  add({ id: 'hvac-flex', componentId: 'c-hvac', geo: 'cyl', mat: 'ductFlex', inst: flex, anim: 'rise', castShadow: false })
  add({ id: 'condensers', componentId: 'c-hvac-equip', geo: 'box', mat: 'equipment', anim: 'drop', dropH: 1.2, inst: [rect({ x0: 76, d0: 30, x1: 81, d1: 46 }, 0, FFE, { g: 0, c: '#bdbab3' }), rect({ x0: 76.8, d0: 32, x1: 79.8, d1: 35 }, FFE, FFE + 0.95, { g: 1 }), rect({ x0: 76.8, d0: 38, x1: 79.8, d1: 41 }, FFE, FFE + 0.95, { g: 2 })] })
}
{
  const el: Inst[] = []
  ;[...WALLS_1, ...WALLS_2].forEach((w, wi) => {
    const wo = -w.t - 0.015
    for (const [u0, u1] of freeSpans(w, 0.3, 0.42)) {
      if (u1 - u0 < 0.4) continue
      el.push(seg(wallPoint(w, u0 + 0.1, 0.36, wo), wallPoint(w, u1 - 0.1, 0.36, wo), 0.022, { g: wi }))
      for (let u = u0 + 0.6; u < u1 - 0.3; u += 2.4) {
        const p = wallPoint(w, u, 0.36, wo)
        el.push(box(p[0] - 0.05, p[1] - 0.06, p[2] - 0.05, p[0] + 0.05, p[1] + 0.06, p[2] + 0.05, { g: wi }))
      }
    }
    const mid = wallPoint(w, wallLen(w) / 2, w.h - 0.05, wo)
    el.push(seg(mid, [mid[0], mid[1] + 0.2, mid[2]], 0.022, { g: wi }))
  })
  el.push(box(X(52.3), GAR_SLAB + 1.0, Z(16), X(52.5), GAR_SLAB + 2.0, Z(14), { g: 0 }))
  add({ id: 'electrical-runs', componentId: 'c-electrical', geo: 'cyl', mat: 'wire', inst: el.filter((x) => x.q), anim: 'rise', castShadow: false })
  add({ id: 'electrical-boxes', componentId: 'c-electrical', geo: 'box', mat: 'wire', inst: el.filter((x) => !x.q), anim: 'pop', castShadow: false })
  const lv = polyline([[X(52.5), GAR_SLAB + 1.5, Z(10)], [X(52.5), Y1, Z(10)], [X(30), Y1, Z(30)], [X(30), Y1, Z(46)]], 0.022, { g: 0 })
  lv.push(...polyline([[X(30), Y1, Z(30)], [X(30), YA, Z(30)], [X(66), YA, Z(30)]], 0.022, { g: 1 }))
  add({ id: 'low-voltage', componentId: 'c-lowvoltage', geo: 'cyl', mat: 'lv', inst: lv, anim: 'rise', castShadow: false })
}

// ===========================================================================
// INTERIOR
// ===========================================================================
add({ id: 'insulation', componentId: 'c-insulation', geo: 'box', mat: 'insulation', anim: 'pop', castShadow: false, inst: [...skin(EXT.filter((w) => w.y0 !== GAR_SLAB), -0.225, -0.2), ...MAIN.map((r, i) => box(r.x0, F2_TOP + 0.05, r.z0, r.x1, F2_TOP + 0.2, r.z1, { g: 50 + i }))] })
{
  const dw: Inst[] = []
  ;[...WALLS_1, ...WALLS_2].forEach((w, i) => skin([w], -0.24, -0.225).forEach((x) => dw.push({ ...x, g: i })))
  ;[...PART_1, ...PART_2].forEach((w, i) => {
    skin([w], -w.t - 0.013, -w.t).forEach((x) => dw.push({ ...x, g: 40 + i }))
    skin([w], 0, 0.013).forEach((x) => dw.push({ ...x, g: 40 + i }))
  })
  F1_RECTS.forEach((r, i) => dw.push(rect(r, F1_TOP - 0.02, F1_TOP - 0.005, { g: 70 + i })))
  F2_RECTS.forEach((r, i) => dw.push(rect(r, F2_TOP - 0.02, F2_TOP - 0.005, { g: 75 + i })))
  add({ id: 'drywall', componentId: 'c-drywall', geo: 'box', mat: 'drywall', inst: dw, anim: 'pop', overlap: 0.08, colorTo: { task: T('Paint: Interior'), color: '#e1e1dc' } })
}
add({ id: 'lvp', componentId: 'c-flooring', geo: 'box', mat: 'lvp', anim: 'pop', castShadow: false, inst: [...F1_RECTS, ...F2_RECTS].flatMap((r, i) => tile([X(r.x0), Z(r.d1), X(r.x1), Z(r.d0)], 1.8, 0.22, 0.003, (i < 4 ? FFE : F2_FLOOR) + 0.001, (i < 4 ? FFE : F2_FLOOR) + 0.013, false).map((t) => ({ ...t, g: (t.g ?? 0) + i * 60 }))) })
add({ id: 'tile', componentId: 'c-tile', geo: 'box', mat: 'tile', anim: 'pop', castShadow: false, inst: [...tile(sceneRect(LANAI), 0.6, 0.6, 0.006, FFE + 0.002, FFE + 0.016).map((t) => ({ ...t, c: '#8e9093' })), ...tile(sceneRect({ x0: 1, d0: 8, x1: 17, d1: 22 }), 0.6, 0.6, 0.004, FFE + 0.002, FFE + 0.016)] })
add({
  id: 'cabinets',
  componentId: 'c-cabinets',
  geo: 'box',
  mat: 'ashCabinet',
  anim: 'drop',
  dropH: 0.5,
  inst: [rect({ x0: 47, d0: 33, x1: 55, d1: 37 }, FFE, FFE + 0.9, { g: 0 }), rect({ x0: 57.8, d0: 28, x1: 59.8, d1: 45 }, FFE, FFE + 0.9, { g: 1 }), rect({ x0: 57.8, d0: 45, x1: 59.8, d1: 49 }, FFE, FFE + 2.4, { g: 2 }), rect({ x0: 1, d0: 9, x1: 3, d1: 16 }, FFE, FFE + 0.85, { g: 3 }), rect({ x0: 46, d0: 60.5, x1: 58, d1: 62.5 }, F2_FLOOR, F2_FLOOR + 0.9, { g: 4 })],
})
add({
  id: 'counters',
  componentId: 'c-counters',
  geo: 'box',
  mat: 'quartz',
  anim: 'drop',
  dropH: 0.3,
  inst: [rect({ x0: 46.8, d0: 32.8, x1: 55.2, d1: 37.2 }, FFE + 0.9, FFE + 0.94, { g: 0 }), rect({ x0: 57.6, d0: 28, x1: 59.8, d1: 45 }, FFE + 0.9, FFE + 0.94, { g: 1 }), rect({ x0: 0.9, d0: 8.9, x1: 3.1, d1: 16.1 }, FFE + 0.85, FFE + 0.89, { g: 2 })],
})
add({ id: 'summer-kitchen', componentId: 'c-summer-kitchen', geo: 'box', mat: 'white', anim: 'rise', inst: [rect({ x0: 52, d0: 61, x1: 58.5, d1: 63.5 }, FFE, FFE + 0.92, { g: 0, c: '#9a8f82' }), rect({ x0: 51.8, d0: 60.8, x1: 58.7, d1: 63.7 }, FFE + 0.92, FFE + 0.96, { g: 1, c: '#f2f0eb' })] })
add({
  id: 'fixtures',
  componentId: 'c-fixtures',
  geo: 'box',
  mat: 'ceramic',
  anim: 'grow',
  inst: [
    { ...rect({ x0: 6, d0: 16, x1: 11.5, d1: 19 }, FFE, FFE + 0.55), g: 0, a: [X(8.7), FFE, Z(17.5)] },
    { ...rect({ x0: 50, d0: 34.5, x1: 52, d1: 35.5 }, FFE + 0.94, FFE + 0.98), g: 1, a: [X(51), FFE + 0.94, Z(35)], c: '#1d1f22' },
  ],
})
add({
  id: 'interior-lights',
  componentId: 'c-lighting',
  geo: 'cyl',
  mat: 'bulb',
  anim: 'pop',
  castShadow: false,
  glow: { task: T('Photos'), color: '#ffcf8a', intensity: 6 },
  inst: [
    ...[[48.5, 35], [51, 35], [53.5, 35]].map(([x, d]) => seg([X(x), F1_TOP - 1.0, Z(d)], [X(x), F1_TOP - 0.6, Z(d)], 0.14, { g: 0 })),
    ...[[8, 20], [8, 40], [26, 20], [26, 40], [40, 40], [52, 45], [66, 30], [66, 60], [30, 15]].map(([x, d]) => seg([X(x), F1_TOP - 0.035, Z(d)], [X(x), F1_TOP - 0.02, Z(d)], 0.07, { g: 1 })),
    ...[[8, 20], [8, 45], [26, 40], [40, 20], [66, 30], [66, 60], [52, 58]].map(([x, d]) => seg([X(x), F2_TOP - 0.035, Z(d)], [X(x), F2_TOP - 0.02, Z(d)], 0.07, { g: 2 })),
    ...[[42, 56], [50, 56], [42, 62], [50, 62]].map(([x, d]) => seg([X(x), F2_FLOOR - 0.33, Z(d)], [X(x), F2_FLOOR - 0.31, Z(d)], 0.07, { g: 3 })),
  ],
})
add({
  id: 'staging',
  componentId: 'c-staging',
  geo: 'box',
  mat: 'fabric',
  anim: 'grow',
  inst: [
    { ...rect({ x0: 22, d0: 38, x1: 32, d1: 41 }, FFE, FFE + 0.42), g: 0, a: [X(27), FFE, Z(39.5)] },
    { ...rect({ x0: 24, d0: 33, x1: 30, d1: 36 }, FFE, FFE + 0.38), g: 0, a: [X(27), FFE, Z(34.5)], c: '#8a6a4f' },
    { ...rect({ x0: 38, d0: 34, x1: 44, d1: 40 }, FFE, FFE + 0.76), g: 1, a: [X(41), FFE, Z(37)], c: '#6b4e37' },
    { ...rect({ x0: 40, d0: 55, x1: 48, d1: 59 }, FFE, FFE + 0.4), g: 2, a: [X(44), FFE, Z(57)] },
    { ...rect({ x0: 6, d0: 72, x1: 9, d1: 75 }, 0.06, 0.4), g: 3, a: [X(7.5), 0.06, Z(73.5)] },
  ],
})

// ===========================================================================
// SITE & POOL (finishes)
// ===========================================================================
{
  const [x0, z0, x1, z1] = sceneRect(POOL)
  const d = -1.6
  const t = 0.2
  add({ id: 'pool-pit', componentId: 'c-pool-dig', geo: 'box', mat: 'trench', anim: 'pop', castShadow: false, disappearTask: T('Gunite/Shotcrete Application'), disappearFade: true, inst: [box(x0 - 0.2, d - 0.2, z0 - 0.2, x1 + 0.2, d, z1 + 0.2), box(x0 - 0.2, d, z0 - 0.2, x0, 0, z1 + 0.2), box(x1, d, z0 - 0.2, x1 + 0.2, 0, z1 + 0.2), box(x0, d, z0 - 0.2, x1, 0, z0), box(x0, d, z1, x1, 0, z1 + 0.2)] })
  add({ id: 'pool-shell', componentId: 'c-pool', geo: 'box', mat: 'poolShell', anim: 'pop', colorTo: { task: T('Plaster Application'), color: '#9fc6d9' }, castShadow: false, inst: [box(x0, d, z0, x1, d + t, z1, { g: 0 }), box(x0, d, z0, x0 + t, 0, z1, { g: 1 }), box(x1 - t, d, z0, x1, 0, z1, { g: 1 }), box(x0, d, z0, x1, 0, z0 + t, { g: 1 }), box(x0, d, z1 - t, x1, 0, z1, { g: 1 })] })
  add({ id: 'pool-water', componentId: 'c-pool-finish', geo: 'box', mat: 'poolWater', appearTask: T('Pool Filling'), anim: 'rise', castShadow: false, glow: { task: T('Photos'), color: '#4fb6e0', intensity: 0.6 }, inst: [box(x0 + t, d + t, z0 + t, x1 - t, -0.12, z1 - t)] })
  const deckRects = rectMinus(sceneRect({ x0: -2, d0: 58, x1: 37, d1: 84 }), [[x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35]])
  add({ id: 'pool-deck', componentId: 'c-pool-deck', geo: 'box', mat: 'poolDeck', anim: 'pop', castShadow: false, inst: [...deckRects.flatMap((r) => tile(r, 0.6, 0.6, 0.008, 0, 0.05)), ...rectMinus([x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35], [[x0, z0, x1, z1]]).map((r) => box(r[0], 0, r[1], r[2], 0.07, r[3], { g: 999 }))] })
}
add({
  id: 'drive',
  componentId: 'c-drive',
  geo: 'box',
  mat: 'paverGray',
  anim: 'pop',
  castShadow: false,
  inst: [...tile(sceneRect(DRIVE), 0.6, 0.3, 0.006, 0, 0.06, false), ...tile(sceneRect({ x0: 18.5, d0: -3, x1: 52, d1: 1.5 }), 0.6, 0.3, 0.006, 0, 0.06, false).map((t) => ({ ...t, g: (t.g ?? 0) + 200 }))],
})
add({ id: 'apron', componentId: 'c-apron', geo: 'box', mat: 'concrete', anim: 'sweep', castShadow: false, inst: [rect({ x0: 50, d0: -32, x1: 84.7, d1: -25 }, 0, 0.05, { g: 0 }), rect({ x0: LOT.x0 - 20, d0: -30, x1: LOT.x1 + 20, d1: -26 }, 0.0, 0.07, { g: 1 })] })
{
  const holes: [number, number, number, number][] = [sceneRect({ x0: -2, d0: 58, x1: 37, d1: 84 }), sceneRect({ x0: DRIVE.x0 - 0.2, d0: DRIVE.d0, x1: DRIVE.x1 + 0.2, d1: 1 }), sceneRect({ x0: 0, d0: -3.2, x1: 83, d1: 70 })]
  const sod: Inst[] = []
  let g = 0
  for (let d = LOT.d0; d < LOT.d1; d += 4) {
    for (const r of rectMinus(sceneRect({ x0: LOT.x0, d0: d, x1: LOT.x1, d1: Math.min(d + 3.9, LOT.d1) }), holes)) sod.push(box(r[0], 0, r[1], r[2], 0.03, r[3], { g }))
    g++
  }
  sod.push(rect(POND, 0.0, 0.035, { g: 0, c: '#5e7a40' }))
  const palms: Inst[] = []
  const fronds: Inst[] = []
  const spots: [number, number, number][] = [[-8, 92, 7.5], [4, 94, 8.2], [16, 92, 7.0], [70, 92, 7.6], [84, 90, 6.8], [40, -6, 6.2], [-4, 40, 7.4]]
  spots.forEach(([x, d, h], i) => {
    const a: V3 = [X(x), 0, Z(d)]
    palms.push({ ...seg([X(x), 0, Z(d)], [X(x) + 0.15, h, Z(d) + 0.1], 0.17), g: i, a })
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2 + i * 0.7
      const L = 2.9 + (k % 2) * 0.4
      const tilt = k % 4 === 0 ? 0.25 : -0.28 - (k % 3) * 0.16
      fronds.push({ p: [X(x) + 0.15 + Math.cos(ang) * L * 0.45, h + Math.sin(tilt) * L * 0.45 + 0.15, Z(d) + 0.1 + Math.sin(ang) * L * 0.45], s: [L, 0.04, 0.62], q: euler(0, -ang, tilt), g: i, a })
    }
  })
  const hedges: Inst[] = [rect({ x0: 0.4, d0: 4, x1: 18.5, d1: 6.5 }, 0, 0.9, { g: 0 }), rect({ x0: 34, d0: 1.5, x1: 50, d1: 4 }, 0, 0.9, { g: 1 }), rect({ x0: 75.5, d0: 24, x1: 76.5, d1: 66 }, 0, 1.6, { g: 2 })]
  add({ id: 'sod', componentId: 'c-landscape', geo: 'box', mat: 'sod', inst: sod, anim: 'sweep', castShadow: false })
  add({ id: 'palm-trunks', componentId: 'c-landscape', geo: 'cyl', mat: 'palmTrunk', inst: palms, anim: 'grow' })
  add({ id: 'palm-fronds', componentId: 'c-landscape', geo: 'box', mat: 'palmFrond', inst: fronds, anim: 'grow' })
  add({ id: 'hedges', componentId: 'c-landscape', geo: 'box', mat: 'hedge', inst: hedges, anim: 'rise' })
  const fence: Inst[] = []
  for (const [a, b] of [[[LOT.x0, 30], [LOT.x0, LOT.d1]], [[LOT.x0, LOT.d1], [LOT.x1, LOT.d1]], [[LOT.x1, LOT.d1], [LOT.x1, 30]]] as [Pt, Pt][]) {
    fence.push(box(Math.min(X(a[0]), X(b[0])) - 0.03, 0, Math.min(Z(a[1]), Z(b[1])) - 0.03, Math.max(X(a[0]), X(b[0])) + 0.03, 1.8, Math.max(Z(a[1]), Z(b[1])) + 0.03))
  }
  add({ id: 'fence', componentId: 'c-fence', geo: 'box', mat: 'trimWhite', inst: fence, anim: 'sweep' })
}

export const BRYANT_PARTS: PartSpec[] = parts
/** Task that reveals the finished, lit home (listing photos). */
export const BRYANT_REVEAL_TASK = T('Photos')
