import React from 'react';
import RepuestoIcono from './RepuestoIcono';
import { estadoMuestra, kmText, zonaColor } from './kpiLabels';

// Vista explosionada: el vehiculo queda como referencia en trazo tenue y cada
// pieza medida se dibuja aparte, en grande, unida a su posicion real por una
// linea de fuga.
//
// Todo lo que aparece dibujado corresponde a algo que el modulo mide: no hay
// piezas decorativas. Se dibuja en SVG y no con un modelo 3D porque el despiece
// exige que cada pieza sea un elemento propio y clicable, y los modelos GLTF
// disponibles vienen agrupados por material, no por componente.

const VB = { w: 1160, h: 740 };
const FICHA = { w: 152, h: 146 };

// Encaje del dibujo del vehiculo dentro del lienzo.
const VEHICULO = { escala: 0.815, dx: 180, dy: 89 };

const pv = (x, y) => [x * VEHICULO.escala + VEHICULO.dx, y * VEHICULO.escala + VEHICULO.dy];

// Silueta de pick-up: es la carroceria mas representativa de la flota medida
// (Hilux, L200, Ranger y Frontier concentran la mayoria de los intervalos).
const CARROCERIA = `
  M 245 420 L 245 382 Q 245 367 259 363 L 452 356 L 506 300 L 618 300
  L 652 356 L 652 344 L 852 344 Q 864 344 864 356 L 864 420
  L 790 420 A 55 55 0 0 0 680 420 L 420 420 A 55 55 0 0 0 310 420 Z
`;

// El reparto no es estetico: cada ficha va del lado donde cae su anclaje, para
// que las lineas de fuga no se crucen. Tren delantero a la izquierda, vano
// motor arriba, transmision y combustible a la derecha.
const PIEZAS = Object.freeze([
  { n: 1, id: 'amortiguador', ancla: [365, 386], ficha: [24, 20], lado: 'izq' },
  { n: 2, id: 'disco-freno', ancla: [350, 430], ficha: [24, 186], lado: 'izq' },
  { n: 3, id: 'pastillas-freno', ancla: [386, 446], ficha: [24, 352], lado: 'izq' },
  { n: 4, id: 'rotula', ancla: [328, 456], ficha: [24, 518], lado: 'izq' },
  { n: 5, id: 'bomba-agua', ancla: [296, 366], ficha: [360, 16], lado: 'arriba' },
  { n: 6, id: 'correa-distribucion', ancla: [330, 376], ficha: [530, 16], lado: 'arriba' },
  { n: 7, id: 'bateria', ancla: [398, 362], ficha: [700, 16], lado: 'arriba' },
  { n: 8, id: 'embrague', ancla: [492, 400], ficha: [984, 230], lado: 'der' },
  { n: 9, id: 'bomba-combustible', ancla: [640, 412], ficha: [984, 420], lado: 'der' },
]);

function entradaDeLinea({ ficha: [x, y], lado }) {
  if (lado === 'izq') return [x + FICHA.w, y + FICHA.h / 2];
  if (lado === 'der') return [x, y + FICHA.h / 2];
  return [x + FICHA.w / 2, y + FICHA.h];
}

