import { ArrowLeft, Crosshair, ScanEye } from 'lucide-react'
import { LAYER_INDEX, SYSTEM_INDEX } from '@/domain/layers'
import { fmtDay, toDay } from '@/lib/dates'
import { forecastEnd, taskProgressAt } from '@/lib/schedule'
import { componentIndex } from '@/scene/home/partState'
import { useJourney } from '@/store/useJourney'
import { Chip, cx, ProgressBar } from './primitives'
import { InspectionChip, Photos } from './StagePanel'
import { pct, useDerived } from './useDerived'

const INSTALL_GROUPS = new Set(['MEP', 'ENVELOPE', 'INTERIOR'])

export function ComponentInspector({ componentId }: { componentId: string }) {
  const d = useDerived()
  const select = useJourney((s) => s.select)
  const setIsolate = useJourney((s) => s.setIsolate)
  const comp = componentIndex(d.project).get(componentId)
  if (!comp) return null
  const task = d.idx.taskById.get(comp.taskId)
  const stage = task ? d.idx.stageOfTask.get(task.id) : undefined
  const layer = LAYER_INDEX[comp.layer]
  const system = comp.system ?? layer?.system
  const live = task ? taskProgressAt(task, d.today, d.today) : 0
  const atCursor = task ? taskProgressAt(task, d.cursor, d.today) : 0
  const trade = d.project.tradePartners.find((t) => t.id === task?.tradeId)
  const docs = d.project.documents.filter((x) => x.taskId === task?.id)
  const photos = d.project.photos.filter((p) => p.taskId === task?.id && toDay(p.date) <= d.today)
  const inspection = task?.inspections[0]
  const verb = INSTALL_GROUPS.has(layer?.group ?? '') ? 'Installed' : 'Completed'
  const status = live >= 0.999 ? verb : live > 0 ? 'In progress' : 'Scheduled'
  const tone = live >= 0.999 ? 'ok' : live > 0 ? 'accent' : 'neutral'
  const done = task?.actualEnd ?? (task ? undefined : undefined)

  return (
    <div className="anim-fade-up px-5 pt-4 pb-6" key={componentId}>
      <button onClick={() => select(null)} className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-mute hover:text-ink">
        <ArrowLeft size={13} /> {stage ? stage.shortName : 'Back'}
      </button>
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink">{comp.name}</h2>
      <div className="mt-1 flex items-center gap-1.5 text-caption text-slate-700">
        {system && <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-ink/15" style={{ background: SYSTEM_INDEX[system].color }} aria-hidden />}
        <span className="truncate">
          {comp.location} · {layer?.label} · {layer?.group}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Chip tone={tone as 'ok' | 'accent' | 'neutral'}>{status}</Chip>
        <span className="num text-xs font-medium text-ink">{pct(live)}</span>
      </div>
      <ProgressBar value={live} className="mt-2.5" h={4} tone={live >= 0.999 ? 'ok' : 'ink'} />


      {comp.specs?.Routing && (
        <div className="mt-4 rounded-lg border border-line bg-slate-50 px-3 py-2 text-caption text-slate-700" role="note">
          <span className="font-semibold text-ink">Schematic route.</span> {comp.specs.Routing.replace(/^Schematic — /, '')}
        </div>
      )}
      {comp.specs?.Status?.startsWith('ILLUSTRATIVE') && (
        <div className="mt-4 rounded-lg border border-line bg-slate-50 px-3 py-2 text-caption text-slate-700" role="note">
          <span className="font-semibold text-ink">Illustrative.</span> {comp.specs.Status.replace(/^ILLUSTRATIVE — /, '')}
        </div>
      )}
      {!d.isLive && atCursor > live + 0.01 && (
        <div className="mt-4 rounded-lg border border-info-soft bg-info-soft/50 px-3 py-2 text-caption text-info-ink" role="note">
          Forecast at {fmtDay(d.cursor)}: {pct(atCursor)} by schedule. Buildertrend reports {pct(live)} as of {fmtDay(d.today)}.
        </div>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4">
        <Field label={verb}>{task?.actualEnd ? fmtDay(task.actualEnd) : task ? `Target ${fmtDay(forecastEnd(task))}` : '—'}</Field>
        <Field label="Inspection">{inspection ? <InspectionChip i={inspection} /> : <span className="text-mute">Not required</span>}</Field>
        <Field label="Trade">{trade?.name ?? 'LUIH'}</Field>
        <Field label="Schedule">{task ? `${fmtDay(task.plannedStart)} – ${fmtDay(task.plannedEnd)}` : '—'}</Field>
        <Field label="Documents">{docs.length}</Field>
        <Field label="Photos">{photos.length}</Field>
      </dl>

      {comp.specs && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="eyebrow mb-2">Specification</div>
          {Object.entries(comp.specs).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-1 text-sm">
              <span className="text-mute">{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      )}

      {task && task.checklist.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="eyebrow mb-2">Checklist · {task.name}</div>
          {task.checklist.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-0.5 text-sm">
              <span className={cx('h-1.5 w-1.5 rounded-full', c.done ? 'bg-ink' : 'bg-black/20')} />
              <span className={c.done ? 'text-ink-2' : 'text-mute'}>{c.label}</span>
            </div>
          ))}
        </div>
      )}

      {docs.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="eyebrow mb-1">Documents</div>
          {docs.map((x) => (
            <div key={x.id} className="py-1 text-sm text-ink-2">
              {x.name}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-line pt-1">
        <Photos taskId={task?.id} />
      </div>

      <div className="mt-5 flex gap-2">
        {system && (
          <button onClick={() => setIsolate(system)} className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/[0.04]">
            <ScanEye size={13} /> Isolate {SYSTEM_INDEX[system].label}
          </button>
        )}
        {stage && (
          <button
            onClick={() => useJourney.getState().requestCamera(stage.cameraPreset, 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium hover:bg-black/[0.04]"
          >
            <Crosshair size={13} /> Stage view
          </button>
        )}
      </div>
      {done === undefined && null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium">{children}</dd>
    </div>
  )
}
