import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.__CONFIG__ = window.__CONFIG__ || {};
window.__CONFIG__.BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:4000'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
