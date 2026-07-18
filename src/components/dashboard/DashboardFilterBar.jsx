import React from 'react';
import { RefreshCw } from 'lucide-react';


//Filtro de DashBoard - Gerson 07-07-2026---------------------------------------
export default function DashboardFilterBar({ month, setMonth, local, setLocal, locales, meta, setMeta, loading, load }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[150px_180px_180px_44px]">
        <label className="text-xs font-medium text-slate-500">
          Mes
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Local
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            value={local}
            onChange={(event) => setLocal(event.target.value)}
          >
            <option>Todos</option>
            {locales.map((row) => (
              <option key={row.local_nombre}>{row.local_nombre}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Meta mensual
          <input
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            type="number"
            min="0"
            step="1000"
            value={meta}
            onChange={(event) => setMeta(Number(event.target.value))}
          />
        </label>
        <button
          className="mt-5 grid h-10 place-items-center rounded-md bg-red-700 text-white hover:bg-red-800"
          onClick={load}
          title="Actualizar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </section>
  );
}

