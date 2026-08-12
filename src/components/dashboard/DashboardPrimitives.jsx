import React from 'react';


//Componentes pequeños para el dashaboard - Gerson 07-07-2026---------------------------------------
// dark: paleta opcional para paginas que ofrecen modo oscuro propio (ej.
// modulo Asesor personal). Por defecto queda apagado, asi que el resto de
// paginas del sistema no cambian en nada.
export function Card({ label, value, hint, icon: Icon, tone = 'blue', dark = false }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-indigo-50 text-indigo-700',
  };
  const tonesDark = {
    blue: 'bg-blue-500/15 text-blue-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    rose: 'bg-rose-500/15 text-rose-300',
    violet: 'bg-indigo-500/15 text-indigo-300',
  };

  return (
    <section className={`min-w-0 rounded-lg border p-4 shadow-sm ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>{value}</p>
        </div>
        <div className={`rounded-md p-2 ${dark ? tonesDark[tone] : tones[tone]}`}><Icon size={20} /></div>
      </div>
      <p className={`mt-3 text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{hint}</p>
    </section>
  );
}




//Panel--

export function Panel({ title, children, right, dark = false }) {
  return (
    <section className={`min-w-0 rounded-lg border p-4 shadow-sm ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className={`text-base font-semibold ${dark ? 'text-white' : 'text-slate-950'}`}>{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}




//Overlay de carga: se pone encima del contenido mientras se trae data nueva
//(cambio de filtros, refresh manual) para que no se vean ceros de golpe.
export function LoadingOverlay({ show, label = 'Cargando datos...', dark = false }) {
  if (!show) return null;
  return (
    <div className={`absolute inset-0 z-20 grid place-items-center rounded-xl backdrop-blur-[1px] ${dark ? 'bg-slate-950/70' : 'bg-white/70'}`}>
      <div className={`flex flex-col items-center gap-3 rounded-lg px-6 py-4 shadow-md ${dark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className={`h-9 w-9 animate-spin rounded-full border-4 border-t-red-700 ${dark ? 'border-slate-700' : 'border-slate-200'}`} />
        <p className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{label}</p>
      </div>
    </div>
  );
}




//Varicion de Colores Gerson -----------
// size 'lg': para cuando la variacion es el dato principal de una tarjeta
// (no un detalle chico al lado de otro numero), como en el modulo Asesor.
export function VariationBadge({ value, size = 'sm' }) {
  const sizeClasses = size === 'lg' ? 'px-4 py-1.5 text-xl font-black' : 'px-2 py-1 text-xs font-semibold';
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={`rounded-full bg-slate-100 text-slate-500 ${sizeClasses}`}>-</span>;
  }
  const positive = value >= 0;
  return (
    <span className={`rounded-full ${sizeClasses} ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}
