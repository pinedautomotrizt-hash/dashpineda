//Objetos Inmutados Gerson -------------------16-07-2026-------------------------
export const COMPANY = Object.freeze({
  legalName: 'PINEDA AUTOMOTRIZ S.A.C.',
  ruc: '20430177053',
  logoUrl: '/assets/logo.jpg',
});

export const APP_DEFAULTS = Object.freeze({
  monthlyGoal: 200000,
  exchangeRate: 3.75,
});

// Meta mensual sugerida según la sede filtrada. Se aplica sola al cambiar el
// filtro de Local, pero el campo se puede seguir editando a mano después.
export const MONTHLY_GOALS_BY_LOCAL = Object.freeze({
  'Pineda Callao': 400000,
  'Pineda Trujillo': 200000,
  Todos: 600000,
});

export function monthlyGoalForLocal(local) {
  return MONTHLY_GOALS_BY_LOCAL[local] ?? MONTHLY_GOALS_BY_LOCAL.Todos;
}

export const APP_PATHS = Object.freeze({
  login: '/login',
  facturacion: '/facturacion',
  resumenMensual: '/resumen-mensual',
  dashboard: '/dashboard',
  asesores: '/asesores',
  importaciones: '/importaciones',
  reportes: '/reportes',
  empresas: '/empresas',
  empresaDetalle: '/empresas/:empresa',
  asesorPersonal: '/asesor-personal',
  ajustes: '/ajustes',
});

// La ruta de detalle usa el nombre de la empresa como clave (no hay id numerico).
export function empresaDetallePath(nombre) {
  return `/empresas/${encodeURIComponent(nombre)}`;
}

// roles: quienes pueden ver el enlace/entrar a la ruta. Sin "roles" = cualquier usuario logueado.
export const APP_MODULES = Object.freeze([
  { id: 'facturacion', path: APP_PATHS.facturacion, label: 'Facturación', icon: 'banknote' },
  { id: 'resumen-mensual', path: APP_PATHS.resumenMensual, label: 'Resumen mensual', icon: 'calendar' },
  { id: 'dashboard', path: APP_PATHS.dashboard, label: 'Operativo', icon: 'dashboard' },
  { id: 'asesores', path: APP_PATHS.asesores, label: 'Por Asesor', icon: 'users' },
  { id: 'empresas', path: APP_PATHS.empresas, label: 'Empresas', icon: 'building' },
  { id: 'importaciones', path: APP_PATHS.importaciones, label: 'Importaciones', icon: 'upload', roles: ['ADMIN'] },
  { id: 'reportes', path: APP_PATHS.reportes, label: 'Reportes Excel', icon: 'download' },
  { id: 'asesor-personal', path: APP_PATHS.asesorPersonal, label: 'Asesor', icon: 'users', roles: ['ASESOR_INDIVIDUAL'] },
  { id: 'ajustes', path: APP_PATHS.ajustes, label: 'Ajustes', icon: 'settings', roles: ['ASESOR_INDIVIDUAL'] },
]);

export const MONTH_NAMES = Object.freeze([
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]);
