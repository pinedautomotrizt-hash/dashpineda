import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, ShieldAlert } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';
import { APP_PATHS } from '../../config/appConfig';
import { friendlyGrupo } from './empresasLabels';

export default function EmpresaDetalle({ nombreEmpresa, fila, filters, error }) {
  const unidades = fila?.unidades || 0;
  const reprocesos = fila?.reprocesos || 0;
  const categoria = fila?.grupo_cliente ? friendlyGrupo(fila.grupo_cliente) : null;

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
    >
      <Link
        to={APP_PATHS.empresas}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700"
      >
        <ArrowLeft size={16} />
        Volver a Empresas
      </Link>
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 min-w-0 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            {categoria || 'Cliente'}
          </p>
          <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-white" title={nombreEmpresa}>
            {nombreEmpresa}
          </h1>
          <p className="mt-2 text-sm text-red-50">
            Reporte de calidad y actividad del cliente.
          </p>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <DashboardFilterBar {...filters} />
        </div>
      </header>
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="relative space-y-4">
        <LoadingOverlay show={filters.loading} />

        <section className="grid gap-3 sm:grid-cols-2">
          <Card
            label="Unidades atendidas"
            value={number.format(unidades)}
            hint="OT únicas en el mes y sede filtrados"
            icon={Building2}
            tone="blue"
          />
          <Card
            label="Reprocesos / garantías internas"
            value={number.format(reprocesos)}
            hint="OT con reproceso o reclamo de garantía"
            icon={ShieldAlert}
            tone="rose"
          />
        </section>

        {!filters.loading && !fila && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Esta empresa no tuvo unidades atendidas en el mes y sede filtrados.
          </div>
        )}

        {/*
          Espacio reservado para indicadores adicionales de este cliente:
          KPI de Calidad % (reprocesos / unidades), Contactabilidad (cuando
          exista seguimiento de citas), evolución mensual, etc. Se agregan
          aquí a medida que se definan, sin tocar la vista de lista.
        */}
      </div>
    </div>
  );
}
