import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { journey, useJourney } from '@/store/useJourney'
import { resolvePose, PRESETS } from './cameraPresets'

const PANEL_W = 400
const BOTTOM_H = 150

/**
 * Orbit/zoom/pan + cinematic preset transitions (GSAP), plus a projection
 * offset so the house centers in the area not covered by UI chrome.
 */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const nonce = useJourney((s) => s.camera.nonce)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const offset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const { preset, duration } = journey().camera
    const pose = resolvePose(preset)
    const c = controls.current
    if (!pose || !c) return
    tl.current?.kill()
    const dur = duration ?? 1
    // Presets are framed for a ~16:10 screen; on narrow/portrait screens keep the same horizontal coverage
    const base = pose.fov ?? 35
    const aspect = size.width / Math.max(1, size.height)
    const fov = aspect >= 1.4 ? base : Math.min(78, (2 * Math.atan(Math.tan((base * Math.PI) / 360) * (1.4 / aspect)) * 180) / Math.PI)
    const t = new THREE.Vector3(...pose.target)
    if (dur <= 0) {
      camera.position.set(...pose.pos)
      c.target.copy(t)
      camera.fov = fov
      camera.updateProjectionMatrix()
      c.update()
      return
    }
    tl.current = gsap
      .timeline({ onUpdate: () => c.update() })
      .to(camera.position, { x: pose.pos[0], y: pose.pos[1], z: pose.pos[2], duration: dur, ease: 'power3.inOut' }, 0)
      .to(c.target, { x: t.x, y: t.y, z: t.z, duration: dur, ease: 'power3.inOut' }, 0)
      .to(camera, { fov, duration: dur, ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() }, 0)
  }, [nonce, camera]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => tl.current?.kill()
    c.addEventListener('start', stop)
    return () => c.removeEventListener('start', stop)
  }, [])

  useFrame((_, dt) => {
    const s = journey()
    const chrome = s.view === 'model' && !s.demo.playing
    const tx = chrome && s.panelOpen && size.width > 900 ? PANEL_W / 2 : 0
    const ty = chrome ? BOTTOM_H / 2 - 30 : 0
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.1))
    const o = offset.current
    const nx = o.x + (tx - o.x) * k
    const ny = o.y + (ty - o.y) * k
    if (Math.abs(nx - o.x) > 0.05 || Math.abs(ny - o.y) > 0.05 || !camera.view) {
      o.x = nx
      o.y = ny
      camera.setViewOffset(size.width, size.height, o.x, o.y, size.width, size.height)
    }
  })

  useEffect(() => {
    camera.setViewOffset(size.width, size.height, offset.current.x, offset.current.y, size.width, size.height)
  }, [size, camera])

  return (
    <OrbitControls
      ref={controls as never}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={PRESETS.overview.target}
      zoomSpeed={0.8}
      rotateSpeed={0.6}
    />
  )
}
