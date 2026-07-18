import React from 'react';


//Componentes pequeños para el dashaboard - Gerson 07-07-2026---------------------------------------
export function Card({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${tones[tone]}`}><Icon size={20} /></div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </section>
  );
}




//Panel--

export function Panel({ title, children, right }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}




//Varicion de Colores Gerson -----------
export function VariationBadge({ value }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">Sin dato previo</span>;
  }
  const positive = value >= 0;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}
