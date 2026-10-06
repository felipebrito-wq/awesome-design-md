import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'

/** LUIH OS toast: bottom-right, auto-dismiss 4 s, manual close (DESIGN_SYSTEM §Toast). */
export function Notice() {
  const n = useJourney((s) => s.notice)
  const notify = useJourney((s) => s.notify)
  useEffect(() => {
    if (!n) return
    const t = setTimeout(() => notify(null), 4000)
    return () => clearTimeout(t)
  }, [n, notify])
  if (!n) return null
  const Icon = n.kind === 'error' ? XCircle : n.kind === 'success' ? CheckCircle : Info
  return (
    <div
      role="status"
      className={cx(
        'anim-fade-up pointer-events-auto absolute right-4 bottom-[196px] z-50 flex w-[320px] items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-[var(--shadow-float)] max-md:right-2 max-md:left-2 max-md:w-auto',
        n.kind === 'error' ? 'border-error-soft bg-error-soft' : n.kind === 'success' ? 'border-accent-soft bg-accent-soft' : 'border-info-soft bg-info-soft',
      )}
    >
      <Icon size={16} className={cx('mt-0.5 shrink-0', n.kind === 'error' ? 'text-error-ink' : n.kind === 'success' ? 'text-accent-dark' : 'text-info-ink')} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{n.title}</div>
        {n.body && <div className="mt-0.5 text-caption text-slate-700">{n.body}</div>}
      </div>
      <button onClick={() => notify(null)} className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-700 hover:bg-white/60 hover:text-ink" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
