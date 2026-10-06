import { PanelRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useJourney } from '@/store/useJourney'
import { ConstructionTimeline } from './ConstructionTimeline'
import { DemoOverlay } from './DemoOverlay'
import { restartDemo, stopDemo, togglePlay as toggleDemo } from './demo'
import { Notice } from './Notice'
import { DevPanel } from './DevPanel'
import { Celebration, EventFeed } from './EventFeed'
import { ExplorerPanel } from './ExplorerPanel'
import { HoverLabel } from './HoverLabel'
import { CompareView, PhotoView } from './PhotoView'
import { PhotoGallery } from './PhotoGallery'
import { ProjectOverview } from './ProjectOverview'
import { cx } from './primitives'
import { Brand, Toolbar } from './TopBar'
import { XRayControls } from './XRayControls'

const ConstructionScene = lazy(() => import('@/scene/ConstructionScene').then((m) => ({ default: m.ConstructionScene })))

/** Top-level experience: the house is the interface; chrome floats around it. */
export function BuildJourney() {
  const hasSchedule = useJourney((s) => (s.project?.phases.find((ph) => ph.key === 'construction')?.stages ?? []).some((st) => st.milestones.some((m) => m.tasks.length)))
  if (!hasSchedule) return <EmptySchedule />
  return <Journey />
}

/** Useful state instead of a crash when a project has no construction schedule yet. */
function EmptySchedule() {
  const project = useJourney((s) => s.project)
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-paper p-4">
      <div className="surface w-full max-w-md rounded-xl p-6">
        <img src="brand/luih_logo_dark.png" alt="LUIH" className="h-5 w-auto" />
        <h1 className="mt-4 text-xl font-semibold text-ink">{project?.name ?? 'Project'}</h1>
        <p className="mt-1 text-sm text-slate-700">No construction schedule has synced from Buildertrend yet, so there’s nothing to build in 3D.</p>
        <p className="mt-3 text-caption text-slate-700">Once the job’s stages and tasks are scheduled, the Build Journey fills in automatically.</p>
      </div>
    </div>
  )
}

function Journey() {
  const view = useJourney((s) => s.view)
  const playing = useJourney((s) => s.demo.playing)
  const panelOpen = useJourney((s) => s.panelOpen)
  const setPanelOpen = useJourney((s) => s.setPanelOpen)
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1300)
    useJourney.getState().requestCamera('aerial', 0)
    const c = setTimeout(() => useJourney.getState().requestCamera('overview', 2.4), 250)
    return () => {
      clearTimeout(t)
      clearTimeout(c)
    }
  }, [])

  useKeyboard()

  const panelVisible = panelOpen && !playing && view === 'model'

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Suspense fallback={null}>
        <ConstructionScene />
      </Suspense>
      {view === 'photo' && <PhotoView />}
      {view === 'compare' && <CompareView />}

      <div className="pointer-events-none absolute inset-0">
        {/* Top-left: brand + overview */}
        <div className={cx('absolute top-6 left-7 transition-opacity duration-500 max-md:top-3 max-md:right-4 max-md:left-4', playing && 'opacity-0')}>
          <Brand />
          <ProjectOverview />
          <div className="mt-3">
            <XRayControls />
          </div>
        </div>
        {/* Top-right: tools */}
        <div className={cx('absolute top-5 flex flex-col items-end gap-2 transition-all duration-500 max-md:top-auto max-md:right-3 max-md:bottom-[176px] max-md:left-3 max-md:items-center', panelVisible ? 'right-[412px] max-md:opacity-0' : 'right-6', playing && 'pointer-events-none opacity-0')}>
          <Toolbar />
        </div>
        <ExplorerPanel />
        {!panelVisible && !playing && view === 'model' && (
          <button onClick={() => setPanelOpen(true)} className="surface pointer-events-auto absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl border-r-0 px-2.5 py-3 text-xs font-medium text-slate-700 [writing-mode:vertical-rl] hover:text-ink max-md:top-[44%]">
            <PanelRight size={14} className="rotate-90" /> Details
          </button>
        )}

        {/* Bottom dock: the time machine */}
        <div className={cx('surface pointer-events-auto absolute bottom-4 left-4 rounded-xl px-4 pt-3 pb-2 transition-all duration-500 max-md:right-2 max-md:bottom-[max(8px,env(safe-area-inset-bottom))] max-md:left-2 max-md:px-3', panelVisible ? 'right-[412px]' : 'right-4')}>
          <ConstructionTimeline onPlay={toggleDemo} onStop={stopDemo} onRestart={restartDemo} />
        </div>

        <DemoOverlay />
        <Notice />
        <EventFeed />
        <Celebration />
        <DevPanel />
      </div>
      <PhotoGallery />
      <HoverLabel />

      {/* Intro veil */}
      <div className={cx('pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-paper transition-opacity duration-[1100ms]', intro ? 'opacity-100' : 'opacity-0')}>
        <div className="text-center">
          <img src="brand/luih_logo_dark.png" alt="LUIH" className="mx-auto h-8 w-auto" />
          <div className="mt-3 text-xs font-medium text-slate-700">Build Journey</div>
        </div>
      </div>
    </div>
  )
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input,textarea,select,[contenteditable]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = useJourney.getState()
      if (e.key === 'x' || e.key === 'X') s.setXray(!s.xray)
      else if (e.key === 'p' || e.key === 'P') toggleDemo()
      else if (e.key === '`') s.setDevOpen(!s.devOpen)
      else if (e.key === 'r' || e.key === 'R') s.requestCamera('overview', 0.9)
      else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
      else if (e.key === 'Escape') {
        if (s.demo.playing) stopDemo()
        else if (s.selectedComponentId) s.select(null)
        else if (s.view !== 'model') s.setView('model')
      } else if (/^[1-6]$/.test(e.key)) {
        const p = s.project
        const stages = p?.phases.find((ph) => ph.key === 'construction')?.stages ?? []
        const st = stages[+e.key - 1]
        if (st) {
          stopDemo()
          s.selectStage(st.id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
