/**
 * 2623 S Bryant Cir — geometry transcribed from the sealed construction set
 * (CADDesign / Carotti Engineering, rev. 3, 03-26-2025). Plan units are FEET,
 * measured on the sheet scans at 1/4" = 1'-0" (40 px/ft on the 5760-px scans,
 * verified against the 82'-8" overall dimension on A-3).
 *
 *   plan x  — feet from the master-suite closet face (left, as seen from the street)
 *   plan d  — feet back from the garage door face (d = 0) toward the rear yard
 *   scene   — meters, +x = garage side, +z = street, y = 0 at garage apron grade
 *
 * Every value below is tagged with its source sheet. See SOURCES at the bottom
 * and docs/BRYANT_MODEL_SOURCES.md for what is documented vs inferred vs missing.
 * Change a dimension here and every stage (masonry, skins, drywall, windows,
 * MEP, roof) follows, because they are all derived from these definitions.
 */
export const FT = 0.3048
/** plan x (ft) → scene X (m) */
export const X = (x: number) => (x - 41.35) * FT
/** plan d (ft) → scene Z (m) */
export const Z = (d: number) => (31 - d) * FT
/** NAVD88 elevation (ft) → scene Y (m). Garage apron / rear grade ≈ 5.5' NAVD (A-1, A-3 spot elevations). */
export const NAVD = (e: number) => (e - 5.5) * FT

// ---------------------------------------------------------------------------
// Levels (m) — A-3 spot elevations, A-5/A-6 elevation dimension strings
// ---------------------------------------------------------------------------
export const GRADE = 0
/** T.O. 1st level slab = 11.5' NAVD (project datum 0'-0"), flood zone AE, DFE 11.0' (A-1, A-5) */
export const FFE = NAVD(11.5)
/** Garage slab 5.6' NAVD (A-1 "5.67", A-3 "T.O. slab 5.6' NAVD") */
export const GAR_SLAB = NAVD(5.6)
/** Front paver walk 7.0' NAVD (A-3 "-4'-6" T.O. pavers 7.0 NAVD") */
export const FRONT_WALK = NAVD(7.0)
/** Breezeway / screened lanai pavers 11.0' NAVD (A-3 "-0'-6"") */
export const LANAI_FLOOR = NAVD(11.0)
/** 1F ceiling 11'-4" AFF; T.O. tie beam & 1st level roof trusses 11'-4" (A-5) */
export const F1_CEIL = FFE + 11.33 * FT
/** T.O. tie beam & 2nd level floor trusses 13'-4" (A-5). Trusses hang in the beam, so 2F floor ≈ beam top. */
export const F1_TOP = FFE + 13.33 * FT
export const F1_BLOCK_TOP = F1_TOP - 1.33 * FT
export const F2_FLOOR = F1_TOP
/** T.O. tie beam @ 2nd level roof trusses 23'-4" (A-5); 2F ceiling 10'-0" */
export const F2_TOP = FFE + 23.33 * FT
export const F2_BLOCK_TOP = F2_TOP - 1.33 * FT
/** T.O. tie beam @ 2nd level balcony trusses 26'-0" (A-5) — front balcony gable */
export const BAL_TOP = FFE + 26.0 * FT
/** T.O. tie beam @ stairs (A-5/A-6). Read ≈ 22'-4"; inferred from drawing scale. */
export const STAIR_TOP = FFE + 22.33 * FT
/** Garage: ceiling 6'-8" above datum; T.O. tie beam @ garage roof trusses (A-6) */
export const GAR_TOP = FFE + 6.67 * FT
export const GAR_BLOCK_TOP = GAR_TOP - 1.33 * FT
/** 1-story roofs (master-bath bay, breezeway) bear at the 1st level roof truss line 11'-4" */
export const LOW_TOP = F1_CEIL

export type Pt = [number, number] // plan (x ft, d ft)

// ---------------------------------------------------------------------------
// Footprints (outer face of 8" CMU) — A-3, A-4
// ---------------------------------------------------------------------------
/**
 * First floor conditioned outline, clockwise from the front-left (A-3).
 * Master bath with tub bump-out, recessed entry porch, stair/AC-storage block,
 * non-AC storage, garage party walls, study wing, lanai/breezeway recess,
 * master suite, 2'-0" closet bump-out.
 */
