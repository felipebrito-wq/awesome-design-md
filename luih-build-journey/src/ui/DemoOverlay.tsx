import { useJourney } from '@/store/useJourney'
import { indexProject } from '@/lib/schedule'

/** Playback caption: stage, story, and an explicit forecast label once the cursor passes today. */
export function DemoOverlay() {
  const demo = useJourney((s) => s.demo)
  const forecast = useJourney((s) => (s.project ? s.cursor > indexProject(s.project).today + 0.5 : false))
  if (!demo.playing || !demo.caption) return null
  const c = demo.caption
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/10 to-transparent" />
      <div key={c.title} className="caption-in pointer-events-none absolute bottom-[212px] left-6 max-w-[520px] rounded-xl bg-ink/80 px-5 py-4 max-md:right-3 max-md:bottom-[200px] max-md:left-3">
        <div className="flex items-center gap-2">
          {c.code && <span className="num text-caption font-medium text-white">STAGE {c.code}</span>}
          {forecast && <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-medium text-info-ink">Forecast · scheduled, not yet reported</span>}
          {demo.paused && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-ink">Paused</span>}
        </div>
        <div className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-white">{c.title}</div>
        <div className="mt-2 text-sm text-white">{c.story}</div>
        {c.step && (
          <div className="mt-3 border-t border-white/15 pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <span key={c.step.name} className="caption-in truncate text-sm font-medium text-white">{c.step.name}</span>
              <span className="num shrink-0 text-caption text-white/70">
                Step {c.step.index} of {c.step.total}
              </span>
            </div>
            <div className="mt-2 flex gap-[3px]" aria-hidden>
              {Array.from({ length: c.step.total }, (_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i < c.step!.index ? 'bg-accent' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
