/**
 * Procedural build-up of 2623 S Bryant Cir, driven by its real Buildertrend
 * schedule (task ids = slug of the BT schedule item, see
 * scripts/import-buildertrend.mjs). Same PartSpec contract as the demo house.
 *
 * All dimensions come from ./plan.ts (transcribed from sheets A-1, A-3, A-4,
 * A-5, A-6). This file only decides HOW each assembly is built and WHEN it
 * appears; change geometry in plan.ts, not here.
 *
 * Construction system (A-3 legend, A-5 notes, BT schedule): raised CMU stem
 * wall + slab, 8" CMU walls with poured tie beams and precast lintels on both
 * floors, floor trusses hung in the 2nd-level tie beam, wood roof trusses,
 * standing-seam metal roof, Hardie lap siding on the street face, stucco on
 * CMU elsewhere.
 */
import * as THREE from 'three'
import type { ComponentRecord } from '@/domain/types'
import { box, euler, polyline, rectMinus, seg, tile } from '../geom'
import type { Inst, PartSpec, V3 } from '../partTypes'
import { clipGeometry, gableRoofGeometry, hipRafters, hipRoofGeometry, mergeGeometries, shedRoofGeometry, type HipRect } from '../roofs'
import { framing, freeSpans, masonry, skin, wallBox, wallLen, wallPoint, type Opening, type Wall } from '../walls'
import {
  AC_PAD, BAL_TOP, BREEZEWAY, DRIVE, ENTRY_STAIR, F1_BLOCK_TOP, F1_CEIL, F1_OUTLINE, F1_RECTS, F1_TOP, F2_BLOCK_TOP, F2_FLOOR, F2_OUTLINE,
  F2_RECTS, F2_TOP, FFE, FRONT_BALCONY, FRONT_GABLE, FRONT_WALK, FT, GAR_BLOCK_TOP, GAR_SLAB, GAR_TOP, GARAGE_LINE, GARAGE_RECT, isGarageParty,
  LANAI, LANAI_FLOOR, LOT, LOT_POLY, OPENINGS, PARTITIONS_F1, PARTITIONS_F2, PLANTERS, POND, POOL, POOL_DECK, POOL_STAIRS, PORCH,
  PORCH_PIERS, REAR_BALCONY, ROOFS, SIDING_DEPTH, STAIR_TOP, WALK, X, Z, type PlanOpening, type Pt, type Rect,
} from './plan'

const rect = (r: Rect, y0: number, y1: number, extra: Partial<Inst> = {}) => box(X(r.x0), y0, Z(r.d1), X(r.x1), y1, Z(r.d0), extra)
const sceneRect = (r: Rect): [number, number, number, number] => [X(r.x0), Z(r.d1), X(r.x1), Z(r.d0)]
const P3 = (x: number, y: number, d: number): V3 => [X(x), y, Z(d)]
const T = (name: string) => 'bt-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const ft = (v: number) => v * FT

// ---------------------------------------------------------------------------
// Components ↔ Buildertrend schedule items
// ---------------------------------------------------------------------------
const C = (id: string, name: string, layer: string, task: string, location: string, specs?: Record<string, string>, system?: ComponentRecord['system']): ComponentRecord => ({
  id, name, layer, taskId: T(task), location, specs, system,
})
const SCHEMATIC = { Routing: 'Schematic — MEP drawings not in the supplied set; route is illustrative, fixtures/equipment from A-3/A-4' }
export const BRYANT_COMPONENTS: ComponentRecord[] = [
  C('c-existing-home', 'Existing Residence (demolished)', 'site.existing', 'Demolition Permit', 'Lot'),
  C('c-existing-trees', 'Removed Trees (permitted)', 'site.existing', 'Tree Removal Permit', 'Lot', { Removed: '32" laurel oak (hazard), two 12" ROW oaks' }),
  C('c-stakeout', 'Building Stake Out', 'site.temp', 'Survey: Building Stake Out', 'Lot', { Source: 'A-1 site plan · 25\' front / 7\' side / 20\' rear setbacks' }),
  C('c-temp', 'Temporary Facilities & Tree Protection', 'site.temp', 'Survey: Building Stake Out', 'Lot', { 'Tree protection': 'Grand oak barricades per arborist report' }),
  C('c-footings', 'Stem Wall Footings', 'foundation.footings', 'Shell: Stem Wall Base Concrete Pouring', 'Perimeter', { Type: 'Continuous footing (foundation plan not supplied)' }, 'structure'),
  C('c-trenches', 'Footing Excavation & Prep', 'site.excavation', 'Shell: Stem Wall Prep', 'Perimeter'),
  C('c-stemwall', 'CMU Stem Wall', 'foundation.footings', 'Shell: Stem Wall Block', 'Perimeter', { Height: '6\'-0" — FFE 11.5\' NAVD over 5.5\' grade (A-1, A-3)', Vents: '8×16 Smart Vent flow-thru vents (A-3)' }, 'structure'),
  C('c-backfill', 'Backfill & Compaction', 'site.terrain', 'Grading: Backfilling Stemwall', 'Inside stem wall', { Note: 'Compact back fill 5\'-0" from structure (A-1 site note 1)' }),
  C('c-ug-plumbing', 'Underground Plumbing', 'foundation.underground', 'Plumbing: Underground Plumbing', 'Under slab', SCHEMATIC, 'drain'),
  C('c-ug-electric', 'Underground Electrical', 'foundation.underground', 'Electric: Underground Electrical', 'Under slab', SCHEMATIC, 'electrical'),
  C('c-slab-prep', 'Vapor Barrier & Reinforcement', 'foundation.rebar', 'Shell: Foundation Prep', 'Slab', undefined, 'structure'),
  C('c-slab', 'Slabs & Entry Stair', 'foundation.slab', 'Shell: Slab Pouring', 'Whole house', { 'Main FFE': '11.5\' NAVD (project datum 0\'-0")', Garage: '5.6\' NAVD', 'Lanai / breezeway': '11.0\' NAVD (−0\'-6")' }, 'structure'),
  C('c-block-delivery', 'Block & Lintel Delivery', 'site.temp', 'Shell: Deliver Block & Lintel', 'Driveway'),
  C('c-cmu-1', 'First-Floor CMU Walls', 'structure.masonry', 'Shell: Block Wall Up', 'First floor', { Block: '8" CMU (A-3 legend)', Height: 'Tie beam top 13\'-4" (A-5)' }, 'structure'),
  C('c-tiebeam-1', 'First-Floor Tie Beam & Lintels', 'structure.masonry', 'Shell: Block & Lintel Pouring', 'First floor', { Beams: '8" conc. beams over porch & lanai openings (A-3)' }, 'structure'),
  C('c-framing-1', 'First-Floor Partitions', 'structure.floor1', 'Shell: Framing First Floor', 'First floor', { Bearing: '2x6 stud bearing walls (A-3)' }, 'structure'),
  C('c-floor-trusses', 'Second-Floor Trusses & Subfloor', 'structure.floor2', 'Shell: First Floor Trusses Installation', 'Between floors', { Note: 'Hung in tie beam @ 13\'-4"; layout illustrative (truss drawings not supplied)' }, 'structure'),
  C('c-cmu-2', 'Second-Floor CMU Walls', 'structure.masonry', 'Shell: Block Wall Up (2nd Floor)', 'Second floor', { Block: '8" CMU', Height: 'Tie beam top 23\'-4" (A-5)' }, 'structure'),
  C('c-tiebeam-2', 'Second-Floor Tie Beam', 'structure.masonry', 'Shell: Block & Lintel Pouring (2nd Floor)', 'Second floor', undefined, 'structure'),
  C('c-framing-2', 'Second-Floor Partitions', 'structure.floor2', 'Shell: Framing 2nd Floor', 'Second floor', undefined, 'structure'),
  C('c-roof-trusses', 'Roof Trusses', 'structure.roof', 'Shell: Roof Trusses Installation', 'Roof', { Pitch: '6:12 main · 3:12 garage & bay (A-5)', Source: 'Roof plan not supplied — fitted to elevations' }, 'structure'),
  C('c-stairs', 'Stair', 'structure.floor1', 'Shell: Stairs Installation', 'Stair tower', { Type: 'Wood-framed, 21 R @ 7.6" (A-3)' }, 'structure'),
  C('c-safety-rail', 'Fall-Protection Railings (temporary)', 'site.temp', 'Shell: Safety Railings', 'Openings & balconies'),
  C('c-dry-in', 'Roof Sheathing & Dry-In', 'structure.sheathing', 'Roofing: Roofing Dry-In', 'Roof', undefined, 'structure'),
  C('c-roofing', 'Roofing', 'envelope.roof', 'Roofing: Roofing Shingles Installation', 'Roof', { Visible: 'Black standing-seam metal (A-5/A-6)', 'Non-visible': 'Black shingles' }),
  C('c-windows', 'Windows & Sliders', 'envelope.windows', 'Windows: Windows/Sliders Installation', 'Exterior', { Brand: 'PGT', Frames: 'Black aluminum', Glass: 'Impact-resistant', Source: 'Tags on A-3/A-4 (no schedule sheet)' }),
  C('c-entry-door', 'Entry Doors', 'envelope.doors', 'Doors: Exterior Door Installation', 'Entry porch', { Door: '(2) 3080 w/ temp lites & side lites, transoms to 10\'-0"', Arch: '20\'H elliptical arch w/ 1x4 stucco face trim (A-5)' }),
  C('c-plumbing', 'Plumbing Rough-In', 'mep.plumbing-supply', 'Plumbing: Plumbing Rough', 'Throughout', { ...SCHEMATIC, 'Water heater': 'Tankless gas WH, right side (A-3)' }, 'plumbing'),
  C('c-hvac', 'HVAC Rough-In', 'mep.hvac-ducts', 'HVAC: HVAC Rough Installation', 'Ceilings & attic', { ...SCHEMATIC, 'Air handlers': '3 AH in 2nd-floor MECH (A-4)' }, 'hvac'),
  C('c-hvac-equip', 'AC Condensers', 'mep.hvac-equipment', 'Trim: HVAC Trim Installation', 'Right side yard', { Mounting: 'Raised conc. slab w/ 48" CMU screen walls (A-3)' }, 'hvac'),
  C('c-electrical', 'Electrical Rough-In', 'mep.electrical', 'Electric: Electrical Rough', 'Throughout', { ...SCHEMATIC, Service: '400 A panel in garage, meter outside above DFE (A-3)' }, 'electrical'),
  C('c-gas', 'Gas Rough-In', 'mep.plumbing-supply', 'Gas: Gas Rough In', 'Kitchen & outdoor kitchen', { ...SCHEMATIC, Tank: 'Buried LP tank, front-right (A-1, "verify location")' }, 'plumbing'),
  C('c-lowvoltage', 'Low Voltage Rough-In', 'mep.low-voltage', 'Electric: Low Voltage Rough-In', 'Throughout', SCHEMATIC, 'lowvoltage'),
  C('c-insulation', 'Insulation', 'interior.insulation', 'Insulation: Insulation installation', 'Walls & attic', { Block: 'Foil R-4.1', 'Attic over AC space': 'Open cell 3.5" R-20 (A-3 table)' }),
  C('c-drywall', 'Drywall', 'interior.drywall', 'Drywall: Drywall Hang', 'Throughout', { Walls: 'SW7647 Crushed Ice', Ceilings: 'SW7006 Extra White' }),
  C('c-lath', 'Stucco Lath', 'envelope.waterproofing', 'Stucco: Stucco Lath Installation', 'Rear, sides & base'),
  C('c-stucco', 'Stucco', 'envelope.cladding', 'Stucco: Stucco Application', 'Rear, sides & base', { Finish: 'Stucco on 8" CMU, 1x8 stucco banding (A-5/A-6)', Color: 'SW7006 Extra White' }),
  C('c-siding', 'Lap Siding & Trim', 'envelope.cladding', 'Siding: Siding Installation', 'Street face & front of sides', { Profile: 'Hardie lap, 2x4 & 1x12 trim @ bottom of siding (A-5)', Color: 'SW7006 Extra White' }),
  C('c-soffit', 'Soffit, Fascia & Brackets', 'envelope.roof', 'Trim: Soffit and Fascia Installation', 'Eaves', { Soffit: 'Continuous vented aluminum', Fascia: '2x8 w/ aluminum wrap, black', Brackets: '4x6 foam brackets @ 24" o.c. (A-5)' }),
  C('c-gutters', 'Gutters & Downspouts', 'envelope.roof', 'Gutters: Gutters Installation', 'Eaves', { Type: 'Aluminum, discharge to splash blocks (A-5 notes)' }),
  C('c-flooring', 'Flooring', 'interior.flooring', 'Flooring: Floor Installation', 'Throughout', { Type: 'MSI Daria Umber LVP' }),
  C('c-tile', 'Tile & Pavers', 'interior.flooring', 'Tile: Shower and Floor Tiles Installation', 'Baths, entry & lanai', { Baths: 'Andover White porcelain', 'Entry / lanai': 'Pavers on concrete slab (A-3)' }),
  C('c-cabinets', 'Cabinetry', 'interior.cabinetry', 'Cabinets: Cabinets Installation', 'Kitchen & baths', { Style: '5-piece shaker · Como Ash 2', Island: '5\'-0" × 8\'-6" × 36"H eat-in island (A-3)' }),
  C('c-counters', 'Countertops', 'interior.countertops', 'Countertops: Countertops Installation', 'Kitchen & baths', { Material: 'Premium quartz — Calacatta' }),
  C('c-interior-doors', 'Interior Doors', 'interior.fixtures', 'Doors: Interior & Closets Doors Installation', 'Throughout', { Doors: 'Pre-hung, white smooth' }),
  C('c-garage-doors', 'Garage Doors', 'envelope.doors', 'Doors: Garage Door Installation', 'Garage', { Style: 'Carriage, 16\'×9\' + 9\'×9\', match entry door color (A-3)' }),
  C('c-railings', 'Balcony & Exterior Railings', 'envelope.doors', 'Exterior Railings & Awnings', 'Balconies, porch & stairs', { Front: 'Chippendale panels (A-5)', Rear: 'Plexiglass infill panels (A-6)', Shutters: 'Bahama shutters, street face (A-5)' }),
  C('c-lanai-screen', 'Lanai Screens', 'envelope.doors', 'Exterior Railings & Awnings', 'Screened lanai', { Screens: 'Elec. roll-down screens in padded headers (A-3)' }),
  C('c-fixtures', 'Plumbing Fixtures', 'interior.fixtures', 'Plumbing: Plumbing Trim', 'Baths & kitchen', { Faucets: 'Delta, matte black', Layout: 'Fixture locations from A-3/A-4' }),
  C('c-lighting', 'Lighting', 'interior.lighting', 'Trim: Lighting Fixtures', 'Throughout', { Exterior: 'Coach lights at entry & garage (A-5)' }),
  C('c-pool', 'Pool & Deck (illustrative)', 'exterior.pool', 'Landscaping: Landscaping Installation', 'Rear yard', { Status: 'ILLUSTRATIVE — pool is "by others": not drawn on the supplied sheets and not in the Buildertrend schedule', Area: 'Non-caged pool, flush spa & deck 1,013 SF (A-1 table)' }),
  C('c-summer-kitchen', 'Summer Kitchen', 'exterior.hardscape', 'Summer Kitchen: Frame Installation', 'Screened lanai', { Grill: 'Gas grill w/ exhaust hood, sink, UC refrig. (A-3)' }),
  C('c-drive', 'Driveway & Walks', 'exterior.driveway', 'Pavers: Driveway & Walkway Installation', 'Front yard', { Drive: 'Concrete or paver w/ 8" border (A-1, "conceptual")' }),
  C('c-apron', 'Sidewalk & Apron', 'exterior.driveway', 'Shell: Pour Sidewalk and Apron', 'Right-of-way', { Note: 'Unreinforced concrete apron (City of Tampa, A-1)' }),
  C('c-landscape', 'Landscaping & Sod', 'exterior.landscaping', 'Landscaping: Landscaping Installation', 'Lot', { Note: 'Plantings illustrative; landscape plan not supplied. Palm clusters along rear line per A-1' }),
  C('c-fence', 'Fence', 'exterior.hardscape', 'Fence: Fence Installation', 'Sides & rear', { Route: 'Illustrative (fence plan not supplied)' }),
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
const CMU_T = ft(8 / 12)

function openingsFor(floor: 0 | 1 | 2, a: Pt, b: Pt, floorY: number, wallY0: number): (Opening & { src: PlanOpening })[] {
  const alongX = a[1] === b[1]
  const A: [number, number] = [X(a[0]), Z(a[1])]
  return OPENINGS.filter((o) => {
    if (o.floor !== floor) return false
    if ('d' in o.line) return alongX && Math.abs(o.line.d - a[1]) < 0.3 && o.from >= Math.min(a[0], b[0]) - 0.1 && o.to <= Math.max(a[0], b[0]) + 0.1
    return !alongX && Math.abs(o.line.x - a[0]) < 0.3 && o.from >= Math.min(a[1], b[1]) - 0.1 && o.to <= Math.max(a[1], b[1]) + 0.1
  }).map((o) => {
    const ga = alongX ? [X(o.from), X(o.to)] : [Z(o.from), Z(o.to)]
    const base = alongX ? A[0] : A[1]
    const u0 = Math.min(Math.abs(ga[0] - base), Math.abs(ga[1] - base))
    const u1 = Math.max(Math.abs(ga[0] - base), Math.abs(ga[1] - base))
    const dv = floorY - wallY0
    return { u0, u1, v0: dv + ft(o.sill), v1: dv + ft(o.head), kind: o.kind, src: o }
  })
}

type BWall = Wall & { plan: [Pt, Pt]; ops: (Opening & { src: PlanOpening })[]; finish: 'siding' | 'stucco' | 'none'; skinTop: number }

/** Street-face rule (A-5/A-6): siding on front-facing walls and the front ~30' of the sides, stucco elsewhere. */
function finishFor(a: Pt, b: Pt, n: [number, number], floor: 0 | 1 | 2): 'siding' | 'stucco' {
  const dMax = Math.max(a[1], b[1])
  const recess = a[1] === b[1] && (Math.abs(a[1] - 11.9) < 0.3 || Math.abs(a[1] - 12.1) < 0.3) // entry & balcony back walls
  const recessSide = a[0] === b[0] && (a[0] === 18.0 || a[0] === 36.75) && dMax <= 12.2
  if (recess || recessSide) return 'stucco'
  if (n[1] < -0.5) return 'siding' // faces street (scene +z ⇒ plan −d)
  if (n[0] < -0.5) return dMax <= SIDING_DEPTH.left + 0.1 ? 'siding' : 'stucco'
  if (n[0] > 0.5) return floor === 2 && dMax <= SIDING_DEPTH.right + 0.1 ? 'siding' : 'stucco'
  return 'stucco'
}

function buildWalls(pts: Pt[], closed: boolean, floor: 0 | 1 | 2, y0: number, h: number, prefix: string, poly: Pt[], skinTop: number, skip?: (a: Pt, b: Pt) => boolean): BWall[] {
  const out: BWall[] = []
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    if (skip?.(a, b)) continue
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    let pn: [number, number] = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len]
    const mx = (a[0] + b[0]) / 2
    const md = (a[1] + b[1]) / 2
    if (inside(poly, mx + pn[0] * 0.5, md + pn[1] * 0.5)) pn = [-pn[0], -pn[1]]
    const party = floor === 1 && isGarageParty(a, b)
    const floorY = floor === 0 ? GAR_SLAB : floor === 1 ? FFE : F2_FLOOR
    const ops = openingsFor(floor, a, b, floorY, y0)
    out.push({
      id: `${prefix}-${i}`,
      plan: [a, b],
      a: [X(a[0]), Z(a[1])],
      b: [X(b[0]), Z(b[1])],
      n: [pn[0], -pn[1]],
      y0,
      h,
      t: CMU_T,
      kind: 'cmu',
      skin: party ? 'int' : 'ext',
      floor: floor === 2 ? 2 : 1,
      openings: ops.filter((o) => o.kind !== 'octagon'),
      ops,
      finish: party ? 'none' : finishFor(a, b, pn, floor),
      skinTop,
    })
  }
  return out
}

