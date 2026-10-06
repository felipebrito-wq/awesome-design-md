# 2623 S Bryant Cir — model sources

How the procedural model maps to the sealed construction set (CADDesign / Carotti
Engineering, rev. 3, 03-26-2025). Geometry lives in
`src/scene/home/bryant/plan.ts` (data, tagged per sheet); assembly and stage
mapping live in `bryantSpec.ts`. Change a dimension in `plan.ts` and every stage
follows.

## Sheets available

| Sheet | Content | Used for |
|---|---|---|
| A-1 | Site plan, 1/8" = 1'-0" | Lot polygon (skewed rear line), setbacks, drive, paver walk, retention pond, AC pad, grand oaks, palm clusters, spot elevations |
| A-3 | 1st level floor plan, 1/4" = 1'-0" | 1F outline, garage, porch, breezeway, lanai, partitions, window & door tags, fixtures, equipment (tankless WH, 400 A panel, AC condensers) |
| A-4 | 2nd level floor plan | 2F outline, balconies, stair tower, mech room (3 AH), partitions, window tags, roof outlines of the 1-story roofs |
| A-5 / A-6 | Front, rear, left, right elevations | Heights (tie beams 11'-4", 13'-4", 23'-4", 26'-0"), roof shapes and pitches, siding vs stucco, trim, shutters, brackets, railings |

Scale check: scans are 160 dpi, so 1/4" = 40 px/ft; the 82'-8" overall on A-3
measures 3,315 px (82.9'). A-4 is registered +0.5' in depth to match A-3 at the
stair tower, master-bath front and study-wing rear walls.

## Element → source

| Element | Sheets | Evidence |
|---|---|---|
| 1F footprint (82'-8" × 62'-11"), closet bump-out, tub bay, recessed entry porch, stair tower, storage notch, garage 31' × 22', study wing, lanai & breezeway recesses | A-3 | Documented (scaled, ±0.3') |
| 2F footprint: balcony recess, mech, bed suite 4 over garage, wet bar over lanai, covered rear balcony | A-4 | Documented |
| FFE 11.5' NAVD (6'-0" above 5.5' grade), garage 5.6', walk 7.0', lanai 11.0' | A-1, A-3 | Documented |
| Tie beams 11'-4", 13'-4", 23'-4", 26'-0"; 2F ceiling 10'-0" | A-5, A-6 | Documented |
| Stair-tower plate (≈22'-4") and garage plate (≈6'-8" above datum) | A-6 | Inferred (labels present, values scaled) |
| Roofs: 6:12 main hip, rear-wing and study hips, 3:12 garage and bay, balcony gable, breezeway shed | A-5, A-6 | **Inferred** — no roof plan supplied; hips fitted to elevation silhouettes (ridge ≈ 34') |
| Windows & doors (sizes from tags, e.g. 3060 = 3'-0" × 6'-0"), transoms, octagon, 16' and 12' sliders, entry assembly with elliptical arch, carriage garage doors | A-3, A-4, A-5, A-6 | Documented positions; heads from elevations (1F 9'-4", 2F 8'-0"); no schedule sheet |
| Lap siding on the street face and front of the sides; stucco on CMU with 1x8 banding elsewhere; standing-seam metal roof; foam brackets; Bahama shutters; Chippendale and plexiglass railings | A-5, A-6 | Documented |
| Structure: raised CMU stem wall + slab, 8" CMU both floors, poured tie beams & lintels, hung floor trusses, wood roof trusses | A-3 legend, A-5 notes, Buildertrend tasks | Documented system; truss layout illustrative |
| Interior partitions (major rooms only), stair, kitchen island 5'-0" × 8'-6", fixtures | A-3, A-4 | Documented, simplified |
| Equipment: tankless WH, 400 A panel + meter, 3 AC condensers on raised pad, 3 air handlers in 2F mech | A-3, A-4 | Documented locations |
| Plumbing, gas, electrical, HVAC and low-voltage **routes** | — | **Missing** — shown schematically and labeled as such in X-Ray and the inspector |
| Pool, spa and deck | A-1 area table only | **Missing** — illustrative placement behind the breezeway; not in the Buildertrend schedule either |
| Landscaping, neighbours, palms, fence route | A-1 (palm clusters, oaks) | Partly documented; plantings and fence illustrative |

## Not supplied (keep geometry configurable)

- A-2 foundation / roof plan, A-7 details, A-8–A-11 framing & soffit plans,
  A-12/A-13 electrical, S-sheets (T-1.0–T-3.0), door/window schedules, landscape
  and pool plans.

## Known deviations

- Rear roof is simplified: the elevation shows three distinct rear hips; the model
  unions the main hip with the rear-wing and study hips.
- Non-AC storage front wall reads 7.25' on A-3 and 7.0' on A-4; the model uses 7.0'.
- Stair-tower window spans the floor line (sill ≈ 9'-4", head ≈ 18'-4", scaled).

## Stage mapping

Every part is tied to a Buildertrend task (`bt-<slug>`), so the stage it appears in
comes from the job's own schedule, not from a hardcoded stage list. In development,
`ProceduralHome` warns about any part that references a task missing from the
loaded project. Work dated after "today" renders as slate massing until Buildertrend
reports it complete.
