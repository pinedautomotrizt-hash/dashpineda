import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Banknote,
  CalendarDays,
  Download,
  Gauge,
  Goal,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { Card, Panel } from '../../components/dashboard/DashboardPrimitives';
import { money, moneyByCurrency, number, pct, shortDate } from '../../utils/formatters';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';


export default function FacturacionDashboard({ data, filters, error }) {
  const summary = data?.resumen || {};
  const dailyRows = useMemo(() => {
    const grouped = new Map();
    (data?.porDia || []).forEach((row) => {
      grouped.set(row.fecha, (grouped.get(row.fecha) || 0) + Number(row.sin_igv || 0));
    });
    return [...grouped.entries()].map(([fecha, sin_igv]) => ({ fecha, sin_igv }));
  }, [data]);
  const currencies = data?.porMoneda || [];
  const dollars = currencies.find((row) => row.moneda === 'DOLARES') || {};
  const localRows = useMemo(() => {
    const grouped = new Map();
    (data?.porLocal || []).forEach((row) => {
      grouped.set(row.nombre, (grouped.get(row.nombre) || 0) + Number(row.sin_igv || 0));
    });
    return [...grouped.entries()].map(([nombre, sin_igv]) => ({ nombre, sin_igv }));
  }, [data]);
  const advisorRows = useMemo(() => {
    const grouped = new Map();
    (data?.porAsesor || []).forEach((row) => {
      const key = `${row.local_nombre}|${row.asesor}`;
      const current = grouped.get(key) || { asesor: row.asesor, local_nombre: row.local_nombre, sin_igv: 0 };
      current.sin_igv += Number(row.sin_igv || 0);
      grouped.set(key, current);
    });
    return [...grouped.values()].sort((a, b) => b.sin_igv - a.sin_igv).slice(0, 10);
  }, [data]);
  const comparativoMesAnterior = data?.comparativoMesAnterior || [];
  const comparativoSoles = comparativoMesAnterior.find((row) => row.moneda === 'SOLES') || {};
  const comparativoDolares = comparativoMesAnterior.find((row) => row.moneda === 'DOLARES') || {};
  const mixedTotalsByLocal = useMemo(() => {
    const grouped = new Map();
    (data?.porLocal || []).forEach((row) => {
      const localName = row.nombre || 'Sin local';
      const current = grouped.get(localName) || { local: localName, soles: 0, dolares: 0 };
      if (row.moneda === 'DOLARES') {
        current.dolares += Number(row.sin_igv || 0);
      } else if (row.moneda === 'SOLES') {
        current.soles += Number(row.sin_igv || 0);
      }
      grouped.set(localName, current);
    });
    return [...grouped.values()]
      .map((row) => ({ ...row, totalMixto: row.soles + row.dolares }))
      .sort((a, b) => b.totalMixto - a.totalMixto);
  }, [data]);
  const mixedGrandTotal = mixedTotalsByLocal.reduce(
    (acc, row) => ({
      soles: acc.soles + row.soles,
      dolares: acc.dolares + row.dolares,
      totalMixto: acc.totalMixto + row.totalMixto,
    }),
    { soles: 0, dolares: 0, totalMixto: 0 },
  );
  const fiscalRowsByLocal = useMemo(() => {
    const grouped = new Map();
    (data?.porLocal || []).forEach((row) => {
      const name = row.nombre || 'Sin local';
      const current = grouped.get(name) || {
        nombre: name,
        sinIgv: 0,
        impuesto: 0,
        comprobantes: 0,
      };
      current.sinIgv += Number(row.sin_igv || 0);
      current.impuesto += Number(row.impuesto || 0);
      current.comprobantes += Number(row.comprobantes || 0);
      grouped.set(name, current);
    });
    return [...grouped.values()].map((row) => ({
      ...row,
      ticket: row.comprobantes ? row.sinIgv / row.comprobantes : 0,
    }));
  }, [data]);
  const documentRows = useMemo(() => {
    const grouped = new Map();
    (data?.porDocumento || []).forEach((row) => {
      grouped.set(row.nombre, (grouped.get(row.nombre) || 0) + Number(row.sin_igv || 0));
    });
    return [...grouped.entries()]
      .map(([nombre, sin_igv]) => ({ nombre, sin_igv }))
      .sort((a, b) => b.sin_igv - a.sin_igv);
  }, [data]);
  const paymentRows = useMemo(() => {
    const grouped = new Map();
    (data?.porPago || []).forEach((row) => {
      grouped.set(row.nombre, (grouped.get(row.nombre) || 0) + Number(row.sin_igv || 0));
    });
    return [...grouped.entries()]
      .map(([nombre, sin_igv]) => ({ nombre, sin_igv }))
      .sort((a, b) => b.sin_igv - a.sin_igv)
      .slice(0, 6);
  }, [data]);
  const bestDay = dailyRows.reduce(
    (best, row) => (Number(row.sin_igv || 0) > Number(best.sin_igv || 0) ? row : best),
    { fecha: null, sin_igv: 0 },
  );
  const activeDays = dailyRows.filter((row) => Number(row.sin_igv || 0) !== 0).length;
  const dailyAverage = activeDays ? mixedGrandTotal.totalMixto / activeDays : 0;
  let runningTotal = 0;
  const cumulativeRows = dailyRows.map((row) => {
    runningTotal += Number(row.sin_igv || 0);
    return runningTotal;
  });

  const dailyOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
    grid: { left: 55, right: 55, top: 45, bottom: 30 },
    xAxis: { type: 'category', data: dailyRows.map((row) => shortDate(row.fecha)) },
    legend: { top: 0, right: 0 },
    series: [
      {
        name: 'Venta diaria',
        type: 'bar',
        barMaxWidth: 24,
        itemStyle: { color: '#2563eb', borderRadius: [5, 5, 0, 0] },
        data: dailyRows.map((row) => Number(row.sin_igv || 0)),
      },
      {
        name: 'Acumulado',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        lineStyle: { width: 3, color: '#0f9f6e' },
        itemStyle: { color: '#0f9f6e' },
        data: cumulativeRows,
      },
    ],
    yAxis: [
      { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
      { type: 'value', splitLine: { show: false }, axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    ],
  };

  const localOption = {
    tooltip: { trigger: 'item', valueFormatter: (value) => money(value) },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      label: { formatter: '{b}\n{d}%' },
      data: localRows.map((row) => ({ name: row.nombre, value: Number(row.sin_igv || 0) })),
    }],
  };

  const advisorOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => money(value) },
    grid: { left: 180, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: advisorRows.map((row) => row.asesor),
      axisLabel: { width: 160, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 24,
      itemStyle: { color: '#155eef', borderRadius: [0, 5, 5, 0] },
      data: advisorRows.map((row) => Number(row.sin_igv || 0)),
    }],
  };

  const documentOption = {
    tooltip: { trigger: 'item', valueFormatter: (value) => money(value) },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      name: 'Documentos',
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      label: { formatter: '{d}%' },
      data: documentRows.map((row) => ({ name: row.nombre, value: row.sin_igv })),
    }],
  };

  const paymentOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => money(value) },
    grid: { left: 110, right: 20, top: 10, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: paymentRows.map((row) => row.nombre),
      axisLabel: { width: 100, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { color: '#7c3aed', borderRadius: [0, 5, 5, 0] },
      data: paymentRows.map((row) => row.sin_igv),
    }],
  };

  const comparisonOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => money(value) },
    legend: { top: 0, right: 0 },
    grid: { left: 60, right: 20, top: 45, bottom: 35 },
    xAxis: { type: 'category', data: ['Documentos en soles', 'Documentos en US$'] },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    series: [
      {
        name: 'Mes anterior',
        type: 'bar',
        barMaxWidth: 34,
        itemStyle: { color: '#cbd5e1', borderRadius: [5, 5, 0, 0] },
        data: [Number(comparativoSoles.sinIgvAnterior || 0), Number(comparativoDolares.sinIgvAnterior || 0)],
      },
      {
        name: 'Mes actual',
        type: 'bar',
        barMaxWidth: 34,
        itemStyle: { color: '#dc2626', borderRadius: [5, 5, 0, 0] },
        data: [Number(comparativoSoles.sinIgvActual || 0), Number(comparativoDolares.sinIgvActual || 0)],
      },
    ],
  };

  const taxCompositionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => money(value) },
    legend: { top: 0, right: 0 },
    grid: { left: 120, right: 25, top: 45, bottom: 30 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    yAxis: { type: 'category', data: fiscalRowsByLocal.map((row) => row.nombre) },
    series: [
      {
        name: 'Base sin IGV',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#2563eb' },
        data: fiscalRowsByLocal.map((row) => row.sinIgv),
      },
      {
        name: 'IGV',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#f59e0b', borderRadius: [0, 5, 5, 0] },
        data: fiscalRowsByLocal.map((row) => row.impuesto),
      },
    ],
  };

  const ticketLocalOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => money(value) },
    grid: { left: 120, right: 25, top: 20, bottom: 30 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => money(value) } },
    yAxis: { type: 'category', inverse: true, data: fiscalRowsByLocal.map((row) => row.nombre) },
    series: [{
      type: 'bar',
      barMaxWidth: 32,
      itemStyle: { color: '#059669', borderRadius: [0, 6, 6, 0] },
      data: fiscalRowsByLocal.map((row) => row.ticket),
    }],
  };

  return (
    <div className={`mx-auto max-w-[1680px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">Reporte ejecutivo</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Facturación y avance comercial</h1>
          <p className="mt-2 max-w-2xl text-sm text-red-50">
            Venta oficial sin IGV, conciliada con facturas, notas de crédito, anulaciones y órdenes de trabajo.
          </p>
          
        </div>
        <div className="mt-4 rounded-lg bg-white p-2 text-slate-900 shadow-sm lg:mt-0">
          <DashboardFilterBar {...filters} />
        </div>
      </header>
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {mixedTotalsByLocal.map((row) => (
          <Card
            key={row.local}
            label={row.local}
            value={money(row.totalMixto)}
            hint="Incluye documentos en dólares convertidos a soles"
            icon={Banknote}
            tone="amber"
          />
        ))}
        <Card
          label="Total general"
          value={money(mixedGrandTotal.totalMixto)}
          hint="Equivalente en soles · No incluye Mostrador"
          icon={TrendingUp}
          tone="green"
        />
        <Card
          label="Venta de repuestos / Mostrador"
          value={money(data?.mostrador?.sin_igv)}
          hint={`${number.format(data?.mostrador?.comprobantes || 0)} comprobante(s) · No suma al total`}
          icon={ReceiptText}
          tone="amber"
        />
        <Card label="Documentos en dolares" value={moneyByCurrency(dollars.moneda_usd, 'DOLARES')} hint="Importe original informativo" icon={Banknote} tone="violet" />
        <Card label="Meta mensual" value={money(summary.meta)} hint={`${pct(summary.avanceMeta)} de avance`} icon={Goal} tone="blue" />
        <Card label="Proyección" value={money(summary.proyeccionSoles)} hint={`${summary.diasTranscurridos || 0} de ${summary.diasMes || 0} días`} icon={TrendingUp} tone="green" />
        <Card label="Brecha" value={money(summary.brecha)} hint={summary.brecha >= 0 ? 'Meta superada' : 'Falta para la meta'} icon={CalendarDays} tone={summary.brecha >= 0 ? 'green' : 'rose'} />
        <Card label="Comprobantes" value={number.format(summary.comprobantesSoles || 0)} hint={`${number.format(summary.clientesSoles || 0)} clientes`} icon={ReceiptText} tone="violet" />
        <Card label="Ticket promedio" value={money(summary.ticket)} hint="Venta / comprobantes" icon={Gauge} tone="amber" />
      </section>
      <section className="mb-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Evolución diaria y acumulada"
            right={<span className="text-xs text-slate-500">Venta neta sin IGV</span>}
          >
            <div className="h-[260px] sm:h-[320px] lg:h-[380px]">
              <ReactECharts option={dailyOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
        </div>
        <Panel title="Participación por sede" right={<span className="text-xs text-slate-500">Equivalente en soles</span>}>
          <div className="h-[260px] sm:h-[320px] lg:h-[380px]">
            <ReactECharts option={localOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
      </section>
      <section className="mb-4">
        <Panel title="Ranking ejecutivo de asesores" right={<span className="text-xs text-slate-500">Factura distribuida por OT</span>}>
          <ReactECharts option={advisorOption} style={{ height: Math.max(420, advisorRows.length * 46) }} notMerge lazyUpdate />
        </Panel>
      </section>
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Composición por tipo de comprobante" right={<span className="text-xs text-slate-500">Participación del neto facturado</span>}>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
            <ReactECharts option={documentOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
        <Panel title="Facturación por forma de pago" right={<span className="text-xs text-slate-500">Principales modalidades</span>}>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
            <ReactECharts option={paymentOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
      </section>
      <section className="mb-5 grid gap-4 sm:grid-cols-3">
        <MiniStat label="Promedio por día activo" value={money(dailyAverage)} tone="blue" icon={Gauge} large />
        <MiniStat label="Mejor día del periodo" value={bestDay.fecha ? `${shortDate(bestDay.fecha)} · ${money(bestDay.sin_igv)}` : 'Sin datos'} tone="green" icon={TrendingUp} large />
        <MiniStat label="Días con movimiento" value={`${activeDays} día(s)`} tone="red" icon={CalendarDays} large />
      </section>
      <section className="mb-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Comparativo con el mes anterior"
          right={<span className="text-xs text-slate-500">Importes equivalentes en soles</span>}
        >
          <div className="h-[260px] sm:h-[320px] lg:h-[380px]">
            <ReactECharts option={comparisonOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
        <Panel
          title="Composición fiscal por sede"
          right={<span className="text-xs text-slate-500">Base sin IGV + impuesto</span>}
        >
          <div className="h-[260px] sm:h-[320px] lg:h-[380px]">
            <ReactECharts option={taxCompositionOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
      </section>
      <section className="mb-4">
        <Panel
          title="Ticket promedio por sede"
          right={<span className="text-xs text-slate-500">Venta neta / comprobantes</span>}
        >
          <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
            <ReactECharts option={ticketLocalOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MiniStat({ label, value, tone = 'slate', large = false, icon: Icon }) {
  const tones = {
    slate: {
      card: 'border-slate-200 bg-gradient-to-br from-white to-slate-100 text-slate-950',
      icon: 'bg-slate-900 text-white',
      glow: 'bg-slate-300',
    },
    blue: {
      card: 'border-blue-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 text-blue-950',
      icon: 'bg-blue-700 text-white',
      glow: 'bg-blue-300',
    },
    green: {
      card: 'border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-emerald-950',
      icon: 'bg-emerald-700 text-white',
      glow: 'bg-emerald-300',
    },
    amber: {
      card: 'border-amber-200 bg-gradient-to-br from-white via-amber-50 to-amber-100 text-amber-950',
      icon: 'bg-amber-600 text-white',
      glow: 'bg-amber-300',
    },
    red: {
      card: 'border-red-200 bg-gradient-to-br from-white via-red-50 to-red-100 text-red-950',
      icon: 'bg-red-700 text-white',
      glow: 'bg-red-300',
    },
  };
  const palette = tones[tone] || tones.slate;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${large ? 'min-h-36 p-5' : 'p-3'} ${palette.card}`}>
      <div className={`absolute -bottom-12 -right-8 h-32 w-32 rounded-full opacity-30 blur-2xl ${palette.glow}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`${large ? 'text-sm' : 'text-xs'} font-semibold text-slate-600`}>{label}</p>
          <p className={`${large ? 'mt-5 text-3xl' : 'mt-1 text-lg'} font-black tracking-tight truncate`}>{value}</p>
        </div>
        {Icon && (
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl shadow-md transition group-hover:scale-105 ${palette.icon}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