// The stair-tower front wall rises in one lift to its own tie beam (A-5): the 4050 + 4040 window straddles the floor line.
const isStairFront = (a: Pt, b: Pt) => a[1] === 2.75 && b[1] === 2.75
const WALLS_1 = buildWalls(F1_OUTLINE, true, 1, FFE, F1_BLOCK_TOP - FFE, 'f1', F1_OUTLINE, F2_FLOOR, isStairFront)
const WALLS_2 = buildWalls(F2_OUTLINE, true, 2, F2_FLOOR, F2_BLOCK_TOP - F2_FLOOR, 'f2', F2_OUTLINE, F2_TOP, isStairFront)
const STAIR_FRONT: BWall[] = (() => {
  const a: Pt = [36.75, 2.75]
  const b: Pt = [46.4, 2.75]
  const y0 = FFE
  const h = STAIR_TOP - ft(1.33) - FFE
  const w = buildWalls([a, b], false, 1, y0, h, 'stair', F1_OUTLINE, STAIR_TOP)[0]
  const win = { u0: X(39.6) - X(36.75), u1: X(43.6) - X(36.75), v0: ft(9.3), v1: ft(18.3), kind: 'fixed' as const, src: { floor: 1, line: { d: 2.75 }, from: 39.6, to: 43.6, sill: 9.3, head: 18.3, kind: 'fixed', transom: 4, tag: '4050 FIXED W/ 4040 TRANSOM MULLED' } as PlanOpening }
  return [{ ...w, openings: [win], ops: [win], finish: 'siding' as const }]
})()
const GAR_POLY: Pt[] = [[51.75, -0.5], [82.75, -0.5], [82.75, 22.3], [51.75, 22.3]]
const WALLS_G = buildWalls(GARAGE_LINE, false, 0, GAR_SLAB, GAR_BLOCK_TOP - GAR_SLAB, 'g', GAR_POLY, GAR_TOP, (a, b) => isGarageParty(a, b))
/** 2F walls that stand over the garage, infilled down to the garage plate (framed, A-4/A-5). */
const INFILL: BWall[] = buildWalls([[52.4, 7.0], [52.4, 9.5], [75.1, 9.5], [75.1, 22.3]], false, 2, GAR_TOP, F2_FLOOR - GAR_TOP, 'inf', F2_OUTLINE, F2_FLOOR).map((w) => ({ ...w, openings: [], ops: [] }))

const EXT_1 = [...WALLS_1, ...STAIR_FRONT]
const ALL_EXT = [...EXT_1, ...WALLS_2, ...WALLS_G, ...INFILL].filter((w) => w.skin === 'ext')
const SIDING = ALL_EXT.filter((w) => w.finish === 'siding')
const STUCCO = ALL_EXT.filter((w) => w.finish === 'stucco')
const skinH = (w: Wall) => (w as BWall).skinTop - w.y0

const partition = (seg2: [Pt, Pt], floor: 1 | 2, i: number): Wall => {
  const y0 = floor === 1 ? FFE : F2_FLOOR
  const L = Math.hypot(seg2[1][0] - seg2[0][0], seg2[1][1] - seg2[0][1]) * FT
  return {
    id: `p${floor}-${i}`,
    a: [X(seg2[0][0]), Z(seg2[0][1])],
    b: [X(seg2[1][0]), Z(seg2[1][1])],
    n: seg2[0][0] === seg2[1][0] ? [1, 0] : [0, 1],
    y0,
    h: (floor === 1 ? F1_CEIL : F2_TOP) - y0 - 0.02,
    t: 0.14,
    kind: 'wood',
    skin: 'int',
    floor,
    openings: L > 2.2 ? [{ u0: Math.min(0.8, L / 2 - 0.45), u1: Math.min(0.8, L / 2 - 0.45) + 0.86, v0: 0, v1: 2.44, kind: 'door' }] : [],
  }
}
const PART_1 = PARTITIONS_F1.map((s, i) => partition(s, 1, i))
const PART_2 = PARTITIONS_F2.map((s, i) => partition(s, 2, i))

// ===========================================================================
// SITE — before construction
// ===========================================================================
add({
  id: 'existing-home',
  componentId: 'c-existing-home',
  geo: 'box',
  mat: 'oldHouse',
  anim: 'pop',
  appearTask: '__always',
  disappearTask: T('Demolition Permit'),
  disappearWindow: [0.96, 1],
  inst: [
    { ...rect({ x0: 10, d0: 4, x1: 64, d1: 44 }, 0, 3.0), g: 0 },
    { ...rect({ x0: 9, d0: 3, x1: 65, d1: 45 }, 3.0, 3.25), c: '#5d544c', g: 0 },
    { ...box(X(12), 3.25, Z(42), X(62), 4.6, Z(6)), c: '#6a5f56', g: 0 },
    { ...rect({ x0: 50, d0: -26, x1: 62, d1: 4 }, 0, 0.04), c: '#9b968c', g: 1 },
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
    { p: P3(30, 7.5, 56), s: [9, 5.5, 9], a: P3(30, 0, 56), g: 0 },
    { p: P3(30, 2.6, 56), s: [0.9, 5.2, 0.9], a: P3(30, 0, 56), g: 0, c: '#5d4f42' },
    { p: P3(22, 5.0, -36), s: [5, 3.4, 5], a: P3(22, 0, -36), g: 1 },
    { p: P3(52, 5.0, -36), s: [5, 3.4, 5], a: P3(52, 0, -36), g: 1 },
  ],
})
/** Lot-clipped ground tiles (A-1 lot is a trapezoid with a skewed rear line). */
const lotTiles = (holes: [number, number, number, number][], y0: number, y1: number, step = 4): Inst[] => {
  const out: Inst[] = []
  let g = 0
  for (let d = LOT.d0; d < LOT.d1; d += step, g++)
    for (let x = LOT.x0; x < LOT.x1; x += step) {
      const cx = x + step / 2
      const cd = d + step / 2
      if (!inside(LOT_POLY, cx, cd)) continue
      for (const r of rectMinus(sceneRect({ x0: x, d0: d, x1: Math.min(x + step, LOT.x1), d1: Math.min(d + step, LOT.d1) }), holes)) out.push(box(r[0], y0, r[1], r[2], y1, r[3], { g }))
    }
  return out
}
add({ id: 'lot-grass-before', componentId: 'c-existing-home', geo: 'box', mat: 'grassWild', anim: 'pop', appearTask: '__always', disappearTask: T('Survey: Building Stake Out'), disappearFade: true, inert: true, castShadow: false, inst: lotTiles([], 0, 0.012, 8) })
add({ id: 'lot-dirt', componentId: 'c-backfill', geo: 'box', mat: 'dirt', anim: 'fade', appearTask: T('Survey: Building Stake Out'), disappearTask: T('Landscaping: Landscaping Installation'), disappearFade: true, inert: true, castShadow: false, inst: lotTiles([], 0, 0.016, 8) })

// Stake out + temporary facilities + grand-tree barricades
{
  const stakes: Inst[] = []
  ;[...F1_OUTLINE, ...GARAGE_LINE].forEach(([x, d], i) => {
    stakes.push(box(X(x) - 0.025, 0, Z(d) - 0.025, X(x) + 0.025, 0.9, Z(d) + 0.025, { g: i }))
    stakes.push(box(X(x) - 0.03, 0.75, Z(d) - 0.03, X(x) + 0.03, 0.85, Z(d) + 0.03, { g: i, c: '#e0577a' }))
  })
  add({ id: 'stakes', componentId: 'c-stakeout', geo: 'box', mat: 'stake', inst: stakes, anim: 'rise', disappearTask: T('Shell: Slab Pouring') })
  const fence: Inst[] = []
  const lp = LOT_POLY
  const runs: [Pt, Pt][] = [[lp[0], [48, -25.4]], [[86, -27.9], lp[1]], [lp[1], lp[2]], [lp[2], lp[3]], [lp[3], lp[0]]]
  let g = 0
  for (const [a, b] of runs) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.ceil(len / 10)
    for (let i = 0; i < n; i++) {
      const p0: Pt = [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]
      const p1: Pt = [a[0] + ((b[0] - a[0]) * (i + 1)) / n, a[1] + ((b[1] - a[1]) * (i + 1)) / n]
      fence.push(box(X(p0[0]) - 0.03, 0, Z(p0[1]) - 0.03, X(p0[0]) + 0.03, 1.85, Z(p0[1]) + 0.03, { g, c: '#3a3e42' }))
      const yaw = Math.atan2(-(Z(p1[1]) - Z(p0[1])), X(p1[0]) - X(p0[0]))
      fence.push({ p: [(X(p0[0]) + X(p1[0])) / 2, 0.92, (Z(p0[1]) + Z(p1[1])) / 2], s: [Math.hypot(X(p1[0]) - X(p0[0]), Z(p1[1]) - Z(p0[1])), 1.75, 0.02], q: euler(0, yaw, 0), g, c: '#2f4a3c' })
      g++
    }
  }
  fence.push(box(X(84), 0, Z(-14), X(88), 2.3, Z(-10), { g: g + 1, c: '#3e5a49' }))
  const barricade: Inst[] = []
  for (const [cx, cd, r] of [[-15, -22, 12], [88.5, 55, 10]] as const) {
    for (let k = 0; k < 10; k++) {
      const a0 = (k / 10) * Math.PI * 2
      const a1 = ((k + 1) / 10) * Math.PI * 2
      barricade.push({ ...seg(P3(cx + Math.cos(a0) * r, 0.6, cd + Math.sin(a0) * r), P3(cx + Math.cos(a1) * r, 0.6, cd + Math.sin(a1) * r), 0.02), g: g + 3, c: '#e8772e' })
    }
  }
  add({ id: 'temp-site', componentId: 'c-temp', geo: 'box', mat: 'white', inst: fence, anim: 'rise', disappearTask: T('Cleaning: Final Clean and Pressure Washing') })
  add({ id: 'temp-barricades', componentId: 'c-temp', geo: 'cyl', mat: 'barricade', inst: barricade, anim: 'pop', disappearTask: T('Landscaping: Landscaping Installation'), castShadow: false })
}

