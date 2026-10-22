import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Area_estilos from 'components/syles_area.jsx'
import barra_de_botones from 'components/toolbar.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Area_estilos/>
    <barra_de_botones/>
  </StrictMode>,
)
