/**
 * Minimal raw shapes we expect from Buildertrend (schedule items, photos,
 * daily logs). Field names are placeholders: confirm against the actual
 * Buildertrend API / export contract before wiring BuildertrendAPIService.
 */
export interface BtScheduleItem {
  id: number | string
  title: string
  startDate: string
  endDate: string
  /** Buildertrend "phase" (often used for stage grouping). */
  phase?: string
  tags?: string[]
  percentComplete?: number
  isComplete?: boolean
  completedDate?: string
  assignedSubs?: { id: number | string; name: string }[]
  predecessors?: (number | string)[]
}

export interface BtPhoto {
  id: number | string
  url: string
  takenDate: string
  title?: string
  scheduleItemId?: number | string
  tags?: string[]
}

export interface BtDailyLog {
  id: number | string
  date: string
  notes: string
  weather?: string
  createdBy?: string
}
