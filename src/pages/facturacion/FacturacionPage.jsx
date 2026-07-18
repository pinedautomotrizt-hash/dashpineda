import React from 'react';
import FacturacionDashboard from './FacturacionDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useDashboardData from '../../hooks/useDashboardData';
import { APP_PATHS } from '../../config/appConfig';

export default function FacturacionPage() {
  const dashboard = useDashboardData();
  return (
    <ModulePageLayout activePath={APP_PATHS.facturacion}>
      {(sidebarCollapsed) => (
        <FacturacionDashboard
          data={dashboard.financial}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