export default function VehiculoDespiece({ resumen, muestraMinima, seleccionado, onSeleccionar }) {
  const porId = Object.fromEntries((resumen || []).map((fila) => [fila.id, fila]));

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className="mx-auto h-auto w-full max-w-[1140px]"
      role="img"
      aria-label="Vista explosionada del vehículo con la vida útil de cada repuesto"
    >
      <title>Vista explosionada por repuesto</title>

      <defs>
        {/* Retícula de fondo: da lectura de plano sin competir con el dibujo. */}
        <pattern id="kpi-reticula" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="#eef2f7" strokeWidth="0.7" />
        </pattern>
      </defs>

      <rect x="0" y="0" width={VB.w} height={VB.h} fill="url(#kpi-reticula)" />
      <rect x="0.5" y="0.5" width={VB.w - 1} height={VB.h - 1} fill="none" stroke="#cbd5e1" strokeWidth="1" />

      {/* ------------------------------------------- vehículo de referencia */}
      <g transform={`translate(${VEHICULO.dx},${VEHICULO.dy}) scale(${VEHICULO.escala})`}>
        <path d={CARROCERIA} fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
        <path d="M510 306 L552 306 L552 352 L468 352 Z" fill="#eef2f7" stroke="#cbd5e1" strokeWidth="1.4" />
        <path d="M560 306 L612 306 L638 352 L560 352 Z" fill="#eef2f7" stroke="#cbd5e1" strokeWidth="1.4" />
        <path d="M652 344 L652 420 M452 356 L452 420" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="5 4" />
        <path d="M228 480 H 884" stroke="#e2e8f0" strokeWidth="1.4" />
        {[365, 735].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="434" r="46" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.6" />
            <circle cx={cx} cy="434" r="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4" />
          </g>
        ))}
      </g>

      {/* ------------------------------------------------ ficha de cada pieza */}
      {PIEZAS.map((pieza) => {
        const fila = porId[pieza.id];
        if (!fila) return null;

        const estado = estadoMuestra(fila, muestraMinima);
        const color = zonaColor(fila.zona);
        const activo = seleccionado === pieza.id;
        const [ax, ay] = pv(...pieza.ancla);
        const [ex, ey] = entradaDeLinea(pieza);
        const [fx, fy] = pieza.ficha;

        return (
          <g key={pieza.id}>
            {/* línea de fuga: une la ficha con la posición real de la pieza */}
            <line
              x1={ex}
              y1={ey}
              x2={ax}
              y2={ay}
              stroke={activo ? color : '#cbd5e1'}
              strokeWidth={activo ? 1.6 : 1.1}
              strokeDasharray="6 5"
            />
            <circle cx={ax} cy={ay} r="9" fill={color} fillOpacity={activo ? 0.3 : 0.18} />
            <circle cx={ax} cy={ay} r={activo ? 6 : 4.5} fill={color} />

            <g
              role="button"
              tabIndex={0}
              className="cursor-pointer outline-none"
              onClick={() => onSeleccionar(pieza.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSeleccionar(pieza.id);
                }
              }}
              aria-label={`${pieza.n}. ${fila.label}: ${kmText(fila.mttf)}`}
            >
              <rect
                x={fx}
                y={fy}
                width={FICHA.w}
                height={FICHA.h}
                rx="6"
                fill="#ffffff"
                stroke={activo ? color : '#e2e8f0'}
                strokeWidth={activo ? 2 : 1}
              />
              {/* globo numerado, como en un plano de taller */}
              <circle cx={fx + 16} cy={fy + 16} r="11" fill={color} />
              <text x={fx + 16} y={fy + 20} fontSize="11" fontWeight="700" fill="#ffffff" textAnchor="middle">
                {String(pieza.n).padStart(2, '0')}
              </text>

              <g transform={`translate(${fx + 36},${fy + 8})`}>
                <RepuestoIcono id={pieza.id} color={color} size={82} />
              </g>

              <text x={fx + FICHA.w / 2} y={fy + 104} fontSize="10.5" fontWeight="600" fill="#334155" textAnchor="middle">
                {fila.label.toUpperCase()}
              </text>
              <text
                x={fx + FICHA.w / 2}
                y={fy + 126}
                fontSize="19"
                fontWeight="700"
                fill={fila.confiable ? '#0f172a' : '#94a3b8'}
                textAnchor="middle"
              >
                {fila.mttf ? `${Math.round(fila.mttf / 1000)}k km` : '—'}
              </text>
              <circle cx={fx + FICHA.w / 2 - 22} cy={fy + 136} r="3" fill={estado.color} />
              <text x={fx + FICHA.w / 2 - 14} y={fy + 139} fontSize="9" fill="#64748b">
                {fila.n ? `n = ${fila.n}` : '—'}
              </text>
            </g>
          </g>
        );
      })}

      {/* ----------------------------------------------------- cajetín técnico */}
      <g>
        <rect x={VB.w - 256} y={VB.h - 54} width="240" height="40" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <line x1={VB.w - 256} y1={VB.h - 36} x2={VB.w - 16} y2={VB.h - 36} stroke="#e2e8f0" strokeWidth="1" />
        <text x={VB.w - 246} y={VB.h - 41} fontSize="9" fontWeight="700" fill="#334155" letterSpacing="1.4">
          VISTA EXPLOSIONADA
        </text>
        <text x={VB.w - 246} y={VB.h - 22} fontSize="8.5" fill="#64748b">
          Vida útil por repuesto · 09 componentes
        </text>
      </g>
    </svg>
  );
}
