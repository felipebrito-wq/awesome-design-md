import { Check, Pause, Play } from 'lucide-react'
import { useJourney } from '@/store/useJourney'
import { cx } from './primitives'
import { useDerived } from './useDerived'

export function StageSelector({ onPlay }: { onPlay: () => void }) {
  const d = useDerived()
  const selectStage = useJourney((s) => s.selectStage)
  const previewStage = useJourney((s) => s.previewStage)
  const playing = useJourney((s) => s.demo.playing)

  return (
    <div className="flex w-full items-center gap-3">
      <button
        onClick={onPlay}
        className={cx(
          'group inline-flex h-10 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-[12px] font-medium tracking-wide transition-colors',
          playing ? 'bg-accent text-white' : 'bg-ink text-white hover:bg-accent-dark',
        )}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">{playing ? <Pause size={13} /> : <Play size={13} className="translate-x-px" />}</span>
        {playing ? 'Stop' : 'Play Journey'}
      </button>
      <div className="flex min-w-0 flex-1 items-stretch">
        {d.idx.stages.map((s, i) => {
          const p = d.stageProgress.get(s.id) ?? 0
          const active = d.stage.id === s.id
          return (
            <button
              key={s.id}
              onClick={() => selectStage(s.id)}
              onMouseEnter={() => previewStage(s.id)}
              onMouseLeave={() => previewStage(null)}
              className={cx('group min-w-0 flex-1 px-2.5 py-1 text-left transition-colors', i > 0 && 'border-l border-black/[0.06]')}
              title={`${s.code} ${s.name}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={cx('circle-num shrink-0 tabular-nums', active ? 'bg-accent text-white' : p >= 0.999 ? 'bg-ink text-white' : 'bg-slate-100 text-mute')}>{p >= 0.999 && !active ? <Check size={10} strokeWidth={3} /> : s.code}</span>
                <span className={cx('truncate text-[12.5px] font-medium transition-colors', active ? 'text-ink' : p >= 0.999 ? 'text-ink-2' : 'text-mute group-hover:text-ink')}>{s.shortName}</span>
              </div>
              <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-black/[0.07]">
                <div className={cx('h-full rounded-full', active ? 'bg-accent' : 'bg-ink/70')} style={{ width: `${p * 100}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
