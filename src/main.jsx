import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically wipe all stale browser local storage and cached test data
if (typeof window !== 'undefined') {
  const CURRENT_BUILD = 'unicollab_build_v2026_clean';
  if (localStorage.getItem('unicollab_active_build') !== CURRENT_BUILD) {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('unicollab_active_build', CURRENT_BUILD);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

