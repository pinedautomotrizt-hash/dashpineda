import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Banknote, Gauge, ReceiptText, TrendingUp } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay, VariationBadge } from '../../components/dashboard/DashboardPrimitives';
import { money, moneyByCurrency, number, shortDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { friendlyEstado, estadoColor } from '../empresas/empresasLabels';

// Colores para la composicion del trabajo: se asignan por posicion (mas
// facturado primero), no por nombre fijo, porque tipo_ot es texto libre y
// puede variar (Mantenimiento, Correctivo, Carroceria y Pintura, etc.).
const TIPO_OT_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#64748b'];

// Radio/centro compartidos por ambas donas: mas angostos que antes y con el
// centro corrido hacia arriba, para que las etiquetas y la leyenda tengan
// aire alrededor en vez de pegarse al borde de la tarjeta.
const DONUT_RADIUS = ['36%', '62%'];
const DONUT_CENTER = ['50%', '42%'];

export default function AsesorPersonalDashboard({ data, filters, error }) {
  const { usuario } = useAuth();
  const resumen = data?.resumen || {};
  const porMoneda = data?.porMoneda || [];
  const porDia = data?.porDia || [];
  const porTipoOt = data?.porTipoOt || [];
  const porEstadoOt = data?.porEstadoOt || [];

  const dolares = porMoneda.find((row) => row.moneda === 'DOLARES');

  const diasSoles = useMemo(
    () => [...new Set(porDia.filter((row) => row.moneda === 'SOLES').map((row) => row.fecha))].sort(),
    [porDia],
  );
  const diarioOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => money(value),
    },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: diasSoles.map(shortDate) },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` },
    },
    series: [{
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(220, 38, 38, 0.12)' },
      lineStyle: { color: '#b91c1c', width: 3 },
      itemStyle: { color: '#b91c1c' },
      symbolSize: 7,
      data: diasSoles.map((fecha) => {
        const row = porDia.find((item) => item.fecha === fecha && item.moneda === 'SOLES');
        return Number(row?.sin_igv || 0);
      }),
    }],
  }), [diasSoles, porDia]);

  const tipoOtSoles = useMemo(
    () => porTipoOt.filter((row) => row.moneda === 'SOLES').sort((a, b) => Number(b.sin_igv) - Number(a.sin_igv)),
    [porTipoOt],
  );
  const composicionOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }) => `${name}<br/>${money(value)} (${percent}%)`,
    },
    legend: { bottom: 0, left: 'center', itemGap: 14, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: DONUT_RADIUS,
      center: DONUT_CENTER,
      avoidLabelOverlap: true,
      padAngle: 2,
      label: { formatter: '{d}%', fontSize: 12 },
      labelLine: { length: 12, length2: 10 },
      data: tipoOtSoles.map((row, index) => ({
        name: row.tipo_ot,
        value: Number(row.sin_igv || 0),
        itemStyle: { color: TIPO_OT_COLORS[index % TIPO_OT_COLORS.length] },
      })),
    }],
  }), [tipoOtSoles]);

  const estadoOtOrdenado = useMemo(
    () => [...porEstadoOt].sort((a, b) => Number(b.ots) - Number(a.ots)),
    [porEstadoOt],
  );
  const estadoOtOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }) => `${name}<br/>${number.format(value)} OT (${percent}%)`,
    },
    legend: { bottom: 0, left: 'center', itemGap: 14, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: DONUT_RADIUS,
      center: DONUT_CENTER,
      avoidLabelOverlap: true,
      padAngle: 2,
      label: { formatter: '{d}%', fontSize: 12 },
      labelLine: { length: 12, length2: 10 },
      data: estadoOtOrdenado.map((row) => ({
        name: friendlyEstado(row.estado),
        value: Number(row.ots || 0),
        itemStyle: { color: estadoColor(row.estado) },
      })),
    }],
  }), [estadoOtOrdenado]);

  return (
    <div
      className={`mx-auto max-w-[1200px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
    >
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            Mi facturación
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Hola, {usuario?.nombre?.split(' ')[0] || 'Asesor'}
          </h1>
          <p className="mt-2 text-sm text-red-50">
            Tu avance de facturación del mes.
          </p>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <DashboardFilterBar {...filters} showMeta={false} />
        </div>
      </header>
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="relative space-y-4">
        <LoadingOverlay show={filters.loading} />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            label="Facturado este mes"
            value={money(resumen.facturadoSoles)}
            hint="Sin IGV, según registro de venta"
            icon={Banknote}
            tone="blue"
          />
          <Card
            label="Comprobantes"
            value={number.format(resumen.comprobantesSoles || 0)}
            hint="Facturas y boletas emitidas"
            icon={ReceiptText}
            tone="violet"
          />
          <Card
            label="Ticket promedio"
            value={money(resumen.ticket)}
            hint="Facturado / comprobantes"
            icon={Gauge}
            tone="amber"
          />
          <Card
            label="Proyección del mes"
            value={money(resumen.proyeccionSoles)}
            hint="Según tu ritmo actual"
            icon={TrendingUp}
            tone="green"
          />
        </section>

        <section className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <span className="text-slate-500">Comparado con el mes anterior</span>
          <VariationBadge value={resumen.variacionPct} />
          <span className="text-xs text-slate-400">
            (mes anterior: {money(resumen.sinIgvMesAnterior)})
          </span>
        </section>

        {dolares && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            También facturaste {moneyByCurrency(dolares.sin_igv, 'DOLARES')} en dólares este mes
            ({number.format(dolares.comprobantes || 0)} comprobantes) — no se convierte ni se mezcla con soles.
          </section>
        )}

        <Panel
          title="Avance diario del mes"
          right={<span className="text-xs text-slate-500">Soles, sin IGV</span>}
        >
          {diasSoles.length ? (
            <div className="h-[280px]">
              <ReactECharts option={diarioOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          ) : (
            <div className="grid h-60 place-items-center text-sm text-slate-500">
              Sin facturación registrada este mes todavía.
            </div>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Composición del trabajo"
            right={<span className="text-xs text-slate-500">Mantenimiento vs. correctivo</span>}
          >
            {tipoOtSoles.length ? (
              <div className="h-[340px]">
                <ReactECharts option={composicionOption} style={{ height: '100%' }} notMerge lazyUpdate />
              </div>
            ) : (
              <div className="grid h-60 place-items-center text-sm text-slate-500">
                Sin detalle de OT clasificado este mes.
              </div>
            )}
          </Panel>

          <Panel
            title="Estado de tus OT"
            right={<span className="text-xs text-slate-500">Aperturado → Cerrado → Facturado</span>}
          >
            {estadoOtOrdenado.length ? (
              <>
                <div className="h-[280px]">
                  <ReactECharts option={estadoOtOption} style={{ height: '100%' }} notMerge lazyUpdate />
                </div>
                <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3">
                  {estadoOtOrdenado.map((row) => (
                    <div
                      key={row.estado}
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm ${row.estado === 'CERRADO' ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-600'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: estadoColor(row.estado) }} />
                        {friendlyEstado(row.estado)}
                        <span className="text-xs text-slate-400">({number.format(row.ots)} OT)</span>
                      </span>
                      <span>{money(row.venta)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Monto según el valorizado de la OT, no el monto oficial de facturación.
                </p>
              </>
            ) : (
              <div className="grid h-60 place-items-center text-sm text-slate-500">
                Sin OT registradas este mes todavía.
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
