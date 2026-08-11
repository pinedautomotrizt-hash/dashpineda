import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, ShieldAlert } from 'lucide-react';
import { number } from '../../utils/formatters';
import { empresaDetallePath } from '../../config/appConfig';
import { friendlyGrupo, grupoBadgeClass, grupoColor } from './empresasLabels';

export default function EmpresaCard({ row }) {
  const tieneReprocesos = Number(row.reprocesos) > 0;
  return (
    <Link
      to={empresaDetallePath(row.empresa)}
      className={`group block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        tieneReprocesos ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      {/* Franja superior con el color de la categoria: da un aire mas formal/de reporte. */}
      <div className="h-1.5" style={{ backgroundColor: grupoColor(row.grupo_cliente) }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-bold leading-snug text-slate-950" title={row.empresa}>
                {row.empresa}
              </p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${grupoBadgeClass(row.grupo_cliente)}`}>
                {friendlyGrupo(row.grupo_cliente)}
              </span>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="mt-2 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-blue-50 p-3.5">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Building2 size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">Unidades</span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-blue-900">{number.format(row.unidades || 0)}</p>
          </div>
          <div className={`rounded-lg p-3.5 ${tieneReprocesos ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <div className={`flex items-center gap-1.5 ${tieneReprocesos ? 'text-rose-600' : 'text-slate-500'}`}>
              <ShieldAlert size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">Reprocesos</span>
            </div>
            <p className={`mt-2 text-2xl font-black tracking-tight ${tieneReprocesos ? 'text-rose-900' : 'text-slate-700'}`}>
              {number.format(row.reprocesos || 0)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
