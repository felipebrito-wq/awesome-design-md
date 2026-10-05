import { useMemo } from 'react'
import type { Stage } from '@/domain/types'
import {
  completionDate,
  indexProject,
  nextMilestone,
  overallProgress,
  scheduleStatus,
  scheduleVarianceDays,
  stageAt,
  stageProgress,
} from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'

/** Derived, memoized view of the project at the timeline cursor. */
export function useDerived() {
  const project = useJourney((s) => s.project)!
  const cursorRaw = useJourney((s) => s.cursor)
  const cursor = Math.round(cursorRaw * 4) / 4
  const base = useMemo(() => {
    const idx = indexProject(project)
    return {
      idx,
      today: idx.today,
      todayProgress: overallProgress(project, idx.today),
      todayStage: stageAt(project, idx.today),
      forecast: completionDate(project),
      status: scheduleStatus(project),
      variance: scheduleVarianceDays(project),
      next: nextMilestone(project),
    }
  }, [project])
  const at = useMemo(() => {
    const stageProgressMap = new Map<string, number>()
    for (const s of base.idx.stages) stageProgressMap.set(s.id, stageProgress(s, cursor, base.today))
    return {
      cursor,
      overall: overallProgress(project, cursor),
      stage: stageAt(project, cursor) as Stage,
      stageProgress: stageProgressMap,
      isLive: Math.abs(cursor - base.today) < 0.5,
      isForecast: cursor > base.today + 0.5,
    }
  }, [project, cursor, base])
  return { project, ...base, ...at }
}

export const pct = (x: number) => `${Math.round(x * 100)}%`

export const STATUS_LABEL = {
  on_schedule: 'On schedule',
  at_risk: 'At risk',
  delayed: 'Delayed',
} as const
