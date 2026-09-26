import React from 'react';
import { BookOpen, Building2, Gauge, Layers, RefreshCw, TriangleAlert } from 'lucide-react';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';
import RepuestoIcono from './RepuestoIcono';
import VehiculoDespiece from './VehiculoDespiece';
import RepuestoDetalle from './RepuestoDetalle';
import { estadoMuestra, kmText, zonaColor, zonaLabel } from './kpiLabels';

function FiltrosKpi({ locales, empresas, local, setLocal, empresa, setEmpresa, soloFlota, setSoloFlota, loading, load }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[170px_260px_150px_44px]">
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
          Empresa
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            value={empresa}
            onChange={(event) => setEmpresa(event.target.value)}
          >
            <option>Todas</option>
            {empresas.map((nombre) => (
              <option key={nombre}>{nombre}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-slate-500">
          Universo
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            value={soloFlota ? 'flota' : 'todos'}
            onChange={(event) => setSoloFlota(event.target.value === 'flota')}
          >
            <option value="flota">Solo flota</option>
            <option value="todos">Todos</option>
          </select>
        </label>

        <button
          type="button"
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

function TarjetaRepuesto({ fila, muestraMinima, activo, onSeleccionar }) {
  const color = zonaColor(fila.zona);
  const estado = estadoMuestra(fila, muestraMinima);

  return (
    <button
      type="button"
      onClick={() => onSeleccionar(fila.id)}
      className={`group min-w-0 rounded-lg border bg-white p-4 text-left shadow-sm transition
        hover:-translate-y-0.5 hover:shadow-md
        ${activo ? 'border-slate-400 ring-2 ring-slate-300' : estado.borde}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{fila.label}</p>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            {zonaLabel(fila.zona)}
          </span>
        </div>
        <div className="shrink-0 rounded-md p-1.5" style={{ backgroundColor: `${color}12` }}>
          <RepuestoIcono id={fila.id} color={color} size={32} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {fila.mttf ? kmText(fila.mttf) : '—'}
      </p>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <div className="flex justify-between">
          <dt>Mediana</dt>
          <dd className="font-medium text-slate-700">{fila.mediana ? `${Math.round(fila.mediana / 1000)}k` : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>B10</dt>
          <dd className="font-medium text-slate-700">{fila.b10 ? `${Math.round(fila.b10 / 1000)}k` : '—'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: estado.color }} />
        <span className="truncate text-[11px] text-slate-500">
          {fila.n
            ? `${fila.n} ${fila.n === 1 ? 'medición' : 'mediciones'} · ${fila.placas} ${fila.placas === 1 ? 'vehículo' : 'vehículos'}`
            : '—'}
        </span>
      </div>
    </button>
  );
}

function TablaEmpresas({ filas, muestraMinima }) {
  if (!filas.length) {
    return <p className="py-6 text-center text-sm text-slate-500">—</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-semibold">Empresa</th>
            <th className="py-2 pr-3 text-right font-semibold">Vehículos</th>
            <th className="py-2 pr-3 text-right font-semibold">Mediciones</th>
            <th className="py-2 pr-3 text-right font-semibold">Media</th>
            <th className="py-2 pr-3 text-right font-semibold">Mediana</th>
            <th className="py-2 pr-3 text-right font-semibold">B10</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const estado = estadoMuestra(fila, muestraMinima);
            return (
              <tr key={fila.cliente} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-medium text-slate-800">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: estado.color }} />
                  {fila.cliente}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fila.placas}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{fila.n}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{kmText(fila.mttf)}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{kmText(fila.mediana)}</td>
                <td className="py-2 pr-3 text-right font-semibold tabular-nums text-slate-900">{kmText(fila.b10)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function KpiDashboard({ data, detalle, filters, error }) {
  const {
    locales, local, setLocal, empresa, setEmpresa, soloFlota, setSoloFlota,
    seleccionado, setSeleccionado, loading, loadingDetalle, load,
  } = filters;

  const resumen = data?.resumen || [];
  const totales = data?.totales || {};
  const empresas = data?.empresas || [];
  const porEmpresa = data?.porEmpresa || [];
  const muestraMinima = data?.limites?.muestraMinima ?? 20;

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${
        filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}
    >
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            Confiabilidad de repuestos
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">KPI Repuestos</h1>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <FiltrosKpi
            locales={locales}
            empresas={empresas}
            local={local}
            setLocal={setLocal}
            empresa={empresa}
            setEmpresa={setEmpresa}
            soloFlota={soloFlota}
            setSoloFlota={setSoloFlota}
            loading={loading}
            load={load}
          />
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="relative space-y-4">
        <LoadingOverlay show={loading} label="Calculando vida útil…" />

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            label="Mediciones totales"
            value={number.format(totales.intervalos || 0)}
            hint="Kilómetros entre un reemplazo y el siguiente"
            icon={Gauge}
            tone="blue"
          />
          <Card
            label="Vehículos medidos"
            value={number.format(totales.placas || 0)}
            hint="Placas con al menos un intervalo"
            icon={Layers}
            tone="violet"
          />
          <Card
            label="Repuestos con muestra"
            value={`${totales.repuestosConMuestra || 0} de ${resumen.length}`}
            hint={`Desde ${muestraMinima} mediciones`}
            icon={BookOpen}
            tone="green"
          />
          <Card
            label="Intervalos descartados"
            value={number.format(totales.descartados || 0)}
            hint="Odómetro inválido"
            icon={TriangleAlert}
            tone="amber"
          />
        </section>

        <Panel title="Despiece del vehículo">
          <VehiculoDespiece
            resumen={resumen}
            muestraMinima={muestraMinima}
            seleccionado={seleccionado}
            onSeleccionar={(id) => setSeleccionado(id === seleccionado ? null : id)}
          />
        </Panel>

        <Panel title="Repuestos medidos">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resumen.map((fila) => (
              <TarjetaRepuesto
                key={fila.id}
                fila={fila}
                muestraMinima={muestraMinima}
                activo={seleccionado === fila.id}
                onSeleccionar={(id) => setSeleccionado(id === seleccionado ? null : id)}
              />
            ))}
          </div>
        </Panel>

        {seleccionado && (
          <RepuestoDetalle
            detalle={detalle}
            cargando={loadingDetalle}
            onCerrar={() => setSeleccionado(null)}
          />
        )}

        <Panel
          title="Comparación entre empresas"
          right={(
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 size={14} />
              {porEmpresa.length} {porEmpresa.length === 1 ? 'empresa' : 'empresas'}
            </span>
          )}
        >
          <TablaEmpresas filas={porEmpresa} muestraMinima={muestraMinima} />
        </Panel>
      </div>
    </div>
  );
}
