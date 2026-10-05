import { PanelRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useJourney } from '@/store/useJourney'
import { ConstructionTimeline } from './ConstructionTimeline'
import { DemoOverlay } from './DemoOverlay'
import { playDemo, stopDemo } from './demo'
import { DevPanel } from './DevPanel'
import { Celebration, EventFeed } from './EventFeed'
import { ExplorerPanel } from './ExplorerPanel'
import { HoverLabel } from './HoverLabel'
import { CompareView, PhotoView } from './PhotoView'
import { PhotoGallery } from './PhotoGallery'
import { ProjectOverview } from './ProjectOverview'
import { cx } from './primitives'
import { StageSelector } from './StageSelector'
import { Brand, SyncStatus, Toolbar } from './TopBar'
import { XRayControls } from './XRayControls'

const ConstructionScene = lazy(() => import('@/scene/ConstructionScene').then((m) => ({ default: m.ConstructionScene })))

/** Top-level experience: the house is the interface; chrome floats around it. */
export function BuildJourney() {
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

  const togglePlay = () => (useJourney.getState().demo.playing ? stopDemo() : playDemo())
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
        <div className={cx('absolute top-6 left-7 transition-opacity duration-500', playing && 'opacity-0')}>
          <Brand />
          <ProjectOverview />
          <div className="mt-3">
            <XRayControls />
          </div>
        </div>
        {/* Top-right: tools */}
        <div className={cx('absolute top-5 flex flex-col items-end gap-2 transition-all duration-500', panelVisible ? 'right-[412px]' : 'right-6', playing && 'pointer-events-none opacity-0')}>
          <Toolbar />
        </div>
        <ExplorerPanel />
        {!panelVisible && !playing && view === 'model' && (
          <button onClick={() => setPanelOpen(true)} className="surface pointer-events-auto absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl px-2.5 py-3 text-[11px] font-medium text-ink-2 [writing-mode:vertical-rl]">
            <PanelRight size={13} className="rotate-90" /> Details
          </button>
        )}

        {/* Bottom dock */}
        <div className={cx('surface pointer-events-auto absolute bottom-4 left-4 rounded-2xl px-5 pt-3 pb-2.5 transition-all duration-500', panelVisible ? 'right-[412px]' : 'right-4')}>
          <div className="flex items-center justify-between pb-2">
            <StageSelector onPlay={togglePlay} />
          </div>
          <div className="flex items-center gap-4 border-t border-black/[0.05] pt-1.5">
            <div className="min-w-0 flex-1">
              <ConstructionTimeline />
            </div>
          </div>
          <div className="mt-0.5 flex justify-between">
            <SyncStatus />
            <span className="text-[10.5px] text-faint">Drag to travel through time · ←/→ milestones</span>
          </div>
        </div>

        <DemoOverlay />
        <EventFeed />
        <Celebration />
        <DevPanel />
      </div>
      <PhotoGallery />
      <HoverLabel />

      {/* Intro veil */}
      <div className={cx('pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-paper-2 transition-opacity duration-[1100ms]', intro ? 'opacity-100' : 'opacity-0')}>
        <div className="text-center">
          <img src="/brand/luih_logo_dark.png" alt="LUIH" className="mx-auto h-8 w-auto" />
          <div className="mt-3 text-[10px] tracking-[0.3em] text-mute uppercase">Build Journey</div>
        </div>
      </div>
    </div>
  )
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = useJourney.getState()
      if (e.key === 'x' || e.key === 'X') s.setXray(!s.xray)
      else if (e.key === 'p' || e.key === 'P') (s.demo.playing ? stopDemo : playDemo)()
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
        if (st) s.selectStage(st.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
