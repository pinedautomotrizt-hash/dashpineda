import React, { useEffect, useState } from 'react';
import { CalendarDays, Download, FileSpreadsheet, MapPin } from 'lucide-react';
import { api } from '../../api';
import { monthlyGoalForLocal } from '../../config/appConfig';

// Devuelve el mes actual en el formato aceptado por el backend.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Extrae el nombre sugerido por el backend desde Content-Disposition.
function responseFilename(header, fallback) {
  const match = String(header || '').match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

// Administra filtros y descarga el Excel generado completamente por la API.
export default function FacturacionReportForm() {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));

  // Al cambiar de sede, sugiere la meta de esa sede; el usuario igual la puede
  // sobrescribir a mano en el campo de meta despues.
  function setLocal(nextLocal) {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/dashboard/locales')
      .then(({ data }) => setLocales(Array.isArray(data) ? data : []))
      .catch(() => setMessage('No se pudo cargar la lista de locales. Puedes exportar todos.'));
  }, []);

  async function downloadReport() {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.get('/reportes/facturacion/excel', {
        params: { month, local, meta },
        responseType: 'blob',
        timeout: 120000,
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = responseFilename(response.headers['content-disposition'], `reporte_facturacion_${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Reporte generado correctamente.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo generar el reporte. Revisa que el backend esté disponible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-700"><FileSpreadsheet size={25} /></span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Reporte mensual de facturación</h2>
            <p className="text-sm text-slate-500">Selecciona el periodo y la sede que deseas conciliar.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            <span className="mb-2 flex items-center gap-2"><CalendarDays size={16} /> Mes</span>
            <input className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            <span className="mb-2 flex items-center gap-2"><MapPin size={16} /> Local</span>
            <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" value={local} onChange={(event) => setLocal(event.target.value)}>
              <option value="Todos">Todos los locales</option>
              {locales.map((row) => <option key={row.local_nombre} value={row.local_nombre}>{row.local_nombre}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            <span className="mb-2 flex items-center gap-2">Meta mensual</span>
            <input className="h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" type="number" min="0" step="1000" value={meta} onChange={(event) => setMeta(Number(event.target.value))} />
          </label>
        </div>

        <button type="button" onClick={downloadReport} disabled={loading || !month} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
          <Download size={19} className={loading ? 'animate-bounce' : ''} />
          {loading ? 'Generando Excel…' : 'Descargar reporte detallado'}
        </button>
        {message && <p className={`mt-4 text-sm font-medium ${message.includes('correctamente') ? 'text-emerald-700' : 'text-amber-700'}`}>{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Contenido del archivo</h2>
        <p className="mt-1 text-sm text-slate-500">Cada tema se entrega en una hoja independiente.</p>
        <ol className="mt-5 space-y-3">
          {['Resumen ejecutivo con KPI, sedes y áreas', 'Comparación año anterior vs. actual', 'Avance diario y auditoría', 'Detalle de documentos', 'Notas de crédito y anulaciones', 'Órdenes aperturadas pendientes de facturación'].map((item, index) => (
            <li key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-100 text-xs font-bold text-red-700">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
