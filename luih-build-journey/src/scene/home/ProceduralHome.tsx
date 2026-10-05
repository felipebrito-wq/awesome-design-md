import { memo } from 'react'
import { useJourney } from '@/store/useJourney'
import { BuildPart } from './BuildPart'
import { BRYANT_PARTS } from './bryant/bryantSpec'
import { HOUSE_PARTS } from './houseSpec'

const MODELS = { demo: HOUSE_PARTS, bryant: BRYANT_PARTS }

/** Procedural home: the bundled demo house, or a plan-derived real home. */
export const ProceduralHome = memo(function ProceduralHome() {
  const key = useJourney((s) => s.project?.modelKey ?? 'demo') as keyof typeof MODELS
  const parts = MODELS[key] ?? HOUSE_PARTS
  return (
    <group name={`home-${key}`} key={key}>
      {parts.map((p) => (
        <BuildPart key={p.id} spec={p} />
      ))}
    </group>
  )
})