export const F1_OUTLINE: Pt[] = [
  [2.1, 7.0], [3.4, 7.0], [3.4, 3.6], [13.1, 3.6], [13.1, 7.0], [18.0, 7.0], [18.0, 11.9], [36.75, 11.9],
  [36.75, 2.75], [46.4, 2.75], [46.4, 7.0], [51.75, 7.0], [51.75, 22.3], [75.1, 22.3], [75.1, 62.4],
  [61.5, 62.4], [61.5, 46.25], [59.75, 46.25], [59.75, 41.2], [17.75, 41.2], [17.75, 46.5], [2.1, 46.5],
  [2.1, 30.0], [0, 30.0], [0, 16.6], [2.1, 16.6],
]
/** Garage (open polyline; the x = 51.75 and d = 22.3 walls are shared with the house) — A-3 "3 CAR GARAGE", 31'-0" × 22'-0" */
export const GARAGE_LINE: Pt[] = [[51.75, 7.0], [51.75, -0.5], [82.75, -0.5], [82.75, 22.3], [75.1, 22.3]]
export const GARAGE_RECT = { x0: 51.75, d0: -0.5, x1: 82.75, d1: 22.3 }
/** Walls of the first-floor outline shared with the garage (fire-separation walls, interior both sides) */
export const isGarageParty = (a: Pt, b: Pt) =>
  (a[0] === 51.75 && b[0] === 51.75 && Math.min(a[1], b[1]) >= 7.0 && Math.max(a[1], b[1]) <= 22.3) ||
  (a[1] === 22.3 && b[1] === 22.3 && Math.min(a[0], b[0]) >= 51.75 && Math.max(a[0], b[0]) <= 75.1)

/**
 * Second floor outline (A-4, sheet registration corrected +0.5' to match A-3
 * at the stair tower, master-bath front and study-wing rear walls).
 * Front balcony recess over the entry porch, stair tower, mech/utility,
 * bed suite 4 over the garage, bed suite 5 wing, wet bar over the lanai,
 * covered rear balcony, bed suite 3 recess, master suite 2.
 */
export const F2_OUTLINE: Pt[] = [
  [2.1, 7.0], [18.0, 7.0], [18.0, 12.1], [36.75, 12.1], [36.75, 2.75], [46.4, 2.75], [46.4, 7.0], [52.4, 7.0],
  [52.4, 9.5], [75.1, 9.5], [75.1, 23.25], [75.1, 62.4], [61.5, 62.4], [61.5, 58.0], [45.4, 58.0], [45.4, 46.0], [37.4, 46.0],
  [37.4, 41.0], [17.75, 41.0], [17.75, 46.5], [2.1, 46.5], [2.1, 29.75], [0, 29.75], [0, 16.9], [2.1, 16.9],
]
/** 2F wall lines that stand over the garage roof rather than over a 1F wall (infill down to the garage plate). */
export const F2_OVER_GARAGE: [Pt, Pt][] = [[[46.4, 7.0], [52.4, 7.0]], [[52.4, 7.0], [52.4, 9.5]], [[52.4, 9.5], [75.1, 9.5]]]

/** Floor plates as rectangles (slabs, subfloors, ceilings, insulation, flooring). */
export type Rect = { x0: number; d0: number; x1: number; d1: number }
export const F1_RECTS: Rect[] = [
  { x0: 2.1, d0: 7.0, x1: 18.0, d1: 46.5 },
  { x0: 0, d0: 16.6, x1: 2.1, d1: 30.0 },
  { x0: 3.4, d0: 3.6, x1: 13.1, d1: 7.0 },
  { x0: 18.0, d0: 11.9, x1: 36.75, d1: 41.2 },
  { x0: 36.75, d0: 2.75, x1: 46.4, d1: 41.2 },
  { x0: 46.4, d0: 7.0, x1: 51.75, d1: 41.2 }, // A-3 reads 7.25; aligned to the 2F mech wall above (A-4 7.0)
  { x0: 51.75, d0: 22.3, x1: 75.1, d1: 41.2 },
  { x0: 59.75, d0: 41.2, x1: 75.1, d1: 46.25 },
  { x0: 61.5, d0: 46.25, x1: 75.1, d1: 62.4 },
]
export const F2_RECTS: Rect[] = [
  { x0: 2.1, d0: 7.0, x1: 18.0, d1: 46.5 },
  { x0: 0, d0: 16.9, x1: 2.1, d1: 29.75 },
  { x0: 18.0, d0: 12.1, x1: 36.75, d1: 41.0 },
  { x0: 36.75, d0: 2.75, x1: 46.4, d1: 41.0 },
  { x0: 36.75, d0: 41.0, x1: 45.4, d1: 46.0 },
  { x0: 46.4, d0: 7.0, x1: 52.4, d1: 46.0 },
  { x0: 52.4, d0: 9.5, x1: 75.1, d1: 46.0 },
  { x0: 45.4, d0: 46.0, x1: 61.5, d1: 58.0 },
  { x0: 61.5, d0: 46.0, x1: 75.1, d1: 62.4 },
]

