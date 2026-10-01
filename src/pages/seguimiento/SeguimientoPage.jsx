import React from 'react';
import SeguimientoDashboard from './SeguimientoDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useSeguimientoData from '../../hooks/useSeguimientoData';
import { APP_PATHS } from '../../config/appConfig';

export default function SeguimientoPage() {
  const seguimiento = useSeguimientoData();
  return (
    <ModulePageLayout activePath={APP_PATHS.seguimiento}>
      {(sidebarCollapsed) => (
        <SeguimientoDashboard filters={{ ...seguimiento, sidebarCollapsed }} />
      )}
    </ModulePageLayout>
  );
}
