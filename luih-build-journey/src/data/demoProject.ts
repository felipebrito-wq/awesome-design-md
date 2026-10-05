/**
 * Demo project: "Winter Park Modern".
 *
 * Shaped exactly like the normalized domain model so MockBuildertrendService
 * can return it as-is. Swap for BuildertrendAPIService without touching UI.
 * Demo clock ("today") is Mar 20, 2026 — mid Rough-Ins.
 */
import type {
  Approval,
  ChecklistItem,
  ComponentRecord,
  Inspection,
  Milestone,
  Photo,
  Project,
  ProjectDocument,
  Stage,
  SystemKey,
  Task,
} from '@/domain/types'

const CITY = 'City of Winter Park'
const TODAY = '2026-03-20'

type TaskOpts = {
  trade?: string
  system?: SystemKey
  discipline?: string
  checklist?: string[]
  inspections?: Inspection[]
  homeownerVisible?: boolean
}

function mkChecklist(id: string, labels: string[] = [], doneRatio: number): ChecklistItem[] {
  const n = Math.round(labels.length * doneRatio)
  return labels.map((label, i) => ({ id: `${id}-c${i}`, label, done: i < n }))
}

/** Completed task (actuals default to plan). */
function done(id: string, name: string, s: string, e: string, o: TaskOpts = {}, actual?: [string, string]): Task {
  return {
    id,
    milestoneId: '',
    name,
    tradeId: o.trade,
    system: o.system,
    discipline: o.discipline,
    plannedStart: s,
    plannedEnd: e,
    actualStart: actual?.[0] ?? s,
    actualEnd: actual?.[1] ?? e,
    delayDays: 0,
    status: 'complete',
    percentComplete: 1,
    checklist: mkChecklist(id, o.checklist, 1),
    inspections: (o.inspections ?? []).map((x) => ({ ...x, taskId: id })),
    homeownerVisible: o.homeownerVisible ?? true,
  }
}

function wip(id: string, name: string, s: string, e: string, pct: number, o: TaskOpts = {}, actualStart = s): Task {
  return {
    ...done(id, name, s, e, o),
    actualStart,
    actualEnd: undefined,
    status: 'in_progress',
    percentComplete: pct,
    checklist: mkChecklist(id, o.checklist, pct),
  }
}

function todo(id: string, name: string, s: string, e: string, o: TaskOpts = {}): Task {
  return {
    ...done(id, name, s, e, o),
    actualStart: undefined,
    actualEnd: undefined,
    status: 'not_started',
    percentComplete: 0,
    checklist: mkChecklist(id, o.checklist, 0),
  }
}

const insp = (
  id: string,
  name: string,
  scheduledDate: string,
  result: Inspection['result'],
  extra: Partial<Inspection> = {},
): Inspection => ({
  id,
  taskId: '',
  name,
  authority: CITY,
  scheduledDate,
  result,
  resultDate: result === 'passed' ? scheduledDate : undefined,
  inspector: result === 'passed' ? 'R. Alvarez' : undefined,
  ...extra,
})

const appr = (id: string, name: string, dueDate: string, status: Approval['status'], decidedDate?: string): Approval => ({
  id,
  name,
  requestedOf: 'homeowner',
  status,
  dueDate,
  decidedDate,
  homeownerVisible: true,
})

function ms(id: string, stageId: string, name: string, plannedDate: string, tasks: Task[], approvals: Approval[] = []): Milestone {
  return { id, stageId, name, plannedDate, homeownerVisible: true, tasks: tasks.map((t) => ({ ...t, milestoneId: id })), approvals }
}

// ---------------------------------------------------------------------------

