import { demoProject } from '@/data/demoProject'
import type { Project } from '@/domain/types'
import { BRYANT_COMPONENTS } from '@/scene/home/bryant/bryantSpec'
import type { BuildertrendService } from './BuildertrendService'

const clone = <T,>(x: T): T => structuredClone(x)
const latency = (ms = 120) => new Promise((r) => setTimeout(r, ms))

/** Component maps for the procedural models (a GLB carries its own). */
const MODEL_COMPONENTS: Record<string, Project['components']> = { bryant: BRYANT_COMPONENTS }
/** Model defaults: start the time machine before demolition of the existing home. */
const MODEL_DEFAULTS: Record<string, Partial<Project>> = { bryant: { timelineStart: '2025-07-20' } }

/**
 * Local stand-in for the sync backend. Loads a real, imported Buildertrend
 * job from /private/project.json when present (git-ignored, produced by
 * scripts/import-buildertrend.mjs); otherwise the bundled demo project.
 */
export class MockBuildertrendService implements BuildertrendService {
  private project: Project = clone(demoProject)
  private loaded: Promise<void>

  constructor() {
    // ?project=demo forces the bundled demo house even when a real job is installed (project switching / regression).
    const want = new URLSearchParams(location.search).get('project')
    this.loaded = (want === 'demo' ? Promise.resolve(new Response(null, { status: 404 })) : fetch('private/project.json'))
      .then(async (r) => {
        if (!r.ok) return
        const p = (await r.json()) as Project // non-JSON (SPA fallback) throws -> demo
        // Asset URLs resolve relative to the page so the build runs from any base path
        for (const d of p.drawings ?? []) d.url = d.url.replace(/^\//, '')
        for (const ph of p.photos ?? []) ph.url = ph.url.replace(/^\//, '')
        if (!p.components?.length && p.modelKey && MODEL_COMPONENTS[p.modelKey]) p.components = clone(MODEL_COMPONENTS[p.modelKey])
        Object.assign(p, { ...MODEL_DEFAULTS[p.modelKey ?? ''], ...p })
        // Jobsite-camera photo feed (placeholder captures until Buildertrend photos are wired)
        const feed = await fetch(`private/${p.modelKey}/photos/index.json`).then((x) => (x.ok ? x.json() : [])).catch(() => [])
        p.photos = [...(p.photos ?? []), ...(feed as Project['photos'])]
        this.project = p
      })
      .catch(() => undefined)
  }

  async getProject() {
    await Promise.all([this.loaded, latency()])
    return clone(this.project)
  }
  async getSchedule() {
    await this.loaded
    return clone(this.project.phases.find((p) => p.key === 'construction')?.stages ?? [])
  }
  async getTasks() {
    return (await this.getSchedule()).flatMap((s) => s.milestones.flatMap((m) => m.tasks))
  }
  async getDailyLogs() {
    return clone(this.project.dailyLogs)
  }
  async getPhotos() {
    return clone(this.project.photos)
  }
  async getDocuments() {
    return clone(this.project.documents)
  }
  async getChangeOrders() {
    return clone(this.project.changeOrders)
  }
}
