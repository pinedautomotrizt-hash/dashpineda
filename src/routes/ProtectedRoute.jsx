import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_PATHS } from '../config/appConfig';

// Exige sesion iniciada y, si se pasa `roles`, restringe por rol (ADMIN/ASESOR).
// Mientras se confirma la sesion (GET /auth/me al cargar la app) no redirige
// a nadie, para no mandar al login a alguien que si tiene sesion valida.
export default function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-500">Cargando…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to={APP_PATHS.login} state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to={APP_PATHS.facturacion} replace />;
  }
  // Rol restringido: solo puede navegar dentro del modulo Empresas (lista y
  // detalle de cada empresa). Cualquier otra ruta lo devuelve para alla.
  if (usuario?.rol === 'EMPRESAS' && !location.pathname.startsWith(APP_PATHS.empresas)) {
    return <Navigate to={APP_PATHS.empresas} replace />;
  }
  // Mismo criterio para ASESOR_INDIVIDUAL: solo su propio modulo Asesor.
  if (usuario?.rol === 'ASESOR_INDIVIDUAL' && !location.pathname.startsWith(APP_PATHS.asesorPersonal)) {
    return <Navigate to={APP_PATHS.asesorPersonal} replace />;
  }
  return children;
}