// ===========================================================================
// FOUNDATION — raised CMU stem wall (6'-0"), backfill, slabs
// ===========================================================================
const STEM = buildWalls(F1_OUTLINE, true, 1, 0, FFE - 0.12, 'stem', F1_OUTLINE, FFE).map((w) => ({ ...w, openings: [], ops: [], finish: 'stucco' as const, skin: 'ext' as const }))
const STEM_G = buildWalls(GARAGE_LINE, false, 0, 0, GAR_SLAB + 0.12, 'stemg', GAR_POLY, GAR_SLAB + 0.12, (a, b) => isGarageParty(a, b)).map((w) => ({ ...w, openings: [], ops: [] }))
/** Lanai + breezeway + porch rims (open sides only), poured to the paver level. */
const RIMS: BWall[] = [
  ...buildWalls([[17.75, 46.5], [36.75, 46.5], [36.75, 58.25], [59.75, 58.25], [59.75, 46.25]], false, 1, 0, LANAI_FLOOR - 0.12, 'rim', [[17.75, 41.2], [59.75, 41.2], [59.75, 58.25], [36.75, 58.25], [36.75, 46.5], [17.75, 46.5]], LANAI_FLOOR),
  ...buildWalls([[18.0, 7.0], [18.0, 4.6], [36.75, 4.6], [36.75, 2.75]], false, 1, 0, FFE - 0.12, 'rimp', [[18, 4.6], [36.75, 4.6], [36.75, 11.9], [18, 11.9]], FFE),
].map((w) => ({ ...w, openings: [], ops: [], finish: 'stucco' as const, skin: 'ext' as const }))
const FOUND = [...STEM, ...STEM_G, ...RIMS]
add({ id: 'trenches', componentId: 'c-trenches', geo: 'box', mat: 'trench', anim: 'sweep', disappearTask: T('Shell: Stem Wall Base Concrete Pouring'), disappearFade: true, castShadow: false, inst: FOUND.map((w, i) => wallBox({ ...w, y0: 0 }, -0.2, wallLen(w) + 0.2, 0, 0.01, -0.55, 0.3, { g: i })) })
add({ id: 'footings', componentId: 'c-footings', geo: 'box', mat: 'concreteFresh', anim: 'sweep', castShadow: false, inst: FOUND.map((w, i) => wallBox({ ...w, y0: 0 }, -0.2, wallLen(w) + 0.2, 0, 0.06, -0.5, 0.25, { g: i })) })
add({ id: 'stemwall', componentId: 'c-stemwall', geo: 'box', mat: 'white', anim: 'sweep', overlap: 0.25, inst: masonry(FOUND) })
{
  // Smart Vent flow-thru vents in the stem wall (A-3 "8×16 smart vent"): every ~12 ft on the stem, louvers on the garage.
  const vents: Inst[] = []
  STEM.filter((w) => w.skin === 'ext').forEach((w, i) => {
    const L = wallLen(w)
    for (let u = 1.2; u < L - 0.8; u += 3.6) vents.push(wallBox(w, u, u + 0.41, 0.25, 0.45, 0.035, 0.05, { g: i }))
  })
  add({ id: 'flood-vents', componentId: 'c-stemwall', geo: 'box', mat: 'vent', anim: 'pop', window: [0.8, 1], castShadow: false, inst: vents })
}
const F1_SLAB_RECTS: Rect[] = F1_RECTS
add({ id: 'backfill', componentId: 'c-backfill', geo: 'box', mat: 'sand', anim: 'rise', castShadow: false, inst: [...F1_SLAB_RECTS.map((r, i) => rect(r, 0.02, FFE - 0.14, { g: i })), rect(PORCH, 0.02, FFE - 0.14, { g: 20 }), rect(BREEZEWAY, 0.02, LANAI_FLOOR - 0.14, { g: 21 }), rect(LANAI, 0.02, LANAI_FLOOR - 0.14, { g: 22 })] })
{
  const y = FFE - 0.15
  const r = 0.055
  // Drain stacks at the fixture groups shown on A-3/A-4, collected under the slab to the street (schematic).
  const stacks: Pt[] = [[4, 12], [12.5, 17.5], [21, 23.5], [54, 33], [42, 25.5], [70.5, 26], [69.5, 44.5], [64, 35]]
  const ug: Inst[] = [...polyline([P3(4, y, 12), P3(4, y, 20), P3(30, y, 20), P3(54, y, 20), P3(66, y, 20), P3(66, y, 44.5)], r, { g: 0 }), ...polyline([P3(30, y, 20), P3(30, y, 6), P3(30, -0.45, -1), P3(30, -0.45, -27)], r, { g: 0 })]
  stacks.forEach(([x, d], i) => ug.push(seg(P3(x, y, d), P3(x, y, 20), r * 0.8, { g: 1 }), seg(P3(x, y, d), P3(x, FFE + 0.45, d), r, { g: 2 + i })))
  add({ id: 'ug-plumbing', componentId: 'c-ug-plumbing', geo: 'cyl', mat: 'pvc', inst: ug, anim: 'rise', castShadow: false })
  add({ id: 'ug-electric', componentId: 'c-ug-electric', geo: 'cyl', mat: 'wire', anim: 'rise', castShadow: false, inst: polyline([P3(86, -0.4, -24), P3(84, -0.4, 9.5), P3(83.0, -0.4, 9.5), P3(83.0, FFE + 0.5, 9.6)], 0.035, { g: 0 }) })
}
add({ id: 'vapor', componentId: 'c-slab-prep', geo: 'box', mat: 'vapor', anim: 'sweep', castShadow: false, inst: [...F1_SLAB_RECTS.map((r, i) => rect(r, FFE - 0.14, FFE - 0.13, { g: i })), rect(GARAGE_RECT, 0.02, 0.025, { g: 15 })] })
add({
  id: 'slab',
  componentId: 'c-slab',
  geo: 'box',
  mat: 'concrete',
  anim: 'rise',
  inst: [
    ...F1_SLAB_RECTS.map((r, i) => rect(r, FFE - 0.12, FFE, { g: i })),
    rect(GARAGE_RECT, 0.02, GAR_SLAB, { g: 12 }),
    rect(PORCH, FFE - 0.12, FFE - 0.03, { g: 13 }),
    rect(BREEZEWAY, LANAI_FLOOR - 0.12, LANAI_FLOOR - 0.03, { g: 14 }),
    rect(LANAI, LANAI_FLOOR - 0.12, LANAI_FLOOR - 0.03, { g: 14 }),
    rect(AC_PAD, 0, ft(4) + 0.1, { g: 15 }),
  ],
})
// Entry stair (7 R from the 7.0' NAVD walk to the porch), raised CMU planters w/ cast stone coping, breezeway stair to the yard.
{
  const steps: Inst[] = []
  const rise = (FFE - FRONT_WALK) / 7
  for (let i = 0; i < 7; i++) steps.push(rect({ x0: ENTRY_STAIR.x0, d0: ENTRY_STAIR.d1 - (i + 1) * 0.92, x1: ENTRY_STAIR.x1, d1: ENTRY_STAIR.d1 - i * 0.92 + 0.05 }, 0, FFE - i * rise - 0.03, { g: 0 }))
  const pr = (LANAI_FLOOR - 0) / 10
  for (let i = 0; i < 10; i++) steps.push(rect({ x0: POOL_STAIRS.x0, d0: POOL_STAIRS.d0 + i * 0.7, x1: POOL_STAIRS.x1, d1: POOL_STAIRS.d0 + (i + 1) * 0.7 }, 0, LANAI_FLOOR - (i + 1) * pr, { g: 1 }))
  add({ id: 'stairs-exterior', componentId: 'c-slab', geo: 'box', mat: 'concrete', inst: steps, anim: 'rise' })
  const planterTop = FFE - ft(3.33)
  const pl: Inst[] = []
  PLANTERS.forEach((r, i) => {
    pl.push(rect(r, 0, planterTop, { g: i }))
  })
  add({ id: 'planters', componentId: 'c-stucco', geo: 'box', mat: 'stuccoRaw', inst: pl, anim: 'rise', colorTo: { task: T('Paint: Exterior'), color: '#f3f2ed' } })
  add({ id: 'planter-coping', componentId: 'c-stucco', geo: 'box', mat: 'castStone', inst: PLANTERS.map((r, i) => box(X(r.x0) - 0.05, planterTop, Z(r.d1) - 0.05, X(r.x1) + 0.05, planterTop + 0.1, Z(r.d0) + 0.05, { g: i })), anim: 'pop', castShadow: false })
  add({ id: 'planter-soil', componentId: 'c-landscape', geo: 'box', mat: 'mulch', inst: PLANTERS.map((r, i) => box(X(r.x0) + 0.2, planterTop - 0.15, Z(r.d1) + 0.2, X(r.x1) - 0.2, planterTop - 0.05, Z(r.d0) - 0.2, { g: i })), anim: 'pop', castShadow: false, inert: true })
}

