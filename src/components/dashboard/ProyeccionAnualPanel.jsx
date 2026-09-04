import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Target } from 'lucide-react';
import { Panel, LoadingOverlay, VariationBadge } from './DashboardPrimitives';
import { money, pct } from '../../utils/formatters';
import { MONTH_NAMES } from '../../config/appConfig';
import { api } from '../../api';

const hoy = new Date();
const anioActual = hoy.getFullYear();
const mesActual = hoy.getMonth() + 1;
const diasDelMesActual = new Date(anioActual, mesActual, 0).getDate();
const diasTranscurridos = hoy.getDate();

// La meta de un año puede ser un número fijo (misma meta los 12 meses) o un
// arreglo de 12 valores cuando cambia dentro del año (ver metas.js backend).
function metaDelMes(metaAnio, mes) {
  return Array.isArray(metaAnio) ? Number(metaAnio[mes - 1] || 0) : Number(metaAnio || 0);
}

function resumenMeta(metaAnio) {
  if (!Array.isArray(metaAnio)) return `${money(metaAnio)}/mes`;
  const min = Math.min(...metaAnio);
  const max = Math.max(...metaAnio);
  return min === max ? `${money(min)}/mes` : `${money(min)} – ${money(max)}/mes`;
}

// Semáforo del % de alcance: mismo criterio que el Excel de facturación
// (colorSemaforo en reportesFacturacion.service.js) — bueno / regular / bajo.
function toneAlcance(porcentaje) {
  if (porcentaje === null) return 'bg-slate-50 text-slate-400';
  if (porcentaje >= 100) return 'bg-emerald-50 text-emerald-700 font-semibold';
  if (porcentaje >= 85) return 'bg-amber-50 text-amber-700 font-semibold';
  return 'bg-rose-50 text-rose-700 font-semibold';
}

// Panel de planeamiento anual: Meta / Alcance / % Alcance / Variación
// interanual por sede y por mes, para 2025 en adelante. Vive aparte del
// resto de la página porque muestra el año completo, no depende del filtro
// de mes/sede que ya tiene FacturacionDashboard.
export default function ProyeccionAnualPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/proyeccion-anual')
      .then(({ data: response }) => setData(response))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar la proyección anual');
      })
      .finally(() => setLoading(false));
  }, []);

  const facturadoPorCelda = useMemo(() => {
    const mapa = new Map();
    (data?.filas || []).forEach((fila) => {
      mapa.set(`${fila.local_nombre}|${fila.anio}|${fila.mes}`, Number(fila.facturado || 0));
    });
    return mapa;
  }, [data]);

  const metas = data?.metas || {};
  const sedes = Object.keys(metas);

  return (
    <section className="mb-4">
      <Panel
        title="Proyección anual por sede"
        right={<span className="text-xs text-slate-500">Facturación oficial sin IGV vs. meta · 2025-2026</span>}
      >
        {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="relative">
          <LoadingOverlay show={loading} />
          <div className="space-y-8">
            {sedes.map((sede) => (
              <SedeProyeccion
                key={sede}
                sede={sede}
                metasPorAnio={metas[sede]}
                facturadoPorCelda={facturadoPorCelda}
              />
            ))}
            {!loading && !sedes.length && (
              <div className="grid h-40 place-items-center text-sm text-slate-500">Sin metas configuradas.</div>
            )}
          </div>
        </div>
      </Panel>
    </section>
  );
}

