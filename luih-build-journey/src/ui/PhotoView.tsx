import { Images } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { Photo } from '@/domain/types'
import { fmtDay, toDay } from '@/lib/dates'
import { stationsFor } from '@/scene/cameraPresets'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'
import { useDerived } from './useDerived'

/** Latest exterior/interior site photo at or before the timeline cursor. */
export function usePhotoAtCursor(exteriorOnly = false): Photo[] {
  const d = useDerived()
  return useMemo(() => {
    const limit = Math.min(d.cursor, d.today) + 0.5
    return d.project.photos
      .filter((p) => toDay(p.date) <= limit && (!exteriorOnly || !(p.station ?? '').startsWith('int-')))
      .sort((a, b) => toDay(b.date) - toDay(a.date))
  }, [d.project.photos, d.cursor, d.today, exteriorOnly])
}

export function PhotoView() {
  const list = usePhotoAtCursor()
  const openGallery = useJourney((s) => s.openGallery)
  const d = useDerived()
  const photo = list[0]
  if (!photo) return null
  const stage = d.idx.stageById.get(photo.stageId)
  return (
    <div className="pointer-events-none absolute inset-0 bg-[#0f172a]">
      <img key={photo.id} src={photo.url} alt={photo.caption} className="anim-fade-up h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-[190px] left-8 text-white">
        <div className="text-[10.5px] font-medium tracking-[0.2em] text-white/70 uppercase">
          Site photo · {fmtDay(photo.date, { year: true })} · {stage?.shortName}
        </div>
        <div className="mt-2 text-[26px] font-semibold tracking-[-0.01em]">{photo.location}</div>
        <div className="text-[14px] text-white/80">{photo.caption}</div>
        <button onClick={() => openGallery({ photoId: photo.id })} className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-medium backdrop-blur hover:bg-white/25">
          <Images size={14} /> All photos
        </button>
      </div>
    </div>
  )
}

/**
 * Compare. Two modes, one slider:
 *  - Drawing (sealed plans) vs the 3D build as of the timeline date — intent vs execution.
 *  - Site photo vs the 3D design-intent render from the same jobsite camera station.
 */
export function CompareView() {
  const photos = usePhotoAtCursor(true)
  const d = useDerived()
  const split = useJourney((s) => s.compareSplit)
  const setSplit = useJourney((s) => s.setCompareSplit)
  const sourceId = useJourney((s) => s.compareSourceId)
  const drawings = (d.project.drawings ?? []).filter((x) => x.station)
  type Src = { id: string; url: string; station?: string; kind: 'drawing' | 'photo'; title: string; eyebrow: string }
  const sources: Src[] = [
    ...drawings.map((x) => ({ id: x.id, url: x.url, station: x.station, kind: 'drawing' as const, title: x.title, eyebrow: `Design intent · ${x.sheet}` })),
    ...photos.map((p) => ({ id: p.id, url: p.url, station: p.station, kind: 'photo' as const, title: p.caption, eyebrow: `Site photo · ${fmtDay(p.date, { year: true })}` })),
  ]
  const all = [...(d.project.drawings ?? []).map((x) => ({ id: x.id, url: x.url, station: x.station, kind: 'drawing' as const, title: x.title, eyebrow: `Design intent · ${x.sheet}` })), ...sources]
  const src = all.find((x) => x.id === sourceId) ?? sources[0]
  const dragging = useRef(false)
  const intentRender = src?.kind === 'photo'

  useEffect(() => {
    useJourney.setState({ renderDate: intentRender ? d.idx.end : null })
    return () => useJourney.setState({ renderDate: null })
  }, [intentRender, d.idx.end])

  useEffect(() => {
    if (src?.station && stationsFor()[src.station]) useJourney.getState().requestCamera(`station:${src.station}`, 1.0)
  }, [src?.station, src?.id])

  if (!src) return null
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) setSplit(e.clientX / window.innerWidth)
  }
  return (
    <div className="absolute inset-0" onPointerMove={onMove} onPointerUp={() => (dragging.current = false)}>
      <div className={cx('pointer-events-none absolute inset-0', src.kind === 'drawing' && 'bg-white')} style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }}>
        <img src={src.url} alt={src.title} className={cx('h-full w-full', src.kind === 'drawing' ? 'object-contain p-[6%] pb-[14%]' : 'object-cover')} />
      </div>
      <div className="absolute top-0 bottom-0 w-px bg-accent shadow-[0_0_0_1px_rgba(0,0,0,0.05)]" style={{ left: `${split * 100}%` }}>
        <button
          onPointerDown={(e) => {
            dragging.current = true
            ;(e.target as Element).setPointerCapture(e.pointerId)
          }}
          className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-ink shadow-lg ring-2 ring-accent"
        >
          ⟷
        </button>
      </div>
      <Label className="left-6" eyebrow={intentRender ? 'Design intent · 3D' : `As built · ${fmtDay(d.cursor, { year: true })}`} title={intentRender ? 'Completed home render' : 'Buildertrend-driven 3D model'} />
      <Label className="right-6 text-right" eyebrow={src.eyebrow} title={src.title} />
      <div className="absolute bottom-[180px] left-1/2 flex max-w-[80vw] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-xl bg-ink/50 p-1.5 backdrop-blur">
        {[...drawings.map((x) => ({ id: x.id, url: x.url })), ...photos.slice(0, 8).map((p) => ({ id: p.id, url: p.url }))].map((x) => (
          <button key={x.id} onClick={() => useJourney.setState({ compareSourceId: x.id })} className={cx('h-11 w-16 shrink-0 overflow-hidden rounded-md bg-white', x.id === src.id ? 'ring-2 ring-accent' : 'opacity-60 hover:opacity-100')}>
            <img src={x.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Label({ eyebrow, title, className }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={cx('pointer-events-none absolute top-[150px] rounded-xl bg-ink/70 px-4 py-3 text-white backdrop-blur', className)}>
      <div className="text-[10px] font-semibold tracking-[0.16em] text-accent uppercase">{eyebrow}</div>
      <div className="mt-1 text-[14px] font-medium">{title}</div>
    </div>
  )
}
