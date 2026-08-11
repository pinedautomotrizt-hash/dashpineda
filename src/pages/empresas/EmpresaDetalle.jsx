import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, Building2, Car, Clock, Gauge, ShieldAlert, TimerReset, Wrench, X } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import Vehicle3DViewer from '../../components/Vehicle3DViewer';
import { number, shortDate } from '../../utils/formatters';
import { APP_PATHS } from '../../config/appConfig';
import { MONTH_NAMES } from '../../config/appConfig';
import { friendlyGrupo, friendlyEstado, estadoBadgeClass, estadoColor, RANGO_DIAS_LABELS } from './empresasLabels';

const OTROS_SERVICIO = 'Otros';
const TOP_SERVICIOS = 9;

// Ocultas temporalmente a pedido del usuario (se van a reutilizar mas
// adelante, por eso quedan como flag y no se borra el codigo que las arma).
const MOSTRAR_CARD_REPROCESOS = false;
const MOSTRAR_CARDS_TIEMPO_EXTREMO = false;

// Mismo patron de modal que ya usa DashboardPage.jsx (fondo oscuro + tarjeta
// blanca centrada) para no introducir un segundo estilo de modal en el proyecto.
// Solo el "cascaron" (fondo, tarjeta, encabezado, boton cerrar) es compartido;
// cada uso decide que tabla mostrar adentro via children.
function DetalleModal({ titulo, subtitulo, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-950">{titulo}</h3>
            <p className="text-sm text-slate-500">{subtitulo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function OtTiempoTable({ filas }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs text-slate-500">
          <th className="py-2 pr-3 font-semibold">Placa</th>
          <th className="px-3 py-2 font-semibold">Entrada</th>
          <th className="px-3 py-2 font-semibold">Salida</th>
          <th className="px-3 py-2 font-semibold">Estado</th>
          <th className="py-2 pl-3 text-right font-semibold">Días</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((row) => (
          <tr key={row.nro_orden} className="border-b border-slate-100">
            <td className="py-2 pr-3 text-slate-700">{row.placa || 'Sin placa'}</td>
            <td className="px-3 py-2 text-slate-600">{shortDate(row.fecha_apertura) || '—'}</td>
            <td className="px-3 py-2 text-slate-600">{shortDate(row.fecha_cierre) || 'En taller'}</td>
            <td className="px-3 py-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadgeClass(row.estado)}`}>
                {friendlyEstado(row.estado)}
              </span>
            </td>
            <td className="py-2 pl-3 text-right font-semibold text-slate-950">
              {row.dias === null ? 'En taller' : `${row.dias} d`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OtReprocesoTable({ filas }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-xs text-slate-500">
          <th className="py-2 pr-3 font-semibold">Placa</th>
          <th className="px-3 py-2 font-semibold">Entrada</th>
          <th className="px-3 py-2 font-semibold">Tipo</th>
          <th className="py-2 pl-3 font-semibold">Estado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((row) => (
          <tr key={row.nro_orden} className="border-b border-slate-100">
            <td className="py-2 pr-3 text-slate-700">{row.placa || 'Sin placa'}</td>
            <td className="px-3 py-2 text-slate-600">{shortDate(row.fecha_apertura) || '—'}</td>
            <td className="px-3 py-2">
              <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                {row.tipo_ot || 'Sin clasificar'}
              </span>
            </td>
            <td className="py-2 pl-3">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadgeClass(row.estado)}`}>
                {friendlyEstado(row.estado)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EmpresaDetalle({ nombreEmpresa, data, filters, error }) {
  const resumen = data?.resumen || { unidades_ot: 0, unidades_vehiculos: 0, reprocesos: 0, grupo_cliente: null };
  const evolucionMensual = data?.evolucionMensual || [];
  // Merge campo por campo (no solo el objeto completo) para que la pagina no
  // truene si el backend todavia responde con la forma vieja de tiempoTaller
  // (por ejemplo, mientras termina de desplegar un cambio reciente).
  const tiempoTaller = {
    promedioDias: null,
    minDias: null,
    maxDias: null,
    otConCierre: 0,
    distribucion: [],
    detalle: [],
    masRapidas: [],
    masLentas: [],
    ...(data?.tiempoTaller || {}),
  };
  const porEstado = data?.porEstado || [];
  const porServicio = data?.porServicio || [];
  const porVehiculo = data?.porVehiculo || [];
  const porSede = data?.porSede || [];
  const reprocesosDetalle = data?.reprocesosDetalle || [];
  const repuestosMasUsados = data?.repuestosMasUsados || [];

  const categoria = resumen.grupo_cliente ? friendlyGrupo(resumen.grupo_cliente) : null;

  // 'rapida' | 'lenta' | null: controla el modal de detalle de tiempo en taller.
  const [modalTiempo, setModalTiempo] = useState(null);
  const [modalReprocesos, setModalReprocesos] = useState(false);
  const masRapidas = tiempoTaller.masRapidas || [];
  const masLentas = tiempoTaller.masLentas || [];

  const porServicioAgrupado = useMemo(() => {
    if (porServicio.length <= TOP_SERVICIOS) return porServicio;
    const top = porServicio.slice(0, TOP_SERVICIOS);
    const restoUnidades = porServicio.slice(TOP_SERVICIOS).reduce((sum, row) => sum + Number(row.unidades || 0), 0);
    return [...top, { grupo_servicio: OTROS_SERVICIO, unidades: restoUnidades }];
  }, [porServicio]);

  const evolucionOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 45, right: 45, top: 40, bottom: 25 },
    xAxis: { type: 'category', data: MONTH_NAMES },
    yAxis: [
      { type: 'value', name: 'Unidades' },
      { type: 'value', name: 'Reprocesos', splitLine: { show: false }, minInterval: 1 },
    ],
    series: [
      {
        name: 'Unidades atendidas',
        type: 'bar',
        data: evolucionMensual.map((row) => row.unidades),
        itemStyle: { color: '#155eef', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Reprocesos',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 7,
        data: evolucionMensual.map((row) => row.reprocesos),
        itemStyle: { color: '#e11d48' },
      },
    ],
  };

  const estadoOption = {
    tooltip: { trigger: 'item', valueFormatter: (value) => number.format(value) },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      label: { formatter: '{b}\n{d}%' },
      data: porEstado.map((row) => ({ name: friendlyEstado(row.estado), value: Number(row.unidades || 0) })),
    }],
  };

  const distribucionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 45, right: 20, top: 15, bottom: 25 },
    xAxis: { type: 'category', data: tiempoTaller.distribucion.map((row) => RANGO_DIAS_LABELS[row.rango] || row.rango) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      barMaxWidth: 44,
      itemStyle: { color: '#f59e0b', borderRadius: [5, 5, 0, 0] },
      data: tiempoTaller.distribucion.map((row) => row.cantidad),
    }],
  };

  // Reemplaza la tabla "Ultimas OT del periodo": barras horizontales de dias
  // en taller por OT, coloreadas por estado, mismo orden que traia la tabla
  // (mas reciente primero).
  const detalleOtOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const item = items[0];
        const row = tiempoTaller.detalle[item.dataIndex];
        if (!row) return '';
        const dias = row.dias === null ? 'Aún en taller' : `${row.dias} días`;
        return `<strong>${row.placa || 'Sin placa'}</strong><br/>${friendlyEstado(row.estado)} · ${dias}`;
      },
    },
    grid: { left: 140, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', name: 'Días', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: tiempoTaller.detalle.map((row) => row.placa || 'Sin placa'),
      axisLabel: { width: 120, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: {
        color: (params) => estadoColor(tiempoTaller.detalle[params.dataIndex]?.estado),
        borderRadius: [0, 5, 5, 0],
      },
      data: tiempoTaller.detalle.map((row) => row.dias),
    }],
  };

  const servicioOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 190, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: porServicioAgrupado.map((row) => row.grupo_servicio),
      axisLabel: { width: 170, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 20,
      itemStyle: { color: '#7c3aed', borderRadius: [0, 5, 5, 0] },
      data: porServicioAgrupado.map((row) => Number(row.unidades || 0)),
    }],
  };

  // porVehiculo ya viene ordenado desc por vehiculos desde el backend, asi que
  // el primero es "el modelo que mas viene" de esta empresa. El visor 3D es
  // decorativo (no hay .glb para cada marca/modelo real), mismo criterio que
  // ya usa VehicleHero en el dashboard Operativo: siempre el mismo auto.
  const modeloTop = porVehiculo[0] || null;
  const vehiculoOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 170, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: porVehiculo.map((row) => `${row.marca} ${row.modelo}`),
      axisLabel: { width: 150, overflow: 'truncate' },
    },
    series: [{
      name: 'Vehículos',
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: { color: '#0891b2', borderRadius: [0, 5, 5, 0] },
      data: porVehiculo.map((row) => Number(row.vehiculos || 0)),
    }],
  };

  const repuestosOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const item = items[0];
        const row = repuestosMasUsados[item.dataIndex];
        if (!row) return '';
        return `<strong>${row.repuesto}</strong><br/>Cantidad: ${number.format(row.cantidad)}<br/>En ${number.format(row.veces)} línea(s) de OT`;
      },
    },
    grid: { left: 190, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: repuestosMasUsados.map((row) => row.repuesto),
      axisLabel: { width: 170, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: { color: '#059669', borderRadius: [0, 5, 5, 0] },
      data: repuestosMasUsados.map((row) => Number(row.cantidad || 0)),
    }],
  };

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
    >
      <Link
        to={APP_PATHS.empresas}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-700"
      >
        <ArrowLeft size={16} />
        Volver a Empresas
      </Link>
      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 min-w-0 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            {categoria || 'Cliente'}
          </p>
          <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-white" title={nombreEmpresa}>
            {nombreEmpresa}
          </h1>
          <p className="mt-2 text-sm text-red-50">
            Reporte de calidad y actividad del cliente.
          </p>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <DashboardFilterBar {...filters} />
        </div>
      </header>
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="relative space-y-4">
        <LoadingOverlay show={filters.loading} />

        {!filters.loading && !resumen.unidades_ot && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Esta empresa no tuvo unidades atendidas en el mes y sede filtrados.
          </div>
        )}

        {/* 1. Resumen */}
        <section className={MOSTRAR_CARD_REPROCESOS ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-2'}>
          <Card
            label="Unidades atendidas (OT)"
            value={number.format(resumen.unidades_ot)}
            hint="Órdenes de trabajo únicas en el periodo"
            icon={Building2}
            tone="blue"
          />
          <Card
            label="Vehículos distintos"
            value={number.format(resumen.unidades_vehiculos)}
            hint="Placas únicas atendidas en el periodo"
            icon={Car}
            tone="violet"
          />
          {MOSTRAR_CARD_REPROCESOS && (
            <button
              type="button"
              onClick={() => reprocesosDetalle.length && setModalReprocesos(true)}
              disabled={!reprocesosDetalle.length}
              className="rounded-lg text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <Card
                label="Reprocesos / garantías"
                value={number.format(resumen.reprocesos)}
                hint={reprocesosDetalle.length ? 'Toca para ver el detalle' : 'OT con reproceso o reclamo de garantía'}
                icon={ShieldAlert}
                tone="rose"
              />
            </button>
          )}
        </section>

        {/* 2. Evolución mensual */}
        <Panel
          title="Evolución mensual"
          right={<span className="text-xs text-slate-500">Unidades atendidas y reprocesos, año en curso</span>}
        >
          <div className="h-[300px] sm:h-[340px]">
            <ReactECharts option={evolucionOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>

        {/* 3. Tiempo en taller */}
        <Panel
          title="Tiempo en taller"
          right={<span className="text-xs text-slate-500">Días entre entrada y salida de cada OT</span>}
        >
          <div className={MOSTRAR_CARDS_TIEMPO_EXTREMO ? 'mb-4 grid gap-3 sm:grid-cols-3' : 'mb-4 grid gap-3 sm:grid-cols-1 sm:max-w-xs'}>
            <Card
              label="Días promedio en taller"
              value={tiempoTaller.promedioDias !== null ? `${tiempoTaller.promedioDias} días` : 'Sin datos'}
              hint={`Sobre ${number.format(tiempoTaller.otConCierre)} OT ya cerradas`}
              icon={Clock}
              tone="amber"
            />
            {MOSTRAR_CARDS_TIEMPO_EXTREMO && (
              <>
                <button
                  type="button"
                  onClick={() => masRapidas.length && setModalTiempo('rapida')}
                  disabled={!masRapidas.length}
                  className="rounded-lg text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <Card
                    label="Más rápida"
                    value={tiempoTaller.minDias !== null ? `${tiempoTaller.minDias} días` : 'Sin datos'}
                    hint={masRapidas.length ? 'Toca para ver cuáles' : 'La OT que menos tardó en el periodo'}
                    icon={Gauge}
                    tone="green"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => masLentas.length && setModalTiempo('lenta')}
                  disabled={!masLentas.length}
                  className="rounded-lg text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <Card
                    label="Más lenta"
                    value={tiempoTaller.maxDias !== null ? `${tiempoTaller.maxDias} días` : 'Sin datos'}
                    hint={masLentas.length ? 'Toca para ver cuáles' : 'La OT que más tardó en el periodo'}
                    icon={TimerReset}
                    tone="rose"
                  />
                </button>
              </>
            )}
          </div>

          {tiempoTaller.otConCierre > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Distribución: cuántas OT cayeron en cada rango de días
              </p>
              <div className="h-[220px]">
                <ReactECharts option={distribucionOption} style={{ height: '100%' }} notMerge lazyUpdate />
              </div>
            </div>
          )}

          {tiempoTaller.detalle.length ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Últimas {tiempoTaller.detalle.length} OT del periodo
              </p>
              <ReactECharts
                option={detalleOtOption}
                style={{ height: Math.max(260, tiempoTaller.detalle.length * 28) }}
                notMerge
                lazyUpdate
              />
              <p className="mt-3 text-xs text-slate-400">
                Este gráfico es una muestra de las OT más recientes. El promedio, el mínimo/máximo y el
                gráfico de distribución de arriba se calculan sobre todas las OT cerradas del periodo,
                no solo las que ves aquí.
              </p>
            </>
          ) : (
            <div className="grid h-32 place-items-center text-sm text-slate-500">
              Sin OT en este periodo.
            </div>
          )}
        </Panel>

        {/* 4 y 5: Estado actual + Composición del trabajo */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Estado actual de sus unidades">
            {porEstado.length ? (
              <div className="h-[280px]">
                <ReactECharts option={estadoOption} style={{ height: '100%' }} notMerge lazyUpdate />
              </div>
            ) : (
              <div className="grid h-52 place-items-center text-sm text-slate-500">Sin datos.</div>
            )}
          </Panel>
          <Panel
            title="Composición del trabajo"
            right={<span className="text-xs text-slate-500">Por grupo de servicio</span>}
          >
            {porServicioAgrupado.length ? (
              <ReactECharts
                option={servicioOption}
                style={{ height: Math.max(260, porServicioAgrupado.length * 30) }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="grid h-52 place-items-center text-sm text-slate-500">Sin datos.</div>
            )}
          </Panel>
        </div>

        {/* 6. Vehículos de la flota + modelo que más viene */}
        <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <Panel
            title="Vehículos de la flota"
            right={<span className="flex items-center gap-1 text-xs text-slate-500"><Wrench size={13} /> Marca y modelo más atendidos</span>}
          >
            {porVehiculo.length ? (
              <ReactECharts
                option={vehiculoOption}
                style={{ height: Math.max(220, porVehiculo.length * 34) }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="grid h-52 place-items-center text-sm text-slate-500">Sin datos.</div>
            )}
          </Panel>

          <Panel
            title="Modelo que más viene"
            right={<span className="text-xs font-medium text-cyan-700">{modeloTop ? `${modeloTop.marca} ${modeloTop.modelo}` : 'Sin datos'}</span>}
          >
            {modeloTop ? (
              <>
                <Vehicle3DViewer
                  modelUrl="/assets/chevrolet_camioneta_2003.glb"
                  heightClass="h-56"
                  loadingLabel="Cargando modelo 3D..."
                />
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">Vehículos</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{number.format(modeloTop.vehiculos || 0)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-slate-500">Unidades atendidas</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{number.format(modeloTop.unidades || 0)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid h-56 place-items-center text-sm text-slate-500">Sin datos.</div>
            )}
          </Panel>
        </div>

        {/* Repuestos más utilizados */}
        <Panel
          title="Repuestos más utilizados"
          right={<span className="text-xs text-slate-500">Top 10 por cantidad consumida en el periodo</span>}
        >
          {repuestosMasUsados.length ? (
            <ReactECharts
              option={repuestosOption}
              style={{ height: Math.max(260, repuestosMasUsados.length * 32) }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div className="grid h-52 place-items-center text-sm text-slate-500">
              Sin líneas de repuestos en este periodo.
            </div>
          )}
        </Panel>

        {/* 7. Por sede (condicional) */}
        {porSede.length > 1 && (
          <Panel title="Distribución por sede">
            <div className="grid gap-3 sm:grid-cols-2">
              {porSede.map((row) => (
                <div key={row.local_nombre} className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{row.local_nombre}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{number.format(row.unidades)}</p>
                  <p className="text-xs text-slate-500">unidades atendidas</p>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {modalTiempo === 'rapida' && (
        <DetalleModal
          titulo="OT más rápidas"
          subtitulo={`${masRapidas.length} OT empatadas en ${tiempoTaller.minDias} día${tiempoTaller.minDias === 1 ? '' : 's'}`}
          onClose={() => setModalTiempo(null)}
        >
          <OtTiempoTable filas={masRapidas} />
        </DetalleModal>
      )}
      {modalTiempo === 'lenta' && (
        <DetalleModal
          titulo="OT más lentas"
          subtitulo={`${masLentas.length} OT empatadas en ${tiempoTaller.maxDias} día${tiempoTaller.maxDias === 1 ? '' : 's'}`}
          onClose={() => setModalTiempo(null)}
        >
          <OtTiempoTable filas={masLentas} />
        </DetalleModal>
      )}
      {modalReprocesos && (
        <DetalleModal
          titulo="Reprocesos / garantías"
          subtitulo={`${reprocesosDetalle.length} OT con reproceso o reclamo de garantía en el periodo`}
          onClose={() => setModalReprocesos(false)}
        >
          <OtReprocesoTable filas={reprocesosDetalle} />
        </DetalleModal>
      )}
    </div>
  );
}
