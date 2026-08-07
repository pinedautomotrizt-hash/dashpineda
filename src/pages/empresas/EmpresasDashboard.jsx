import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Building2, ShieldAlert } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';

const GRUPO_LABELS = {
  FLOTAS: 'Flotas',
  NINGUNO: 'Particulares',
  'COMPAÑIAS DE SEGURO': 'Compañías de seguro',
  TRANSPORTISTA: 'Transportista',
  PREFERENTE: 'Preferente',
  'SIN DATO': 'Sin dato',
};

function friendlyGrupo(grupo) {
  return GRUPO_LABELS[grupo] || grupo || 'Sin dato';
}

export default function EmpresasDashboard({ data, filters, error }) {
  const porTipoCliente = data?.porTipoCliente || [];
  const porEmpresa = data?.porEmpresa || [];
  const totalGeneral = data?.totalGeneral || { unidades: 0, reprocesos: 0 };

  const empresasPorUnidades = useMemo(
    () => [...porEmpresa].sort((a, b) => Number(b.unidades) - Number(a.unidades)),
    [porEmpresa],
  );
  const empresasConReprocesos = useMemo(
    () => porEmpresa
      .filter((row) => Number(row.reprocesos) > 0)
      .sort((a, b) => Number(b.reprocesos) - Number(a.reprocesos)),
    [porEmpresa],
  );

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
      })),
    }],
  };

  const empresaUnidadesOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 200, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: empresasPorUnidades.map((row) => row.empresa),
      axisLabel: { width: 180, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { color: '#155eef', borderRadius: [0, 5, 5, 0] },
      data: empresasPorUnidades.map((row) => Number(row.unidades || 0)),
    }],
  };

  const reprocesosOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 200, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: empresasConReprocesos.map((row) => row.empresa),
      axisLabel: { width: 180, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { color: '#e11d48', borderRadius: [0, 5, 5, 0] },
      data: empresasConReprocesos.map((row) => Number(row.reprocesos || 0)),
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

        <Panel
          title="Unidades atendidas por empresa"
          right={<span className="text-xs text-slate-500">Flotas, seguros y transportistas</span>}
        >
          {empresasPorUnidades.length ? (
            <ReactECharts
              option={empresaUnidadesOption}
              style={{ height: Math.max(280, empresasPorUnidades.length * 38) }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div className="grid h-60 place-items-center text-sm text-slate-500">
              Sin empresas con OT en este periodo.
            </div>
          )}
        </Panel>

        <Panel
          title="Reprocesos y garantías internas por empresa"
          right={<span className="text-xs text-slate-500">Solo empresas con al menos 1 caso</span>}
        >
          {empresasConReprocesos.length ? (
            <ReactECharts
              option={reprocesosOption}
              style={{ height: Math.max(220, empresasConReprocesos.length * 38) }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div className="grid h-60 place-items-center text-sm text-slate-500">
              Sin reprocesos ni reclamos de garantía en este periodo.
            </div>
          )}
        </Panel>

        <Panel title="Detalle por empresa">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Empresa</th>
                  <th className="px-3 py-2 font-semibold">Categoría</th>
                  <th className="px-3 py-2 text-right font-semibold">Unidades atendidas</th>
                  <th className="py-2 pl-3 text-right font-semibold">Reprocesos / garantías</th>
                </tr>
              </thead>
              <tbody>
                {empresasPorUnidades.map((row) => (
                  <tr key={`${row.grupo_cliente}-${row.empresa}`} className="border-b border-slate-100">
                    <td className="max-w-[320px] truncate py-2 pr-3 text-slate-700" title={row.empresa}>
                      {row.empresa}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{friendlyGrupo(row.grupo_cliente)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{number.format(row.unidades || 0)}</td>
                    <td className="py-2 pl-3 text-right font-semibold text-slate-950">
                      {number.format(row.reprocesos || 0)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 font-bold text-slate-950">
                  <td className="py-2 pr-3">TOTAL GENERAL</td>
                  <td className="px-3 py-2 text-slate-500">Todas las categorías</td>
                  <td className="px-3 py-2 text-right">{number.format(totalGeneral.unidades || 0)}</td>
                  <td className="py-2 pl-3 text-right">{number.format(totalGeneral.reprocesos || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
