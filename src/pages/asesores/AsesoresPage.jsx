import React from 'react';
import AsesoresDashboard from './AsesoresDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useDashboardData from '../../hooks/useDashboardData';
import { APP_PATHS } from '../../config/appConfig';

export default function AsesoresPage() {
  const dashboard = useDashboardData();
  return (
    <ModulePageLayout activePath={APP_PATHS.asesores}>
      {(sidebarCollapsed) => (
        <AsesoresDashboard
          data={dashboard.advisorData}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
