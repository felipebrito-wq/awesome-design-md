/**
 * GLB adapter. Drop a model at /public/models/home.glb and it replaces the
 * procedural placeholder. Map nodes to components by either:
 *   - glTF extras / Blender custom property:  luih_component = "c-hvac-f1"
 *   - node name prefix:                         "c-hvac-f1__supply_trunk"
 * Optional extras: luih_appear_task, luih_disappear_task.
 * Mapped meshes get the same stage logic (clip-plane "build" reveal, X-Ray,
 * hover/select). Unmapped meshes are treated as always-visible context.
 */
import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { sceneFlags } from '@/lib/capture'
import { journey } from '@/store/useJourney'
import { resolveTargets, type PartMeta } from './partState'

interface Mapped {
  mesh: THREE.Mesh
  meta: PartMeta
  material: THREE.MeshStandardMaterial
  plane: THREE.Plane
  minY: number
  maxY: number
  p: number
  op: number
}

const COMPONENT_RE = /^(c-[a-z0-9-]+?)(?:__|$)/i

export function GlbHome({ url }: { url: string }) {
  const gltf = useGLTF(url, '/draco/')

  const mapped = useMemo(() => {
    const out: Mapped[] = []
    const scene = gltf.scene
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      let node: THREE.Object3D | null = mesh
      let componentId: string | undefined
      let extras: Record<string, string> = {}
      while (node && !componentId) {
        extras = (node.userData ?? {}) as Record<string, string>
        componentId = extras.luih_component ?? node.name.match(COMPONENT_RE)?.[1]
        node = node.parent
      }
      if (!componentId) return
      const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
      const material = src.clone()
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
      material.clippingPlanes = [plane]
      mesh.material = material
      const bb = new THREE.Box3().setFromObject(mesh)
      mesh.userData.componentId = componentId
      out.push({
        mesh,
        material,
        plane,
        minY: bb.min.y,
        maxY: bb.max.y,
        p: -1,
        op: 1,
        meta: {
          componentId,
          appearTask: extras.luih_appear_task,
          disappearTask: extras.luih_disappear_task,
          baseOpacity: material.opacity ?? 1,
        },
      })
    })
    return out
  }, [gltf])

  useFrame((_, dt) => {
    const s = journey()
    const now = performance.now()
    const k = 1 - Math.exp(-7 * Math.min(dt, 0.1))
    for (const m of mapped) {
      const t = resolveTargets(m.meta, s, now)
      if (!t) continue
      const target = t.p * (1 - t.d)
      m.p = sceneFlags.snap || m.p < 0 ? target : m.p + (target - m.p) * k
      m.op = sceneFlags.snap ? t.opacity : m.op + (t.opacity - m.op) * k
      m.plane.constant = m.minY + (m.maxY - m.minY + 0.01) * m.p
      m.mesh.visible = m.p > 0.001 && m.op > 0.01
      const transparent = m.op < 0.995
      if (m.material.transparent !== transparent) {
        m.material.transparent = transparent
        m.material.depthWrite = !transparent
        m.material.needsUpdate = true
      }
      m.material.opacity = m.op
      m.material.emissive?.set(t.emissive)
      m.material.emissiveIntensity = t.emissiveIntensity
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return
    const id = e.object.userData.componentId as string | undefined
    if (!id) return
    e.stopPropagation()
    journey().select(id)
  }
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    const id = e.object.userData.componentId as string | undefined
    if (!id) return
    e.stopPropagation()
    journey().hover(id)
  }

  return <primitive object={gltf.scene} onClick={onClick} onPointerOver={onOver} onPointerOut={() => journey().hover(null)} />
}
