import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import FacturacionPage from '../pages/facturacion/FacturacionPage';
import ResumenMensualPage from '../pages/resumen-mensual/ResumenMensualPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AsesoresPage from '../pages/asesores/AsesoresPage';
import ImportacionesPage from '../pages/importaciones/ImportacionesPage';
import ReportesPage from '../pages/reportes/ReportesPage';
import LoginPage from '../pages/login/LoginPage';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import { APP_PATHS } from '../config/appConfig';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={APP_PATHS.login} element={<LoginPage />} />
          <Route path={APP_PATHS.facturacion} element={<ProtectedRoute><FacturacionPage /></ProtectedRoute>} />
          <Route path={APP_PATHS.resumenMensual} element={<ProtectedRoute><ResumenMensualPage /></ProtectedRoute>} />
          <Route path={APP_PATHS.dashboard} element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path={APP_PATHS.asesores} element={<ProtectedRoute><AsesoresPage /></ProtectedRoute>} />
          <Route
            path={APP_PATHS.importaciones}
            element={<ProtectedRoute roles={['ADMIN']}><ImportacionesPage /></ProtectedRoute>}
          />
          <Route path={APP_PATHS.reportes} element={<ProtectedRoute><ReportesPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={APP_PATHS.facturacion} replace />} />
          <Route path="*" element={<Navigate to={APP_PATHS.facturacion} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
