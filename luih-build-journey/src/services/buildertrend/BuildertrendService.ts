/**
 * Integration boundary. The app depends on THIS interface only.
 * Every method returns normalized internal objects (see domain/types.ts).
 */
import type { ChangeOrder, DailyLog, Photo, Project, ProjectDocument, Stage, Task } from '@/domain/types'

export interface BuildertrendService {
  getProject(projectId: string): Promise<Project>
  getSchedule(projectId: string): Promise<Stage[]>
  getTasks(projectId: string): Promise<Task[]>
  getDailyLogs(projectId: string): Promise<DailyLog[]>
  getPhotos(projectId: string): Promise<Photo[]>
  getDocuments(projectId: string): Promise<ProjectDocument[]>
  getChangeOrders(projectId: string): Promise<ChangeOrder[]>
}
