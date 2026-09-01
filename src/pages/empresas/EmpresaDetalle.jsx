import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { ArrowLeft, Building2, Car, Clock, Droplets, Gauge, Hammer, PaintBucket, ShieldAlert, Sparkles, TimerReset, Wrench, X } from 'lucide-react';
import DashboardFilterBar from '../../components/dashboard/DashboardFilterBar';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import Vehicle3DViewer from '../../components/Vehicle3DViewer';
import { number, shortDate } from '../../utils/formatters';
import { APP_PATHS } from '../../config/appConfig';
import { MONTH_NAMES } from '../../config/appConfig';
import { friendlyGrupo, friendlyEstado, friendlyTipoOt, estadoBadgeClass, RANGO_DIAS_LABELS } from './empresasLabels';

// Icono + tono de card por tipo de OT, por palabra clave (no por igualdad
// exacta, para no tener que mantener un mapa 1 a 1 con cada texto nuevo que
// pueda aparecer). El orden importa: la primera palabra clave que matchee gana.
const TIPO_OT_ICONOS = [
  { match: /MANTENIMIENTO/, icon: Wrench, tone: 'blue' },
  { match: /CORRECTIVO/, icon: Hammer, tone: 'amber' },
  { match: /RECLAMO|REPROCESO/, icon: ShieldAlert, tone: 'rose' },
  { match: /LAVADO/, icon: Droplets, tone: 'green' },
  { match: /PINTURA|CARROCERIA/, icon: PaintBucket, tone: 'violet' },
];
function iconoPorTipoOt(tipoOt) {
  const clave = (tipoOt || '').toUpperCase();
  const encontrado = TIPO_OT_ICONOS.find((item) => item.match.test(clave));
  return encontrado || { icon: Sparkles, tone: 'violet' };
}

