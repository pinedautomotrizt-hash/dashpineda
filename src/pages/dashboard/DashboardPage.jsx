import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Banknote, CalendarDays, Car, Gauge, Goal, ReceiptText, RefreshCw, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import ModuleSidebar from '../../components/layout/ModuleSidebar';
import { Card, Panel } from '../../components/dashboard/DashboardPrimitives';
import { currentMonth, money, moneyByCurrency, number, pct, shortDate } from '../../utils/formatters';
import { APP_DEFAULTS, APP_PATHS, monthlyGoalForLocal } from '../../config/appConfig';
import peruGeoJsonText from '../../assets/maps/peru-departamentos.geojson?raw';

const PAGE_PATHS = {
  facturacion: APP_PATHS.facturacion,
  'resumen-mensual': APP_PATHS.resumenMensual,
  dashboard: APP_PATHS.dashboard,
  asesores: APP_PATHS.asesores,
  importaciones: APP_PATHS.importaciones,
  reportes: APP_PATHS.reportes,
};

const peruGeoJson = JSON.parse(peruGeoJsonText);
peruGeoJson.features.forEach((feature) => {
  feature.properties.name = String(feature.properties.NOMBDEP || '').toUpperCase();
});
echarts.registerMap('peru-departamentos', peruGeoJson);

function Sidebar({ collapsed, setCollapsed }) {
  return <ModuleSidebar activePath={APP_PATHS.dashboard} collapsed={collapsed} onCollapsedChange={setCollapsed} />;
}

