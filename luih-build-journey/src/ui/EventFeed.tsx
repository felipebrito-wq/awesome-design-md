import { AlertTriangle, Camera, Check, TrendingUp } from 'lucide-react'
import type { Notice } from '@/services/realtime/events'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'

function Icon({ n }: { n: Notice }) {
  if (n.kind === 'success')
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ok/12 text-ok">
        {n.celebrate === 'inspection' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
          </svg>
        ) : (
          <Check size={14} strokeWidth={2.5} />
        )}
      </span>
    )
  if (n.kind === 'warning')
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warn/12 text-warn">
        <AlertTriangle size={14} />
      </span>
    )
  if (n.kind === 'photo')
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Camera size={14} />
      </span>
    )
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.05] text-ink-2">
      <TrendingUp size={14} />
    </span>
  )
}

/** Live Buildertrend update toasts (top-center). */
export function EventFeed() {
  const toasts = useJourney((s) => s.toasts)
  const dismiss = useJourney((s) => s.dismissToast)
  return (
    <div className="pointer-events-none absolute top-5 left-1/2 z-30 flex w-[360px] -translate-x-1/2 flex-col gap-2">
      {toasts.map((n) => (
        <button key={n.id} onClick={() => dismiss(n.id)} className={cx('surface anim-fade-up pointer-events-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-left')}>
          <Icon n={n} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium">{n.title}</div>
            {n.detail && <div className="truncate text-[11px] text-mute">{n.detail}</div>}
          </div>
          <span className="text-[10px] tracking-wide text-faint uppercase">Buildertrend</span>
        </button>
      ))}
    </div>
  )
}

/** Restrained milestone / stage celebration. */
export function Celebration() {
  const c = useJourney((s) => s.celebration)
  if (!c || c.celebrate === 'inspection') return null
  const big = c.celebrate === 'stage'
  return (
    <div key={c.id} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div className="relative flex flex-col items-center">
        <span className="ring-out absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
        <span className="ring-out absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/60" style={{ animationDelay: '220ms' }} />
        <div className="caption-in rounded-2xl bg-white/90 px-6 py-4 text-center shadow-xl backdrop-blur">
          <div className="kicker justify-center">{big ? 'Stage complete' : 'Milestone reached'}</div>
          <div className={cx('mt-1 font-semibold tracking-[-0.015em]', big ? 'text-[24px]' : 'text-[17px]')}>{c.title.replace('Milestone complete: ', '')}</div>
        </div>
      </div>
    </div>
  )
}
