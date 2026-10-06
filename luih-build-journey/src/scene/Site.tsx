/** Static Winter Park neighborhood context: lawn, street, neighbors, oaks, lake. */
import { useFrame } from '@react-three/fiber'
import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { POOL } from './home/houseSpec'
import { POOL as BRYANT_POOL, TREES as BRYANT_TREES, X as BX, Z as BZ } from './home/bryant/plan'
import { useJourney } from '@/store/useJourney'
import { applyFocusFade, FOCUS_NEAR } from './focusFade'

function noiseTexture(base: string, amp = 18, size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amp
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n * 0.6
  }
  ctx.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Instanced({ items, geo, color, roughness = 1, cast = true, fade = false }: { items: { p: number[]; s: number[]; r?: number; c?: string }[]; geo: THREE.BufferGeometry; color: string; roughness?: number; cast?: boolean; fade?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const col = new THREE.Color()
    items.forEach((it, i) => {
      q.setFromEuler(new THREE.Euler(0, it.r ?? 0, 0))
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s))
      ref.current!.setMatrixAt(i, m)
      if (it.c) ref.current!.setColorAt(i, col.set(it.c))
    })
    ref.current!.instanceMatrix.needsUpdate = true
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [items])
  return (
    <instancedMesh ref={ref} args={[geo, undefined, items.length]} castShadow={cast} receiveShadow raycast={() => undefined}>
      <meshStandardMaterial ref={(m) => void (m && fade && !m.userData.focus && (m.userData.focus = applyFocusFade(m)))} color={items.some((i) => i.c) ? '#ffffff' : color} roughness={roughness} />
    </instancedMesh>
  )
}

const BOX = new THREE.BoxGeometry(1, 1, 1)
const SPHERE = new THREE.SphereGeometry(0.5, 14, 10)
const CYL = new THREE.CylinderGeometry(0.5, 0.6, 1, 8)
const ROOF = new THREE.ConeGeometry(0.72, 1, 4)

export function Site() {
  const variant = useJourney((s) => (s.project?.modelKey === 'bryant' ? 'tampa' : 'lake'))
  // Elevation compare: drop neighbors/trees so the as-built reads like the sealed elevation sheet.
  const elevation = useJourney((s) => s.view === 'compare' && !!s.compareSourceId?.startsWith('dw-elev'))
  return <SiteImpl key={variant} variant={variant} context={!elevation} />
}

