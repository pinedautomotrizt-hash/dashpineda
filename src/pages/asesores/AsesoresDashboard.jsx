import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Users } from "lucide-react";
import DashboardFilterBar from "../../components/dashboard/DashboardFilterBar";
import { Panel, LoadingOverlay } from "../../components/dashboard/DashboardPrimitives";
import { money, moneyByCurrency, number, pct, shortDate } from "../../utils/formatters";



function AdvisorOperationsPanels({ advisorVisuals, advisorRows }) {
  return (
    <section className="space-y-4">
      {advisorVisuals.map((visual) => (
        <Panel
          key={visual.moneda}
          title={`Facturacion por asesor · ${visual.moneda === "DOLARES" ? "Dólares" : "Soles"}`}
          right={
            <span className="text-xs text-slate-500">
              Importes de OT con IGV
            </span>
          }
        >
          {visual.rows.length > 0 ? (
            <>
              <div className="mb-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {moneyByCurrency(visual.totals.total, visual.moneda)}
                  </p>
                </div>
                <div className="rounded-md bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">RPTO</p>
                  <p className="mt-1 font-bold text-blue-900">
                    {moneyByCurrency(visual.totals.repuestos, visual.moneda)}
                  </p>
                </div>
                <div className="rounded-md bg-violet-50 p-3">
                  <p className="text-xs text-violet-700">MO</p>
                  <p className="mt-1 font-bold text-violet-900">
                    {moneyByCurrency(visual.totals.manoObra, visual.moneda)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-[1.35fr_.65fr]">
                <ReactECharts
                  option={visual.bar}
                  style={{ height: Math.max(320, visual.rows.length * 42) }}
                  notMerge
                  lazyUpdate
                />
                <div>
                  <p className="pt-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Margen de repuestos
                  </p>
                  <div className="h-[210px] sm:h-[250px] lg:h-[280px]">
                    <ReactECharts
                      option={visual.margin}
                      style={{ height: '100%' }}
                      notMerge
                      lazyUpdate
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-72 place-items-center text-sm text-slate-500">
              Sin operaciones en {visual.moneda.toLowerCase()}.
            </div>
          )}
        </Panel>
      ))}

      <Panel
        title="Detalle operativo por asesor"
        right={
          <span className="text-xs text-slate-500">
            RPTO, MO, costo y margen
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="py-2 pr-3 font-semibold">Sede</th>
                <th className="px-3 py-2 font-semibold">Asesor</th>
                <th className="px-3 py-2 font-semibold">Moneda</th>
                <th className="px-3 py-2 text-right font-semibold">OTs</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Total con IGV
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  Total neto
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  RPTO con IGV
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  MO con IGV
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  Costo RPTO
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  Utilidad RPTO
                </th>
                <th className="py-2 pl-3 text-right font-semibold">
                  Margen RPTO
                </th>
              </tr>
            </thead>
            <tbody>
              {advisorRows.map((row) => (
                <tr
                  key={`${row.local_nombre}-${row.asesor}-${row.moneda}`}
                  className="border-b border-slate-100"
                >
                  <td className="py-2 pr-3 font-medium text-slate-700">
                    {row.local_nombre || "Sin sede"}
                  </td>
                  <td
                    className="max-w-[320px] truncate px-3 py-2 text-slate-600"
                    title={row.asesor}
                  >
                    {row.asesor}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-700">
                    {row.moneda}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {number.format(row.ots || 0)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-950">
                    {moneyByCurrency(row.total_con_igv, row.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {moneyByCurrency(row.total_sin_igv, row.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-700">
                    {moneyByCurrency(row.repuestos_con_igv, row.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right text-indigo-700">
                    {moneyByCurrency(row.mano_obra_con_igv, row.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {moneyByCurrency(row.costo_repuestos, row.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                    {moneyByCurrency(row.utilidad_repuestos, row.moneda)}
                  </td>
                  <td className="py-2 pl-3 text-right font-semibold text-slate-950">
                    {pct(row.margen_repuestos_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

export default function AsesoresDashboard({ data, filters, error }) {
  const rows = data?.rows || [];
  const advisorMixedCards = useMemo(() => {
    const grouped = new Map();
    rows.forEach((row) => {
      const advisor = row.asesor || "Sin asesor";
      const current = grouped.get(advisor) || {
        asesor: advisor,
        soles: 0,
        dolares: 0,
        comprobantes: 0,
      };
      if (row.moneda === "DOLARES") {
        current.dolares += Number(row.sin_igv || 0);
      } else if (row.moneda === "SOLES") {
        current.soles += Number(row.sin_igv || 0);
      }
      current.comprobantes += Number(row.comprobantes || 0);
      grouped.set(advisor, current);
    });
    return [...grouped.values()]
      .map((row) => ({ ...row, totalMixto: row.soles + row.dolares }))
      .sort((a, b) => b.totalMixto - a.totalMixto);
  }, [rows]);
  const buildCurrency = (moneda) => {
    const filtered = rows.filter((row) => row.moneda === moneda);
    const advisors = [...new Set(filtered.map((row) => row.asesor))];
    const dates = [...new Set(filtered.map((row) => row.fecha))].sort();
    const totals = advisors
      .map((asesor) => ({
        asesor,
        total: filtered
          .filter((row) => row.asesor === asesor)
          .reduce((sum, row) => sum + Number(row.sin_igv || 0), 0),
      }))
      .sort((a, b) => b.total - a.total);
    return {
      moneda,
      filtered,
      advisors: totals.map((row) => row.asesor),
      dates,
      totals,
    };
  };
  const groups = [buildCurrency("SOLES"), buildCurrency("DOLARES")];

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
    >
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            Rendimiento comercial
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Dashboard por Asesor
          </h1>
          <p className="mt-2 text-sm text-red-50">
            Facturación por asesor separada por moneda.
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
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-slate-950">
              Total por asesor
            </h2>
            <span className="text-xs font-medium text-amber-700">
              Soles + dolares sin conversion
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {advisorMixedCards.map((row, index) => (
              <section
                key={row.asesor}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm text-slate-500"
                      title={row.asesor}
                    >
                      #{index + 1} {row.asesor}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {money(row.totalMixto)}
                    </p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                    <Users size={20} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-blue-50 px-2 py-2">
                    <p className="text-blue-600">Soles</p>
                    <p className="mt-1 font-semibold text-blue-900">
                      {money(row.soles)}
                    </p>
                  </div>
                  <div className="rounded-md bg-emerald-50 px-2 py-2">
                    <p className="text-emerald-600">Dólares</p>
                    <p className="mt-1 font-semibold text-emerald-900">
                      {moneyByCurrency(row.dolares, "DOLARES")}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {number.format(row.comprobantes)} comprobantes
                </p>
              </section>
            ))}
          </div>
        </section>
        {groups.map((group) => {
          const option = {
            tooltip: { trigger: "axis" },
            legend: { type: "scroll", top: 0 },
            grid: { left: 55, right: 25, top: 55, bottom: 35 },
            xAxis: { type: "category", data: group.dates.map(shortDate) },
            yAxis: {
              type: "value",
              axisLabel: {
                formatter: (value) => `${Math.round(value / 1000)}k`,
              },
            },
            series: group.advisors.map((asesor) => ({
              name: asesor,
              type: "line",
              smooth: true,
              symbolSize: 7,
              data: group.dates.map((fecha) => {
                const row = group.filtered.find(
                  (item) => item.fecha === fecha && item.asesor === asesor,
                );
                return Number(row?.sin_igv || 0);
              }),
            })),
          };
          return (
            <Panel
              key={group.moneda}
              title={`Avance diario· ${group.moneda === "DOLARES" ? "Dólares" : "Soles"}`}
              right={
                <span className="text-xs text-slate-500">Venta diaria</span>
              }
            >
              {group.filtered.length ? (
                <>
                  <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {group.totals.slice(0, 4).map((row, index) => (
                      <div
                        key={row.asesor}
                        className="rounded-md bg-slate-50 p-3"
                      >
                        <p
                          className="truncate text-xs text-slate-500"
                          title={row.asesor}
                        >
                          #{index + 1} {row.asesor}
                        </p>
                        <p className="mt-1 font-bold text-slate-950">
                          {moneyByCurrency(row.total, group.moneda)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="h-[270px] sm:h-[330px] lg:h-[390px]">
                    <ReactECharts option={option} style={{ height: '100%' }} />
                  </div>
                </>
              ) : (
                <div className="grid h-60 place-items-center text-sm text-slate-500">
                  Sin datos para esta moneda.
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
