import React from 'react';
import { useParams } from 'react-router-dom';
import EmpresaDetalle from './EmpresaDetalle';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useEmpresaDetalleData from '../../hooks/useEmpresaDetalleData';
import { APP_PATHS } from '../../config/appConfig';

export default function EmpresaDetallePage() {
  const { empresa } = useParams();
  const nombreEmpresa = decodeURIComponent(empresa || '');
  const dashboard = useEmpresaDetalleData(nombreEmpresa);

  return (
    <ModulePageLayout activePath={APP_PATHS.empresas}>
      {(sidebarCollapsed) => (
        <EmpresaDetalle
          nombreEmpresa={nombreEmpresa}
          data={dashboard.detalle}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
