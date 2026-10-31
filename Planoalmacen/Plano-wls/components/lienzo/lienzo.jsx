import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Group, Text, Transformer } from 'react-konva';
import { usePlano, PLANO } from '../../src/store/usePlano';
import s from './Lienzo.module.css';
const MARGEN = 40 
const AJUSTE = 0.05 /*Ajuste de los  objetos*/
const ajustar = v => Math.round(v/AJUSTE)


export default function Lienzo(){
  const contenedor = useRef(null);
  const trRef = useRef(null);
  const nodos = useRef({});
  const [tam, setTam] = useState({ w: 800, h: 500 });
  const [zoom, setZoom] = useState(1);

    const {objetos, seleccionado, seleccionar, actualizar } = usePlano();
     
    useEffect(() => {
    const ro = new ResizeObserver(([e]) =>
     setTam({ w: e.contentRect.width, h: e.contentRect.height }));
     ro.observe(contenedor.current);
     return () => ro.disconnect();
  }, []);
    
    const escalaBase = Math.min(
    (tam.w - MARGEN * 2) / PLANO.largo,
    (tam.h - MARGEN * 2) / PLANO.ancho,
  );
  const esc = escalaBase * zoom 
  const m = metros => metros  * esc
  // Conectar el Transformer al objeto seleccionado
  useEffect(() => {
    const nodo = nodos.current[seleccionado];
    trRef.current?.nodes(nodo ? [nodo] : []);
    trRef.current?.getLayer()?.batchDraw();
  }, [seleccionado, objetos]);

  const alRueda = e => {
    e.evt.preventDefault();
    const factor = e.evt.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(4, Math.max(0.5, z * factor)));
  };

  // Cuadrícula cada 0,5 m
  const lineas = [];
  for (let x = 0; x <= PLANO.largo; x += 0.5)
    lineas.push(<Line key={'v' + x} points={[m(x), 0, m(x), m(PLANO.ancho)]} stroke="#e2e8f0" strokeWidth={1} />);
  for (let y = 0; y <= PLANO.ancho; y += 0.5)
    lineas.push(<Line key={'h' + y} points={[0, m(y), m(PLANO.largo), m(y)]} stroke="#e2e8f0" strokeWidth={1} />);

  return (
    <div ref={contenedor} className={s.lienzo}>
      <Stage
        width={tam.w}
        height={tam.h}
        draggable
        onWheel={alRueda}
        onMouseDown={e => { if (e.target === e.target.getStage()) seleccionar(null); }}
      >
        <Layer x={MARGEN} y={MARGEN}>
          {/* Piso del almacén */}
          <Rect width={m(PLANO.largo)} height={m(PLANO.ancho)} fill="#ffffff"
                onMouseDown={() => seleccionar(null)} />
          {lineas}
          {/* Paredes perimetrales */}
          <Rect width={m(PLANO.largo)} height={m(PLANO.ancho)}
                stroke="#1e293b" strokeWidth={6} listening={false} />

          {/* Cotas */}
          <Text text={`${PLANO.largo.toString().replace('.', ',')} m`} x={m(PLANO.largo) / 2 - 30} y={-28}
                fontSize={14} fontStyle="bold" fill="#334155" />
          <Text text={`${PLANO.ancho.toString().replace('.', ',')} m`} x={-30} y={m(PLANO.ancho) / 2 + 20}
                rotation={-90} fontSize={14} fontStyle="bold" fill="#334155" />

          {objetos.map(o => (
            <Group
              key={o.id}
              ref={n => (nodos.current[o.id] = n)}
              x={m(o.x)} y={m(o.y)}
              rotation={o.rotacion}
              draggable
              onMouseDown={() => seleccionar(o.id)}
              onDragEnd={e => actualizar(o.id, {
                x: ajustar(e.target.x() / esc),
                y: ajustar(e.target.y() / esc),
              })}
              onTransformEnd={e => {
                const n = e.target;
                actualizar(o.id, {
                  x: ajustar(n.x() / esc),
                  y: ajustar(n.y() / esc),
                  ancho: Math.max(0.1, ajustar(o.ancho * n.scaleX())),
                  alto: Math.max(0.1, ajustar(o.alto * n.scaleY())),
                  rotacion: Math.round(n.rotation()),
                });
                n.scale({ x: 1, y: 1 });
              }}
            >
              <Rect width={m(o.ancho)} height={m(o.alto)} fill={o.color}
                    cornerRadius={3} stroke="#0f172a" strokeWidth={1} opacity={0.9} />
              <Text text={o.codigo} width={m(o.ancho)} height={m(o.alto)}
                    align="center" verticalAlign="middle"
                    fontSize={11} fontStyle="bold" fill="#fff" listening={false} />
            </Group>
          ))}

          <Transformer
            ref={trRef}
            rotationSnaps={[0, 90, 180, 270]}
            anchorSize={8}
            borderStroke="#3b82f6"
            anchorStroke="#3b82f6"
            anchorCornerRadius={2}
          />
        </Layer>
      </Stage>

      <div className={s.zoom}>
        <button onClick={() => setZoom(z => Math.max(0.5, z * 0.9))}>−</button>
        <span>{Math.round(zoom * 100)} %</span>
        <button onClick={() => setZoom(z => Math.min(4, z * 1.1))}>+</button>
        <button onClick={() => setZoom(1)}>Ajustar</button>
      </div>
    </div>
  );
}

