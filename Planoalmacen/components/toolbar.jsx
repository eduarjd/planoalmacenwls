function  barra_de_botones(){
    const lista_botones  = [
        {name:"💾 Guardar", class: "btn-save"},
        {name: "↩️ Deshacer",class:"btn-guardar"},
        {name:"🔄 Restaurar",  class: "btn-restaurar"},
        {name:"⬇️ Descargar HTML", class: ""},
        {name:"+ Pared", class:""},
        {name:"+ Puerta", class:""},
        {name:"+ Ventana", class: ""},
        {name: "+ PC",  class: ""},
        {name: "+ Almacen", class: ""},
        {name: "+ Estiba", class: ""},
        {name:"+ Objeto ", class:"btn-objeto"},
        {name: "+ Texto", class: ""},
        {name: "📋 Ver Historial", class:""},
        {name: "📋 Copiar ", class: "btn-copiar"},
        {name: "📋 Pegar", class: "btn-pegar"},

    ]

    
    return(
        <div>
            <div  className="app-container">
                <strong>PLANO DE WLS ALMACEN</strong>
                {lista_botones.map((etiqueta)=>(
                    <button className={etiqueta.class}>
                        {etiqueta.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
export default barra_de_botones;