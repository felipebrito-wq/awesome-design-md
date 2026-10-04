/**
 * Produces a plausible "Buildertrend sync" batch from the current state:
 * pass a pending inspection, complete/advance in-flight work, add photos,
 * sometimes a delay. Deterministic enough to demo, varied enough to feel live.
 */
import type { Photo, Project } from '@/domain/types'
import { toDay } from '@/lib/dates'
import { indexProject } from '@/lib/schedule'
import { ev, type BuildEvent } from './events'

let round = 0

export function simulateSync(p: Project, photos: Photo[] = []): BuildEvent {
  const idx = indexProject(p)
  const events: BuildEvent[] = []
  round++

  // 1. An inspection that is due/next on a completed task → pass it.
  const pending = idx.tasks
    .flatMap((t) => t.inspections.map((i) => ({ t, i })))
    .filter(({ i }) => i.result === 'scheduled')
    .sort((a, b) => toDay(a.i.scheduledDate) - toDay(b.i.scheduledDate))
  const passable = pending.find(({ t }) => t.status === 'complete') ?? pending[0]
  if (passable && round % 3 !== 0) events.push(ev('inspection.result', { inspectionId: passable.i.id, result: 'passed' }))

  // 2. Advance in-progress work; complete the furthest-along task.
  const wip = idx.tasks.filter((t) => t.status === 'in_progress').sort((a, b) => b.percentComplete - a.percentComplete)
  if (wip[0]) events.push(ev('task.completed', { taskId: wip[0].id }))
  for (const t of wip.slice(1, 3)) events.push(ev('task.progress', { taskId: t.id, percent: Math.min(0.95, t.percentComplete + 0.25) }))
  if (!wip.length) {
    const next = idx.tasks.find((t) => t.status === 'not_started')
    if (next) events.push(ev('task.progress', { taskId: next.id, percent: 0.35 }))
  }

  // 3. Every third sync: an inspection slips (realism).
  if (round % 3 === 0 && pending[0]) events.push(ev('inspection.result', { inspectionId: pending[0].i.id, result: 'delayed' }))

  if (photos.length) events.push(ev('photo.added', { photos }))
  return ev('sync.batch', { events })
}
