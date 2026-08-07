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
