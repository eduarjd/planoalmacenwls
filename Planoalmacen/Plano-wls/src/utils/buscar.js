import { AREAS } from '../data/areas';

// Quita mayúsculas y acentos para que "plomeria" encuentre "Plomería"
export const normalizar = texto =>
  String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const MAX_RESULTADOS = 30;

/**
 * Busca en todo el plano: estantes y objetos, artículos y áreas.
 * Un código de artículo idéntico al buscado va primero ("exacto").
 */
export function buscarEnPlano(objetos, consulta) {
  const q = normalizar(consulta);
  if (q.length < 2) return [];

  const resultados = [];

  for (const o of objetos) {
    const codigo = normalizar(o.codigo);

    // 1. El estante u objeto por su código o título
    if (codigo.includes(q) || normalizar(o.titulo).includes(q)) {
      resultados.push({
        id: `obj-${o.id}`,
        tipo: o.tipo === 'estante' ? 'estante' : 'objeto',
        exacto: codigo === q,
        titulo: o.codigo || 'Sin nombre',
        detalle: o.tipo === 'estante'
          ? `${o.compartimentos.length} compartimentos · ${contarArticulos(o)} artículos`
          : o.tipo,
        objetoId: o.id,
      });
    }

    if (o.tipo !== 'estante') continue;

    o.compartimentos.forEach((c, i) => {
      // 2. Los artículos por nombre, código o equivalencia
      for (const a of c.articulos) {
        const codigoArt = normalizar(a.codigo);
        const coincideCodigo = codigoArt && codigoArt.includes(q);
        const coincideNombre = normalizar(a.nombre).includes(q);
        const coincideEquiv = normalizar(a.equivalencia).includes(q);
        if (!coincideCodigo && !coincideNombre && !coincideEquiv) continue;

        resultados.push({
          id: `art-${a.id}`,
          tipo: 'articulo',
          exacto: codigoArt === q,
          titulo: a.nombre || 'Artículo sin nombre',
          detalle: [
            `${o.codigo} · C${i + 1}`,
            a.codigo && `Cód. ${a.codigo}`,
            a.equivalencia && `Eq. ${a.equivalencia}`,
          ].filter(Boolean).join(' · '),
          objetoId: o.id,
          compartimento: i,
          articuloId: a.id,
        });
      }

      c.areas.forEach(clave => {
        const area = AREAS[clave];
        if (area && normalizar(area.nombre).includes(q)) {
          resultados.push({
            id: `area-${o.id}-${i}-${clave}`,
            tipo: 'area',
            exacto: false,
            titulo: `${o.codigo} · Compartimento ${i + 1}`,
            detalle: area.nombre,
            color: area.color,
            objetoId: o.id,
            compartimento: i,
          });
        }
      });
    });
  }

  // Exactos primero; luego artículos, estantes, objetos y áreas
  const orden = { articulo: 0, estante: 1, objeto: 2, area: 3 };
  resultados.sort((a, b) => (b.exacto - a.exacto) || (orden[a.tipo] - orden[b.tipo]));

  return resultados.slice(0, MAX_RESULTADOS);
}

function contarArticulos(estante) {
  return estante.compartimentos.reduce((t, c) => t + c.articulos.length, 0);

}