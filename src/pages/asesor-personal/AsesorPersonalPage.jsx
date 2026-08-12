import React from 'react';
import AsesorPersonalDashboard from './AsesorPersonalDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useAsesorPersonalData from '../../hooks/useAsesorPersonalData';
import { APP_PATHS } from '../../config/appConfig';

export default function AsesorPersonalPage() {
  const dashboard = useAsesorPersonalData();
  return (
    <ModulePageLayout activePath={APP_PATHS.asesorPersonal}>
      {(sidebarCollapsed) => (
        <AsesorPersonalDashboard
          data={dashboard.asesorData}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
