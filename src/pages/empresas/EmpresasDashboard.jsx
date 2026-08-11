import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Building2, ChevronLeft, ChevronRight, Search, ShieldAlert } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';
import { friendlyGrupo, grupoColor } from './empresasLabels';
import EmpresaCard from './EmpresaCard';

const EMPRESAS_POR_PAGINA = 12;

export default function EmpresasDashboard({ data, filters, error }) {
  const porTipoCliente = data?.porTipoCliente || [];
  const porEmpresa = data?.porEmpresa || [];
  const totalGeneral = data?.totalGeneral || { unidades: 0, reprocesos: 0 };

  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);

  const empresasOrdenadas = useMemo(
    () => [...porEmpresa].sort((a, b) => Number(b.unidades) - Number(a.unidades)),
    [porEmpresa],
  );
  const empresasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return empresasOrdenadas;
    return empresasOrdenadas.filter((row) => row.empresa.toLowerCase().includes(termino));
  }, [empresasOrdenadas, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(empresasFiltradas.length / EMPRESAS_POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const empresasPagina = empresasFiltradas.slice(
    (paginaSegura - 1) * EMPRESAS_POR_PAGINA,
    paginaSegura * EMPRESAS_POR_PAGINA,
  );

  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  const tipoClienteOption = {
    tooltip: { trigger: 'item', valueFormatter: (value) => number.format(value) },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      label: { formatter: '{b}\n{d}%' },
      data: porTipoCliente.map((row) => ({
        name: friendlyGrupo(row.grupo_cliente),
        value: Number(row.unidades || 0),
        itemStyle: { color: grupoColor(row.grupo_cliente) },
      })),
    }],
  };

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
    >
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            Calidad de servicio
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Empresas
          </h1>
          <p className="mt-2 text-sm text-red-50">
            Unidades atendidas y reprocesos / garantías internas por empresa.
          </p>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <DashboardFilterBar {...filters} showMeta={false} />
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
            label="Unidades atendidas (general)"
            value={number.format(totalGeneral.unidades || 0)}
            hint="Todas las categorías de cliente, mes y sede filtrados"
            icon={Building2}
            tone="blue"
          />
          <Card
            label="Reprocesos / garantías internas (general)"
            value={number.format(totalGeneral.reprocesos || 0)}
            hint="OT con reproceso o reclamo de garantía, cualquier cliente"
            icon={ShieldAlert}
            tone="rose"
          />
        </section>

        <Panel
          title="Empresas"
          right={
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(event) => handleBusqueda(event.target.value)}
                placeholder="Buscar empresa..."
                className="h-9 w-56 rounded-md border border-slate-200 pl-8 pr-3 text-sm text-slate-950"
              />
            </div>
          }
        >
          {empresasPagina.length ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {empresasPagina.map((row) => (
                  <EmpresaCard key={`${row.grupo_cliente}-${row.empresa}`} row={row} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                  {empresasFiltradas.length} empresa{empresasFiltradas.length === 1 ? '' : 's'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaSegura <= 1}
                    className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-medium">
                    Página {paginaSegura} de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaSegura >= totalPaginas}
                    className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-40 place-items-center text-sm text-slate-500">
              {busqueda ? 'Ninguna empresa coincide con la búsqueda.' : 'Sin empresas con OT en este periodo.'}
            </div>
          )}
        </Panel>

        <Panel title="Unidades atendidas por tipo de cliente">
          {porTipoCliente.length ? (
            <div className="h-[300px] sm:h-[340px]">
              <ReactECharts option={tipoClienteOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          ) : (
            <div className="grid h-60 place-items-center text-sm text-slate-500">
              Sin datos para este periodo.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
