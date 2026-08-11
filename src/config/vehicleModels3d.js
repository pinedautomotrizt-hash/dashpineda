// Mapa marca/modelo -> archivo .glb disponible. Solo las combinaciones
// listadas aca muestran visor 3D (DashboardPage y EmpresaDetalle comparten
// este catalogo para no tener dos listas de assets desincronizadas).
export const MODEL_3D_ASSETS = {
  'FORD|RANGER': '/assets/ford_ranger_2023.glb',
};

export function modelo3dPara(marca, modelo) {
  const clave = `${String(marca || '').trim().toUpperCase()}|${String(modelo || '').trim().toUpperCase()}`;
  return MODEL_3D_ASSETS[clave] || null;
}
