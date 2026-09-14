import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { RotateCcw } from 'lucide-react';
import { Panel, LoadingOverlay } from './DashboardPrimitives';
import { money, number } from '../../utils/formatters';

const anioActual = new Date().getFullYear();

// Colores por sede (validados para daltonismo), mismos tonos que ya usan los
// gráficos del dashboard. El color sigue a la sede, nunca al orden.
const COLOR_SEDE = {
  'Pineda Callao': '#2563eb',
  'Pineda Trujillo': '#0f9f6e',
};
const colorSede = (sede) => COLOR_SEDE[sede] || '#64748b';

// División real reprocesos ÷ facturación, sin pasarla a porcentaje. Se
// muestran 6 decimales para no perder los ceros: 5,978 ÷ 1,091,820 = 0.005475.
const division = (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(6));

const montoCorto = (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`);

// Balance anual de reprocesos: cuánto suman las OT de reproceso de cada año y
// cuánto representan de la facturación oficial sin IGV de ese año (división),
// por sede. Recibe la data ya cargada por ProyeccionAnualPanel.
export default function ReprocesosAnualPanel({ filas, reprocesos, loading }) {
  const resumen = useMemo(() => {
    const facturado = new Map();
    filas.forEach((fila) => {
      const clave = `${fila.local_nombre}|${fila.anio}`;
      facturado.set(clave, (facturado.get(clave) || 0) + Number(fila.facturado || 0));
    });
    const reproceso = new Map(
      reprocesos.map((fila) => [`${fila.local_nombre}|${fila.anio}`, fila]),
    );

    const sedes = [...new Set([...filas, ...reprocesos].map((fila) => fila.local_nombre))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    );
    const anios = [...new Set([...filas, ...reprocesos].map((fila) => Number(fila.anio)))]
      .filter((anio) => anio <= anioActual)
      .sort((a, b) => a - b);

    const celda = (sede, anio) => {
      const totalFacturado = facturado.get(`${sede}|${anio}`) || 0;
      const fila = reproceso.get(`${sede}|${anio}`);
      const monto = Number(fila?.monto || 0);
      return {
        facturado: totalFacturado,
        monto,
        ots: Number(fila?.ots || 0),
        proporcion: totalFacturado ? monto / totalFacturado : null,
      };
    };

    return { sedes, anios, celda };
  }, [filas, reprocesos]);

  const { sedes, anios, celda } = resumen;
  const etiquetaAnio = (anio) => (anio === anioActual ? `${anio} (a la fecha)` : String(anio));

  const opcionMonto = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => money(value),
      },
      legend: { top: 0, right: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 15, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: anios.map(etiquetaAnio), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#475569' } },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { formatter: montoCorto },
      },
      series: sedes.map((sede) => ({
        name: sede,
        type: 'bar',
        barMaxWidth: 32,
        barGap: '90%',
        itemStyle: { color: colorSede(sede), borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', fontSize: 11, color: '#334155', formatter: ({ value }) => money(value) },
        data: anios.map((anio) => celda(sede, anio).monto),
      })),
    }),
    [sedes, anios, celda],
  );

  const opcionDivision = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => division(value),
      },
      legend: { top: 0, right: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 15, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: anios.map(etiquetaAnio), axisLine: { lineStyle: { color: '#e2e8f0' } }, axisLabel: { color: '#475569' } },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { formatter: (value) => Number(value).toFixed(3) },
      },
      series: sedes.map((sede) => ({
        name: sede,
        type: 'bar',
        barMaxWidth: 32,
        barGap: '90%',
        itemStyle: { color: colorSede(sede), borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', fontSize: 11, color: '#334155', formatter: ({ value }) => division(value) },
        data: anios.map((anio) => celda(sede, anio).proporcion),
      })),
    }),
    [sedes, anios, celda],
  );

  return (
    <section className="mb-4">
      <Panel
        title="Reprocesos vs. facturación anual"
        right={<span className="text-xs text-slate-500">Valor sin IGV de OT de reproceso · reprocesos ÷ facturación oficial del año</span>}
      >
        <div className="relative">
          <LoadingOverlay show={loading} />

          <div className="grid gap-4 lg:grid-cols-2">
            {sedes.map((sede) => (
              <div key={sede} className="min-w-0 rounded-lg border border-slate-200">
                <h3 className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm font-bold text-slate-900">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorSede(sede) }} />
                  <RotateCcw size={14} className="text-slate-500" />
                  {sede}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        <th className="px-3 py-2 text-left font-semibold">Año</th>
                        <th className="px-3 py-2 text-right font-semibold">Facturación</th>
                        <th className="px-3 py-2 text-right font-semibold">Reprocesos</th>
                        <th className="px-3 py-2 text-right font-semibold">OT</th>
                        <th className="px-3 py-2 text-right font-semibold">Reproceso ÷ facturación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anios.map((anio) => {
                        const datos = celda(sede, anio);
                        return (
                          <tr key={anio} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-left font-medium text-slate-700">{etiquetaAnio(anio)}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{money(datos.facturado)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-900">{money(datos.monto)}</td>
                            <td className="px-3 py-2 text-right text-slate-600">{number.format(datos.ots)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-slate-900">{division(datos.proporcion)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {sedes.length > 0 && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold text-slate-600">Monto de reprocesos por año (S/ sin IGV)</p>
                <div className="h-[240px] sm:h-[280px]">
                  <ReactECharts option={opcionMonto} style={{ height: '100%' }} notMerge lazyUpdate />
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold text-slate-600">Reprocesos ÷ facturación del año</p>
                <div className="h-[240px] sm:h-[280px]">
                  <ReactECharts option={opcionDivision} style={{ height: '100%' }} notMerge lazyUpdate />
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Reprocesos agrupados por año de apertura de la OT. Los reprocesos liquidados se cierran en S/ 0
            (se absorben internamente), por eso solo suman monto los facturados, aperturados y cerrados.
          </p>
        </div>
      </Panel>
    </section>
  );
}
