import React, { useEffect, useState } from 'react';
import { FileUp, History, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../api';
import { Panel } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';

const fechaHora = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function ImportacionesContent() {
  const [importType, setImportType] = useState('registro_venta');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const isDetalleOt = importType === 'detalle_factura_ot';

  async function cargarHistorial() {
    setLoadingHistorial(true);
    try {
      const response = await api.get('/import/historial');
      setHistorial(response.data.historial || []);
    } catch {
      // El historial es informativo; si falla no bloquea el formulario de importación.
    } finally {
      setLoadingHistorial(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      Swal.fire({ icon: 'warning', title: 'Falta el archivo', text: 'Selecciona un archivo CSV para importar.' });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', importType);
      const response = await api.post('/import/staging', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Los archivos anuales de OT pueden tardar más que las consultas normales.
        timeout: 300000,
      });
      const source = response.data.local
        ? ` Sede: ${response.data.local}. Periodo: ${response.data.desde} al ${response.data.hasta}.`
        : '';
      Swal.fire({
        icon: 'success',
        title: 'Importación completada',
        text: `${response.data.message}${source} Filas importadas: ${number.format(response.data.filas_importadas)}.`,
      });
      setFile(null);
      event.target.reset();
      cargarHistorial();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo importar',
        text: error.response?.data?.message || error.message || 'No se pudo importar el archivo.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="mb-5 bg-gradient-to-r from-red-950 via-red-800 to-red-600 text-white shadow-lg">
        <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><FileUp size={29} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-100">Carga de datos</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Importaciones</h1>
              <p className="mt-1 text-sm text-red-50">
                Carga registros de venta, órdenes de trabajo y detalles de facturas para actualizar el dashboard.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[420px_1fr] xl:items-start">
        <Panel title="Importar facturación de servicios">
          <form className="space-y-5" onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-700">
              Tipo de importación
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={importType}
                onChange={(event) => {
                  setImportType(event.target.value);
                  setFile(null);
                }}
              >
                <option value="registro_venta">Registro de Venta por Local</option>
                <option value="ordenes_trabajo">Ordenes de trabajo</option>
                <option value="detalle_factura_ot">Detalle de facturas por OT</option>
              </select>
            </label>

            <label className="block rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/60 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <FileUp className="mx-auto text-blue-700" size={30} />
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                {file ? file.name : 'Selecciona tu archivo CSV'}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {isDetalleOt
                  ? 'Formato csv. El local y el periodo se detectan automáticamente.'
                  : 'Formato csv'}
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {isDetalleOt
                ? 'Usa el reporte “Detalle de Facturas de OT por Local”, en CSV. Puedes cargar Callao y Trujillo por separado; el sistema conserva ambas sedes.'
                : 'Puedes usar el CSV con separador punto y coma. En ambos se ignoran las primeras 5 filas y se aplican las mismas reglas contra duplicados.'}
            </div>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 md:w-auto"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Importando...' : 'Importar CSV'}
            </button>
          </form>
        </Panel>

        <Panel
          title="Historial de importaciones"
          right={<span className="text-xs text-slate-500">Últimas 50</span>}
        >
          {loadingHistorial ? (
            <div className="grid h-24 place-items-center text-sm text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="grid h-24 place-items-center gap-2 text-center text-sm text-slate-500">
              <History className="mx-auto text-slate-400" size={22} />
              Todavía no hay importaciones registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Reporte</th>
                    <th className="px-3 py-2 text-right font-semibold">Filas</th>
                    <th className="px-3 py-2 font-semibold">Sede(s)</th>
                    <th className="px-3 py-2 font-semibold">Periodo</th>
                    <th className="py-2 pl-3 text-right font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-900">{item.reporte}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(item.filas_importadas)}</td>
                      <td className="px-3 py-2 text-slate-600">{item.locales || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {item.periodo_desde ? `${item.periodo_desde} al ${item.periodo_hasta}` : '—'}
                      </td>
                      <td className="py-2 pl-3 text-right text-xs text-slate-500">
                        {fechaHora.format(new Date(item.creado_en))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
