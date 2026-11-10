import { Rect, Text} from'react-konva';
import {AREAS, COLOR_SIN_AREA} from '../../src/data/areas.js'

export default function Estante({objeto, m}) {

    const ancho = m(objeto.ancho);
    const alto = m(objeto.alto);
    const comps = objeto.compartimentos?.length ? objeto.compartimentos : [{ areas: [] }];
    const anchoComp = ancho / comps.length;
    


    return(
        <>
        {comps.map((comp, i) => {
           const partes = comp.areas?.length ? comp.areas : [null];
            const anchoparte = anchoComp / partes.length;

            return(partes.map((area, j) => (

                <Rect key={`${i}-${j}`} 
                x={i * anchoComp + j * anchoparte} 
                width={anchoparte} 
                height={alto} 
                stroke="#0f172a" 
                strokeWidth={j === 0 ? 1 : 0.5} 
                dash={j === 0 ? undefined : [2, 2]} 
                fill={AREAS[area]?.color ?? COLOR_SIN_AREA} />
            )))

        })
        
        }
        <Rect width={ancho} height={alto} stroke="#0f172a" strokeWidth={1.5}
            cornerRadius={2} listening={false} />
            
        <Text 
        text={objeto.codigo}
        width={ancho}
        height={alto}
        align="center"
        verticalAlign="middle"
        fontSize={11}
        fontStyle="bold"
        fill="#ffffff"
        shadowColor="#000000"
        shadowBlur={3}
        shadowOpacity={0.8}
        listening={false} 
        />
        

        </>
    )
  }