/**
 * Warm Central-Florida daylight that eases into golden hour as the home is
 * handed over — interior and landscape lights come on with it.
 */
import { Environment, Lightformer, Sky } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { indexProject, taskProgressAt } from '@/lib/schedule'
import { journey } from '@/store/useJourney'

const DAY_SUN = new THREE.Vector3(38, 46, 26)
const DUSK_SUN = new THREE.Vector3(-52, 9, 30)
const DAY_COLOR = new THREE.Color('#fff2df')
const DUSK_COLOR = new THREE.Color('#ffb877')
const INTERIOR: [number, number, number][] = [
  [-2, 2.2, -8.5],
  [-0.5, 2.2, -3.5],
  [-6.5, 2.2, -2],
  [-6, 5.4, -3],
  [-7.5, 5.4, 2],
  [1.2, 5.4, -2.5],
]

export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sky = useRef<THREE.Mesh>(null)
  const pool = useRef<THREE.PointLight>(null)
  const interior = useRef<(THREE.PointLight | null)[]>([])
  const dusk = useRef(-1)
  const scene = useThree((s) => s.scene)

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#dfe3e2', 110, 330)
    const t = sun.current!.target
    t.position.set(0, 0, -3)
    scene.add(t)
    return () => {
      scene.remove(t)
    }
  }, [scene])

  useFrame((_, dt) => {
    const s = journey()
    if (!s.project) return
    const idx = indexProject(s.project)
    const cursor = s.renderDate ?? s.cursor
    const handover = idx.taskById.get('t-handover') ?? idx.taskById.get('bt-photos')
    const lights = idx.taskById.get('t-landscape-lighting') ?? idx.taskById.get('bt-trim-lighting-fixtures')
    const target = handover ? taskProgressAt(handover, cursor, idx.today) * 0.9 : 0
    const k = 1 - Math.exp(-3 * Math.min(dt, 0.1))
    dusk.current = dusk.current < 0 ? target : dusk.current + (target - dusk.current) * k
    const d = dusk.current
    const L = sun.current!
    L.position.copy(DAY_SUN).lerp(DUSK_SUN, d)
    L.color.copy(DAY_COLOR).lerp(DUSK_COLOR, d)
    L.intensity = THREE.MathUtils.lerp(2.5, 0.85, d)
    hemi.current!.intensity = THREE.MathUtils.lerp(0.6, 0.22, d)
    const u = (sky.current?.material as THREE.ShaderMaterial | undefined)?.uniforms
    if (u?.sunPosition) u.sunPosition.value.copy(L.position).normalize().multiplyScalar(100)
    const lit = Math.max(d / 0.9, 0)
    interior.current.forEach((p) => p && (p.intensity = lit * 14))
    const lp = lights ? taskProgressAt(lights, cursor, idx.today) : 0
    if (pool.current) pool.current.intensity = lp * lit * 6
  })

  return (
    <>
      <Sky ref={sky as never} distance={4500} sunPosition={DAY_SUN.toArray()} turbidity={5.5} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.86} />
      <hemisphereLight ref={hemi} args={['#e4ecf2', '#8d8063', 0.75]} />
      <directionalLight
        ref={sun}
        position={DAY_SUN.toArray()}
        intensity={3.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={160}
      />
      {INTERIOR.map((p, i) => (
        <pointLight key={i} ref={(el) => void (interior.current[i] = el)} position={p} color="#ffc98c" intensity={0} distance={10} decay={1.6} />
      ))}
      <pointLight ref={pool} position={[-2.5, -0.6, -17.6]} color="#7fd6ee" intensity={0} distance={8} decay={1.5} />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={1.6} position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} color="#f4f6f8" />
        <Lightformer intensity={0.8} position={[30, 6, 10]} rotation-y={-Math.PI / 2} scale={[30, 10, 1]} color="#ffe6c8" />
        <Lightformer intensity={0.6} position={[-30, 5, -10]} rotation-y={Math.PI / 2} scale={[30, 10, 1]} color="#dfe8f0" />
        <Lightformer intensity={0.4} position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[60, 60, 1]} color="#8a7f62" />
      </Environment>
    </>
  )
}