/** Exterior slabs and decks (A-3 / A-4). */
export const PORCH = { x0: 18.0, d0: 4.6, x1: 36.75, d1: 11.9 } // ENTRY, pavers on concrete slab, 11'-4" clg
/**
 * The hatched CMU at the porch front (A-3, d 4.6–5.9) is the raised porch's edge wall, topped by
 * railings (A-5 shows the door assembly unobstructed). The balcony above bears on the
 * 8" concrete beam spanning the porch between the bath wall and the stair tower.
 */
export const PORCH_PIERS: Rect[] = []
export const ENTRY_STAIR = { x0: 25.75, d0: -0.5, x1: 32.6, d1: 4.6 } // 6'-10" wide, pavers on conc. treads
export const PLANTERS: Rect[] = [
  { x0: 13.1, d0: -0.3, x1: 25.25, d1: 4.6 }, // RAISED PLANTER, stucco on CMU w/ cast stone coping
  { x0: 33.1, d0: -0.3, x1: 36.75, d1: 2.75 },
]
export const BREEZEWAY = { x0: 17.75, d0: 41.2, x1: 36.75, d1: 46.5 }
export const LANAI = { x0: 36.75, d0: 41.2, x1: 59.75, d1: 58.25 } // SCREENED LANAI, 22'-4" × 17'
export const FRONT_BALCONY = { x0: 18.0, d0: 4.75, x1: 36.75, d1: 12.1 } // 2F, 10'-8" clg
export const REAR_BALCONY = { x0: 37.4, d0: 46.0, x1: 45.4, d1: 58.0 } // 2F, 10'-0" clg, plexiglass infill rail
export const POOL_STAIRS = { x0: 21.0, d0: 46.5, x1: 31.5, d1: 53.5 } // pavers on conc. stairs, breezeway → yard (A-1, A-3)
export const AC_PAD = { x0: 75.1, d0: 24.0, x1: 82.0, d1: 40.0 } // AC compressors on raised conc. slab w/ 48" CMU screen walls

// ---------------------------------------------------------------------------
// Roofs — A-5/A-6 elevations (no roof plan in the supplied set: A-2 missing).
// Standing-seam metal, 6:12 main, 2'-0" typ. cantilever. Hip footprints are
// wall-line rectangles; overlapping hips render as their union.
// ---------------------------------------------------------------------------
export interface RoofSpec {
  id: string
  kind: 'hip' | 'gable' | 'shed'
  r: Rect
  /** plate (eave at wall line), m */
  y: number
  pitch: number
  /** horizontal overhang, ft */
  overhang: number
  source: string
}
export const ROOFS: RoofSpec[] = [
  { id: 'main', kind: 'hip', r: { x0: 0, d0: 7.0, x1: 75.1, d1: 46.5 }, y: F2_TOP, pitch: 0.5, overhang: 2, source: 'A-5 front/A-6 sides: 6:12, ridge ≈ 34\'-0" above datum (elev. scaled)' },
  { id: 'rear-wing', kind: 'hip', r: { x0: 36.75, d0: 41.0, x1: 61.5, d1: 58.0 }, y: F2_TOP, pitch: 0.5, overhang: 2, source: 'A-5 rear: center hip over wet bar + covered rear balcony' },
  { id: 'study-wing', kind: 'hip', r: { x0: 61.5, d0: 40.0, x1: 75.1, d1: 62.4 }, y: F2_TOP, pitch: 0.5, overhang: 2, source: 'A-5 rear: hip over bed suite 5 / study wing' },
  { id: 'stair-tower', kind: 'hip', r: { x0: 36.75, d0: 2.75, x1: 46.4, d1: 9.0 }, y: STAIR_TOP, pitch: 0.5, overhang: 1, source: 'A-5 front: T.O. tie beam @ stairs, bracketed eave below main eave' },
  { id: 'garage', kind: 'hip', r: { x0: 51.75, d0: -0.5, x1: 82.75, d1: 22.3 }, y: GAR_TOP, pitch: 0.25, overhang: 2, source: 'A-5 front 3:12, A-6 right "2.5:12 (verify)"; A-4 roof outline' },
  { id: 'bath-bay', kind: 'hip', r: { x0: 3.4, d0: 3.6, x1: 13.1, d1: 7.0 }, y: LOW_TOP, pitch: 0.25, overhang: 1.6, source: 'A-5 front 3:12 bay roof; A-4 outline x 1.5–15, d 1.5–7' },
  { id: 'breezeway', kind: 'shed', r: { x0: 17.75, d0: 41.2, x1: 36.75, d1: 46.5 }, y: LOW_TOP, pitch: 0.25, overhang: 2, source: 'A-4 roof line at d ≈ 48.5; A-5 rear low roof band. Pitch inferred.' },
]
/** Front balcony gable (A-5): plate at 26'-0", 6:12 as scaled, pediment over the 2F balcony. */
export const FRONT_GABLE = { x0: 18.0, x1: 36.75, dFront: 4.75, dBack: 18.0, y: BAL_TOP, pitch: 0.5, overhang: 2.4 } // A-5: rakes at x ≈ 15.1–38.0

