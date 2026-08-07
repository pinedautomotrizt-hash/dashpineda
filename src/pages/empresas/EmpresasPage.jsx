import React from 'react';
import EmpresasDashboard from './EmpresasDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useEmpresasData from '../../hooks/useEmpresasData';
import { APP_PATHS } from '../../config/appConfig';

export default function EmpresasPage() {
  const dashboard = useEmpresasData();
  return (
    <ModulePageLayout activePath={APP_PATHS.empresas}>
      {(sidebarCollapsed) => (
        <EmpresasDashboard
          data={dashboard.empresas}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
