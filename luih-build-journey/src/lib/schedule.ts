/**
 * Schedule engine: turns normalized Buildertrend tasks into progress at any
 * date. The same function drives the 3D model, the panels and the timeline,
 * so the house always reflects the schedule data.
 *
 * Rules (cursor = date being viewed, today = project clock):
 *  - complete:     0→1 over [actualStart, actualEnd]
 *  - in progress:  0→pct over [actualStart, today], then pct→1 to forecast end
 *  - not started:  0→1 over forecast window (planned + delay), never before today
 */
import type { Milestone, Project, ScheduleStatus, Stage, Task } from '@/domain/types'
import { clamp01, toDay, type Day } from './dates'

export const forecastStart = (t: Task): Day => toDay(t.plannedStart) + t.delayDays
export const forecastEnd = (t: Task): Day => toDay(t.plannedEnd) + t.delayDays

/** Inclusive day window [start, end] the task occupies (actual or forecast). */
export function taskWindow(t: Task, today: Day): [Day, Day] {
  if (t.status === 'complete') {
    const s = t.actualStart ? toDay(t.actualStart) : toDay(t.plannedStart)
    const e = t.actualEnd ? toDay(t.actualEnd) : toDay(t.plannedEnd)
    return [s, Math.max(e, s)]
  }
  if (t.status === 'in_progress' || (t.status === 'blocked' && t.actualStart)) {
    const s = t.actualStart ? toDay(t.actualStart) : forecastStart(t)
    return [s, Math.max(forecastEnd(t), today)]
  }
  const s = Math.max(forecastStart(t), today + 1)
  const len = Math.max(toDay(t.plannedEnd) - toDay(t.plannedStart), 0)
  return [s, s + len]
}

/** Progress (0..1) of a task as it looked/will look at `cursor`. */
export function taskProgressAt(t: Task, cursor: Day, today: Day): number {
  // Tasks are inclusive of their end date (a Jan 5–7 task finishes end of day Jan 7).
  const c = cursor
  if (t.status === 'complete') {
    const [s, e] = taskWindow(t, today)
    return clamp01((c - s) / (e + 1 - s))
  }
  if (t.status === 'in_progress' || (t.status === 'blocked' && t.actualStart)) {
    const s = t.actualStart ? toDay(t.actualStart) : today
    const pct = t.percentComplete
    if (c <= today) return today <= s ? 0 : clamp01((c - s) / (today - s)) * pct
    if (t.status === 'blocked') return pct
    const e = Math.max(forecastEnd(t) + 1, today + 1)
    return pct + (1 - pct) * clamp01((c - today) / (e - today))
  }
  if (c <= today) return 0
  const [s, e] = taskWindow(t, today)
  return clamp01((c - s) / (e + 1 - s))
}

export const taskDuration = (t: Task) => Math.max(1, toDay(t.plannedEnd) - toDay(t.plannedStart) + 1)

// ---- Indexing -------------------------------------------------------------

export interface ProjectIndex {
  /** Construction stages (the 3D timeline). */
  stages: Stage[]
  /** Every stage in every lifecycle phase. */
  allStages: Stage[]
  milestones: Milestone[]
  tasks: Task[]
  taskById: Map<string, Task>
  milestoneById: Map<string, Milestone>
  stageById: Map<string, Stage>
  stageOfTask: Map<string, Stage>
  milestoneOfTask: Map<string, Milestone>
  stageRange: Map<string, [Day, Day]>
  start: Day
  end: Day
  today: Day
}

const cache = new WeakMap<Project, ProjectIndex>()

/** Cached index — only valid for immutable project snapshots. */
export function indexProject(p: Project): ProjectIndex {
  const hit = cache.get(p)
  if (hit) return hit
  const idx = buildIndex(p)
  cache.set(p, idx)
  return idx
}

/** Uncached index — use while mutating a draft project. */
export function buildIndex(p: Project): ProjectIndex {
  const construction = p.phases.find((ph) => ph.key === 'construction')
  const stages = construction ? [...construction.stages].sort((a, b) => a.order - b.order) : []
  const allStages = [...p.phases].sort((a, b) => a.order - b.order).flatMap((ph) => [...ph.stages].sort((a, b) => a.order - b.order))
  const milestones: Milestone[] = []
  const tasks: Task[] = []
  const taskById = new Map<string, Task>()
  const milestoneById = new Map<string, Milestone>()
  const stageById = new Map<string, Stage>()
  const stageOfTask = new Map<string, Stage>()
  const milestoneOfTask = new Map<string, Milestone>()
  const stageRange = new Map<string, [Day, Day]>()
  const today = toDay(p.today)
  let end = -Infinity
  const constructionIds = new Set(stages.map((s) => s.id))
  for (const st of allStages) {
    stageById.set(st.id, st)
    let s = Infinity
    let e = -Infinity
    for (const m of st.milestones) {
      milestones.push(m)
      milestoneById.set(m.id, m)
      for (const t of m.tasks) {
        tasks.push(t)
        taskById.set(t.id, t)
        stageOfTask.set(t.id, st)
        milestoneOfTask.set(t.id, m)
        const [ws, we] = taskWindow(t, today)
        s = Math.min(s, ws)
        e = Math.max(e, we + 1)
        if (constructionIds.has(st.id)) end = Math.max(end, we + 1)
      }
    }
    stageRange.set(st.id, [s, e])
  }
  if (!isFinite(end)) end = toDay(p.baselineCompletion)
  const idx: ProjectIndex = {
    stages,
    allStages,
    milestones,
    tasks,
    taskById,
    milestoneById,
    stageById,
    stageOfTask,
    milestoneOfTask,
    stageRange,
    start: p.timelineStart ? toDay(p.timelineStart) : stages.length ? Math.min(...stages.map((s) => stageRange.get(s.id)![0])) : toDay(p.startDate),
    end,
    today,
  }
  return idx
}