// ---------------------------------------------------------------------------
// Openings — A-3/A-4 window & door tags, heights from A-5/A-6 (no window/door
// schedule sheet in the supplied set; sizes come from the tags, e.g. 3060 = 3'-0" × 6'-0").
// ---------------------------------------------------------------------------
export type OpeningKindPlan = 'window' | 'fixed' | 'octagon' | 'slider' | 'entry' | 'garage' | 'door'
export interface PlanOpening {
  floor: 1 | 2 | 0 // 0 = garage (heights from the garage slab)
  /** wall line: constant d (front/rear) or x (sides) */
  line: { d: number } | { x: number }
  from: number
  to: number
  sill: number // ft above floor
  head: number
  kind: OpeningKindPlan
  /** transom lite height (ft) mulled above the operable unit */
  transom?: number
  /** number of mulled units */
  units?: number
  tag: string
}
const O = (floor: 1 | 2 | 0, line: { d: number } | { x: number }, from: number, to: number, sill: number, head: number, kind: OpeningKindPlan, tag: string, extra: Partial<PlanOpening> = {}): PlanOpening => ({ floor, line, from, to, sill, head, kind, tag, ...extra })

/** 1F typical head 9'-4" (A-5 "9'-4""), 2F typical head 8'-0" (A-5 "8'-0""). */
const H1 = 9.33
const H2 = 8.0
export const OPENINGS: PlanOpening[] = [
  // --- Front (street) ---
  O(1, { d: 3.6 }, 5.6, 10.9, H1 - 6.67, H1, 'fixed', '(2) 2868 FIXED TEMP', { units: 2 }),
  O(1, { d: 11.9 }, 21.1, 34.1, 0, 10.0, 'entry', '(2) 3080 W/ TEMP LITES & SIDE LITES, MULLED TRANSOMS TO 10\'-0", 20\'H ELLIPTICAL ARCH'),
  O(1, { d: 2.75 }, 39.6, 43.6, 10.4, 19.6, 'fixed', '4050 FIXED W/ 4040 TRANSOM MULLED (stair)', { transom: 4 }),
  O(0, { d: -0.5 }, 53.75, 69.75, 0, 9.0, 'garage', '16\'-0" × 9\'-0" CARRIAGE STYLE O.H. DOOR W/ TEMP LITES'),
  O(0, { d: -0.5 }, 71.75, 80.75, 0, 9.0, 'garage', '9\'-0" × 9\'-0" CARRIAGE STYLE O.H. DOOR W/ TEMP LITES'),
  O(2, { d: 7.0 }, 5.25, 11.25, H2 - 4.5, H2, 'fixed', '(2) 3046 FIXED TEMP', { units: 2 }),
  O(2, { d: 12.1 }, 21.6, 33.6, 0, 8.0, 'slider', '12\'W × 8\'H (4) PANEL SGD OXXO TEMP'),
  O(2, { d: 9.5 }, 55.25, 58.25, 3.5, 6.5, 'octagon', '36" OCTAGON FIXED'),
  O(2, { d: 9.5 }, 62.25, 71.25, H2 - 6, H2, 'fixed', '(3) 3060 FIXED MULLED', { units: 3 }),
  // --- Left side ---
  O(1, { x: 0 }, 18.25, 20.5, H1 - 4.5, H1, 'window', '2646 GLASS TEMP (WC)'),
  O(1, { x: 2.1 }, 31.0, 34.0, H1 - 8, H1, 'window', '3060 CSMT W/ 3020 TRANSOM MULLED', { transom: 2 }),
  O(1, { x: 2.1 }, 40.75, 43.75, H1 - 8, H1, 'window', '3060 CSMT W/ 3020 TRANSOM MULLED', { transom: 2 }),
  O(2, { x: 2.1 }, 31.5, 34.5, H2 - 6, H2, 'window', '3060 CSMT'),
  O(2, { x: 2.1 }, 41.0, 44.0, H2 - 6, H2, 'window', '3060 CSMT EGRESS'),
  // --- Rear ---
  O(1, { d: 46.5 }, 5.1, 14.9, H1 - 8, H1, 'window', '(3) 3060 CSMT XOX W/ (3) 3020 TRANSOM MULLED', { transom: 2, units: 3 }),
  O(1, { d: 41.2 }, 19.25, 35.25, 0, 10.0, 'slider', '16\'W × 10\'H SGD TEMP (great room)'),
  O(1, { d: 41.2 }, 40.5, 56.5, 0, 10.0, 'slider', '16\'W × 10\'H SGD TEMP (kitchen/dining → lanai)'),
  O(1, { x: 17.75 }, 42.75, 45.4, 0, 10.0, 'door', '2880 W/ TEMP LITE & MULLED TRANSOM TO 10\'-0" (master → breezeway)', { transom: 2 }),
  O(1, { x: 59.75 }, 42.5, 45.1, 0, 10.0, 'door', '2880 W/ TEMP LITE & MULLED TRANSOM (hall → lanai)', { transom: 2 }),
  O(1, { d: 62.4 }, 63.4, 73.2, H1 - 8, H1, 'window', '(3) 3060 CSMT XOX W/ (3) 3020 TRANSOM MULLED (study)', { transom: 2, units: 3 }),
  O(2, { d: 46.5 }, 5.1, 14.9, H2 - 6, H2, 'window', '(3) 3060 CSMT XOX MULLED', { units: 3 }),
  O(2, { d: 41.0 }, 22.9, 31.9, H2 - 6, H2, 'window', '(3) 3060 CSMT XOX MULLED (bed suite 3)', { units: 3 }),
  O(2, { d: 46.0 }, 38.4, 44.4, H2 - 6, H2, 'fixed', '(2) 3060 FIXED MULLED', { units: 2 }),
  O(2, { x: 45.4 }, 47.5, 56.5, 0, 8.0, 'slider', '9\'W × 8\'H SGD TEMP (wet bar → balcony)'),
  O(2, { d: 58.0 }, 46.75, 58.75, H2 - 6, H2, 'window', '(4) 3060 CSMT XOOX MULLED (wet bar)', { units: 4 }),
  O(2, { d: 62.4 }, 63.4, 73.2, H2 - 6, H2, 'window', '(3) 3060 CSMT XOX MULLED (bed suite 5)', { units: 3 }),
  // --- Right side ---
  O(1, { x: 75.1 }, 27.0, 29.0, H1 - 4.5, H1, 'fixed', '3046 FIXED (utility)'),
  O(1, { x: 75.1 }, 37.75, 39.75, H1 - 5, H1, 'fixed', '2650 FIXED (pantry)'),
  O(1, { x: 75.1 }, 42.5, 44.5, H1 - 4.5, H1, 'window', '2646 CSMT TEMP (powder)'),
  O(1, { x: 75.1 }, 49.5, 52.5, H1 - 8, H1, 'window', '3060 CSMT W/ 3020 TRANSOM MULLED (study)', { transom: 2 }),
  O(1, { x: 75.1 }, 56.75, 59.75, H1 - 8, H1, 'window', '3060 CSMT W/ 3020 TRANSOM MULLED EGRESS (study)', { transom: 2 }),
  O(0, { x: 82.75 }, 18.25, 21.25, 0, 8.0, 'door', '2880 W/ TEMP LITE (garage side door)'),
  O(2, { x: 75.1 }, 10.5, 13.5, H2 - 6, H2, 'window', '3060 CSMT (bed suite 4)'),
  O(2, { x: 75.1 }, 19.75, 22.75, H2 - 6, H2, 'window', '3060 CSMT EGRESS (bed suite 4)'),
  O(2, { x: 75.1 }, 31.25, 33.5, H2 - 4.5, H2, 'window', '2646 CSMT TEMP (J&J bath 4)'),
  O(2, { x: 75.1 }, 47.5, 50.5, H2 - 6, H2, 'window', '3060 CSMT (bed suite 5)'),
  O(2, { x: 75.1 }, 57.25, 60.25, H2 - 6, H2, 'window', '3060 CSMT EGRESS (bed suite 5)'),
]

