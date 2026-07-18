import React from 'react';
import ImportacionesContent from './ImportacionesContent';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import { APP_PATHS } from '../../config/appConfig';

export default function ImportacionesPage() {
  return (
    <ModulePageLayout activePath={APP_PATHS.importaciones}>
      {(sidebarCollapsed) => (
        <div className={`pt-14 transition-all duration-200 lg:pt-0 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <ImportacionesContent />
        </div>
      )}
    </ModulePageLayout>
  );
}
