/**
 * Pure reducer: (project, event) → (project', notices). Shared by the mock
 * simulator today and the live sync channel later.
 */
import type { Milestone, Project, Stage, Task } from '@/domain/types'
import { addDays, fromDay, toDay } from '@/lib/dates'
import { buildIndex, forecastStart, indexProject, overallProgress, taskProgressAt } from '@/lib/schedule'
import { eventId, type BuildEvent, type Notice } from './events'

const pctStr = (x: number) => `${Math.round(x * 100)}%`

function notice(n: Omit<Notice, 'id' | 'at'>): Notice {
  return { id: eventId(), at: new Date().toISOString(), ...n }
}

function completeTask(t: Task, today: string) {
  t.status = 'complete'
  t.actualStart ??= fromDay(Math.min(forecastStart(t), toDay(today)))
  t.actualEnd = today
  t.percentComplete = 1
  t.checklist.forEach((c) => (c.done = true))
}

export function setTaskProgress(t: Task, pct: number, today: string) {
  if (pct >= 0.999) return completeTask(t, today)
  if (pct <= 0.001) {
    t.status = 'not_started'
    t.actualStart = undefined
    t.actualEnd = undefined
    t.percentComplete = 0
    t.checklist.forEach((c) => (c.done = false))
    return
  }
  t.status = t.status === 'blocked' ? 'blocked' : 'in_progress'
  t.actualStart ??= fromDay(Math.min(forecastStart(t), toDay(today) - 1))
  t.actualEnd = undefined
  t.percentComplete = pct
  const n = Math.round(t.checklist.length * pct)
  t.checklist.forEach((c, i) => (c.done = i < n))
}

const componentsOfTask = (p: Project, taskId: string) => p.components.filter((c) => c.taskId === taskId).map((c) => c.id)

const isMilestoneDone = (m: Milestone) => m.tasks.every((t) => t.status === 'complete')
const isStageDone = (s: Stage) => s.milestones.every(isMilestoneDone)

/** Moves the project clock, simulating actuals to match the forecast. */
export function rebaseToDate(p: Project, date: string) {
  const idx = buildIndex(p)
  const target = toDay(date)
  for (const t of idx.tasks) {
    const pct = taskProgressAt(t, target, idx.today)
    if (pct >= 0.999) {
      if (t.status !== 'complete') {
        t.status = 'complete'
        t.actualStart ??= fromDay(forecastStart(t))
        t.actualEnd = fromDay(Math.min(target, toDay(t.plannedEnd) + t.delayDays))
        t.percentComplete = 1
        t.checklist.forEach((c) => (c.done = true))
      }
    } else {
      setTaskProgress(t, pct, date)
    }
    for (const i of t.inspections) {
      if (t.status === 'complete' && i.result === 'scheduled' && toDay(i.scheduledDate) <= target) {
        i.result = 'passed'
        i.resultDate = i.scheduledDate
        i.inspector = 'R. Alvarez'
      }
      if (toDay(i.scheduledDate) > target && i.result === 'passed') {
        i.result = 'scheduled'
        i.resultDate = undefined
      }
    }
  }
  p.today = date
}