function VehicleHero() {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc');

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(4.8, 2.2, 5.4);
    camera.lookAt(0, 0.65, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#cbd5e1', 2.3));

    const key = new THREE.DirectionalLight('#ffffff', 3.2);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight('#dbeafe', 1.4);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 64),
      new THREE.ShadowMaterial({ color: '#64748b', opacity: 0.16 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    let model = null;
    const loader = new GLTFLoader();
    loader.load(
      '/assets/chevrolet_camioneta_2003.glb',
      (gltf) => {
        model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.9 / maxSize;

        model.position.sub(center);
        model.scale.setScalar(scale);
        model.rotation.set(0, -0.55, 0);
        scene.add(model);
        setLoading(false);
      },
      undefined,
      () => setLoading(false),
    );

    let frameId = 0;
    const animate = () => {
      if (model) {
        model.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-50">
      <div ref={mountRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-slate-50 text-sm font-medium text-slate-500">
          Cargando camioneta 3D...
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ routePage = 'dashboard' }) {
  const navigate = useNavigate();
  const page = routePage;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));
  const [tipoCambio, setTipoCambio] = useState(APP_DEFAULTS.exchangeRate);

  // Al cambiar de sede, sugiere la meta de esa sede; el usuario igual la puede
  // sobrescribir a mano en el campo de meta despues.
  function setLocal(nextLocal) {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }
  const [locales, setLocales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [advisorData, setAdvisorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function setPage(nextPage) {
    const safePage = PAGE_PATHS[nextPage] ? nextPage : 'facturacion';
    navigate(PAGE_PATHS[safePage]);
  }

  const params = useMemo(
    () => ({ month, local, meta, tipoCambio }),
    [month, local, meta, tipoCambio],
  );
  async function load() {
    setLoading(true);
    setError('');
    try {
      const [
        localesRes,
        summaryRes,
        seriesRes,
        financialRes,
        advisorRes,
      ] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/resumen', { params }),
        api.get('/dashboard/series', { params }),
        api.get('/dashboard/facturacion', { params }),
        api.get('/dashboard/asesores', { params }),
      ]);
      setLocales(localesRes.data);
      setSummary(summaryRes.data);
      setSeries(seriesRes.data);
      setFinancial(financialRes.data);
      setAdvisorData(advisorRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params]);

  const dailyOption = useMemo(() => {
    const rows = series?.porDia || [];
    return {
      tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
      grid: { left: 42, right: 18, top: 24, bottom: 32 },
      xAxis: { type: 'category', data: rows.map((row) => shortDate(row.fecha)), axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
      series: [
        {
          name: 'Facturacion',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          areaStyle: { opacity: 0.12 },
          lineStyle: { width: 3 },
          itemStyle: { color: '#155eef' },
          data: rows.map((row) => Number(row.total)),
        },
      ],
    };
  }, [series]);

  const localOption = useMemo(() => {
    const rows = series?.porLocal || [];
    return {
      tooltip: { trigger: 'item', valueFormatter: (value) => money(value) },
      legend: { bottom: 0 },
      series: [
        {
          name: 'Local',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          label: { formatter: '{b}\n{d}%' },
          data: rows.map((row) => ({ name: row.nombre || 'Sin local', value: Number(row.total) })),
        },
      ],
    };
  }, [series]);

  const typeOption = useMemo(() => {
    const rows = series?.porTipo || [];
    return {
      tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
      grid: { left: 96, right: 18, top: 12, bottom: 20 },
      xAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
      yAxis: { type: 'category', data: rows.map((row) => row.nombre || 'Sin tipo'), axisTick: { show: false } },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          itemStyle: { color: '#0f9f6e', borderRadius: [0, 6, 6, 0] },
          data: rows.map((row) => Number(row.total)),
        },
      ],
    };
  }, [series]);

  const ticketOtOption = useMemo(() => {
    const rows = series?.ticketPorTipoOt || [];
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (items) => {
          const item = items[0];
          const row = rows[item.dataIndex];
          return `${row.nombre}<br/>Venta: ${money(row.venta)}<br/>OTs: ${number.format(row.ots)}<br/>Ticket: ${money(row.ticket_promedio)}`;
        },
      },
      grid: { left: 150, right: 24, top: 12, bottom: 24 },
      xAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
      yAxis: {
        type: 'category',
        data: rows.map((row) => row.nombre || 'Sin tipo'),
        axisTick: { show: false },
      },
      series: [
        {
          name: 'Ticket promedio',
          type: 'bar',
          barWidth: 18,
          itemStyle: { color: '#155eef', borderRadius: [0, 6, 6, 0] },
          data: rows.map((row) => Number(row.ticket_promedio || 0)),
        },
      ],
    };
  }, [series]);

  const estadoOption = useMemo(() => {
    const rows = series?.otPorEstado || [];
    const colors = {
      FACTURADO: '#0f9f6e',
      CERRADO: '#f59e0b',
      APERTURADO: '#ef4444',
      LIQUIDADO: '#64748b',
      'FACTURADO INT': '#6366f1',
    };
    return {
      tooltip: {
        trigger: 'item',
        formatter: ({ data }) => `${data.name}<br/>OTs: ${number.format(data.ots)}<br/>Venta OT: ${money(data.value)}`,
      },
      legend: { bottom: 0 },
      series: [
        {
          name: 'Estado OT',
          type: 'pie',
          radius: ['42%', '70%'],
          label: { formatter: '{b}\n{d}%' },
          data: rows.map((row) => ({
            name: row.nombre || 'Sin estado',
            value: Number(row.venta || 0),
            ots: Number(row.ots || 0),
            itemStyle: { color: colors[row.nombre] || '#155eef' },
          })),
        },
      ],
    };
  }, [series]);

  const gaugeOption = useMemo(() => {
    const value = Math.min(Number(summary?.avanceMeta || 0), 150);
    return {
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 150,
          progress: { show: true, width: 14 },
          axisLine: { lineStyle: { width: 14 } },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { width: 2 } },
          axisLabel: { distance: 18, formatter: '{value}%' },
          pointer: { width: 4 },
          detail: { formatter: pct(summary?.avanceMeta || 0), fontSize: 22, fontWeight: 700 },
          data: [{ value }],
        },
      ],
    };
  }, [summary]);

  const topClients = series?.topClientes || [];
  const maxClient = Math.max(...topClients.map((row) => Number(row.total)), 1);
  const paymentRows = series?.porFormaPago || [];
  const registrarRows = series?.porRegistrador || [];
  const pendingOtRows = (series?.otPorEstado || []).filter((row) => row.nombre !== 'FACTURADO');
  const pendingPotential = pendingOtRows.reduce((sum, row) => sum + Number(row.venta || 0), 0);
  const pendingOts = pendingOtRows.reduce((sum, row) => sum + Number(row.ots || 0), 0);
  const modelRows = series?.modelosFrecuentes || [];
  const topModel = modelRows[0];
  const departmentRows = series?.otPorDepartamento || [];
  const maxDepartmentOts = Math.max(...departmentRows.map((row) => Number(row.ots || 0)), 1);
  const peruDepartmentOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: ({ data, name }) => data
        ? `<strong>${name}</strong><br/>OT: ${number.format(data.value || 0)}<br/>Vehículos: ${number.format(data.vehiculos || 0)}<br/>Valor operativo: ${money(data.valorOperativo || 0)}`
        : `<strong>${name}</strong><br/>Sin OT en el periodo`,
    },
    visualMap: {
      min: 0,
      max: maxDepartmentOts,
      left: 12,
      bottom: 12,
      text: ['Más OT', 'Sin OT'],
      calculable: false,
      inRange: { color: ['#fee2e2', '#f87171', '#b91c1c'] },
      textStyle: { color: '#64748b' },
    },
    series: [{
      name: 'Órdenes de trabajo',
      type: 'map',
      map: 'peru-departamentos',
      roam: true,
      scaleLimit: { min: 1, max: 5 },
      emphasis: { label: { show: true }, itemStyle: { areaColor: '#f59e0b' } },
      label: { show: false, color: '#334155', fontSize: 9 },
      itemStyle: { borderColor: '#ffffff', borderWidth: 1, areaColor: '#f1f5f9' },
      data: departmentRows.map((row) => ({
        name: String(row.departamento || '').toUpperCase(),
        value: Number(row.ots || 0),
        vehiculos: Number(row.vehiculos || 0),
        valorOperativo: Number(row.valor_operativo || 0),
      })),
    }],
  }), [departmentRows, maxDepartmentOts]);
  const advisorRows = series?.asesoresPorSede || [];
  const advisorVisuals = useMemo(() => {
    function build(moneda) {
      const rows = (series?.asesoresPorSede || [])
        .filter((row) => row.moneda === moneda)
        .sort((a, b) => Number(b.total_con_igv || 0) - Number(a.total_con_igv || 0))
        .slice(0, 10);
      const format = (value) => moneyByCurrency(value, moneda);
      const totals = rows.reduce(
        (acc, row) => ({
          total: acc.total + Number(row.total_con_igv || 0),
          repuestos: acc.repuestos + Number(row.repuestos_con_igv || 0),
          manoObra: acc.manoObra + Number(row.mano_obra_con_igv || 0),
          costo: acc.costo + Number(row.costo_repuestos || 0),
          utilidad: acc.utilidad + Number(row.utilidad_repuestos || 0),
        }),
        { total: 0, repuestos: 0, manoObra: 0, costo: 0, utilidad: 0 },
      );

      return {
        moneda,
        rows,
        totals,
        bar: {
          color: ['#155eef', '#7c3aed'],
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (items) => {
              const row = rows[items[0]?.dataIndex];
              if (!row) return '';
              return [
                `<strong>${row.asesor}</strong>`,
                `${row.local_nombre || 'Sin sede'} · ${number.format(row.ots || 0)} OT`,
                `Total con IGV: ${format(row.total_con_igv)}`,
                `Total neto: ${format(row.total_sin_igv)}`,
                `RPTO con IGV: ${format(row.repuestos_con_igv)}`,
                `MO con IGV: ${format(row.mano_obra_con_igv)}`,
                `Costo RPTO: ${format(row.costo_repuestos)}`,
                `Utilidad RPTO: ${format(row.utilidad_repuestos)}`,
                `Margen RPTO: ${pct(row.margen_repuestos_pct)}`,
              ].join('<br/>');
            },
          },
          legend: { top: 0, data: ['RPTO', 'MO'] },
          grid: { left: 150, right: 28, top: 42, bottom: 24 },
          xAxis: {
            type: 'value',
            axisLabel: {
              formatter: (value) => `${moneda === 'DOLARES' ? '$' : 'S/'} ${Math.round(value / 1000)}k`,
            },
          },
          yAxis: {
            type: 'category',
            inverse: true,
            data: rows.map((row) => row.asesor),
            axisTick: { show: false },
            axisLabel: { width: 130, overflow: 'truncate' },
          },
          series: [
            {
              name: 'RPTO',
              type: 'bar',
              stack: 'facturacion',
              barMaxWidth: 24,
              data: rows.map((row) => Number(row.repuestos_con_igv || 0)),
            },
            {
              name: 'MO',
              type: 'bar',
              stack: 'facturacion',
              barMaxWidth: 24,
              itemStyle: { borderRadius: [0, 5, 5, 0] },
              data: rows.map((row) => Number(row.mano_obra_con_igv || 0)),
            },
          ],
        },
        margin: {
          tooltip: {
            trigger: 'item',
            formatter: ({ name, value, percent }) => `${name}<br/>${format(value)} · ${percent}%`,
          },
          legend: { bottom: 0 },
          series: [
            {
              type: 'pie',
              radius: ['48%', '72%'],
              center: ['50%', '44%'],
              label: { formatter: '{b}\n{d}%' },
              data: [
                { name: 'Costo RPTO', value: totals.costo, itemStyle: { color: '#f59e0b' } },
                { name: 'Utilidad RPTO', value: totals.utilidad, itemStyle: { color: '#10b981' } },
              ],
            },
          ],
        },
      };
    }

    return [build('SOLES'), build('DOLARES')];
  }, [series]);
  const dashboardFilters = {
    month,
    setMonth,
    local,
    setLocal,
    locales,
    meta,
    setMeta,
    loading,
    load,
    sidebarCollapsed,
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Sidebar page={page} setPage={setPage} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      {page === 'importaciones' ? (
        <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <Importaciones />
        </div>
      ) : page === 'facturacion' ? (
        <FacturacionDashboard data={financial} filters={dashboardFilters} error={error} />
      ) : page === 'resumen-mensual' ? (
        <MonthlyBillingSummary
          data={{
            ...(advisorData || {}),
            mostrador: advisorData?.mostrador || financial?.mostrador,
          }}
          filters={dashboardFilters}
          error={error}
        />
      ) : page === 'asesores' ? (
        <AsesoresDashboard
          data={advisorData}
          filters={dashboardFilters}
          error={error}
        />
      ) : (
      <div className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
          <div className="mb-4 lg:mb-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-100">Control operativo</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Dashboard Operativo</h1>
            <p className="mt-2 max-w-2xl text-sm text-red-50">
              Contabilidad oficial conciliada y producción operativa de órdenes de trabajo, presentadas por separado.
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-[150px_180px_180px_44px]">
              <label className="text-xs font-medium text-slate-500">
                Mes
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Local
                <select
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
                  value={local}
                  onChange={(event) => setLocal(event.target.value)}
                >
                  <option>Todos</option>
                  {locales.map((row) => (
                    <option key={row.local_nombre}>{row.local_nombre}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-500">
                Meta mensual
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
                  type="number"
                  min="0"
                  step="1000"
                  value={meta}
                  onChange={(event) => setMeta(Number(event.target.value))}
                />
              </label>
              <button
                className="mt-5 grid h-10 place-items-center rounded-md bg-red-700 text-white transition hover:bg-red-800"
                onClick={load}
                title="Actualizar"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </section>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}

        <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="Monto oficial"
            value={money(summary?.facturado)}
            hint="Sin IGV · NC y anulaciones aplicadas · No incluye Mostrador"
            icon={Banknote}
            tone="green"
          />
          <Card label="Meta mensual" value={money(summary?.meta)} hint={`${pct(summary?.avanceMeta)} de avance`} icon={Goal} tone="blue" />
          <Card label="Proyección" value={money(summary?.proyeccion)} hint={`${summary?.diasTranscurridos || 0} de ${summary?.diasMes || 0} días`} icon={TrendingUp} tone={summary?.proyeccion >= summary?.meta ? 'green' : 'rose'} />
          <Card label="Brecha contra meta" value={money(summary?.brecha)} hint={summary?.brecha >= 0 ? 'Meta superada' : 'Falta para llegar a meta'} icon={CalendarDays} tone={summary?.brecha >= 0 ? 'green' : 'rose'} />
          <Card label="Faltante a meta" value={money(summary?.faltanteMeta)} hint="Monto a arrastrar si no se cubre" icon={Goal} tone="rose" />
          <Card label="Comprobantes" value={number.format(summary?.comprobantes || 0)} hint={`${number.format(summary?.clientes || 0)} clientes únicos en comprobantes`} icon={ReceiptText} tone="violet" />
          <Card label="Ticket promedio" value={money(summary?.ticketPromedio)} hint="Monto oficial / comprobantes" icon={Gauge} tone="amber" />
          <Card label="OT atendidas" value={number.format(summary?.ots || 0)} hint={`${number.format(summary?.otsFacturadas || 0)} OT facturadas`} icon={Car} tone="blue" />
          <Card label="Potencial OT pendiente" value={money(pendingPotential)} hint={`${number.format(pendingOts)} OT sin estado FACTURADO · No es venta contable`} icon={CalendarDays} tone="rose" />
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Panel
            title="Órdenes de trabajo por departamento"
            right={<span className="text-xs text-slate-500">OT únicas por fecha de apertura</span>}
          >
            <div className="h-[280px] sm:h-[360px] lg:h-[470px]">
              <ReactECharts option={peruDepartmentOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
          <Panel
            title="Cobertura geográfica"
            right={<span className="text-xs text-slate-500">Periodo seleccionado</span>}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-white p-4 ring-1 ring-red-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Departamentos</p>
                <p className="mt-2 text-3xl font-bold text-red-950">{number.format(departmentRows.length)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-100 to-white p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">OT ubicadas</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {number.format(departmentRows.reduce((sum, row) => sum + Number(row.ots || 0), 0))}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[...departmentRows]
                .sort((a, b) => Number(b.ots || 0) - Number(a.ots || 0))
                .map((row, index) => (
                  <div key={row.departamento} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-sm font-bold text-red-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{row.departamento}</p>
                      <p className="text-xs text-slate-500">{number.format(row.vehiculos || 0)} vehículos · {money(row.valor_operativo || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-700">{number.format(row.ots || 0)}</p>
                      <p className="text-[11px] uppercase text-slate-500">OT</p>
                    </div>
                  </div>
                ))}
              {departmentRows.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No hay órdenes con departamento en el periodo seleccionado.
                </div>
              )}
            </div>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Panel title="Producción de OT por fecha de apertura" right={<span className="text-xs text-slate-500">Valor operativo con IGV</span>}>
            <div className="h-[240px] sm:h-[280px] lg:h-[330px]">
              <ReactECharts option={dailyOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
          <Panel title="Avance de Meta">
            <div className="h-[240px] sm:h-[280px] lg:h-[330px]">
              <ReactECharts option={gaugeOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Producción de OT por local">
            <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
              <ReactECharts option={localOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
          <Panel title="Tipo de Documento">
            <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
              <ReactECharts option={typeOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
        </section>

        <section className="mb-4">
          <div className="mb-4 grid gap-4">
            {advisorVisuals.map((visual) => (
              <Panel
                key={visual.moneda}
                title={`Facturacion por asesor · ${visual.moneda === 'DOLARES' ? 'Dólares' : 'Soles'}`}
                right={<span className="text-xs text-slate-500">Importes con IGV</span>}
              >
                {visual.rows.length > 0 ? (
                  <>
                    <div className="mb-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="mt-1 font-bold text-slate-950">{moneyByCurrency(visual.totals.total, visual.moneda)}</p>
                      </div>
                      <div className="rounded-md bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">RPTO</p>
                        <p className="mt-1 font-bold text-blue-900">{moneyByCurrency(visual.totals.repuestos, visual.moneda)}</p>
                      </div>
                      <div className="rounded-md bg-violet-50 p-3">
                        <p className="text-xs text-violet-700">MO</p>
                        <p className="mt-1 font-bold text-violet-900">{moneyByCurrency(visual.totals.manoObra, visual.moneda)}</p>
                      </div>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[1.35fr_.65fr]">
                      <ReactECharts
                        option={visual.bar}
                        style={{ height: Math.max(320, visual.rows.length * 42) }}
                        notMerge
                        lazyUpdate
                      />
                      <div>
                        <p className="pt-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Margen de repuestos
                        </p>
                        <div className="h-[210px] sm:h-[250px] lg:h-[280px]">
                          <ReactECharts option={visual.margin} style={{ height: '100%' }} notMerge lazyUpdate />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid h-72 place-items-center text-sm text-slate-500">
                    Sin operaciones en {visual.moneda.toLowerCase()}.
                  </div>
                )}
              </Panel>
            ))}
          </div>

          <Panel
            title="Facturacion General por Asesor"
            right={<span className="text-xs text-slate-500">Detalle por moneda</span>}
          >
            <div className="overflow-x-auto">
              <table className="min-w-[1380px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Sede</th>
                    <th className="px-3 py-2 font-semibold">Asesor</th>
                    <th className="px-3 py-2 font-semibold">Moneda</th>
                    <th className="px-3 py-2 text-right font-semibold">OTs</th>
                    <th className="px-3 py-2 text-right font-semibold">Total con IGV</th>
                    <th className="px-3 py-2 text-right font-semibold">Total neto</th>
                    <th className="px-3 py-2 text-right font-semibold">RPTO con IGV</th>
                    <th className="px-3 py-2 text-right font-semibold">MO con IGV</th>
                    <th className="px-3 py-2 text-right font-semibold">RPTO neto</th>
                    <th className="px-3 py-2 text-right font-semibold">MO neto</th>
                    <th className="px-3 py-2 text-right font-semibold">Costo RPTO</th>
                    <th className="px-3 py-2 text-right font-semibold">Utilidad RPTO</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen RPTO</th>
                    <th className="py-2 pl-3 text-right font-semibold">Ticket con IGV</th>
                  </tr>
                </thead>
                <tbody>
                  {advisorRows.map((row) => (
                    <tr key={`${row.local_nombre}-${row.asesor}-${row.moneda}`} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-700">{row.local_nombre || 'Sin sede'}</td>
                      <td className="max-w-[320px] truncate px-3 py-2 text-slate-600" title={row.asesor}>{row.asesor}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          row.moneda === 'DOLARES'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {row.moneda}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.ots || 0)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-950">{moneyByCurrency(row.total_con_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.total_sin_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700">{moneyByCurrency(row.repuestos_con_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-indigo-700">{moneyByCurrency(row.mano_obra_con_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.repuestos_sin_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.mano_obra_sin_igv, row.moneda)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.costo_repuestos, row.moneda)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">{moneyByCurrency(row.utilidad_repuestos, row.moneda)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-950">{pct(row.margen_repuestos_pct)}</td>
                      <td className="py-2 pl-3 text-right text-slate-600">{moneyByCurrency(row.ticket_promedio, row.moneda)}</td>
                    </tr>         
                  ))}
                  {advisorRows.length === 0 && (
                    <tr>
                      <td className="py-6 text-center text-slate-500" colSpan={14}>Sin datos para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              En repuestos, utilidad = venta neta − costo; soles y dolares nunca se suman entre sí.
            </p>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
          <Panel
            title="Modelo que más viene"
            right={<span className="text-xs font-medium text-blue-700">{topModel ? `${topModel.marca} ${topModel.modelo}` : 'Sin datos'}</span>}
          >
            <VehicleHero />
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-slate-500">Modelo líder</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{topModel ? `${topModel.marca} ${topModel.modelo}` : '-'}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-slate-500">OT del periodo</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{number.format(topModel?.ots || 0)}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Ranking de modelos atendidos">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Marca</th>
                    <th className="px-3 py-2 font-semibold">Modelo</th>
                    <th className="px-3 py-2 text-right font-semibold">OTs</th>
                    <th className="py-2 pl-3 text-right font-semibold">Venta OT</th>
                  </tr>
                </thead>
                <tbody>
                  {modelRows.map((row) => (
                    <tr key={`${row.marca}-${row.modelo}`} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-700">{row.marca || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{row.modelo || '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-950">{number.format(row.ots || 0)}</td>
                      <td className="py-2 pl-3 text-right text-slate-600">{money(row.venta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Panel title="Ticket Promedio por Tipo de OT">
            <div className="h-[240px] sm:h-[280px] lg:h-[330px]">
              <ReactECharts option={ticketOtOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>

          <Panel title="Mantenimiento vs Correctivo">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Tipo OT</th>
                    <th className="px-3 py-2 text-right font-semibold">OTs</th>
                    <th className="px-3 py-2 text-right font-semibold">Venta OT</th>
                    <th className="py-2 pl-3 text-right font-semibold">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {(series?.ticketPorTipoOt || []).map((row) => (
                    <tr key={row.nombre} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-700">{row.nombre || 'Sin tipo'}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.ots || 0)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{money(row.venta)}</td>
                      <td className="py-2 pl-3 text-right font-semibold text-slate-950">{money(row.ticket_promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
          <Panel title="OT por Estado">
            <div className="h-[230px] sm:h-[270px] lg:h-[320px]">
              <ReactECharts option={estadoOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>

          <Panel
            title="Estados que explican atraso"
            right={<span className="text-xs font-medium text-rose-700">{money(pendingPotential)} no facturado en OT</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Estado</th>
                    <th className="px-3 py-2 text-right font-semibold">OTs</th>
                    <th className="px-3 py-2 text-right font-semibold">Venta OT</th>
                    <th className="py-2 pl-3 text-right font-semibold">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {(series?.otPorEstado || []).map((row) => {
                    const isPending = ['CERRADO', 'APERTURADO'].includes(row.nombre);
                    return (
                      <tr key={row.nombre} className={`border-b border-slate-100 ${isPending ? 'bg-rose-50/50' : ''}`}>
                        <td className="py-2 pr-3 font-medium text-slate-700">{row.nombre || 'Sin estado'}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{number.format(row.ots || 0)}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{money(row.venta)}</td>
                        <td className="py-2 pl-3 text-right font-semibold text-slate-950">{money(row.ticket_promedio)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Se considera no facturado a toda OT que no tiene estado <strong>FACTURADO</strong>.
            </p>
          </Panel>
        </section>

        <section className="mb-4">
          <Panel
            title="OT No Facturadas Según Estado"
            right={<span className="text-xs font-medium text-slate-500">Base para explicar el arrastre</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">OT</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 font-semibold">Apertura</th>
                    <th className="px-3 py-2 font-semibold">Tipo OT</th>
                    <th className="px-3 py-2 font-semibold">Asesor</th>
                    <th className="py-2 pl-3 text-right font-semibold">Monto OT</th>
                  </tr>
                </thead>
                <tbody>
                  {(series?.otPendientesDetalle || []).map((row) => (
                    <tr key={`${row.nro_orden}-${row.estado}`} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-semibold text-slate-950">{row.nro_orden}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          row.estado === 'CERRADO'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {row.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.fecha_apertura}</td>
                      <td className="px-3 py-2 text-slate-600">{row.tipo_ot}</td>
                      <td className="max-w-[260px] truncate px-3 py-2 text-slate-600" title={row.asesor}>{row.asesor}</td>
                      <td className="py-2 pl-3 text-right font-semibold text-slate-950">{money(row.venta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Según la regla confirmada, una OT está facturada solo cuando su estado es <strong>FACTURADO</strong>.
              Las OT cerradas o aperturadas quedan como monto no facturado y pueden explicar el arrastre al siguiente mes.
            </p>
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[1fr_.85fr_.85fr]">
          <Panel title="Top Clientes">
            <div className="space-y-3">
              {topClients.map((row) => (
                <div key={row.nombre}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700" title={row.nombre}>{row.nombre}</span>
                    <span className="shrink-0 font-semibold text-slate-950">{money(row.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-700" style={{ width: `${(Number(row.total) / maxClient) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Forma de Pago">
            <div className="divide-y divide-slate-100">
              {paymentRows.map((row) => (
                <div key={row.nombre} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{row.nombre}</span>
                  <span className="text-right font-semibold text-slate-950">{money(row.total)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Registrado Por">
            <div className="divide-y divide-slate-100">
              {registrarRows.map((row) => (
                <div key={row.nombre} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate font-medium text-slate-700" title={row.nombre}>{row.nombre || 'Sin usuario'}</span>
                  <span className="text-right font-semibold text-slate-950">{money(row.total)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Panel title="Ticket Promedio por Cliente">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Cliente</th>
                    <th className="px-3 py-2 text-right font-semibold">Comp.</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                    <th className="py-2 pl-3 text-right font-semibold">Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {(series?.ticketClientes || []).map((row) => (
                    <tr key={row.nombre} className="border-b border-slate-100">
                      <td className="max-w-[280px] truncate py-2 pr-3 font-medium text-slate-700" title={row.nombre}>{row.nombre}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.comprobantes || 0)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{money(row.total)}</td>
                      <td className="py-2 pl-3 text-right font-semibold text-slate-950">{money(row.ticket_promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Lectura Ejecutiva">
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                El avance contra meta va en <strong className="text-slate-950">{pct(summary?.avanceMeta)}</strong> con una
                proyección de <strong className="text-slate-950">{money(summary?.proyeccion)}</strong>.
              </p>
              <p>
                El ticket promedio general es <strong className="text-slate-950">{money(summary?.ticketPromedio)}</strong>.
                La tabla de ticket por cliente ayuda a detectar compañías con servicios de mayor valor.
              </p>
            </div>
          </Panel>
        </section>
      </div>
      )}
    </main>
  );
}
