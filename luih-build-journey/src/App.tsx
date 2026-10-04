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
  if (error) return <div className="p-8 text-sm text-risk">Failed to load project: {error}</div>
  if (!ready) return <div className="fixed inset-0 bg-paper" />
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
