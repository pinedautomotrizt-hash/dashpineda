import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Repeat } from 'lucide-react';
import { Panel, LoadingOverlay } from './DashboardPrimitives';
import { number } from '../../utils/formatters';
import { MONTH_NAMES } from '../../config/appConfig';
import { api } from '../../api';

// Colores de "recurrente" y "nueva" (validados para daltonismo). El texto de
// los valores va en tinta neutra; el color solo identifica la serie.
const COLOR_RECURRENTE = '#1d4ed8';
const COLOR_NUEVA = '#c2410c';

const hoy = new Date();
const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

const tasa = (volvieron, base) => (base ? (volvieron / base) * 100 : null);
const pct1 = (value) => (value === null ? '—' : `${value.toFixed(1)}%`);

function nombreSemestre(inicio) {
  const [anio, mes] = inicio.split('-');
  return `${mes === '01' ? '1er' : '2do'} sem. ${anio}`;
}

function nombreMes(mes) {
  const [anio, numero] = mes.split('-');
  return `${MONTH_NAMES[Number(numero) - 1]} ${anio.slice(2)}`;
}

// Retención de clientes por placa: qué porcentaje de los vehículos atendidos
// en un semestre vuelve al taller dentro de los 12 meses siguientes, y cuántas
// placas de cada mes son nuevas o recurrentes. Vive aparte del filtro de
// mes/sede de la página porque mira periodos largos.
export default function RetencionClientesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/retencion')
      .then(({ data: response }) => setData(response))
      .catch((requestError) => {
        setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar la retención de clientes');
      })
      .finally(() => setLoading(false));
  }, []);

  const sedes = useMemo(() => {
    const semestres = data?.semestres || [];
    const nombres = [...new Set(semestres.map((fila) => fila.local_nombre))].sort((a, b) => a.localeCompare(b, 'es'));

    return nombres.map((sede) => {
      const filas = semestres
        .filter((fila) => fila.local_nombre === sede)
        .map((fila) => ({
          inicio: fila.inicio,
          base: Number(fila.placas_base || 0),
          volvieron: Number(fila.volvieron || 0),
          completo: Number(fila.completo) === 1,
          mesesVentana: Number(fila.meses_ventana || 0),
        }));
      const ultimoCompleto = [...filas].reverse().find((fila) => fila.completo) || null;
      const servicios = ultimoCompleto
        ? (data?.porServicio || [])
          .filter((fila) => fila.local_nombre === sede && fila.inicio === ultimoCompleto.inicio)
          .map((fila) => ({
            servicio: fila.servicio,
            base: Number(fila.placas_base || 0),
            volvieron: Number(fila.volvieron || 0),
          }))
        : [];
      const meses = (data?.nuevosRecurrentes || [])
        .filter((fila) => fila.local_nombre === sede)
        .map((fila) => ({
          mes: fila.mes,
          nuevas: Number(fila.nuevos || 0),
          recurrentes: Number(fila.recurrentes || 0),
        }));
      return { sede, filas, ultimoCompleto, servicios, meses };
    });
  }, [data]);

  const primerMes = sedes.flatMap((sede) => sede.meses).map((fila) => fila.mes).sort()[0];

  return (
    <section className="mb-4">
      <Panel
        title="Retención de clientes"
        right={<span className="text-xs text-slate-500">Placas que vuelven al taller dentro de 12 meses · sin reprocesos ni garantías</span>}
      >
        {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="relative">
          <LoadingOverlay show={loading} />
          <div className="grid gap-4 lg:grid-cols-2">
            {sedes.map((sede) => (
              <SedeRetencion key={sede.sede} {...sede} />
            ))}
          </div>
          {!loading && !error && !sedes.length && (
            <div className="grid h-40 place-items-center text-sm text-slate-500">Sin visitas registradas.</div>
          )}
          <div className="mt-4 space-y-1 text-xs text-slate-500">
            <p>
              <span className="font-semibold text-slate-600">Retención</span> = placas atendidas en el semestre que volvieron en
              los 12 meses siguientes ÷ placas atendidas en el semestre. <span className="font-semibold text-slate-600">Pérdida</span> = 100% − retención.
              El retorno se cuenta en la misma sede. Si los 12 meses aún no terminan, la retención es parcial y todavía puede subir.
            </p>
            <p>
              <span className="font-semibold text-slate-600">Recurrente</span> = placa que ya tenía una visita anterior en esa sede.
              La data empieza en enero 2025, por eso el gráfico arranca en {primerMes ? nombreMes(primerMes) : '—'}; el mes en curso está incompleto.
            </p>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function SedeRetencion({ sede, filas, ultimoCompleto, servicios, meses }) {
  const retencion = ultimoCompleto ? tasa(ultimoCompleto.volvieron, ultimoCompleto.base) : null;

  const opcionMeses = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const fila = meses[items[0].dataIndex];
        const total = fila.nuevas + fila.recurrentes;
        const parte = (valor) => (total ? ` (${((valor / total) * 100).toFixed(0)}%)` : '');
        return [
          `<b>${nombreMes(fila.mes)}${fila.mes === mesActual ? ' · en curso' : ''}</b>`,
          `Recurrentes: ${number.format(fila.recurrentes)}${parte(fila.recurrentes)}`,
          `Nuevas: ${number.format(fila.nuevas)}${parte(fila.nuevas)}`,
          `Total placas: ${number.format(total)}`,
        ].join('<br/>');
      },
    },
    legend: { top: 0, right: 0, textStyle: { fontSize: 11 } },
    grid: { left: 40, right: 10, top: 35, bottom: 25 },
    xAxis: {
      type: 'category',
      data: meses.map((fila) => nombreMes(fila.mes)),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#475569', fontSize: 10, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: 'Recurrentes',
        type: 'bar',
        stack: 'placas',
        barMaxWidth: 18,
        itemStyle: { color: COLOR_RECURRENTE, borderColor: '#ffffff', borderWidth: 1 },
        data: meses.map((fila) => fila.recurrentes),
      },
      {
        name: 'Nuevas',
        type: 'bar',
        stack: 'placas',
        barMaxWidth: 18,
        itemStyle: { color: COLOR_NUEVA, borderColor: '#ffffff', borderWidth: 1, borderRadius: [3, 3, 0, 0] },
        data: meses.map((fila) => fila.nuevas),
      },
    ],
  }), [meses]);

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-50 text-blue-700"><Repeat size={15} /></span>
        {sede}
      </h3>

      {ultimoCompleto ? (
        <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-slate-500">Retención · {nombreSemestre(ultimoCompleto.inicio)}</p>
            <p className="text-3xl font-black tracking-tight text-slate-950">{pct1(retencion)}</p>
            <p className="text-xs text-slate-500">
              {number.format(ultimoCompleto.volvieron)} de {number.format(ultimoCompleto.base)} placas volvieron
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pérdida</p>
            <p className="text-xl font-bold text-slate-700">{pct1(100 - retencion)}</p>
            <p className="text-xs text-slate-500">
              {number.format(ultimoCompleto.base - ultimoCompleto.volvieron)} placas no volvieron
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-xs text-slate-500">Todavía no hay un semestre con sus 12 meses siguientes completos.</p>
      )}

      <div className="mb-4 overflow-x-auto rounded-md border border-slate-100">
        <table className="w-full min-w-[420px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="px-3 py-2 text-left font-semibold">Semestre</th>
              <th className="px-3 py-2 text-right font-semibold">Placas</th>
              <th className="px-3 py-2 text-right font-semibold">Volvieron</th>
              <th className="px-3 py-2 text-right font-semibold">Retención</th>
              <th className="px-3 py-2 text-right font-semibold">Ventana</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.inicio} className={`border-t border-slate-100 ${fila.completo ? 'text-slate-900' : 'text-slate-500'}`}>
                <td className="whitespace-nowrap px-3 py-2 text-left font-medium">{nombreSemestre(fila.inicio)}</td>
                <td className="px-3 py-2 text-right">{number.format(fila.base)}</td>
                <td className="px-3 py-2 text-right">{number.format(fila.volvieron)}</td>
                <td className="px-3 py-2 text-right font-semibold">{pct1(tasa(fila.volvieron, fila.base))}</td>
                <td className="px-3 py-2 text-right">
                  {fila.completo ? 'Completa' : `Parcial · ${fila.mesesVentana} de 12 meses`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {servicios.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Retención según el servicio de la primera visita · {nombreSemestre(ultimoCompleto.inicio)}
          </p>
          <div className="space-y-2">
            {servicios.map((fila) => {
              const valor = tasa(fila.volvieron, fila.base);
              return (
                <div key={fila.servicio} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-700">{fila.servicio}</p>
                    <p className="text-[11px] text-slate-500">{number.format(fila.volvieron)} de {number.format(fila.base)}</p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${valor ?? 0}%`, backgroundColor: COLOR_RECURRENTE }} />
                  </div>
                  <p className="text-right font-semibold text-slate-900">{pct1(valor)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {meses.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Placas atendidas por mes: recurrentes vs. nuevas</p>
          <div className="h-[220px]">
            <ReactECharts option={opcionMeses} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </div>
      )}
    </div>
  );
}
