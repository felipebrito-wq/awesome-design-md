import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fmtDay, toDay } from '@/lib/dates'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'
import { useDerived } from './useDerived'

export function PhotoGallery() {
  const gallery = useJourney((s) => s.gallery)
  const close = useJourney((s) => s.closeGallery)
  const d = useDerived()
  const [stageFilter, setStageFilter] = useState<string | undefined>(gallery.stageId)
  useEffect(() => setStageFilter(gallery.stageId), [gallery.stageId, gallery.open])
  const list = useMemo(
    () => d.project.photos.filter((p) => toDay(p.date) <= d.today && (!stageFilter || p.stageId === stageFilter)).sort((a, b) => toDay(b.date) - toDay(a.date)),
    [d.project.photos, d.today, stageFilter],
  )
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const i = list.findIndex((p) => p.id === gallery.photoId)
    setIdx(i >= 0 ? i : 0)
  }, [gallery.photoId, list])

  useEffect(() => {
    if (!gallery.open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(list.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1))
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [gallery.open, list.length, close])

  if (!gallery.open) return null
  const photo = list[idx]
  const stage = photo ? d.idx.stageById.get(photo.stageId) : undefined
  const trade = d.project.tradePartners.find((t) => t.id === photo?.tradeId)

  return (
    <div className="anim-fade-up pointer-events-auto fixed inset-0 z-50 flex flex-col bg-[#14161a]/95 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between px-8 pt-6">
        <div>
          <div className="text-[10.5px] font-medium tracking-[0.2em] text-white/50 uppercase">Site photos · Buildertrend</div>
          <div className="mt-1 text-[18px] font-[450]">{list.length} photos</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setStageFilter(undefined)} className={cx('rounded-full px-3 py-1.5 text-[11.5px] font-medium', !stageFilter ? 'bg-white text-ink' : 'text-white/60 hover:text-white')}>
            All
          </button>
          {d.idx.stages.map((s) => (
            <button key={s.id} onClick={() => setStageFilter(s.id)} className={cx('rounded-full px-3 py-1.5 text-[11.5px] font-medium', stageFilter === s.id ? 'bg-white text-ink' : 'text-white/60 hover:text-white')}>
              {s.shortName}
            </button>
          ))}
          <button onClick={close} className="ml-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>
      {photo ? (
        <div className="flex min-h-0 flex-1 items-center gap-8 px-8 py-6">
          <button onClick={() => setIdx(Math.max(0, idx - 1))} className="rounded-full p-2 text-white/60 hover:bg-white/10 disabled:opacity-20" disabled={idx === 0}>
            <ChevronLeft size={22} />
          </button>
          <div className="relative flex h-full min-w-0 flex-1 items-center justify-center">
            <img key={photo.id} src={photo.url} alt={photo.caption} className="anim-fade-up max-h-full max-w-full rounded-lg object-contain shadow-2xl" />
          </div>
          <div className="w-[260px] shrink-0 self-center">
            <div className="text-[10.5px] font-medium tracking-[0.2em] text-white/45 uppercase">{fmtDay(photo.date, { year: true })}</div>
            <div className="mt-2 text-[20px] leading-tight font-[450]">{photo.location}</div>
            <div className="mt-1 text-[14px] text-white/75">{photo.caption}</div>
            <dl className="mt-6 space-y-3 text-[12px]">
              <Meta k="Stage" v={stage?.name} />
              <Meta k="Trade" v={trade?.name ?? '—'} />
              <Meta k="Source" v={photo.source === 'placeholder' ? 'Placeholder (rendered from model)' : 'Buildertrend'} />
            </dl>
            <button onClick={() => setIdx(Math.min(list.length - 1, idx + 1))} className="mt-8 inline-flex items-center gap-1 text-[12px] text-white/60 hover:text-white disabled:opacity-20" disabled={idx >= list.length - 1}>
              Next photo <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/50">No photos for this stage yet.</div>
      )}
      <div className="scroll-thin flex gap-2 overflow-x-auto px-8 pb-6">
        {list.map((p, i) => (
          <button key={p.id} onClick={() => setIdx(i)} className={cx('relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-opacity', i === idx ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100')}>
            <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}

function Meta({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <dt className="text-white/40">{k}</dt>
      <dd className="mt-0.5 text-white/85">{v}</dd>
    </div>
  )
}
