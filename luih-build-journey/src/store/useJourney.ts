/**
 * App state (Zustand). Kept deliberately flat:
 *  - project:   normalized data (replaced immutably by the event reducer)
 *  - cursor:    the date being viewed on the timeline (time machine)
 *  - view:      x-ray / systems / selection / mode / overlays
 * The 3D scene reads this store inside useFrame (no React re-render per frame).
 */
import gsap from 'gsap'
import { create } from 'zustand'
import type { Photo, Project, SystemKey } from '@/domain/types'
import { createBuildertrendService } from '@/services/buildertrend'
import { applyEvent } from '@/services/realtime/applyEvent'
import { ev, type BuildEvent, type Notice } from '@/services/realtime/events'
import { createRealtimeChannel, type RealtimeChannel } from '@/services/realtime/RealtimeChannel'
import { simulateSync } from '@/services/realtime/simulator'
import { capturePhoto } from '@/lib/capture'
import { fromDay, type Day } from '@/lib/dates'
import { indexProject, stageAt, stageFocusDay } from '@/lib/schedule'

export type ViewMode = 'model' | 'photo' | 'compare'
export type Audience = 'homeowner' | 'internal'

export interface DemoCaption {
  code: string
  title: string
  story: string
}

interface JourneyState {
  project: Project | null
  error?: string
  cursor: Day
  /** Overrides cursor for rendering (compare mode intent render, photo capture). */
  renderDate: Day | null
  scrubbing: boolean
  focusStageId: string | null
  previewStageId: string | null
  xray: boolean
  systems: Record<SystemKey, boolean>
  isolate: SystemKey | null
  selectedComponentId: string | null
  hoveredComponentId: string | null
  audience: Audience
  view: ViewMode
  compareSplit: number
  panelOpen: boolean
  gallery: { open: boolean; photoId?: string; stageId?: string }
  demo: { playing: boolean; caption: DemoCaption | null }
  feed: Notice[]
  toasts: Notice[]
  celebration: Notice | null
  pulses: Record<string, number>
  devOpen: boolean
  camera: { preset: string; nonce: number; duration?: number }
  syncing: boolean

  load(): Promise<void>
  setCursor(d: Day, opts?: { live?: boolean }): void
  animateCursorTo(d: Day, duration?: number): void
  goLive(): void
  selectStage(id: string | null): void
  previewStage(id: string | null): void
  setXray(on: boolean): void
  toggleSystem(k: SystemKey): void
  setIsolate(k: SystemKey | null): void
  select(componentId: string | null): void
  hover(componentId: string | null): void
  setAudience(a: Audience): void
  setView(v: ViewMode): void
  setCompareSplit(x: number): void
  setPanelOpen(o: boolean): void
  openGallery(opts?: { photoId?: string; stageId?: string }): void
  closeGallery(): void
  setDemo(d: Partial<JourneyState['demo']>): void
  dispatch(e: BuildEvent): void
  simulateSync(): Promise<void>
  addSitePhoto(): Promise<void>
  dismissToast(id: string): void
  setDevOpen(o: boolean): void
  requestCamera(preset: string, duration?: number): void
  setScrubbing(s: boolean): void
}

const service = createBuildertrendService()
const channel: RealtimeChannel = createRealtimeChannel()
let cursorTween: gsap.core.Tween | null = null
let loading = false

const STATIONS = ['aerial', 'street', 'front-left', 'rear-pool', 'side-east']

