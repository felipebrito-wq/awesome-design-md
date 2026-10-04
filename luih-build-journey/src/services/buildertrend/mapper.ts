/**
 * Maps a (much more detailed) Buildertrend schedule onto LUIH stages and
 * milestones. The mapping is CONFIG, not code: add rules as the real
 * schedule template stabilizes.
 */
import type { Milestone, Stage, Task } from '@/domain/types'
import type { BtScheduleItem } from './dto'

export interface StageRule {
  stageId: string
  milestone: string
  /** Matched against BT phase, tags and title (case-insensitive). */
  match: RegExp
  system?: Task['system']
  discipline?: string
}

export const DEFAULT_STAGE_RULES: StageRule[] = [
  { stageId: 'stg-site', milestone: 'Clearing & Grading', match: /clear|grad|pad|survey|silt|temp/i },
  { stageId: 'stg-foundation', milestone: 'Footings', match: /footing/i },
  { stageId: 'stg-foundation', milestone: 'Underground Utilities', match: /underground|under-slab|termite/i, system: 'drain' },
  { stageId: 'stg-foundation', milestone: 'Slab', match: /slab/i },
  { stageId: 'stg-framing', milestone: 'First-Floor Masonry', match: /block|cmu|masonry|tie beam/i, system: 'structure' },
  { stageId: 'stg-framing', milestone: 'Second-Floor Framing', match: /fram|truss|sheath|dry.?in/i, system: 'structure' },
  { stageId: 'stg-roughins', milestone: 'Plumbing Rough-In', match: /plumb.*rough|top.?out|dwv/i, system: 'plumbing', discipline: 'Plumbing' },
  { stageId: 'stg-roughins', milestone: 'Mechanical Rough-In', match: /hvac|mechanical|duct/i, system: 'hvac', discipline: 'Mechanical' },
  { stageId: 'stg-roughins', milestone: 'Electrical Rough-In', match: /electric.*rough|panel|service/i, system: 'electrical', discipline: 'Electrical' },
  { stageId: 'stg-roughins', milestone: 'Low Voltage', match: /low.?volt|av|security|structured/i, system: 'lowvoltage', discipline: 'Low Voltage' },
  { stageId: 'stg-finishes', milestone: 'Exterior Envelope', match: /window|door|roof|stucco|lath/i },
  { stageId: 'stg-finishes', milestone: 'Insulation & Drywall', match: /insulat|drywall/i },
  { stageId: 'stg-finishes', milestone: 'Interior Finishes', match: /floor|cabinet|counter|paint|fixture|trim/i },
  { stageId: 'stg-complete', milestone: 'Pool', match: /pool/i },
  { stageId: 'stg-complete', milestone: 'Driveway & Hardscape', match: /driveway|paver|hardscape/i },
  { stageId: 'stg-complete', milestone: 'Landscape & Lighting', match: /landscap|sod|plant|irrigat/i },
  { stageId: 'stg-complete', milestone: 'Final Inspections & Handover', match: /final|co\b|walkthrough|closing|handover/i },
]

const day = (iso: string) => iso.slice(0, 10)

export function mapScheduleItem(item: BtScheduleItem, rule: StageRule, milestoneId: string, today: string): Task {
  const pct = item.isComplete ? 1 : Math.max(0, Math.min(1, (item.percentComplete ?? 0) / 100))
  const started = pct > 0 || day(item.startDate) <= today
  return {
    id: `bt-${item.id}`,
    milestoneId,
    name: item.title,
    tradeId: item.assignedSubs?.[0] ? `bt-sub-${item.assignedSubs[0].id}` : undefined,
    system: rule.system,
    discipline: rule.discipline,
    plannedStart: day(item.startDate),
    plannedEnd: day(item.endDate),
    actualStart: started ? day(item.startDate) : undefined,
    actualEnd: item.isComplete ? day(item.completedDate ?? item.endDate) : undefined,
    delayDays: 0,
    status: item.isComplete ? 'complete' : pct > 0 ? 'in_progress' : 'not_started',
    percentComplete: pct,
    checklist: [],
    inspections: [],
  }
}

/** Groups raw schedule items into LUIH stages/milestones using rules. */
export function mapSchedule(items: BtScheduleItem[], stages: Stage[], today: string, rules = DEFAULT_STAGE_RULES): Stage[] {
  const out = stages.map((s) => ({ ...s, milestones: [] as Milestone[] }))
  const byId = new Map(out.map((s) => [s.id, s]))
  for (const item of items) {
    const hay = [item.phase, ...(item.tags ?? []), item.title].join(' ')
    const rule = rules.find((r) => r.match.test(hay))
    if (!rule) continue
    const stage = byId.get(rule.stageId)!
    let m = stage.milestones.find((x) => x.name === rule.milestone)
    if (!m) {
      m = { id: `m-${stage.id}-${stage.milestones.length}`, stageId: stage.id, name: rule.milestone, plannedDate: day(item.endDate), homeownerVisible: true, tasks: [], approvals: [] }
      stage.milestones.push(m)
    }
    m.tasks.push(mapScheduleItem(item, rule, m.id, today))
    if (day(item.endDate) > m.plannedDate) m.plannedDate = day(item.endDate)
  }
  return out
}
