import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { CarFront, Clock, Gauge, PaintBucket, RefreshCw, Target, Wrench } from 'lucide-react';
import ModulePageLayout from '../../components/layout/ModulePageLayout';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { api } from '../../api';
import { APP_PATHS, MONTH_NAMES } from '../../config/appConfig';
import { currentMonth, money, number } from '../../utils/formatters';
import { CAPAS } from './capas';

// three.js y el modelo pesan: el despiece se carga solo al entrar al modulo.
const VistaExplosionada = lazy(() => import('./VistaExplosionada'));

const dias1 = (valor) => (valor === null || valor === undefined ? '—' : `${valor.toFixed(1)} días`);
const pct0 = (valor) => (valor === null || valor === undefined ? '—' : `${Math.round(valor * 100)}%`);
const NIVEL_LABEL = { LIGERO: 'Ligero', MEDIANO: 'Mediano', PESADO: 'Pesado' };
const NIVEL_COLOR = { LIGERO: '#70AD47', MEDIANO: '#F59E0B', PESADO: '#C2410C' };

const etiquetaMes = (yyyymm) => {
  const [anio, mes] = String(yyyymm).split('-').map(Number);
  return `${MONTH_NAMES[mes - 1]} ${String(anio).slice(2)}`;
};
const zonaLabel = (zona) => String(zona || '').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function usePlanchadoPintura() {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocal] = useState('Todos');
  const [locales, setLocales] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    api.get('/dashboard/locales').then((res) => setLocales(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let vigente = true;
    setLoading(true);
    setError('');
    api.get('/dashboard/planchado-pintura', { params: { month, local } })
      .then((res) => { if (vigente) setData(res.data); })
      .catch((err) => { if (vigente) setError(err.response?.data?.message || err.message || 'No se pudo cargar Planchado y Pintura'); })
      .finally(() => { if (vigente) setLoading(false); });
    return () => { vigente = false; };
  }, [month, local, recarga]);

  return { month, setMonth, local, setLocal, locales, data, loading, error, recargar: () => setRecarga((n) => n + 1) };
}

export default function PlanchadoPinturaPage() {
  return (
    <ModulePageLayout activePath={APP_PATHS.planchadoPintura}>
      {(sidebarCollapsed) => <PlanchadoPinturaDashboard sidebarCollapsed={sidebarCollapsed} />}
    </ModulePageLayout>
  );
}

