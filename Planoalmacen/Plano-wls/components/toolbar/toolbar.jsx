import { useEffect, useRef, useState } from 'react';
import {
  Warehouse, Search, Undo2, Redo2, History, Download,
  Check, Loader2, AlertTriangle,
} from 'lucide-react';
import s from './toolbar.module.css';

function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const seg = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (seg < 5) return 'justo ahora';
  if (seg < 60) return `hace ${seg} s`;
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  return `hace ${Math.floor(min / 60)} h`;
}

function IndicadorGuardado({ estado, ultimoGuardado }) {
  // Refresca el texto "hace X s" cada 5 segundos
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  if (estado === 'guardando') {
    return (
      <span className={`${s.estado} ${s.guardando}`}>
        <Loader2 size={14} className={s.girar} /> Guardando…
      </span>
    );
  }
  if (estado === 'error') {
    return (
      <span className={`${s.estado} ${s.error}`}>
        <AlertTriangle size={14} /> Sin conexión, reintentando
      </span>
    );
  }
  return (
    <span className={`${s.estado} ${s.guardado}`}>
      <Check size={14} /> Guardado {tiempoRelativo(ultimoGuardado)}
    </span>
  );
}

export default function Toolbar({
  nombrePlano = 'Plano Almacén WLS',
  busqueda,
  onBuscar,
  puedeDeshacer,
  puedeRehacer,
  onDeshacer,
  onRehacer,
  onHistorial,
  onExportar,
  estadoGuardado = 'guardado', // 'guardado' | 'guardando' | 'error'
  ultimoGuardado,
}) {
  const inputRef = useRef(null);

  // Ctrl + K enfoca la búsqueda
  useEffect(() => {
    const manejar = e => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', manejar);
    return () => window.removeEventListener('keydown', manejar);
  }, []);

  return (
    <header className={s.barra}>
      <div className={s.marca}>
        <span className={s.logo}><Warehouse size={18} /></span>
        <span className={s.nombre}>{nombrePlano}</span>
      </div>

      <label className={s.busqueda}>
        <Search size={16} className={s.iconoBusqueda} />
        <input
          ref={inputRef}
          type="search"
          placeholder="Buscar estante, artículo, código o área…"
          value={busqueda}
          onChange={e => onBuscar(e.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div className={s.acciones}>
        <button className={s.icono} onClick={onDeshacer}
                disabled={!puedeDeshacer} title="Deshacer (Ctrl + Z)">
          <Undo2 size={18} />
        </button>
        <button className={s.icono} onClick={onRehacer}
                disabled={!puedeRehacer} title="Rehacer (Ctrl + Y)">
          <Redo2 size={18} />
        </button>

        <span className={s.divisor} />

        <button className={s.icono} onClick={onHistorial} title="Historial de cambios">
          <History size={18} />
        </button>

        <IndicadorGuardado estado={estadoGuardado} ultimoGuardado={ultimoGuardado} />

        <button className={s.primario} onClick={onExportar}>
          <Download size={16} /> Exportar
        </button>
      </div>
    </header>
  );
}