import { BuildertrendAPIService } from './BuildertrendAPIService'
import type { BuildertrendService } from './BuildertrendService'
import { MockBuildertrendService } from './MockBuildertrendService'

export type { BuildertrendService } from './BuildertrendService'

/** Single switch point: VITE_SYNC_API_URL set → real backend, else mock. */
export function createBuildertrendService(): BuildertrendService {
  const url = import.meta.env.VITE_SYNC_API_URL as string | undefined
  return url ? new BuildertrendAPIService(url, import.meta.env.VITE_SYNC_API_TOKEN as string | undefined) : new MockBuildertrendService()
}
