/**
 * ▶ Play Build Journey — cinematic from the empty lot to the completed home.
 * Driven by the selected project's own construction stages, dates and camera
 * presets (no hardcoded stage ids), so real Buildertrend jobs play the same way.
 *
 * Controls: play · pause/resume · restart · stop. Any manual timeline or stage
 * interaction stops playback and hands control back to the user.
 */
import gsap from 'gsap'
import { resolvePose } from '@/scene/cameraPresets'
import { indexProject, taskWindow } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'

let tl: gsap.core.Timeline | null = null
let endTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Pacing (seconds). Each stage plays as: camera settles on the stage title →
 * one build step per milestone (caption names it) → short hold on the result.
 * Steps share a fixed budget, so every stage takes ~12 s however many milestones
 * it has and a six-stage job runs about 75 s.
 */
const PACE = { intro: 1.8, outro: 1.2, stepMax: 3.6, stageBudget: 9 }

/** X-Ray runs during the stage where MEP goes into open walls: an explicit rough-in stage, else the first stage with MEP work. */
function xrayStageId(stages: { id: string; name: string; milestones: { name: string }[] }[]): string | undefined {
  const rough = stages.find((s) => /rough/i.test(s.id) || /rough/i.test(s.name))
  return (rough ?? stages.find((s) => s.milestones.some((m) => /\bMEP\b|rough/i.test(m.name))))?.id
}

/** Camera preset with a safe fallback when a project names one this model doesn't define. */
const camera = (key: string | undefined) => (key && resolvePose(key) ? key : 'overview')

function clearEnd() {
  if (endTimer) clearTimeout(endTimer)
  endTimer = null
}

export function stopDemo() {
  tl?.kill()
  tl = null
  clearEnd()
  const s = useJourney.getState()
  if (s.demo.playing) {
    s.setDemo({ playing: false, paused: false, caption: null })
    s.setXray(false)
    s.setPanelOpen(true)
  }
}

export function pauseDemo() {
  if (!tl || !useJourney.getState().demo.playing) return
  tl.pause()
  useJourney.getState().setDemo({ paused: true })
}

export function resumeDemo() {
  if (!tl) return
  tl.resume()
  useJourney.getState().setDemo({ paused: false })
}

/** P / play button: start, or toggle pause while playing. */
export function togglePlay() {
  const d = useJourney.getState().demo
  if (!d.playing) playDemo()
  else if (d.paused) resumeDemo()
  else pauseDemo()
}

export function restartDemo() {
  stopDemo()
  playDemo()
}

export function playDemo() {
  const s = useJourney.getState()
  const p = s.project
  if (!p) return
  stopDemo()
  const idx = indexProject(p)
  // Only stages with real dates can be played; a project without any shows a useful notice instead.
  const stages = idx.stages.filter((st) => {
    const r = idx.stageRange.get(st.id)
    return r && Number.isFinite(r[0]) && Number.isFinite(r[1])
  })
  if (!stages.length) {
    s.notify({ kind: 'info', title: 'Nothing to play yet', body: 'This project has no dated construction stages in Buildertrend.' })
    return
  }
  const state = { cursor: idx.start - 1 }
  useJourney.setState({ view: 'model', selectedComponentId: null, focusStageId: null, xray: false, isolate: null, gallery: { open: false } })
  s.setDemo({ playing: true, paused: false, caption: { code: '00', title: 'Empty Lot', story: `${p.address} — where it begins.` } })
  s.setCursor(state.cursor)
  s.requestCamera('site', 1.2)

  const xrayId = xrayStageId(stages)
  // Cursor position as the timeline is being built (tweens must only move forward).
  let at = state.cursor
  tl = gsap.timeline({
    delay: 1.4,
    onUpdate: () => useJourney.setState({ cursor: state.cursor }),
    onComplete: () => {
      useJourney.getState().setDemo({ caption: { code: '', title: 'Welcome home.', story: `${p.name} · ${p.model}` } })
      endTimer = setTimeout(() => {
        const st = useJourney.getState()
        if (st.demo.playing) {
          tl = null
          st.setDemo({ playing: false, paused: false, caption: null })
          st.setXray(false)
          st.setPanelOpen(true)
        }
      }, 3200)
    },
  })
  stages.forEach((stage) => {
    const stageEnd = idx.stageRange.get(stage.id)![1]
    // Milestones in the order they finish; empty ones are skipped. A stage without any still plays as one step.
    const steps = stage.milestones
      .map((m) => ({ name: m.name, end: Math.max(...m.tasks.map((t) => taskWindow(t, idx.today)[1])) }))
      .filter((m) => Number.isFinite(m.end))
      .sort((a, b) => a.end - b.end)
    if (!steps.length) steps.push({ name: stage.name, end: stageEnd })
    // Each step builds for ~75% of its slot and holds the result for the rest.
    const slot = Math.min(PACE.stepMax, PACE.stageBudget / steps.length)
    const base = { code: stage.code, title: stage.name, story: stage.story }
    tl!.call(() => {
      const st = useJourney.getState()
      st.setDemo({ caption: base })
      st.requestCamera(camera(stage.cameraPreset), PACE.intro + 0.6)
      st.setXray(stage.id === xrayId)
    })
    tl!.to({}, { duration: PACE.intro })
    steps.forEach((m, i) => {
      tl!.call(() => useJourney.getState().setDemo({ caption: { ...base, step: { index: i + 1, total: steps.length, name: m.name } } }))
      at = Math.max(Math.min(m.end, stageEnd), at)
      tl!.to(state, { cursor: at, duration: slot * 0.75, ease: 'sine.inOut' })
      tl!.to({}, { duration: slot * 0.25 })
    })
    if (stageEnd > at) tl!.to(state, { cursor: (at = stageEnd), duration: 0.4, ease: 'sine.out' })
    tl!.to({}, { duration: PACE.outro })
  })
  tl.call(() => useJourney.getState().setXray(false), [], '-=1.4')
}
