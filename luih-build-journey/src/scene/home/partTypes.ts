/**
 * A PartSpec is one clickable, schedulable building component rendered as a
 * single InstancedMesh. Procedural geometry and GLB nodes both resolve to the
 * same visual controller (layer + component + task → visibility/animation).
 */
export type V3 = [number, number, number]

export interface Inst {
  p: V3
  s: V3
  q?: [number, number, number, number]
  /** Per-instance tint. */
  c?: string
  /** Stagger group (instances with same g animate together). */
  g?: number
  /** Anchor for 'grow' animation (e.g. palm base). */
  a?: V3
}

export type Geo = 'box' | 'cyl' | 'sphere' | 'cone' | 'disc'

/**
 * rise  – grows along local +Y from its base (walls, studs, pipes)
 * sweep – grows along local +X (courses, ducts, sod rolls, flooring rows)
 * drop  – lowered into place from above (trusses, windows, equipment)
 * grow  – scales up around an anchor (landscaping, furniture)
 * fade  – material fades in (glass, surfaces)
 * pop   – appears instantly when its turn comes
 */
export type Anim = 'rise' | 'sweep' | 'drop' | 'grow' | 'fade' | 'pop'

export interface PartSpec {
  id: string
  componentId: string
  geo: Geo
  mat: string
  inst: Inst[]
  anim: Anim
  /** Task that builds it (defaults to the component's task). */
  appearTask?: string
  /** Task that removes it (temporary items, cleared vegetation). */
  disappearTask?: string
  disappearFade?: boolean
  /** Remap appear progress into a sub-window of the task. */
  window?: [number, number]
  /** Material color shifts as another task progresses (e.g. paint). */
  colorTo?: { task: string; color: string }
  /** Emissive glow tied to a task (lights turning on). */
  glow?: { task: string; color: string; intensity: number }
  dropH?: number
  overlap?: number
  castShadow?: boolean
  receiveShadow?: boolean
  /** Not clickable (decorative / ground surfaces). */
  inert?: boolean
}