const stages: Stage[] = [
  {
    id: 'stg-site',
    code: '01',
    name: 'Site Prep',
    shortName: 'Site Prep',
    order: 1,
    story: 'Your lot is surveyed, cleared and raised onto a compacted building pad.',
    cameraPreset: 'site',
    milestones: [
      ms('m-mobilize', 'stg-site', 'Permits & Mobilization', '2026-01-08', [
        done('t-survey', 'Permit posted & survey staking', '2026-01-05', '2026-01-06', {
          trade: 'tp-survey',
          checklist: ['Building permit posted', 'Corners staked', 'Setbacks verified'],
        }),
        done('t-fence', 'Silt fence & construction fence', '2026-01-06', '2026-01-07', {
          trade: 'tp-site',
          checklist: ['Silt fence installed', 'Privacy screen installed', 'Construction entrance'],
        }),
        done('t-temp', 'Temporary power & sanitation', '2026-01-07', '2026-01-08', {
          trade: 'tp-electric',
          checklist: ['Temp pole set', 'Utility energized', 'Sanitation & dumpster delivered'],
        }),
      ]),
      ms('m-grading', 'stg-site', 'Clearing & Grading', '2026-01-16', [
        done('t-clearing', 'Lot clearing', '2026-01-08', '2026-01-09', { trade: 'tp-site', checklist: ['Tree protection', 'Clear & grub'] }),
        done('t-pad', 'Fill & building pad', '2026-01-12', '2026-01-14', {
          trade: 'tp-site',
          checklist: ['Fill delivered', 'Pad shaped to grade', 'Elevation certificate shot'],
        }),
        done('t-compaction', 'Compaction & density test', '2026-01-15', '2026-01-16', {
          trade: 'tp-site',
          checklist: ['Proctor test', 'Density tests at 4 locations'],
          inspections: [insp('i-compaction', 'Soil Compaction Test', '2026-01-16', 'passed', { authority: 'Universal Engineering' })],
        }),
      ]),
    ],
  },
  {
    id: 'stg-foundation',
    code: '02',
    name: 'Foundation',
    shortName: 'Foundation',
    order: 2,
    story: 'Footings, under-slab plumbing and a monolithic slab — the base of everything.',
    cameraPreset: 'foundation',
    milestones: [
      ms('m-footings', 'stg-foundation', 'Footings', '2026-01-23', [
        done('t-footing-dig', 'Footing excavation', '2026-01-19', '2026-01-20', { trade: 'tp-concrete', checklist: ['Layout verified', 'Trenches dug to depth'] }),
        done('t-footing-pour', 'Footing steel & pour', '2026-01-21', '2026-01-23', {
          trade: 'tp-concrete',
          checklist: ['Rebar placed', 'Footing inspection', 'Concrete poured'],
          inspections: [insp('i-footing', 'Footing Inspection', '2026-01-21', 'passed')],
        }),
      ]),
      ms('m-underground', 'stg-foundation', 'Underground Utilities', '2026-01-29', [
        done('t-underground', 'Underground plumbing', '2026-01-26', '2026-01-28', {
          trade: 'tp-plumbing',
          system: 'drain',
          checklist: ['Sewer lateral', 'Under-slab drains', 'Water test'],
          inspections: [insp('i-underground', 'Underground Plumbing', '2026-01-28', 'passed')],
        }),
        done('t-vapor', 'Termite pretreat & vapor barrier', '2026-01-29', '2026-01-29', { trade: 'tp-concrete', checklist: ['Termite pretreat cert.', '10-mil vapor barrier'] }),
      ]),
      ms('m-slab', 'stg-foundation', 'Slab', '2026-02-06', [
        done('t-slab-steel', 'Slab reinforcement', '2026-02-02', '2026-02-03', {
          trade: 'tp-concrete',
          checklist: ['Wire mesh & chairs', 'Pre-slab inspection'],
          inspections: [insp('i-preslab', 'Pre-Slab Inspection', '2026-02-03', 'passed')],
        }),
        done('t-slab-pour', 'Slab pour & cure', '2026-02-04', '2026-02-06', { trade: 'tp-concrete', checklist: ['Pour', 'Finish', 'Cure'] }),
      ]),
    ],
  },
  {
    id: 'stg-framing',
    code: '03',
    name: 'Framing',
    shortName: 'Framing',
    order: 3,
    story: 'Masonry walls, the second floor and the roof structure define your home’s shape.',
    cameraPreset: 'framing',
    milestones: [
      ms('m-masonry', 'stg-framing', 'First-Floor Masonry', '2026-02-19', [
        done('t-cmu', 'CMU block walls', '2026-02-09', '2026-02-17', {
          trade: 'tp-masonry',
          system: 'structure',
          checklist: ['Layout', 'Block to lintel height', 'Cells grouted'],
        }),
        done('t-tiebeam', 'Tie beam pour', '2026-02-18', '2026-02-19', {
          trade: 'tp-masonry',
          system: 'structure',
          checklist: ['Tie beam steel', 'Inspection', 'Pour'],
          inspections: [insp('i-tiebeam', 'Tie Beam / Lintel', '2026-02-18', 'passed')],
        }),
      ]),
      ms('m-frame', 'stg-framing', 'Second-Floor Framing', '2026-03-03', [
        done('t-floor-trusses', 'Floor trusses & subfloor', '2026-02-20', '2026-02-24', { trade: 'tp-framing', system: 'structure', checklist: ['Trusses set', 'Subfloor glued & nailed'] }),
        done('t-walls-f2', 'Second-floor walls', '2026-02-25', '2026-03-02', { trade: 'tp-framing', system: 'structure', checklist: ['Exterior walls', 'Headers', 'Straps & hold-downs'] }),
        done('t-partitions', 'Interior partitions', '2026-02-26', '2026-03-03', { trade: 'tp-framing', system: 'structure', checklist: ['First floor', 'Second floor'] }),
      ]),
      ms('m-dryin', 'stg-framing', 'Roof Structure & Dry-In', '2026-03-06', [
        done('t-roof-trusses', 'Roof trusses', '2026-03-02', '2026-03-04', { trade: 'tp-framing', system: 'structure', checklist: ['Trusses set', 'Bracing', 'Hurricane straps'] }),
        done('t-dryin', 'Sheathing & dry-in', '2026-03-04', '2026-03-06', {
          trade: 'tp-framing',
          system: 'structure',
          checklist: ['Wall sheathing', 'Roof deck', 'Underlayment'],
          inspections: [insp('i-sheathing', 'Sheathing / Nailing', '2026-03-05', 'passed')],
        }),
      ]),
    ],
  },
  {
    id: 'stg-roughins',
    code: '04',
    name: 'Rough-Ins / MEP',
    shortName: 'Rough-Ins',
    order: 4,
    story: 'Plumbing, HVAC, electrical and low-voltage systems are run through the open walls.',
    cameraPreset: 'roughins',
    milestones: [
      ms('m-plumbing', 'stg-roughins', 'Plumbing Rough-In', '2026-03-13', [
        done('t-plb-supply', 'Water supply top-out', '2026-03-02', '2026-03-10', {
          trade: 'tp-plumbing',
          system: 'plumbing',
          discipline: 'Plumbing',
          checklist: ['PEX manifold', 'Supply lines to fixtures', 'Pressure test'],
          inspections: [insp('i-plumbing', 'Plumbing Rough-In', '2026-03-13', 'passed')],
        }),
        done('t-plb-dwv', 'Drain, waste & vent', '2026-03-03', '2026-03-11', {
          trade: 'tp-plumbing',
          system: 'drain',
          discipline: 'Plumbing',
          checklist: ['Stacks', 'Horizontal drains', 'Roof vents', 'Water test'],
        }),
      ]),
      ms('m-mechanical', 'stg-roughins', 'Mechanical Rough-In', '2026-03-27', [
        done('t-hvac-f1', 'HVAC first-floor supply', '2026-03-05', '2026-03-12', {
          trade: 'tp-hvac',
          system: 'hvac',
          discipline: 'Mechanical',
          checklist: ['Trunk lines', 'Branch runs', 'Boots & registers', 'Mastic sealed'],
          inspections: [insp('i-hvac-f1', 'Mechanical Rough — 1st Floor', '2026-03-13', 'passed')],
        }),
        wip('t-hvac-f2', 'HVAC second floor & attic', '2026-03-13', '2026-03-24', 0.82, {
          trade: 'tp-hvac',
          system: 'hvac',
          discipline: 'Mechanical',
          checklist: ['Attic trunk', 'Branch runs', 'Return plenum', 'Mastic sealed'],
        }),
        todo('t-hvac-equip', 'HVAC equipment set', '2026-03-24', '2026-03-25', {
          trade: 'tp-hvac',
          system: 'hvac',
          discipline: 'Mechanical',
          checklist: ['Condenser pads', 'Condensers set', 'Air handlers set', 'Line sets'],
          inspections: [insp('i-mech', 'Mechanical Rough — Final', '2026-03-30', 'scheduled')],
        }),
      ]),
      ms('m-electrical', 'stg-roughins', 'Electrical Rough-In', '2026-03-31', [
        done('t-elec-f1', 'Electrical rough — first floor', '2026-03-09', '2026-03-18', {
          trade: 'tp-electric',
          system: 'electrical',
          discipline: 'Electrical',
          checklist: ['Boxes set', 'Home runs pulled', 'Kitchen circuits'],
        }),
        wip('t-elec-f2', 'Electrical rough — second floor', '2026-03-16', '2026-03-27', 0.55, {
          trade: 'tp-electric',
          system: 'electrical',
          discipline: 'Electrical',
          checklist: ['Boxes set', 'Home runs pulled', 'Bath fans wired', 'Smoke detectors'],
        }),
        todo('t-elec-service', 'Service panel & meter', '2026-03-26', '2026-03-31', {
          trade: 'tp-electric',
          system: 'electrical',
          discipline: 'Electrical',
          checklist: ['Meter can', 'Main panel', 'Grounding electrode'],
          inspections: [insp('i-elec', 'Electrical Rough-In', '2026-04-01', 'scheduled')],
        }),
      ]),
      ms('m-lowvoltage', 'stg-roughins', 'Low Voltage', '2026-04-03', [
        wip('t-lv-wiring', 'Structured wiring', '2026-03-18', '2026-04-01', 0.3, {
          trade: 'tp-av',
          system: 'lowvoltage',
          discipline: 'Low Voltage',
          checklist: ['Media panel', 'Cat6 to rooms', 'Coax', 'Wi-Fi AP drops'],
        }),
        todo('t-lv-av', 'Security & AV pre-wire', '2026-03-26', '2026-04-03', {
          trade: 'tp-av',
          system: 'lowvoltage',
          discipline: 'Low Voltage',
          checklist: ['Camera locations', 'Speaker brackets', 'Door contacts'],
        }),
      ]),
      ms(
        'm-4way',
        'stg-roughins',
        'Framing Inspection',
        '2026-04-03',
        [
          todo('t-4way', '4-way framing inspection', '2026-04-02', '2026-04-03', {
            trade: 'tp-framing',
            discipline: 'Inspections',
            checklist: ['Pre-inspection walk', 'Punch corrections'],
            inspections: [insp('i-4way', 'Framing (4-Way)', '2026-04-03', 'scheduled')],
          }),
        ],
        [appr('a-cabinet', 'Kitchen cabinetry shop drawings', '2026-03-27', 'pending')],
      ),
    ],
  },
  {
    id: 'stg-finishes',
    code: '05',
    name: 'Interior + Exterior Finishes',
    shortName: 'Finishes',
    order: 5,
    story: 'Windows, stucco, drywall, floors and cabinetry turn the structure into your home.',
    cameraPreset: 'finishes',
    milestones: [
      ms(
        'm-envelope',
        'stg-finishes',
        'Exterior Envelope',
        '2026-05-08',
        [
          todo('t-windows', 'Windows & exterior doors', '2026-04-06', '2026-04-14', {
            trade: 'tp-windows',
            discipline: 'Exterior',
            checklist: ['Openings flashed', 'Windows set', 'Sliders set', 'Entry door'],
          }),
          todo('t-roofing', 'Roof membrane & metal', '2026-04-08', '2026-04-17', { trade: 'tp-roofing', discipline: 'Exterior', checklist: ['Membrane', 'Coping & fascia', 'Final roof inspection'] }),
          todo('t-lath', 'Waterproofing & lath', '2026-04-15', '2026-04-21', {
            trade: 'tp-stucco',
            discipline: 'Exterior',
            checklist: ['Weather barrier', 'Lath'],
            inspections: [insp('i-lath', 'Lath Inspection', '2026-04-21', 'scheduled')],
          }),
          todo('t-stucco', 'Stucco & wood cladding', '2026-04-22', '2026-05-08', { trade: 'tp-stucco', discipline: 'Exterior', checklist: ['Scratch coat', 'Brown coat', 'Finish coat', 'Wood cladding'] }),
        ],
        [appr('a-exterior', 'Exterior color & stucco finish', '2026-02-10', 'approved', '2026-02-09'), appr('a-windows', 'Window package & glass tint', '2026-01-30', 'approved', '2026-01-28')],
      ),
      ms('m-drywall', 'stg-finishes', 'Insulation & Drywall', '2026-05-15', [
        todo('t-insulation', 'Insulation', '2026-04-20', '2026-04-24', {
          trade: 'tp-insulation',
          discipline: 'Interior',
          checklist: ['Wall foam', 'Roof deck foam'],
          inspections: [insp('i-insulation', 'Insulation Inspection', '2026-04-24', 'scheduled')],
        }),
        todo('t-drywall', 'Drywall hang & finish', '2026-04-27', '2026-05-15', { trade: 'tp-drywall', discipline: 'Interior', checklist: ['Hang', 'Tape', 'Level 5 finish'] }),
      ]),
      ms(
        'm-interior',
        'stg-finishes',
        'Interior Finishes',
        '2026-07-10',
        [
          todo('t-flooring', 'Flooring', '2026-05-18', '2026-06-05', { trade: 'tp-flooring', discipline: 'Interior', checklist: ['Porcelain — first floor', 'White oak — second floor'] }),
          todo('t-cabinets', 'Cabinetry', '2026-06-01', '2026-06-12', { trade: 'tp-millwork', discipline: 'Interior', checklist: ['Kitchen', 'Baths', 'Laundry'] }),
          todo('t-paint', 'Interior paint', '2026-06-08', '2026-06-26', { trade: 'tp-paint', discipline: 'Interior', checklist: ['Prime', 'Walls', 'Trim'] }),
          todo('t-counters', 'Countertops', '2026-06-15', '2026-06-19', { trade: 'tp-stone', discipline: 'Interior', checklist: ['Template', 'Install', 'Seal'] }),
          todo('t-fixtures', 'Plumbing fixtures', '2026-06-22', '2026-07-02', { trade: 'tp-plumbing', discipline: 'Interior', checklist: ['Kitchen', 'Baths', 'Water heater'] }),
          todo('t-lighting', 'Lighting & electrical trim', '2026-06-29', '2026-07-10', { trade: 'tp-electric', discipline: 'Interior', checklist: ['Fixtures', 'Devices', 'Panel trim'] }),
          todo('t-garage-doors', 'Garage doors', '2026-07-06', '2026-07-08', { trade: 'tp-windows', discipline: 'Exterior', checklist: ['Doors', 'Openers'] }),
        ],
        [appr('a-tile', 'Primary bath tile selection', '2026-04-03', 'pending'), appr('a-lighting', 'Lighting plan walkthrough', '2026-04-10', 'pending')],
      ),
    ],
  },
  {
    id: 'stg-complete',
    code: '06',
    name: 'Final Walkthrough / Completed Home',
    shortName: 'Complete',
    order: 6,
    story: 'Pool, driveway, landscape and lighting complete the residence — then it’s yours.',
    cameraPreset: 'complete',
    milestones: [
      ms(
        'm-pool',
        'stg-complete',
        'Pool',
        '2026-08-07',
        [
          todo('t-pool-shell', 'Pool excavation & shell', '2026-07-13', '2026-07-24', {
            trade: 'tp-pool',
            discipline: 'Pool',
            checklist: ['Layout', 'Excavation', 'Steel', 'Shotcrete'],
            inspections: [insp('i-pool-steel', 'Pool Steel', '2026-07-16', 'scheduled')],
          }),
          todo('t-pool-finish', 'Tile, coping & plaster', '2026-07-27', '2026-08-07', { trade: 'tp-pool', discipline: 'Pool', checklist: ['Waterline tile', 'Coping', 'Plaster', 'Fill & start-up'] }),
        ],
        [appr('a-pool', 'Pool finish & tile', '2026-05-15', 'approved', '2026-03-02')],
      ),
      ms('m-hardscape', 'stg-complete', 'Driveway & Hardscape', '2026-08-14', [
        todo('t-driveway', 'Driveway & walks', '2026-07-27', '2026-08-07', { trade: 'tp-paver', discipline: 'Hardscape', checklist: ['Base', 'Pavers', 'Sand & seal'] }),
        todo('t-pool-deck', 'Pool deck & lanai', '2026-08-10', '2026-08-14', { trade: 'tp-paver', discipline: 'Hardscape', checklist: ['Base', 'Shellstone pavers'] }),
      ]),
      ms('m-landscape', 'stg-complete', 'Landscape & Lighting', '2026-09-01', [
        todo('t-sod', 'Irrigation & sod', '2026-08-17', '2026-08-21', { trade: 'tp-landscape', discipline: 'Landscape', checklist: ['Irrigation', 'Sod'] }),
        todo('t-planting', 'Palms & planting', '2026-08-19', '2026-08-28', { trade: 'tp-landscape', discipline: 'Landscape', checklist: ['Specimen palms', 'Hedges', 'Beds'] }),
        todo('t-landscape-lighting', 'Landscape lighting', '2026-08-26', '2026-09-01', { trade: 'tp-electric', discipline: 'Landscape', checklist: ['Uplights', 'Path lights', 'Pool light'] }),
      ]),
      ms('m-final', 'stg-complete', 'Final Inspections & Handover', '2026-09-11', [
        todo('t-final-insp', 'Final inspections & CO', '2026-09-01', '2026-09-04', {
          trade: 'tp-framing',
          discipline: 'Closeout',
          checklist: ['Final electrical', 'Final plumbing', 'Final mechanical', 'Final building'],
          inspections: [insp('i-co', 'Certificate of Occupancy', '2026-09-04', 'scheduled')],
        }),
        todo('t-demob', 'Final clean & demobilization', '2026-09-02', '2026-09-04', { trade: 'tp-site', discipline: 'Closeout', checklist: ['Temp facilities removed', 'Final clean'] }),
        todo('t-walkthrough', 'Homeowner walkthrough', '2026-09-08', '2026-09-09', { discipline: 'Closeout', checklist: ['Orientation', 'Punch list captured'] }),
        todo('t-handover', 'Key handover', '2026-09-11', '2026-09-11', { discipline: 'Closeout', checklist: ['Warranty binder', 'Keys'] }),
      ]),
    ],
  },
]

