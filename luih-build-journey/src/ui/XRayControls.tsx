import { Eye, EyeOff } from 'lucide-react'
import { SYSTEMS } from '@/domain/layers'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'

/** System toggles. Click name → isolate; eye → show/hide. */
export function XRayControls() {
  const xray = useJourney((s) => s.xray)
  const systems = useJourney((s) => s.systems)
  const isolate = useJourney((s) => s.isolate)
  const toggle = useJourney((s) => s.toggleSystem)
  const setIsolate = useJourney((s) => s.setIsolate)
  if (!xray) return null
  return (
    <div className="surface anim-fade-up pointer-events-auto w-[220px] rounded-2xl p-2">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <span className="eyebrow">X-Ray · Systems</span>
        {isolate && (
          <button className="text-[11px] font-medium text-accent" onClick={() => setIsolate(null)}>
            Show all
          </button>
        )}
      </div>
      {SYSTEMS.map((s) => {
        const on = systems[s.key]
        const iso = isolate === s.key
        return (
          <div key={s.key} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors', iso ? 'bg-black/[0.05]' : 'hover:bg-black/[0.03]', isolate && !iso && 'opacity-45')}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: s.color }} />
            <button className="flex-1 text-left text-[12.5px] font-medium text-ink-2" onClick={() => setIsolate(s.key)} title="Isolate">
              {s.label}
            </button>
            <button className="text-faint hover:text-ink" onClick={() => toggle(s.key)} title={on ? 'Hide' : 'Show'}>
              {on ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        )
      })}
      <div className="px-2 pt-2 pb-1 text-[10.5px] leading-snug text-faint">Click a system to isolate it. Finishes fade to reveal what’s inside the walls.</div>
    </div>
  )
}
