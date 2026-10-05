import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fmtDay, monthShort, toDay, type Day } from '@/lib/dates'
import { milestoneSnapDays } from '@/lib/schedule'
import { useJourney } from '@/store/useJourney'
import { Chip, cx } from './primitives'
import { SyncStatus } from './TopBar'
import { pct, useDerived } from './useDerived'

/**
 * Time machine. One rail, one time scale: stages are segments sized by their
 * real dates, milestones and Today sit on the same axis, and dragging anywhere
 * on the rail moves the cursor (the house builds/unbuilds continuously).
 * Releases snap to the nearest milestone (±5 days).
 */
export function ConstructionTimeline({ onPlay }: { onPlay: () => void }) {
  const d = useDerived()
  const setCursor = useJourney((s) => s.setCursor)
  const setScrubbing = useJourney((s) => s.setScrubbing)
  const animateCursorTo = useJourney((s) => s.animateCursorTo)
  const selectStage = useJourney((s) => s.selectStage)
  const previewStage = useJourney((s) => s.previewStage)
  const playing = useJourney((s) => s.demo.playing)
  const scrubbing = useJourney((s) => s.scrubbing)
  const cursorRaw = useJourney((s) => s.cursor)
  const track = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ x: number; day: Day } | null>(null)

  const start = d.idx.start - 3
  const end = d.idx.end + 3
  const span = end - start
  const toX = (day: Day) => ((day - start) / span) * 100

  const snaps = useMemo(() => milestoneSnapDays(d.project), [d.project])

  // Stage segments: each runs from its start to the next stage's start, so the
  // rail tiles cleanly even when trades overlap at a hand-off.
  const segments = useMemo(() => {
    const st = d.idx.stages
    return st.map((s, i) => {
      const [a, b] = d.idx.stageRange.get(s.id)!
      const nextStart = i < st.length - 1 ? d.idx.stageRange.get(st[i + 1].id)![0] : b
      return { stage: s, from: a, to: Math.max(a + 1, i < st.length - 1 ? nextStart : b) }
    })
  }, [d.idx])

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
    return Math.max(start, Math.min(end, start + ((clientX - r.left) / r.width) * span))
  }

  const onDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
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

  // Keyboard: ← / → step through milestones (global, as before)
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

  const curX = toX(cursorRaw)
  const todayX = toX(d.today)
  const nearMilestone = snaps.find((s) => Math.abs(s.day - cursorRaw) < 0.6)
  const hoverMilestone = hover && !scrubbing ? snaps.find((s) => Math.abs(toX(s.day) - hover.x) < 0.6) : undefined
  const showBubble = scrubbing || !!nearMilestone
  const when = d.isLive ? { label: 'Today', tone: 'ok' as const } : d.isForecast ? { label: 'Forecast', tone: 'info' as const } : { label: 'Past', tone: 'neutral' as const }

  return (
    <div className="select-none">
      {/* Header: play · where the cursor is · sync */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPlay}
          className={cx(
            'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors max-md:px-2.5',
            playing ? 'bg-ink text-white hover:bg-ink/90' : 'bg-accent text-white hover:bg-accent-dark',
          )}
          aria-label={playing ? 'Stop journey (P)' : 'Play journey (P)'}
          title={playing ? 'Stop (P)' : 'Play the build journey (P)'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span className="max-md:hidden">{playing ? 'Stop' : 'Play journey'}</span>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold whitespace-nowrap text-ink">{fmtDay(d.cursor, { year: true })}</span>
          <Chip tone={when.tone}>{when.label}</Chip>
        </div>
        <div className="ml-auto min-w-0 max-md:hidden">
          <SyncStatus />
        </div>
      </div>

      {/* Rail */}
      <div className="relative mt-3">
        {/* Stage labels, positioned on the same time scale as the bar */}
        <div className="relative h-6">
          {segments.map(({ stage, from, to }) => {
            const p = d.stageProgress.get(stage.id) ?? 0
            const active = d.stage.id === stage.id
            const w = toX(to) - toX(from)
            return (
              <button
                key={stage.id}
                onClick={() => selectStage(stage.id)}
                onMouseEnter={() => previewStage(stage.id)}
                onMouseLeave={() => previewStage(null)}
                onFocus={() => previewStage(stage.id)}
                onBlur={() => previewStage(null)}
                aria-current={active ? 'step' : undefined}
                title={`${stage.code} ${stage.name} · ${pct(p)}`}
                className={cx(
                  'absolute bottom-0 flex h-6 min-w-0 items-center gap-1.5 overflow-hidden rounded-md px-1 text-left transition-colors',
                  active ? 'text-ink' : p >= 0.999 ? 'text-slate-700 hover:text-ink' : 'text-slate-700 hover:text-ink',
                )}
                style={{ left: `${toX(from)}%`, width: `${w}%` }}
              >
                <span className={cx('num shrink-0 text-[10px] font-medium', active ? 'text-accent-dark' : 'text-slate-500')}>{stage.code}</span>
                <span className={cx('truncate text-xs max-md:hidden', active ? 'font-semibold' : 'font-medium', w < 7 && 'hidden')}>{stage.shortName}</span>
              </button>
            )
          })}
        </div>

        {/* Scrub track */}
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="Construction timeline"
          aria-valuemin={Math.round(start)}
          aria-valuemax={Math.round(end)}
          aria-valuenow={Math.round(cursorRaw)}
          aria-valuetext={`${fmtDay(cursorRaw, { year: true })}, ${d.stage.shortName}`}
          className="relative h-7 cursor-ew-resize touch-none rounded-md"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={() => setHover(null)}
        >
          {/* stage segments */}
          {segments.map(({ stage, from, to }) => {
            const p = d.stageProgress.get(stage.id) ?? 0
            const a = toX(from)
            const b = toX(to)
            // elapsed share of this segment up to the cursor (time-based, so it tracks the knob)
            const filled = Math.max(0, Math.min(1, (curX - a) / (b - a)))
            const pastToday = Math.max(0, Math.min(1, (todayX - a) / (b - a)))
            const done = p >= 0.999
            const active = d.stage.id === stage.id
            return (
              <div
                key={stage.id}
                className={cx('absolute top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-50 ring-1 ring-inset', active ? 'ring-slate-300' : 'ring-transparent')}
                style={{ left: `calc(${a}% + 1.5px)`, width: `calc(${b - a}% - 3px)` }}
              >
                {done ? (
                  <div className="h-full w-full bg-accent" />
                ) : (
                  <>
                    <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${Math.min(filled, pastToday) * 100}%` }} />
                    {filled > pastToday && (
                      <div
                        className="absolute inset-y-0"
                        style={{
                          left: `${pastToday * 100}%`,
                          width: `${(filled - pastToday) * 100}%`,
                          background: 'repeating-linear-gradient(135deg, var(--color-ink) 0 2px, transparent 2px 5px)',
                          opacity: 0.45,
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* milestones: ticks under the bar */}
          {snaps.map((s) => (
            <span
              key={s.milestone.id}
              className={cx('absolute top-[calc(50%+7px)] h-1.5 w-px -translate-x-1/2 transition-colors', s.day <= cursorRaw ? 'bg-ink' : 'bg-slate-300', hoverMilestone?.milestone.id === s.milestone.id && 'w-[3px] bg-ink')}
              style={{ left: `${toX(s.day)}%` }}
              aria-hidden
            />
          ))}

          {/* today */}
          <div className="pointer-events-none absolute top-1 bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-accent" style={{ left: `${todayX}%` }} aria-hidden />

          {/* hover ghost */}
          {hover && !scrubbing && (
            <div className="pointer-events-none absolute top-1/2 z-10 h-4 w-px -translate-y-1/2 bg-ink/40" style={{ left: `${hover.x}%` }}>
              <span className={cx('absolute bottom-full mb-1 rounded-md bg-white px-1.5 py-0.5 text-xs whitespace-nowrap text-ink shadow-[var(--shadow-float)]', hover.x > 85 ? 'right-0' : hover.x < 15 ? 'left-0' : 'left-1/2 -translate-x-1/2')}>
                {fmtDay(hover.day)}
                {hoverMilestone && <span className="text-slate-700"> · {hoverMilestone.milestone.name}</span>}
              </span>
            </div>
          )}

          {/* knob */}
          <div className="pointer-events-none absolute top-1/2 z-20" style={{ left: `${curX}%` }}>
            <div className={cx('h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white shadow-[0_1px_3px_rgba(26,34,43,0.3)] transition-transform duration-150', scrubbing && 'scale-125')} />
            <div
              className={cx(
                'absolute bottom-[14px] rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white transition-opacity duration-150',
                curX > 80 ? 'right-0 translate-x-2' : curX < 15 ? 'left-0 -translate-x-2' : 'left-1/2 -translate-x-1/2',
                showBubble ? 'opacity-100' : 'opacity-0',
              )}
            >
              {fmtDay(cursorRaw)}
              <span className="text-white/75">{nearMilestone ? ` · ${nearMilestone.milestone.name}` : ` · ${d.stage.shortName}`}</span>
            </div>
          </div>
        </div>

        {/* Axis: months + Today */}
        <div className="relative h-4">
          {months.map((m, i) => (
            <span
              key={m.day}
              className={cx('absolute -translate-x-1/2 text-[10px] font-medium text-slate-700 uppercase', i % 2 === 1 && 'max-md:hidden', Math.abs(toX(m.day) - todayX) < 7 && 'invisible')}
              style={{ left: `${toX(m.day)}%` }}
            >
              {m.label}
            </span>
          ))}
          <span className="absolute -translate-x-1/2 text-[10px] font-semibold text-accent-dark uppercase" style={{ left: `${todayX}%` }}>
            Today
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0 md:hidden">
          <SyncStatus />
        </div>
        <span className="ml-auto text-xs text-slate-700 max-md:hidden">
          Drag to travel through time · <kbd className="font-sans">←</kbd> <kbd className="font-sans">→</kbd> milestones · <kbd className="font-sans">1–6</kbd> stages
        </span>
      </div>
    </div>
  )
}
