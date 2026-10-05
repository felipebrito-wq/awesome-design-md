import { RefreshCw, Wrench, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import type { InspectionResult, ScheduleStatus } from '@/domain/types'
import { fmtDay, fromDay } from '@/lib/dates'
import { allInspections, nextMilestone } from '@/lib/schedule'
import { ev } from '@/services/realtime/events'
import { useJourney } from '@/store/useJourney'
import { cx, Segmented } from './primitives'
import { pct, useDerived } from './useDerived'

/**
 * Hidden DEV panel (press ` or click DEV). Every control emits the same
 * normalized events a live Buildertrend sync would.
 */
export function DevPanel() {
  const open = useJourney((s) => s.devOpen)
  const setOpen = useJourney((s) => s.setDevOpen)
  const demo = useJourney((s) => s.demo.playing)
  if (demo) return null
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="pointer-events-auto absolute bottom-[156px] left-6 inline-flex max-md:hidden items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-white/90 uppercase hover:bg-ink" title="Developer tools (`)">
        <Wrench size={11} /> Dev
      </button>
    )
  return <DevPanelBody onClose={() => setOpen(false)} />
}

function DevPanelBody({ onClose }: { onClose: () => void }) {
  const d = useDerived()
  const s = useJourney()
  const publish = (e: ReturnType<typeof ev>) => s.dispatch(e)
  const inspections = useMemo(() => allInspections(d.project), [d.project])
  const [inspId, setInspId] = useState(inspections.find((i) => i.result === 'scheduled')?.id ?? inspections[0]?.id)
  const [clock, setClock] = useState<number | null>(null)
  const mepTasks = d.idx.stageById.get('stg-roughins')?.milestones.flatMap((m) => m.tasks) ?? []
  const mepAvg = mepTasks.reduce((a, t) => a + t.percentComplete, 0) / Math.max(1, mepTasks.length)
  const [mep, setMep] = useState<number | null>(null)

  const completeNext = () => {
    const t = d.idx.tasks.find((x) => x.status === 'in_progress') ?? d.idx.tasks.find((x) => x.status !== 'complete')
    if (t) publish(ev('task.completed', { taskId: t.id }, 'dev'))
  }
  const passNext = () => {
    const i = inspections.find((x) => x.result === 'scheduled' || x.result === 'delayed')
    if (i) publish(ev('inspection.result', { inspectionId: i.id, result: 'passed' }, 'dev'))
  }
  const delay = () => {
    const m = nextMilestone(d.project)
    if (m) publish(ev('schedule.changed', { milestoneId: m.id, delayDays: 7, reason: 'County inspection backlog' }, 'dev'))
  }
  const addBlocker = () =>
    publish(
      ev(
        'blocker.opened',
        {
          blocker: {
            id: `b-${Date.now()}`,
            taskId: d.idx.tasks.find((x) => x.status === 'in_progress')?.id ?? d.idx.tasks[0].id,
            title: 'Material delay — impact glass back-ordered 10 days',
            severity: 'high',
            owner: 'Clearview Openings',
            openedDate: d.project.today,
          },
        },
        'dev',
      ),
    )

  return (
    <div className="surface anim-fade-up pointer-events-auto absolute bottom-[156px] left-6 z-30 max-h-[calc(100vh-200px)] w-[320px] overflow-y-auto rounded-2xl p-4 scroll-thin">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={13} />
          <span className="text-[12px] font-semibold tracking-[0.14em] uppercase">Dev tools</span>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-faint hover:bg-black/5 hover:text-ink">
          <X size={14} />
        </button>
      </div>

      <Section title="Audience">
        <Segmented
          size="sm"
          value={s.audience}
          onChange={s.setAudience}
          options={[
            { value: 'homeowner', label: 'Homeowner' },
            { value: 'internal', label: 'Internal' },
          ]}
        />
      </Section>

      <Section title={`Project date (today) · ${fmtDay(clock ?? d.today)} · ${pct(d.todayProgress)}`}>
        <input
          type="range"
          className="luih-range w-full"
          min={d.idx.start}
          max={d.idx.end}
          step={1}
          value={clock ?? d.today}
          onChange={(e) => setClock(+e.target.value)}
          onPointerUp={() => {
            if (clock !== null) publish(ev('clock.set', { date: fromDay(clock) }, 'dev'))
            setClock(null)
          }}
        />
        <div className="mt-1 text-[10.5px] text-faint">Advances actuals per forecast — the house, panels and progress follow.</div>
      </Section>

      <Section title="Jump to stage">
        <select className="w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px]" value={s.focusStageId ?? ''} onChange={(e) => s.selectStage(e.target.value || null)}>
          <option value="">— current —</option>
          {d.idx.stages.map((st) => (
            <option key={st.id} value={st.id}>
              {st.code} {st.name}
            </option>
          ))}
        </select>
      </Section>

      <Section title={`MEP progress · ${pct(mep ?? mepAvg)}`}>
        <input
          type="range"
          className="luih-range w-full"
          min={0}
          max={1}
          step={0.05}
          value={mep ?? mepAvg}
          onChange={(e) => setMep(+e.target.value)}
          onPointerUp={() => {
            if (mep === null) return
            publish(ev('sync.batch', { events: mepTasks.map((t) => ev('task.progress', { taskId: t.id, percent: mep }, 'dev')) }, 'dev'))
            setMep(null)
          }}
        />
      </Section>

      <Section title="Inspection status">
        <div className="flex gap-1.5">
          <select className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px]" value={inspId} onChange={(e) => setInspId(e.target.value)}>
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.result}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[12px]"
            value=""
            onChange={(e) => inspId && e.target.value && publish(ev('inspection.result', { inspectionId: inspId, result: e.target.value as InspectionResult }, 'dev'))}
          >
            <option value="">Set…</option>
            <option value="passed">Passed</option>
            <option value="delayed">Delayed</option>
            <option value="failed">Failed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </Section>

      <Section title="Schedule status">
        <Segmented<string>
          size="sm"
          value={d.project.settings.scheduleStatusOverride ?? 'auto'}
          onChange={(v) => publish(ev('schedule.status', { status: v === 'auto' ? undefined : (v as ScheduleStatus) }, 'dev'))}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'on_schedule', label: 'On' },
            { value: 'at_risk', label: 'Risk' },
            { value: 'delayed', label: 'Delayed' },
          ]}
        />
      </Section>

      <Section title={`Blockers · ${d.project.blockers.filter((b) => !b.resolvedDate).length} open`}>
        <div className="flex flex-wrap gap-1.5">
          <Btn onClick={addBlocker}>+ Add blocker</Btn>
          {d.project.blockers
            .filter((b) => !b.resolvedDate)
            .map((b) => (
              <Btn key={b.id} onClick={() => publish(ev('blocker.resolved', { blockerId: b.id }, 'dev'))}>
                Resolve “{b.title.slice(0, 18)}…”
              </Btn>
            ))}
        </div>
      </Section>

      <Section title="Events">
        <div className="grid grid-cols-2 gap-1.5">
          <Btn onClick={completeNext}>+ Complete Next Task</Btn>
          <Btn onClick={() => void s.addSitePhoto()}>+ Add Site Photo</Btn>
          <Btn onClick={passNext}>+ Pass Inspection</Btn>
          <Btn onClick={delay}>+ Delay Milestone</Btn>
        </div>
        <button
          onClick={() => void s.simulateSync()}
          disabled={s.syncing}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-[12px] font-medium text-white hover:brightness-110 disabled:opacity-60"
        >
          <RefreshCw size={13} className={cx(s.syncing && 'animate-spin')} /> Simulate Buildertrend Sync
        </button>
      </Section>

      <Section title="Homeowner settings">
        <label className="flex items-center gap-2 text-[12px] text-ink-2">
          <input
            type="checkbox"
            checked={d.project.settings.showFinancials}
            onChange={(e) => useJourney.setState({ project: { ...d.project, settings: { ...d.project.settings, showFinancials: e.target.checked } } })}
          />
          Show financials to homeowner
        </label>
      </Section>
      <div className="mt-3 text-[10.5px] leading-snug text-faint">Shortcuts: X x-ray · P play · ` dev · R reset camera · F fullscreen · ←/→ milestones · 1–6 stages</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <div className="eyebrow mb-1.5">{title}</div>
      {children}
    </div>
  )
}

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-left text-[11.5px] font-medium text-ink-2 hover:border-black/20 hover:text-ink">
      {children}
    </button>
  )
}
