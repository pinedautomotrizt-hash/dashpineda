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
