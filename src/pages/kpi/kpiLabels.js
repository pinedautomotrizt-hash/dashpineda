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
      label: '—',
      detalle: '—',
      color: '#94a3b8',
      chip: 'bg-slate-100 text-slate-600',
      borde: 'border-slate-200',
    };
  }
  if (fila.n < muestraMinima) {
    return {
      id: 'insuficiente',
      label: 'Muestra insuficiente',
      detalle: `${fila.n} ${fila.n === 1 ? 'medición' : 'mediciones'}`,
      color: '#d97706',
      chip: 'bg-amber-50 text-amber-700',
      borde: 'border-amber-200',
    };
  }
  return {
    id: 'confiable',
    label: 'Muestra suficiente',
    detalle: `${fila.n} mediciones`,
    color: '#059669',
    chip: 'bg-emerald-50 text-emerald-700',
    borde: 'border-emerald-200',
  };
}

export function kmText(valor) {
  if (valor === null || valor === undefined) return '—';
  return `${new Intl.NumberFormat('es-PE').format(Math.round(valor))} km`;
}
