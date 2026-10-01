import React from 'react';
import AgendaDashboard from './AgendaDashboard';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import useAgendaData from '../../hooks/useAgendaData';
import { APP_PATHS } from '../../config/appConfig';

export default function AgendaPage() {
  const agenda = useAgendaData();
  return (
    <ModulePageLayout activePath={APP_PATHS.agenda}>
      {(sidebarCollapsed) => (
        <AgendaDashboard filters={{ ...agenda, sidebarCollapsed }} />
      )}
    </ModulePageLayout>
  );
}
