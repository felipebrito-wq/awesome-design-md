import { useJourney } from '@/store/useJourney'

export function DemoOverlay() {
  const demo = useJourney((s) => s.demo)
  if (!demo.playing || !demo.caption) return null
  const c = demo.caption
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/10 to-transparent" />
      <div key={c.title} className="caption-in pointer-events-none absolute bottom-[170px] left-10 max-w-[560px] max-md:right-4 max-md:bottom-[130px] max-md:left-4">
        {c.code && <div className="text-caption font-semibold tracking-[0.3em] text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">{c.code}</div>}
        <div className="mt-1 text-3xl leading-[1.05] font-semibold tracking-[-0.03em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">{c.title}</div>
        <div className="mt-2 text-sm text-white/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]">{c.story}</div>
      </div>
    </>
  )
}
