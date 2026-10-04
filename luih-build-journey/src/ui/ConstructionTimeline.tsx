import { useEffect, useMemo, useRef, useState } from 'react'
import { fmtDay, monthShort, toDay, type Day } from '@/lib/dates'
import { milestoneSnapDays } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'
import { useDerived } from './useDerived'

/**
 * Time machine. Dragging moves the cursor date; the house builds/unbuilds
 * continuously. Releases snap to the nearest milestone (±5 days).
 */
export function ConstructionTimeline() {
  const d = useDerived()
  const setCursor = useJourney((s) => s.setCursor)
  const setScrubbing = useJourney((s) => s.setScrubbing)
  const animateCursorTo = useJourney((s) => s.animateCursorTo)
  const scrubbing = useJourney((s) => s.scrubbing)
  const cursorRaw = useJourney((s) => s.cursor)
  const track = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ x: number; day: Day } | null>(null)

  const start = d.idx.start - 3
  const end = d.idx.end + 3
  const span = end - start
  const toX = (day: Day) => ((day - start) / span) * 100

  const snaps = useMemo(() => milestoneSnapDays(d.project), [d.project])
  const months = useMemo(() => {
    const out: { day: Day; label: string }[] = []
    const s = new Date(start * 86400000)
    let y = s.getUTCFullYear()
    let m = s.getUTCMonth() + 1
    for (;;) {
      if (m > 11) {
        m = 0
        y++
      }
      const day = toDay(`${y}-${String(m + 1).padStart(2, '0')}-01`)
      if (day > end) break
      out.push({ day, label: monthShort(day) })
      m++
    }
    return out
  }, [start, end])

  const dayFromEvent = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    return start + ((clientX - r.left) / r.width) * span
  }

  const onDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    useJourney.getState().setDemo({ playing: false, caption: null })
    setScrubbing(true)
    setCursor(dayFromEvent(e.clientX))
  }
  const onMove = (e: React.PointerEvent) => {
    const day = dayFromEvent(e.clientX)
    setHover({ x: toX(day), day })
    if (scrubbing) setCursor(day)
  }
  const onUp = (e: React.PointerEvent) => {
    if (!scrubbing) return
    setScrubbing(false)
    const day = dayFromEvent(e.clientX)
    const candidates = [...snaps.map((s) => s.day), d.today]
    const nearest = candidates.reduce((a, b) => (Math.abs(b - day) < Math.abs(a - day) ? b : a), candidates[0])
    if (Math.abs(nearest - day) <= 5) animateCursorTo(nearest, 0.35)
  }

  // Keyboard: ← / → step through milestones
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const cur = useJourney.getState().cursor
      const days = [...new Set([...snaps.map((s) => s.day), d.today])].sort((a, b) => a - b)
      const next = e.key === 'ArrowRight' ? days.find((x) => x > cur + 0.5) : [...days].reverse().find((x) => x < cur - 0.5)
      if (next !== undefined) animateCursorTo(next, 0.7)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [snaps, d.today, animateCursorTo])

  const cx_ = toX(cursorRaw)
  const todayX = toX(d.today)
  const nearMilestone = snaps.find((s) => Math.abs(s.day - cursorRaw) < 0.6)

  return (
    <div className="relative select-none">
      <div
        ref={track}
        className="relative mt-3 h-8 cursor-ew-resize touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => setHover(null)}
      >
        {/* base track */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/12" />
        {/* stage bands */}
        {d.idx.stages.map((s, i) => {
          const r = d.idx.stageRange.get(s.id)!
          return (
            <div
              key={s.id}
              className="absolute top-1/2 h-[5px] -translate-y-1/2 rounded-full"
              style={{
                left: `${toX(r[0])}%`,
                width: `${toX(r[1]) - toX(r[0])}%`,
                background: i % 2 ? 'rgba(27,30,34,0.10)' : 'rgba(27,30,34,0.16)',
              }}
            />
          )
        })}
        {/* built so far (to cursor) */}
        <div className="absolute top-1/2 left-0 h-[5px] -translate-y-1/2 rounded-full bg-ink/80" style={{ width: `${Math.min(cx_, todayX)}%` }} />
        {cx_ > todayX && (
          <div
            className="absolute top-1/2 h-[5px] -translate-y-1/2 rounded-full"
            style={{
              left: `${todayX}%`,
              width: `${cx_ - todayX}%`,
              background: 'repeating-linear-gradient(90deg, rgba(63,109,158,0.55) 0 4px, transparent 4px 7px)',
            }}
          />
        )}
        {/* milestones */}
        {snaps.map((s) => (
          <div
            key={s.milestone.id}
            title={`${s.milestone.name} · ${fmtDay(s.day - 1)}`}
            className={cx('absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border', s.day <= cursorRaw ? 'border-ink bg-ink' : 'border-black/30 bg-paper')}
            style={{ left: `${toX(s.day)}%` }}
          />
        ))}
        {/* today */}
        <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-accent" style={{ left: `${todayX}%` }}>
          <span className="absolute -top-[15px] left-1/2 -translate-x-1/2 text-[9.5px] font-semibold tracking-[0.14em] text-accent uppercase">Today</span>
        </div>
        {/* hover ghost */}
        {hover && !scrubbing && (
          <div className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-black/30" style={{ left: `${hover.x}%` }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-mute">{fmtDay(hover.day)}</span>
          </div>
        )}
        {/* knob */}
        <div className="pointer-events-none absolute top-1/2" style={{ left: `${cx_}%` }}>
          <div className={cx('h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/15 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform', scrubbing && 'scale-125')}>
            <div className="absolute inset-[5px] rounded-full bg-ink" />
          </div>
          <div className={cx('absolute bottom-[14px] rounded-md', cx_ > 82 ? 'right-0 translate-x-3' : cx_ < 12 ? 'left-0 -translate-x-3' : 'left-1/2 -translate-x-1/2', ' bg-ink px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white shadow transition-opacity', scrubbing || nearMilestone ? 'opacity-100' : 'opacity-0')}>
            {fmtDay(cursorRaw)}
            {nearMilestone ? ` · ${nearMilestone.milestone.name}` : ` · ${d.stage.shortName}`}
          </div>
        </div>
      </div>
      {/* Month labels */}
      <div className="relative -mt-1 h-3.5">
        {months.map((m) => (
          <span key={m.day} className="absolute -translate-x-1/2 text-[10px] font-medium tracking-[0.14em] text-faint uppercase" style={{ left: `${toX(m.day)}%` }}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