const components: ComponentRecord[] = [
  // Site
  { id: 'c-survey', name: 'Survey Stakes & Permit Board', layer: 'site.temp', taskId: 't-survey', location: 'Lot' },
  { id: 'c-fence', name: 'Construction Fence', layer: 'site.temp', taskId: 't-fence', location: 'Lot perimeter' },
  { id: 'c-temp', name: 'Temporary Facilities', layer: 'site.temp', taskId: 't-temp', location: 'Front yard', specs: { Power: '200A temp service' } },
  { id: 'c-clearing', name: 'Existing Vegetation', layer: 'site.existing', taskId: 't-clearing', location: 'Lot' },
  { id: 'c-pad', name: 'Building Pad', layer: 'site.terrain', taskId: 't-pad', location: 'Lot', specs: { Fill: '410 cy clean fill', Compaction: '98% modified proctor' } },
  // Foundation
  { id: 'c-trenches', name: 'Footing Trenches', layer: 'site.excavation', taskId: 't-footing-dig', location: 'Perimeter' },
  { id: 'c-footings', name: 'Continuous Footings', layer: 'foundation.footings', system: 'structure', taskId: 't-footing-pour', location: 'Perimeter', specs: { Size: '20" × 12"', Concrete: '3,000 psi' } },
  { id: 'c-underground', name: 'Underground Plumbing', layer: 'foundation.underground', system: 'drain', taskId: 't-underground', location: 'Under slab', specs: { Pipe: '4" / 3" PVC DWV' } },
  { id: 'c-vapor', name: 'Vapor Barrier', layer: 'foundation.vapor', taskId: 't-vapor', location: 'Under slab', specs: { Material: '10-mil poly' } },
  { id: 'c-rebar', name: 'Slab Reinforcement', layer: 'foundation.rebar', system: 'structure', taskId: 't-slab-steel', location: 'Slab' },
  { id: 'c-slab', name: 'Monolithic Slab', layer: 'foundation.slab', system: 'structure', taskId: 't-slab-pour', location: 'Whole house', specs: { Thickness: '4"', Concrete: '3,000 psi' } },
  // Structure
  { id: 'c-cmu', name: 'First-Floor CMU Walls', layer: 'structure.masonry', system: 'structure', taskId: 't-cmu', location: 'First floor', specs: { Block: '8" CMU', Cells: 'Grouted @ 4\' o.c.' } },
  { id: 'c-pallets', name: 'Block Delivery', layer: 'site.temp', taskId: 't-cmu', location: 'Driveway' },
  { id: 'c-tiebeam', name: 'Tie Beam', layer: 'structure.masonry', system: 'structure', taskId: 't-tiebeam', location: 'First floor' },
  { id: 'c-floor-system', name: 'Second-Floor Trusses & Subfloor', layer: 'structure.floor2', system: 'structure', taskId: 't-floor-trusses', location: 'Second floor', specs: { Trusses: '16" open-web floor trusses' } },
  { id: 'c-walls-f2', name: 'Second-Floor Walls', layer: 'structure.floor2', system: 'structure', taskId: 't-walls-f2', location: 'Second floor', specs: { Studs: '2×6 @ 16" o.c.' } },
  { id: 'c-partitions', name: 'Interior Partitions', layer: 'structure.floor1', system: 'structure', taskId: 't-partitions', location: 'Throughout' },
  { id: 'c-roof-trusses', name: 'Roof Trusses', layer: 'structure.roof', system: 'structure', taskId: 't-roof-trusses', location: 'Roof', specs: { Type: 'Flat parallel-chord', Uplift: 'Simpson H2.5A' } },
  { id: 'c-sheathing', name: 'Sheathing & Roof Deck', layer: 'structure.sheathing', system: 'structure', taskId: 't-dryin', location: 'Second floor & roof' },
  // MEP
  { id: 'c-plb-supply', name: 'Plumbing — Water Supply', layer: 'mep.plumbing-supply', system: 'plumbing', taskId: 't-plb-supply', location: 'Throughout', specs: { Pipe: 'PEX-A, home-run manifold' } },
  { id: 'c-plb-dwv', name: 'Plumbing — Drain & Vent', layer: 'mep.plumbing-drain', system: 'drain', taskId: 't-plb-dwv', location: 'Stacks & second floor' },
  { id: 'c-hvac-f1', name: 'HVAC — First Floor Supply', layer: 'mep.hvac-ducts', system: 'hvac', taskId: 't-hvac-f1', location: 'First floor ceiling', specs: { Trunk: 'R-8 sheet metal', Branches: 'R-8 flex' } },
  { id: 'c-hvac-f2', name: 'HVAC — Second Floor & Attic', layer: 'mep.hvac-ducts', system: 'hvac', taskId: 't-hvac-f2', location: 'Attic' },
  { id: 'c-hvac-equip', name: 'HVAC Equipment', layer: 'mep.hvac-equipment', system: 'hvac', taskId: 't-hvac-equip', location: 'Side yard & attic', specs: { Condensers: '2 × 4-ton, 18 SEER2' } },
  { id: 'c-elec-f1', name: 'Electrical — First Floor', layer: 'mep.electrical', system: 'electrical', taskId: 't-elec-f1', location: 'First floor' },
  { id: 'c-elec-f2', name: 'Electrical — Second Floor', layer: 'mep.electrical', system: 'electrical', taskId: 't-elec-f2', location: 'Second floor' },
  { id: 'c-elec-service', name: 'Electrical Service & Panel', layer: 'mep.electrical-panel', system: 'electrical', taskId: 't-elec-service', location: 'Garage', specs: { Service: '400A', Panels: '2 × 200A' } },
  { id: 'c-lv', name: 'Structured Wiring', layer: 'mep.low-voltage', system: 'lowvoltage', taskId: 't-lv-wiring', location: 'Throughout', specs: { Cabling: 'Cat6A + RG6' } },
  { id: 'c-lv-av', name: 'Security & AV', layer: 'mep.low-voltage', system: 'lowvoltage', taskId: 't-lv-av', location: 'Throughout' },
  // Envelope
  { id: 'c-windows', name: 'Windows & Sliders', layer: 'envelope.windows', taskId: 't-windows', location: 'Exterior', specs: { Frames: 'Black aluminum, impact-rated', Glass: 'Low-E laminated' } },
  { id: 'c-doors', name: 'Entry Door', layer: 'envelope.doors', taskId: 't-windows', location: 'Entry', specs: { Door: '9\' white-oak pivot' } },
  { id: 'c-roofing', name: 'Roofing', layer: 'envelope.roof', taskId: 't-roofing', location: 'Roof', specs: { Membrane: '60-mil TPO', Fascia: 'Black aluminum' } },
  { id: 'c-lath', name: 'Weather Barrier & Lath', layer: 'envelope.waterproofing', taskId: 't-lath', location: 'Exterior walls' },
  { id: 'c-stucco', name: 'Stucco Facade', layer: 'envelope.cladding', taskId: 't-stucco', location: 'Exterior walls', specs: { Finish: 'Smooth sand, warm white' } },
  { id: 'c-wood-cladding', name: 'Wood Cladding & Soffits', layer: 'envelope.cladding', taskId: 't-stucco', location: 'Entry & soffits', specs: { Species: 'Thermally-modified ash' } },
  { id: 'c-garage-doors', name: 'Garage Doors', layer: 'envelope.doors', taskId: 't-garage-doors', location: 'Garage' },
  // Interior
  { id: 'c-insulation', name: 'Insulation', layer: 'interior.insulation', taskId: 't-insulation', location: 'Walls & roof deck', specs: { Type: 'Open-cell foam, R-21 roof' } },
  { id: 'c-drywall', name: 'Drywall', layer: 'interior.drywall', taskId: 't-drywall', location: 'Throughout', specs: { Finish: 'Level 5' } },
  { id: 'c-flooring', name: 'Flooring', layer: 'interior.flooring', taskId: 't-flooring', location: 'Throughout', specs: { 'First floor': '24×48 porcelain', 'Second floor': '9" white oak' } },
  { id: 'c-cabinetry', name: 'Cabinetry', layer: 'interior.cabinetry', taskId: 't-cabinets', location: 'Kitchen & baths', specs: { Finish: 'Rift white oak' } },
  { id: 'c-counters', name: 'Countertops', layer: 'interior.countertops', taskId: 't-counters', location: 'Kitchen & baths', specs: { Material: 'Quartzite, 2cm mitered' } },
  { id: 'c-fixtures', name: 'Plumbing Fixtures', layer: 'interior.fixtures', taskId: 't-fixtures', location: 'Kitchen & baths' },
  { id: 'c-lighting', name: 'Interior Lighting', layer: 'interior.lighting', taskId: 't-lighting', location: 'Throughout' },
  // Exterior
  { id: 'c-pool', name: 'Pool Shell', layer: 'exterior.pool', taskId: 't-pool-shell', location: 'Rear yard', specs: { Size: '40\' × 14\'', Type: 'Shotcrete' } },
  { id: 'c-pool-finish', name: 'Pool Finish', layer: 'exterior.pool', taskId: 't-pool-finish', location: 'Rear yard', specs: { Interior: 'Pebble, light grey', Coping: 'Shellstone' } },
  { id: 'c-driveway', name: 'Driveway & Walks', layer: 'exterior.driveway', taskId: 't-driveway', location: 'Front yard', specs: { Pavers: 'Shellstone 24×24' } },
  { id: 'c-pool-deck', name: 'Pool Deck & Lanai', layer: 'exterior.hardscape', taskId: 't-pool-deck', location: 'Rear yard' },
  { id: 'c-sod', name: 'Sod & Irrigation', layer: 'exterior.landscaping', taskId: 't-sod', location: 'Lot', specs: { Sod: 'Zoysia Empire' } },
  { id: 'c-planting', name: 'Palms & Planting', layer: 'exterior.landscaping', taskId: 't-planting', location: 'Lot', specs: { Palms: 'Medjool & Sabal', Hedge: 'Podocarpus' } },
  { id: 'c-ext-lighting', name: 'Landscape Lighting', layer: 'exterior.lighting', taskId: 't-landscape-lighting', location: 'Lot' },
]