/**
 * Exterior finish rule (A-5 / A-6 material notes): Hardie lap siding on the
 * street elevation and on the front ~30' of each side (above the stucco base);
 * stucco on 8" CMU with 1x8 stucco banding on the rear, the rear portions of
 * the sides, the garage side and every stem/base wall below the 1st floor.
 */
export const SIDING_DEPTH = { left: 30.0, right: 23.5 }

/** Major interior partitions (ft). Simplified to the walls that define rooms and circulation. */
export const PARTITIONS_F1: [Pt, Pt][] = [
  [[0, 30.0], [17.2, 30.0]], // closets | master suite
  [[0, 17.8], [17.2, 17.8]], // WC / closets | master bath
  [[17.2, 17.8], [17.2, 41.2]], // 2x6 stud bearing wall, master | great room
  [[18.0, 17.4], [36.75, 17.4]], // foyer | great room (soffit line)
  [[36.75, 11.9], [36.75, 17.0]], // stair wall
  [[46.4, 7.0], [46.4, 16.5]], // non-AC storage
  [[46.4, 16.5], [51.75, 16.5]], // future elevator
  [[62.0, 22.3], [62.0, 41.2]], // 2x6 stud bearing wall, kitchen | hall/utility
  [[66.4, 22.3], [66.4, 41.2]], // utility / pantry
  [[61.5, 46.25], [75.1, 46.25]], // study | powder
]
export const PARTITIONS_F2: [Pt, Pt][] = [
  [[2.1, 29.75], [17.75, 29.75]], // WIC | master suite 2
  [[2.1, 16.9], [18.0, 16.9]], // master bath 2 | hall
  [[18.0, 12.1], [18.0, 41.0]], // bed 3 / guest study | master suite 2
  [[18.0, 21.5], [36.75, 21.5]], // bath 3 / WIC | guest study
  [[36.75, 12.1], [36.75, 41.0]], // stair | lounge
  [[46.4, 7.0], [46.4, 21.5]], // mech
  [[59.25, 9.5], [59.25, 23.25]], // bed suite 4
  [[59.25, 23.25], [75.1, 23.25]],
  [[62.0, 23.25], [62.0, 46.0]], // vest / J&J bath 4
  [[61.5, 46.0], [75.1, 46.0]], // bed suite 5
]