export function applyEvent(input: Project, e: BuildEvent): { project: Project; notices: Notice[] } {
  const p = structuredClone(input)
  const before = indexProject(input)
  const notices: Notice[] = []
  const today = p.today

  const run = (ev: BuildEvent) => {
    const idx = buildIndex(p)
    switch (ev.type) {
      case 'task.completed': {
        const t = idx.taskById.get(ev.taskId)
        if (!t || t.status === 'complete') return
        completeTask(t, today)
        notices.push(notice({ kind: 'success', title: `${t.name} completed`, detail: idx.stageOfTask.get(t.id)?.shortName, pulse: componentsOfTask(p, t.id) }))
        return
      }
      case 'task.progress': {
        const t = idx.taskById.get(ev.taskId)
        if (!t) return
        const prev = t.percentComplete
        setTaskProgress(t, ev.percent, today)
        notices.push(notice({ kind: 'progress', title: t.name, detail: `${pctStr(prev)} → ${pctStr(ev.percent)}`, pulse: componentsOfTask(p, t.id) }))
        return
      }
      case 'inspection.result': {
        for (const t of idx.tasks) {
          const i = t.inspections.find((x) => x.id === ev.inspectionId)
          if (!i) continue
          i.result = ev.result
          i.resultDate = today
          if (ev.result === 'passed') {
            i.inspector ??= 'R. Alvarez'
            notices.push(notice({ kind: 'success', title: `${i.name} inspection passed`, detail: i.authority, celebrate: 'inspection', pulse: componentsOfTask(p, t.id) }))
          } else if (ev.result === 'delayed') {
            i.scheduledDate = addDays(i.scheduledDate, 3)
            notices.push(notice({ kind: 'warning', title: `${i.name} inspection delayed`, detail: `Rescheduled to ${i.scheduledDate.slice(5)}` }))
          } else if (ev.result === 'failed') {
            notices.push(notice({ kind: 'warning', title: `${i.name} inspection failed`, detail: 'Re-inspection required' }))
          }
        }
        return
      }
      case 'schedule.changed': {
        const m = idx.milestoneById.get(ev.milestoneId)
        if (!m) return
        const mIdx = idx.milestones.indexOf(m)
        idx.milestones.forEach((mm, i) => {
          if (i < mIdx) return
          for (const t of mm.tasks) {
            if (t.status === 'complete') continue
            if (i === mIdx || t.status === 'not_started') t.delayDays += ev.delayDays
          }
        })
        notices.push(notice({ kind: 'warning', title: `${m.name} delayed ${ev.delayDays} days`, detail: ev.reason }))
        return
      }
      case 'photo.added': {
        p.photos.push(...ev.photos)
        const n = ev.photos.length
        notices.push(notice({ kind: 'photo', title: `${n} new site photo${n > 1 ? 's' : ''}`, detail: ev.photos[0]?.location }))
        return
      }
      case 'blocker.opened':
        p.blockers.push(ev.blocker)
        notices.push(notice({ kind: 'warning', title: 'New blocker', detail: ev.blocker.title }))
        return
      case 'blocker.resolved': {
        const b = p.blockers.find((x) => x.id === ev.blockerId)
        if (b) {
          b.resolvedDate = today
          notices.push(notice({ kind: 'success', title: 'Blocker resolved', detail: b.title }))
        }
        return
      }
      case 'approval.decided': {
        for (const m of idx.milestones) {
          const a = m.approvals.find((x) => x.id === ev.approvalId)
          if (a) {
            a.status = ev.status
            a.decidedDate = today
            notices.push(notice({ kind: 'success', title: `${a.name} ${ev.status === 'approved' ? 'approved' : 'updated'}` }))
          }
        }
        return
      }
      case 'clock.set':
        rebaseToDate(p, ev.date)
        return
      case 'schedule.status':
        p.settings.scheduleStatusOverride = ev.status
        return
      case 'sync.batch':
        ev.events.forEach(run)
        return
    }
  }

  run(e)
  p.lastSyncedAt = new Date().toISOString()

  // Derived notices: milestone / stage completions + progress delta.
  const after = buildIndex(p)
  for (const m of after.milestones) {
    const old = before.milestoneById.get(m.id)
    if (old && !isMilestoneDone(old) && isMilestoneDone(m)) notices.push(notice({ kind: 'success', title: `Milestone complete: ${m.name}`, celebrate: 'milestone' }))
  }
  for (const s of after.stages) {
    const old = before.stageById.get(s.id)
    if (old && !isStageDone(old) && isStageDone(s)) notices.push(notice({ kind: 'success', title: `${s.shortName} complete`, celebrate: 'stage' }))
  }
  if (e.type !== 'clock.set') {
    const a = overallProgress(input, before.today)
    const b = overallProgress(p, after.today) // caches p — mutations are done
    if (Math.round(a * 100) !== Math.round(b * 100)) notices.push(notice({ kind: 'progress', title: 'Overall progress', detail: `${pctStr(a)} → ${pctStr(b)}` }))
  }
  return { project: p, notices }
}
