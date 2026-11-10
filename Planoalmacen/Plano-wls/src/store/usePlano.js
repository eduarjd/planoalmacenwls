import { create }  from "zustand"

export const PLANO = { largo: 12.74, ancho: 5.65 };

const nuevoId = () => crypto.randomUUID();

const art = (nombre, codigo= '', equivalencia='', cantidad= null) =>({
  id: nuevoId(), nombre, codigo, cantidad, equivalencia,
});

const comp = (areas = [], articulos = []) => ({ id: nuevoId(), areas, articulos });

const  cambiarobjeto = (estado, id, cambios) =>({
  objetos: estado.objetos.map(o => (o.id === id ? { ...o, ...cambios } : o)),
})

const cambiarComp = (objeto,  indice, fn)  => ({
  ...objeto,
  compartimentos: objeto.compartimentos.map((c, k) => (k === indice ? fn(c) : c))
})


export const usePlano = create(set =>({
    objetos: [
    { id: nuevoId(), tipo: 'estante', codigo: 'E001', titulo: '', foto: null,
      x: 0.06, y: 4.83, ancho: 0.9, alto: 0.54, rotacion: 0,
      compartimentos: [
        comp(['consumibles'], [art('Grasa multipropósito', '1120', 'Kg', 12)]),
        comp(['consumibles']), comp(['consumibles']), comp(['consumibles']), comp(['consumibles']),
      ] },

    { id: nuevoId(), tipo: 'estante', codigo: 'E002', titulo: '', foto: null,
      x: 0.85, y: 4.84, ancho: 0.9, alto: 0.54, rotacion: 0,
      compartimentos: [
        comp(['soldadura'], [art('Electrodo 7018 1/8"', '4410', '', 25), art('Electrodo 6013 3/32"', '4402', '', 8)]),
        comp(['soldadura', 'electricidad'], [art('Careta de soldar', '5120'), art('Cable THW 12', '6012', '', 3)]),
        comp(['electricidad']), comp([]), comp(['herramientas']),
      ] },

    { id: nuevoId(), tipo: 'estante', codigo: 'E004', titulo: 'E004 — CONSUMIBLES', foto: null,
      x: 2.7, y: 4.83, ancho: 0.9, alto: 0.54, rotacion: 0,
      compartimentos: [
        comp(['consumibles'], [
          art('Filtro de Aire 000573', '000573', '52058522'),
          art('Filtro de Gasoil Worldfil', '', 'WF-2020-30'),
          art('Filtro Gasoil Volco', '', ''),
        ]),
        comp(['consumibles'], [
          art('Filtro Aceite 51791', '780900', 'W-49 - B-76 - FMA'),
          art('Filtro Aceite 51792', '003389', 'B99 / LF691A'),
        ]),
        comp(['consumibles'], [art('Filtro Aceite 51792', '003389', 'W-3335')]),
        comp(['consumibles'], [
          art('Filtro Aceite 0677 John Deere', '0677', 'RE504836'),
          art('Filtro Aceite 51515', '', ''),
        ]),
        comp(['consumibles']),
      ] },

    { id: nuevoId(), tipo: 'estante', codigo: 'E013A', titulo: '', foto: null,
      x: 2.94, y: 1.9, ancho: 1.82, alto: 0.54, rotacion: 0,
      compartimentos: [
        comp(['electromecanica']), comp(['guaya_fina']), comp(['repuestos_varios']),
        comp(['plomeria']), comp(['repuestos_varios']),
      ] },
  ],
   seleccionado: null,
   
   
   foco:null,

   seleccionar: id => set({ seleccionado: id }),


   actualizar:(id, cambios) => set(s => ({
      objetos: s.objetos.map(o => (o.id === id ? { ...o, ...cambios } : o)),

})),
   agregar: obj =>
     set(s => ({ objetos: [...s.objetos, { id: nuevoId(), ...obj }] 
})),

   eliminar: id => set(s=>({objetos: s.objetos.filter(o => o.id !== id),
      seleccionado: s.seleccionado === id ? null : s.seleccionado,
    })),

})),


 CambiarCantidadCompartimentos: (id, cantidad) => set(s => cambiarObjeto(s, id, o => {
      const actuales = o.compartimentos;
      const nuevos = cantidad > actuales.length
        ? [...actuales, ...Array.from({ length: cantidad - actuales.length }, () => comp())]
        : actuales.slice(0, cantidad);
      return { ...o, compartimentos: nuevos }
    })),

 CambiarPartes(id, indice, partes) => set(s => cambiarObjeto(s, id, o => cambiarComp(o, indice, c => {
      const areas = c.areas.length ? c.areas : [''];
      const nuevas = partes > areas.length
        ? [...areas, ...Array(partes - areas.length).fill('')]
        : areas.slice(0, partes);
      return { ...c, areas: nuevas };
    }))),
  CambiarAreas()