function PlanchadoPinturaDashboard({ sidebarCollapsed }) {
  const { month, setMonth, local, setLocal, locales, data, loading, error, recargar } = usePlanchadoPintura();
  const [capaSeleccionada, setCapaSeleccionada] = useState(null);
  const resumen = data?.resumen;
  const anterior = data?.anterior;
  const variacionLt = resumen?.ltPromedio != null && anterior?.ltPromedio != null ? resumen.ltPromedio - anterior.ltPromedio : null;

  const evolucionOption = useMemo(() => {
    const filas = data?.evolucion || [];
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 45, right: 50, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: filas.map((f) => etiquetaMes(f.clave)) },
      yAxis: [
        { type: 'value', name: 'OT' },
        { type: 'value', name: 'días', splitLine: { show: false } },
      ],
      series: [
        { name: 'OT recibidas', type: 'bar', data: filas.map((f) => f.recibidas), itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] } },
        {
          name: 'Lead time promedio', type: 'line', yAxisIndex: 1, symbol: 'circle', symbolSize: 7,
          data: filas.map((f) => (f.ltPromedio == null ? null : Number(f.ltPromedio.toFixed(1)))),
          itemStyle: { color: '#b91c1c' }, label: { show: true, position: 'top', fontSize: 10, color: '#7f1d1d' },
        },
      ],
    };
  }, [data]);

  const nivelesOption = useMemo(() => {
    const filas = data?.porNivel || [];
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 45, right: 15, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: filas.map((f) => `${NIVEL_LABEL[f.nivel]} (${f.recibidas})`) },
      yAxis: { type: 'value', name: 'días' },
      series: [
        {
          name: 'Lead time real', type: 'bar', barWidth: 28,
          data: filas.map((f) => ({ value: f.ltPromedio == null ? null : Number(f.ltPromedio.toFixed(1)), itemStyle: { color: NIVEL_COLOR[f.nivel], borderRadius: [4, 4, 0, 0] } })),
          label: { show: true, position: 'top', formatter: '{c} d' },
        },
        { name: 'Target', type: 'line', step: 'middle', data: filas.map((f) => f.target), itemStyle: { color: '#0f172a' }, lineStyle: { type: 'dashed' } },
      ],
    };
  }, [data]);

  const maxZona = Math.max(1, ...(data?.porZona || []).map((z) => z.recibidas));

  return (
    <div className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">Carrocería y pintura</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Planchado y Pintura</h1>
        </div>
        <div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">
          <div className="grid grid-cols-[150px_170px_44px] gap-3">
            <label className="text-xs font-medium text-slate-500">
              Mes de recepción
              <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-950" />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Local
              <select value={local} onChange={(e) => setLocal(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950">
                <option>Todos</option>
                {locales.map((row) => <option key={row.local_nombre}>{row.local_nombre}</option>)}
              </select>
            </label>
            <button type="button" onClick={recargar} title="Actualizar" className="mt-5 grid h-10 place-items-center rounded-md bg-red-700 text-white hover:bg-red-800">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="relative space-y-4">
        <LoadingOverlay show={loading} />

        {/* Indicadores del mes */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <Card label="OT recibidas" value={number.format(resumen?.recibidas || 0)} hint={`${number.format(anterior?.recibidas || 0)} el mes anterior`} icon={CarFront} tone="blue" />
          <Card label="Terminadas" value={number.format(resumen?.terminadas || 0)} hint={`${number.format(resumen?.enTaller || 0)} siguen en taller`} icon={Wrench} tone="green" />
          <Card
            label="Lead time promedio"
            value={dias1(resumen?.ltPromedio ?? null)}
            hint={variacionLt === null ? 'Recepción → cierre de OT' : `${variacionLt <= 0 ? '▼' : '▲'} ${Math.abs(variacionLt).toFixed(1)} días vs. mes anterior`}
            icon={Clock}
            tone={variacionLt !== null && variacionLt > 0 ? 'rose' : 'green'}
          />
          <Card label="Dentro de target" value={pct0(resumen?.pctTarget ?? null)} hint="Ligero 4 · Mediano 8 · Pesado 16 días" icon={Target} tone={resumen?.pctTarget != null && resumen.pctTarget < 0.6 ? 'rose' : 'green'} />
          <Card label="Paños pintados" value={number.format(Math.round(resumen?.panos || 0))} hint={`${number.format(Math.round(resumen?.horas || 0))} h de planchado`} icon={PaintBucket} tone="violet" />
          <Card label="Venta sin IGV" value={money(resumen?.venta || 0)} hint="Repuestos + mano de obra" icon={Gauge} tone="amber" />
        </section>

        {/* Despiece + capas */}
        <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <Panel title="Vista explosionada" right={<span className="text-xs text-slate-500">Trabajos del mes por parte del vehículo</span>}>
            <Suspense fallback={<div className="grid h-[620px] place-items-center text-sm text-slate-500">Cargando visor 3D…</div>}>
              <VistaExplosionada capasData={data?.capas || []} seleccionada={capaSeleccionada} onSeleccionar={setCapaSeleccionada} />
            </Suspense>
          </Panel>
          <Panel title="Partes del vehículo">
            <ul className="space-y-2">
              {CAPAS.map((capa, i) => {
                const dato = (data?.capas || []).find((c) => c.id === capa.id);
                const activa = capaSeleccionada === capa.id;
                return (
                  <li key={capa.id}>
                    <button
                      type="button"
                      onClick={() => setCapaSeleccionada(activa ? null : capa.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${activa ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: capa.color }}>{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">{capa.label}</span>
                        <span className="block text-xs text-slate-500">{dato ? `${number.format(dato.ots)} OT con trabajos aquí` : 'Sin trabajos en el mes'}</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{dato ? money(dato.venta) : '—'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-slate-400">Cada línea de la OT se asigna a una parte según su descripción. Una OT puede tener trabajos en varias partes.</p>
          </Panel>
        </section>

        {/* Tiempos */}
        <section className="grid gap-4 xl:grid-cols-2">
          <Panel title="Lead time por tipo de daño" right={<span className="text-xs text-slate-500">Real vs. target</span>}>
            <div className="h-[300px]"><ReactECharts option={nivelesOption} style={{ height: '100%' }} notMerge lazyUpdate /></div>
            <p className="mt-2 text-xs text-slate-400">Nivel según paños y horas de planchado: Ligero hasta 2 paños y 12 h · Mediano hasta 6 paños y 32 h · Pesado el resto.</p>
          </Panel>
          <Panel title="Evolución" right={<span className="text-xs text-slate-500">Últimos 12 meses</span>}>
            <div className="h-[300px]"><ReactECharts option={evolucionOption} style={{ height: '100%' }} notMerge lazyUpdate /></div>
            <p className="mt-2 text-xs text-slate-400">El mes en curso sale con menos días porque las OT largas aún no se cierran.</p>
          </Panel>
        </section>

        {/* Zona y tipo de cliente */}
        <section className="grid gap-4 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Panel title="Zona del daño">
              <div className="space-y-3">
                {(data?.porZona || []).map((zona) => (
                  <div key={zona.clave}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-800">{zonaLabel(zona.clave)}</span>
                      <span className="text-xs text-slate-500">{number.format(zona.recibidas)} OT · {dias1(zona.ltPromedio)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-red-600" style={{ width: `${(zona.recibidas / maxZona) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {!(data?.porZona || []).length && <p className="text-sm text-slate-500">Sin OT en el mes.</p>}
              </div>
            </Panel>
          </div>
          <div className="xl:col-span-3">
            <Panel title="Por aseguradora y tipo de cliente">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Cliente</th>
                      <th className="px-3 py-2 text-right font-semibold">OT</th>
                      <th className="px-3 py-2 text-right font-semibold">En taller</th>
                      <th className="px-3 py-2 text-right font-semibold">Lead time</th>
                      <th className="px-3 py-2 text-right font-semibold">Dentro de target</th>
                      <th className="py-2 pl-3 text-right font-semibold">Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.porCliente || []).map((fila) => (
                      <tr key={fila.clave} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-medium text-slate-800">{fila.clave}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{number.format(fila.recibidas)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{number.format(fila.enTaller)}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{dias1(fila.ltPromedio)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${fila.pctTarget == null ? 'bg-slate-100 text-slate-500' : fila.pctTarget >= 0.7 ? 'bg-emerald-50 text-emerald-700' : fila.pctTarget >= 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                            {pct0(fila.pctTarget)}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-right text-slate-700">{money(fila.venta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </section>

        {/* OT abiertas */}
        <Panel title="OT en taller" right={<span className="text-xs text-slate-500">Recibidas hasta {data ? etiquetaMes(data.month) : '—'} y aún sin cierre</span>}>
          {(data?.abiertas || []).length ? (
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">OT</th>
                    <th className="px-3 py-2 font-semibold">Cliente</th>
                    <th className="px-3 py-2 font-semibold">Vehículo</th>
                    <th className="px-3 py-2 font-semibold">Sede</th>
                    <th className="px-3 py-2 font-semibold">Daño</th>
                    <th className="py-2 pl-3 text-right font-semibold">Días en taller</th>
                  </tr>
                </thead>
                <tbody>
                  {data.abiertas.map((ot) => (
                    <tr key={ot.ot} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-800">{ot.ot}</td>
                      <td className="px-3 py-2 text-slate-700">{ot.cliente}</td>
                      <td className="px-3 py-2 text-slate-600">{ot.placa} · {ot.modelo}</td>
                      <td className="px-3 py-2 text-slate-600">{String(ot.sede || '').replace('Pineda ', '')}</td>
                      <td className="px-3 py-2 text-slate-600">{ot.nivel === 'QUICK' ? 'Quick' : NIVEL_LABEL[ot.nivel]}</td>
                      <td className="py-2 pl-3 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ot.dias > 30 ? 'bg-rose-50 text-rose-700' : ot.dias > 15 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {number.format(ot.dias ?? 0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No hay OT abiertas.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
