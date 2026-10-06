/**
 * Pure visual resolver shared by procedural parts and GLB nodes:
 * (component + schedule + view state) → build progress, opacity, emissive.
 * This is the "stage controller": hidden / visible / transparent /
 * highlighted / completed / under construction.
 */
import { LAYER_INDEX, SYSTEM_INDEX, XRAY_OPACITY } from '@/domain/layers'
import type { ComponentRecord, Project, SystemKey } from '@/domain/types'
import { clamp01 } from '@/lib/dates'
import { indexProject, taskProgressAt } from '@/lib/schedule'
import type { useJourney } from '@/store/useJourney'

type State = ReturnType<typeof useJourney.getState>

export interface PartMeta {
  componentId: string
  appearTask?: string
  disappearTask?: string
  disappearFade?: boolean
  disappearWindow?: [number, number]
  window?: [number, number]
  colorTo?: { task: string; color: string }
  glow?: { task: string; color: string; intensity: number }
  fade?: boolean
  baseOpacity: number
}

export interface PartTargets {
  p: number
  d: number
  opacity: number
  emissive: string
  emissiveIntensity: number
  ghost: boolean
  colorT: number
  clickable: boolean
  /** Built only in the forecast (cursor after today, not yet reported complete): render as planned, not as fact. */
  planned: boolean
}

const ACCENT = '#20a483'
/** Forecast-only work renders as an opaque slate "clay" massing (LUIH OS slate-300), never as finished fact. */
export const PLANNED_OPACITY = 1
export const PLANNED_TINT = '#b7c8d5'
const compCache = new WeakMap<Project, Map<string, ComponentRecord>>()

export function componentIndex(p: Project) {
  let m = compCache.get(p)
  if (!m) {
    m = new Map(p.components.map((c) => [c.id, c]))
    compCache.set(p, m)
  }
  return m
}

export function partSystem(p: Project, componentId: string): SystemKey | undefined {
  const c = componentIndex(p).get(componentId)
  if (!c) return undefined
  return c.system ?? LAYER_INDEX[c.layer]?.system
}

export function resolveTargets(meta: PartMeta, s: State, now: number): PartTargets | null {
  const proj = s.project
  if (!proj) return null
  const idx = indexProject(proj)
  const comp = componentIndex(proj).get(meta.componentId)
  const cursor = s.renderDate ?? s.cursor
  const today = idx.today
  const prog = (taskId?: string) => {
    if (!taskId || taskId === '__always') return 1
    const t = idx.taskById.get(taskId)
    return t ? taskProgressAt(t, cursor, today) : 0
  }

  const appearTask = meta.appearTask ?? comp?.taskId
  let p = prog(appearTask)
  if (meta.window) p = clamp01((p - meta.window[0]) / (meta.window[1] - meta.window[0]))
  // Reported progress as of today (Buildertrend status) vs. what the schedule forecasts at the cursor
  let pToday = 1
  if (appearTask && appearTask !== '__always' && cursor > today + 0.5) {
    const t = idx.taskById.get(appearTask)
    pToday = t ? taskProgressAt(t, today, today) : 0
    if (meta.window) pToday = clamp01((pToday - meta.window[0]) / (meta.window[1] - meta.window[0]))
  }
  const planned = p > 0.001 && p - pToday > 0.02 && !s.demo.playing && s.renderDate == null // the cinematic labels its forecast in the caption instead
  let d = meta.disappearTask ? prog(meta.disappearTask) : 0
  if (meta.disappearWindow) d = clamp01((d - meta.disappearWindow[0]) / (meta.disappearWindow[1] - meta.disappearWindow[0]))

  const layer = comp ? LAYER_INDEX[comp.layer] : undefined
  const group = layer?.group ?? 'SITE'
  const system = comp?.system ?? layer?.system

  let opacity = meta.baseOpacity
  let emissive = '#000000'
  let emissiveIntensity = 0

  if (s.xray) {
    opacity *= XRAY_OPACITY[group]
    if (group === 'STRUCTURE' && s.isolate === 'structure') opacity = 1
    if (system && !s.systems[system]) opacity = 0
    if (s.isolate) opacity = system === s.isolate ? Math.max(opacity, group === 'MEP' ? 1 : 0.85) : Math.min(opacity, 0.045)
    if (group === 'MEP' && system && opacity > 0.5) {
      emissive = SYSTEM_INDEX[system].color
      emissiveIntensity = 0.55
    }
  }
  if (meta.fade) opacity *= p
  if (meta.disappearFade) opacity *= 1 - d

  if (meta.glow) {
    const g = prog(meta.glow.task)
    if (g > 0.001) {
      emissive = meta.glow.color
      emissiveIntensity = meta.glow.intensity * g
    }
  }

  const pulseAt = s.pulses[meta.componentId]
  if (pulseAt && now - pulseAt < 3200) {
    const t = (now - pulseAt) / 3200
    emissive = ACCENT
    emissiveIntensity = Math.max(emissiveIntensity, 0.7 * (1 - t) * (0.55 + 0.45 * Math.sin(t * Math.PI * 6)))
  }
  if (s.hoveredComponentId === meta.componentId) {
    emissive = ACCENT
    emissiveIntensity = Math.max(emissiveIntensity, 0.32)
  }
  if (s.selectedComponentId === meta.componentId) {
    emissive = ACCENT
    emissiveIntensity = Math.max(emissiveIntensity, 0.55)
  }

  const previewing = !!s.previewStageId && !!appearTask && idx.stageOfTask.get(appearTask)?.id === s.previewStageId
  const ghost = previewing && p < 0.995 && !(meta.disappearTask && d > 0.5)

  return {
    p,
    d,
    opacity,
    emissive,
    emissiveIntensity,
    ghost,
    colorT: meta.colorTo ? prog(meta.colorTo.task) : 0,
    clickable: opacity > 0.3 && p > 0.02 && d < 0.98,
    planned,
  }
}
