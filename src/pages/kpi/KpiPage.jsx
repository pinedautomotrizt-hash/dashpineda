import React from 'react';
import KpiDashboard from './KpiDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useKpiData from '../../hooks/useKpiData';
import { APP_PATHS } from '../../config/appConfig';

export default function KpiPage() {
  const kpi = useKpiData();
  return (
    <ModulePageLayout activePath={APP_PATHS.kpi}>
      {(sidebarCollapsed) => (
        <KpiDashboard
          data={kpi.resumen}
          detalle={kpi.detalle}
          error={kpi.error}
          filters={{ ...kpi, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
