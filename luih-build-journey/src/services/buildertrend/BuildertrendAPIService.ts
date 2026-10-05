/**
 * Production adapter (stub). Talks to the LUIH sync backend — NOT to
 * Buildertrend directly from the browser (credentials + rate limits).
 *
 *   Buildertrend → sync service → normalized DB → /api/projects/:id → here
 *
 * Endpoints below are the LUIH backend contract, which returns already
 * normalized objects. Raw→normalized mapping lives server-side (see mapper.ts).
 */
import type { ChangeOrder, DailyLog, Photo, Project, ProjectDocument, Stage, Task } from '@/domain/types'
import type { BuildertrendService } from './BuildertrendService'

export class BuildertrendAPIService implements BuildertrendService {
  constructor(private baseUrl: string, private token?: string) {}

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined,
    })
    if (!res.ok) throw new Error(`Sync API ${res.status} on ${path}`)
    return res.json() as Promise<T>
  }

  getProject(id: string) {
    return this.get<Project>(`/projects/${id}`)
  }
  getSchedule(id: string) {
    return this.get<Stage[]>(`/projects/${id}/schedule`)
  }
  getTasks(id: string) {
    return this.get<Task[]>(`/projects/${id}/tasks`)
  }
  getDailyLogs(id: string) {
    return this.get<DailyLog[]>(`/projects/${id}/daily-logs`)
  }
  getPhotos(id: string) {
    return this.get<Photo[]>(`/projects/${id}/photos`)
  }
  getDocuments(id: string) {
    return this.get<ProjectDocument[]>(`/projects/${id}/documents`)
  }
  getChangeOrders(id: string) {
    return this.get<ChangeOrder[]>(`/projects/${id}/change-orders`)
  }
}
