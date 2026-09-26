// Etiquetas, colores y textos de apoyo del modulo KPI.
// Vive aparte de los componentes para que la vista quede solo con estructura.

export const ZONAS = Object.freeze({
  frenos: { label: 'Frenos', color: '#dc2626' },
  suspension: { label: 'Suspensión', color: '#7c3aed' },
  motor: { label: 'Motor', color: '#0891b2' },
  combustible: { label: 'Combustible', color: '#ea580c' },
  electrico: { label: 'Eléctrico', color: '#ca8a04' },
  transmision: { label: 'Transmisión', color: '#059669' },
});

export function zonaColor(zona) {
  return ZONAS[zona]?.color || '#64748b';
}

export function zonaLabel(zona) {
  return ZONAS[zona]?.label || 'Otros';
}

// Estado de la medicion segun cuanta muestra la respalda. Es lo que evita que
// alguien tome una decision de compra sobre un promedio de un solo caso.
export function estadoMuestra(fila, muestraMinima) {
  if (!fila || !fila.n) {
    return {
      id: 'sin-datos',
      label: 'Sin datos',
      detalle: 'Ningún vehículo ha reemplazado esta pieza dos veces todavía.',
      color: '#94a3b8',
      chip: 'bg-slate-100 text-slate-600',
      borde: 'border-slate-200',
    };
  }
  if (fila.n < muestraMinima) {
    return {
      id: 'insuficiente',
      label: 'Muestra insuficiente',
      detalle: `Solo ${fila.n} ${fila.n === 1 ? 'medición' : 'mediciones'}. Sirve como señal, no para decidir compras.`,
      color: '#d97706',
      chip: 'bg-amber-50 text-amber-700',
      borde: 'border-amber-200',
    };
  }
  return {
    id: 'confiable',
    label: 'Muestra suficiente',
    detalle: `${fila.n} mediciones respaldan este valor.`,
    color: '#059669',
    chip: 'bg-emerald-50 text-emerald-700',
    borde: 'border-emerald-200',
  };
}

// Textos didacticos: el modulo se usa por gente de taller, no por analistas.
export const GLOSARIO = Object.freeze([
  {
    termino: 'Vida útil media (MTTF)',
    definicion:
      'Promedio de kilómetros que aguanta la pieza entre un cambio y el siguiente. Sirve para estimar cuánto stock comprar al año.',
  },
  {
    termino: 'Mediana',
    definicion:
      'El valor del medio: la mitad de las piezas duró menos y la mitad más. Es más representativo que el promedio cuando hay casos extremos.',
  },
  {
    termino: 'Vida B10',
    definicion:
      'Kilometraje al que el 10% de las piezas ya se reemplazó. Es el número con el que se programa el mantenimiento preventivo: si programas al promedio, la mitad de la flota llega con la pieza gastada.',
  },
  {
    termino: 'Mediciones (n)',
    definicion:
      'Cuántos intervalos reales respaldan el cálculo. Cada intervalo es un vehículo que cambió la misma pieza dos veces.',
  },
]);

export const COMO_SE_CALCULA = Object.freeze([
  'Se toma cada OT donde se facturó la pieza como repuesto (no la mano de obra).',
  'Se agrupan por placa y se ordenan por fecha de apertura.',
  'El kilómetro de una OT es el inicial; el de la siguiente OT con la misma pieza es el final.',
  'La resta es la vida útil de esa pieza en ese vehículo.',
  'Se descartan los intervalos con odómetro inválido y se reportan aparte.',
]);

export function kmText(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${new Intl.NumberFormat('es-PE').format(Math.round(valor))} km`;
}
