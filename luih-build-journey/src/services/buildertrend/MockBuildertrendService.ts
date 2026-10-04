import { demoProject } from '@/data/demoProject'
import type { Project } from '@/domain/types'
import type { BuildertrendService } from './BuildertrendService'

const clone = <T,>(x: T): T => structuredClone(x)
const latency = (ms = 120) => new Promise((r) => setTimeout(r, ms))

/** Returns demo data shaped as normalized domain objects. */
export class MockBuildertrendService implements BuildertrendService {
  private project: Project = clone(demoProject)

  async getProject() {
    await latency()
    return clone(this.project)
  }
  async getSchedule() {
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
