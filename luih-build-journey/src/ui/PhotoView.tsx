import { Images } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Photo } from '@/domain/types'
import { fmtDay, toDay } from '@/lib/dates'
import { STATIONS } from '@/scene/cameraPresets'
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
    <div className="pointer-events-none absolute inset-0 bg-[#1a1c1f]">
      <img key={photo.id} src={photo.url} alt={photo.caption} className="anim-fade-up h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-[190px] left-8 text-white">
        <div className="text-[10.5px] font-medium tracking-[0.2em] text-white/70 uppercase">
          Site photo · {fmtDay(photo.date, { year: true })} · {stage?.shortName}
        </div>
        <div className="mt-2 text-[26px] font-[450] tracking-[-0.01em]">{photo.location}</div>
        <div className="text-[14px] text-white/80">{photo.caption}</div>
        <button onClick={() => openGallery({ photoId: photo.id })} className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-medium backdrop-blur hover:bg-white/25">
          <Images size={14} /> All photos
        </button>
      </div>
    </div>
  )
}

/**
 * Compare: design intent (3D render of the completed home, from the same
 * jobsite camera station) vs. the actual site photo. Drag the divider.
 */
export function CompareView() {
  const list = usePhotoAtCursor(true)
  const split = useJourney((s) => s.compareSplit)
  const setSplit = useJourney((s) => s.setCompareSplit)
  const d = useDerived()
  const [photoId, setPhotoId] = useState<string | undefined>(undefined)
  const photo = list.find((p) => p.id === photoId) ?? list[0]
  const dragging = useRef(false)

  // Render the fully-built home as "intent" while comparing.
  useEffect(() => {
    useJourney.setState({ renderDate: d.idx.end })
    return () => useJourney.setState({ renderDate: null })
  }, [d.idx.end])

  useEffect(() => {
    if (photo?.station && STATIONS[photo.station]) useJourney.getState().requestCamera(`station:${photo.station}`, 1.0)
  }, [photo?.station, photo?.id])

  if (!photo) return null
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) setSplit(e.clientX / window.innerWidth)
  }
  return (
    <div className="absolute inset-0" onPointerMove={onMove} onPointerUp={() => (dragging.current = false)}>
      <img src={photo.url} alt={photo.caption} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 0 0 ${split * 100}%)` }} />
      <div className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" style={{ left: `${split * 100}%` }}>
        <button
          onPointerDown={(e) => {
            dragging.current = true
            ;(e.target as Element).setPointerCapture(e.pointerId)
          }}
          className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-ink shadow-lg"
        >
          ⟷
        </button>
      </div>
      <Label className="left-6" eyebrow="Design intent" title="LUIH render · completed home" />
      <Label className="right-6 text-right" eyebrow={`Site photo · ${fmtDay(photo.date, { year: true })}`} title={photo.caption} />
      <div className="absolute bottom-[180px] left-1/2 flex -translate-x-1/2 gap-1.5 rounded-xl bg-black/35 p-1.5 backdrop-blur">
        {list.slice(0, 8).map((p) => (
          <button key={p.id} onClick={() => setPhotoId(p.id)} className={cx('h-11 w-16 overflow-hidden rounded-md', p.id === photo.id ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100')}>
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Label({ eyebrow, title, className }: { eyebrow: string; title: string; className?: string }) {
  return (
    <div className={cx('pointer-events-none absolute top-[150px] rounded-xl bg-black/35 px-4 py-3 text-white backdrop-blur', className)}>
      <div className="text-[10px] font-medium tracking-[0.2em] text-white/70 uppercase">{eyebrow}</div>
      <div className="mt-1 text-[14px] font-medium">{title}</div>
    </div>
  )
}
