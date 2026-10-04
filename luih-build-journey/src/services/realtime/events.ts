/**
 * Event/update layer. In production these arrive from the LUIH sync service
 * (Buildertrend webhooks/polling → normalized DB → SSE/WebSocket). In the
 * prototype the DEV panel and simulator emit the same events.
 */
import type { ApprovalStatus, Blocker, InspectionResult, ISODate, Photo, ScheduleStatus } from '@/domain/types'

interface Base {
  id: string
  at: string
  source: 'buildertrend' | 'dev'
}

export type BuildEvent = Base &
  (
    | { type: 'task.completed'; taskId: string }
    | { type: 'task.progress'; taskId: string; percent: number }
    | { type: 'inspection.result'; inspectionId: string; result: InspectionResult }
    | { type: 'schedule.changed'; milestoneId: string; delayDays: number; reason: string }
    | { type: 'photo.added'; photos: Photo[] }
    | { type: 'blocker.opened'; blocker: Blocker }
    | { type: 'blocker.resolved'; blockerId: string }
    | { type: 'approval.decided'; approvalId: string; status: ApprovalStatus }
    | { type: 'clock.set'; date: ISODate }
    | { type: 'schedule.status'; status: ScheduleStatus | undefined }
    | { type: 'sync.batch'; events: BuildEvent[] }
  )

export type NoticeKind = 'success' | 'info' | 'warning' | 'progress' | 'photo'

export interface Notice {
  id: string
  kind: NoticeKind
  title: string
  detail?: string
  at: string
  celebrate?: 'inspection' | 'milestone' | 'stage'
  /** Component ids to pulse in the 3D scene. */
  pulse?: string[]
}

let seq = 0
export const eventId = () => `ev-${Date.now().toString(36)}-${(seq++).toString(36)}`

/** Helper for emitting events without boilerplate. */
export const ev = <T extends BuildEvent['type']>(
  type: T,
  payload: Omit<Extract<BuildEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
  source: Base['source'] = 'buildertrend',
): BuildEvent => ({ id: eventId(), at: new Date().toISOString(), source, type, ...payload }) as unknown as BuildEvent
