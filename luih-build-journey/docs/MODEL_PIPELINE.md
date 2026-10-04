# Architectural model pipeline (BIM → web)

Goal: replace the procedural placeholder with the real LUIH residence at
`public/models/home.glb`, keeping every stage/X-Ray/inspector feature working.

## 1. Source
| Source | Path |
|---|---|
| Revit | Export IFC (or FBX) per discipline: ARCH, STRUCT, MEP |
| ArchiCAD / Vectorworks | IFC 4 |
| SketchUp / Rhino | Export glTF/FBX directly |

Open in **Blender + Bonsai (BlenderBIM)** to merge disciplines, strip furniture
families you don't need, and apply transforms. Units: meters, +Y up, front of
house facing +Z (street), origin ≈ center of slab.

## 2. Name nodes (the only contract with the app)
Each mesh (or its parent empty) maps to a **component** that maps to a
Buildertrend task (see `src/data/demoProject.ts → components`).

Either:
- **Custom property** (exported as glTF extras): `luih_component = c-hvac-f1`
- **Node name prefix**: `c-hvac-f1__supply_trunk_03`

Optional extras: `luih_appear_task`, `luih_disappear_task` to override timing
(e.g. temporary fence removed at demobilization).

Unmapped meshes render as always-visible context (neighbors, terrain).

Recommended granularity: one component per *schedulable* scope — e.g.
`c-elec-f1`, `c-elec-f2`, `c-hvac-f1`, `c-windows`, `c-drywall`. Thousands of
tiny Revit elements should be merged per component in Blender (Ctrl+J) —
this is also the single biggest performance win.

## 3. Optimize
```bash
npm run optimize-model -- exports/raw-home.glb public/models/home.glb
```
Runs gltf-transform: dedup, prune, weld, simplify (50%), GPU instancing,
WebP textures ≤2048px, Draco geometry compression. Target: **< 25 MB**,
**< 1.5 M triangles**, **< 300 draw calls**.

The app loads Draco locally from `/public/draco` (copied on `npm install`).

## 4. How the GLB is animated
`GlbHome.tsx` gives every mapped mesh a clipping plane that sweeps bottom→top
as its task progresses (a generic "being built" reveal), plus the same X-Ray
opacity, system colors and hover/select logic as the placeholder.

## 5. Later (not needed for the prototype)
- LODs per component (`gltf-transform` + `drei <Detailed>`) for interiors
- KTX2/Basis textures for photoreal materials
- Per-component custom animations (keyframes in the GLB) when generic reveal isn't enough
