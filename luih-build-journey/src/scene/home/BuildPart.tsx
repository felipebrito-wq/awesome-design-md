import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clamp01 } from '@/lib/dates'
import { sceneFlags } from '@/lib/capture'
import { journey } from '@/store/useJourney'
import { GHOST_MATERIAL, makeMaterial } from './materials'
import type { Anim, Geo, Inst, PartSpec } from './partTypes'
import { resolveTargets, type PartMeta } from './partState'

export const GEOMETRIES: Record<Geo, THREE.BufferGeometry> = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  sphere: new THREE.SphereGeometry(0.5, 16, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 10),
  disc: new THREE.CylinderGeometry(0.5, 0.5, 1, 20),
}

const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const _p = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _s = new THREE.Vector3()
const _a = new THREE.Vector3()
const _off = new THREE.Vector3()
const _c = new THREE.Color()

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutBack = (t: number) => {
  const c1 = 1.2
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function compose(inst: Inst, anim: Anim, lp: number, ld: number, dropH: number, out: THREE.Matrix4) {
  if (lp <= 0.0005 || ld >= 0.9995) return out.copy(ZERO)
  _p.fromArray(inst.p)
  if (inst.q) _q.fromArray(inst.q)
  else _q.identity()
  _s.fromArray(inst.s)
  const e = easeOut(clamp01(lp))
  switch (anim) {
    case 'rise': {
      const k = Math.max(e, 0.002)
      _off.set(0, (-_s.y * (1 - k)) / 2, 0).applyQuaternion(_q)
      _p.add(_off)
      _s.y *= k
      break
    }
    case 'sweep': {
      const k = Math.max(e, 0.002)
      if (inst.q || _s.x >= _s.z) {
        _off.set((-_s.x * (1 - k)) / 2, 0, 0).applyQuaternion(_q)
        _s.x *= k
      } else {
        _off.set(0, 0, (-_s.z * (1 - k)) / 2)
        _s.z *= k
      }
      _p.add(_off)
      break
    }
    case 'drop':
      _p.y += (1 - e) * dropH
      break
    case 'grow': {
      const k = Math.max(easeOutBack(clamp01(lp)), 0.001)
      if (inst.a) {
        _a.fromArray(inst.a)
        _p.sub(_a).multiplyScalar(k).add(_a)
      }
      _s.multiplyScalar(k)
      break
    }
    default:
      break
  }
  if (ld > 0) {
    const k = Math.max(1 - easeOut(ld), 0.001)
    if (inst.a) {
      _a.fromArray(inst.a)
      _p.sub(_a).multiplyScalar(k).add(_a)
    }
    _s.multiplyScalar(k)
  }
  return out.compose(_p, _q, _s)
}

const stagger = (p: number, r: number, R: number, w: number) => {
  if (R <= 1) return p
  const start = (r / (R - 1)) * (1 - w)
  return clamp01((p - start) / w)
}

const noRaycast = () => undefined

export function BuildPart({ spec }: { spec: PartSpec }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const ghostRef = useRef<THREE.InstancedMesh>(null)
  const material = useMemo(() => makeMaterial(spec.mat), [spec.mat])
  const geometry = GEOMETRIES[spec.geo]
  const n = spec.inst.length

  const prep = useMemo(() => {
    const keys = spec.inst.map((x, i) => x.g ?? i)
    const uniq = [...new Set(keys)].sort((a, b) => a - b)
    const rankOf = new Map(uniq.map((k, i) => [k, i]))
    const ranks = keys.map((k) => rankOf.get(k)!)
    const R = uniq.length
    const overlap = spec.overlap ?? Math.min(1, Math.max(0.06, 4 / R))
    const hasColor = spec.inst.some((x) => x.c)
    const full = spec.inst.map((x) => compose(x, 'pop', 1, 0, 0, new THREE.Matrix4()))
    return { ranks, R, overlap, hasColor, full }
  }, [spec])

  const meta: PartMeta = useMemo(
    () => ({
      componentId: spec.componentId,
      appearTask: spec.appearTask,
      disappearTask: spec.disappearTask,
      disappearFade: spec.disappearFade,
      window: spec.window,
      colorTo: spec.colorTo,
      glow: spec.glow,
      fade: spec.anim === 'fade',
      baseOpacity: material.userData.baseOpacity as number,
    }),
    [spec, material],
  )

  const st = useRef({ p: -1, d: -1, op: -1, ei: 0, colorT: -1, lastP: -2, lastD: -2, clickable: true, transparent: material.transparent })
  const baseColor = useMemo(() => new THREE.Color(material.userData.baseColor as string), [material])
  const toColor = useMemo(() => (spec.colorTo ? new THREE.Color(spec.colorTo.color) : null), [spec.colorTo])

  useLayoutEffect(() => {
    const mesh = ref.current!
    const ghost = ghostRef.current!
    for (let i = 0; i < n; i++) {
      mesh.setMatrixAt(i, ZERO)
      ghost.setMatrixAt(i, prep.full[i])
    }
    if (prep.hasColor) {
      material.color.set('#ffffff')
      for (let i = 0; i < n; i++) mesh.setColorAt(i, _c.set(spec.inst[i].c ?? (material.userData.baseColor as string)))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    mesh.instanceMatrix.needsUpdate = true
    ghost.instanceMatrix.needsUpdate = true
    // Bounding sphere from the fully-built state (instances start at zero scale).
    ghost.computeBoundingSphere()
    const bs = ghost.boundingSphere!.clone()
    bs.radius += spec.dropH ?? 2.5
    mesh.boundingSphere = bs
    ghost.boundingSphere = bs.clone()
    mesh.userData.componentId = spec.componentId
    st.current.lastP = -2
    st.current.lastD = -2
  }, [n, prep, material, spec])

  useFrame((_, dt) => {
    const mesh = ref.current
    const ghost = ghostRef.current
    if (!mesh || !ghost) return
    const s = journey()
    const t = resolveTargets(meta, s, performance.now())
    if (!t) return
    const S = st.current
    const snap = sceneFlags.snap || S.p < 0
    const k = 1 - Math.exp(-(s.scrubbing ? 14 : 7) * Math.min(dt, 0.1))
    S.p = snap || Math.abs(t.p - S.p) < 1e-4 ? t.p : S.p + (t.p - S.p) * k
    S.d = snap || Math.abs(t.d - S.d) < 1e-4 ? t.d : S.d + (t.d - S.d) * k
    const ko = 1 - Math.exp(-9 * Math.min(dt, 0.1))
    S.op = snap || Math.abs(t.opacity - S.op) < 1e-3 ? t.opacity : S.op + (t.opacity - S.op) * ko
    S.ei = snap ? t.emissiveIntensity : S.ei + (t.emissiveIntensity - S.ei) * ko

    // Geometry (only when progress moves)
    const disappearShrinks = !!spec.disappearTask && !spec.disappearFade
    if (Math.abs(S.p - S.lastP) > 1e-5 || Math.abs(S.d - S.lastD) > 1e-5) {
      const m = new THREE.Matrix4()
      for (let i = 0; i < n; i++) {
        const r = prep.ranks[i]
        const lp = stagger(S.p, r, prep.R, prep.overlap)
        const ld = disappearShrinks ? stagger(S.d, r, prep.R, prep.overlap) : 0
        mesh.setMatrixAt(i, compose(spec.inst[i], spec.anim, lp, ld, spec.dropH ?? 2.5, m))
      }
      mesh.instanceMatrix.needsUpdate = true
      S.lastP = S.p
      S.lastD = S.d
    }

    // Material state
    const visible = S.op > 0.008 && S.p > 0.0005 && (disappearShrinks ? S.d < 0.9995 : true)
    mesh.visible = visible
    const transparent = S.op < 0.995
    if (transparent !== S.transparent) {
      material.transparent = transparent
      material.depthWrite = !transparent
      material.needsUpdate = true
      S.transparent = transparent
    }
    material.opacity = S.op
    material.emissive.set(t.emissive)
    material.emissiveIntensity = S.ei
    if (toColor) {
      S.colorT = snap ? t.colorT : S.colorT + (t.colorT - S.colorT) * ko
      material.color.copy(baseColor).lerp(toColor, S.colorT)
    }
    const clickable = !spec.inert && t.clickable && visible
    if (clickable !== S.clickable) {
      mesh.raycast = clickable ? THREE.InstancedMesh.prototype.raycast : noRaycast
      S.clickable = clickable
    }
    ghost.visible = t.ghost
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    journey().hover(spec.componentId)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    if (journey().hoveredComponentId === spec.componentId) journey().hover(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return
    e.stopPropagation()
    journey().select(spec.componentId)
  }

  const cast = spec.castShadow ?? true
  return (
    <group>
      <instancedMesh
        ref={ref}
        args={[geometry, material, n]}
        castShadow={cast}
        receiveShadow={spec.receiveShadow ?? true}
        onPointerOver={spec.inert ? undefined : onOver}
        onPointerOut={spec.inert ? undefined : onOut}
        onClick={spec.inert ? undefined : onClick}
        frustumCulled
      />
      <instancedMesh ref={ghostRef} args={[geometry, GHOST_MATERIAL, n]} visible={false} raycast={noRaycast} renderOrder={5} />
    </group>
  )
}
