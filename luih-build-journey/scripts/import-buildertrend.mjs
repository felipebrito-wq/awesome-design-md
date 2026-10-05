/**
 * Buildertrend → LUIH normalized project.
 *
 *   node scripts/import-buildertrend.mjs private/bt/34200410.json [public/private/project.json]
 *
 * Input: a Buildertrend job export (schedule items from
 * prod_datalake.gold_buildertrend.schedules + job metadata). Output: the
 * normalized Project consumed by the app (same shape as src/data/demoProject.ts).
 *
 * Mapping is RULES, not code paths: LUIH lifecycle phases come from the BT
 * "phase" field, milestones from the item prefix ("Shell:", "Roofing:", ...).
 * Output lands in /public/private (git-ignored) — never commit real project data.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [input, output = 'public/private/project.json'] = process.argv.slice(2)
if (!input) {
  console.error('usage: node scripts/import-buildertrend.mjs <export.json> [out.json]')
  process.exit(1)
}
const src = JSON.parse(readFileSync(input, 'utf8'))
const job = src.job
const TODAY = job.today
const day = (iso) => Math.floor(Date.parse(iso + 'T00:00:00Z') / 86400000)
const iso = (d) => new Date(d * 86400000).toISOString().slice(0, 10)
export const slug = (s) =>
  'bt-' +
  s
    .toLowerCase()
    .replace(/^-last day-\s*/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ---- LUIH lifecycle: BT phase → (LUIH phase, stage) --------------------------------
const STAGES = {
  'Due Diligence': ['sales', 'stg-acquisition'],
  Plans: ['pre-construction', 'stg-design'],
  Permits: ['pre-construction', 'stg-permitting'],
  Foundation: ['construction', 'stg-foundation'],
  Structure: ['construction', 'stg-structure'],
  Drywall: ['construction', 'stg-drywall'],
  Flooring: ['construction', 'stg-flooring'],
  Finishes: ['construction', 'stg-finishes'],
  Completion: ['construction', 'stg-completion'],
  Sales: ['post-construction', 'stg-sales'],
}
const STAGE_META = {
  'stg-acquisition': { name: 'Acquisition & Due Diligence', short: 'Acquisition', story: 'Lot acquired after survey, replat and zoning checks.' },
  'stg-design': { name: 'Design & Engineering', short: 'Design', story: 'Architecture, engineering, interiors and the spec book take shape.' },
  'stg-permitting': { name: 'Permitting', short: 'Permits', story: 'City of Tampa reviews — trees, flood zone and building.' },
  'stg-foundation': { name: 'Foundation', short: 'Foundation', story: 'The home is staked out and raised onto a stem-wall foundation above the flood elevation.', camera: 'foundation' },
  'stg-structure': { name: 'Structure', short: 'Structure', story: 'Two floors of concrete block, trusses, roof, windows — and every system run through the walls.', camera: 'framing' },
  'stg-drywall': { name: 'Drywall & Exterior', short: 'Drywall', story: 'Insulation and drywall close the walls; stucco and siding wrap the outside.', camera: 'roughins' },
  'stg-flooring': { name: 'Interior Finishes', short: 'Interiors', story: 'Cabinetry, tile, trim and paint turn rooms into a home.', camera: 'finishes' },
  'stg-finishes': { name: 'Finishes, Pool & Site', short: 'Finishes', story: 'Pool, pavers, landscape, lighting and appliances complete the picture.', camera: 'complete' },
  'stg-completion': { name: 'Completion & CO', short: 'Completion', story: 'Final inspections, the Certificate of Occupancy and a final clean.', camera: 'complete' },
  'stg-sales': { name: 'Sale & Closing', short: 'Sale', story: 'Staging, listing, buyer walkthrough and closing.' },
}
const PHASES = [
  ['sales', 'Sales', ['stg-acquisition']],
  ['pre-construction', 'Pre-Construction', ['stg-design', 'stg-permitting']],
  ['construction', 'Construction', ['stg-foundation', 'stg-structure', 'stg-drywall', 'stg-flooring', 'stg-finishes', 'stg-completion']],
  ['post-construction', 'Post-Construction', ['stg-sales']],
]