/** Winter Park lakefront (demo) or Sunset Park, Tampa (2623 S Bryant Cir). */
const SiteImpl = memo(function SiteImpl({ variant, context }: { variant: 'lake' | 'tampa'; context: boolean }) {
  // Anything closer to the camera than the house (minus its radius) dissolves
  useFrame(({ camera }) => {
    FOCUS_NEAR.value = Math.max(0, camera.position.length() - (variant === 'tampa' ? 17 : 14))
  })
  const ground = useMemo(() => {
    const tampa = variant === 'tampa'
    const s = new THREE.Shape()
    s.moveTo(-300, -300)
    s.lineTo(300, -300)
    s.lineTo(300, tampa ? 300 : 33.5)
    s.lineTo(-300, tampa ? 300 : 33.5)
    s.closePath()
    const [x0, z0, x1, z1] = tampa ? [BX(BRYANT_POOL.x0), BZ(BRYANT_POOL.d1), BX(BRYANT_POOL.x1), BZ(BRYANT_POOL.d0)] : POOL
    const h = new THREE.Path()
    h.moveTo(x0, -z1)
    h.lineTo(x1, -z1)
    h.lineTo(x1, -z0)
    h.lineTo(x0, -z0)
    h.closePath()
    s.holes.push(h)
    const g = new THREE.ShapeGeometry(s)
    g.rotateX(-Math.PI / 2)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 6)
    return g
  }, [variant])
  const grassTex = useMemo(() => noiseTexture('#748d52', 22), [])

  const { oaks, canopies, houses, roofs, windows, farTrees } = useMemo(() => {
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const tampa = variant === 'tampa'
    // Tampa: retained grand oaks from the A-1 site plan (32" front-left, 26" right, 20" rear-right, 36" off-site)
    const oakSpots: [number, number, number][] = tampa
      ? [...BRYANT_TREES.map((t) => [BX(t.x), BZ(t.d), 0.55 + t.dbh / 40] as [number, number, number]), [-52, -36, 1.2], [56, -40, 1.1]]
      : [[-22, 24, 1.2], [-6, 31, 1.0], [14, 31, 1.15], [30, 23, 1.1], [-34, 8, 1.3], [33, -6, 1.25], [-30, -20, 1.2], [24, -30, 1.1], [-19, -30, 1.0], [40, 30, 1], [-44, 30, 1.1], [-14, 46, 1.2]]
    const oaks: { p: number[]; s: number[] }[] = []
    const canopies: { p: number[]; s: number[]; c: string }[] = []
    const greens = ['#3f5534', '#46603a', '#3a5030', '#4c6640']
    for (const [x, z, k] of oakSpots) {
      oaks.push({ p: [x, 2.2 * k, z], s: [0.9 * k, 4.4 * k, 0.9 * k] })
      for (let i = 0; i < 7; i++) {
        const a = rnd() * Math.PI * 2
        const r = rnd() * (tampa ? 3.4 : 4.2) * k
        // Tampa: lifted, tighter crowns so the retained oaks frame the house instead of hiding it
        const lift = tampa ? 1.25 : 1
        const sz = tampa ? 0.82 : 1
        canopies.push({ p: [x + Math.cos(a) * r, (5.2 + rnd() * 2.2) * k * lift, z + Math.sin(a) * r], s: [(6 + rnd() * 3) * k * sz, (3.2 + rnd() * 1.4) * k * sz, (6 + rnd() * 3) * k * sz], c: greens[i % 4] })
      }
    }
    const farTrees: { p: number[]; s: number[]; c: string }[] = []
    for (let i = 0; i < (tampa ? 80 : 140); i++) {
      const a = rnd() * Math.PI * 2
      const r = 70 + rnd() * 110
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (!tampa && z < -36 && z > -150 && Math.abs(x) < 120) continue // keep lake open
      if (tampa && Math.abs(x) < 34) continue // keep the front/rear elevation sightlines clear
      const s = 9 + rnd() * 9
      farTrees.push({ p: [x, s * 0.55, z], s: [s, s * 0.8, s], c: tampa ? ['#8d9c84', '#94a28a', '#899880', '#9aa68f'][i % 4] : greens[i % 4] })
    }
    const houses: { p: number[]; s: number[]; c?: string }[] = []
    const roofs: { p: number[]; s: number[]; r?: number }[] = []
    const windows: { p: number[]; s: number[] }[] = []
    const lots: [number, number, number, number, boolean][] = tampa
      ? [[-33, 0, 15, 13, false], [34, 0, 16, 14, false], [-34, 44, 15, 11, false], [-4, 46, 17, 11, false], [27, 46, 15, 12, true], [-60, 4, 16, 12, false], [62, 2, 15, 12, true], [-30, -40, 16, 13, false], [2, -40, 17, 12, true], [32, -40, 15, 12, false]]
      : [[-36, -2, 16, 12, true], [36, -1, 15, 13, false], [-34, 46, 15, 11, false], [-4, 48, 17, 11, true], [26, 47, 15, 12, false], [-62, 6, 16, 12, false], [62, 4, 15, 12, true]]
    for (const [x, z, w, d, flat] of lots) {
      houses.push({ p: [x, 2.2, z], s: [w, 4.4, d], c: tampa ? '#f2f1ee' : '#ece8e1' })
      if (flat) {
        houses.push({ p: [x - w * 0.15, 5.8, z], s: [w * 0.6, 2.8, d * 0.9], c: tampa ? '#eeede9' : '#e6e2da' })
        houses.push({ p: [x, 4.5, z], s: [w + 0.8, 0.25, d + 0.8], c: tampa ? '#c8ccce' : '#2a2d30' })
        houses.push({ p: [x - w * 0.15, 7.3, z], s: [w * 0.6 + 0.8, 0.25, d * 0.9 + 0.8], c: tampa ? '#c8ccce' : '#2a2d30' })
      } else {
        roofs.push({ p: [x, 4.4 + 1.4, z], s: [w * 1.05, 2.8, d * 1.05], r: Math.PI / 4 })
      }
      const front = z > 20 ? -1 : 1
      if (!tampa) for (let i = 0; i < 3; i++) windows.push({ p: [x - w / 3 + (i * w) / 3, 2.0, z + (front * d) / 2 + front * 0.02], s: [w / 5, 1.8, 0.05] })
    }
    return { oaks, canopies, houses, roofs, windows, farTrees }
  }, [variant])

  return (
    <group>
      <mesh geometry={ground} receiveShadow position={[0, -0.002, 0]} raycast={() => undefined}>
        <meshStandardMaterial map={grassTex} color={variant === 'tampa' ? '#d9ddd0' : '#ffffff'} roughness={1} />
      </mesh>
      {/* Lake + bank + dock (Winter Park demo only) */}
      {variant === 'lake' && (
      <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.35, -190]} raycast={() => undefined}>
        <planeGeometry args={[700, 450]} />
        <meshStandardMaterial color="#5c7a86" roughness={0.08} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.18, 34.5 - 68]} rotation-x={-Math.PI / 2} receiveShadow raycast={() => undefined}>
        <planeGeometry args={[600, 2.2]} />
        <meshStandardMaterial color="#cbb894" roughness={1} />
      </mesh>
      <group position={[2.5, 0, -33]}>
        <mesh position={[0, 0.12, -4]} castShadow receiveShadow raycast={() => undefined}>
          <boxGeometry args={[1.8, 0.1, 8]} />
          <meshStandardMaterial color="#9c7a58" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.12, -9]} castShadow receiveShadow raycast={() => undefined}>
          <boxGeometry args={[6, 0.1, 3]} />
          <meshStandardMaterial color="#9c7a58" roughness={0.8} />
        </mesh>
      </group>
      </>
      )}
      {/* Street */}
      <mesh position={[0, 0.005, 23.3]} receiveShadow raycast={() => undefined}>
        <boxGeometry args={[300, 0.02, 7.4]} />
        <meshStandardMaterial color="#45474a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.03, 18.4]} receiveShadow raycast={() => undefined}>
        <boxGeometry args={[300, 0.06, 1.6]} />
        <meshStandardMaterial color="#d2cdc3" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.03, 28.2]} receiveShadow raycast={() => undefined}>
        <boxGeometry args={[300, 0.06, 1.6]} />
        <meshStandardMaterial color="#d2cdc3" roughness={0.9} />
      </mesh>
      <group visible={context}>
      <Instanced items={oaks} geo={CYL} color="#5d4f42" fade />
      <Instanced items={canopies} geo={SPHERE} color="#46603a" fade />
      <Instanced items={farTrees} geo={SPHERE} color="#46603a" cast={false} />
      <Instanced items={houses} geo={BOX} color="#ece8e1" roughness={0.9} fade />
      <Instanced items={roofs} geo={ROOF} color={variant === 'tampa' ? '#c8ccce' : '#3b3e42'} roughness={0.8} fade />
      <Instanced items={windows} geo={BOX} color="#2a3540" roughness={0.2} cast={false} />
      </group>
    </group>
  )
})
