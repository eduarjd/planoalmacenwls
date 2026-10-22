function Area_estilos(){
    const estilos = [
        {name: "Soldadura", color: "#FF0000"},
        {name: "Electromecanica", color: "#00FF00"},
        {name:  "Consumibles", color: "#0000FF"},
        {name:  "Electricidad", color: "#FFFF00"},
        {name: "Plomeria", color: "#FF00FF"},
        {name: "Limpieza",color: "#00FFFF"},
        {name: "Seguridad", color: "#800080"},
        {name:"Herramientas", color: "#FFA500"},
        {name:"Respuestos Automotrices", color: "#008000"},
        {name:"Guaya Fina", color:  "#A52A2A"},
        {name:"Llaves Hidráulicas", color: "#0d9488"},
        {name:"Papelería", color: "#f59e0b"},
        {name:"Almacén", color: "#65a30d"},
        {name:"Repuestos Varios", color: "#78350f"},
        {name: "Comida",color: "#f43f5e"},
        {name:"Archivo", color: "#64748b"}
    ]
    
    return(
        <div className="area-estilos">
            <h4>Propiedades</h4>
            <span>Selecciona cualquier objeto, pared o texto en el plano para editarlo.</span>
            {estilos.map((estilo)=>(
                <div className="">
                    <div className="" style={estilo.color}></div>
                    <span>{estilo.name}</span>
                </div>
            ))}
        </div>
    )
}
export default Area_estilos;