import React, { useEffect, useState } from 'react';
import MonthlyBillingSummary from '../../components/MonthlyBillingSummary';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useDashboardData from '../../hooks/useDashboardData';
import { APP_PATHS } from '../../config/appConfig';
import { api } from '../../api';

export default function ResumenMensualPage() {
  const dashboard = useDashboardData();
  const [advisorConfig, setAdvisorConfig] = useState([]);

  // Carga el catálogo para clasificar asesores sin reglas fijas en el frontend.
  useEffect(() => {
    api.get('/configuracion/asesores', { params: { incluir_inactivos: 1 } })
      .then(({ data }) => setAdvisorConfig(data?.asesores || []))
      .catch(() => setAdvisorConfig([]));
  }, []);
  return (
    <ModulePageLayout activePath={APP_PATHS.resumenMensual}>
      {(sidebarCollapsed) => (
        <MonthlyBillingSummary
          data={{
            ...(dashboard.advisorData || {}),
            mostrador: dashboard.advisorData?.mostrador || dashboard.financial?.mostrador,
          }}
          filters={{ ...dashboard, sidebarCollapsed }}
          error={dashboard.error}
          advisorConfig={advisorConfig}
        />
      )}
    </ModulePageLayout>
  );
}
