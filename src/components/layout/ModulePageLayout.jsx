import React, { useState } from 'react';
import ModuleSidebar from './ModuleSidebar';
import { useTheme } from '../../context/ThemeContext';

// Comparte exclusivamente el estado visual del menú entre las páginas. Gerson --
export default function ModulePageLayout({ activePath, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { darkMode } = useTheme();
  return (
    <main className={`min-h-screen transition-colors ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <ModuleSidebar
        activePath={activePath}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      {children(sidebarCollapsed)}
    </main>
  );
}
