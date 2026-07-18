import React, { useState } from 'react';
import ModuleSidebar from './ModuleSidebar';

// Comparte exclusivamente el estado visual del menú entre las páginas. Gerson --
export default function ModulePageLayout({ activePath, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <main className="min-h-screen bg-slate-100">
      <ModuleSidebar
        activePath={activePath}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      {children(sidebarCollapsed)}
    </main>
  );
}
