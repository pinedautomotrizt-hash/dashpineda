import React, { useState } from 'react';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import FacturacionReportForm from '../../components/reportes/FacturacionReportForm';
import ModuleSidebar from '../../components/layout/ModuleSidebar';
// Página independiente para exportaciones; no carga consultas ni gráficos del dashboard.
export default function ReportesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <main className={`min-h-screen bg-slate-100 pt-14 transition-[padding] duration-200 lg:pt-0 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
      <ModuleSidebar activePath="/reportes" collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <header className="bg-gradient-to-r from-red-950 via-red-800 to-red-600 text-white shadow-lg">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8">
  
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><FileSpreadsheet size={29} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-100">Centro de exportaciones</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Reportes de facturación</h1>
              <p className="mt-1 text-sm text-red-50">Excel conciliado con las mismas reglas contables del sistema.</p>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8"><FacturacionReportForm /></div>
    </main>
  );
}

