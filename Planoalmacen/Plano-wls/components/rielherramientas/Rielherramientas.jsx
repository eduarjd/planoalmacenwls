import { BrickWall, DoorOpen, AppWindow, Archive, Package,
         Monitor, Shapes, Type, ShieldAlert } from 'lucide-react';
import s from './RielHerramientas.module.css';

const grupos = [
  { titulo: 'Estructura', items: [
    { id: 'pared', icono: BrickWall, nombre: 'Pared', atajo: 'W' },
    { id: 'puerta', icono: DoorOpen, nombre: 'Puerta', atajo: 'D' },
    { id: 'ventana', icono: AppWindow, nombre: 'Ventana', atajo: 'V' },
  ]},
  { titulo: 'Mobiliario', items: [
    { id: 'estante', icono: Archive, nombre: 'Estante', atajo: 'E' },
    { id: 'estiba', icono: Package, nombre: 'Estiba', atajo: 'P' },
    { id: 'pc', icono: Monitor, nombre: 'PC', atajo: 'C' },
    { id: 'objeto', icono: Shapes, nombre: 'Objeto', atajo: 'O' },
    { id: 'texto', icono: Type, nombre: 'Texto', atajo: 'T' },
  ]},
  { titulo: 'SSA', items: [
    { id: 'senales', icono: ShieldAlert, nombre: 'Señalización', atajo: 'S' },
  ]},
];

export default function  RielHerramientas({activa, onSeleccionar}){
    return(
        <nav className={s.riel}>
            {grupos.map(g =>(
                <div key={g.titulo} className={s.grupo}>
                {g.items.map(({id, icono:Icono, nombre, atajo})=>(
                  <button key={id}
                  className={`${s.herramienta} ${activa === id ? s.activa : ''}`}
                  onClick={()  => onSeleccionar(id)}
                  aria-label={nombre}>

                    <Icono size={20} strokeWidth={1.75} />
                    <span className={s.ayuda}>{nombre} <kbd>{atajo}</kbd></span>
                  </button>
                )
                )}
                
                </div>
            ))}
        </nav>
    )
}