// ---------------------------------------------------------------------------
// Site — A-1 (1/8" = 1'-0", registered on the garage face and the left wall)
// ---------------------------------------------------------------------------
/** Lot corners (plan ft): front-left, front-right, rear-right, rear-left (skewed rear line N 24°34' W). */
export const LOT_POLY: Pt[] = [[-10.9, -24.3], [90.0, -28.3], [90.0, 98.9], [-11.7, 63.7]]
/** Bounding box used for ground tiles and fences. */
export const LOT = { x0: -11.7, d0: -28.3, x1: 90.0, d1: 98.9 }
/** Concrete or paver drive w/ 8" border, apron to Bryant Cir (A-1; flare simplified). */
export const DRIVE = { x0: 53.0, d0: -27.0, x1: 82.75, d1: -0.5 }
export const WALK = { x0: 25.75, d0: -6.5, x1: 53.0, d1: -0.5 } // PAVER WALK, entry stair → drive
/** 448 CF retention pond, "conceptual plan only" (A-1). */
export const POND = { x0: -8.0, d0: -21.0, x1: 18.0, d1: -6.0 }
/** Front setback 25', sides 7', rear 20' (A-1 "Proposed residence"). */
export const SETBACKS = { front: 25, side: 7, rear: 20 }
/**
 * POOL — NOT ON THE SUPPLIED SHEETS. A-1 lists "non-caged pool, flush spa & deck
 * 1,013 SF" and "pool stairs" off the breezeway; the Buildertrend schedule has
 * the pool tasks. Position/size below are ILLUSTRATIVE (behind the breezeway,
 * inside the lot and clear of the rear line) — replace when the pool plan arrives.
 */
