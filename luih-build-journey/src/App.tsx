import { lazy, Suspense, useEffect } from 'react'
import { sceneFlags, capturePhoto } from '@/lib/capture'
import { useJourney } from '@/store/useJourney'
import { BuildJourney } from '@/ui/BuildJourney'

if (import.meta.env.DEV) Object.assign(window, { __luih: useJourney, __sceneFlags: sceneFlags })

const ConstructionScene = lazy(() => import('@/scene/ConstructionScene').then((m) => ({ default: m.ConstructionScene })))

/** ?capture=1 renders the scene only and exposes a photo-capture hook (scripts/capture-photos.mjs). */
const captureMode = new URLSearchParams(location.search).has('capture')
if (captureMode) Object.assign(window, { __capture: capturePhoto })

export function App() {
  const load = useJourney((s) => s.load)
  const ready = useJourney((s) => !!s.project)
  const error = useJourney((s) => s.error)
  useEffect(() => {
    void load()
  }, [load])
  if (error)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper p-4">
        <div className="surface w-full max-w-sm rounded-xl p-5" role="alert">
          <div className="text-sm font-semibold text-ink">Couldn’t load the project</div>
          <p className="mt-1 text-caption text-slate-700">{error}</p>
          <button onClick={() => void load()} className="mt-4 inline-flex h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white hover:bg-accent-dark">
            Try again
          </button>
        </div>
      </div>
    )
  if (!ready)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-paper" role="status" aria-live="polite">
        <div className="text-center">
          <img src="brand/luih_logo_dark.png" alt="LUIH" className="mx-auto h-7 w-auto" />
          <div className="mt-3 text-xs font-medium text-slate-700">Loading project…</div>
          <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-slate-50">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
          </div>
        </div>
      </div>
    )
  if (captureMode)
    return (
      <div className="fixed inset-0">
        <Suspense fallback={null}>
          <ConstructionScene />
        </Suspense>
      </div>
    )
  return <BuildJourney />
}