function SedeProyeccion({ sede, metasPorAnio, facturadoPorCelda }) {
  const anios = Object.keys(metasPorAnio).map(Number).sort((a, b) => a - b);

  const valor = (anio, mes) => facturadoPorCelda.get(`${sede}|${anio}|${mes}`) || 0;
  const esFuturo = (anio, mes) => anio > anioActual || (anio === anioActual && mes > mesActual);
  const esMesActual = (anio, mes) => anio === anioActual && mes === mesActual;

  const chartOption = useMemo(() => buildChartOption({ anios, metasPorAnio, valor }), [anios, metasPorAnio, facturadoPorCelda]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-red-50 text-red-700"><Target size={15} /></span>
          {sede}
        </h3>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {anios.map((anio) => (
            <span key={anio} className="rounded-full bg-slate-100 px-3 py-1">
              Meta {anio}: <span className="font-semibold text-slate-700">{resumenMeta(metasPorAnio[anio])}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5 h-[220px] sm:h-[260px]">
        <ReactECharts option={chartOption} style={{ height: '100%' }} notMerge lazyUpdate />
      </div>

      <div className="space-y-5">
        {anios.map((anio, index) => {
          const anioAnterior = anios[index - 1];
          return (
            <TablaAnio
              key={anio}
              anio={anio}
              anioAnterior={anioAnterior}
              metaAnio={metasPorAnio[anio]}
              valor={valor}
              esFuturo={esFuturo}
              esMesActual={esMesActual}
            />
          );
        })}
      </div>
    </div>
  );
}

function TablaAnio({ anio, anioAnterior, metaAnio, valor, esFuturo, esMesActual }) {
  const meses = MONTH_NAMES.map((_, index) => index + 1);
  const alcanceAnual = meses.reduce((suma, mes) => suma + (esFuturo(anio, mes) ? 0 : valor(anio, mes)), 0);
  const metaAnual = meses.reduce(
    (suma, mes) => suma + (esFuturo(anio, mes) ? 0 : metaDelMes(metaAnio, mes)),
    0,
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[820px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold">{anio}</th>
            {MONTH_NAMES.map((nombre) => (
              <th key={nombre} className="px-2 py-2 text-right font-semibold">{nombre}</th>
            ))}
            <th className="px-3 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-600">Meta</td>
            {meses.map((mes) => (
              <td key={mes} className="px-2 py-1.5 text-right text-slate-500">
                {esFuturo(anio, mes) ? '—' : money(metaDelMes(metaAnio, mes))}
              </td>
            ))}
            <td className="px-3 py-1.5 text-right font-semibold text-slate-600">{money(metaAnual)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-600">Alcance</td>
            {meses.map((mes) => (
              <td key={mes} className="px-2 py-1.5 text-right text-slate-900">
                {esFuturo(anio, mes) ? '—' : money(valor(anio, mes))}
                {esMesActual(anio, mes) && <span className="ml-1 text-[10px] font-semibold text-blue-600">·en curso</span>}
              </td>
            ))}
            <td className="px-3 py-1.5 text-right font-semibold text-slate-900">{money(alcanceAnual)}</td>
          </tr>
          <tr className="border-t border-slate-100">
            <td className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-slate-600">% Alcance</td>
            {meses.map((mes) => {
              const futuro = esFuturo(anio, mes);
              const metaMes = metaDelMes(metaAnio, mes);
              const porcentaje = futuro || !metaMes ? null : (valor(anio, mes) / metaMes) * 100;
              return (
                <td key={mes} className={`px-2 py-1.5 text-right ${toneAlcance(porcentaje)}`}>
                  {porcentaje === null ? '—' : pct(porcentaje)}
                </td>
              );
            })}
            <td className={`px-3 py-1.5 text-right ${toneAlcance(metaAnual ? (alcanceAnual / metaAnual) * 100 : null)}`}>
              {metaAnual ? pct((alcanceAnual / metaAnual) * 100) : '—'}
            </td>
          </tr>
          {anioAnterior && (
            <tr className="border-t border-slate-100 bg-slate-50/60">
              <td className="sticky left-0 z-10 bg-slate-50/60 px-3 py-1.5 text-left font-medium text-slate-600">
                Variación vs. {anioAnterior}
              </td>
              {meses.map((mes) => {
                const anterior = valor(anioAnterior, mes);
                const actual = esFuturo(anio, mes) ? null : valor(anio, mes);
                const variacion = actual === null || !anterior ? null : ((actual - anterior) / anterior) * 100;
                return (
                  <td key={mes} className="px-2 py-1.5 text-right">
                    <VariationBadge value={variacion} />
                  </td>
                );
              })}
              <td className="px-3 py-1.5" />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Barras de Alcance (año anterior en gris, año actual en azul) + una línea
// punteada de Meta como referencia. Una sola escala: mismo mes en el eje X,
// mismo eje Y (soles) para ambas series, para no caer en doble eje.
function buildChartOption({ anios, metasPorAnio, valor }) {
  const ultimoAnio = anios[anios.length - 1];
  const anioPrevio = anios[anios.length - 2];
  const meses = MONTH_NAMES.map((_, index) => index + 1);
  const metaUltimoAnio = metasPorAnio[ultimoAnio];

  const series = [];
  if (anioPrevio) {
    series.push({
      name: `Alcance ${anioPrevio}`,
      type: 'bar',
      barMaxWidth: 16,
      itemStyle: { color: '#cbd5e1', borderRadius: [3, 3, 0, 0] },
      data: meses.map((mes) => valor(anioPrevio, mes)),
    });
  }
  series.push({
    name: `Alcance ${ultimoAnio}`,
    type: 'bar',
    barMaxWidth: 16,
    itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] },
    data: meses.map((mes) => (mes > mesActual && ultimoAnio === anioActual ? null : valor(ultimoAnio, mes))),
  });
  series.push({
    name: `Meta ${ultimoAnio}`,
    type: 'line',
    lineStyle: { type: 'dashed', width: 2, color: '#dc2626' },
    itemStyle: { color: '#dc2626' },
    symbol: 'none',
    data: meses.map((mes) => metaDelMes(metaUltimoAnio, mes)),
  });

  return {
    tooltip: { trigger: 'axis', valueFormatter: (value) => (value === null ? '—' : money(value)) },
    legend: { top: 0, right: 0, textStyle: { fontSize: 11 } },
    grid: { left: 55, right: 15, top: 35, bottom: 25 },
    xAxis: { type: 'category', data: MONTH_NAMES, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` },
    },
    series,
  };
}