// ---- Roll-ups ---------------------------------------------------------------

export function weightedProgress(tasks: Task[], cursor: Day, today: Day): number {
  let w = 0
  let acc = 0
  for (const t of tasks) {
    const d = taskDuration(t)
    w += d
    acc += d * taskProgressAt(t, cursor, today)
  }
  return w ? acc / w : 0
}

export const stageTasks = (s: Stage) => s.milestones.flatMap((m) => m.tasks)

export function stageProgress(s: Stage, cursor: Day, today: Day) {
  return weightedProgress(stageTasks(s), cursor, today)
}

/** Optional stage weights for the overall %; default = task-duration weighted. */
const STAGE_WEIGHT: Record<string, number> = {
  'stg-site': 4,
  'stg-foundation': 10,
  'stg-framing': 20,
  'stg-roughins': 16,
  'stg-finishes': 34,
  'stg-complete': 16,
}

export function overallProgress(p: Project, cursor: Day): number {
  const idx = indexProject(p)
  const weighted = idx.stages.every((s) => STAGE_WEIGHT[s.id] !== undefined)
  if (!weighted) return weightedProgress(idx.stages.flatMap(stageTasks), cursor, idx.today)
  let w = 0
  let acc = 0
  for (const s of idx.stages) {
    const sw = STAGE_WEIGHT[s.id]
    w += sw
    acc += sw * stageProgress(s, cursor, idx.today)
  }
  return w ? acc / w : 0
}

/** The stage the cursor is "in": first stage not complete at cursor. */
export function stageAt(p: Project, cursor: Day): Stage {
  const idx = indexProject(p)
  for (const s of idx.stages) {
    if (stageProgress(s, cursor, idx.today) < 0.999) return s
  }
  return idx.stages[idx.stages.length - 1]
}

export function disciplineBreakdown(s: Stage, cursor: Day, today: Day) {
  const groups = new Map<string, Task[]>()
  for (const m of s.milestones) {
    for (const t of m.tasks) {
      const key = t.discipline ?? m.name
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
  }
  return [...groups.entries()].map(([label, tasks]) => ({
    label,
    progress: weightedProgress(tasks, cursor, today),
    tasks,
  }))
}

export function forecastCompletion(p: Project): Day {
  return indexProject(p).end - 1
}

/** Date to show as "estimated completion": builder's CO date if provided. */
export function completionDate(p: Project): Day {
  return p.expectedCO ? toDay(p.expectedCO) : forecastCompletion(p)
}

export function scheduleVarianceDays(p: Project): number {
  return completionDate(p) - toDay(p.baselineCompletion)
}

export function scheduleStatus(p: Project): ScheduleStatus {
  if (p.settings.scheduleStatusOverride) return p.settings.scheduleStatusOverride
  const v = scheduleVarianceDays(p)
  const openHigh = p.blockers.some((b) => !b.resolvedDate && b.severity === 'high')
  if (v > 7) return 'delayed'
  if (v > 0 || openHigh) return 'at_risk'
  return 'on_schedule'
}

export function nextMilestone(p: Project): Milestone | undefined {
  const idx = indexProject(p)
  const constr = new Set(idx.stages.map((s) => s.id))
  return idx.milestones
    .filter((m) => constr.has(m.stageId) && m.tasks.some((t) => t.status !== 'complete'))
    .sort((a, b) => (a.plannedDate < b.plannedDate ? -1 : 1))[0]
}

export function milestoneProgress(m: Milestone, cursor: Day, today: Day) {
  return weightedProgress(m.tasks, cursor, today)
}

/** Snap points for the timeline: milestone completion dates. */
export function milestoneSnapDays(p: Project): { day: Day; milestone: Milestone }[] {
  const idx = indexProject(p)
  const constr = new Set(idx.stages.map((s) => s.id))
  return idx.milestones.filter((m) => constr.has(m.stageId)).map((m) => {
    let e = -Infinity
    for (const t of m.tasks) e = Math.max(e, taskWindow(t, idx.today)[1] + 1)
    return { day: e, milestone: m }
  })
}

/** Where the timeline should land when a stage is selected. */
export function stageFocusDay(p: Project, stageId: string): Day {
  const idx = indexProject(p)
  const [s, e] = idx.stageRange.get(stageId) ?? [idx.start, idx.end]
  if (idx.today >= s && idx.today < e) return idx.today
  return e
}

export const allInspections = (p: Project) => indexProject(p).tasks.flatMap((t) => t.inspections)
