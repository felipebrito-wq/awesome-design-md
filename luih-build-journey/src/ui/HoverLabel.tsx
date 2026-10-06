import { useEffect, useRef } from 'react'
import { fmtDay } from '@/lib/dates'
import { indexProject, taskProgressAt } from '@/lib/schedule'
import { componentIndex } from '@/scene/home/partState'
import { useJourney } from '@/store/useJourney'

/** Small label following the pointer when hovering a building component. */
export function HoverLabel() {
  const hovered = useJourney((s) => s.hoveredComponentId)
  const project = useJourney((s) => s.project)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', on)
    return () => window.removeEventListener('pointermove', on)
  }, [])
  const comp = hovered && project ? componentIndex(project).get(hovered) : undefined
  let status = ''
  if (comp && project) {
    const idx = indexProject(project)
    const t = idx.taskById.get(comp.taskId)
    const p = t ? taskProgressAt(t, idx.today, idx.today) : 0
    status = p >= 0.999 ? `Complete${t?.actualEnd ? ' · ' + fmtDay(t.actualEnd) : ''}` : p > 0 ? `In progress · ${Math.round(p * 100)}%` : 'Scheduled'
  }
  return (
    <div ref={ref} className="pointer-events-none fixed top-0 left-0 z-40" style={{ opacity: comp ? 1 : 0, transition: 'opacity 150ms' }}>
      {comp && (
        <div className="rounded-lg bg-ink/90 px-2.5 py-1.5 text-white shadow-lg backdrop-blur">
          <div className="text-caption font-medium">{comp.name}</div>
          <div className="text-[10px] text-white/65">{status}</div>
        </div>
      )}
    </div>
  )
}