export const POOL = { x0: 22.0, d0: 58.5, x1: 44.0, d1: 70.0, illustrative: true }
export const POOL_DECK = { x0: 14.0, d0: 53.5, x1: 50.0, d1: 74.0 }
/** Protected grand oaks (A-1 tree table / arborist note). */
export const TREES: { x: number; d: number; dbh: number; keep: boolean; label: string }[] = [
  { x: -15.0, d: -22.0, dbh: 32, keep: true, label: '32" oak (front-left)' },
  { x: 88.5, d: 55.0, dbh: 26, keep: true, label: '26" oak (right side)' },
  { x: 89.0, d: 96.0, dbh: 20, keep: true, label: '20" oak (rear-right)' },
  { x: 8.0, d: -36.0, dbh: 12, keep: true, label: '12" oak (ROW)' },
  { x: 38.0, d: -36.0, dbh: 12, keep: true, label: '12" oak (ROW)' },
  { x: 64.0, d: -35.0, dbh: 12, keep: true, label: '12" oak (ROW)' },
]

// ---------------------------------------------------------------------------
// Source map (also rendered in docs/BRYANT_MODEL_SOURCES.md)
// ---------------------------------------------------------------------------
export type Evidence = 'documented' | 'inferred' | 'missing'
export const SOURCES: { element: string; sheets: string; evidence: Evidence; note?: string }[] = [
  { element: 'Building footprint, wall lines (1F)', sheets: 'A-3', evidence: 'documented', note: 'Scaled from scan, 82\'-8" × 62\'-11" overall; ±0.3\'' },
  { element: 'Second floor outline, balconies', sheets: 'A-4', evidence: 'documented', note: 'A-4 registered +0.5\' in depth to A-3' },
  { element: 'Floor levels (FFE 11.5\' NAVD, garage 5.6\', walk 7.0\')', sheets: 'A-1, A-3, A-5', evidence: 'documented' },
  { element: 'Tie-beam heights 11\'-4", 13\'-4", 23\'-4", 26\'-0"', sheets: 'A-5, A-6', evidence: 'documented' },
  { element: 'Stair tower plate, garage plate', sheets: 'A-6', evidence: 'inferred', note: 'Labels present, values scaled' },
  { element: 'Roof shapes, pitches, overhangs', sheets: 'A-5, A-6', evidence: 'inferred', note: 'No roof plan (A-2) supplied; hips fitted to elevation silhouettes' },
  { element: 'Window & door positions and sizes', sheets: 'A-3, A-4, A-5, A-6', evidence: 'documented', note: 'From plan tags; no door/window schedule sheet' },
  { element: 'Exterior materials (lap siding / stucco / standing seam)', sheets: 'A-5, A-6', evidence: 'documented' },
  { element: 'Interior partitions', sheets: 'A-3, A-4', evidence: 'documented', note: 'Major walls only' },
  { element: 'Structural system (8" CMU, tie beams, hung floor trusses)', sheets: 'A-3 legend, A-5 notes, BT schedule', evidence: 'documented', note: 'S-sheets not supplied; truss layout illustrative' },
  { element: 'Foundation (raised stem wall + slab)', sheets: 'A-5 (stucco on CMU base), BT schedule', evidence: 'inferred', note: 'Foundation plan (A-2) not supplied' },
  { element: 'Lot, setbacks, drive, walk, retention pond, trees', sheets: 'A-1', evidence: 'documented' },
  { element: 'Pool, pool deck', sheets: 'A-1 area table only', evidence: 'missing', note: 'Shown illustratively' },
  { element: 'Plumbing, electrical, HVAC routes', sheets: '—', evidence: 'missing', note: 'Electrical sheets A-12/A-13 and MEP not supplied; routes in X-Ray are schematic' },
  { element: 'Landscaping, neighbours, street furniture', sheets: '—', evidence: 'missing', note: 'Illustrative context' },
]
