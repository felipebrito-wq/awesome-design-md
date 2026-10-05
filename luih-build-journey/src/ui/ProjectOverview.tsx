import { fmtDay } from '@/lib/dates'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'
import { pct, STATUS_LABEL, useDerived } from './useDerived'

const STATUS_DOT = { on_schedule: 'bg-ok', at_risk: 'bg-warn', delayed: 'bg-risk' } as const

function Ring({ value, size = 54 }: { value: number; size?: number }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(27,30,34,0.08)" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-accent)" strokeWidth={3} strokeDasharray={`${c * value} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 500ms ease' }} />
    </svg>
  )
}

export function ProjectOverview() {
  const d = useDerived()
  const audience = useJourney((s) => s.audience)
  const goLive = useJourney((s) => s.goLive)
  const openBlockers = d.project.blockers.filter((b) => !b.resolvedDate).length

  return (
    <div className="surface pointer-events-auto mt-5 w-[300px] rounded-2xl px-4 py-3.5">
      <div className="flex items-center gap-3.5">
        <div className="relative">
          <Ring value={d.overall} />
          <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular-nums">{pct(d.overall)}</div>
        </div>
        <div className="min-w-0">
          <div className="kicker">{d.isLive ? 'Current stage' : d.isForecast ? 'Forecast · ' + fmtDay(d.cursor) : 'Viewing · ' + fmtDay(d.cursor)}</div>
          <div className="mt-0.5 truncate text-[15px] font-medium">{d.stage.shortName}</div>
          {!d.isLive ? (
            <button onClick={goLive} className="mt-0.5 text-[11.5px] font-medium text-accent hover:underline">
              Back to today →
            </button>
          ) : (
            <div className="mt-0.5 text-[11.5px] text-mute">Next: {d.next?.name ?? 'Handover'}</div>
          )}
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-3">
        <div>
          <div className="eyebrow">Est. completion</div>
          <div className="mt-1 text-[13px] font-medium">{fmtDay(d.forecast, { year: false })}</div>
        </div>
        <div>
          <div className="eyebrow">Status</div>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium">
            <span className={cx('h-1.5 w-1.5 rounded-full', STATUS_DOT[d.status])} />
            {STATUS_LABEL[d.status]}
          </div>
        </div>
        {audience === 'internal' && (
          <>
            <div>
              <div className="eyebrow">Variance</div>
              <div className={cx('mt-1 text-[13px] font-medium tabular-nums', d.variance > 0 ? 'text-risk' : 'text-ink')}>
                {d.variance > 0 ? `+${d.variance}` : d.variance} days
              </div>
            </div>
            <div>
              <div className="eyebrow">Open blockers</div>
              <div className={cx('mt-1 text-[13px] font-medium', openBlockers ? 'text-warn' : 'text-ink')}>{openBlockers}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
