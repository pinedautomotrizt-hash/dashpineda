import React from 'react';
import RepuestoIcono from './RepuestoIcono';
import { estadoMuestra, kmText, zonaColor } from './kpiLabels';

// Posicion de cada pieza sobre la silueta del vehiculo (coordenadas del
// viewBox 0 0 760 340). El punto `ancla` es donde nace la linea guia y cae
// sobre la zona real del auto; la tarjeta se dibuja al costado para que el
// dibujo no quede tapado.
const PIEZAS = Object.freeze([
  { id: 'disco-freno', ancla: [196, 250], tarjeta: [24, 24], lado: 'izq' },
  { id: 'pastillas-freno', ancla: [196, 250], tarjeta: [24, 108], lado: 'izq' },
  { id: 'amortiguador', ancla: [214, 205], tarjeta: [24, 192], lado: 'izq' },
  { id: 'rotula', ancla: [186, 272], tarjeta: [24, 276], lado: 'izq' },
  { id: 'bomba-agua', ancla: [258, 168], tarjeta: [592, 24], lado: 'der' },
  { id: 'correa-distribucion', ancla: [238, 180], tarjeta: [592, 108], lado: 'der' },
  { id: 'bateria', ancla: [292, 152], tarjeta: [592, 192], lado: 'der' },
  { id: 'embrague', ancla: [372, 226], tarjeta: [592, 276], lado: 'der' },
  { id: 'bomba-combustible', ancla: [520, 232], tarjeta: [332, 300], lado: 'centro' },
]);

const ANCHO_TARJETA = 144;
const ALTO_TARJETA = 64;

function puntoDeEntrada(pieza) {
  const [x, y] = pieza.tarjeta;
  if (pieza.lado === 'izq') return [x + ANCHO_TARJETA, y + ALTO_TARJETA / 2];
  if (pieza.lado === 'der') return [x, y + ALTO_TARJETA / 2];
  return [x + ANCHO_TARJETA / 2, y];
}

export default function VehiculoDespiece({ resumen, muestraMinima, seleccionado, onSeleccionar }) {
  const porId = Object.fromEntries((resumen || []).map((fila) => [fila.id, fila]));

  return (
    // El SVG escala su tipografia junto con el viewBox: sin un tope de ancho,
    // el texto de las tarjetas se ve desproporcionado en pantallas grandes.
    <svg
      viewBox="0 0 760 380"
      className="mx-auto h-auto w-full max-w-[920px]"
      role="img"
      aria-label="Despiece del vehículo con la vida útil de cada repuesto"
    >
      <title>Despiece del vehículo por repuesto</title>

      {/* ---------------------------------------------------- silueta del auto */}
      <g stroke="#94a3b8" strokeWidth="2.5" fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M118 262
             L118 226
             q0-14 16-18
             l58-14
             l46-40
             q10-8 24-8
             h104
             q16 0 26 10
             l44 44
             l92 12
             q28 4 28 26
             v50
             h-44"
          fill="#f1f5f9"
        />
        <path d="M196 262h164" />
        {/* parabrisas y ventanas: dan escala y hacen legible la silueta */}
        <path d="M250 158l38-34q6-6 16-6h30v40Z" fill="#e2e8f0" />
        <path d="M346 158v-40h56q10 0 16 6l34 34Z" fill="#e2e8f0" />
      </g>

      {/* ruedas */}
      <g>
        <circle cx="196" cy="262" r="40" fill="#1e293b" />
        <circle cx="196" cy="262" r="20" fill="#cbd5e1" />
        <circle cx="556" cy="262" r="40" fill="#1e293b" />
        <circle cx="556" cy="262" r="20" fill="#cbd5e1" />
      </g>

      {/* ------------------------------------------------ tarjeta de cada pieza */}
      {PIEZAS.map((pieza) => {
        const fila = porId[pieza.id];
        if (!fila) return null;

        const estado = estadoMuestra(fila, muestraMinima);
        const color = zonaColor(fila.zona);
        const activo = seleccionado === pieza.id;
        const [cx, cy] = pieza.ancla;
        const [ex, ey] = puntoDeEntrada(pieza);
        const [tx, ty] = pieza.tarjeta;

        return (
          <g key={pieza.id}>
            <line
              x1={ex}
              y1={ey}
              x2={cx}
              y2={cy}
              stroke={activo ? color : '#cbd5e1'}
              strokeWidth={activo ? 2 : 1.25}
              strokeDasharray="4 4"
            />
            <circle cx={cx} cy={cy} r={activo ? 7 : 5} fill={color} opacity={activo ? 1 : 0.75} />
            {activo && <circle cx={cx} cy={cy} r="12" fill={color} opacity="0.2" />}

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
              aria-label={`${fila.label}: ${kmText(fila.mttf)} de vida útil media`}
            >
              <rect
                x={tx}
                y={ty}
                width={ANCHO_TARJETA}
                height={ALTO_TARJETA}
                rx="10"
                fill="#ffffff"
                stroke={activo ? color : '#e2e8f0'}
                strokeWidth={activo ? 2.5 : 1.5}
              />
              {/* franja de color: identifica la zona del vehiculo de un vistazo */}
              <rect x={tx} y={ty} width="5" height={ALTO_TARJETA} rx="2.5" fill={color} />
              <g transform={`translate(${tx + 12}, ${ty + 14})`}>
                <RepuestoIcono id={pieza.id} color={color} size={36} />
              </g>
              <text x={tx + 56} y={ty + 22} fontSize="11" fontWeight="600" fill="#334155">
                {fila.label.length > 16 ? `${fila.label.slice(0, 15)}…` : fila.label}
              </text>
              <text x={tx + 56} y={ty + 40} fontSize="14" fontWeight="700" fill="#0f172a">
                {fila.mttf ? `${Math.round(fila.mttf / 1000)}k km` : '—'}
              </text>
              <circle cx={tx + 60} cy={ty + 52} r="3.5" fill={estado.color} />
              <text x={tx + 68} y={ty + 55} fontSize="9" fill="#64748b">
                {fila.n ? `${fila.n} ${fila.n === 1 ? 'medición' : 'mediciones'}` : '—'}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
