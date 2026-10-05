/**
 * Renders a "site photo" from a jobsite camera station at any date, using the
 * same model + schedule. Placeholder for Buildertrend photos and the source of
 * the bundled /public/photos set (scripts/capture-photos.mjs).
 */
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { registerCapture, sceneFlags } from '@/lib/capture'
import { toDay } from '@/lib/dates'
import { useJourney } from '@/store/useJourney'
import { stationsFor } from './cameraPresets'

const frames = (n: number) => new Promise<void>((r) => {
  const step = (k: number) => (k <= 0 ? r() : requestAnimationFrame(() => step(k - 1)))
  step(n)
})

function grade(src: HTMLCanvasElement, width: number): string {
  const ratio = 3 / 2
  let sw = src.width
  let sh = Math.round(sw / ratio)
  if (sh > src.height) {
    sh = src.height
    sw = Math.round(sh * ratio)
  }
  const sx = (src.width - sw) / 2
  const sy = (src.height - sh) / 2
  const out = document.createElement('canvas')
  out.width = width
  out.height = Math.round(width / ratio)
  const ctx = out.getContext('2d')!
  ctx.filter = 'saturate(0.88) contrast(1.06) sepia(0.07) brightness(1.02)'
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height)
  ctx.filter = 'none'
  // vignette
  const g = ctx.createRadialGradient(out.width / 2, out.height / 2, out.width * 0.3, out.width / 2, out.height / 2, out.width * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(20,14,8,0.32)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, out.width, out.height)
  // film grain
  const img = ctx.getImageData(0, 0, out.width, out.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  return out.toDataURL('image/jpeg', 0.86)
}

export function Capture() {
  const { gl, scene, size } = useThree()

  useEffect(() => {
    registerCapture(async (station, opts = {}) => {
      const pose = stationsFor()[station]
      if (!pose) throw new Error(`Unknown station ${station}`)
      const st = useJourney.getState()
      const saved = { xray: st.xray, hoveredComponentId: st.hoveredComponentId, selectedComponentId: st.selectedComponentId, previewStageId: st.previewStageId, renderDate: st.renderDate }
      useJourney.setState({ xray: false, hoveredComponentId: null, selectedComponentId: null, previewStageId: null, renderDate: opts.date ? toDay(opts.date) : st.cursor })
      sceneFlags.snap = true
      await frames(3)
      const cam = new THREE.PerspectiveCamera(pose.fov, size.width / size.height, 0.1, 2000)
      cam.position.set(...pose.pos)
      cam.lookAt(...pose.target)
      // EffectComposer disables renderer tone mapping; restore it for the direct render.
      const tm = gl.toneMapping
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.render(scene, cam)
      const url = grade(gl.domElement, opts.width ?? 1200)
      gl.toneMapping = tm
      sceneFlags.snap = false
      useJourney.setState(saved)
      await frames(1)
      return url
    })
    return () => void registerCapture(null)
  }, [gl, scene, size])

  return null
}
