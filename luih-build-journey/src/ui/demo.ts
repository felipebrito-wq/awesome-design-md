/**
 * ▶ Play Build Journey — ~27 s cinematic: empty lot → completed home.
 * Drives the same timeline cursor + camera presets the user controls.
 */
import gsap from 'gsap'
import { indexProject } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'

let tl: gsap.core.Timeline | null = null

const SEGMENTS: { stageId: string; dur: number; xray?: boolean; camera: string; camDur?: number }[] = [
  { stageId: 'stg-site', dur: 3.2, camera: 'site' },
  { stageId: 'stg-foundation', dur: 3.6, camera: 'foundation' },
  { stageId: 'stg-framing', dur: 4.6, camera: 'framing' },
  { stageId: 'stg-roughins', dur: 4.4, camera: 'roughins', xray: true },
  { stageId: 'stg-finishes', dur: 5.0, camera: 'finishes' },
  { stageId: 'stg-complete', dur: 5.2, camera: 'complete' },
]

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
  for (const seg of SEGMENTS) {
    const stage = idx.stageById.get(seg.stageId)!
    const end = idx.stageRange.get(seg.stageId)![1]
    tl.call(() => {
      const st = useJourney.getState()
      st.setDemo({ caption: { code: stage.code, title: stage.name, story: stage.story } })
      st.requestCamera(seg.camera, seg.dur * 1.05)
      st.setXray(!!seg.xray)
    })
    tl.to(state, { cursor: end, duration: seg.dur, ease: 'sine.inOut' })
  }
  tl.call(() => useJourney.getState().setXray(false), [], '-=1.4')
}
