import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import gsap from 'gsap'
import { App } from './App'

// Real-time motion: never stretch tweens on slow frames (keeps the demo ~27 s).
gsap.ticker.lagSmoothing(0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
