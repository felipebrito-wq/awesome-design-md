import { memo, useEffect } from 'react'
import { indexProject } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'
import { BuildPart } from './BuildPart'
import { BRYANT_PARTS } from './bryant/bryantSpec'
import { HOUSE_PARTS } from './houseSpec'

const MODELS = { demo: HOUSE_PARTS, bryant: BRYANT_PARTS }

/** Procedural home: the bundled demo house, or a plan-derived real home. */
export const ProceduralHome = memo(function ProceduralHome() {
  const key = useJourney((s) => s.project?.modelKey ?? 'demo') as keyof typeof MODELS
  const parts = MODELS[key] ?? HOUSE_PARTS
  const project = useJourney((s) => s.project)
  // Dev guard: a part whose schedule task isn't in this project would silently never appear.
  useEffect(() => {
    if (!import.meta.env.DEV || !project) return
    const idx = indexProject(project)
    const comps = new Map(project.components.map((c) => [c.id, c]))
    const missing = new Set<string>()
    for (const p of parts) {
      const tasks = [p.appearTask ?? comps.get(p.componentId)?.taskId, p.disappearTask, p.colorTo?.task, p.glow?.task]
      for (const t of tasks) if (t && t !== '__always' && !idx.taskById.has(t)) missing.add(`${p.id} → ${t}`)
      if (!comps.has(p.componentId)) missing.add(`${p.id} → component ${p.componentId}`)
    }
    if (missing.size) console.warn(`[build-journey] ${missing.size} part references not in this project's schedule:`, [...missing])
  }, [parts, project])
  return (
    <group name={`home-${key}`} key={key}>
      {parts.map((p) => (
        <BuildPart key={p.id} spec={p} />
      ))}
    </group>
  )
})
