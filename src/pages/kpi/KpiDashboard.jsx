import React from 'react';
import { BookOpen, Gauge, Layers, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';
import RepuestoIcono from './RepuestoIcono';
import VehiculoDespiece from './VehiculoDespiece';
import RepuestoDetalle from './RepuestoDetalle';
import { COMO_SE_CALCULA, GLOSARIO, estadoMuestra, kmText, zonaColor, zonaLabel } from './kpiLabels';

function FiltroKpi({ locales, local, setLocal, soloFlota, setSoloFlota }) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-600">Sede</span>
        <select
          value={local}
          onChange={(event) => setLocal(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
        >
          <option value="Todos">Todas las sedes</option>
          {locales.map((sede) => (
            <option key={sede.local_nombre || sede} value={sede.local_nombre || sede}>
              {sede.local_nombre || sede}
            </option>
          ))}
        </select>
      </label>

      <label className="flex cursor-pointer items-center gap-2 pb-2">
        <input
          type="checkbox"
          checked={soloFlota}
          onChange={(event) => setSoloFlota(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-red-700"
        />
        <span className="text-sm text-slate-700">Solo clientes de flota</span>
      </label>

      <p className="max-w-md pb-1 text-xs text-slate-500">
        La flota vuelve siempre al mismo taller, así que su historial de reemplazos está completo. En
        particulares se pierden los cambios hechos fuera y la vida útil sale inflada.
      </p>
    </div>
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
          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
        {fila.mttf ? kmText(fila.mttf) : 'Sin datos'}
      </p>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <div className="flex justify-between"><dt>Mediana</dt><dd className="font-medium text-slate-700">{fila.mediana ? `${Math.round(fila.mediana / 1000)}k` : '—'}</dd></div>
        <div className="flex justify-between"><dt>B10</dt><dd className="font-medium text-slate-700">{fila.b10 ? `${Math.round(fila.b10 / 1000)}k` : '—'}</dd></div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: estado.color }} />
        <span className="truncate text-[11px] text-slate-500">
          {fila.n ? `${fila.n} ${fila.n === 1 ? 'medición' : 'mediciones'} · ${fila.placas} ${fila.placas === 1 ? 'vehículo' : 'vehículos'}` : 'Sin mediciones'}
        </span>
      </div>
    </button>
  );
}

export default function KpiDashboard({ data, detalle, filters, error }) {
  const {
    locales, local, setLocal, soloFlota, setSoloFlota,
    seleccionado, setSeleccionado, loading, loadingDetalle,
  } = filters;

  const resumen = data?.resumen || [];
  const totales = data?.totales || {};
  const muestraMinima = data?.limites?.muestraMinima ?? 20;
  const sinMuestra = resumen.filter((fila) => !fila.confiable).length;

  return (
    <div className="relative space-y-5 p-4 lg:p-6">
      <LoadingOverlay show={loading} label="Calculando vida útil…" />

      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-950">KPI de vida útil de repuestos</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Cuántos kilómetros aguanta cada pieza en tu flota, medido sobre tus propias órdenes de trabajo.
          La unidad no es el calendario sino el <strong>kilometraje entre un reemplazo y el siguiente</strong>:
          un vehículo puede recorrer en tres meses lo que otro en dos años.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      <FiltroKpi
        locales={locales}
        local={local}
        setLocal={setLocal}
        soloFlota={soloFlota}
        setSoloFlota={setSoloFlota}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Mediciones totales"
          value={number.format(totales.intervalos || 0)}
          hint="Cada una es un vehículo que cambió la misma pieza dos veces"
          icon={Gauge}
          tone="blue"
        />
        <Card
          label="Vehículos medidos"
          value={number.format(totales.placas || 0)}
          hint="Placas que aportan al menos un intervalo"
          icon={Layers}
          tone="violet"
        />
        <Card
          label="Repuestos con muestra"
          value={`${totales.repuestosConMuestra || 0} de ${resumen.length}`}
          hint={`Se considera suficiente a partir de ${muestraMinima} mediciones`}
          icon={BookOpen}
          tone="green"
        />
        <Card
          label="Intervalos descartados"
          value={number.format(totales.descartados || 0)}
          hint="Odómetro inválido: se listan en el detalle de cada pieza"
          icon={TriangleAlert}
          tone="amber"
        />
      </div>

      {sinMuestra > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>{sinMuestra} de {resumen.length} repuestos todavía no tienen muestra suficiente.</strong>{' '}
            Las piezas de vida larga necesitan que el vehículo complete dos ciclos en el taller; con el
            historial actual aún no llegan. El número se va llenando solo con el tiempo.
          </span>
        </div>
      )}

      <Panel
        title="Despiece del vehículo"
        right={<span className="text-xs text-slate-500">Toca una pieza para ver su detalle</span>}
      >
        <VehiculoDespiece
          resumen={resumen}
          muestraMinima={muestraMinima}
          seleccionado={seleccionado}
          onSeleccionar={(id) => setSeleccionado(id === seleccionado ? null : id)}
        />
      </Panel>

      <Panel title="Todos los repuestos medidos">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cómo se calcula">
          <ol className="space-y-2 text-sm text-slate-600">
            {COMO_SE_CALCULA.map((paso, indice) => (
              <li key={paso} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                  {indice + 1}
                </span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Qué significa cada número">
          <dl className="space-y-3 text-sm">
            {GLOSARIO.map((item) => (
              <div key={item.termino}>
                <dt className="font-semibold text-slate-800">{item.termino}</dt>
                <dd className="text-slate-600">{item.definicion}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