// ---- milestone + discipline rules (first match wins) ----------------------------------
const POOL = /pool|gunite|shotcrete|plaster|waterline|rebar installation|deck construction/i
const RULES = [
  [/inspection|compaction test|qar/i, 'Inspections & QA'],
  [/^(survey: building|supervisor)/i, 'Mobilization & Layout'],
  [/^(plumbing|electric|hvac|gas|low voltage): (underground|sleeve)/i, 'Underground Utilities'],
  [/^(shell|grading|survey)/i, null], // stage-specific below
  [/^(plumbing|electric|hvac|gas|low voltage|water heater)/i, 'MEP'],
  [/^roofing/i, 'Roofing & Dry-In'],
  [/^(windows|doors: (deliver exterior|exterior))/i, 'Windows & Doors'],
  [/^(insulation|drywall)/i, 'Insulation & Drywall'],
  [/^(stucco|siding|paint: exterior|septic|trims: exterior|trim: exterior|trim: soffit|gutters)/i, 'Exterior Finishes'],
  [/^(cabinets|countertops|protection)/i, 'Cabinets & Countertops'],
  [/^(tile|trim|paint|doors|flooring|niche)/i, 'Interior Finishes'],
  [/^(pavers|landscaping|fence|exterior railings|summer kitchen)/i, 'Site & Hardscape'],
  [/^appliances/i, 'Appliances'],
  [/^(cleaning|certificate|mailbox|confirmation)/i, 'Closeout'],
]
function milestoneFor(stageId, name) {
  if (POOL.test(name) && !/permit|engineer/i.test(name)) return 'Pool'
  for (const [re, m] of RULES) {
    if (!re.test(name)) continue
    if (m) return m
    // stage-specific defaults for Shell / Grading / Survey
    if (stageId === 'stg-foundation') return 'Stem Wall & Slab'
    if (stageId === 'stg-structure') return /block|lintel/i.test(name) ? 'Masonry & Lintels' : 'Framing & Trusses'
    return 'Site & Hardscape'
  }
  return { 'stg-structure': 'Framing & Trusses', 'stg-completion': 'Closeout' }[stageId] ?? 'General'
}
const SYSTEM = [
  [/underground plumbing|sleeve plumbing/i, 'drain'],
  [/^plumbing|water heater/i, 'plumbing'],
  [/^hvac/i, 'hvac'],
  [/low voltage/i, 'lowvoltage'],
  [/^electric/i, 'electrical'],
  [/^shell/i, 'structure'],
]
const prefixOf = (n) => (n.includes(':') ? n.split(':')[0].trim() : n.split(' ')[0])
function tradeFor(name) {
  if (/^qar/i.test(name)) return 'tp-luih-qa'
  if (/^inspection|final .* inspection/i.test(name.trim())) return 'tp-city'
  if (POOL.test(name)) return slugTrade('Pool')
  const p = prefixOf(name).replace(/s$/, '')
  for (const k of Object.keys(src.subs)) if (k.toLowerCase().replace(/s$/, '') === p.toLowerCase()) return slugTrade(k)
  if (/septic/i.test(name)) return undefined
  return undefined
}
const slugTrade = (k) => 'tp-' + k.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// ---- build tasks ----------------------------------------------------------------------
const today = day(TODAY)
const stages = {}
const blockers = []
const seen = new Set()
for (const r of src.schedules) {
  const raw = r.item_name.trim()
  if (/^-last day-/i.test(raw)) continue // BT deadline markers, not work
  const map = STAGES[r.phase]
  if (!map) continue
  let stageId = map[1]
  if (r.phase === 'Swimming Pool' || (POOL.test(raw) && map[0] === 'construction')) stageId = 'stg-finishes'
  const id = slug(raw) + (seen.has(slug(raw)) ? '-2' : '')
  seen.add(id)
  const s = day(r.start_date)
  const e = day(r.end_date)
  const preCon = map[0] !== 'construction'
  let status, pct, actualStart, actualEnd
  if (r.item_completed) {
    status = 'complete'
    pct = 1
    actualStart = r.start_date
    actualEnd = preCon && r.completed_on ? r.completed_on : r.end_date
    if (day(actualEnd) < s) actualEnd = r.end_date
  } else if (s > today) {
    status = 'not_started'
    pct = 0
  } else {
    status = 'in_progress'
    actualStart = r.start_date
    pct = Math.max(0.1, Math.min(0.9, (today - s + 1) / (e - s + 1)))
    if (e < today - 7) {
      status = 'blocked'
      pct = 0.9
      blockers.push({
        id: 'b-' + id,
        taskId: id,
        title: `${raw} — past due (${r.end_date}) and still open in Buildertrend`,
        severity: preCon ? 'low' : 'medium',
        owner: preCon ? 'Pre-Construction' : 'Supervision',
        openedDate: r.end_date,
      })
    }
  }
  const isInsp = /inspection|compaction test/i.test(raw)
  const stg = (stages[stageId] ??= { milestones: {} })
  const ms = milestoneFor(stageId, raw)
  const m = (stg.milestones[ms] ??= [])
  m.push({
    id,
    milestoneId: '',
    name: raw.replace(/^(shell|qar inspection):\s*/i, (x) => (/qar/i.test(x) ? 'QA: ' : '')).replace(/\s+/g, ' '),
    tradeId: tradeFor(raw),
    system: SYSTEM.find(([re]) => re.test(raw))?.[1],
    discipline: ms,
    plannedStart: r.start_date,
    plannedEnd: r.end_date,
    actualStart,
    actualEnd,
    delayDays: 0,
    status,
    percentComplete: pct,
    checklist: [],
    inspections: isInsp
      ? [
          {
            id: 'i-' + id,
            taskId: id,
            name: raw.replace(/^(qar inspection|inspection|shell: inspection):\s*/i, '').trim(),
            authority: /qar/i.test(raw) ? 'LUIH Quality (QAR)' : /compaction/i.test(raw) ? 'Geotechnical lab' : 'City of Tampa',
            scheduledDate: r.end_date,
            result: r.item_completed ? 'passed' : 'scheduled',
            resultDate: r.item_completed ? r.end_date : undefined,
          },
        ]
      : [],
    homeownerVisible: !/qar|protection|deliver|trip/i.test(raw),
  })
}

