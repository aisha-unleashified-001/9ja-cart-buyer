import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Eagerly hydrate session caches before React renders for instant homepage on reload
import './hooks/api/useRealProducts'
import { preloadCachedProductImages } from './lib/sessionCache'
import App from './App.tsx'

// Preload product images from cache so they display within 1s on reload
preloadCachedProductImages(60)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
