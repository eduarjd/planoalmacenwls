import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Package, Archive, Shapes, Tag } from 'lucide-react';
import { usePlano } from '../../store/usePlano';
import { buscarEnPlano, normalizar } from '../../utils/buscar';
import s from './Busqueda.module.css';

const ICONOS = { articulo: Package, estante: Archive, objeto: Shapes, area: Tag };

export default function Busqueda() {
  const objetos = usePlano(st => st.objetos);
  const enfocar = usePlano(st => st.enfocar);

  const [texto, setTexto] = useState('');
  const [abierta, setAbierta] = useState(false);
  const [marcado, setMarcado] = useState(0);   // resultado resaltado con las flechas

  const inputRef = useRef(null);
  const cajaRef = useRef(null);
  const listaRef = useRef(null);

  const resultados = useMemo(() => buscarEnPlano(objetos, texto), [objetos, texto]);

  // Ctrl + K enfoca la búsqueda desde cualquier parte
  useEffect(() => {
    const alTeclear = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  // Clic fuera de la búsqueda la cierra
  useEffect(() => {
    const alClic = e => { if (!cajaRef.current?.contains(e.target)) setAbierta(false); };
    document.addEventListener('mousedown', alClic);
    return () => document.removeEventListener('mousedown', alClic);
  }, []);

  // Mantiene visible el resultado marcado al moverse con las flechas
  useEffect(() => {
    listaRef.current?.children[marcado]?.scrollIntoView({ block: 'nearest' });
  }, [marcado]);

  const elegir = r => {
    enfocar(r.objetoId, r.compartimento ?? null, r.articuloId ?? null);
    setAbierta(false);
    inputRef.current?.blur();
  };

  const alTecla = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierta(true);
      setMarcado(m => Math.min(m + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMarcado(m => Math.max(m - 1, 0));
    } else if (e.key === 'Enter' && resultados[marcado]) {
      e.preventDefault();
      elegir(resultados[marcado]);
    } else if (e.key === 'Escape') {
      if (texto) setTexto('');
      else inputRef.current?.blur();
      setAbierta(false);
    }
  };

  const limpiar = () => {
    setTexto('');
    setMarcado(0);
    inputRef.current?.focus();
  };

  const mostrarLista = abierta && normalizar(texto).length >= 2;

  return (
    <div className={s.busqueda} ref={cajaRef}>
      <label className={`${s.caja} ${mostrarLista ? s.cajaAbierta : ''}`}>
        <Search size={16} className={s.icono} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar estante, artículo, código o área…"
          value={texto}
          onChange={e => { setTexto(e.target.value); setAbierta(true); setMarcado(0); }}
          onFocus={() => setAbierta(true)}
          onKeyDown={alTecla}
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls="resultados-busqueda"
          aria-autocomplete="list"
        />
        {texto
          ? <button type="button" className={s.limpiar} onClick={limpiar} aria-label="Limpiar búsqueda"><X size={14} /></button>
          : <kbd className={s.atajo}>Ctrl K</kbd>}
      </label>

      {mostrarLista && (
        <div className={s.desplegable}>
          {resultados.length === 0 ? (
            <p className={s.sinResultados}>No se encontró nada para “{texto.trim()}”.</p>
          ) : (
            <>
              <ul className={s.lista} ref={listaRef} id="resultados-busqueda" role="listbox">
                {resultados.map((r, i) => {
                  const Icono = ICONOS[r.tipo];
                  return (
                    <li key={r.id} role="option" aria-selected={i === marcado}
                        className={`${s.resultado} ${i === marcado ? s.marcado : ''}`}
                        onMouseEnter={() => setMarcado(i)}
                        onMouseDown={e => { e.preventDefault(); elegir(r); }}>
                      <span className={`${s.iconoResultado} ${s[r.tipo]}`}
                            style={r.color ? { color: r.color } : undefined}>
                        <Icono size={16} />
                      </span>
                      <span className={s.textos}>
                        <span className={s.titulo}><Resaltar texto={r.titulo} consulta={texto} /></span>
                        <span className={s.detalle}><Resaltar texto={r.detalle} consulta={texto} /></span>
                      </span>
                      {r.exacto && <span className={s.exacto}>Código exacto</span>}
                    </li>
                  );
                })}
              </ul>
              <footer className={s.pie}>
                <span>{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</span>
                <span><kbd>↑</kbd><kbd>↓</kbd> moverse · <kbd>Enter</kbd> abrir · <kbd>Esc</kbd> cerrar</span>
              </footer>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Pone en negrita la parte del texto que coincide con lo buscado
function Resaltar({ texto, consulta }) {
  const q = normalizar(consulta);
  const posicion = normalizar(texto).indexOf(q);
  if (!q || posicion === -1) return texto;
  return (
    <>
      {texto.slice(0, posicion)}
      <mark>{texto.slice(posicion, posicion + q.length)}</mark>
      {texto.slice(posicion + q.length)}
    </>
  );
}