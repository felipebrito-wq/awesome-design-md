import type { LayerGroup, SystemKey } from './types'

/**
 * Semantic construction layers. Geometry (procedural or GLB) is tagged with a
 * layer id; the stage controller and X-Ray resolve visibility per layer.
 */
export interface LayerDef {
  id: string
  group: LayerGroup
  label: string
  system?: SystemKey
}

export const LAYERS: LayerDef[] = [
  { id: 'site.terrain', group: 'SITE', label: 'Terrain & building pad' },
  { id: 'site.excavation', group: 'SITE', label: 'Excavation' },
  { id: 'site.temp', group: 'SITE', label: 'Temporary facilities' },
  { id: 'site.existing', group: 'SITE', label: 'Existing vegetation' },

  { id: 'foundation.footings', group: 'FOUNDATION', label: 'Footings', system: 'structure' },
  { id: 'foundation.underground', group: 'FOUNDATION', label: 'Underground plumbing', system: 'drain' },
  { id: 'foundation.vapor', group: 'FOUNDATION', label: 'Vapor barrier' },
  { id: 'foundation.rebar', group: 'FOUNDATION', label: 'Slab reinforcement', system: 'structure' },
  { id: 'foundation.slab', group: 'FOUNDATION', label: 'Slab', system: 'structure' },

  { id: 'structure.masonry', group: 'STRUCTURE', label: 'First-floor masonry', system: 'structure' },
  { id: 'structure.floor1', group: 'STRUCTURE', label: 'First-floor framing', system: 'structure' },
  { id: 'structure.floor2', group: 'STRUCTURE', label: 'Second-floor framing', system: 'structure' },
  { id: 'structure.roof', group: 'STRUCTURE', label: 'Roof framing', system: 'structure' },
  { id: 'structure.sheathing', group: 'STRUCTURE', label: 'Sheathing', system: 'structure' },

  { id: 'mep.plumbing-supply', group: 'MEP', label: 'Plumbing supply', system: 'plumbing' },
  { id: 'mep.plumbing-drain', group: 'MEP', label: 'Drain / waste / vent', system: 'drain' },
  { id: 'mep.hvac-ducts', group: 'MEP', label: 'HVAC ducts', system: 'hvac' },
  { id: 'mep.hvac-equipment', group: 'MEP', label: 'HVAC equipment', system: 'hvac' },
  { id: 'mep.electrical', group: 'MEP', label: 'Electrical rough', system: 'electrical' },
  { id: 'mep.electrical-panel', group: 'MEP', label: 'Electrical service', system: 'electrical' },
  { id: 'mep.low-voltage', group: 'MEP', label: 'Low voltage', system: 'lowvoltage' },

  { id: 'envelope.roof', group: 'ENVELOPE', label: 'Roofing' },
  { id: 'envelope.windows', group: 'ENVELOPE', label: 'Windows' },
  { id: 'envelope.doors', group: 'ENVELOPE', label: 'Doors' },
  { id: 'envelope.waterproofing', group: 'ENVELOPE', label: 'Waterproofing & lath' },
  { id: 'envelope.cladding', group: 'ENVELOPE', label: 'Stucco & cladding' },

  { id: 'interior.insulation', group: 'INTERIOR', label: 'Insulation' },
  { id: 'interior.drywall', group: 'INTERIOR', label: 'Drywall' },
  { id: 'interior.flooring', group: 'INTERIOR', label: 'Flooring' },
  { id: 'interior.cabinetry', group: 'INTERIOR', label: 'Cabinetry' },
  { id: 'interior.countertops', group: 'INTERIOR', label: 'Countertops' },
  { id: 'interior.fixtures', group: 'INTERIOR', label: 'Fixtures' },
  { id: 'interior.lighting', group: 'INTERIOR', label: 'Lighting' },

  { id: 'exterior.driveway', group: 'EXTERIOR', label: 'Driveway' },
  { id: 'exterior.pool', group: 'EXTERIOR', label: 'Pool' },
  { id: 'exterior.hardscape', group: 'EXTERIOR', label: 'Hardscape' },
  { id: 'exterior.landscaping', group: 'EXTERIOR', label: 'Landscaping' },
  { id: 'exterior.lighting', group: 'EXTERIOR', label: 'Exterior lighting' },
]

export const LAYER_INDEX: Record<string, LayerDef> = Object.fromEntries(LAYERS.map((l) => [l.id, l]))

export interface SystemDef {
  key: SystemKey
  label: string
  color: string
}

/** X-Ray system palette — muted, distinct, architectural. */
export const SYSTEMS: SystemDef[] = [
  { key: 'structure', label: 'Structure', color: '#c9a77c' },
  { key: 'plumbing', label: 'Plumbing', color: '#3f86d6' },
  { key: 'drain', label: 'Drain / Vent', color: '#f4f3ef' },
  { key: 'electrical', label: 'Electrical', color: '#e6bf3c' },
  { key: 'hvac', label: 'HVAC', color: '#b9c0c8' },
  { key: 'lowvoltage', label: 'Low Voltage', color: '#8a6fd1' },
]

export const SYSTEM_INDEX = Object.fromEntries(SYSTEMS.map((s) => [s.key, s])) as Record<SystemKey, SystemDef>

/**
 * X-Ray opacity per layer group. Envelope + finishes fade to ~10–15% so the
 * structure and building systems read through the house.
 */
export const XRAY_OPACITY: Record<LayerGroup, number> = {
  // Finishes nearly vanish so the CMU/tie-beam frame and the systems read without
  // stacks of overlapping translucent skins.
  SITE: 0.3,
  FOUNDATION: 0.24,
  STRUCTURE: 0.2,
  MEP: 1,
  ENVELOPE: 0.045,
  INTERIOR: 0.03,
  EXTERIOR: 0.25,
}
