/**
 * ▶ Play Build Journey — ~27 s cinematic: empty lot → completed home.
 * Drives the same timeline cursor + camera presets the user controls.
 */
import gsap from 'gsap'
import { indexProject } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'

let tl: gsap.core.Timeline | null = null

/** Seconds per construction stage, in order (~26 s total). Extra stages get the last value. */
const DURATIONS = [3.2, 3.6, 4.6, 4.4, 5.0, 5.2]

/** X-Ray runs during the stage where MEP goes into open walls: an explicit rough-in stage, else the first stage with MEP work. */
function xrayStageId(stages: { id: string; name: string; milestones: { name: string }[] }[]): string | undefined {
  const rough = stages.find((s) => /rough/i.test(s.id) || /rough/i.test(s.name))
  return (rough ?? stages.find((s) => s.milestones.some((m) => /\bMEP\b|rough/i.test(m.name))))?.id
}

export function stopDemo() {
  tl?.kill()
  tl = null
  const s = useJourney.getState()
  if (s.demo.playing) {
    s.setDemo({ playing: false, caption: null })
    s.setXray(false)
    s.setPanelOpen(true)
  }
}

export function playDemo() {
  const s = useJourney.getState()
  const p = s.project
  if (!p) return
  stopDemo()
  const idx = indexProject(p)
  const state = { cursor: idx.start - 1 }
  useJourney.setState({ view: 'model', selectedComponentId: null, focusStageId: null, xray: false, isolate: null, gallery: { open: false } })
  s.setDemo({ playing: true, caption: { code: '00', title: 'Empty Lot', story: `${p.address} — where it begins.` } })
  s.setCursor(state.cursor)
  s.requestCamera('site', 1.2)

  tl = gsap.timeline({
    delay: 1.4,
    onUpdate: () => useJourney.setState({ cursor: state.cursor }),
    onComplete: () => {
      useJourney.getState().setDemo({ caption: { code: '', title: 'Welcome home.', story: `${p.name} · ${p.model}` } })
      setTimeout(() => {
        const st = useJourney.getState()
        if (st.demo.playing) {
          st.setDemo({ playing: false, caption: null })
          st.setPanelOpen(true)
        }
      }, 3200)
    },
  })
  // Driven by the project's own construction stages, so real Buildertrend jobs
  // (whose stage ids differ from the demo house) play the same journey.
  const xrayId = xrayStageId(idx.stages)
  idx.stages.forEach((stage, i) => {
    const dur = DURATIONS[Math.min(i, DURATIONS.length - 1)]
    const end = idx.stageRange.get(stage.id)![1]
    tl!.call(() => {
      const st = useJourney.getState()
      st.setDemo({ caption: { code: stage.code, title: stage.name, story: stage.story } })
      st.requestCamera(stage.cameraPreset, dur * 1.05)
      st.setXray(stage.id === xrayId)
    })
    tl!.to(state, { cursor: end, duration: dur, ease: 'sine.inOut' })
  })
  tl.call(() => useJourney.getState().setXray(false), [], '-=1.4')
}