const OTROS_SERVICIO = 'Otros';
const TOP_SERVICIOS = 9;
const TOP_TIPO_OT = 5;
const TIPO_OT_COLORS = ['#155eef', '#f59e0b', '#e11d48', '#7c3aed', '#0891b2', '#64748b'];

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
  const evolucionMensualPlacas = data?.evolucionMensualPlacas || [];
  // Merge campo por campo (no solo el objeto completo) para que la pagina no
  // truene si el backend todavia responde con la forma vieja de tiempoTaller
  // (por ejemplo, mientras termina de desplegar un cambio reciente).
  const tiempoTaller = {
    promedioDias: null,
    minDias: null,
    maxDias: null,
    otConCierre: 0,
    distribucion: [],
    porTipoOt: [],
    detalle: [],
    masRapidas: [],
    masLentas: [],
    ...(data?.tiempoTaller || {}),
  };
  const porEstado = data?.porEstado || [];
  const porServicio = data?.porServicio || [];
  const porTipoOt = data?.porTipoOt || [];
  const porVehiculo = data?.porVehiculo || [];
  const porSede = data?.porSede || [];
  const reprocesosDetalle = data?.reprocesosDetalle || [];
  const repuestosMasUsados = data?.repuestosMasUsados || [];
  const repuestosCorrectivos = data?.repuestosCorrectivos || [];
  const porDia = data?.porDia || [];

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

  const porTipoOtAgrupado = useMemo(() => {
    if (porTipoOt.length <= TOP_TIPO_OT) return porTipoOt;
    const top = porTipoOt.slice(0, TOP_TIPO_OT);
    const restoUnidades = porTipoOt.slice(TOP_TIPO_OT).reduce((sum, row) => sum + Number(row.unidades || 0), 0);
    return [...top, { tipo_ot: OTROS_SERVICIO, unidades: restoUnidades }];
  }, [porTipoOt]);

  const anioActual = data?.anioActual || new Date().getFullYear();
  const anioAnterior = data?.anioAnterior || anioActual - 1;
  // Solo tiene sentido comparar si algun mes del año anterior trae data; si el
  // cliente es nuevo o no se cargo historico, se cae de vuelta al grafico
  // simple (barras + reprocesos) para no mostrar una serie de puros ceros.
  const hayAnioAnterior = evolucionMensual.some((row) => row.unidadesAnioAnterior > 0);

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
      ...(hayAnioAnterior ? [{
        name: `Unidades ${anioAnterior}`,
        type: 'bar',
        data: evolucionMensual.map((row) => row.unidadesAnioAnterior),
        itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] },
      }] : []),
      {
        name: `Unidades ${anioActual}`,
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

  // Mismo comparativo año actual vs. año anterior, pero contando vehiculos
  // distintos (placas) en vez de OT: si el mismo carro volvio 2 veces en el
  // mes, aca suma 1, no 2 (a diferencia de "Evolución mensual" de arriba).
  const hayAnioAnteriorPlacas = evolucionMensualPlacas.some((row) => row.placasAnioAnterior > 0);
  const evolucionPlacasOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 45, right: 45, top: 40, bottom: 25 },
    xAxis: { type: 'category', data: MONTH_NAMES },
    yAxis: { type: 'value', name: 'Vehículos' },
    series: [
      ...(hayAnioAnteriorPlacas ? [{
        name: `Vehículos ${anioAnterior}`,
        type: 'bar',
        data: evolucionMensualPlacas.map((row) => row.placasAnioAnterior),
        itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] },
      }] : []),
      {
        name: `Vehículos ${anioActual}`,
        type: 'bar',
        data: evolucionMensualPlacas.map((row) => row.placas),
        itemStyle: { color: '#7c3aed', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  // Vehiculos distintos por dia, dentro del mes/sede ya filtrados — drill-down
  // diario de "Evolución mensual · Vehículos únicos" de arriba. Calendario de
  // calor en vez de otra barra mas (ya hay varios graficos de barras en esta
  // pagina): de un vistazo se ven los dias fuertes/flojos del mes, formato
  // mas cómodo para una presentación ejecutiva.
  const maxPorDia = Math.max(1, ...porDia.map((row) => row.placas));
  const totalPorDia = porDia.reduce((sum, row) => sum + row.placas, 0);
  const porDiaOption = {
    tooltip: {
      formatter: (params) => {
        const [fecha, valor] = params.value;
        const [, , dia] = fecha.split('-');
        return `<strong>${dia}/${filters.month.slice(5)}</strong><br/>${number.format(valor)} vehículo${valor === 1 ? '' : 's'}`;
      },
    },
    // Texto del total del mes, al lado de la leyenda de colores.
    graphic: [{
      type: 'text',
      right: 20,
      top: 12,
      style: {
        // "Ingresos" (no "vehiculos"): esta suma es de placas por dia, un
        // mismo vehiculo que volvio 2 dias distintos cuenta 2 veces aca — a
        // proposito distinto del total de "Vehiculos unicos" de mas arriba,
        // que si deduplica en todo el mes. Ver nota debajo del grafico.
        text: `Total del mes: ${number.format(totalPorDia)} ingresos`,
        fill: '#334155',
        fontSize: 12,
        fontWeight: 600,
      },
    }],
    visualMap: {
      min: 0,
      max: maxPorDia,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemWidth: 12,
      itemHeight: 90,
      // Etiquetas de texto a los extremos de la barra: que se lea como
      // leyenda (Menos/Más), no solo una franja de colores sin explicar.
      text: ['Más', 'Menos'],
      // Escala de varios colores (no un solo tono): el 0 ya arranca en un gris
      // visible (no blanco puro) para que un día sin ingresos se vea como una
      // celda con color, no como un hueco vacío.
      inRange: { color: ['#e2e8f0', '#38bdf8', '#22c55e', '#facc15', '#f97316', '#dc2626'] },
      textStyle: { color: '#64748b', fontSize: 11 },
    },
    calendar: {
      top: 55,
      left: 30,
      right: 20,
      cellSize: ['auto', 26],
      range: filters.month,
      dayLabel: { nameMap: ['D', 'L', 'M', 'X', 'J', 'V', 'S'], color: '#94a3b8', fontSize: 11 },
      monthLabel: { show: false },
      yearLabel: { show: false },
      itemStyle: { borderWidth: 3, borderColor: '#fff' },
      splitLine: { show: false },
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: porDia.map((row) => [`${filters.month}-${String(row.dia).padStart(2, '0')}`, row.placas]),
      label: {
        show: true,
        formatter: (params) => params.value[0].split('-')[2],
        color: '#0f172a',
        // Halo blanco alrededor del texto en vez de calcular claro/oscuro
        // segun el color de fondo: se lee igual de bien en verde, rojo,
        // naranja o gris sin tener que adivinar el contraste celda por celda.
        textBorderColor: '#ffffff',
        textBorderWidth: 3,
        fontSize: 11,
        fontWeight: 600,
      },
    }],
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

  // Barras polares (radiales) en vez de barras horizontales: ya hay varias
  // barras Cartesianas en esta pagina, esto se ve como un tipo de grafico
  // distinto aunque tecnicamente siga siendo "bar" por dentro.
  const servicioOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => `<strong>${params.name}</strong><br/>${number.format(params.value)} OT`,
    },
    grid: { left: 150, right: 20, top: 10, bottom: 10 },
    xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: porServicioAgrupado.map((row) => row.grupo_servicio),
      axisLabel: { fontSize: 11, color: '#475569', width: 140, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: { color: '#7c3aed', borderRadius: [0, 4, 4, 0] },
      data: porServicioAgrupado.map((row) => Number(row.unidades || 0)),
    }],
  };

  // Correctivo vs Mantenimiento Periodico: grafico "rosa" (variante de dona
  // donde el radio tambien varia), para no repetir el mismo tipo de dona que
  // ya usa "Estado actual".
  const tipoOtOption = {
    tooltip: {
      trigger: 'item',
      formatter: ({ name, value, percent }) => `${name}<br/>${number.format(value)} OT (${percent}%)`,
    },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['20%', '75%'],
      center: ['50%', '46%'],
      roseType: 'radius',
      itemStyle: { borderRadius: 6 },
      label: { formatter: '{b}\n{d}%' },
      data: porTipoOtAgrupado.map((row, index) => ({
        name: row.tipo_ot,
        value: Number(row.unidades || 0),
        itemStyle: { color: TIPO_OT_COLORS[index % TIPO_OT_COLORS.length] },
      })),
    }],
  };

  // porVehiculo ya viene ordenado desc por vehiculos desde el backend, asi que
  // el primero es "el modelo que mas viene" de esta empresa. El visor 3D es
  // decorativo (no hay .glb para cada marca/modelo real), mismo criterio que
  // ya usa VehicleHero en el dashboard Operativo: siempre el mismo auto.
  const modeloTop = porVehiculo[0] || null;
  const serviciosModeloTop = data?.serviciosModeloTop || [];
  const serviciosModeloTopAgrupado = useMemo(() => {
    const TOP = 6;
    if (serviciosModeloTop.length <= TOP) return serviciosModeloTop;
    const top = serviciosModeloTop.slice(0, TOP);
    const restoUnidades = serviciosModeloTop.slice(TOP).reduce((sum, row) => sum + Number(row.unidades || 0), 0);
    return [...top, { grupo_servicio: OTROS_SERVICIO, unidades: restoUnidades }];
  }, [serviciosModeloTop]);
  const serviciosModeloTopOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value) => number.format(value) },
    grid: { left: 130, right: 20, top: 10, bottom: 20 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: serviciosModeloTopAgrupado.map((row) => row.grupo_servicio),
      axisLabel: { width: 110, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 16,
      itemStyle: { color: '#0891b2', borderRadius: [0, 4, 4, 0] },
      data: serviciosModeloTopAgrupado.map((row) => Number(row.unidades || 0)),
    }],
  };
  // Treemap en vez de barras: ya hay varios graficos de barras en esta pagina,
  // y un treemap muestra bien muchas categorias de valores chicos (1-3
  // vehiculos) sin que se vea una lista larga de barras casi iguales.
  const vehiculoOption = {
    tooltip: {
      formatter: ({ name, value }) => `<strong>${name}</strong><br/>Vehículos: ${number.format(value)}`,
    },
    series: [{
      type: 'treemap',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}', color: '#fff', fontWeight: 600 },
      colorMappingBy: 'index',
      color: ['#0891b2', '#155eef', '#7c3aed', '#0f9f6e', '#f59e0b', '#e11d48', '#64748b', '#0284c7'],
      data: porVehiculo.map((row) => ({
        name: `${row.marca} ${row.modelo}`,
        value: Number(row.vehiculos || 0),
      })),
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

  // Mismo grafico que repuestosOption, pero solo con lineas de OT tipo
  // Correctivo: al ser menos comunes, verlas aparte evita que el volumen de
  // aceite/filtros de mantenimiento rutinario tape lo que realmente se les
  // rompe a estos clientes.
  const repuestosCorrectivosOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items) => {
        const item = items[0];
        const row = repuestosCorrectivos[item.dataIndex];
        if (!row) return '';
        return `<strong>${row.repuesto}</strong><br/>Cantidad: ${number.format(row.cantidad)}<br/>En ${number.format(row.veces)} línea(s) de OT`;
      },
    },
    grid: { left: 190, right: 25, top: 15, bottom: 25 },
    xAxis: { type: 'value', axisLabel: { formatter: (value) => number.format(value) } },
    yAxis: {
      type: 'category',
      inverse: true,
      data: repuestosCorrectivos.map((row) => row.repuesto),
      axisLabel: { width: 170, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: { color: '#d97706', borderRadius: [0, 5, 5, 0] },
      data: repuestosCorrectivos.map((row) => Number(row.cantidad || 0)),
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
          {/* Titulo generico a pedido del usuario: el nombre real de la empresa
              se muestra abajo, no como titulo grande. Para Rentaequipos, a pedido
              especifico del usuario, se oculta tambien el nombre de abajo. */}
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Dashboard General
          </h1>
          {nombreEmpresa?.trim().toUpperCase() !== 'RENTAEQUIPOS LEASING PERU S.A.' && (
            <p className="mt-2 truncate text-sm text-red-50" title={nombreEmpresa}>
              {nombreEmpresa}
            </p>
          )}
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
          right={(
            <span className="text-xs text-slate-500">
              {hayAnioAnterior
                ? `Unidades atendidas ${anioActual} vs. ${anioAnterior}, y reprocesos`
                : `Unidades atendidas y reprocesos, ${anioActual}`}
            </span>
          )}
        >
          <div className="h-[300px] sm:h-[340px]">
            <ReactECharts option={evolucionOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>

        {/* 2b. Evolución mensual, pero por vehículos (placas) únicos */}
        <Panel
          title="Evolución mensual · Vehículos únicos"
          right={(
            <span className="text-xs text-slate-500">
              {hayAnioAnteriorPlacas
                ? `Placas distintas ${anioActual} vs. ${anioAnterior}`
                : `Placas distintas atendidas por mes, ${anioActual}`}
            </span>
          )}
        >
          <div className="h-[300px] sm:h-[340px]">
            <ReactECharts option={evolucionPlacasOption} style={{ height: '100%' }} notMerge lazyUpdate />
          </div>
        </Panel>

        {/* 2c. Ingreso de vehículos por día, dentro del mes filtrado */}
        <Panel
          title="Ingreso de vehículos por día"
          right={<span className="text-xs text-slate-500">Placas distintas por día, mes filtrado</span>}
        >
          {porDia.length ? (
            <>
              <div className="h-[230px]">
                <ReactECharts option={porDiaOption} style={{ height: '100%' }} notMerge lazyUpdate />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Este total suma los ingresos de cada día: un vehículo que volvió en más de un día del mes
                se cuenta una vez por cada día. Por eso puede ser mayor al de "Vehículos únicos" de arriba,
                que cuenta cada placa una sola vez en todo el mes.
              </p>
            </>
          ) : (
            <div className="grid h-32 place-items-center text-sm text-slate-500">Sin datos.</div>
          )}
        </Panel>

        {/* 3. Tiempo en taller */}
        <Panel
          title="Tiempo en taller"
          right={<span className="text-xs text-slate-500">Días entre entrada y salida de cada OT</span>}
        >
          <div className={MOSTRAR_CARDS_TIEMPO_EXTREMO ? 'mb-4 grid gap-3 sm:grid-cols-3' : 'mb-4 grid gap-3'}>
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

          {tiempoTaller.porTipoOt.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Días promedio por tipo de servicio
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tiempoTaller.porTipoOt.map((row) => {
                  const { icon, tone } = iconoPorTipoOt(row.tipoOt);
                  return (
                    <Card
                      key={row.tipoOt}
                      label={friendlyTipoOt(row.tipoOt)}
                      value={row.promedioDias !== null ? `${row.promedioDias} días` : 'Sin datos'}
                      hint={`${number.format(row.otConCierre)} OT cerradas`}
                      icon={icon}
                      tone={tone}
                    />
                  );
                })}
              </div>
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

        {/* Correctivo vs Mantenimiento Periódico */}
        <Panel
          title="Correctivo vs. Mantenimiento Periódico"
          right={<span className="text-xs text-slate-500">Por tipo de OT</span>}
        >
          {porTipoOtAgrupado.length ? (
            <div className="h-[320px] sm:h-[360px]">
              <ReactECharts option={tipoOtOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          ) : (
            <div className="grid h-52 place-items-center text-sm text-slate-500">Sin datos.</div>
          )}
        </Panel>

        {/* 6. Vehículos de la flota + modelo que más viene */}
        <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <Panel
            title="Vehículos de la flota"
            right={<span className="flex items-center gap-1 text-xs text-slate-500"><Wrench size={13} /> Marca y modelo más atendidos</span>}
          >
            {porVehiculo.length ? (
              <ReactECharts
                option={vehiculoOption}
                style={{ height: 360 }}
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
                {serviciosModeloTopAgrupado.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Servicios que le dieron a este modelo
                    </p>
                    <ReactECharts
                      option={serviciosModeloTopOption}
                      style={{ height: Math.max(160, serviciosModeloTopAgrupado.length * 30) }}
                      notMerge
                      lazyUpdate
                    />
                  </div>
                )}
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

        {/* Repuestos más usados, solo en OT de tipo Correctivo */}
        <Panel
          title="Repuestos más usados en Correctivos"
          right={<span className="text-xs text-slate-500">Top 10, solo OT tipo Correctivo — menos comunes que mantenimiento</span>}
        >
          {repuestosCorrectivos.length ? (
            <ReactECharts
              option={repuestosCorrectivosOption}
              style={{ height: Math.max(260, repuestosCorrectivos.length * 32) }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div className="grid h-52 place-items-center text-sm text-slate-500">
              Sin líneas de repuestos de Correctivos en este periodo.
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
