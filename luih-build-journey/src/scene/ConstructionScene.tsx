import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense } from 'react'
import * as THREE from 'three'
import { useJourney } from '@/store/useJourney'
import { CameraRig } from './CameraRig'
import { Capture } from './Capture'
import { PRESETS } from './cameraPresets'
import { HomeModel } from './home/HomeModel'
import { Lighting } from './Lighting'
import { Site } from './Site'

/** ?quality=low disables post-processing + caps DPR (older laptops / screen share). */
// Phones/tablets default to a lighter pipeline (no post FX, capped DPR) to stay smooth and cool.
const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const quality = new URLSearchParams(location.search).get('quality') ?? (touch ? 'low' : 'high')

export function ConstructionScene() {
  return (
    <Canvas
      shadows
      dpr={[1, quality === 'low' ? (touch ? 1.5 : 1) : 2]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 35, near: 0.1, far: 2000, position: PRESETS.overview.pos }}
      onCreated={({ gl, scene, camera }) => {
        if (import.meta.env.DEV) Object.assign(window, { __scene: scene, __camera: camera })
        gl.localClippingEnabled = true
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
      onPointerMissed={(e) => e.button === 0 && useJourney.getState().select(null)}
    >
      <Suspense fallback={null}>
        <Lighting />
        <Site />
        <HomeModel />
      </Suspense>
      <CameraRig />
      <Capture />
      {quality !== 'low' && <Effects />}
    </Canvas>
  )
}

/** Screen-space AO is skipped in X-Ray (heavy transparency breaks it). */
function Effects() {
  const xray = useJourney((s) => s.xray)
  if (xray)
    return (
      <EffectComposer key="xray" multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    )
  return (
    <EffectComposer key="full" multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={1.6} intensity={2.2} distanceFalloff={1.2} quality="medium" halfRes />
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1.0} luminanceSmoothing={0.2} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  )
}
