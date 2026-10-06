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
        'surface pointer-events-auto absolute top-4 right-4 bottom-4 z-40 flex w-[380px] flex-col overflow-hidden rounded-xl transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] max-md:top-auto max-md:right-2 max-md:bottom-2 max-md:left-2 max-md:h-[64%] max-md:w-auto',
        visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-[110%] opacity-0 max-md:translate-x-0 max-md:translate-y-[110%]',
      )}
    >
      {/* DS drawer chrome: title + window controls, hairline below */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line pr-2 pl-5">
        <span className="text-sm font-semibold text-ink">{selected ? 'Component' : 'Stage details'}</span>
        <button onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 hover:text-ink" title="Close panel" aria-label="Close panel">
          <X size={16} />
        </button>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{selected ? <ComponentInspector componentId={selected} /> : <StagePanel stage={stage} />}</div>
    </aside>
  )
}
