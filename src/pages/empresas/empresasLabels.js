export const GRUPO_LABELS = {
  FLOTAS: 'Flotas',
  NINGUNO: 'Particulares',
  'COMPAÑIAS DE SEGURO': 'Compañías de seguro',
  TRANSPORTISTA: 'Transportista',
  PREFERENTE: 'Preferente',
  'OTRAS EMPRESAS': 'Otras empresas',
  'SIN DATO': 'Sin dato',
};

export function friendlyGrupo(grupo) {
  return GRUPO_LABELS[grupo] || grupo || 'Sin dato';
}

// Color fijo por categoria (no depende del orden en que vengan del backend),
// para que la dona de "por tipo de cliente" y los badges de las cards de
// empresa siempre usen el mismo color por categoria, mes a mes.
const GRUPO_COLORS = {
  FLOTAS: '#155eef',
  'OTRAS EMPRESAS': '#16a34a',
  'COMPAÑIAS DE SEGURO': '#d97706',
  TRANSPORTISTA: '#7c3aed',
  PREFERENTE: '#0891b2',
  NINGUNO: '#e11d48',
  'SIN DATO': '#64748b',
};

export function grupoColor(grupo) {
  return GRUPO_COLORS[grupo] || '#64748b';
}

const GRUPO_BADGE_CLASSES = {
  FLOTAS: 'bg-blue-50 text-blue-700',
  'OTRAS EMPRESAS': 'bg-emerald-50 text-emerald-700',
  'COMPAÑIAS DE SEGURO': 'bg-amber-50 text-amber-700',
  TRANSPORTISTA: 'bg-violet-50 text-violet-700',
  PREFERENTE: 'bg-cyan-50 text-cyan-700',
  NINGUNO: 'bg-rose-50 text-rose-700',
  'SIN DATO': 'bg-slate-100 text-slate-600',
};

export function grupoBadgeClass(grupo) {
  return GRUPO_BADGE_CLASSES[grupo] || 'bg-slate-100 text-slate-600';
}

export const ESTADO_LABELS = {
  APERTURADO: 'Aperturado',
  CERRADO: 'Cerrado',
  FACTURADO: 'Facturado',
  'FACTURADO INT': 'Facturado (interno)',
  LIQUIDADO: 'Liquidado',
};

export function friendlyEstado(estado) {
  return ESTADO_LABELS[estado] || estado || 'Sin estado';
}

const ESTADO_BADGE_CLASSES = {
  APERTURADO: 'bg-amber-50 text-amber-700',
  CERRADO: 'bg-slate-100 text-slate-600',
  FACTURADO: 'bg-blue-50 text-blue-700',
  'FACTURADO INT': 'bg-blue-50 text-blue-700',
  LIQUIDADO: 'bg-emerald-50 text-emerald-700',
};

export function estadoBadgeClass(estado) {
  return ESTADO_BADGE_CLASSES[estado] || 'bg-slate-100 text-slate-600';
}

const ESTADO_CHART_COLORS = {
  APERTURADO: '#f59e0b',
  CERRADO: '#64748b',
  FACTURADO: '#155eef',
  'FACTURADO INT': '#155eef',
  LIQUIDADO: '#16a34a',
};

export function estadoColor(estado) {
  return ESTADO_CHART_COLORS[estado] || '#155eef';
}

// Nombres de tipo_ot tal cual vienen del reporte de OT (MAYUSCULAS, a veces
// largos) reescritos a algo mas corto y legible en una card. Cualquier
// tipo_ot que no este en el mapa se muestra "Title Case" tal cual venga,
// para no dejar categorias nuevas sin texto.
const TIPO_OT_LABELS = {
  'MANTENIMIENTO PERIODICO': 'Mantenimiento periódico',
  'CORRECTIVO Y REPARACIONES GENERALES': 'Correctivo',
  'SERVICIO DE CARROCERIA Y PINTURA': 'Carrocería y pintura',
  'SERVICIO DE CARROCERIA': 'Carrocería',
  'SERVICIO DE PINTURA': 'Pintura',
  'REPROCESO TALLER B&P': 'Reproceso taller B&P',
  'REPROCESO TALLER MECÁNICA': 'Reproceso mecánica',
  'RECLAMOS DE GARANTIA': 'Reclamo de garantía',
  'RECLAMOS AL CONCESIONARIO': 'Reclamo al concesionario',
  LAVADO: 'Lavado',
  'SERVICIO INTERNO': 'Servicio interno',
  'LLAMADO A REVISION': 'Llamado a revisión',
  'CAMBIO DE ACEITE(SRV LUBRICACION)': 'Cambio de aceite',
  'INSTALACION DE ACCESORIOS ORIGINALES': 'Instalación de accesorios',
  'OTROS SERVICIOS': 'Otros servicios',
  'OTROS VEHÍCULOS': 'Otros vehículos',
};

function tituloCase(texto) {
  return texto
    .toLowerCase()
    .replace(/(^|\s)([a-záéíóúñ])/g, (match, espacio, letra) => espacio + letra.toUpperCase());
}

export function friendlyTipoOt(tipoOt) {
  if (!tipoOt) return 'Sin clasificar';
  const clave = tipoOt.toUpperCase().trim();
  return TIPO_OT_LABELS[clave] || tituloCase(clave);
}

export const RANGO_DIAS_LABELS = {
  0: '0 días',
  1: '1 día',
  2: '2 días',
  3: '3 días',
  '4-7': '4-7 días',
  '8+': '8+ días',
};
