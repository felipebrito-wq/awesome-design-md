import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** DS progress bar. `ok`/`accent` = complete (signal), `ink` = work in progress. */
export function ProgressBar({ value, tone = 'ink', className = '', h = 3 }: { value: number; tone?: 'ink' | 'accent' | 'ok' | 'warn'; className?: string; h?: number }) {
  const color = { ink: 'bg-ink', accent: 'bg-accent', ok: 'bg-accent', warn: 'bg-warning' }[tone]
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-slate-50', className)} style={{ height: h }}>
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

/** Stage / task progress: complete reads as accent, in progress as ink. */
export const progressTone = (p: number) => (p >= 0.999 ? 'accent' : 'ink') as 'accent' | 'ink'

export type ChipTone = 'neutral' | 'ok' | 'warn' | 'risk' | 'accent' | 'info'

/** DS StatusBadge: soft fill + saturated label, always text (never colour alone). */
export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: ChipTone }) {
  const t = {
    neutral: 'bg-slate-50 text-slate-700',
    ok: 'bg-accent-soft/60 text-accent-dark',
    accent: 'bg-accent-soft/60 text-accent-dark',
    warn: 'bg-warning-soft text-warning-ink',
    risk: 'bg-error-soft text-error-ink',
    info: 'bg-info-soft text-info-ink',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', t)}>{children}</span>
}

/** Status of a stage at a progress value — one map, used by every surface. */
export function stageStatus(p: number): { label: string; tone: ChipTone } {
  if (p >= 0.999) return { label: 'Complete', tone: 'ok' }
  if (p > 0) return { label: 'In progress', tone: 'info' }
  return { label: 'Upcoming', tone: 'neutral' }
}

export function StatusIcon({ progress, blocked = false, size = 16 }: { progress: number; blocked?: boolean; size?: number }) {
  if (progress >= 0.999)
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-white" style={{ width: size, height: size }}>
        <Check size={size * 0.62} strokeWidth={3} />
      </span>
    )
  const r = size / 2 - 1.5
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-slate-300)" strokeWidth={1.5} />
      {progress > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={blocked ? 'var(--color-warning)' : 'var(--color-ink)'} strokeWidth={2} strokeDasharray={`${c * progress} ${c}`} strokeLinecap="round" />
      )}
    </svg>
  )
}

/** DS view toggle (Table | Cards pattern): bordered group, active segment in ink. */
export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode; title?: string }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-slate-50 p-0.5" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          title={o.title}
          aria-pressed={value === o.value}
          className={cx(
            'inline-flex items-center rounded-md font-medium transition-colors duration-150',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-xs',
            value === o.value ? 'bg-ink text-white' : 'text-slate-700 hover:bg-white hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function IconButton({ children, onClick, active, title, className }: { children: ReactNode; onClick?: () => void; active?: boolean; title?: string; className?: string }) {
  return (
    <button
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150',
        active ? 'bg-ink text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="label">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-ink">{value}</div>
      {sub && <div className="text-xs text-mute">{sub}</div>}
    </div>
  )
}