// ===========================================================================
// STRUCTURE — CMU + tie beams on two floors, hung floor trusses, roof trusses
// ===========================================================================
add({ id: 'pallets-1', componentId: 'c-block-delivery', geo: 'box', mat: 'white', anim: 'pop', disappearTask: T('Shell: Block Wall Up (2nd Floor)'), inst: Array.from({ length: 10 }, (_, i) => box(X(56 + (i % 5) * 5), GAR_SLAB, Z(-8 - Math.floor(i / 5) * 5), X(59.6 + (i % 5) * 5), GAR_SLAB + 0.95, Z(-11.6 - Math.floor(i / 5) * 5), { g: i, c: i % 2 ? '#a9a7a1' : '#a3a19b' })) })
add({ id: 'cmu-1', componentId: 'c-cmu-1', geo: 'box', mat: 'white', inst: [...masonry([...EXT_1, ...WALLS_G])], anim: 'sweep', overlap: 0.12 })
// Porch piers + lanai columns (CMU / filled cells) and the 8" concrete beams they carry (A-3)
const PIERS1: Rect[] = [...PORCH_PIERS, { x0: 36.75, d0: 57.6, x1: 37.4, d1: 58.25 }, { x0: 45.1, d0: 57.6, x1: 45.75, d1: 58.25 }, { x0: 59.1, d0: 57.6, x1: 59.75, d1: 58.25 }, { x0: 36.75, d0: 46.0, x1: 37.4, d1: 46.6 }]
add({ id: 'piers-1', componentId: 'c-cmu-1', geo: 'box', mat: 'cmu', inst: PIERS1.map((r, i) => rect(r, r.d0 > 40 ? LANAI_FLOOR : FFE, F1_BLOCK_TOP, { g: i })), anim: 'rise' })
const BEAMS1: Rect[] = [
  { x0: 18.0, d0: 4.6, x1: 36.75, d1: 5.9 }, // 8" conc. beam across the porch (A-3)
  { x0: 36.75, d0: 57.6, x1: 59.75, d1: 58.25 }, // lanai rear
  { x0: 17.75, d0: 46.0, x1: 37.4, d1: 46.6 }, // breezeway
  { x0: 36.75, d0: 46.0, x1: 37.4, d1: 58.25 }, // lanai side
]
add({
  id: 'tiebeam-1',
  componentId: 'c-tiebeam-1',
  geo: 'box',
  mat: 'concrete',
  anim: 'sweep',
  inst: [
    ...EXT_1.filter((w) => w.id.startsWith('f1')).map((w, i) => wallBox(w, 0, wallLen(w), F1_BLOCK_TOP - FFE, F1_TOP - FFE, -w.t, 0, { g: i })),
    ...WALLS_G.map((w, i) => wallBox(w, 0, wallLen(w), GAR_BLOCK_TOP - GAR_SLAB, GAR_TOP - GAR_SLAB, -w.t, 0, { g: 40 + i })),
    ...STAIR_FRONT.map((w) => wallBox(w, 0, wallLen(w), w.h, STAIR_TOP - FFE, -w.t, 0, { g: 60 })),
    ...[...EXT_1, ...WALLS_G].flatMap((w, i) => w.openings.filter((o) => o.kind !== 'garage').map((o) => wallBox(w, o.u0 - 0.2, o.u1 + 0.2, o.v1, Math.min(o.v1 + 0.2, w.h), -w.t, 0, { g: i }))),
    ...WALLS_G.flatMap((w) => w.openings.filter((o) => o.kind === 'garage').map((o) => wallBox(w, o.u0 - 0.2, o.u1 + 0.2, o.v1, w.h, -w.t, 0, { g: 50 }))),
    ...BEAMS1.map((r, i) => rect(r, F1_BLOCK_TOP, F1_TOP, { g: 70 + i })),
  ],
})
add({ id: 'framing-1', componentId: 'c-framing-1', geo: 'box', mat: 'lumber', inst: framing(PART_1), anim: 'rise', overlap: 0.3 })
{
  // Floor trusses hung in the tie beam: top + bottom chords and webs @ 24" o.c., spanning the short way of each plate.
  const tr: Inst[] = []
  const depth = F2_FLOOR - F1_CEIL - 0.04
  ;[...F2_RECTS, FRONT_BALCONY].forEach((r, i) => {
    const alongX = r.x1 - r.x0 < r.d1 - r.d0
    const [s0, s1] = alongX ? [r.d0 + 0.5, r.d1 - 0.5] : [r.x0 + 0.5, r.x1 - 0.5]
    for (let s = s0; s <= s1; s += 2) {
      const a = alongX ? P3(r.x0 + 0.4, 0, s) : P3(s, 0, r.d0 + 0.4)
      const b = alongX ? P3(r.x1 - 0.4, 0, s) : P3(s, 0, r.d1 - 0.4)
      const yt = F2_FLOOR - 0.06
      const yb = F2_FLOOR - depth
      const g = i * 100 + Math.round(s)
      tr.push(box(Math.min(a[0], b[0]) - 0.02, yt - 0.06, Math.min(a[2], b[2]) - 0.02, Math.max(a[0], b[0]) + 0.02, yt, Math.max(a[2], b[2]) + 0.02, { g }))
      tr.push(box(Math.min(a[0], b[0]) - 0.02, yb, Math.min(a[2], b[2]) - 0.02, Math.max(a[0], b[0]) + 0.02, yb + 0.06, Math.max(a[2], b[2]) + 0.02, { g }))
      const L = Math.hypot(b[0] - a[0], b[2] - a[2])
      const n = Math.max(2, Math.round(L / 0.9))
      for (let k = 0; k < n; k++) {
        const t0 = k / n
        const t1 = (k + 1) / n
        const pa: V3 = [a[0] + (b[0] - a[0]) * t0, k % 2 ? yt - 0.06 : yb + 0.06, a[2] + (b[2] - a[2]) * t0]
        const pb: V3 = [a[0] + (b[0] - a[0]) * t1, k % 2 ? yb + 0.06 : yt - 0.06, a[2] + (b[2] - a[2]) * t1]
        tr.push(seg(pa, pb, 0.02, { g }))
      }
    }
  })
  add({ id: 'floor-trusses', componentId: 'c-floor-trusses', geo: 'box', mat: 'lumber', anim: 'drop', dropH: 1.2, inst: tr.filter((t) => !t.q) })
  add({ id: 'floor-truss-webs', componentId: 'c-floor-trusses', geo: 'cyl', mat: 'lumber', anim: 'drop', dropH: 1.2, castShadow: false, inst: tr.filter((t) => t.q) })
  add({ id: 'subfloor', componentId: 'c-floor-trusses', geo: 'box', mat: 'osb', anim: 'pop', window: [0.55, 1], inst: F2_RECTS.flatMap((r, i) => tile(sceneRect(r), 2.44, 1.22, 0.006, F2_FLOOR - 0.02, F2_FLOOR, true).map((t) => ({ ...t, g: (t.g ?? 0) + i * 40 }))) })
}
add({ id: 'balcony-slabs', componentId: 'c-floor-trusses', geo: 'box', mat: 'concrete', anim: 'drop', dropH: 1, inst: [rect(FRONT_BALCONY, F2_FLOOR - ft(1), F2_FLOOR - 0.04, { g: 0 }), rect(REAR_BALCONY, F2_FLOOR - 0.25, F2_FLOOR - 0.04, { g: 1 })] })
add({ id: 'pallets-2', componentId: 'c-block-delivery', geo: 'box', mat: 'white', anim: 'pop', appearTask: T('Shell: Deliver Block & Lintel (2nd Floor)'), disappearTask: T('Shell: Block Wall Up (2nd Floor)'), inst: Array.from({ length: 6 }, (_, i) => box(X(54 + (i % 3) * 6), F2_FLOOR, Z(30 + Math.floor(i / 3) * 6), X(57.6 + (i % 3) * 6), F2_FLOOR + 0.9, Z(26.4 + Math.floor(i / 3) * 6), { g: i, c: '#a6a49e' })) })
add({ id: 'cmu-2', componentId: 'c-cmu-2', geo: 'box', mat: 'white', inst: masonry(WALLS_2), anim: 'sweep', overlap: 0.12 })
add({ id: 'infill-cmu', componentId: 'c-cmu-1', geo: 'box', mat: 'white', inst: masonry(INFILL), anim: 'sweep', overlap: 0.12 })
// Balcony piers to the 26'-0" balcony tie beam, beam "stucco on concrete beam" (A-5), rear balcony posts
const BAL_PIERS: Rect[] = [
  { x0: 18.0, d0: 4.75, x1: 19.1, d1: 5.9 },
  { x0: 20.9, d0: 5.0, x1: 21.4, d1: 5.5 },
  { x0: 33.25, d0: 5.0, x1: 33.75, d1: 5.5 },
  { x0: 35.5, d0: 4.75, x1: 36.75, d1: 5.9 },
]
add({ id: 'piers-2', componentId: 'c-cmu-2', geo: 'box', mat: 'cmu', inst: [...BAL_PIERS.map((r, i) => rect(r, F2_FLOOR, BAL_TOP - ft(2), { g: i })), ...[18.0, 36.0].map((x, i) => rect({ x0: x, d0: 5.9, x1: x + 0.75, d1: 12.1 }, F2_TOP, BAL_TOP, { g: 4 + i }))], anim: 'rise' })
add({
  id: 'tiebeam-2',
  componentId: 'c-tiebeam-2',
  geo: 'box',
  mat: 'concrete',
  anim: 'sweep',
  inst: [
    ...WALLS_2.map((w, i) => wallBox(w, 0, wallLen(w), F2_BLOCK_TOP - F2_FLOOR, F2_TOP - F2_FLOOR, -w.t, 0, { g: i })),
    ...WALLS_2.flatMap((w, i) => w.openings.map((o) => wallBox(w, o.u0 - 0.2, o.u1 + 0.2, o.v1, Math.min(o.v1 + 0.2, F2_BLOCK_TOP - F2_FLOOR), -w.t, 0, { g: i }))),
    rect({ x0: 18.0, d0: 4.75, x1: 36.75, d1: 5.9 }, BAL_TOP - ft(2), BAL_TOP, { g: 60 }),
    rect({ x0: 18.0, d0: 11.4, x1: 36.75, d1: 12.1 }, F2_TOP, BAL_TOP, { g: 60 }),
  ],
})
add({ id: 'framing-2', componentId: 'c-framing-2', geo: 'box', mat: 'lumber', inst: framing(PART_2), anim: 'rise', overlap: 0.3 })
{
  // U-stair in the stair tower (A-3/A-4): flight up toward the street, landing under the 4050 window, flight back to the 2nd floor.
  const st: Inst[] = []
  const H = F2_FLOOR - FFE
  const n1 = 11
  const n2 = 10
  const r1 = H / (n1 + n2)
  const yL = FFE + n1 * r1
  for (let i = 0; i < n1; i++) st.push(box(X(37.5), FFE + (i + 1) * r1 - 0.05, Z(16.0 - i * 0.92), X(41.4), FFE + (i + 1) * r1, Z(16.0 - (i + 1) * 0.92), { g: i }))
  st.push(box(X(37.5), yL - 0.08, Z(5.9), X(45.7), yL, Z(3.4), { g: n1 }))
  for (let i = 0; i < n2; i++) st.push(box(X(41.8), yL + (i + 1) * r1 - 0.05, Z(5.9 + i * 0.92), X(45.7), yL + (i + 1) * r1, Z(5.9 + (i + 1) * 0.92), { g: n1 + 1 + i }))
  st.push(box(X(41.4), FFE, Z(16), X(41.8), F2_FLOOR + ft(3), Z(5.9), { g: 0, c: '#efeeea' }))
  add({ id: 'stairs', componentId: 'c-stairs', geo: 'box', mat: 'lumber', inst: st, anim: 'pop', colorTo: { task: T('Flooring: Staircase Trim'), color: '#7c5f46' } })
}

