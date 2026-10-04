import { X } from 'lucide-react'
import { useJourney } from '@/store/useJourney'
import { ComponentInspector } from './ComponentInspector'
import { cx } from './primitives'
import { StagePanel } from './StagePanel'
import { useDerived } from './useDerived'

/** Contextual right panel: stage explorer or component inspector. */
export function ExplorerPanel() {
  const d = useDerived()
  const open = useJourney((s) => s.panelOpen)
  const setOpen = useJourney((s) => s.setPanelOpen)
  const selected = useJourney((s) => s.selectedComponentId)
  const focusStageId = useJourney((s) => s.focusStageId)
  const demo = useJourney((s) => s.demo.playing)
  const view = useJourney((s) => s.view)
  const stage = (focusStageId && d.idx.stageById.get(focusStageId)) || d.stage
  const visible = open && !demo && view === 'model'

  return (
    <aside
      className={cx(
        'surface pointer-events-auto absolute top-4 right-4 bottom-4 flex w-[380px] flex-col overflow-hidden rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]',
        visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-[110%] opacity-0',
      )}
    >
      <button onClick={() => setOpen(false)} className="absolute top-3.5 right-3.5 z-20 rounded-full p-1.5 text-faint hover:bg-black/5 hover:text-ink" title="Close panel">
        <X size={14} />
      </button>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{selected ? <ComponentInspector componentId={selected} /> : <StagePanel stage={stage} />}</div>
    </aside>
  )
}
