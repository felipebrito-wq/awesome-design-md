import { Box, Camera, Columns2, Expand, Minimize, PanelRight, RotateCcw, ScanEye, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useJourney, type ViewMode } from '@/store/useJourney'
import { cx, IconButton, Segmented } from './primitives'

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
      <div className="flex items-center gap-2.5">
        <img src="brand/luih_logo_dark.png" alt="LUIH" className="h-5 w-auto" />
        <span className="h-4 w-px bg-slate-300" aria-hidden />
        <span className="text-xs font-medium text-slate-700">Build Journey</span>
        {audience === 'internal' && <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">Internal</span>}
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink max-md:mt-2 max-md:text-xl">{project.name}</h1>
      <div className="mt-0.5 text-caption text-slate-700 max-md:hidden">
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
    <div className="flex min-w-0 items-center gap-2 text-xs text-slate-700" role="status">
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', syncing ? 'animate-pulse bg-warning' : 'bg-accent', flash && 'pulse-dot')} aria-hidden />
      <span className="truncate">
        {syncing ? 'Syncing with Buildertrend…' : `Buildertrend · synced ${time}`}
      </span>
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
    <div className="surface pointer-events-auto relative flex items-center gap-1 rounded-xl p-1">
      <Segmented<ViewMode>
        value={view}
        onChange={setView}
        options={[
          { value: 'model', title: '3D model', label: <span className="inline-flex items-center gap-1.5"><Box size={14} /> <span className="max-md:hidden">3D Model</span></span> },
          { value: 'photo', title: 'Site photo', label: <span className="inline-flex items-center gap-1.5"><Camera size={14} /> <span className="max-md:hidden">Site Photo</span></span> },
          { value: 'compare', title: 'Compare', label: <span className="inline-flex items-center gap-1.5"><Columns2 size={14} /> <span className="max-md:hidden">Compare</span></span> },
        ]}
      />
      <span className="mx-1 h-5 w-px bg-line" aria-hidden />
      <button
        onClick={() => setXray(!xray)}
        aria-pressed={xray}
        className={cx('inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors', xray ? 'bg-ink text-white' : 'text-slate-700 hover:bg-slate-50 hover:text-ink')}
        title="X-Ray (X)"
      >
        <ScanEye size={16} /> <span className="max-md:hidden">X-Ray</span>
      </button>
      <IconButton title="Camera views" onClick={() => setMenu((m) => !m)} active={menu}>
        <Video size={16} />
      </IconButton>
      <IconButton title="Reset camera (R)" onClick={() => requestCamera('overview', 0.9)}>
        <RotateCcw size={16} />
      </IconButton>
      <IconButton title="Fullscreen (F)" onClick={toggleFs} className="max-md:hidden">
        {fs ? <Minimize size={16} /> : <Expand size={16} />}
      </IconButton>
      <IconButton title="Details panel" onClick={() => setPanelOpen(!panelOpen)} active={panelOpen} className="max-md:hidden">
        <PanelRight size={16} />
      </IconButton>
      {menu && (
        <div className="surface anim-fade-up absolute top-12 right-0 w-48 rounded-xl p-1 max-md:top-auto max-md:bottom-12" role="menu">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              role="menuitem"
              onClick={() => {
                requestCamera(v.key, 1.1)
                setMenu(false)
              }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-slate-50"
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
