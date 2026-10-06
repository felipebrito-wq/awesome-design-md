import { AlertTriangle, Check, ChevronDown, FileText, Phone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { Inspection, Milestone, Stage, Task } from '@/domain/types'
import { fmtDay, toDay } from '@/lib/dates'
import { disciplineBreakdown, forecastEnd, milestoneProgress, stageProgress as stageProgressAt, taskProgressAt } from '@/lib/schedule'
import { ev } from '@/services/realtime/events'
import { useJourney } from '@/store/useJourney'
import { Chip, cx, ProgressBar, progressTone, stageStatus, StatusIcon } from './primitives'
import { pct, useDerived } from './useDerived'

type Tab = 'milestones' | 'tasks' | 'inspections' | 'photos' | 'plans' | 'home' | 'documents' | 'approvals' | 'team' | 'issues' | 'activity'

const HOMEOWNER_TABS: Tab[] = ['milestones', 'photos', 'plans', 'home', 'approvals', 'documents']
const INTERNAL_TABS: Tab[] = ['tasks', 'inspections', 'photos', 'plans', 'issues', 'team', 'home', 'documents', 'activity']
const TAB_LABEL: Record<Tab, string> = {
  milestones: 'Milestones',
  tasks: 'Tasks',
  inspections: 'Inspections',
  photos: 'Photos',
  plans: 'Plans',
  home: 'Home',
  documents: 'Docs',
  approvals: 'Approvals',
  team: 'Trades',
  issues: 'Issues',
  activity: 'Activity',
}

export function InspectionChip({ i }: { i: Inspection }) {
  if (i.result === 'passed')
    return (
      <Chip tone="ok">
        <Check size={11} strokeWidth={3} /> Passed
      </Chip>
    )
  if (i.result === 'failed') return <Chip tone="risk">Failed</Chip>
  if (i.result === 'delayed') return <Chip tone="warn">Delayed</Chip>
  return <Chip>Scheduled {fmtDay(i.scheduledDate)}</Chip>
}

function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex items-center gap-3 border-b border-line py-2.5 last:border-0', className)}>{children}</div>
}

export function StagePanel({ stage }: { stage: Stage }) {
  const d = useDerived()
  const audience = useJourney((s) => s.audience)
  const hasApprovals = d.idx.milestones.some((m) => m.approvals.length)
  const tabs = (audience === 'homeowner' ? HOMEOWNER_TABS : INTERNAL_TABS).filter(
    (t) => (t !== 'plans' || !!d.project.drawings?.length) && (t !== 'home' || !!d.project.facts?.length) && (t !== 'approvals' || hasApprovals),
  )
  const [tabState, setTab] = useState<Tab>(tabs[0])
  const tab = tabs.includes(tabState) ? tabState : tabs[0]
  const p = d.stageProgress.get(stage.id) ?? 0
  const range = d.idx.stageRange.get(stage.id)!
  const breakdown = disciplineBreakdown(stage, d.cursor, d.today)
  const reported = stageProgressAt(stage, d.today, d.today)
  const st = stageStatus(p, reported)
  const photos = d.project.photos.filter((ph) => ph.stageId === stage.id && toDay(ph.date) <= d.today)

  return (
    <div className="anim-fade-up" key={stage.id}>
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2">
          <span className="num text-xs text-slate-700">STAGE {stage.code}</span>
          <Chip tone={st.tone}>{st.label}</Chip>
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">{stage.name}</h2>
        {audience === 'homeowner' && <p className="mt-1 text-sm text-slate-700">{stage.story}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line p-3">
            <div className="text-caption text-slate-700">{d.isLive ? 'Progress' : `Progress · ${fmtDay(d.cursor)}`}</div>
            <div className="num mt-1 text-xl font-semibold text-ink">{pct(p)}</div>
            <ProgressBar value={p} tone={progressTone(p)} className="mt-2" h={4} />
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-caption text-slate-700">Window</div>
            <div className="mt-1 text-sm font-semibold text-ink">
              {fmtDay(range[0])} – {fmtDay(range[1] - 1)}
            </div>
            <div className="mt-1 text-caption text-slate-700">
              <span className="num">{Math.round(range[1] - range[0])}</span> days
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{b.label}</span>
                <span className="num text-xs font-medium text-ink">{pct(b.progress)}</span>
              </div>
              <ProgressBar value={b.progress} tone={progressTone(b.progress)} className="mt-1.5" h={3} />
            </div>
          ))}
        </div>
      </div>

      {/* DS entity tabs: underline, accent rule on the active tab */}
      <div className="sticky top-0 z-10 mt-5 border-b border-line bg-white">
        <div className="scroll-thin flex gap-4 overflow-x-auto px-5" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cx('-mb-px border-b-2 py-2.5 text-sm whitespace-nowrap transition-colors', tab === t ? 'border-accent font-medium text-ink' : 'border-transparent text-slate-700 hover:text-ink')}
            >
              {TAB_LABEL[t]}
              {t === 'photos' && <span className="num ml-1 text-slate-500">{photos.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-1 pb-6">
        {tab === 'milestones' && <Milestones stage={stage} />}
        {tab === 'tasks' && <Tasks stage={stage} />}
        {tab === 'inspections' && <Inspections stage={stage} />}
        {tab === 'photos' && <Photos stageId={stage.id} />}
        {tab === 'documents' && <Documents stageId={stage.id} />}
        {tab === 'plans' && <Plans />}
        {tab === 'home' && <HomeFacts />}
        {tab === 'approvals' && <Approvals />}
        {tab === 'team' && <Team stage={stage} />}
        {tab === 'issues' && <Issues stage={stage} />}
        {tab === 'activity' && <Activity />}
      </div>
    </div>
  )
}

