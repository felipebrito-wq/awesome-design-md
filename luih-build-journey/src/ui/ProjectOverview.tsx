import { fmtDay } from '@/lib/dates'
import { useJourney } from '@/store/useJourney'
import { Chip, cx, type ChipTone } from './primitives'
import { pct, STATUS_LABEL, useDerived } from './useDerived'

const STATUS_TONE: Record<string, ChipTone> = { on_schedule: 'ok', at_risk: 'warn', delayed: 'risk' }

/** Project summary card: where the house is, whether it's on track, when it lands. */
export function ProjectOverview() {
  const d = useDerived()
  const audience = useJourney((s) => s.audience)
  const goLive = useJourney((s) => s.goLive)
  const openBlockers = d.project.blockers.filter((b) => !b.resolvedDate).length
  const stageNo = d.idx.stages.findIndex((s) => s.id === d.stage.id) + 1

  return (
    <div className="surface pointer-events-auto mt-4 w-[300px] rounded-xl p-4 max-md:mt-3 max-md:w-full max-md:p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{d.stage.shortName}</div>
          <div className="mt-0.5 text-caption text-slate-700">
            Stage <span className="num">{stageNo}</span> of <span className="num">{d.idx.stages.length}</span>
          </div>
        </div>
        <Chip tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Chip>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="num text-2xl font-semibold text-ink">{pct(d.overall)}</span>
        <span className="text-caption text-slate-700">built{d.isLive ? '' : ` by ${fmtDay(d.cursor)}`}</span>
      </div>
      {/* One segment per stage, so overall % reads against the plan, not in the abstract */}
      <div className="mt-2 flex gap-[3px]" aria-hidden>
        {d.idx.stages.map((s) => {
          const p = d.stageProgress.get(s.id) ?? 0
          return (
            <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-50">
              <div className={cx('h-full rounded-full transition-[width] duration-500', p >= 0.999 ? 'bg-accent' : 'bg-ink')} style={{ width: `${p * 100}%` }} />
            </div>
          )
        })}
      </div>

      {d.isForecast && (
        <p className="mt-3 flex items-start gap-2 text-caption text-slate-700">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-300" aria-hidden />
          Slate parts are scheduled, not yet reported complete in Buildertrend.
        </p>
      )}
      {!d.isLive && (
        <button onClick={goLive} className="mt-3 text-xs font-medium text-accent-dark hover:underline">
          Back to today ({fmtDay(d.today)}) →
        </button>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 max-md:hidden">
        <div>
          <dt className="label">Est. completion</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{fmtDay(d.forecast, { year: false })}</dd>
        </div>
        <div className="min-w-0">
          <dt className="label">Next milestone</dt>
          <dd className="mt-1 truncate text-sm font-medium text-ink" title={d.next?.name}>
            {d.next?.name ?? 'Handover'}
          </dd>
        </div>
        {audience === 'internal' && (
          <>
            <div>
              <dt className="label">Variance</dt>
              <dd className={cx('num mt-1 text-sm font-medium', d.variance > 0 ? 'text-error-ink' : 'text-ink')}>
                {d.variance > 0 ? `+${d.variance}` : d.variance} days
              </dd>
            </div>
            <div>
              <dt className="label">Open blockers</dt>
              <dd className={cx('num mt-1 text-sm font-medium', openBlockers ? 'text-warning-ink' : 'text-ink')}>{openBlockers}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  )
}
