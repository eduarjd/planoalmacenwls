import { create }  from "zustand"

export const PLANO = { largo: 12.74, ancho: 5.65 };

export const usePlano = create(set =>({
    objetos:[
        {id: crypto.randomUUID(), tipo: 'estante', codigo: 'E001', x: 0.3, y: 4.6, ancho: 0.55, alto: 0.9, rotacion: 0, color: '#d97706'},
        {id: crypto.randomUUID(), tipo: 'estante', codigo: 'E002', x: 1.1, y: 4.6, ancho: 0.55, alto: 0.9, rotacion: 0, color: '#d97706' },
        { id: crypto.randomUUID(), tipo: 'estante', codigo: 'E003', x: 1.9, y: 4.6, ancho: 0.55, alto: 0.9, rotacion: 0, color: '#d97706' },
        { id: crypto.randomUUID(), tipo: 'estante', codigo: 'E004', x: 2.7, y: 4.6, ancho: 0.55, alto: 0.9, rotacion: 0, color: '#d97706' },
  ],
   seleccionado: null,
   seleccionar: id => set({ seleccionado: id }),


   actualizar:(id, cambios) => set(s => ({
      objetos: s.objetos.map(o => (o.id === id ? { ...o, ...cambios } : o)),

})),
   agregar: obj =>
     set(s => ({ objetos: [...s.objetos, { id: crypto.randomUUID(), ...obj }] 
})),

   eliminar: id => set(s=>({objetos: s.objetos.filter(o => o.id !== id),
      seleccionado: s.seleccionado === id ? null : s.seleccionado,
    })),

}))