import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export function ProgressBar({ value, tone = 'ink', className = '', h = 3 }: { value: number; tone?: 'ink' | 'accent' | 'ok' | 'warn'; className?: string; h?: number }) {
  const color = { ink: 'bg-ink', accent: 'bg-accent', ok: 'bg-ok', warn: 'bg-warn' }[tone]
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-black/[0.07]', className)} style={{ height: h }}>
      <div className={cx('h-full rounded-full transition-[width] duration-500 ease-out', color)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'risk' | 'accent' }) {
  const t = {
    neutral: 'bg-black/[0.05] text-ink-2',
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-warn/12 text-warn',
    risk: 'bg-risk/10 text-risk',
    accent: 'bg-accent-soft text-accent',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px] font-medium whitespace-nowrap', t)}>{children}</span>
}

export function StatusIcon({ progress, blocked = false, size = 16 }: { progress: number; blocked?: boolean; size?: number }) {
  if (progress >= 0.999)
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-white" style={{ width: size, height: size }}>
        <Check size={size * 0.62} strokeWidth={3} />
      </span>
    )
  const r = size / 2 - 1.5
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(27,30,34,0.15)" strokeWidth={1.5} />
      {progress > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={blocked ? 'var(--color-warn)' : 'var(--color-accent)'} strokeWidth={2} strokeDasharray={`${c * progress} ${c}`} strokeLinecap="round" />
      )}
    </svg>
  )
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="inline-flex rounded-full bg-black/[0.05] p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-full font-medium transition-all duration-200',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12px]',
            value === o.value ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-mute hover:text-ink',
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
      onClick={onClick}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200',
        active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-black/[0.05]',
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
      <div className="eyebrow">{label}</div>
      <div className="mt-1 truncate text-[13px] font-medium text-ink">{value}</div>
      {sub && <div className="text-[11px] text-mute">{sub}</div>}
    </div>
  )
}
