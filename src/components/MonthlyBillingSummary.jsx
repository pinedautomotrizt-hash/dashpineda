import React, { useMemo } from 'react';
import { CalendarDays, Download, RefreshCw } from 'lucide-react';
import { buildMonthlySummaryModel, downloadMonthlySummaryPdf } from '../utils/monthlySummaryPdf';
import { COMPANY } from '../config/appConfig';

const pen = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});




const formatMoney = (value) => pen.format(Number(value || 0));

//Dias del Mes funcion Gerson-------------
function monthDays(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return [];
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const date = new Date(Date.UTC(year, monthNumber - 1, day));
    return {
      key: `${month}-${String(day).padStart(2, '0')}`,
      day,
      // El formato contable compartido no muestra domingos.
      visible: date.getUTCDay() !== 0,
    };
  }).filter((row) => row.visible);
}



function MonthlyTable({ rows, days, model }) {
  const { areas, limaAreas, trujilloAreas, visibleAreas, values, grandTotal } = model;
  const visibleAdvisorTotals = visibleAreas.map((area) => ({ area, total: model.totals.get(area) || 0 }));

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Avance diario · Equivalente en soles
          </h2>
        </div>
        <strong className="text-lg text-slate-950">{formatMoney(grandTotal)}</strong>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide">
              <th rowSpan={2} className="sticky left-0 z-20 min-w-24 border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-left text-slate-600">
                Fecha
              </th>
              <th colSpan={limaAreas.length} className="border-b border-r border-blue-200 bg-blue-100 px-3 py-2 text-center font-black text-blue-900">
                Lima
              </th>
              <th colSpan={trujilloAreas.length} className="border-b border-r border-emerald-200 bg-emerald-100 px-3 py-2 text-center font-black text-emerald-900">
                Trujillo
              </th>
              <th rowSpan={2} className="min-w-36 border-b border-slate-200 bg-red-100 px-3 py-3 text-right font-black text-red-800">
                Total día
              </th>
            </tr>
            <tr className="text-xs uppercase tracking-wide text-slate-600">
              {visibleAreas.map((area) => (
                <th
                  key={area}
                  className={`min-w-44 border-b border-r px-3 py-3 text-right ${limaAreas.includes(area) ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}
                  title={area}
                >
                  {model.areaLabels.get(area) || area}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dayTotal = areas.reduce(
                (sum, area) => sum + (values.get(`${day.key}|${area}`) || 0),
                0,
              );
              return (
                <tr key={day.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">
                    {String(day.day).padStart(2, '0')}/{day.key.slice(5, 7)}
                  </td>
                  {visibleAreas.map((area) => {
                    const value = values.get(`${day.key}|${area}`) || 0;
                    return (
                      <td
                        key={area}
                        className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700"
                        title={value < 0 ? `Nota de crédito aplicada internamente: ${formatMoney(value)}` : undefined}
                      >
                        {value !== 0 ? formatMoney(value) : '—'}
                      </td>
                    );
                  })}
                  <td className="bg-blue-50/50 px-3 py-2 text-right font-semibold tabular-nums text-blue-900">
                    {dayTotal ? formatMoney(dayTotal) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 font-bold text-white">
              <td className="sticky left-0 z-10 border-r border-slate-700 bg-slate-900 px-3 py-3">TOTAL</td>
              {visibleAdvisorTotals.map((row) => (
                <td key={row.area} className="border-r border-slate-700 px-3 py-3 text-right tabular-nums">
                  {formatMoney(row.total)}
                </td>
              ))}
              <td className="px-3 py-3 text-right tabular-nums">{formatMoney(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="p-8 text-center text-sm text-slate-500">No hay movimientos para esta moneda.</div>
      )}
    </section>
  );
}

export default function MonthlyBillingSummary({ data, filters, error, advisorConfig = [] }) {
  const rows = data?.rows || [];
  const days = useMemo(() => monthDays(filters.month), [filters.month]);
  const reportModel = useMemo(
    () => buildMonthlySummaryModel(rows, days, advisorConfig),
    [rows, days, advisorConfig],
  );
  const totalPrincipal = rows.reduce((sum, row) => sum + Number(row.sin_igv || 0), 0);
  const mostrador = Number(data?.mostrador?.sin_igv || 0);

  return (
    <div className={`monthly-report-root mx-auto max-w-[1680px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${
      filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
    }`}>
      <div className="print-only corporate-print-header">
        <img src={COMPANY.logoUrl} alt="Logo de Pineda Automotriz" />
        <div>
          <h1>{COMPANY.legalName}</h1>
          <p>RUC: {COMPANY.ruc}</p>
        </div>
      </div>

      <header className="no-print mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg xl:flex xl:items-end xl:justify-between xl:gap-6">
        <div className="mb-4 xl:mb-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            <CalendarDays size={16} /> Resumen mensual
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Avance diario</h1>
          <p className="mt-2 max-w-2xl text-sm text-red-50">
            Registro de Venta conciliado con el detalle de facturas y órdenes de trabajo.
          </p>
        </div>

        <section className="no-print rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-[150px_190px_44px]">
            <label className="text-xs font-medium text-slate-500">
              Mes
              <input
                className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
                type="month"
                value={filters.month}
                onChange={(event) => filters.setMonth(event.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Local
              <select
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
                value={filters.local}
                onChange={(event) => filters.setLocal(event.target.value)}
              >
                <option>Todos</option>
                {filters.locales.map((item) => (
                  <option key={item.local_nombre}>{item.local_nombre}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="mt-5 grid h-10 w-10 place-items-center rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
              onClick={filters.load}
              disabled={filters.loading}
              title="Actualizar"
            >
              <RefreshCw size={17} className={filters.loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </section>
      </header>

      {error && <div className="no-print mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <section className="no-print mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-blue-700">Total principal del avance</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-blue-950">{formatMoney(totalPrincipal)}</p>
          <p className="mt-2 text-xs text-blue-700">No incluye ventas de Mostrador.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-amber-700">Venta de repuestos / Mostrador</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-950">{formatMoney(mostrador)}</p>
          <p className="mt-2 text-xs text-amber-700">
            Informativo · {Number(data?.mostrador?.comprobantes || 0)} comprobante(s) · No suma al total.
          </p>
        </div>
      </section>

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          El total general incluye comprobantes pendientes de clasificación, aunque no se muestren como columna.
        </p>
        <button
          type="button"
          className="no-print inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-800"
          onClick={() => downloadMonthlySummaryPdf({ model: reportModel, days, month: filters.month })}
        >
          <Download size={17} /> Exportar PDF
        </button>
      </div>

      <div className="space-y-5">
        <MonthlyTable rows={rows} days={days} model={reportModel} />
      </div>
    </div>
  );
}
