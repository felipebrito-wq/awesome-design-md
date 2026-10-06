import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import gsap from 'gsap'
import { App } from './App'
import { useJourney } from './store/useJourney'

// Dev-only handle for scripted visual checks (scripts/ and Playwright).
if (import.meta.env.DEV) (window as unknown as { __journey: typeof useJourney }).__journey = useJourney

// Real-time motion: never stretch tweens on slow frames (keeps the demo ~27 s).
gsap.ticker.lagSmoothing(0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
