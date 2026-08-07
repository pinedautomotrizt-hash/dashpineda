import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EmpresaDetalle from './EmpresaDetalle';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useEmpresasData from '../../hooks/useEmpresasData';
import { APP_PATHS } from '../../config/appConfig';

export default function EmpresaDetallePage() {
  const { empresa } = useParams();
  const nombreEmpresa = decodeURIComponent(empresa || '');
  const dashboard = useEmpresasData();

  const fila = useMemo(
    () => (dashboard.empresas?.porEmpresa || []).find((row) => row.empresa === nombreEmpresa),
    [dashboard.empresas, nombreEmpresa],
  );

  return (
    <ModulePageLayout activePath={APP_PATHS.empresas}>
      {(sidebarCollapsed) => (
        <EmpresaDetalle
          nombreEmpresa={nombreEmpresa}
          fila={fila}
          error={dashboard.error}
          filters={{ ...dashboard, sidebarCollapsed }}
        />
      )}
    </ModulePageLayout>
  );
}
