import { Box, Camera, Columns2, Expand, Minimize, PanelRight, RotateCcw, ScanEye, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useJourney, type ViewMode } from '@/store/useJourney'
import { cx, IconButton, Segmented } from './primitives'
import { fmtDay } from '@/lib/dates'

const VIEWS = [
  { key: 'overview', label: 'Overview' },
  { key: 'front', label: 'Front elevation' },
  { key: 'rear', label: 'Rear & pool' },
  { key: 'aerial', label: 'Aerial' },
  { key: 'interior', label: 'Great room' },
]

export function Brand() {
  const project = useJourney((s) => s.project)!
  const audience = useJourney((s) => s.audience)
  return (
    <div className="pointer-events-auto">
      <div className="flex items-center gap-3">
        <img src="/brand/luih_logo_dark.png" alt="LUIH" className="h-[22px] w-auto" />
        <span className="h-4 w-px bg-line" />
        <span className="text-[10px] font-medium tracking-[0.2em] text-mute uppercase">Build Journey</span>
        {audience === 'internal' && <span className="ml-1 rounded-full bg-ink px-2 py-[2px] text-[9.5px] font-semibold tracking-[0.14em] text-white uppercase">Internal</span>}
      </div>
      <h1 className="mt-3 text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">{project.name}</h1>
      <div className="mt-1.5 text-[12px] text-mute">
        {project.model} · {project.address}
      </div>
    </div>
  )
}

export function SyncStatus() {
  const project = useJourney((s) => s.project)!
  const syncing = useJourney((s) => s.syncing)
  const feedLen = useJourney((s) => s.feed.length)
  const [flash, setFlash] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 2400)
    return () => clearTimeout(t)
  }, [feedLen])
  const time = new Date(project.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="flex items-center gap-2 text-[11px] text-mute">
      <span className={cx('h-1.5 w-1.5 rounded-full', syncing ? 'animate-pulse bg-warn' : 'bg-ok', flash && 'pulse-dot')} />
      {syncing ? 'Syncing with Buildertrend…' : `Buildertrend · synced ${time}`}
      <span className="text-faint">· as of {fmtDay(project.today)}</span>
    </div>
  )
}

export function Toolbar() {
  const view = useJourney((s) => s.view)
  const setView = useJourney((s) => s.setView)
  const xray = useJourney((s) => s.xray)
  const setXray = useJourney((s) => s.setXray)
  const panelOpen = useJourney((s) => s.panelOpen)
  const setPanelOpen = useJourney((s) => s.setPanelOpen)
  const requestCamera = useJourney((s) => s.requestCamera)
  const [menu, setMenu] = useState(false)
  const [fs, setFs] = useState(false)

  useEffect(() => {
    const on = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const toggleFs = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <div className="surface flex items-center gap-1 rounded-full p-1">
        <Segmented<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'model', label: <span className="inline-flex items-center gap-1.5"><Box size={13} /> 3D Model</span> },
            { value: 'photo', label: <span className="inline-flex items-center gap-1.5"><Camera size={13} /> Site Photo</span> },
            { value: 'compare', label: <span className="inline-flex items-center gap-1.5"><Columns2 size={13} /> Compare</span> },
          ]}
        />
      </div>
      <div className="surface relative flex items-center gap-0.5 rounded-full p-1">
        <button
          onClick={() => setXray(!xray)}
          className={cx('inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-colors', xray ? 'bg-ink text-white' : 'text-ink-2 hover:bg-black/[0.05]')}
          title="X-Ray (X)"
        >
          <ScanEye size={14} /> X-Ray
        </button>
        <IconButton title="Camera views" onClick={() => setMenu((m) => !m)} active={menu}>
          <Video size={15} />
        </IconButton>
        <IconButton title="Reset camera (R)" onClick={() => requestCamera('overview', 0.9)}>
          <RotateCcw size={15} />
        </IconButton>
        <IconButton title="Fullscreen (F)" onClick={toggleFs}>
          {fs ? <Minimize size={15} /> : <Expand size={15} />}
        </IconButton>
        <IconButton title="Details panel" onClick={() => setPanelOpen(!panelOpen)} active={panelOpen}>
          <PanelRight size={15} />
        </IconButton>
        {menu && (
          <div className="surface anim-fade-up absolute top-12 right-0 w-48 rounded-xl p-1.5">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => {
                  requestCamera(v.key, 1.1)
                  setMenu(false)
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-[12.5px] text-ink-2 hover:bg-black/[0.04]"
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
