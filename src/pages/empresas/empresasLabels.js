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

export const RANGO_DIAS_LABELS = {
  0: '0 días',
  1: '1 día',
  2: '2 días',
  3: '3 días',
  '4-7': '4-7 días',
  '8+': '8+ días',
};
