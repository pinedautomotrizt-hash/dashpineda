import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldAlert } from 'lucide-react';
import { number } from '../../utils/formatters';
import { empresaDetallePath } from '../../config/appConfig';
import { friendlyGrupo } from './empresasLabels';

export default function EmpresaCard({ row }) {
  const tieneReprocesos = Number(row.reprocesos) > 0;
  return (
    <Link
      to={empresaDetallePath(row.empresa)}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950" title={row.empresa}>
            {row.empresa}
          </p>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {friendlyGrupo(row.grupo_cliente)}
          </span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-blue-50 px-2 py-2">
          <div className="flex items-center gap-1 text-blue-600">
            <Building2 size={13} />
            <span>Unidades</span>
          </div>
          <p className="mt-1 text-base font-bold text-blue-900">{number.format(row.unidades || 0)}</p>
        </div>
        <div className={`rounded-md px-2 py-2 ${tieneReprocesos ? 'bg-rose-50' : 'bg-slate-50'}`}>
          <div className={`flex items-center gap-1 ${tieneReprocesos ? 'text-rose-600' : 'text-slate-500'}`}>
            <ShieldAlert size={13} />
            <span>Reprocesos</span>
          </div>
          <p className={`mt-1 text-base font-bold ${tieneReprocesos ? 'text-rose-900' : 'text-slate-700'}`}>
            {number.format(row.reprocesos || 0)}
          </p>
        </div>
      </div>
    </Link>
  );
}