// ---------------------------------------------------------------------------
// Roofs (fitted to A-5/A-6 elevations; see plan.ts ROOFS)
// ---------------------------------------------------------------------------
const toHip = (r: Rect, y: number, pitch: number, overhang: number): HipRect => ({ x0: X(r.x0), x1: X(r.x1), z0: Z(r.d1), z1: Z(r.d0), y, pitch, overhang: ft(overhang) })
const HIPS = ROOFS.filter((r) => r.kind === 'hip').map((r) => ({ spec: r, hip: toHip(r.r, r.y, r.pitch, r.overhang) }))
const SHEDS = ROOFS.filter((r) => r.kind === 'shed').map((r) => ({ spec: r, hip: toHip(r.r, r.y, r.pitch, r.overhang) }))
/** Lean-to hips stop at the wall they abut (the bath bay against the house). */
const leanClip = (id: string, g: THREE.BufferGeometry) => (id === 'bath-bay' ? clipGeometry(g, 'z', Z(7.0), 'gt') : g)
/** The main hip is notched where the balcony gable sits (A-5: the 2F eave stops at the balcony piers). */
const notchGable = (id: string, g: THREE.BufferGeometry) => {
  if (id !== 'main') return g
  const xa = X(FRONT_GABLE.x0)
  const xb = X(FRONT_GABLE.x1)
  const mid = clipGeometry(clipGeometry(g, 'x', xa, 'gt'), 'x', xb, 'lt')
  return mergeGeometries([clipGeometry(g, 'x', xa, 'lt'), clipGeometry(g, 'x', xb, 'gt'), clipGeometry(mid, 'z', Z(12.1), 'lt')])
}
const hipGeo = (lift: number, seam: number) => HIPS.map(({ spec, hip }, i) => notchGable(spec.id, leanClip(spec.id, hipRoofGeometry(spec.id === 'bath-bay' ? { ...hip, z0: hip.z0 - (hip.z1 - hip.z0) } : hip, seam, lift + i * 0.006)))) // per-roof lift: coplanar hip faces would z-fight
const shedGeo = (lift: number, seam: number) => SHEDS.map(({ hip }) => shedRoofGeometry(hip, 'z1', seam, lift))
const gable = (lift: number) => {
  const g = FRONT_GABLE
  return gableRoofGeometry(X(g.x0), X(g.x1), Z(g.dFront), Z(g.dBack), g.y + lift, g.pitch, ft(g.overhang))
}
{
  const raf = HIPS.flatMap(({ hip }, i) => hipRafters({ ...hip, y: hip.y - 0.09 }, 0.61, i * 500)).concat(
    SHEDS.flatMap(({ hip }) => {
      const out: Inst[] = []
      for (let x = hip.x0 + 0.3; x < hip.x1; x += 0.61) out.push(seg([x, hip.y + (hip.z1 - hip.z0) * hip.pitch - 0.09, hip.z1], [x, hip.y - 0.09, hip.z0], 0.03, { g: 4000 }))
      return out
    }),
  )
  add({ id: 'roof-trusses', componentId: 'c-roof-trusses', geo: 'cyl', mat: 'lumber', inst: raf, anim: 'rise', overlap: 0.08, castShadow: false })
  const deck = mergeGeometries([...hipGeo(0, 1.22), ...shedGeo(0, 1.22), gable(0).roof])
  add({ id: 'roof-deck', componentId: 'c-dry-in', geo: 'box', custom: deck, mat: 'roofDeck', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', window: [0, 0.45] })
  const under = mergeGeometries([...hipGeo(0.012, 1.22), ...shedGeo(0.012, 1.22), gable(0.012).roof])
  add({ id: 'roof-underlay', componentId: 'c-dry-in', geo: 'box', custom: under, mat: 'underlay', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', window: [0.5, 1] })
  const metal = mergeGeometries([...hipGeo(0.03, 0.4), ...shedGeo(0.03, 0.4), gable(0.03).roof])
  add({ id: 'roof-metal', componentId: 'c-roofing', geo: 'box', custom: metal, mat: 'roofMetal', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade' })
  // Gable pediment over the front balcony (board & batten in the elevation) — siding package
  add({ id: 'gable-end', componentId: 'c-siding', geo: 'box', custom: gable(0).end, mat: 'battens', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', colorTo: { task: T('Paint: Exterior'), color: '#f6f5f0' } })
  const foam = mergeGeometries([...hipGeo(-0.13, 1.22).slice(0, 3)])
  add({ id: 'roof-foam', componentId: 'c-insulation', geo: 'box', custom: foam, mat: 'foam', inst: [{ p: [0, 0, 0], s: [1, 1, 1] }], anim: 'fade', castShadow: false })
}
// Eave trim: fascia, vented soffit, gutters, downspouts, 4x6 brackets (street side) — clipped where another roof or wall covers the edge.
{
  const fas: Inst[] = []
  const sof: Inst[] = []
  const gut: Inst[] = []
  const brk: Inst[] = []
  const F2_POLY_SCENE = F2_OUTLINE
  const inGableNotch = (x: number, z: number, selfId: string) => selfId === 'main' && x > X(FRONT_GABLE.x0) - 0.05 && x < X(FRONT_GABLE.x1) + 0.05 && z > Z(12.1)
  const coveredBy = (x: number, z: number, y: number, selfId: string) =>
    inGableNotch(x, z, selfId) ||
    HIPS.some(({ spec, hip }) => spec.id !== selfId && x > hip.x0 - 0.05 && x < hip.x1 + 0.05 && z > hip.z0 - 0.05 && z < hip.z1 + 0.05 && hip.y >= y - 0.05) ||
    (y < F2_FLOOR + 0.5 && inside(F2_POLY_SCENE, x / FT + 41.35, 31 - z / FT))
  const all = [...HIPS.map((h) => ({ ...h, shed: false })), ...SHEDS.map((h) => ({ ...h, shed: true }))]
  all.forEach(({ spec, hip: r, shed }, ri) => {
    const o = r.overhang
    const ye = r.y - o * r.pitch
    const edges: [V3, V3, [number, number], 'f' | 'b' | 'l' | 'r'][] = shed
      ? [[[r.x0 - o, ye, r.z1 + o], [r.x1 + o, ye, r.z1 + o], [0, -1], 'f']]
      : [
          [[r.x0 - o, ye, r.z1 + o], [r.x1 + o, ye, r.z1 + o], [0, -1], 'f'],
          [[r.x0 - o, ye, r.z0 - o], [r.x1 + o, ye, r.z0 - o], [0, 1], 'b'],
          [[r.x0 - o, ye, r.z0 - o], [r.x0 - o, ye, r.z1 + o], [1, 0], 'l'],
          [[r.x1 + o, ye, r.z0 - o], [r.x1 + o, ye, r.z1 + o], [-1, 0], 'r'],
        ]
    for (const [a, b, inw, side] of edges) {
      if (spec.id === 'bath-bay' && side === 'b') continue
      const L = Math.hypot(b[0] - a[0], b[2] - a[2])
      const steps = Math.max(2, Math.round(L / 0.6))
      for (let k = 0; k < steps; k++) {
        const t0 = k / steps
        const t1 = (k + 1) / steps
        const pa: V3 = [a[0] + (b[0] - a[0]) * t0, ye, a[2] + (b[2] - a[2]) * t0]
        const pb: V3 = [a[0] + (b[0] - a[0]) * t1, ye, a[2] + (b[2] - a[2]) * t1]
        const mid = [(pa[0] + pb[0]) / 2, (pa[2] + pb[2]) / 2]
        if (coveredBy(mid[0] + inw[0] * 0.05, mid[1] + inw[1] * 0.05, r.y, spec.id)) continue
        const x0 = Math.min(pa[0], pb[0])
        const x1 = Math.max(pa[0], pb[0])
        const z0 = Math.min(pa[2], pb[2])
        const z1 = Math.max(pa[2], pb[2])
        fas.push(box(x0 - 0.02, ye - 0.2, z0 - 0.02, x1 + 0.02, ye + 0.03, z1 + 0.02, { g: ri }))
        const qa = [pa[0] + inw[0] * o, pa[2] + inw[1] * o]
        sof.push(box(Math.min(x0, qa[0]), ye - 0.19, Math.min(z0, qa[1]), Math.max(x1, qa[0]), ye - 0.175, Math.max(z1, qa[1]), { g: ri }))
        const out = [-inw[0] * 0.08, -inw[1] * 0.08]
        gut.push(box(x0 + out[0] - 0.06, ye - 0.16, z0 + out[1] - 0.06, x1 + out[0] + 0.06, ye - 0.02, z1 + out[1] + 0.06, { g: ri }))
        if (side === 'f' && (k % 1 === 0)) {
          // 4x6 foam bracket under the soffit, 24" o.c. along street-facing eaves (A-5)
          const cx = (pa[0] + pb[0]) / 2
          const cz = (pa[2] + pb[2]) / 2 + inw[1] * (o - 0.08)
          brk.push(box(cx - 0.05, ye - 0.42, cz - Math.max(0.05, (o - 0.12) / 2), cx + 0.05, ye - 0.19, cz + Math.max(0.05, (o - 0.12) / 2), { g: ri }))
        }
      }
    }
  })
  // Downspouts at the outside corners of the main eaves (aluminum, to splash blocks)
  const ds: Inst[] = []
  const corners: [number, number, number, number][] = [[0.6, 7.6, F2_TOP, 0], [74.5, 10.1, F2_TOP, 0], [2.7, 45.9, F2_TOP, 0], [74.5, 61.8, F2_TOP, 0], [62.1, 61.8, F2_TOP, 0], [82.2, 0.1, GAR_TOP, GAR_SLAB], [82.2, 21.7, GAR_TOP, 0]]
  corners.forEach(([x, d, top, bot], i) => ds.push(box(X(x) - 0.045, bot, Z(d) - 0.045, X(x) + 0.045, top - 0.2, Z(d) + 0.045, { g: i })))
  // Balcony gable: raked fascia + soffit returns (A-5 "1'-0" typ rake")
  {
    const g = FRONT_GABLE
    const o = ft(g.overhang)
    const xc = (X(g.x0) + X(g.x1)) / 2
    const yr = g.y + ((X(g.x1) - X(g.x0)) / 2) * g.pitch
    for (const xe of [X(g.x0) - o, X(g.x1) + o]) {
      const ye = g.y - o * g.pitch
      fas.push({ ...seg([xe, ye, Z(g.dFront) + o], [xc, yr + 0.03, Z(g.dFront) + o], 0.11), g: 90 })
    }
    sof.push(box(X(g.x0) - o, g.y - 0.1, Z(g.dFront) - 0.05, X(g.x1) + o, g.y - 0.06, Z(g.dFront) + o, { g: 90 }))
  }
  add({ id: 'fascia', componentId: 'c-soffit', geo: 'box', mat: 'fascia', inst: fas.filter((f) => !f.q), anim: 'sweep', castShadow: false })
  add({ id: 'fascia-rake', componentId: 'c-soffit', geo: 'box', mat: 'fascia', inst: fas.filter((f) => f.q).map((f) => ({ ...f, s: [0.06, f.s[1], 0.22] as V3 })), anim: 'pop', castShadow: false })
  add({ id: 'soffit', componentId: 'c-soffit', geo: 'box', mat: 'soffit', inst: sof, anim: 'pop', castShadow: false })
  add({ id: 'brackets', componentId: 'c-soffit', geo: 'box', mat: 'trimWhite', inst: brk, anim: 'pop', castShadow: false })
  add({ id: 'gutters', componentId: 'c-gutters', geo: 'box', mat: 'fascia', inst: gut, anim: 'sweep', castShadow: false })
  add({ id: 'downspouts', componentId: 'c-gutters', geo: 'box', mat: 'fascia', inst: ds, anim: 'rise', castShadow: false })
}

// ---------------------------------------------------------------------------
// Railings: temporary fall protection, then the finished railings and screens
// ---------------------------------------------------------------------------
{
  const temp: Inst[] = []
  const tr = (r: Rect, y: number, sides: string) => {
    const yb = y + 1.05
    if (sides.includes('f')) temp.push(rect({ ...r, d1: r.d0 + 0.15 }, yb - 0.05, yb))
    if (sides.includes('b')) temp.push(rect({ ...r, d0: r.d1 - 0.15 }, yb - 0.05, yb))
    if (sides.includes('l')) temp.push(rect({ ...r, x1: r.x0 + 0.15 }, yb - 0.05, yb))
    for (let x = r.x0; x <= r.x1 + 0.01; x += 4) temp.push(box(X(x) - 0.03, y, Z(sides.includes('b') ? r.d1 : r.d0) - 0.03, X(x) + 0.03, yb, Z(sides.includes('b') ? r.d1 : r.d0) + 0.03))
  }
  tr(FRONT_BALCONY, F2_FLOOR, 'f')
  tr(REAR_BALCONY, F2_FLOOR, 'bl')
  add({ id: 'safety-rails', componentId: 'c-safety-rail', geo: 'box', mat: 'white', inst: temp.map((x) => ({ ...x, c: '#d4a017' })), anim: 'pop', disappearTask: T('Exterior Railings & Awnings'), castShadow: false })

  // Front balcony: 3 Chippendale panels between the inner piers, 36" (A-5)
  const rail: Inst[] = []
  const y = F2_FLOOR
  const yb = y + ft(3)
  const z = Z(5.1)
  const runs: [number, number][] = [[21.4, 33.25]]
  for (const [x0, x1] of runs) {
    rail.push(box(X(x0), yb - 0.06, z - 0.05, X(x1), yb, z + 0.05), box(X(x0), y + 0.06, z - 0.03, X(x1), y + 0.12, z + 0.03))
    const n = 3
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const a = X(x0 + i * w)
      const b = X(x0 + (i + 1) * w)
      rail.push(box(a - 0.04, y, z - 0.04, a + 0.04, yb, z + 0.04), box(b - 0.04, y, z - 0.04, b + 0.04, yb, z + 0.04))
      const m = 0.12
      rail.push(box(a + m, y + 0.12, z - 0.015, b - m, y + 0.16, z + 0.015), box(a + m, yb - 0.1, z - 0.015, b - m, yb - 0.06, z + 0.015))
      rail.push(box(a + m - 0.02, y + 0.12, z - 0.015, a + m + 0.02, yb - 0.06, z + 0.015), box(b - m - 0.02, y + 0.12, z - 0.015, b - m + 0.02, yb - 0.06, z + 0.015))
      rail.push(seg([a + m, y + 0.16, z], [b - m, yb - 0.1, z], 0.016), seg([b - m, y + 0.16, z], [a + m, yb - 0.1, z], 0.016))
    }
  }
  // Entry porch rails flanking the stair + 36" balustrade rails up the entry stair (A-5)
  for (const [x0, x1] of [[18.6, 25.75], [32.6, 36.2]] as const) {
    const zz = Z(4.75)
    rail.push(box(X(x0), FFE + ft(3) - 0.05, zz - 0.04, X(x1), FFE + ft(3), zz + 0.04))
    for (let x = x0 + 0.3; x < x1; x += 0.35) rail.push(box(X(x) - 0.015, FFE, zz - 0.015, X(x) + 0.015, FFE + ft(3), zz + 0.015))
  }
  for (const x of [ENTRY_STAIR.x0 + 0.15, ENTRY_STAIR.x1 - 0.15]) {
    rail.push(seg(P3(x, FRONT_WALK + ft(3), ENTRY_STAIR.d1 - 6.4), P3(x, FFE + ft(3), ENTRY_STAIR.d1), 0.025))
    rail.push(box(X(x) - 0.08, FRONT_WALK, Z(ENTRY_STAIR.d1 - 6.4) - 0.08, X(x) + 0.08, FRONT_WALK + ft(3.4), Z(ENTRY_STAIR.d1 - 6.4) + 0.08))
  }
  add({ id: 'railings', componentId: 'c-railings', geo: 'box', mat: 'frame', inst: rail.filter((r) => !r.q), anim: 'pop', castShadow: false })
  add({ id: 'railing-x', componentId: 'c-railings', geo: 'cyl', mat: 'frame', inst: rail.filter((r) => r.q), anim: 'pop', castShadow: false })

  // Rear balcony + breezeway stair: aluminum posts with plexiglass infill panels (A-6)
  const posts: Inst[] = []
  const plex: Inst[] = []
  const pr = (pts: Pt[], y0: number) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.max(1, Math.round(L / 5))
      for (let k = 0; k <= n; k++) {
        const t = k / n
        const x = a[0] + (b[0] - a[0]) * t
        const d = a[1] + (b[1] - a[1]) * t
        posts.push(box(X(x) - 0.03, y0, Z(d) - 0.03, X(x) + 0.03, y0 + ft(3.5), Z(d) + 0.03))
      }
      posts.push(box(Math.min(X(a[0]), X(b[0])) - 0.03, y0 + ft(3.5) - 0.05, Math.min(Z(a[1]), Z(b[1])) - 0.03, Math.max(X(a[0]), X(b[0])) + 0.03, y0 + ft(3.5), Math.max(Z(a[1]), Z(b[1])) + 0.03))
      plex.push(box(Math.min(X(a[0]), X(b[0])), y0 + 0.08, Math.min(Z(a[1]), Z(b[1])) - 0.006, Math.max(X(a[0]), X(b[0])), y0 + ft(3.2), Math.max(Z(a[1]), Z(b[1])) + 0.006))
    }
  }
  pr([[37.6, 46.3], [37.6, 57.8], [45.2, 57.8]], F2_FLOOR)
  pr([[17.9, 46.3], [21.0, 46.3]], LANAI_FLOOR)
  pr([[31.5, 46.3], [36.6, 46.3]], LANAI_FLOOR)
  add({ id: 'rear-rail-posts', componentId: 'c-railings', geo: 'box', mat: 'frame', inst: posts, anim: 'pop', castShadow: false })
  add({ id: 'rear-rail-plexi', componentId: 'c-railings', geo: 'box', mat: 'plexi', inst: plex, anim: 'fade', castShadow: false })

  // Screened lanai: roll-down screens between the lanai columns
  const scr: Inst[] = [rect({ x0: 37.4, d0: 57.85, x1: 59.1, d1: 57.95 }, LANAI_FLOOR, F1_CEIL), rect({ x0: 36.95, d0: 46.6, x1: 37.05, d1: 57.6 }, LANAI_FLOOR, F1_CEIL)]
  add({ id: 'lanai-screen', componentId: 'c-lanai-screen', geo: 'box', mat: 'screen', inst: scr, anim: 'fade', castShadow: false })
}

// ===========================================================================
// ENVELOPE — windows, doors, shutters, trim, stucco, siding
// ===========================================================================
{
  const frames: Inst[] = []
  const glass: Inst[] = []
  const doors: Inst[] = []
  const garagePanels: Inst[] = []
  const garageBacker: Inst[] = []
  const casing: Inst[] = []
  const stuccoTrim: Inst[] = []
  const shutters: Inst[] = []
  const octo: Inst[] = []
  let g = 0
  const FR = 0.055 // aluminum frame face
  const recess = (w: BWall) => -0.06 - (w.finish === 'siding' ? 0.0 : 0.02) // glass plane, set back into the CMU opening
  for (const w of [...EXT_1, ...WALLS_2, ...WALLS_G]) {
    const front = w.n[1] > 0.5
    const ext = w.skin === 'ext'
    for (const op of w.ops) {
      const src = op.src
      const gl = recess(w)
      const d0 = gl - 0.035
      const d1 = gl + 0.035
      const width = op.u1 - op.u0
      const height = op.v1 - op.v0
      // Opening returns: the 8" CMU reveal is finished (stucco / jamb) so the window reads recessed, not flush
      if (ext && op.kind !== 'octagon') {
        stuccoTrim.push(wallBox(w, op.u0 - 0.01, op.u0, op.v0, op.v1, gl, 0.03, { g: 0 }), wallBox(w, op.u1, op.u1 + 0.01, op.v0, op.v1, gl, 0.03, { g: 0 }), wallBox(w, op.u0, op.u1, op.v1, op.v1 + 0.01, gl, 0.03, { g: 0 }))
      }
      if (op.kind === 'garage') {
        // Carriage-style overhead door: recessed backer, 3 rows of raised panels, top row of lites (A-5)
        garageBacker.push(wallBox(w, op.u0, op.u1, op.v0, op.v1, gl - 0.06, gl - 0.03, { g: 0 }))
        const cols = Math.max(2, Math.round(width / 1.22))
        const rows = 4
        const gap = 0.05
        const cw = (width - gap * (cols + 1)) / cols
        const rh = (height - gap * (rows + 1)) / rows
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const u0 = op.u0 + gap + c * (cw + gap)
            const v0 = op.v0 + gap + r * (rh + gap)
            if (r === rows - 1) {
              glass.push(wallBox(w, u0 + 0.04, u0 + cw - 0.04, v0 + 0.06, v0 + rh - 0.06, gl - 0.035, gl - 0.025, { g: 98 }))
              frames.push(wallBox(w, u0 + cw / 2 - 0.012, u0 + cw / 2 + 0.012, v0, v0 + rh, gl - 0.03, gl - 0.015, { g: 98 }))
            } else garagePanels.push(wallBox(w, u0, u0 + cw, v0, v0 + rh, gl - 0.03, gl - 0.005, { g: r }))
          }
        if (ext) casing.push(...trimAround(w, op.u0, op.u1, op.v0, op.v1, 0.14, false))
        continue
      }
      if (op.kind === 'octagon') {
        // 36" octagon fixed (A-4/A-5): eight frame members around a glass disc, proud of the siding
        const um = (op.u0 + op.u1) / 2
        const vm = (op.v0 + op.v1) / 2
        const R = width / 2
        const yaw = Math.atan2(w.n[0], w.n[1])
        for (let k = 0; k < 8; k++) {
          const a0 = (k / 8) * Math.PI * 2 + Math.PI / 8
          const a1 = ((k + 1) / 8) * Math.PI * 2 + Math.PI / 8
          const p0 = wallPoint(w, um + Math.cos(a0) * R, vm + Math.sin(a0) * R, 0.07)
          const p1 = wallPoint(w, um + Math.cos(a1) * R, vm + Math.sin(a1) * R, 0.07)
          octo.push({ ...seg(p0, p1, 0.05), g })
        }
        const c = wallPoint(w, um, vm, 0.055)
        glass.push({ p: c, s: [R * 1.75, R * 1.75, 0.02], q: euler(0, yaw, 0), g })
        g++
        continue
      }
      // Perimeter frame
      frames.push(wallBox(w, op.u0, op.u1, op.v0, op.v0 + FR, d0, d1, { g }), wallBox(w, op.u0, op.u1, op.v1 - FR, op.v1, d0, d1, { g }))
      frames.push(wallBox(w, op.u0, op.u0 + FR, op.v0, op.v1, d0, d1, { g }), wallBox(w, op.u1 - FR, op.u1, op.v0, op.v1, d0, d1, { g }))
      const tH = ft(src.transom ?? 0)
      if (tH > 0) frames.push(wallBox(w, op.u0, op.u1, op.v1 - tH - FR / 2, op.v1 - tH + FR / 2, d0, d1, { g }))
      if (op.kind === 'entry') {
        // (2) 3080 + side lites, transoms to 10'-0", elliptical arch above (A-5)
        const cells = [0.19, 0.31, 0.31, 0.19]
        let u = op.u0
        const doorTop = op.v0 + ft(8)
        cells.forEach((f, i) => {
          const u1 = u + width * f
          if (i > 0) frames.push(wallBox(w, u - 0.04, u + 0.04, op.v0, op.v1, d0, d1, { g }))
          const isDoor = i === 1 || i === 2
          // door stile/rail frame
          if (isDoor) {
            doors.push(wallBox(w, u + 0.03, u1 - 0.03, op.v0, doorTop, gl + 0.01, gl + 0.05, { g: 0 }))
            glass.push(wallBox(w, u + 0.15, u1 - 0.15, op.v0 + 0.25, doorTop - 0.15, gl + 0.05, gl + 0.06, { g: 99 }))
          } else glass.push(wallBox(w, u + 0.04, u1 - 0.04, op.v0 + 0.05, doorTop - 0.04, gl - 0.01, gl + 0.01, { g: 99 }))
          glass.push(wallBox(w, u + 0.04, u1 - 0.04, doorTop + 0.04, op.v1 - 0.04, gl - 0.01, gl + 0.01, { g: 99 }))
          u = u1
        })
        frames.push(wallBox(w, op.u0, op.u1, doorTop - 0.04, doorTop + 0.04, d0, d1, { g }))
        // Elliptical arch transom over the assembly + 1x4 stucco face trim
        const rise = ft(1.67)
        const N = 16
        for (let k = 0; k < N; k++) {
          const t0 = k / N
          const t1 = (k + 1) / N
          const ua = op.u0 + width * t0
          const ub = op.u0 + width * t1
          const ha = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t0 - 1, 2))) * rise
          const hb = Math.sqrt(Math.max(0, 1 - Math.pow(2 * t1 - 1, 2))) * rise
          const hm = Math.min(ha, hb)
          if (hm > 0.02) glass.push(wallBox(w, ua, ub, op.v1, op.v1 + hm, gl - 0.01, gl + 0.01, { g: 99 }))
          const pa = wallPoint(w, ua, op.v1 + ha, 0.04)
          const pb = wallPoint(w, ub, op.v1 + hb, 0.04)
          octo.push({ ...seg(pa, pb, 0.05), g: 0 })
        }
        stuccoTrim.push(wallBox(w, op.u0, op.u1, op.v1, op.v1 + rise, gl - 0.03, gl - 0.02, { g: 0 }))
        g++
        continue
      }
      if (op.kind === 'door') {
        const doorTop = op.v1 - tH
        doors.push(wallBox(w, op.u0 + FR, op.u1 - FR, op.v0, doorTop, gl - 0.02, gl + 0.02, { g: 0 }))
        glass.push(wallBox(w, op.u0 + 0.14, op.u1 - 0.14, op.v0 + 0.2, doorTop - 0.14, gl + 0.02, gl + 0.03, { g: 99 }))
        if (tH > 0) glass.push(wallBox(w, op.u0 + FR, op.u1 - FR, doorTop + FR, op.v1 - FR, gl - 0.01, gl + 0.01, { g }))
        if (ext) casing.push(...trimAround(w, op.u0, op.u1, op.v0, op.v1, 0.11, false))
        g++
        continue
      }
      // Windows / fixed / sliders: mulled units, operable sash frames
      const units = src.units ?? (op.kind === 'slider' ? Math.max(2, Math.round(width / 1.22)) : Math.max(1, Math.round(width / 1.0)))
      const uw = width / units
      for (let i = 1; i < units; i++) {
        const u = op.u0 + uw * i
        frames.push(wallBox(w, u - (op.kind === 'slider' ? 0.03 : 0.04), u + (op.kind === 'slider' ? 0.03 : 0.04), op.v0, op.v1, d0, d1, { g }))
      }
      const vTop = op.v1 - tH
      for (let i = 0; i < units; i++) {
        const a = op.u0 + uw * i
        const b = a + uw
        // inner sash (casement / slider panel) — a second, thinner frame reads as an operable unit
        if (op.kind !== 'fixed') {
          const s = 0.035
          frames.push(wallBox(w, a + FR, b - FR, op.v0 + FR, op.v0 + FR + s, gl - 0.01, gl + 0.02, { g }), wallBox(w, a + FR, b - FR, vTop - FR - s, vTop - FR, gl - 0.01, gl + 0.02, { g }))
          frames.push(wallBox(w, a + FR, a + FR + s, op.v0 + FR, vTop - FR, gl - 0.01, gl + 0.02, { g }), wallBox(w, b - FR - s, b - FR, op.v0 + FR, vTop - FR, gl - 0.01, gl + 0.02, { g }))
        }
        // Colonial grilles on the street elevation only (A-5); rear/side casements are clear (A-6)
        if (front && w.finish === 'siding') {
          const cols = 2
          const rows = 3
          for (let c = 1; c < cols; c++) frames.push(wallBox(w, a + (uw * c) / cols - 0.012, a + (uw * c) / cols + 0.012, op.v0 + FR, vTop - FR, gl + 0.012, gl + 0.026, { g }))
          for (let r = 1; r < rows; r++) {
            const v = op.v0 + ((vTop - op.v0) * r) / rows
            frames.push(wallBox(w, a + FR, b - FR, v - 0.012, v + 0.012, gl + 0.012, gl + 0.026, { g }))
          }
        }
      }
      glass.push(wallBox(w, op.u0 + FR, op.u1 - FR, op.v0 + FR, op.v1 - FR, gl - 0.008, gl + 0.008, { g }))
      if (ext && w.finish === 'siding') casing.push(...trimAround(w, op.u0, op.u1, op.v0, op.v1, 0.1, op.kind !== 'slider'))
      if (ext && w.finish === 'stucco') {
        // 2x8 stucco head trim & 2x4 stucco sill trim (A-6 note)
        stuccoTrim.push(wallBox(w, op.u0 - 0.1, op.u1 + 0.1, op.v1, op.v1 + 0.19, 0.03, 0.07, { g: 1 }))
        if (op.v0 > 0.1) stuccoTrim.push(wallBox(w, op.u0 - 0.06, op.u1 + 0.06, op.v0 - 0.09, op.v0, 0.03, 0.08, { g: 1 }))
      }
      // Top-hinged Bahama shutters on the street elevation windows (A-5)
      if (front && w.finish === 'siding' && op.kind !== 'slider' && width > 0.8) shutters.push(...bahama(w, op.u0 - 0.04, op.u1 + 0.04, op.v1 + 0.04, Math.min(ft(4.2), height * 0.58), g))
      g++
    }
  }
  function trimAround(w: Wall, u0: number, u1: number, v0: number, v1: number, b: number, sill: boolean): Inst[] {
    const o0 = 0.045
    const o1 = 0.072
    const res = [wallBox(w, u0 - b, u1 + b, v1, v1 + b * 1.3, o0, o1, { g: 0 }), wallBox(w, u0 - b, u0, v0, v1, o0, o1, { g: 0 }), wallBox(w, u1, u1 + b, v0, v1, o0, o1, { g: 0 })]
    if (sill) res.push(wallBox(w, u0 - b - 0.04, u1 + b + 0.04, v0 - 0.07, v0, o0, o1 + 0.04, { g: 0 }))
    return res
  }
  function bahama(w: Wall, u0: number, u1: number, vTop: number, h: number, gg: number): Inst[] {
    const tilt = 0.32
    const yaw = Math.atan2(w.n[0], w.n[1])
    const q = euler(-tilt, yaw, 0)
    const um = (u0 + u1) / 2
    const out0 = 0.1
    const res: Inst[] = []
    const at = (dv: number): V3 => wallPoint(w, um, vTop - Math.cos(tilt) * dv, out0 + Math.sin(tilt) * dv)
    const W = u1 - u0
    res.push({ p: at(0.03), s: [W, 0.06, 0.035], q, g: gg }, { p: at(h - 0.03), s: [W, 0.06, 0.035], q, g: gg })
    const L = wallLen(w)
    const dx = (w.b[0] - w.a[0]) / L
    const dz = (w.b[1] - w.a[1]) / L
    for (const du of [-W / 2 + 0.03, W / 2 - 0.03, 0]) {
      const p = at(h / 2)
      res.push({ p: [p[0] + dx * du, p[1], p[2] + dz * du], s: [0.06, h, 0.035], q, g: gg })
    }
    const n = Math.max(6, Math.round(h / 0.085))
    const ql = euler(-tilt - 0.55, yaw, 0)
    for (let i = 1; i < n; i++) res.push({ p: at((h * i) / n), s: [W - 0.06, 0.012, 0.07], q: ql, g: gg })
    // stays
    const s0 = wallPoint(w, u0 + 0.1, vTop - h * 0.9, 0.02)
    res.push({ ...seg(s0, at(h * 0.92), 0.008), g: gg })
    return res
  }
  // Corner boards on sided walls, 2x4 + 1x12 Hardie trim at the bottom of the siding, 1x10 frieze under the eaves (A-5)
  for (const w of SIDING) {
    const h = skinH(w)
    const L = wallLen(w)
    casing.push(wallBox(w, -0.07, 0.11, 0, h, 0.045, 0.075, { g: 1 }), wallBox(w, L - 0.11, L + 0.07, 0, h, 0.045, 0.075, { g: 1 }))
    if (w.floor === 1 && w.y0 >= FFE - 0.01) casing.push(wallBox(w, -0.07, L + 0.07, -ft(1.33), 0.04, 0.045, 0.085, { g: 2 }), wallBox(w, -0.07, L + 0.07, 0.0, 0.09, 0.07, 0.11, { g: 2 }))
    if (w.floor === 2) casing.push(wallBox(w, -0.07, L + 0.07, -ft(1.33) - 0.1, -0.1, 0.045, 0.08, { g: 3 }), wallBox(w, -0.07, L + 0.07, h - 0.3, h, 0.045, 0.075, { g: 4 }))
  }
  // 1x8 stucco banding at the floor lines and plate on the stucco walls (A-6)
  for (const w of STUCCO) {
    const L = wallLen(w)
    if (w.floor === 2) stuccoTrim.push(wallBox(w, -0.05, L + 0.05, -0.22, 0.0, 0.03, 0.07, { g: 3 }), wallBox(w, -0.05, L + 0.05, skinH(w) - 0.22, skinH(w), 0.03, 0.07, { g: 3 }))
    else if (w.y0 >= FFE - 0.01) stuccoTrim.push(wallBox(w, -0.05, L + 0.05, -0.08, 0.14, 0.03, 0.07, { g: 3 }))
  }
  add({ id: 'window-frames', componentId: 'c-windows', geo: 'box', mat: 'frame', inst: frames, anim: 'drop', dropH: 0.5 })
  add({ id: 'window-octagon', componentId: 'c-windows', geo: 'cyl', mat: 'frame', inst: octo.filter((x) => x.g !== 0), anim: 'drop', dropH: 0.5, castShadow: false })
  add({ id: 'glazing', componentId: 'c-windows', geo: 'box', mat: 'glass', inst: glass.filter((x) => x.g !== 99), anim: 'fade', window: [0.1, 1], castShadow: false })
  add({ id: 'entry-glass', componentId: 'c-entry-door', geo: 'box', mat: 'glass', inst: glass.filter((x) => x.g === 99), anim: 'fade', window: [0.4, 1], castShadow: false })
  add({ id: 'entry-arch', componentId: 'c-entry-door', geo: 'cyl', mat: 'frame', inst: octo.filter((x) => x.g === 0), anim: 'pop', window: [0.4, 1], castShadow: false })
  add({ id: 'doors', componentId: 'c-entry-door', geo: 'box', mat: 'frame', inst: doors, anim: 'pop', window: [0.5, 1] })
  add({ id: 'garage-backer', componentId: 'c-garage-doors', geo: 'box', mat: 'frame', inst: garageBacker, anim: 'rise' })
  add({ id: 'garage-panels', componentId: 'c-garage-doors', geo: 'box', mat: 'frameSatin', inst: garagePanels, anim: 'rise' })
  add({ id: 'casing', componentId: 'c-siding', geo: 'box', mat: 'trimWhite', inst: casing, anim: 'pop', window: [0.35, 1], castShadow: false })
  add({ id: 'stucco-trim', componentId: 'c-stucco', geo: 'box', mat: 'stuccoRaw', inst: stuccoTrim, anim: 'pop', window: [0.5, 1], castShadow: false, colorTo: { task: T('Paint: Exterior'), color: '#f6f5f1' } })
  add({ id: 'shutters', componentId: 'c-railings', geo: 'box', mat: 'frameSatin', inst: shutters, anim: 'drop', dropH: 0.4 })
}
const STUCCO_SKIN = [...STUCCO, ...FOUND.filter((w) => w.skin === 'ext')]
add({ id: 'lath', componentId: 'c-lath', geo: 'box', mat: 'wrap', anim: 'pop', castShadow: false, inst: skin(STUCCO_SKIN, 0.004, 0.014, { h: (w) => ((w as BWall).skinTop ?? w.y0 + w.h) - w.y0 }) })
add({ id: 'stucco', componentId: 'c-stucco', geo: 'box', mat: 'stuccoRaw', anim: 'rise', colorTo: { task: T('Paint: Exterior'), color: '#f4f3ee' }, inst: skin(STUCCO_SKIN, 0.014, 0.032, { h: (w) => ((w as BWall).skinTop ?? w.y0 + w.h) - w.y0 }) })
add({ id: 'siding', componentId: 'c-siding', geo: 'box', mat: 'sidingPrimed', anim: 'rise', colorTo: { task: T('Paint: Exterior'), color: '#f6f5f0' }, inst: skin(SIDING, 0.016, 0.042, { h: skinH }) })
// Pier / beam finishes on the porch and balconies (stucco on CMU & concrete beam)
add({
  id: 'pier-finish',
  componentId: 'c-stucco',
  geo: 'box',
  mat: 'stuccoRaw',
  anim: 'rise',
  colorTo: { task: T('Paint: Exterior'), color: '#f6f5f1' },
  inst: [
    ...[...PORCH_PIERS].map((r, i) => box(X(r.x0) - 0.03, FFE, Z(r.d1) - 0.03, X(r.x1) + 0.03, F1_TOP, Z(r.d0) + 0.03, { g: i })),
    ...BAL_PIERS.map((r, i) => box(X(r.x0) - 0.03, F2_FLOOR, Z(r.d1) - 0.03, X(r.x1) + 0.03, BAL_TOP - ft(2), Z(r.d0) + 0.03, { g: 10 + i })),
    box(X(18.0) - 0.03, BAL_TOP - ft(2), Z(5.9) - 0.03, X(36.75) + 0.03, BAL_TOP, Z(4.75) + 0.03, { g: 20 }),
    box(X(18.0), F1_CEIL, Z(5.9) - 0.03, X(36.75), F2_FLOOR, Z(4.6) + 0.03, { g: 20 }),
    box(X(18.0) - 0.03, F1_TOP - 0.05, Z(5.9) + 0.03, X(36.75) + 0.03, F2_FLOOR + 0.12, Z(4.6) + 0.05, { g: 21 }),
  ],
})

// ===========================================================================
// MEP rough-in — equipment & fixtures from A-3/A-4; ROUTES ARE SCHEMATIC
// ===========================================================================
const Y1 = F1_CEIL + 0.25 // floor-truss space
const YA = F2_TOP + 0.35 // attic
const FIX1: Pt[] = [[4, 9], [4, 13.5], [3, 19.5], [13, 12], [8, 5.5], [67.5, 44.5], [72.5, 44.5], [54.5, 33], [42, 25.5], [73.5, 28], [70, 24]]
const FIX2: Pt[] = [[4, 9], [4, 13.5], [12, 18.5], [13, 11], [23.5, 22.5], [20.5, 24.5], [16, 25.5], [63.5, 34.5], [63.5, 37.5], [70, 39], [72.5, 33.5], [59.5, 52.5], [50, 18.5]]
{
  const r = 0.028
  const sup: Inst[] = []
  // Water entry + tankless WH on the right exterior wall (A-3), trunk in the floor-truss space
  const trunk: V3[] = [P3(78, -0.3, 34), P3(75.6, -0.3, 34), P3(75.6, FFE + 1.2, 34), P3(73, FFE + 1.2, 34), P3(73, Y1, 34), P3(40, Y1, 34), P3(40, Y1, 16), P3(6, Y1, 16)]
  sup.push(...polyline(trunk, r, { g: 0, c: '#3f86d6' }), ...polyline(trunk.map(([x, y, z]) => [x, y, z + 0.08] as V3), r, { g: 0, c: '#d65a4a' }))
  FIX1.forEach(([x, d], i) => {
    sup.push(seg(P3(x, Y1, 34 > d ? Math.min(d, 34) : 34), P3(x, Y1, d), r * 0.8, { g: 1 + i, c: '#3f86d6' }), seg(P3(x, Y1, d), P3(x, FFE + 0.6, d), r * 0.8, { g: 1 + i, c: '#3f86d6' }))
  })
  FIX2.forEach(([x, d], i) => sup.push(seg(P3(x, Y1, d), P3(x, F2_FLOOR + 0.6, d), r * 0.8, { g: 20 + i, c: '#d65a4a' })))
  sup.push(box(X(75.3), FFE + 0.9, Z(34.8), X(76.0), FFE + 1.6, Z(33.4), { g: 0, c: '#c9cdd2' }))
  const dwv = [...FIX1.slice(0, 5), ...FIX2.slice(4, 7), [70.5, 26] as Pt, [64, 35] as Pt].map(([x, d], i) => seg(P3(x, FFE - 0.1, d), P3(x, F2_TOP + 1.0, d), 0.05, { g: 40 + i, c: '#f4f3ef' }))
  add({ id: 'plumbing', componentId: 'c-plumbing', geo: 'cyl', mat: 'white', inst: [...sup.filter((s) => s.q), ...dwv], anim: 'rise', castShadow: false })
  add({ id: 'water-heater', componentId: 'c-plumbing', geo: 'box', mat: 'equipment', inst: sup.filter((s) => !s.q), anim: 'drop', dropH: 0.6 })
  const gas = polyline([P3(86, -0.4, -10), P3(84, -0.4, 34), P3(75.4, -0.4, 34), P3(75.4, FFE + 0.6, 34)], 0.025, { g: 0 })
  gas.push(...polyline([P3(73, Y1 - 0.1, 34), P3(57, Y1 - 0.1, 34), P3(57, FFE + 0.9, 30)], 0.025, { g: 1 }), ...polyline([P3(57, Y1 - 0.1, 34), P3(59, Y1 - 0.1, 54.5), P3(59.3, LANAI_FLOOR + 0.9, 54.5)], 0.025, { g: 2 }))
  add({ id: 'gas', componentId: 'c-gas', geo: 'cyl', mat: 'white', inst: gas.map((x) => ({ ...x, c: '#e4c33a' })), anim: 'rise', castShadow: false })
}
{
  // 3 air handlers in the 2F MECH room (A-4) feeding trunks in the attic and floor-truss space (routes schematic)
  const duct = (pts: V3[], w = 0.4, h = 0.22, g0 = 0) =>
    pts.slice(1).map((b, i) => {
      const a = pts[i]
      return box(Math.min(a[0], b[0]) - w / 2, Math.min(a[1], b[1]) - h / 2, Math.min(a[2], b[2]) - w / 2, Math.max(a[0], b[0]) + w / 2, Math.max(a[1], b[1]) + h / 2, Math.max(a[2], b[2]) + w / 2, { g: g0 + i })
    })
  const ah: Inst[] = [47.3, 50.0, 52.7].map((x, i) => box(X(x) - 0.33, F2_FLOOR, Z(14.5), X(x) + 0.33, F2_FLOOR + 1.6, Z(12.5), { g: i }))
  const trunks = [
    ...duct([P3(49.5, F2_FLOOR + 1.7, 13.5), P3(49.5, YA, 13.5), P3(49.5, YA, 30), P3(8, YA, 30), P3(8, YA, 12)], 0.45, 0.25, 0),
    ...duct([P3(49.5, YA, 30), P3(68, YA, 30), P3(68, YA, 58)], 0.45, 0.25, 10),
    ...duct([P3(50, F2_FLOOR, 15), P3(50, Y1, 15), P3(50, Y1, 30), P3(10, Y1, 30), P3(10, Y1, 40)], 0.42, 0.2, 20),
    ...duct([P3(50, Y1, 30), P3(68, Y1, 30), P3(68, Y1, 55)], 0.42, 0.2, 30),
  ]
  const flex: Inst[] = []
  for (const [x, d] of [[8, 38], [8, 22], [24, 36], [27, 15], [42, 30], [55, 30], [70, 36], [68, 54], [10, 10]] as const) flex.push(seg(P3(x, Y1, 30), P3(x, F1_CEIL + 0.04, d), 0.08, { g: 5 }))
  for (const [x, d] of [[8, 38], [8, 12], [27, 30], [27, 16], [42, 32], [52, 52], [66, 16], [68, 40], [68, 56]] as const) flex.push(seg(P3(x, YA, 30), P3(x, F2_TOP + 0.04, d), 0.08, { g: 6 }))
  add({ id: 'air-handlers', componentId: 'c-hvac', geo: 'box', mat: 'equipment', inst: ah, anim: 'drop', dropH: 0.8 })
  add({ id: 'hvac-trunks', componentId: 'c-hvac', geo: 'box', mat: 'duct', inst: trunks, anim: 'sweep', castShadow: false })
  add({ id: 'hvac-flex', componentId: 'c-hvac', geo: 'cyl', mat: 'ductFlex', inst: flex, anim: 'rise', castShadow: false })
  const cond: Inst[] = [27.5, 32.5, 37.5].map((d, i) => box(X(76.3), ft(4) + 0.1, Z(d + 1.6), X(79.5), ft(4) + 1.05, Z(d - 1.6), { g: i }))
  const screens: Inst[] = [rect({ x0: 81.4, d0: 24, x1: 82.0, d1: 40 }, ft(4) + 0.1, ft(8), { g: 3 }), rect({ x0: 75.1, d0: 39.4, x1: 82.0, d1: 40 }, ft(4) + 0.1, ft(8), { g: 3 })]
  add({ id: 'condensers', componentId: 'c-hvac-equip', geo: 'box', mat: 'equipment', anim: 'drop', dropH: 1.2, inst: cond })
  add({ id: 'ac-screen-walls', componentId: 'c-hvac-equip', geo: 'box', mat: 'stuccoRaw', anim: 'rise', inst: screens, colorTo: { task: T('Paint: Exterior'), color: '#f4f3ee' } })
}
{
  const el: Inst[] = []
  ;[...WALLS_1, ...WALLS_2].forEach((w, wi) => {
    const wo = -w.t - 0.015
    for (const [u0, u1] of freeSpans(w, 0.3, 0.42)) {
      if (u1 - u0 < 0.4) continue
      el.push(seg(wallPoint(w, u0 + 0.1, 0.36, wo), wallPoint(w, u1 - 0.1, 0.36, wo), 0.02, { g: wi }))
      for (let u = u0 + 0.6; u < u1 - 0.3; u += 2.4) {
        const p = wallPoint(w, u, 0.36, wo)
        el.push(box(p[0] - 0.05, p[1] - 0.06, p[2] - 0.05, p[0] + 0.05, p[1] + 0.06, p[2] + 0.05, { g: wi }))
      }
    }
    const mid = wallPoint(w, wallLen(w) / 2, 0.36, wo)
    el.push(seg(mid, [mid[0], w.y0 + w.h - 0.05, mid[2]], 0.02, { g: wi }))
  })
  // 400 A panel in the garage (A-3, right wall) + meter outside, bottom above the DFE
  el.push(box(X(82.0), GAR_SLAB + ft(5.5), Z(10.6), X(82.3), GAR_SLAB + ft(9.5), Z(8.6), { g: 0, c: '#8e959c' }), box(X(82.75), FFE + 0.2, Z(10.0), X(83.1), FFE + 0.8, Z(9.2), { g: 0, c: '#8e959c' }))
  add({ id: 'electrical-runs', componentId: 'c-electrical', geo: 'cyl', mat: 'wire', inst: el.filter((x) => x.q), anim: 'rise', castShadow: false })
  add({ id: 'electrical-boxes', componentId: 'c-electrical', geo: 'box', mat: 'wire', inst: el.filter((x) => !x.q), anim: 'pop', castShadow: false })
  const lv = polyline([P3(82.2, GAR_SLAB + 1.5, 12), P3(82.2, GAR_TOP - 0.3, 12), P3(53, GAR_TOP - 0.3, 12), P3(53, GAR_TOP - 0.3, 22), P3(53, Y1, 23.5), P3(30, Y1, 23.5), P3(30, Y1, 30), P3(30, Y1, 38)], 0.02, { g: 0 })
  lv.push(...polyline([P3(30, Y1, 30), P3(30, YA, 30), P3(66, YA, 30)], 0.02, { g: 1 }))
  add({ id: 'low-voltage', componentId: 'c-lowvoltage', geo: 'cyl', mat: 'lv', inst: lv, anim: 'rise', castShadow: false })
}

// ===========================================================================
// INTERIOR
// ===========================================================================
add({
  id: 'insulation',
  componentId: 'c-insulation',
  geo: 'box',
  mat: 'foil',
  anim: 'pop',
  castShadow: false,
  inst: skin([...EXT_1, ...WALLS_2].filter((w) => w.skin === 'ext'), -CMU_T - 0.02, -CMU_T - 0.005),
})
{
  const dw: Inst[] = []
  ;[...EXT_1, ...WALLS_2, ...WALLS_G].forEach((w, i) => skin([w], -w.t - 0.035, -w.t - 0.02, { h: (x) => (x.floor === 2 ? F2_TOP - x.y0 : Math.min(F1_CEIL, x.y0 + x.h) - x.y0) }).forEach((x) => dw.push({ ...x, g: i })))
  ;[...PART_1, ...PART_2].forEach((w, i) => {
    skin([w], -w.t - 0.013, -w.t).forEach((x) => dw.push({ ...x, g: 40 + i }))
    skin([w], 0, 0.013).forEach((x) => dw.push({ ...x, g: 40 + i }))
  })
  F1_RECTS.forEach((r, i) => dw.push(rect(r, F1_CEIL - 0.016, F1_CEIL, { g: 70 + i })))
  F2_RECTS.forEach((r, i) => dw.push(rect(r, F2_TOP - 0.02, F2_TOP - 0.004, { g: 80 + i })))
  add({ id: 'drywall', componentId: 'c-drywall', geo: 'box', mat: 'drywall', inst: dw, anim: 'pop', overlap: 0.08, colorTo: { task: T('Paint: Interior'), color: '#e6e6e1' } })
}
{
  const wet: Rect[] = [{ x0: 2.1, d0: 7.0, x1: 18.0, d1: 17.8 }, { x0: 61.5, d0: 41.2, x1: 75.1, d1: 46.25 }]
  const lvp1 = F1_RECTS.flatMap((r) => rectMinus(sceneRect(r), wet.map(sceneRect)))
  add({ id: 'lvp', componentId: 'c-flooring', geo: 'box', mat: 'lvp', anim: 'pop', castShadow: false, inst: [...lvp1.map((r) => [r, FFE] as const), ...F2_RECTS.map((r) => [sceneRect(r), F2_FLOOR] as const)].flatMap(([r, y], i) => tile(r, 1.83, 0.23, 0.003, y + 0.001, y + 0.012, false).map((t) => ({ ...t, g: (t.g ?? 0) + i * 80 }))) })
  add({
    id: 'tile',
    componentId: 'c-tile',
    geo: 'box',
    mat: 'tile',
    anim: 'pop',
    castShadow: false,
    inst: [
      ...wet.flatMap((r) => tile(sceneRect(r), 0.6, 0.6, 0.004, FFE + 0.002, FFE + 0.014)),
      ...[PORCH, BREEZEWAY, LANAI].flatMap((r, i) => tile(sceneRect(r), 0.6, 0.3, 0.006, (i === 0 ? FFE : LANAI_FLOOR) - 0.03, (i === 0 ? FFE : LANAI_FLOOR) - 0.012).map((t) => ({ ...t, c: '#c9bfae' }))),
      ...tile(sceneRect(FRONT_BALCONY), 0.6, 0.6, 0.004, F2_FLOOR - 0.04, F2_FLOOR - 0.025).map((t) => ({ ...t, c: '#c9bfae' })),
      ...tile(sceneRect(REAR_BALCONY), 0.6, 0.6, 0.004, F2_FLOOR - 0.04, F2_FLOOR - 0.025).map((t) => ({ ...t, c: '#c9bfae' })),
    ],
  })
}
add({
  id: 'cabinets',
  componentId: 'c-cabinets',
  geo: 'box',
  mat: 'ashCabinet',
  anim: 'drop',
  dropH: 0.5,
  inst: [
    rect({ x0: 52.0, d0: 28.0, x1: 57.0, d1: 36.5 }, FFE, FFE + ft(3) - 0.04, { g: 0 }), // 5'-0" × 8'-6" eat-in island
    rect({ x0: 59.8, d0: 27.5, x1: 61.8, d1: 38.5 }, FFE, FFE + ft(3) - 0.04, { g: 1 }),
    rect({ x0: 38.0, d0: 23.8, x1: 57.0, d1: 25.8 }, FFE, FFE + ft(3) - 0.04, { g: 2 }),
    rect({ x0: 47.0, d0: 23.8, x1: 57.0, d1: 25.2 }, FFE + ft(4.5), FFE + ft(8), { g: 3 }),
    rect({ x0: 2.8, d0: 8.0, x1: 4.6, d1: 15.0 }, FFE, FFE + ft(2.8), { g: 4 }),
    rect({ x0: 2.8, d0: 8.0, x1: 4.6, d1: 15.0 }, F2_FLOOR, F2_FLOOR + ft(2.8), { g: 5 }),
    rect({ x0: 56.0, d0: 56.0, x1: 61.0, d1: 57.8 }, F2_FLOOR, F2_FLOOR + ft(3) - 0.04, { g: 6 }),
  ],
})
add({
  id: 'counters',
  componentId: 'c-counters',
  geo: 'box',
  mat: 'quartz',
  anim: 'drop',
  dropH: 0.3,
  inst: [
    rect({ x0: 51.8, d0: 27.8, x1: 57.2, d1: 36.7 }, FFE + ft(3) - 0.04, FFE + ft(3), { g: 0 }),
    rect({ x0: 59.7, d0: 27.5, x1: 61.8, d1: 38.5 }, FFE + ft(3) - 0.04, FFE + ft(3), { g: 1 }),
    rect({ x0: 38.0, d0: 23.7, x1: 57.0, d1: 25.9 }, FFE + ft(3) - 0.04, FFE + ft(3), { g: 2 }),
    rect({ x0: 2.7, d0: 7.9, x1: 4.7, d1: 15.1 }, FFE + ft(2.8), FFE + ft(2.8) + 0.04, { g: 3 }),
    rect({ x0: 2.7, d0: 7.9, x1: 4.7, d1: 15.1 }, F2_FLOOR + ft(2.8), F2_FLOOR + ft(2.8) + 0.04, { g: 4 }),
  ],
})
add({ id: 'summer-kitchen', componentId: 'c-summer-kitchen', geo: 'box', mat: 'stuccoRaw', anim: 'rise', inst: [rect({ x0: 57.6, d0: 47.5, x1: 59.6, d1: 56.0 }, LANAI_FLOOR, LANAI_FLOOR + ft(3), { g: 0, c: '#9a8f82' }), rect({ x0: 57.4, d0: 47.3, x1: 59.7, d1: 56.2 }, LANAI_FLOOR + ft(3), LANAI_FLOOR + ft(3) + 0.04, { g: 1, c: '#f2f0eb' })] })
add({
  id: 'fixtures',
  componentId: 'c-fixtures',
  geo: 'box',
  mat: 'ceramic',
  anim: 'grow',
  inst: [
    { ...rect({ x0: 5.2, d0: 4.2, x1: 11.4, d1: 6.6 }, FFE, FFE + 0.55), g: 0, a: P3(8.3, FFE, 5.4) }, // freestanding tub in the bay
    { ...rect({ x0: 2.6, d0: 18.6, x1: 4.2, d1: 20.4 }, FFE, FFE + 0.42), g: 1, a: P3(3.4, FFE, 19.5) },
    { ...rect({ x0: 66.5, d0: 43.8, x1: 68.5, d1: 45.4 }, FFE + 0.8, FFE + 0.9), g: 2, a: P3(67.5, FFE + 0.8, 44.6) },
    { ...rect({ x0: 71.8, d0: 43.8, x1: 73.4, d1: 45.4 }, FFE, FFE + 0.42), g: 2, a: P3(72.6, FFE, 44.6) },
    { ...rect({ x0: 53.8, d0: 32.0, x1: 55.4, d1: 34.0 }, FFE + ft(3), FFE + ft(3) + 0.02), g: 3, a: P3(54.6, FFE + 0.92, 33), c: '#1d1f22' },
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
    ...[[53, 30], [53, 32.5], [53, 35]].map(([x, d]) => seg(P3(x, F1_CEIL - 0.9, d), P3(x, F1_CEIL - 0.55, d), 0.14, { g: 0 })),
    ...[[8, 38], [8, 22], [27, 36], [27, 24], [27, 15], [45, 32], [68, 36], [68, 54], [42, 50], [52, 50], [27, 44]].map(([x, d]) => seg(P3(x, F1_CEIL - 0.03, d), P3(x, F1_CEIL - 0.015, d), 0.07, { g: 1 })),
    ...[[8, 38], [8, 22], [27, 30], [27, 16], [45, 32], [52, 52], [66, 16], [68, 40], [68, 56]].map(([x, d]) => seg(P3(x, F2_TOP - 0.035, d), P3(x, F2_TOP - 0.02, d), 0.07, { g: 2 })),
    ...[[27, 8], [27, 46]].map(([x, d]) => seg(P3(x, F2_FLOOR - 0.33, d), P3(x, F2_FLOOR - 0.31, d), 0.07, { g: 3 })),
    // coach lights flanking the entry and the garage doors (A-5)
    ...[[21.6, 12.0, FFE + ft(6.5)], [33.6, 12.0, FFE + ft(6.5)], [52.6, -0.6, GAR_SLAB + ft(7.5)], [70.75, -0.6, GAR_SLAB + ft(7.5)], [81.8, -0.6, GAR_SLAB + ft(7.5)]].map(([x, d, y]) => seg(P3(x, y - 0.25, d - 0.12), P3(x, y + 0.25, d - 0.12), 0.07, { g: 4 })),
  ],
})
add({
  id: 'staging',
  componentId: 'c-staging',
  geo: 'box',
  mat: 'fabric',
  anim: 'grow',
  inst: [
    { ...rect({ x0: 22, d0: 33, x1: 32, d1: 36 }, FFE, FFE + 0.42), g: 0, a: P3(27, FFE, 34.5) },
    { ...rect({ x0: 24, d0: 28, x1: 30, d1: 31 }, FFE, FFE + 0.38), g: 0, a: P3(27, FFE, 29.5), c: '#8a6a4f' },
    { ...rect({ x0: 40, d0: 29, x1: 47, d1: 35 }, FFE, FFE + 0.76), g: 1, a: P3(43.5, FFE, 32), c: '#6b4e37' },
    { ...rect({ x0: 41, d0: 50, x1: 49, d1: 54 }, LANAI_FLOOR, LANAI_FLOOR + 0.4), g: 2, a: P3(45, LANAI_FLOOR, 52) },
    { ...rect({ x0: 6, d0: 34, x1: 13, d1: 41 }, FFE, FFE + 0.55), g: 3, a: P3(9.5, FFE, 37.5), c: '#e9e4da' },
  ],
})

// ===========================================================================
// SITE — pool (illustrative), hardscape, landscaping
// ===========================================================================
{
  const [x0, z0, x1, z1] = sceneRect(POOL)
  const d = -1.6
  const t = 0.2
  add({ id: 'pool-shell', componentId: 'c-pool', geo: 'box', mat: 'poolShell', anim: 'pop', window: [0, 0.3], castShadow: false, colorTo: { task: T('Landscaping: Landscaping Installation'), color: '#9fc6d9' }, inst: [box(x0, d, z0, x1, d + t, z1, { g: 0 }), box(x0, d, z0, x0 + t, 0.05, z1, { g: 1 }), box(x1 - t, d, z0, x1, 0.05, z1, { g: 1 }), box(x0, d, z0, x1, 0.05, z0 + t, { g: 1 }), box(x0, d, z1 - t, x1, 0.05, z1, { g: 1 })] })
  add({ id: 'pool-water', componentId: 'c-pool', geo: 'box', mat: 'poolWater', anim: 'rise', window: [0.4, 0.8], castShadow: false, glow: { task: T('Photos'), color: '#4fb6e0', intensity: 0.6 }, inst: [box(x0 + t, d + t, z0 + t, x1 - t, -0.08, z1 - t)] })
  const deckRects = rectMinus(sceneRect(POOL_DECK), [[x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35], sceneRect(POOL_STAIRS)])
  add({ id: 'pool-deck', componentId: 'c-pool', geo: 'box', mat: 'poolDeck', anim: 'pop', window: [0.3, 0.7], castShadow: false, inst: [...deckRects.flatMap((r) => tile(r, 0.6, 0.6, 0.008, 0, 0.05)), ...rectMinus([x0 - 0.35, z0 - 0.35, x1 + 0.35, z1 + 0.35], [[x0, z0, x1, z1]]).map((r) => box(r[0], 0, r[1], r[2], 0.07, r[3], { g: 999 }))] })
}
add({ id: 'drive', componentId: 'c-drive', geo: 'box', mat: 'paverGray', anim: 'pop', castShadow: false, inst: [...tile(sceneRect(DRIVE), 0.6, 0.3, 0.006, 0, 0.05, false), ...tile(sceneRect(WALK), 0.6, 0.3, 0.006, 0, 0.05, false).map((t) => ({ ...t, g: (t.g ?? 0) + 200 })), ...tile(sceneRect({ x0: ENTRY_STAIR.x0 - 1.5, d0: -6.5, x1: ENTRY_STAIR.x1 + 1.5, d1: -0.3 }), 0.6, 0.3, 0.006, 0, FRONT_WALK).map((t) => ({ ...t, g: (t.g ?? 0) + 300 }))] })
add({ id: 'drive-border', componentId: 'c-drive', geo: 'box', mat: 'concrete', anim: 'sweep', castShadow: false, inst: [rect({ x0: DRIVE.x0 - 0.67, d0: DRIVE.d0, x1: DRIVE.x0, d1: DRIVE.d1 }, 0, 0.055, { g: 0 }), rect({ x0: DRIVE.x1, d0: DRIVE.d0, x1: DRIVE.x1 + 0.67, d1: DRIVE.d1 }, 0, 0.055, { g: 1 })] })
add({ id: 'apron', componentId: 'c-apron', geo: 'box', mat: 'concrete', anim: 'sweep', castShadow: false, inst: [rect({ x0: 51, d0: -34, x1: 84.7, d1: -27 }, 0, 0.05, { g: 0 }), rect({ x0: LOT.x0 - 30, d0: -32.5, x1: LOT.x1 + 30, d1: -27.5 }, 0.0, 0.07, { g: 1 })] })
{
  const holes: [number, number, number, number][] = [sceneRect(POOL_DECK), sceneRect({ x0: DRIVE.x0 - 0.7, d0: DRIVE.d0, x1: DRIVE.x1 + 0.7, d1: 0 }), sceneRect({ x0: -0.3, d0: -0.6, x1: 83, d1: 62.7 }), sceneRect(WALK), sceneRect(AC_PAD), sceneRect({ x0: ENTRY_STAIR.x0 - 1.5, d0: -6.5, x1: ENTRY_STAIR.x1 + 1.5, d1: 0 })]
  const sod = lotTiles(holes, 0, 0.03, 4)
  sod.push(rect(POND, 0.0, 0.035, { g: 0, c: '#5e7a40' }))
  const palms: Inst[] = []
  const fronds: Inst[] = []
  // Palm clusters along the rear lot line (A-1 "PALM CLUSTERS"); a front accent palm (illustrative)
  const spots: [number, number, number][] = [[0, 70, 7.5], [8, 73, 8.2], [52, 89, 7.0], [62, 92, 7.6], [74, 96, 6.8], [84, 95, 7.4], [-8, -10, 6.2]]
  spots.forEach(([x, d, h], i) => {
    const a = P3(x, 0, d)
    palms.push({ ...seg(P3(x, 0, d), [X(x) + 0.15, h, Z(d) + 0.1], 0.17), g: i, a })
    for (let k = 0; k < 18; k++) {
      const ang = (k / 18) * Math.PI * 2 + i * 0.7
      const L = 2.6 + (k % 3) * 0.35
      const pitch = k % 3 === 0 ? 0.35 : k % 3 === 1 ? 0.05 : -0.3
      fronds.push({ p: [X(x) + 0.15, h + 0.1, Z(d) + 0.1], s: [L, L, L], q: euler(0, -ang, pitch), g: i, a })
    }
  })
  // Foundation plantings along the stucco base (illustrative)
  const hedges: Inst[] = [rect({ x0: 0.0, d0: 5.0, x1: 2.0, d1: 16 }, 0, 0.9, { g: 0 }), rect({ x0: 13.4, d0: 3.0, x1: 17.5, d1: 6.6 }, 0, 0.9, { g: 1 }), rect({ x0: 75.5, d0: 41, x1: 76.5, d1: 61 }, 0, 1.4, { g: 2 }), rect({ x0: -1.2, d0: 31, x1: -0.2, d1: 46 }, 0, 1.2, { g: 3 })]
  add({ id: 'sod', componentId: 'c-landscape', geo: 'box', mat: 'sod', inst: sod, anim: 'sweep', castShadow: false })
  add({ id: 'palm-trunks', componentId: 'c-landscape', geo: 'cyl', mat: 'palmTrunk', inst: palms, anim: 'grow' })
  add({ id: 'palm-fronds', componentId: 'c-landscape', geo: 'box', custom: frondGeometry(), mat: 'palmFrond', inst: fronds, anim: 'grow' })
  add({ id: 'hedges', componentId: 'c-landscape', geo: 'box', mat: 'hedge', inst: hedges, anim: 'rise' })
  const fence: Inst[] = []
  const lp = LOT_POLY
  for (const [a, b] of [[[lp[0][0], 10], lp[3]], [lp[3], lp[2]], [lp[2], [lp[1][0], 30]]] as [Pt, Pt][]) {
    const yaw = Math.atan2(-(Z(b[1]) - Z(a[1])), X(b[0]) - X(a[0]))
    fence.push({ p: [(X(a[0]) + X(b[0])) / 2, 0.9, (Z(a[1]) + Z(b[1])) / 2], s: [Math.hypot(X(b[0]) - X(a[0]), Z(b[1]) - Z(a[1])), 1.8, 0.05], q: euler(0, yaw, 0) })
  }
  add({ id: 'fence', componentId: 'c-fence', geo: 'box', mat: 'trimWhite', inst: fence, anim: 'sweep' })
}

/** Arched, tapered, V-folded palm frond along +X (unit length, origin at the crown). */
function frondGeometry(): THREE.BufferGeometry {
  const N = 14
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const y = 0.22 * t - 0.5 * t * t
    const hw = 0.17 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.75) + 0.004
    const fold = (0.05 * hw) / 0.17
    pos.push(t, y - fold, -hw, t, y + 0.01, 0, t, y - fold, hw)
  }
  for (let i = 0; i < N; i++) {
    const a = i * 3
    const b = a + 3
    idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export const BRYANT_PARTS: PartSpec[] = parts
/** Task that reveals the finished, lit home (listing photos). */
export const BRYANT_REVEAL_TASK = T('Photos')
/** Model bounds (scene m) for camera framing: footprint incl. eaves, ridge height. */
export const BRYANT_BOUNDS = { x0: X(-2), x1: X(84.75), z0: Z(64.4), z1: Z(-2.5), y1: F2_TOP + ft(11) }