export const useJourney = create<JourneyState>((set, get) => ({
  project: null,
  cursor: 0,
  renderDate: null,
  scrubbing: false,
  focusStageId: null,
  previewStageId: null,
  xray: false,
  systems: { structure: true, plumbing: true, drain: true, electrical: true, hvac: true, lowvoltage: true },
  isolate: null,
  selectedComponentId: null,
  hoveredComponentId: null,
  audience: 'homeowner',
  view: 'model',
  compareSplit: 0.5,
  panelOpen: true,
  gallery: { open: false },
  demo: { playing: false, caption: null },
  feed: [],
  toasts: [],
  celebration: null,
  pulses: {},
  devOpen: false,
  camera: { preset: 'overview', nonce: 0 },
  syncing: false,

  async load() {
    if (loading) return
    loading = true
    try {
      const project = await service.getProject('luih-wpm-014')
      const idx = indexProject(project)
      set({ project, cursor: idx.today })
      channel.subscribe((e) => get().dispatch(e))
    } catch (err) {
      set({ error: String(err) })
    }
  },

  setCursor(d, opts) {
    const p = get().project
    if (!p) return
    const idx = indexProject(p)
    const c = Math.max(idx.start - 2, Math.min(idx.end + 2, d))
    set({ cursor: opts?.live ? idx.today : c, focusStageId: null })
  },

  animateCursorTo(d, duration = 0.9) {
    cursorTween?.kill()
    const o = { v: get().cursor }
    cursorTween = gsap.to(o, {
      v: d,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => set({ cursor: o.v }),
    })
  },

  goLive() {
    const p = get().project
    if (!p) return
    get().animateCursorTo(indexProject(p).today, 0.8)
    set({ focusStageId: null })
  },

  selectStage(id) {
    const p = get().project
    if (!p || !id) return set({ focusStageId: null })
    const stage = indexProject(p).stageById.get(id)
    get().animateCursorTo(stageFocusDay(p, id), 0.9)
    set({ focusStageId: id, selectedComponentId: null, panelOpen: true })
    if (stage) get().requestCamera(stage.cameraPreset, 1.0)
  },

  previewStage: (id) => set({ previewStageId: id }),
  setXray: (on) => set({ xray: on, isolate: on ? get().isolate : null }),
  toggleSystem: (k) => set({ systems: { ...get().systems, [k]: !get().systems[k] }, isolate: null }),
  setIsolate: (k) => set({ isolate: get().isolate === k ? null : k, xray: true }),
  select: (id) => set({ selectedComponentId: id, panelOpen: id ? true : get().panelOpen }),
  hover: (id) => {
    if (get().hoveredComponentId !== id) set({ hoveredComponentId: id })
  },
  setAudience: (a) => set({ audience: a }),
  setView(v) {
    set({ view: v })
    if (v === 'compare') {
      get().requestCamera('station:street', 1.0)
    }
  },
  setCompareSplit: (x) => set({ compareSplit: Math.max(0.02, Math.min(0.98, x)) }),
  setPanelOpen: (o) => set({ panelOpen: o }),
  openGallery: (opts = {}) => set({ gallery: { open: true, ...opts } }),
  closeGallery: () => set({ gallery: { open: false } }),
  setDemo: (d) => set({ demo: { ...get().demo, ...d } }),

  dispatch(e) {
    const p = get().project
    if (!p) return
    const wasLive = Math.abs(get().cursor - indexProject(p).today) < 0.01
    const { project, notices } = applyEvent(p, e)
    const now = performance.now()
    const pulses = { ...get().pulses }
    for (const n of notices) for (const c of n.pulse ?? []) pulses[c] = now
    const celebration =
      notices.find((n) => n.celebrate === 'stage') ?? notices.find((n) => n.celebrate === 'milestone') ?? notices.find((n) => n.celebrate === 'inspection') ?? null
    const toastable = notices.slice(0, 4)
    set({
      project,
      feed: [...notices.slice().reverse(), ...get().feed].slice(0, 40),
      toasts: [...toastable, ...get().toasts].slice(0, 4),
      pulses,
      celebration: celebration ?? get().celebration,
      cursor: wasLive ? indexProject(project).today : get().cursor,
    })
    for (const t of toastable) setTimeout(() => get().dismissToast(t.id), 5200)
    if (celebration) setTimeout(() => set({ celebration: null }), celebration.celebrate === 'stage' ? 2600 : 1900)
  },

  async simulateSync() {
    const p = get().project
    if (!p || get().syncing) return
    set({ syncing: true })
    await new Promise((r) => setTimeout(r, 650))
    const photos = await capturePhotos(p, 3)
    channel.publish?.(simulateSync(get().project!, photos))
    setTimeout(() => set({ syncing: false }), 200)
  },

  async addSitePhoto() {
    const p = get().project
    if (!p) return
    const photos = await capturePhotos(p, 1)
    channel.publish?.(ev('photo.added', { photos }, 'dev'))
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setDevOpen: (o) => set({ devOpen: o }),
  requestCamera: (preset, duration) => set({ camera: { preset, nonce: get().camera.nonce + 1, duration } }),
  setScrubbing: (s) => set({ scrubbing: s }),
}))

let photoSeq = 100
async function capturePhotos(p: Project, n: number): Promise<Photo[]> {
  const idx = indexProject(p)
  const stage = stageAt(p, idx.today)
  const wip = idx.tasks.find((t) => t.status === 'in_progress') ?? idx.tasks.find((t) => t.status !== 'complete')
  const out: Photo[] = []
  for (let i = 0; i < n; i++) {
    const station = STATIONS[(photoSeq + i) % STATIONS.length]
    let url = ''
    try {
      url = await capturePhoto(station, { date: fromDay(idx.today) })
    } catch {
      url = p.photos[p.photos.length - 1]?.url ?? ''
    }
    out.push({
      id: `p-live-${photoSeq++}`,
      date: fromDay(idx.today),
      stageId: stage.id,
      taskId: wip?.id,
      location: station === 'aerial' ? 'Lot — aerial' : station === 'rear-pool' ? 'Rear elevation' : 'Front elevation',
      tradeId: wip?.tradeId,
      caption: `${wip?.name ?? stage.shortName} — field photo`,
      url,
      station,
      source: 'buildertrend',
    })
  }
  return out
}

/** Read-only accessor for useFrame loops. */
export const journey = () => useJourney.getState()
