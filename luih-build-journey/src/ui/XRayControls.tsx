import { Eye, EyeOff } from 'lucide-react'
import { SYSTEMS } from '@/domain/layers'
import { useJourney } from '@/store/useJourney'
import { useDerived } from './useDerived'
import { cx } from './primitives'

/** System toggles. Click name → isolate; eye → show/hide. */
export function XRayControls() {
  const xray = useJourney((s) => s.xray)
  const systems = useJourney((s) => s.systems)
  const isolate = useJourney((s) => s.isolate)
  const toggle = useJourney((s) => s.toggleSystem)
  const setIsolate = useJourney((s) => s.setIsolate)
  const d = useDerived()
  const schematic = d.project.components.some((c) => !!c.specs?.Routing)
  if (!xray) return null
  return (
    <div className="surface anim-fade-up pointer-events-auto w-[220px] rounded-xl p-2">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="text-sm font-semibold text-ink">X-Ray systems</span>
        {isolate && (
          <button className="text-xs font-medium text-accent-dark hover:underline" onClick={() => setIsolate(null)}>
            Show all
          </button>
        )}
      </div>
      {SYSTEMS.map((s) => {
        const on = systems[s.key]
        const iso = isolate === s.key
        return (
          <div key={s.key} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors', iso ? 'bg-slate-50' : 'hover:bg-slate-50', isolate && !iso && 'opacity-45')}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: s.color }} />
            <button className="flex-1 text-left text-sm font-medium text-ink" onClick={() => setIsolate(s.key)} title="Isolate">
              {s.label}
            </button>
            <button className="text-mute hover:text-ink" onClick={() => toggle(s.key)} title={on ? 'Hide' : 'Show'}>
              {on ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        )
      })}
      {schematic && (
        <div className="mx-2 mt-2 rounded-lg border border-line bg-slate-50 px-2.5 py-2 text-caption text-slate-700" role="note">
          <span className="font-medium text-ink">Schematic routes.</span> No MEP drawings supplied — runs are illustrative; equipment and fixtures follow the plans.
        </div>
      )}
      {!schematic && <div className="px-2 pt-2 pb-1 text-caption text-slate-700">Select a system to isolate it. Finishes fade to show the structure and systems inside the walls.</div>}
    </div>
  )
}