const order = Object.keys(STAGE_META)
const phases = PHASES.map(([key, name, stageIds], pi) => ({
  id: 'ph-' + key,
  key,
  name,
  order: pi + 1,
  stages: stageIds
    .filter((sid) => stages[sid])
    .map((sid, si) => {
      const meta = STAGE_META[sid]
      const msObj = stages[sid].milestones
      const milestones = Object.entries(msObj)
        .map(([mname, tasks]) => {
          const mid = `m-${sid.slice(4)}-${mname.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          tasks.forEach((t) => (t.milestoneId = mid))
          const end = tasks.reduce((a, t) => (t.plannedEnd > a ? t.plannedEnd : a), '')
          const start = tasks.reduce((a, t) => (t.plannedStart < a ? t.plannedStart : a), '9999')
          return { id: mid, stageId: sid, name: mname, plannedDate: end, _start: start, homeownerVisible: mname !== 'Inspections & QA', tasks, approvals: [] }
        })
        .sort((a, b) => (a._start < b._start ? -1 : 1))
        .map(({ _start, ...m }) => m)
      return {
        id: sid,
        code: String(key === 'construction' ? si + 1 : order.indexOf(sid) + 1).padStart(2, '0'),
        name: meta.name,
        shortName: meta.short,
        order: si + 1,
        story: meta.story,
        cameraPreset: meta.camera ?? 'overview',
        milestones,
      }
    }),
}))

// ---- people, docs, drawings, photos ---------------------------------------------------
const tradePartners = [
  { id: 'tp-city', name: 'City of Tampa', trade: 'Inspections', contact: 'Construction Services', phone: '—' },
  { id: 'tp-luih-qa', name: 'LUIH Quality (QAR)', trade: 'Quality assurance', contact: job.supervisor, phone: '—' },
  ...Object.entries(src.subs)
    .filter(([, v]) => v !== '—')
    .map(([k, v]) => ({ id: slugTrade(k), name: v, trade: k, contact: '—', phone: '—' })),
].filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i)

const drawings = [
  ['A-1', 'Site Plan', 'A-1_site-plan.jpg'],
  ['A-3', '1st Level Floor Plan', 'A-3_first-floor.jpg'],
  ['A-4', '2nd Level Floor Plan', 'A-4_second-floor.jpg'],
  ['A-5', 'Front Elevation', 'elev-front.jpg', 'elev-front'],
  ['A-5', 'Right Side Elevation', 'elev-right.jpg', 'elev-right'],
  ['A-6', 'Rear Elevation', 'elev-rear.jpg', 'elev-rear'],
  ['A-6', 'Left Side Elevation', 'elev-left.jpg', 'elev-left'],
].map(([sheet, title, file, station]) => ({ id: 'dw-' + file.replace('.jpg', ''), sheet, title, url: `/private/bryant/plans/${file}`, station, rev: 'R3 · Sealed 03/26/2025' }))

const doc = (id, name, kind, date, stageId, internalOnly = false) => ({ id, name, kind, date, stageId, url: '#', internalOnly })
const documents = [
  doc('d-plans', 'Building Plans — R3 Final, sealed (Carotti Engineering)', 'plan', '2025-03-26', 'stg-permitting'),
  doc('d-permit', `Building Permit ${job.permit}`, 'permit', job.permit_issued, 'stg-permitting'),
  doc('d-noc', 'Notice of Commencement — recorded', 'permit', '2025-08-19', 'stg-foundation'),
  doc('d-arborist', "Arborist's Report & Tree Protection", 'report', '2024-10-24', 'stg-permitting', true),
  doc('d-tree', 'Hazardous Grand Tree Removal — public noticing', 'permit', '2025-03-06', 'stg-permitting', true),
  doc('d-dlr', 'Declaration of Land Restriction (floodplain) — recorded', 'permit', '2025-03-06', 'stg-permitting', true),
  doc('d-ec', 'Under-Construction Elevation Certificate', 'report', '2025-12-10', 'stg-foundation'),
  doc('d-energy', 'Energy Calculations — rev. 2 AC units', 'spec', '2026-07-20', 'stg-structure', true),
  doc('d-plumbing-coc', 'Change of Contractor — Plumbing', 'permit', '2026-03-01', 'stg-structure', true),
  doc('d-spec', 'Spec Book — finishes & selections', 'selection', '2026-02-06', 'stg-flooring'),
  doc('d-3d', '3D Renderings & Sales Moodboard', 'selection', '2026-03-11', 'stg-finishes'),
]

let photos = []
const photoIndex = 'public/private/bryant/photos/index.json'
if (existsSync(photoIndex)) photos = JSON.parse(readFileSync(photoIndex, 'utf8'))

const allTasks = phases.flatMap((p) => p.stages.flatMap((s) => s.milestones.flatMap((m) => m.tasks)))
const project = {
  id: 'bt-' + job.job_id,
  externalId: String(job.job_id),
  modelKey: 'bryant',
  name: job.job_name,
  model: `${job.neighborhood} · ${job.bedrooms} bd · ${job.bathrooms} ba · ${job.living_sqft.toLocaleString()} sq ft`,
  address: job.address,
  community: job.neighborhood,
  homeowner: 'Spec home — listed',
  startDate: allTasks.filter((t) => t.id.startsWith('bt-')).find((t) => /release window|stake out/i.test(t.name))?.plannedStart ?? '2025-08-27',
  baselineCompletion: job.base_co,
  today: TODAY,
  lastSyncedAt: new Date().toISOString(),
  phases,
  tradePartners,
  photos,
  drawings,
  documents,
  changeOrders: src.change_orders.map(([title, amount, date, cat], i) => ({ id: 'co-' + i, title: `${title} (${cat})`, amount, status: 'approved', date })),
  dailyLogs: [],
  blockers,
  qualityChecks: allTasks
    .filter((t) => /^QA:/.test(t.name))
    .map((t, i) => ({ id: 'q-' + i, taskId: t.id, name: t.name.replace('QA: ', ''), result: t.status === 'complete' ? 'pass' : 'open', date: t.plannedEnd })),
  shiftReasons: src.shift_reasons.map(([reason, count, days]) => ({ reason, count, days })),
  facts: [
    ['Permit', job.permit],
    ['Living area', `${job.living_sqft.toLocaleString()} sq ft`],
    ['Lot', `${job.lot_sqft.toLocaleString()} sq ft`],
    ['Bed / Bath', `${job.bedrooms} / ${job.bathrooms}`],
    ['Garage', job.garage],
    ['Construction', job.construction],
    ['Foundation', job.foundation],
    ['Flood zone', job.flood],
  ],
  team: [
    ['Supervisor', job.supervisor],
    ['Area manager', job.area_manager],
    ['Scheduler', job.scheduler],
    ['Architect', job.architect],
    ['Engineer', job.engineer],
    ['Builder of record', job.builder_of_record],
  ],
  expectedCO: job.expected_co,
  components: [], // filled at runtime from the home model's component map
  settings: { showFinancials: false },
}
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, JSON.stringify(project, null, 1))
const count = (st) => allTasks.filter((t) => t.status === st).length
console.log(`✓ ${output}: ${allTasks.length} tasks · ${phases.reduce((a, p) => a + p.stages.length, 0)} stages · complete ${count('complete')} · in progress ${count('in_progress')} · blocked ${count('blocked')} · upcoming ${count('not_started')}`)
if (existsSync('public/private/bryant/photos')) console.log('  photos:', readdirSync('public/private/bryant/photos').length)
