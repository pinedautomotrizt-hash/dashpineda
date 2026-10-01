import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_PATHS, puedeUsarRuta, rutaInicio } from '../config/appConfig';

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
  // Roles restringidos (EMPRESAS, ASESOR_INDIVIDUAL): solo navegan dentro de
  // los modulos que les toca. Cualquier otra ruta los devuelve a su inicio.
  // La lista es la misma que deshabilita los links del menu.
  if (!puedeUsarRuta(usuario?.rol, location.pathname)) {
    return <Navigate to={rutaInicio(usuario?.rol)} replace />;
  }
  return children;
}
