/**
 * Normalized internal domain model for LUIH Build Journey.
 *
 * The UI and 3D scene ONLY consume these types. Anything Buildertrend-specific
 * is mapped into this shape inside /services/buildertrend.
 *
 * Hierarchy:  Phase → Stage → Milestone → Task → (Inspection | Approval | Document | Photo)
 */

export type ISODate = string // 'YYYY-MM-DD'

export type PhaseKey = 'sales' | 'pre-construction' | 'construction' | 'post-construction'

export type WorkStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked'

/** Building systems used for X-Ray filtering + color coding. */
export type SystemKey = 'structure' | 'plumbing' | 'drain' | 'electrical' | 'hvac' | 'lowvoltage'

/** Top-level construction layer groups (semantic, not geometric). */
export type LayerGroup =
  | 'SITE'
  | 'FOUNDATION'
  | 'STRUCTURE'
  | 'MEP'
  | 'ENVELOPE'
  | 'INTERIOR'
  | 'EXTERIOR'

export interface Project {
  id: string
  externalId?: string // Buildertrend job id
  name: string
  model: string
  address: string
  community: string
  homeowner: string
  startDate: ISODate
  baselineCompletion: ISODate
  /** Demo clock / "now" used to decide what is actual vs forecast. */
  today: ISODate
  lastSyncedAt: string
  phases: Phase[]
  tradePartners: TradePartner[]
  photos: Photo[]
  documents: ProjectDocument[]
  changeOrders: ChangeOrder[]
  dailyLogs: DailyLog[]
  blockers: Blocker[]
  qualityChecks: QualityCheck[]
  components: ComponentRecord[]
  settings: { showFinancials: boolean; scheduleStatusOverride?: ScheduleStatus }
}

export interface Phase {
  id: string
  key: PhaseKey
  name: string
  order: number
  /** Only the construction phase is visualized in 3D today. */
  stages: Stage[]
}

export interface Stage {
  id: string
  code: string // '01'
  name: string
  shortName: string
  order: number
  /** One-line homeowner-facing story for this stage. */
  story: string
  cameraPreset: string
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  stageId: string
  name: string
  plannedDate: ISODate
  homeownerVisible: boolean
  tasks: Task[]
  approvals: Approval[]
}

export interface Task {
  id: string
  milestoneId: string
  name: string
  tradeId?: string
  system?: SystemKey
  /** Groups tasks for stage breakdowns (e.g. Mechanical / Electrical). */
  discipline?: string
  plannedStart: ISODate
  plannedEnd: ISODate
  actualStart?: ISODate
  actualEnd?: ISODate
  /** Days the remaining work has slipped versus plan. */
  delayDays: number
  status: WorkStatus
  /** 0..1 — truth at project.today for in-progress tasks. */
  percentComplete: number
  checklist: ChecklistItem[]
  inspections: Inspection[]
  homeownerVisible?: boolean
}

export interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

export type InspectionResult = 'scheduled' | 'passed' | 'failed' | 'delayed'

export interface Inspection {
  id: string
  taskId: string
  name: string
  authority: string
  scheduledDate: ISODate
  result: InspectionResult
  resultDate?: ISODate
  inspector?: string
  notes?: string
}

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested'

export interface Approval {
  id: string
  name: string
  requestedOf: 'homeowner' | 'architect' | 'builder'
  status: ApprovalStatus
  dueDate: ISODate
  decidedDate?: ISODate
  homeownerVisible: boolean
}

export interface Photo {
  id: string
  date: ISODate
  stageId: string
  taskId?: string
  location: string
  tradeId?: string
  caption: string
  url: string
  /** Fixed jobsite camera station — lets Compare align render vs photo. */
  station?: string
  source: 'buildertrend' | 'jobsite-camera' | 'placeholder'
}

export interface ProjectDocument {
  id: string
  name: string
  kind: 'permit' | 'plan' | 'inspection' | 'spec' | 'warranty' | 'selection' | 'report'
  date: ISODate
  stageId: string
  taskId?: string
  url: string
  internalOnly: boolean
}

export interface TradePartner {
  id: string
  name: string
  trade: string
  contact: string
  phone: string
}

export interface ChangeOrder {
  id: string
  title: string
  amount: number
  status: 'draft' | 'pending' | 'approved'
  date: ISODate
}

export interface DailyLog {
  id: string
  date: ISODate
  author: string
  weather: string
  crew: number
  notes: string
}

export interface Blocker {
  id: string
  taskId: string
  title: string
  severity: 'low' | 'medium' | 'high'
  owner: string
  openedDate: ISODate
  resolvedDate?: ISODate
}

export interface QualityCheck {
  id: string
  taskId: string
  name: string
  result: 'pass' | 'open' | 'fail'
  date: ISODate
}

/**
 * A physical, clickable building component. This is the bridge between
 * geometry (procedural part or GLB node) and schedule data (task).
 */
export interface ComponentRecord {
  id: string
  name: string
  layer: string
  system?: SystemKey
  taskId: string
  location: string
  specs?: Record<string, string>
}

export type ScheduleStatus = 'on_schedule' | 'at_risk' | 'delayed'