function Milestones({ stage }: { stage: Stage }) {
  const d = useDerived()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div>
      {stage.milestones
        .filter((m) => m.homeownerVisible)
        .map((m: Milestone) => {
          const p = milestoneProgress(m, d.cursor, d.today)
          const reported = milestoneProgress(m, d.today, d.today)
          const forecast = p >= 0.999 && reported < 0.999
          const end = Math.max(...m.tasks.map((t) => (t.actualEnd ? toDay(t.actualEnd) : forecastEnd(t))))
          return (
            <div key={m.id} className="border-b border-line last:border-0">
              <button className="flex w-full items-center gap-3 py-3 text-left" onClick={() => setOpen(open === m.id ? null : m.id)}>
                <StatusIcon progress={p} forecast={forecast} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-mute">
                    {reported >= 0.999 ? 'Completed' : forecast ? 'Scheduled · not yet reported' : p > 0 ? 'In progress · target' : 'Planned'} {fmtDay(end)}
                  </div>
                </div>
                <span className="num text-xs font-medium text-ink">{pct(p)}</span>
                <ChevronDown size={14} className={cx('text-mute transition-transform', open === m.id && 'rotate-180')} />
              </button>
              {open === m.id && (
                <div className="anim-fade-up mb-3 ml-7 space-y-1.5">
                  {m.tasks.map((t) => {
                    const tp = taskProgressAt(t, d.cursor, d.today)
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-caption text-ink-2">
                        <StatusIcon progress={tp} size={12} />
                        <span className="flex-1 truncate">{t.name}</span>
                        {t.inspections.map((i) => (
                          <InspectionChip key={i.id} i={i} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}

function TaskRow({ t }: { t: Task }) {
  const d = useDerived()
  const [open, setOpen] = useState(false)
  const trade = d.project.tradePartners.find((x) => x.id === t.tradeId)
  const tp = taskProgressAt(t, d.cursor, d.today)
  const blocked = d.project.blockers.some((b) => b.taskId === t.id && !b.resolvedDate)
  return (
    <div className="border-b border-line last:border-0">
      <button className="flex w-full items-center gap-3 py-2.5 text-left" onClick={() => setOpen(!open)}>
        <StatusIcon progress={tp} blocked={blocked} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{t.name}</div>
          <div className="truncate text-xs text-mute">
            {trade?.name ?? 'LUIH'} · {fmtDay(t.actualStart ?? t.plannedStart)} – {fmtDay(t.actualEnd ?? forecastEnd(t))}
          </div>
        </div>
        {t.delayDays > 0 && <Chip tone="warn">+{t.delayDays}d</Chip>}
        {blocked && <AlertTriangle size={13} className="text-warn" />}
        <span className="num w-9 text-right text-xs text-ink">{pct(tp)}</span>
      </button>
      {open && (
        <div className="anim-fade-up mb-3 ml-7 space-y-1">
          {t.checklist.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-caption">
              <span className={cx('flex h-3.5 w-3.5 items-center justify-center rounded border', c.done ? 'border-ink bg-ink text-white' : 'border-black/25')}>{c.done && <Check size={9} strokeWidth={3} />}</span>
              <span className={c.done ? 'text-mute line-through decoration-black/20' : 'text-ink-2'}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Tasks({ stage }: { stage: Stage }) {
  return (
    <div>
      {stage.milestones.map((m) => (
        <div key={m.id} className="mt-3">
          <div className="eyebrow mb-1">{m.name}</div>
          {m.tasks.map((t) => (
            <TaskRow key={t.id} t={t} />
          ))}
        </div>
      ))}
    </div>
  )
}

function Inspections({ stage }: { stage: Stage }) {
  const list = stage.milestones.flatMap((m) => m.tasks.flatMap((t) => t.inspections))
  if (!list.length) return <Empty>No inspections in this stage.</Empty>
  return (
    <div>
      {list.map((i) => (
        <Row key={i.id}>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{i.name}</div>
            <div className="text-xs text-mute">
              {i.authority} · {fmtDay(i.resultDate ?? i.scheduledDate)}
              {i.inspector ? ` · ${i.inspector}` : ''}
            </div>
          </div>
          <InspectionChip i={i} />
        </Row>
      ))}
    </div>
  )
}

export function Photos({ stageId, taskId }: { stageId?: string; taskId?: string }) {
  const d = useDerived()
  const openGallery = useJourney((s) => s.openGallery)
  const list = d.project.photos.filter((p) => (!stageId || p.stageId === stageId) && (!taskId || p.taskId === taskId) && toDay(p.date) <= d.today)
  if (!list.length) return <Empty>No site photos yet — they’ll appear here as Buildertrend syncs.</Empty>
  return (
    <div className="pt-3">
      <div className="grid grid-cols-3 gap-1.5">
        {list.slice(-9).reverse().map((p) => (
          <button key={p.id} onClick={() => openGallery({ photoId: p.id, stageId })} className="group relative aspect-[4/3] overflow-hidden rounded-md bg-black/5">
            <img src={p.url} alt={p.caption} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1 text-[10px] font-medium text-white">{fmtDay(p.date)}</span>
          </button>
        ))}
      </div>
      <button onClick={() => openGallery({ stageId })} className="mt-3 text-caption font-medium text-accent-dark hover:underline">
        View all {list.length} photos →
      </button>
    </div>
  )
}

function Plans() {
  const d = useDerived()
  const openCompare = (id: string) => {
    useJourney.setState({ compareSourceId: id })
    useJourney.getState().setView('compare')
  }
  return (
    <div className="pt-3">
      <div className="mb-2 text-xs text-mute">Sealed construction set · drag the divider to compare design intent with the build.</div>
      <div className="grid grid-cols-2 gap-2">
        {(d.project.drawings ?? []).map((dw) => (
          <button key={dw.id} onClick={() => openCompare(dw.id)} className="group overflow-hidden rounded-lg border border-line bg-white text-left hover:border-accent">
            <div className="aspect-[3/2] overflow-hidden bg-paper-2">
              <img src={dw.url} alt={dw.title} className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="px-2 py-1.5">
              <div className="text-[10px] font-semibold tracking-wide text-accent-dark">{dw.sheet}</div>
              <div className="truncate text-xs font-medium">{dw.title}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function HomeFacts() {
  const d = useDerived()
  const audience = useJourney((s) => s.audience)
  return (
    <div className="space-y-5 pt-3">
      <section>
        <div className="kicker mb-2">The home</div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {(d.project.facts ?? []).map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      {audience === 'internal' && d.project.team && (
        <section>
          <div className="kicker mb-2">Team</div>
          {d.project.team.map(([role, name]) => (
            <Row key={role}>
              <span className="w-28 shrink-0 text-xs text-mute">{role}</span>
              <span className="text-sm font-medium">{name}</span>
            </Row>
          ))}
        </section>
      )}
      <section>
        <div className="kicker mb-2">Lifecycle</div>
        {d.project.phases.map((ph) => {
          const tasks = ph.stages.flatMap((s) => s.milestones.flatMap((m) => m.tasks))
          if (!tasks.length) return null
          const done = tasks.filter((t) => t.status === 'complete').length / tasks.length
          const s = tasks.reduce((a, t) => (t.plannedStart < a ? t.plannedStart : a), '9999')
          const e = tasks.reduce((a, t) => (t.plannedEnd > a ? t.plannedEnd : a), '')
          return (
            <div key={ph.id} className="py-2">
              <div className="flex justify-between text-caption">
                <span className="font-medium">{ph.name}</span>
                <span className="text-mute tabular-nums">
                  {fmtDay(s, { year: true })} – {fmtDay(e, { year: true })}
                </span>
              </div>
              <ProgressBar value={done} tone={progressTone(done)} className="mt-1.5" h={3} />
            </div>
          )
        })}
      </section>
    </div>
  )
}

function Documents({ stageId }: { stageId: string }) {
  const d = useDerived()
  const audience = useJourney((s) => s.audience)
  const docs = d.project.documents.filter((x) => x.stageId === stageId && (audience === 'internal' || !x.internalOnly))
  if (!docs.length) return <Empty>No documents for this stage.</Empty>
  return (
    <div>
      {docs.map((x) => (
        <Row key={x.id}>
          <FileText size={15} className="shrink-0 text-mute" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{x.name}</div>
            <div className="text-xs text-mute capitalize">
              {x.kind} · {fmtDay(x.date)}
            </div>
          </div>
          {x.internalOnly && <Chip>Internal</Chip>}
        </Row>
      ))}
    </div>
  )
}

function Approvals() {
  const d = useDerived()
  const dispatch = useJourney((s) => s.dispatch)
  const list = d.idx.milestones.flatMap((m) => m.approvals).filter((a) => a.homeownerVisible)
  return (
    <div>
      {list.map((a) => (
        <Row key={a.id}>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{a.name}</div>
            <div className="text-xs text-mute">{a.status === 'approved' ? `Approved ${fmtDay(a.decidedDate ?? a.dueDate)}` : `Due ${fmtDay(a.dueDate)}`}</div>
          </div>
          {a.status === 'approved' ? (
            <Chip tone="ok">
              <Check size={11} strokeWidth={3} /> Approved
            </Chip>
          ) : (
            <button onClick={() => dispatch(ev('approval.decided', { approvalId: a.id, status: 'approved' }, 'dev'))} className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white hover:bg-ink-2">
              Review & approve
            </button>
          )}
        </Row>
      ))}
    </div>
  )
}

function Team({ stage }: { stage: Stage }) {
  const d = useDerived()
  const ids = new Set(stage.milestones.flatMap((m) => m.tasks.map((t) => t.tradeId)).filter(Boolean))
  const list = d.project.tradePartners.filter((t) => ids.has(t.id))
  return (
    <div>
      {list.map((t) => (
        <Row key={t.id}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-xs font-semibold text-ink-2">
            {t.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{t.name}</div>
            <div className="text-xs text-mute">
              {t.trade} · {t.contact}
            </div>
          </div>
          <a className="text-mute hover:text-ink" title={t.phone}>
            <Phone size={14} />
          </a>
        </Row>
      ))}
    </div>
  )
}

function Issues({ stage }: { stage: Stage }) {
  const d = useDerived()
  const dispatch = useJourney((s) => s.dispatch)
  const taskIds = new Set(stage.milestones.flatMap((m) => m.tasks.map((t) => t.id)))
  const blockers = d.project.blockers
  const qc = d.project.qualityChecks.filter((q) => taskIds.has(q.taskId))
  return (
    <div className="space-y-5 pt-3">
      <section>
        <div className="eyebrow mb-1">Schedule variance</div>
        <div className="text-sm">
          Forecast {fmtDay(d.forecast)} vs baseline {fmtDay(d.project.baselineCompletion)} ·{' '}
          <span className={d.variance > 0 ? 'font-medium text-risk' : 'font-medium text-ok'}>{d.variance > 0 ? `+${d.variance} days` : 'on baseline'}</span>
        </div>
      </section>
      {!!d.project.shiftReasons?.length && (
        <section>
          <div className="eyebrow mb-1">Schedule shift reasons · workdays slipped</div>
          {d.project.shiftReasons.slice(0, 7).map((r) => {
            const max = d.project.shiftReasons![0].days || 1
            return (
              <div key={r.reason} className="py-1.5">
                <div className="flex justify-between text-xs">
                  <span className="truncate pr-3 text-ink-2">{r.reason}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {r.days}d <span className="text-mute">· {r.count}×</span>
                  </span>
                </div>
                <ProgressBar value={r.days / max} tone="warn" className="mt-1" h={2} />
              </div>
            )
          })}
        </section>
      )}
      <section>
        <div className="eyebrow mb-1">Blockers</div>
        {blockers.length === 0 && <Empty>None.</Empty>}
        {blockers.map((b) => (
          <Row key={b.id}>
            <AlertTriangle size={14} className={b.resolvedDate ? 'text-mute' : b.severity === 'high' ? 'text-risk' : 'text-warn'} />
            <div className="min-w-0 flex-1">
              <div className={cx('text-sm font-medium', b.resolvedDate && 'text-mute line-through')}>{b.title}</div>
              <div className="text-xs text-mute">
                {b.owner} · opened {fmtDay(b.openedDate)}
              </div>
            </div>
            {!b.resolvedDate && (
              <button onClick={() => dispatch(ev('blocker.resolved', { blockerId: b.id }, 'dev'))} className="text-xs font-medium text-accent-dark hover:underline">
                Resolve
              </button>
            )}
          </Row>
        ))}
      </section>
      <section>
        <div className="eyebrow mb-1">Quality control</div>
        {qc.length === 0 && <Empty>No checks for this stage.</Empty>}
        {qc.map((q) => (
          <Row key={q.id}>
            <div className="flex-1 text-sm">{q.name}</div>
            <Chip tone={q.result === 'pass' ? 'ok' : q.result === 'fail' ? 'risk' : 'neutral'}>{q.result === 'pass' ? 'Pass' : q.result === 'fail' ? 'Fail' : 'Open'}</Chip>
          </Row>
        ))}
      </section>
      <section>
        <div className="eyebrow mb-1">Change orders</div>
        {d.project.changeOrders.map((c) => (
          <Row key={c.id}>
            <div className="min-w-0 flex-1 text-sm">{c.title}</div>
            <span className="text-caption tabular-nums text-ink-2">${c.amount.toLocaleString()}</span>
            <Chip tone={c.status === 'approved' ? 'ok' : 'neutral'}>{c.status}</Chip>
          </Row>
        ))}
      </section>
    </div>
  )
}

function Activity() {
  const feed = useJourney((s) => s.feed)
  const d = useDerived()
  return (
    <div className="space-y-5 pt-3">
      <section>
        <div className="eyebrow mb-1">Live updates</div>
        {feed.length === 0 && <Empty>No updates this session. Try “Simulate Buildertrend Sync” in the DEV panel.</Empty>}
        {feed.slice(0, 12).map((n) => (
          <Row key={n.id}>
            <span className={cx('h-1.5 w-1.5 rounded-full', n.kind === 'warning' ? 'bg-warn' : n.kind === 'success' ? 'bg-ok' : 'bg-accent')} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{n.title}</div>
              {n.detail && <div className="truncate text-xs text-mute">{n.detail}</div>}
            </div>
          </Row>
        ))}
      </section>
      <section>
        <div className="eyebrow mb-1">Daily logs</div>
        {d.project.dailyLogs
          .slice()
          .reverse()
          .map((l) => (
            <div key={l.id} className="border-b border-line py-2.5 last:border-0">
              <div className="flex justify-between text-xs text-mute">
                <span>
                  {fmtDay(l.date)} · {l.author}
                </span>
                <span>
                  {l.weather} · {l.crew} crew
                </span>
              </div>
              <div className="mt-1 text-sm leading-snug text-ink-2">{l.notes}</div>
            </div>
          ))}
      </section>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-4 text-caption text-mute">{children}</div>
}
