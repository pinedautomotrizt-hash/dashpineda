import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ActivitySquare, Banknote, Clock3, Gauge, ReceiptText, TrendingUp } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay, VariationBadge } from '../../components/dashboard/DashboardPrimitives';
import { money, moneyByCurrency, number, shortDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { darkMode } = useTheme();

  const resumen = data?.resumen || {};
  const porMoneda = data?.porMoneda || [];
  const porDia = data?.porDia || [];
  const porTipoOt = data?.porTipoOt || [];
  const porEstadoOt = data?.porEstadoOt || [];

  const dolares = porMoneda.find((row) => row.moneda === 'DOLARES');

  // Colores base de los graficos segun el modo, para que ejes/leyendas/tooltip
  // sigan siendo legibles sobre fondo negro (una paleta aparte, no solo el
  // fondo de la tarjeta).
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const splitLineColor = darkMode ? '#1e293b' : '#f1f5f9';
  const legendTextColor = darkMode ? '#cbd5e1' : '#475569';
  const tooltipStyle = darkMode
    ? { backgroundColor: '#0f172a', borderColor: '#1e293b', textStyle: { color: '#f1f5f9' } }
    : {};

  const diasSoles = useMemo(
    () => [...new Set(porDia.filter((row) => row.moneda === 'SOLES').map((row) => row.fecha))].sort(),
    [porDia],
  );
  const diarioOption = useMemo(() => ({
    tooltip: { trigger: 'axis', valueFormatter: (value) => money(value), ...tooltipStyle },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: diasSoles.map(shortDate), axisLabel: { color: axisColor }, axisLine: { lineStyle: { color: splitLineColor } } },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k`, color: axisColor },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series: [{
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(220, 38, 38, 0.12)' },
      lineStyle: { color: '#dc2626', width: 3 },
      itemStyle: { color: '#dc2626' },
      symbolSize: 7,
      data: diasSoles.map((fecha) => {
        const row = porDia.find((item) => item.fecha === fecha && item.moneda === 'SOLES');
        return Number(row?.sin_igv || 0);
      }),
    }],
  }), [diasSoles, porDia, axisColor, splitLineColor, tooltipStyle]);

  const tipoOtSoles = useMemo(
    () => porTipoOt.filter((row) => row.moneda === 'SOLES').sort((a, b) => Number(b.sin_igv) - Number(a.sin_igv)),
    [porTipoOt],
  );
  const composicionOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }) => `${name}<br/>${money(value)} (${percent}%)`,
      ...tooltipStyle,
    },
    legend: { bottom: 0, left: 'center', itemGap: 14, textStyle: { fontSize: 11, color: legendTextColor } },
    series: [{
      type: 'pie',
      radius: DONUT_RADIUS,
      center: DONUT_CENTER,
      avoidLabelOverlap: true,
      padAngle: 2,
      label: { formatter: '{d}%', fontSize: 12, color: legendTextColor },
      labelLine: { length: 12, length2: 10, lineStyle: { color: axisColor } },
      itemStyle: darkMode ? { borderColor: '#0f172a', borderWidth: 2 } : {},
      data: tipoOtSoles.map((row, index) => ({
        name: row.tipo_ot,
        value: Number(row.sin_igv || 0),
        itemStyle: { color: TIPO_OT_COLORS[index % TIPO_OT_COLORS.length] },
      })),
    }],
  }), [tipoOtSoles, legendTextColor, axisColor, darkMode, tooltipStyle]);

  const estadoOtOrdenado = useMemo(
    () => [...porEstadoOt].sort((a, b) => Number(b.ots) - Number(a.ots)),
    [porEstadoOt],
  );
  const estadoOtOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }) => `${name}<br/>${number.format(value)} OT (${percent}%)`,
      ...tooltipStyle,
    },
    legend: { bottom: 0, left: 'center', itemGap: 14, textStyle: { fontSize: 11, color: legendTextColor } },
    series: [{
      type: 'pie',
      radius: DONUT_RADIUS,
      center: DONUT_CENTER,
      avoidLabelOverlap: true,
      padAngle: 2,
      label: { formatter: '{d}%', fontSize: 12, color: legendTextColor },
      labelLine: { length: 12, length2: 10, lineStyle: { color: axisColor } },
      itemStyle: darkMode ? { borderColor: '#0f172a', borderWidth: 2 } : {},
      data: estadoOtOrdenado.map((row) => ({
        name: friendlyEstado(row.estado),
        value: Number(row.ots || 0),
        itemStyle: { color: estadoColor(row.estado) },
      })),
    }],
  }), [estadoOtOrdenado, legendTextColor, axisColor, darkMode, tooltipStyle]);

  return (
    <div className={`min-h-screen w-full transition-colors ${darkMode ? 'bg-slate-950' : ''}`}>
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
            <DashboardFilterBar {...filters} />
          </div>
        </header>

        {error && (
          <div className={`mb-4 rounded-lg border p-3 text-sm ${darkMode ? 'border-rose-900 bg-rose-950 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {error}
          </div>
        )}
        <div className="relative space-y-4">
          <LoadingOverlay show={filters.loading} dark={darkMode} />

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Card
              label="Facturado este mes"
              value={money(resumen.facturadoSoles)}
              hint="Sin IGV, según registro de venta"
              icon={Banknote}
              tone="blue"
              dark={darkMode}
            />
            <Card
              label="Comprobantes"
              value={number.format(resumen.comprobantesSoles || 0)}
              hint="Facturas y boletas emitidas"
              icon={ReceiptText}
              tone="violet"
              dark={darkMode}
            />
            <Card
              label="Ticket promedio"
              value={money(resumen.ticket)}
              hint="Facturado / comprobantes"
              icon={Gauge}
              tone="amber"
              dark={darkMode}
            />
            <Card
              label="Proyección del mes"
              value={money(resumen.proyeccionSoles)}
              hint="Según tu ritmo actual"
              icon={TrendingUp}
              tone="green"
              dark={darkMode}
            />
            <Card
              label="Variación vs. mes anterior"
              value={<VariationBadge value={resumen.variacionPct} size="lg" />}
              hint={
                <span className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mes pasado: {money(resumen.sinIgvMesAnterior)}
                </span>
              }
              icon={ActivitySquare}
              tone={resumen.variacionPct >= 0 ? 'green' : 'rose'}
              dark={darkMode}
            />
            <Card
              label="Pendiente de facturar"
              value={money(resumen.montoOtCerradas)}
              hint={<span className="flex items-center gap-1.5">OT cerradas <VariationBadge value={resumen.variacionOtCerradasPct} /></span>}
              icon={Clock3}
              tone="rose"
              dark={darkMode}
            />
          </section>

          {dolares && (
            <section className={`rounded-lg border p-3 text-sm ${darkMode ? 'border-emerald-900 bg-emerald-950 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              También facturaste {moneyByCurrency(dolares.sin_igv, 'DOLARES')} en dólares este mes
              ({number.format(dolares.comprobantes || 0)} comprobantes).
            </section>
          )}

          <Panel
            title="Avance diario del mes"
            right={<span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Soles, sin IGV</span>}
            dark={darkMode}
          >
            {diasSoles.length ? (
              <div className="h-[280px]">
                <ReactECharts option={diarioOption} style={{ height: '100%' }} notMerge lazyUpdate />
              </div>
            ) : (
              <div className={`grid h-60 place-items-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Sin facturación registrada este mes todavía.
              </div>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Composición del trabajo"
              right={<span className="text-xs text-slate-500">Mantenimiento vs. correctivo</span>}
              dark={darkMode}
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
              dark={darkMode}
            >
              {estadoOtOrdenado.length ? (
                <>
                  <div className="h-[280px]">
                    <ReactECharts option={estadoOtOption} style={{ height: '100%' }} notMerge lazyUpdate />
                  </div>
                  <div className={`mt-2 space-y-1.5 border-t pt-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    {estadoOtOrdenado.map((row) => (
                      <div
                        key={row.estado}
                        className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm ${
                          row.estado === 'CERRADO'
                            ? (darkMode ? 'bg-slate-800 font-semibold text-white' : 'bg-slate-50 font-semibold text-slate-900')
                            : (darkMode ? 'text-slate-300' : 'text-slate-600')
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: estadoColor(row.estado) }} />
                          {friendlyEstado(row.estado)}
                          <span className={darkMode ? 'text-xs text-slate-500' : 'text-xs text-slate-400'}>({number.format(row.ots)} OT)</span>
                        </span>
                        <span>{money(row.venta)}</span>
                      </div>
                    ))}
                  </div>
                  <p className={`mt-2 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
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
    </div>
  );
}
