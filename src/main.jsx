import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './index.css'
import App from './App.jsx'

// Lenis rende lo scorrimento della pagina morbido.
// "anchors: true" fa scorrere dolcemente anche i link interni (es. #contatti).
new Lenis({ autoRaf: true, anchors: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
