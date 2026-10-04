import { memo } from 'react'
import { BuildPart } from './BuildPart'
import { HOUSE_PARTS } from './houseSpec'

/** Procedural placeholder of the LUIH residence — ~90 schedulable parts. */
export const ProceduralHome = memo(function ProceduralHome() {
  return (
    <group name="luih-home">
      {HOUSE_PARTS.map((p) => (
        <BuildPart key={p.id} spec={p} />
      ))}
    </group>
  )
})
