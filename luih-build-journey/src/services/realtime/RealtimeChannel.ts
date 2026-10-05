/**
 * Transport abstraction for near-real-time updates.
 *  - MockRealtimeChannel: in-memory (DEV panel / simulator)
 *  - SSERealtimeChannel:  production — LUIH sync service pushes normalized events
 */
import type { BuildEvent } from './events'

export type Unsubscribe = () => void

export interface RealtimeChannel {
  subscribe(handler: (e: BuildEvent) => void): Unsubscribe
  publish?(e: BuildEvent): void
}

export class MockRealtimeChannel implements RealtimeChannel {
  private handlers = new Set<(e: BuildEvent) => void>()
  subscribe(h: (e: BuildEvent) => void) {
    this.handlers.add(h)
    return () => void this.handlers.delete(h)
  }
  publish(e: BuildEvent) {
    // async to mimic network delivery
    queueMicrotask(() => this.handlers.forEach((h) => h(e)))
  }
}

export class SSERealtimeChannel implements RealtimeChannel {
  constructor(private url: string) {}
  subscribe(h: (e: BuildEvent) => void) {
    const es = new EventSource(this.url)
    es.onmessage = (m) => h(JSON.parse(m.data) as BuildEvent)
    return () => es.close()
  }
}

export function createRealtimeChannel(): RealtimeChannel {
  const url = import.meta.env.VITE_SYNC_EVENTS_URL as string | undefined
  return url ? new SSERealtimeChannel(url) : new MockRealtimeChannel()
}
