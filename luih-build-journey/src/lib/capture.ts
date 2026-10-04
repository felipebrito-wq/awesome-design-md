/**
 * Bridge so non-3D code (DEV panel, sync simulator, photo capture script) can
 * ask the R3F scene for a "site photo" from a jobsite camera station.
 */
export type CaptureFn = (station: string, opts?: { date?: string; width?: number }) => Promise<string>

let impl: CaptureFn | null = null
export const registerCapture = (fn: CaptureFn | null) => (impl = fn)
export const capturePhoto: CaptureFn = async (station, opts) => {
  if (!impl) throw new Error('Scene not ready for capture')
  return impl(station, opts)
}

/** When true, the scene snaps to target state (no easing) — used for captures. */
export const sceneFlags = { snap: false }
