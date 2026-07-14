import React, { useMemo } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';

const pen = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatMoney = (value, currency) =>
  currency === 'DOLARES' ? usd.format(Number(value || 0)) : pen.format(Number(value || 0));

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

function advisorLabel(name) {
  const normalized = String(name || 'Sin asesor').trim();
  if (normalized.toUpperCase().includes('GENESIS')) return 'GENESIS';
  if (normalized.toUpperCase().includes('ROGEIRIS')) return 'ROGEIRIS';
  return normalized;
}

function CurrencyTable({ currency, rows, days }) {
  const advisors = useMemo(
    () => [...new Set(rows.map((row) => row.asesor || 'Sin asesor'))].sort((a, b) => a.localeCompare(b, 'es')),
    [rows],
  );

  const values = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = `${String(row.fecha).slice(0, 10)}|${row.asesor || 'Sin asesor'}`;
      map.set(key, (map.get(key) || 0) + Number(row.sin_igv || 0));
    });
    return map;
  }, [rows]);

  const advisorTotals = useMemo(
    () => advisors.map((advisor) => ({
      advisor,
      total: days.reduce((sum, day) => sum + (values.get(`${day.key}|${advisor}`) || 0), 0),
    })),
    [advisors, days, values],
  );

  const grandTotal = advisorTotals.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Avance diario · {currency === 'DOLARES' ? 'Dólares' : 'Soles'}
          </h2>
          <p className="text-xs text-slate-500">Importes sin IGV, notas de crédito y anulaciones aplicadas.</p>
        </div>
        <strong className="text-lg text-slate-950">{formatMoney(grandTotal, currency)}</strong>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <th className="sticky left-0 z-10 min-w-24 border-b border-r border-slate-200 bg-slate-100 px-3 py-3 text-left">
                Fecha
              </th>
              {advisors.map((advisor) => (
                <th
                  key={advisor}
                  className="min-w-44 border-b border-r border-slate-200 px-3 py-3 text-right"
                  title={advisor}
                >
                  {advisorLabel(advisor)}
                </th>
              ))}
              <th className="min-w-36 border-b border-slate-200 bg-blue-50 px-3 py-3 text-right text-blue-800">
                Total día
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dayTotal = advisors.reduce(
                (sum, advisor) => sum + (values.get(`${day.key}|${advisor}`) || 0),
                0,
              );
              return (
                <tr key={day.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700">
                    {String(day.day).padStart(2, '0')}/{day.key.slice(5, 7)}
                  </td>
                  {advisors.map((advisor) => {
                    const value = values.get(`${day.key}|${advisor}`) || 0;
                    return (
                      <td key={advisor} className="border-r border-slate-100 px-3 py-2 text-right tabular-nums text-slate-700">
                        {value ? formatMoney(value, currency) : '—'}
                      </td>
                    );
                  })}
                  <td className="bg-blue-50/50 px-3 py-2 text-right font-semibold tabular-nums text-blue-900">
                    {dayTotal ? formatMoney(dayTotal, currency) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 font-bold text-white">
              <td className="sticky left-0 z-10 border-r border-slate-700 bg-slate-900 px-3 py-3">TOTAL</td>
              {advisorTotals.map((row) => (
                <td key={row.advisor} className="border-r border-slate-700 px-3 py-3 text-right tabular-nums">
                  {formatMoney(row.total, currency)}
                </td>
              ))}
              <td className="px-3 py-3 text-right tabular-nums">{formatMoney(grandTotal, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {advisors.length === 0 && (
        <div className="p-8 text-center text-sm text-slate-500">No hay movimientos para esta moneda.</div>
      )}
    </section>
  );
}

export default function MonthlyBillingSummary({ data, filters, error }) {
  const rows = data?.rows || [];
  const days = useMemo(() => monthDays(filters.month), [filters.month]);
  const solesRows = rows.filter((row) => row.moneda === 'SOLES');
  const dollarRows = rows.filter((row) => row.moneda === 'DOLARES');

  return (
    <div className={`mx-auto max-w-[1680px] px-4 py-5 transition-all duration-200 sm:px-6 lg:px-8 ${
      filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
    }`}>
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <CalendarDays size={17} /> Resumen mensual
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Avance diario por asesor</h1>
          <p className="mt-1 text-sm text-slate-500">Vista tabular mensual basada en el Registro de Venta por Local.</p>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[150px_190px_44px]">
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
              className="mt-5 grid h-10 w-10 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
              onClick={filters.load}
              disabled={filters.loading}
              title="Actualizar"
            >
              <RefreshCw size={17} className={filters.loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </section>
      </header>

      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="space-y-5">
        <CurrencyTable currency="SOLES" rows={solesRows} days={days} />
        {dollarRows.length > 0 && <CurrencyTable currency="DOLARES" rows={dollarRows} days={days} />}
      </div>
    </div>
  );
}
