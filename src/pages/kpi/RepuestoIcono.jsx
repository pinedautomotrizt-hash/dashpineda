import React from 'react';

// Dibujos tecnicos de las piezas cuya vida util mide el modulo KPI.
//
// Se dibujan en SVG en linea, no como imagenes, por tres razones: escalan sin
// perder nitidez, toman el color de su zona en tiempo de render, y cada pieza
// es un elemento propio que puede responder al click en el despiece.
//
// Todas comparten el lienzo 0 0 120 120 para que mantengan la misma escala
// relativa entre si.

// Tinte claro de un color: se mezcla con blanco en vez de usar hex de 8 digitos
// porque el canal alfa en el fill no lo soportan todos los motores de render.
function tinte(hex, mezcla = 0.88) {
  const n = parseInt(hex.slice(1), 16);
  const mez = (v) => Math.round(v + (255 - v) * mezcla);
  const r = mez((n >> 16) & 255);
  const g = mez((n >> 8) & 255);
  const b = mez(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const DIBUJOS = {
  'pastillas-freno': (c, t) => (
    <>
  {/* pastilla trasera, desplazada para dar profundidad */}
  <path d="M34 34 h46 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-46 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4 z"
        fill={t} stroke={c} strokeWidth="2"/>
  <path d="M30 44 h54" stroke={c} strokeWidth="1.2" opacity="0.7"/>
  {/* pastilla delantera */}
  <path d="M26 56 h46 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-46 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4 z"
        fill="#ffffff" stroke={c} strokeWidth="2"/>
  {/* material de friccion: rayado tecnico */}
  <path d="M26 66 h50" stroke={c} strokeWidth="1.2"/>
  <g stroke={c} strokeWidth="1" opacity="0.55">
    <path d="M30 66 v14 M38 66 v14 M46 66 v14 M54 66 v14 M62 66 v14 M70 66 v14"/>
  </g>
  {/* orejas de anclaje */}
  <path d="M76 62 h10 v6 h-10" fill="none" stroke={c} strokeWidth="1.6"/>
  <path d="M84 36 h10 v6 h-10" fill="none" stroke={c} strokeWidth="1.6"/>
    </>
  ),
  'disco-freno': (c, t) => (
    <>
  {/* canto del disco (espesor) */}
  <ellipse cx="66" cy="60" rx="30" ry="38" fill={t} stroke={c} strokeWidth="1.5"/>
  <path d="M56 24 h10 M56 96 h10" stroke={c} strokeWidth="1.5"/>
  {/* cara de friccion */}
  <ellipse cx="56" cy="60" rx="30" ry="38" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <ellipse cx="56" cy="60" rx="20" ry="25" fill="none" stroke={c} strokeWidth="1.2" opacity="0.6"/>
  {/* campana y agujeros de rueda */}
  <ellipse cx="56" cy="60" rx="11" ry="14" fill={t} stroke={c} strokeWidth="1.6"/>
  <ellipse cx="56" cy="60" rx="4" ry="5" fill="#ffffff" stroke={c} strokeWidth="1.2"/>
  <g fill="#ffffff" stroke={c} strokeWidth="1.1">
    <ellipse cx="56" cy="48" rx="2" ry="2.6"/>
    <ellipse cx="65" cy="56" rx="2" ry="2.6"/>
    <ellipse cx="62" cy="69" rx="2" ry="2.6"/>
    <ellipse cx="50" cy="69" rx="2" ry="2.6"/>
    <ellipse cx="47" cy="56" rx="2" ry="2.6"/>
  </g>
    </>
  ),
  'amortiguador': (c, t) => (
    <>
  {/* vastago y ojal superior */}
  <circle cx="60" cy="16" r="8" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="60" cy="16" r="3.4" fill={t} stroke={c} strokeWidth="1.2"/>
  <path d="M60 24 v16" stroke={c} strokeWidth="3.4"/>
  {/* muelle helicoidal */}
  <g fill="none" stroke={c} strokeWidth="2" opacity="0.85">
    <path d="M44 44 q16 -8 32 0"/>
    <path d="M44 54 q16 -8 32 0"/>
    <path d="M44 64 q16 -8 32 0"/>
    <path d="M44 74 q16 -8 32 0"/>
    <path d="M44 84 q16 -8 32 0"/>
  </g>
  {/* cuerpo / cilindro */}
  <rect x="52" y="40" width="16" height="52" rx="4" fill={t} stroke={c} strokeWidth="2"/>
  <path d="M52 50 h16 M52 84 h16" stroke={c} strokeWidth="1.1" opacity="0.6"/>
  {/* ojal inferior */}
  <circle cx="60" cy="102" r="8" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="60" cy="102" r="3.4" fill={t} stroke={c} strokeWidth="1.2"/>
    </>
  ),
  'rotula': (c, t) => (
    <>
  {/* esparrago conico con rosca */}
  <path d="M55 8 h10 v6 h-10 z" fill="#ffffff" stroke={c} strokeWidth="1.6"/>
  <path d="M55 14 h10 l4 20 h-18 z" fill={t} stroke={c} strokeWidth="2"/>
  <g stroke={c} strokeWidth="0.9" opacity="0.65">
    <path d="M56 19 h8 M55.5 24 h9.5 M55 29 h11"/>
  </g>
  {/* guardapolvo de fuelle */}
  <path d="M51 34 h18 l5 8 h-28 z" fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  <path d="M48 42 h24 l3 8 h-30 z" fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  {/* carcasa cilindrica */}
  <path d="M43 50 h34 v22 a17 11 0 0 1 -34 0 z" fill={t} stroke={c} strokeWidth="2"/>
  <ellipse cx="60" cy="50" rx="17" ry="6" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <ellipse cx="60" cy="50" rx="8" ry="3" fill={t} stroke={c} strokeWidth="1.2"/>
  <path d="M43 62 h34" stroke={c} strokeWidth="1" opacity="0.55"/>
  {/* brida de anclaje al trapecio */}
  <path d="M34 84 h52 v12 h-52 z" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <path d="M52 78 h16 v6 h-16 z" fill={t} stroke={c} strokeWidth="1.6"/>
  <circle cx="42" cy="90" r="3.2" fill={t} stroke={c} strokeWidth="1.2"/>
  <circle cx="78" cy="90" r="3.2" fill={t} stroke={c} strokeWidth="1.2"/>
    </>
  ),
  'bomba-agua': (c, t) => (
    <>
  {/* brida de montaje con tornilleria */}
  <circle cx="54" cy="60" r="34" fill={t} stroke={c} strokeWidth="2"/>
  <g fill="#ffffff" stroke={c} strokeWidth="1.2">
    <circle cx="54" cy="30" r="3.2"/><circle cx="54" cy="90" r="3.2"/>
    <circle cx="24" cy="60" r="3.2"/><circle cx="84" cy="60" r="3.2"/>
    <circle cx="33" cy="39" r="3.2"/><circle cx="75" cy="81" r="3.2"/>
  </g>
  {/* cuerpo y turbina */}
  <circle cx="54" cy="60" r="22" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <g fill="none" stroke={c} strokeWidth="1.6" opacity="0.8">
    <path d="M54 60 q10 -12 16 -4"/>
    <path d="M54 60 q12 8 6 15"/>
    <path d="M54 60 q-6 14 -15 8"/>
    <path d="M54 60 q-13 -6 -8 -15"/>
    <path d="M54 60 q2 -15 13 -13"/>
  </g>
  <circle cx="54" cy="60" r="6" fill={t} stroke={c} strokeWidth="1.6"/>
  {/* eje y polea */}
  <path d="M76 56 h16 v8 h-16" fill={t} stroke={c} strokeWidth="1.6"/>
  <rect x="90" y="46" width="10" height="28" rx="3" fill="#ffffff" stroke={c} strokeWidth="2"/>
    </>
  ),
  'correa-distribucion': (c, t) => (
    <>
  {/* banda: tangentes externas entre la polea de ciguenal y la de levas */}
  <path d="M 64.9 89.5 A 26 26 0 1 0 29.6 52.3 L 72.6 23.8 A 17 17 0 0 0 95.6 48.1 Z"
        fill={t} stroke={c} strokeWidth="2"/>
  <path d="M 60.8 86.5 A 21 21 0 1 0 32.4 56.5 L 75.4 28 A 12 12 0 0 0 91.6 45.2 Z"
        fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  {/* dentado sobre el tramo recto de la banda */}
  <g stroke={c} strokeWidth="1.2" opacity="0.65">
    <path d="M36.5 54.5 l3.6 -2.7 M43.5 49.8 l3.6 -2.7 M50.5 45.1 l3.6 -2.7"/>
    <path d="M57.5 40.4 l3.6 -2.7 M64.5 35.7 l3.6 -2.7"/>
  </g>
  {/* poleas */}
  <circle cx="44" cy="74" r="14" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="44" cy="74" r="5" fill={t} stroke={c} strokeWidth="1.4"/>
  <circle cx="82" cy="38" r="8" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="82" cy="38" r="3" fill={t} stroke={c} strokeWidth="1.3"/>
    </>
  ),
  'bomba-combustible': (c, t) => (
    <>
  {/* brida superior y conector */}
  <ellipse cx="58" cy="22" rx="26" ry="8" fill={t} stroke={c} strokeWidth="2"/>
  <rect x="68" y="8" width="14" height="12" rx="2" fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  <path d="M72 8 v-4 M78 8 v-4" stroke={c} strokeWidth="1.6"/>
  {/* salida de presion */}
  <path d="M34 20 h-14 v-8" fill="none" stroke={c} strokeWidth="2.2"/>
  {/* cuerpo del modulo */}
  <path d="M32 22 v52 q0 8 8 8 h36 q8 0 8 -8 v-52" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <path d="M32 40 h52 M32 58 h52" stroke={c} strokeWidth="1" opacity="0.55"/>
  {/* filtro de succion */}
  <path d="M40 82 q18 16 36 0 v10 q-18 14 -36 0 z" fill={t} stroke={c} strokeWidth="2"/>
  <g stroke={c} strokeWidth="0.9" opacity="0.6">
    <path d="M46 86 v10 M54 88 v10 M62 88 v10 M70 86 v10"/>
  </g>
    </>
  ),
  'bateria': (c, t) => (
    <>
  {/* cara superior en perspectiva */}
  <path d="M24 40 l20 -14 h56 l-20 14 z" fill={t} stroke={c} strokeWidth="2"/>
  {/* bornes */}
  <ellipse cx="38" cy="33" rx="6" ry="3.4" fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  <ellipse cx="86" cy="33" rx="6" ry="3.4" fill="#ffffff" stroke={c} strokeWidth="1.8"/>
  <path d="M35 33 h6 M38 31 v4" stroke={c} strokeWidth="1.4"/>
  <path d="M83 33 h6" stroke={c} strokeWidth="1.4"/>
  {/* tapones de ventilacion */}
  <g fill="#ffffff" stroke={c} strokeWidth="1.1">
    <ellipse cx="54" cy="35" rx="4" ry="2.4"/>
    <ellipse cx="64" cy="35" rx="4" ry="2.4"/>
    <ellipse cx="74" cy="35" rx="4" ry="2.4"/>
  </g>
  {/* caja */}
  <path d="M24 40 h56 v44 h-56 z" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <path d="M80 40 l20 -14 v44 l-20 14 z" fill={t} stroke={c} strokeWidth="2"/>
  {/* etiqueta */}
  <rect x="32" y="52" width="40" height="18" rx="2" fill={t} stroke={c} strokeWidth="1.3"/>
  <path d="M38 58 h28 M38 64 h20" stroke={c} strokeWidth="1.3" opacity="0.75"/>
    </>
  ),
  'embrague': (c, t) => (
    <>
  {/* disco de friccion */}
  <circle cx="60" cy="60" r="40" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="60" cy="60" r="31" fill={t} stroke={c} strokeWidth="1.4"/>
  {/* sectores del forro */}
  <g stroke={c} strokeWidth="1.2" opacity="0.7">
    <path d="M60 20 v9 M60 91 v9 M20 60 h9 M91 60 h9"/>
    <path d="M32 32 l6 6 M82 82 l6 6 M88 32 l-6 6 M38 82 l-6 6"/>
  </g>
  {/* cubo estriado */}
  <circle cx="60" cy="60" r="17" fill="#ffffff" stroke={c} strokeWidth="2"/>
  <circle cx="60" cy="60" r="8" fill={t} stroke={c} strokeWidth="1.6"/>
  <g stroke={c} strokeWidth="1.2">
    <path d="M60 52 v-4 M60 68 v4 M52 60 h-4 M68 60 h4"/>
  </g>
  {/* muelles amortiguadores */}
  <g fill="#ffffff" stroke={c} strokeWidth="1.5">
    <rect x="54" y="34" width="12" height="7" rx="3"/>
    <rect x="54" y="79" width="12" height="7" rx="3"/>
    <rect x="34" y="56" width="7" height="12" rx="3"/>
    <rect x="79" y="56" width="7" height="12" rx="3"/>
  </g>
    </>
  ),
};

export default function RepuestoIcono({ id, color = '#334155', size = 40, className = '' }) {
  const dibujar = DIBUJOS[id];
  if (!dibujar) return null;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {dibujar(color, tinte(color))}
    </svg>
  );
}
