import React from 'react';

// Dibujos de cada repuesto en SVG en linea. Se usan en vez de imagenes porque
// escalan sin perder nitidez, toman el color de su zona y no agregan peticiones
// de red ni archivos que mantener.
const TRAZOS = {
  'pastillas-freno': (
    <>
      <circle cx="24" cy="24" r="13" />
      <circle cx="24" cy="24" r="4.5" />
      <path d="M11 15.5a15 15 0 0 0 0 17l-4 2.2a19.5 19.5 0 0 1 0-21.4Z" />
      <path d="M37 15.5a15 15 0 0 1 0 17l4 2.2a19.5 19.5 0 0 0 0-21.4Z" />
    </>
  ),
  'disco-freno': (
    <>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="6" />
      <path d="M24 8v4M24 36v4M8 24h4M36 24h4M13 13l3 3M32 32l3 3M35 13l-3 3M16 32l-3 3" />
    </>
  ),
  amortiguador: (
    <>
      <path d="M24 4v8M24 36v8" />
      <circle cx="24" cy="6" r="3" />
      <circle cx="24" cy="42" r="3" />
      <rect x="18" y="12" width="12" height="24" rx="3" />
      <path d="M18 17h12M18 22h12M18 27h12M18 32h12" />
    </>
  ),
  rotula: (
    <>
      <circle cx="17" cy="17" r="8" />
      <circle cx="17" cy="17" r="3" />
      <path d="M22 23l12 12" />
      <rect x="31" y="31" width="11" height="11" rx="3" transform="rotate(45 36.5 36.5)" />
    </>
  ),
  'bomba-agua': (
    <>
      <circle cx="22" cy="24" r="12" />
      <path d="M22 12v24M10 24h24" />
      <circle cx="22" cy="24" r="3.5" />
      <path d="M34 20h8v8h-8" />
    </>
  ),
  'correa-distribucion': (
    <>
      <circle cx="14" cy="30" r="8" />
      <circle cx="34" cy="17" r="6" />
      <path d="M9 36.5A9 9 0 0 1 30 12M19.5 36.5A9 9 0 0 0 38.5 22" />
      <circle cx="14" cy="30" r="2.5" />
      <circle cx="34" cy="17" r="2" />
    </>
  ),
  'bomba-combustible': (
    <>
      <rect x="10" y="14" width="20" height="24" rx="3" />
      <path d="M14 20h12M14 26h12M14 32h8" />
      <path d="M30 20h6a3 3 0 0 1 3 3v12" />
      <circle cx="39" cy="38" r="3" />
      <path d="M17 14v-4h6v4" />
    </>
  ),
  bateria: (
    <>
      <rect x="7" y="16" width="34" height="20" rx="3" />
      <path d="M14 16v-4h6v4M28 16v-4h6v4" />
      <path d="M17 26h6M20 23v6M28 26h6" />
    </>
  ),
  embrague: (
    <>
      <circle cx="24" cy="24" r="15" />
      <circle cx="24" cy="24" r="5" />
      <path d="M24 9v6M24 33v6M9 24h6M33 24h6" />
      <path d="M13.5 13.5l4.2 4.2M30.3 30.3l4.2 4.2M34.5 13.5l-4.2 4.2M17.7 30.3l-4.2 4.2" />
    </>
  ),
};

export default function RepuestoIcono({ id, color = 'currentColor', size = 40, className = '' }) {
  const trazo = TRAZOS[id];
  if (!trazo) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {trazo}
    </svg>
  );
}
