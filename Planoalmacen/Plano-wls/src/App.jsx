import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import  RielHerramientas from '../components/rielherramientas/Rielherramientas.jsx'
import Toolbar  from '../components/toolbar/toolbar.jsx'
import Lienzo from '../components/lienzo/lienzo.jsx'
 
export default function App() {

  const [herramienta, setHerramienta] = useState(null)
  const [busqueda, setBusqueda] = useState('')   
  
  return(
    <div className='app'>
    <Toolbar
     busqueda={busqueda}
     onBuscar={setBusqueda} 
     puedeDeshacer={false}
     puedeRehacer={false}
     onRehacer={()=>{}}
     onDeshacer={()=>{}}
     onHistorial={()=>{}}
     onExportar={()=>{}}
     estadoGuardado='guardado'
     ultimoGuardado={new Date}
    
    />
    <RielHerramientas activa={herramienta} OnSeleccionar={setHerramienta}/>

    <Lienzo />
    <aside className='panel'></aside>
    </div>
  )
}