const photo = (
  id: string,
  date: string,
  stageId: string,
  taskId: string,
  location: string,
  tradeId: string | undefined,
  caption: string,
  station: string,
): Photo => ({ id, date, stageId, taskId, location, tradeId, caption, station, url: `photos/${id}.jpg`, source: 'placeholder' })

const photos: Photo[] = [
  photo('p01', '2026-01-06', 'stg-site', 't-survey', 'Front of lot', 'tp-survey', 'Permit posted, corners staked', 'street'),
  photo('p02', '2026-01-09', 'stg-site', 't-clearing', 'Lot — aerial', 'tp-site', 'Lot cleared, tree protection in place', 'aerial'),
  photo('p03', '2026-01-14', 'stg-site', 't-pad', 'Building pad', 'tp-site', 'Building pad filled and shaped', 'front-left'),
  photo('p04', '2026-01-16', 'stg-site', 't-compaction', 'Building pad', 'tp-site', 'Pad compacted — density test passed', 'aerial'),
  photo('p05', '2026-01-20', 'stg-foundation', 't-footing-dig', 'Perimeter', 'tp-concrete', 'Footing trenches excavated', 'aerial'),
  photo('p06', '2026-01-23', 'stg-foundation', 't-footing-pour', 'Perimeter', 'tp-concrete', 'Footings poured', 'front-left'),
  photo('p07', '2026-01-28', 'stg-foundation', 't-underground', 'Under slab', 'tp-plumbing', 'Underground plumbing roughed in', 'aerial'),
  photo('p08', '2026-02-03', 'stg-foundation', 't-slab-steel', 'Slab', 'tp-concrete', 'Reinforcement ready for pre-slab inspection', 'front-left'),
  photo('p09', '2026-02-06', 'stg-foundation', 't-slab-pour', 'Slab', 'tp-concrete', 'Slab poured and curing', 'aerial'),
  photo('p10', '2026-02-12', 'stg-framing', 't-cmu', 'Front elevation', 'tp-masonry', 'Block walls rising — first floor', 'street'),
  photo('p11', '2026-02-19', 'stg-framing', 't-tiebeam', 'First floor', 'tp-masonry', 'Tie beam poured', 'front-left'),
  photo('p12', '2026-02-24', 'stg-framing', 't-floor-trusses', 'Second floor', 'tp-framing', 'Second-floor trusses and subfloor', 'aerial'),
  photo('p13', '2026-03-02', 'stg-framing', 't-walls-f2', 'Front elevation', 'tp-framing', 'Second-floor walls framed', 'street'),
  photo('p14', '2026-03-04', 'stg-framing', 't-roof-trusses', 'Rear elevation', 'tp-framing', 'Roof trusses set', 'rear-pool'),
  photo('p15', '2026-03-06', 'stg-framing', 't-dryin', 'Roof', 'tp-framing', 'Dried-in', 'aerial'),
  photo('p16', '2026-03-12', 'stg-roughins', 't-hvac-f1', 'Great Room', 'tp-hvac', 'First-floor HVAC supply installed', 'int-great'),
  photo('p17', '2026-03-14', 'stg-roughins', 't-plb-supply', 'Primary Bathroom', 'tp-plumbing', 'Plumbing Rough-In', 'int-bath'),
  photo('p18', '2026-03-16', 'stg-roughins', 't-elec-f1', 'Garage', 'tp-electric', 'Electrical rough — garage', 'int-garage'),
  photo('p19', '2026-03-18', 'stg-roughins', 't-hvac-f2', 'Rear elevation', 'tp-hvac', 'Great room — rough-ins in progress', 'rear-pool'),
  photo('p20', '2026-03-19', 'stg-roughins', 't-lv-wiring', 'Kitchen', 'tp-av', 'Kitchen — electrical & low-voltage boxes', 'int-great'),
  photo('p21', '2026-03-20', 'stg-roughins', 't-elec-f2', 'Lot — aerial', 'tp-electric', 'Site progress — week 11', 'aerial'),
]

