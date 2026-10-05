# LUIH Build Journey

Interactive 3D digital twin of a LUIH home under construction. The homeowner
(or the LUIH team) watches **one house** assemble from an empty lot to the
finished residence, driven by Buildertrend-shaped schedule data.

```bash
npm install
npm run dev          # → http://localhost:5173
```

## Run it locally

Requires **Node.js 20.19+** (LTS 22 recommended) and git.

```bash
git clone https://github.com/felipebrito-wq/awesome-design-md.git
cd awesome-design-md
git checkout claude/luih-build-journey
cd luih-build-journey
npm install
npm run dev          # → http://localhost:5173
```

Already cloned? `git pull` on the branch, then `npm install && npm run dev`.

### Real project data (2623 S Bryant Cir)

The repo is public, so real LUIH data is **git-ignored** (`private/`, `public/private/`).
Without it the app shows the demo house. To load the real project, unzip the
private data bundle **inside `luih-build-journey/`** so you get:

```
luih-build-journey/
  public/private/project.json          # imported Buildertrend schedule
  public/private/bryant/plans/*.jpg     # sealed plan sheets + elevations
  private/bt/34200410.json              # raw Buildertrend export (for re-import)
```

Restart `npm run dev` and the app opens on the Bryant project. To regenerate
`project.json` from a fresh export: `node scripts/import-buildertrend.mjs private/bt/34200410.json`.

Useful flags: `?quality=low` (lighter rendering), press <kbd>`</kbd> for the DEV panel.

## What you can do
| | |
|---|---|
| **Orbit / zoom / pan** | Drag, scroll, right-drag. Views menu, reset (R), fullscreen (F) |
| **Time machine** | Drag the timeline (Jan → Sep). The house builds/unbuilds continuously; release snaps to milestones. ←/→ step milestones |
| **Stages** | 01–06 buttons (or keys 1–6) move timeline + camera + panel. Hover a stage to ghost-preview what it builds |
| **X-Ray** (X) | Finishes fade to ~10%; toggle/isolate Structure, Plumbing, Drain, Electrical, HVAC, Low Voltage |
| **Click the house** | Any component → inspector: status, install date, inspection, trade, docs, photos, specs |
| **Photos / Compare** | Site Photo view, gallery, and Compare (design-intent render vs. site photo from the same camera station) |
| **Live updates** | DEV panel (`` ` ``): Complete Next Task, Add Site Photo, Pass Inspection, Delay Milestone, Simulate Buildertrend Sync, change project date / MEP % / schedule status / blockers |
| **Homeowner vs Internal** | DEV panel toggle. Internal adds tasks, inspections, trades, blockers, QC, change orders, variance, daily logs |
| **▶ Play Build Journey** (P) | ~27 s hands-free cinematic: empty lot → completed home at golden hour |

`?quality=low` disables post-processing for older machines / screen sharing.

## Architecture (frontend-first, no microservices)

```
src/
  domain/          types.ts (Phase→Stage→Milestone→Task→Inspection/Approval/Doc/Photo), layers.ts (semantic layers, X-Ray palette)
  data/            demoProject.ts — normalized demo data (Winter Park Modern, "today" = Mar 20 2026)
  lib/schedule.ts  schedule engine: task progress at any date → drives model, panels, timeline
  services/
    buildertrend/  BuildertrendService (interface) · MockBuildertrendService · BuildertrendAPIService (stub) · mapper.ts (BT schedule → LUIH stages, rule-based)
    realtime/      BuildEvent types · applyEvent reducer · RealtimeChannel (Mock | SSE) · simulator
  store/           useJourney (Zustand): project, timeline cursor, view state
  scene/           ConstructionScene · CameraRig · Lighting · Site · Capture
    home/          HomeModel (AssetAdapter) → ProceduralHome | GlbHome
                   houseSpec.ts + walls.ts — ONE wall/opening definition generates masonry, framing, sheathing, MEP, skins, windows
                   BuildPart.tsx — instanced, progress-driven construction animation
                   partState.ts — stage controller: hidden/visible/transparent/highlighted/complete/under construction
  ui/              BuildJourney, ConstructionTimeline, StageSelector, XRayControls, ExplorerPanel, StagePanel,
                   ComponentInspector, ProjectOverview, PhotoGallery, PhotoView/CompareView, EventFeed, DevPanel, demo
```

### The core idea: the schedule *is* the animation
Every 3D part maps to a **component**, every component to a **Buildertrend task**.
`taskProgressAt(task, date)` returns 0–1 using actuals for the past and the
forecast for the future. The scene reads it every frame, so:
- dragging the timeline replays history / previews the plan,
- a task completing, an inspection passing or a milestone slipping in Buildertrend **re-shapes the house** with no extra code.

### Swapping in real data
1. **Buildertrend** → implement the LUIH sync backend (webhooks/polling → normalized DB), set `VITE_SYNC_API_URL`. `createBuildertrendService()` switches from mock to `BuildertrendAPIService`. UI untouched.
2. **More detailed schedule** → extend `DEFAULT_STAGE_RULES` in `services/buildertrend/mapper.ts`; any number of milestones/tasks per stage works.
3. **Real home model** → drop `public/models/home.glb` (see `docs/MODEL_PIPELINE.md`). `HomeModel` auto-detects it.
4. **Photos** → Buildertrend photo URLs replace `/public/photos` placeholders (rendered from the model via `npm run photos`).

### Real-time path
```
Buildertrend ──webhook/poll──▶ LUIH sync service ──▶ normalized project DB
                                                      │
                                                      ▼  SSE (VITE_SYNC_EVENTS_URL)
             LUIH Build Journey ◀── RealtimeChannel ◀─ BuildEvent stream
                   applyEvent(project, event) → new project → scene + panels update
```
The DEV panel publishes the exact same `BuildEvent`s through `MockRealtimeChannel`.

## Known gaps / next steps
- Buildertrend API surface (endpoints, webhooks, photo access) must be confirmed; `dto.ts` field names are placeholders.
- Procedural house is a stand-in for a real LUIH residence — swap in the BIM-derived GLB.
- Photos are rendered placeholders, labeled as such in the gallery.
- No auth / multi-project routing yet (single demo project).