const doc = (id: string, name: string, kind: ProjectDocument['kind'], date: string, stageId: string, internalOnly = false, taskId?: string): ProjectDocument => ({
  id,
  name,
  kind,
  date,
  stageId,
  taskId,
  url: '#',
  internalOnly,
})

const documents: ProjectDocument[] = [
  doc('d01', 'Building Permit BP-26-0142', 'permit', '2026-01-02', 'stg-site'),
  doc('d02', 'Boundary & Topographic Survey', 'plan', '2026-01-06', 'stg-site', false, 't-survey'),
  doc('d03', 'Soil Compaction Report', 'report', '2026-01-16', 'stg-site', true, 't-compaction'),
  doc('d04', 'Architectural Set — Rev 4', 'plan', '2025-12-12', 'stg-foundation'),
  doc('d05', 'Structural Set — Rev 2', 'plan', '2025-12-12', 'stg-foundation', true),
  doc('d06', 'Footing Inspection Report', 'inspection', '2026-01-21', 'stg-foundation', false, 't-footing-pour'),
  doc('d07', 'Termite Pretreat Certificate', 'report', '2026-01-29', 'stg-foundation', false, 't-vapor'),
  doc('d08', 'Truss Engineering Package', 'spec', '2026-02-11', 'stg-framing', true, 't-roof-trusses'),
  doc('d09', 'Tie Beam Inspection', 'inspection', '2026-02-18', 'stg-framing', false, 't-tiebeam'),
  doc('d10', 'Manual J / D Load Calcs', 'spec', '2026-02-20', 'stg-roughins', true, 't-hvac-f1'),
  doc('d11', 'HVAC Rough Inspection — 1st Floor', 'inspection', '2026-03-13', 'stg-roughins', false, 't-hvac-f1'),
  doc('d12', 'Plumbing Riser Diagram', 'plan', '2026-02-25', 'stg-roughins', true, 't-plb-supply'),
  doc('d13', 'Plumbing Rough Inspection', 'inspection', '2026-03-13', 'stg-roughins', false, 't-plb-supply'),
  doc('d14', 'Electrical & Lighting Plan', 'plan', '2026-02-27', 'stg-roughins', false, 't-elec-f1'),
  doc('d15', 'AV & Security Drawings — Rev B', 'plan', '2026-03-10', 'stg-roughins', true, 't-lv-wiring'),
  doc('d16', 'HVAC Equipment Submittal', 'spec', '2026-03-02', 'stg-roughins', true, 't-hvac-f1'),
  doc('d17', 'Window Schedule & Shop Drawings', 'spec', '2026-02-02', 'stg-finishes', false, 't-windows'),
  doc('d18', 'Interior Selections Sheet', 'selection', '2026-03-01', 'stg-finishes'),
  doc('d19', 'Pool Permit & Engineering', 'permit', '2026-03-05', 'stg-complete', false, 't-pool-shell'),
]

export const demoProject: Project = {
  id: 'luih-wpm-014',
  externalId: 'BT-JOB-48213',
  name: 'Winter Park Modern',
  model: 'Residence 014',
  address: 'Winter Park, Florida',
  community: 'Winter Park',
  homeowner: 'The Carter Family',
  startDate: '2026-01-05',
  baselineCompletion: '2026-09-11',
  today: TODAY,
  lastSyncedAt: '2026-03-20T09:12:00Z',
  phases: [
    { id: 'ph-sales', key: 'sales', name: 'Sales', order: 1, stages: [] },
    { id: 'ph-precon', key: 'pre-construction', name: 'Pre-Construction', order: 2, stages: [] },
    { id: 'ph-construction', key: 'construction', name: 'Construction', order: 3, stages },
    { id: 'ph-postcon', key: 'post-construction', name: 'Post-Construction', order: 4, stages: [] },
  ],
  tradePartners: [
    { id: 'tp-survey', name: 'Brightline Surveying', trade: 'Survey', contact: 'Dana Whitfield', phone: '(407) 555-0141' },
    { id: 'tp-site', name: 'Central Florida Sitework', trade: 'Sitework', contact: 'Marco Ruiz', phone: '(407) 555-0102' },
    { id: 'tp-concrete', name: 'Orange County Concrete', trade: 'Concrete', contact: 'Luis Ortega', phone: '(407) 555-0177' },
    { id: 'tp-masonry', name: 'Sunstate Masonry', trade: 'Masonry', contact: 'Andre Baptiste', phone: '(407) 555-0165' },
    { id: 'tp-framing', name: 'Lakeside Framing', trade: 'Framing', contact: 'Kyle Brennan', phone: '(407) 555-0119' },
    { id: 'tp-plumbing', name: 'Bluewater Plumbing', trade: 'Plumbing', contact: 'Ivan Petrov', phone: '(407) 555-0133' },
    { id: 'tp-hvac', name: 'AirPro HVAC', trade: 'HVAC', contact: 'Sam Kessler', phone: '(407) 555-0190' },
    { id: 'tp-electric', name: 'Lumen Electric', trade: 'Electrical', contact: 'Priya Nair', phone: '(407) 555-0158' },
    { id: 'tp-av', name: 'Signal AV & Security', trade: 'Low Voltage', contact: 'Ethan Cole', phone: '(407) 555-0124' },
    { id: 'tp-windows', name: 'Clearview Openings', trade: 'Windows & Doors', contact: 'Hannah Moss', phone: '(407) 555-0181' },
    { id: 'tp-roofing', name: 'Coastline Roofing', trade: 'Roofing', contact: 'Victor Hale', phone: '(407) 555-0146' },
    { id: 'tp-stucco', name: 'Atelier Stucco', trade: 'Stucco', contact: 'Rafael Souza', phone: '(407) 555-0112' },
    { id: 'tp-insulation', name: 'Envirofoam', trade: 'Insulation', contact: 'Grace Lin', phone: '(407) 555-0137' },
    { id: 'tp-drywall', name: 'Prestige Drywall', trade: 'Drywall', contact: 'Tom Becker', phone: '(407) 555-0168' },
    { id: 'tp-flooring', name: 'Stone & Plank', trade: 'Flooring', contact: 'Elena Cruz', phone: '(407) 555-0174' },
    { id: 'tp-millwork', name: 'Millwork Studio', trade: 'Cabinetry', contact: 'Noah Fischer', phone: '(407) 555-0109' },
    { id: 'tp-stone', name: 'Quarry Fabrication', trade: 'Countertops', contact: 'Ava Romano', phone: '(407) 555-0153' },
    { id: 'tp-paint', name: 'Finch Painting', trade: 'Paint', contact: 'Owen Finch', phone: '(407) 555-0129' },
    { id: 'tp-pool', name: 'Blue Lagoon Pools', trade: 'Pool', contact: 'Chris Delgado', phone: '(407) 555-0186' },
    { id: 'tp-paver', name: 'Shellstone Hardscapes', trade: 'Hardscape', contact: 'Mia Torres', phone: '(407) 555-0115' },
    { id: 'tp-landscape', name: 'Verde Landscape Studio', trade: 'Landscape', contact: 'Jonah Reyes', phone: '(407) 555-0162' },
  ],
  photos,
  documents,
  changeOrders: [
    { id: 'co-1', title: 'Upgrade great-room slider to 12\' pocket', amount: 18400, status: 'approved', date: '2026-02-04' },
    { id: 'co-2', title: 'Add summer-kitchen gas line', amount: 3250, status: 'pending', date: '2026-03-16' },
    { id: 'co-3', title: 'Primary closet built-ins', amount: 9800, status: 'draft', date: '2026-03-19' },
  ],
  dailyLogs: [
    { id: 'dl-1', date: '2026-03-18', author: 'J. Mercer (PM)', weather: 'Sunny, 82°F', crew: 9, notes: 'AirPro running attic trunk. Lumen pulling 2nd-floor home runs.' },
    { id: 'dl-2', date: '2026-03-19', author: 'J. Mercer (PM)', weather: 'Partly cloudy, 84°F', crew: 11, notes: 'Signal AV started media panel. Cabinet shop drawings sent to homeowner.' },
    { id: 'dl-3', date: '2026-03-20', author: 'J. Mercer (PM)', weather: 'Sunny, 85°F', crew: 10, notes: 'Mechanical 2nd floor ~80%. Electrical rough inspection booked Apr 1.' },
  ],
  blockers: [
    { id: 'b-1', taskId: 't-lv-wiring', title: 'Awaiting AV drawings Rev C (theater speaker layout)', severity: 'medium', owner: 'Signal AV & Security', openedDate: '2026-03-17' },
  ],
  qualityChecks: [
    { id: 'q-1', taskId: 't-slab-pour', name: 'Slab flatness & elevation', result: 'pass', date: '2026-02-09' },
    { id: 'q-2', taskId: 't-cmu', name: 'Block walls plumb & level', result: 'pass', date: '2026-02-17' },
    { id: 'q-3', taskId: 't-walls-f2', name: 'Window rough openings verified', result: 'pass', date: '2026-03-03' },
    { id: 'q-4', taskId: 't-hvac-f2', name: 'Duct leakage pre-test', result: 'open', date: '2026-03-25' },
    { id: 'q-5', taskId: 't-plb-supply', name: 'Supply pressure test (24h)', result: 'pass', date: '2026-03-11' },
  ],
  components,
  settings: { showFinancials: false },
}
