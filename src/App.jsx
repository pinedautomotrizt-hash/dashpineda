import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


import {
  Banknote,
  Briefcase,
  CalendarDays,
  Car,
  Database,
  FileUp,
  Gauge,
  Goal,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from './api';

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('es-PE');
const usdCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function money(value) {
  return currency.format(Number(value || 0));
}

function moneyByCurrency(value, moneda) {
  return String(moneda || '').toUpperCase() === 'DOLARES'
    ? usdCurrency.format(Number(value || 0))
    : money(value);
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function shortDate(value) {
  if (!value) return '';
  const [, month, day] = value.split('-');
  return `${day}/${month}`;
}

function PinedaLogo({ compact = false }) {
  return (
    <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'}`}>
      <svg
        className={compact ? 'h-10 w-10' : 'h-12 w-12'}
        viewBox="0 0 92 104"
        role="img"
        aria-label="Pineda Automotriz"
      >
        <path
          d="M46 2C28.8 4.6 14.7 8.1 4.8 12.5 3.2 30.7 4.1 48.9 8.2 63.7 12.9 80.8 25.5 93.7 46 102c20.5-8.3 33.1-21.2 37.8-38.3 4.1-14.8 5-33 3.4-51.2C77.3 8.1 63.2 4.6 46 2Z"
          fill="#e9153b"
        />
        <path
          d="M27 24h29.5c17.9 0 27.1 7.2 27.1 19.8 0 13-9.8 22.3-28.7 22.3H39.5L35.7 85H18.4L27 24Z"
          fill="white"
        />
        <path d="M38.8 44.5H58c8 0 13.5 2.4 16.8 6.6-9.6-2.9-22.4-.1-38.5 8.4L38.8 44.5Z" fill="#e9153b" />
        <path
          d="M23 58.5c17.6-14.4 36.2-22 55.6-22.7-20.8 3.5-39.7 12.6-56.7 27.3L23 58.5Z"
          fill="#e9153b"
        />
      </svg>
      {!compact && (
        <div>
          <div className="text-lg font-black uppercase tracking-[.34em] text-[#e9153b]">Pineda</div>
          <div className="text-xs font-bold uppercase tracking-[.52em] text-[#e9153b]">Automotriz</div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-md p-2 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </section>
  );
}

function Panel({ title, children, right }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function VariationBadge({ value }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
        Sin dato previo
      </span>
    );
  }
  const positive = value >= 0;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
      positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
    }`}>
      {positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
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

function Sidebar({ page, setPage, collapsed, setCollapsed }) {
  const items = [
    { id: 'facturacion', label: 'Facturacion', icon: Banknote },
    { id: 'dashboard', label: 'Operativo', icon: LayoutDashboard },
    { id: 'asesores', label: 'Por Asesor', icon: Users },
    { id: 'comercial', label: 'Informe Comercial', icon: Briefcase },
    { id: 'importaciones', label: 'Importaciones', icon: FileUp },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-20 hidden border-r border-slate-200 bg-white px-3 py-5 transition-all duration-200 lg:block ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className={`mb-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={collapsed ? 'flex justify-center' : ''}>
          <PinedaLogo compact={collapsed} />
        </div>
        {!collapsed && (
          <button
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-950"
            onClick={() => setCollapsed(true)}
            title="Contraer menú"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          className="mb-4 grid h-10 w-full place-items-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          onClick={() => setCollapsed(false)}
          title="Expandir menú"
        >
          <Menu size={18} />
        </button>
      )}
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold ${collapsed ? 'justify-center' : 'gap-3'} ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
              onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Importaciones() {
  const [importType, setImportType] = useState('registro_venta');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const response = await api.get('/import/status');
    setStatus(response.data);
  }

  useEffect(() => {
    loadStatus().catch(() => {});
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setMessage('Selecciona un archivo CSV.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_type', importType);
      const response = await api.post('/import/staging', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`${response.data.message} Filas importadas: ${number.format(response.data.filas_importadas)}.`);
      setFile(null);
      event.target.reset();
      await loadStatus();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'No se pudo importar el CSV.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
          <FileUp size={16} />
          Carga de datos
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Importaciones</h1>
        <p className="mt-1 text-sm text-slate-500">
          Carga nuevos CSV mensuales de facturación para actualizar el dashboard.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <Panel title="Importar facturación de servicios">
          <form className="space-y-5" onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-700">
              Tipo de importación
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={importType}
                onChange={(event) => setImportType(event.target.value)}
              >
                <option value="registro_venta">Registro de Venta por Local</option>
                <option value="ordenes_trabajo">Ordenes de trabajo</option>
                <option value="clientes_servicio">Clientes de servicio / vehículos</option>
                <option value="clientes">Maestro de clientes</option>
              </select>
            </label>

            <label className="block rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/60 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <FileUp className="mx-auto text-blue-700" size={30} />
              <span className="mt-3 block text-sm font-semibold text-slate-950">
                {file ? file.name : 'Selecciona tu archivo CSV'}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Separador punto y coma. La carga empieza desde la linea 6.
              </span>
              <input
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              El archivo debe venir con separador punto y coma. Para estos reportes se ignoran las primeras 5 líneas y se
              cargan los datos desde la línea 6.
            </div>

            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 md:w-auto"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Importando...' : 'Importar CSV'}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{message}</div>
          )}
        </Panel>

        <Panel title="Estado de datos" right={<Database size={18} className="text-slate-400" />}>
          <div className="space-y-3 text-sm">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-slate-500">Staging facturación</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{number.format(status?.staging?.filas || 0)}</p>
              <p className="text-xs text-slate-500">{number.format(status?.staging?.documentos || 0)} documentos únicos</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-slate-500">Facturacion consolidada</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{number.format(status?.fact?.comprobantes || 0)}</p>
              <p className="text-xs text-slate-500">
                {status?.fact?.desde || '-'} hasta {status?.fact?.hasta || '-'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Callao</p>
                <p className="text-lg font-bold text-slate-950">{number.format(status?.staging?.callao || 0)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Trujillo</p>
                <p className="text-lg font-bold text-slate-950">{number.format(status?.staging?.trujillo || 0)}</p>
              </div>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-slate-500">Otras staging</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <span>Clientes</span>
                <strong className="text-right text-slate-950">{number.format(status?.tables?.clientes?.filas || 0)}</strong>
                <span>Clientes servicio</span>
                <strong className="text-right text-slate-950">{number.format(status?.tables?.clientes_servicio?.filas || 0)}</strong>
                <span>Ordenes trabajo</span>
                <strong className="text-right text-slate-950">{number.format(status?.tables?.ordenes_trabajo?.filas || 0)}</strong>
                <span>Registro venta local</span>
                <strong className="text-right text-slate-950">{number.format(status?.tables?.registro_venta?.filas || 0)}</strong>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-4">
        <Panel
          title="Estados en Registro de Venta"
          right={<span className="text-xs text-slate-500">Solo lo marcado como válido entra a los dashboards</span>}
        >
          <p className="mb-3 text-xs text-slate-500">
            Los dashboards solo consideran filas con estado distinto de <strong>ANULADO</strong> y estado SUNAT igual a{' '}
            <strong>APROBADO</strong>. Si aquí no aparece esa combinación, revisa el CSV: los datos se estarán
            cargando pero no se verán en ningún gráfico.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Estado SUNAT</th>
                  <th className="px-3 py-2 text-right font-semibold">Filas</th>
                  <th className="py-2 pl-3 text-right font-semibold">Entra al dashboard</th>
                </tr>
              </thead>
              <tbody>
                {(status?.estadoBreakdown || []).map((row) => {
                  const valido = row.estado !== 'ANULADO' && row.estado_sunat === 'APROBADO';
                  return (
                    <tr key={`${row.estado}-${row.estado_sunat}`} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium text-slate-700">{row.estado}</td>
                      <td className="px-3 py-2 text-slate-600">{row.estado_sunat}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.filas || 0)}</td>
                      <td className="py-2 pl-3 text-right">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          valido ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {valido ? 'Sí' : 'No'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(status?.estadoBreakdown || []).length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>Sin datos cargados todavia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function DashboardFilterBar({ month, setMonth, local, setLocal, locales, meta, setMeta, loading, load }) {
  return (
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
          className="mt-5 grid h-10 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-800"
          onClick={load}
          title="Actualizar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </section>
  );
}

function FacturacionDashboard({ data, filters, error }) {
  const summary = data?.resumen || {};
  const solesDaily = (data?.porDia || []).filter((row) => row.moneda === 'SOLES');
  const currencies = data?.porMoneda || [];
  const dollars = currencies.find((row) => row.moneda === 'DOLARES') || {};
  const localRows = (data?.porLocal || []).filter((row) => row.moneda === 'SOLES');
  const advisorRows = (data?.porAsesor || []).filter((row) => row.moneda === 'SOLES').slice(0, 10);
  const detailedLocalRows = data?.porLocal || [];
  const totalsByMoneda = (moneda) =>
    detailedLocalRows
      .filter((row) => row.moneda === moneda)
      .reduce(
        (acc, row) => ({
          comprobantes: acc.comprobantes + Number(row.comprobantes || 0),
          clientes: acc.clientes + Number(row.clientes || 0),
          sin_igv: acc.sin_igv + Number(row.sin_igv || 0),
          impuesto: acc.impuesto + Number(row.impuesto || 0),
          con_igv: acc.con_igv + Number(row.con_igv || 0),
        }),
        { comprobantes: 0, clientes: 0, sin_igv: 0, impuesto: 0, con_igv: 0 },
      );
  const solesTotal = totalsByMoneda('SOLES');
  const dolaresTotal = totalsByMoneda('DOLARES');
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

  const dailyOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
    grid: { left: 55, right: 20, top: 25, bottom: 30 },
    xAxis: { type: 'category', data: solesDaily.map((row) => shortDate(row.fecha)) },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    series: [{
      name: 'Venta',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.12 },
      lineStyle: { width: 3 },
      itemStyle: { color: '#0f9f6e' },
      data: solesDaily.map((row) => Number(row.sin_igv || 0)),
    }],
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

  return (
    <div className={`mx-auto max-w-[1440px] px-4 py-5 transition-all duration-200 sm:px-6 lg:px-8 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard de Facturacion</h1>
          <p className="mt-1 text-sm text-slate-500">Comprobantes oficiales emitidos, sin mezclar monedas.</p>
        </div>
        <DashboardFilterBar {...filters} />
      </header>
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {mixedTotalsByLocal.map((row) => (
          <Card
            key={row.local}
            label={row.local}
            value={money(row.totalMixto)}
            hint={`${money(row.soles)} + ${moneyByCurrency(row.dolares, 'DOLARES')} sin conversion`}
            icon={Banknote}
            tone="amber"
          />
        ))}
        <Card
          label="Total general"
          value={money(mixedGrandTotal.totalMixto)}
          hint={`${money(mixedGrandTotal.soles)} + ${moneyByCurrency(mixedGrandTotal.dolares, 'DOLARES')} sin conversion`}
          icon={TrendingUp}
          tone="green"
        />
        <Card label="Facturacion dolares" value={moneyByCurrency(dollars.sin_igv, 'DOLARES')} hint="Separada de soles" icon={Banknote} tone="violet" />
        <Card label="Meta mensual" value={money(summary.meta)} hint={`${pct(summary.avanceMeta)} de avance`} icon={Goal} tone="blue" />
        <Card label="Proyección" value={money(summary.proyeccionSoles)} hint={`${summary.diasTranscurridos || 0} de ${summary.diasMes || 0} días`} icon={TrendingUp} tone="green" />
        <Card label="Brecha" value={money(summary.brecha)} hint={summary.brecha >= 0 ? 'Meta superada' : 'Falta para la meta'} icon={CalendarDays} tone={summary.brecha >= 0 ? 'green' : 'rose'} />
        <Card label="Comprobantes" value={number.format(summary.comprobantesSoles || 0)} hint={`${number.format(summary.clientesSoles || 0)} clientes`} icon={ReceiptText} tone="violet" />
        <Card label="Ticket promedio" value={money(summary.ticket)} hint="Venta / comprobantes" icon={Gauge} tone="amber" />
      </section>
      <section className="mb-4">
        <Panel
          title="Cuadro Resumen del Mes"
          right={<span className="text-xs text-slate-500">Por local y moneda · Registro de Venta</span>}
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Soles vs. mes anterior</p>
                <VariationBadge value={comparativoSoles.variacionPct} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {money(comparativoSoles.sinIgvActual)} este mes · {money(comparativoSoles.sinIgvAnterior)} el mes pasado
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Dólares vs. mes anterior</p>
                <VariationBadge value={comparativoDolares.variacionPct} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {moneyByCurrency(comparativoDolares.sinIgvActual, 'DOLARES')} este mes ·{' '}
                {moneyByCurrency(comparativoDolares.sinIgvAnterior, 'DOLARES')} el mes pasado
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Local</th>
                  <th className="px-3 py-2 font-semibold">Moneda</th>
                  <th className="px-3 py-2 text-right font-semibold">Comprobantes</th>
                  <th className="px-3 py-2 text-right font-semibold">Clientes</th>
                  <th className="px-3 py-2 text-right font-semibold">Sin IGV</th>
                  <th className="px-3 py-2 text-right font-semibold">IGV</th>
                  <th className="px-3 py-2 text-right font-semibold">Con IGV</th>
                  <th className="py-2 pl-3 text-right font-semibold">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {detailedLocalRows.map((row) => (
                  <tr key={`${row.nombre}-${row.moneda}`} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{row.nombre || 'Sin local'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        row.moneda === 'DOLARES' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {row.moneda}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{number.format(row.comprobantes || 0)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{number.format(row.clientes || 0)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-950">{moneyByCurrency(row.sin_igv, row.moneda)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.impuesto, row.moneda)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.con_igv, row.moneda)}</td>
                    <td className="py-2 pl-3 text-right font-semibold text-slate-950">{moneyByCurrency(row.ticket_promedio, row.moneda)}</td>
                  </tr>
                ))}
                {detailedLocalRows.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={8}>Sin datos para este filtro.</td>
                  </tr>
                )}
              </tbody>
              {detailedLocalRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-semibold">
                    <td className="py-2 pr-3 text-slate-950" colSpan={2}>Total Soles</td>
                    <td className="px-3 py-2 text-right text-slate-950">{number.format(solesTotal.comprobantes)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{number.format(solesTotal.clientes)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{money(solesTotal.sin_igv)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{money(solesTotal.impuesto)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{money(solesTotal.con_igv)}</td>
                    <td className="py-2 pl-3 text-right text-slate-950">
                      {money(solesTotal.comprobantes ? solesTotal.sin_igv / solesTotal.comprobantes : 0)}
                    </td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-2 pr-3 text-slate-950" colSpan={2}>Total Dólares</td>
                    <td className="px-3 py-2 text-right text-slate-950">{number.format(dolaresTotal.comprobantes)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{number.format(dolaresTotal.clientes)}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{moneyByCurrency(dolaresTotal.sin_igv, 'DOLARES')}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{moneyByCurrency(dolaresTotal.impuesto, 'DOLARES')}</td>
                    <td className="px-3 py-2 text-right text-slate-950">{moneyByCurrency(dolaresTotal.con_igv, 'DOLARES')}</td>
                    <td className="py-2 pl-3 text-right text-slate-950">
                      {moneyByCurrency(dolaresTotal.comprobantes ? dolaresTotal.sin_igv / dolaresTotal.comprobantes : 0, 'DOLARES')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Panel>
      </section>
      <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <Panel title="Facturacion diaria" right={<span className="text-xs text-slate-500">Soles</span>}>
          <ReactECharts option={dailyOption} style={{ height: 340 }} />
        </Panel>
        <Panel title="Facturacion por local">
          <ReactECharts option={localOption} style={{ height: 340 }} />
        </Panel>
      </section>
      <Panel title="Ranking de asesores" right={<span className="text-xs text-slate-500">Venta oficial</span>}>
        <ReactECharts option={advisorOption} style={{ height: Math.max(340, advisorRows.length * 42) }} />
      </Panel>
    </div>
  );
}

function AdvisorOperationsPanels({ advisorVisuals, advisorRows }) {
  return (
    <section className="space-y-4">
      {advisorVisuals.map((visual) => (
        <Panel
          key={visual.moneda}
          title={`Facturacion por asesor · ${visual.moneda === 'DOLARES' ? 'Dólares' : 'Soles'}`}
          right={<span className="text-xs text-slate-500">Importes de OT con IGV</span>}
        >
          {visual.rows.length > 0 ? (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
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
                <ReactECharts option={visual.bar} style={{ height: Math.max(320, visual.rows.length * 42) }} notMerge lazyUpdate />
                <div>
                  <p className="pt-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Margen de repuestos
                  </p>
                  <ReactECharts option={visual.margin} style={{ height: 280 }} notMerge lazyUpdate />
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

      <Panel title="Detalle operativo por asesor" right={<span className="text-xs text-slate-500">RPTO, MO, costo y margen</span>}>
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
                <th className="px-3 py-2 text-right font-semibold">Costo RPTO</th>
                <th className="px-3 py-2 text-right font-semibold">Utilidad RPTO</th>
                <th className="py-2 pl-3 text-right font-semibold">Margen RPTO</th>
              </tr>
            </thead>
            <tbody>
              {advisorRows.map((row) => (
                <tr key={`${row.local_nombre}-${row.asesor}-${row.moneda}`} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">{row.local_nombre || 'Sin sede'}</td>
                  <td className="max-w-[320px] truncate px-3 py-2 text-slate-600" title={row.asesor}>{row.asesor}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{row.moneda}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{number.format(row.ots || 0)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-950">{moneyByCurrency(row.total_con_igv, row.moneda)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.total_sin_igv, row.moneda)}</td>
                  <td className="px-3 py-2 text-right text-blue-700">{moneyByCurrency(row.repuestos_con_igv, row.moneda)}</td>
                  <td className="px-3 py-2 text-right text-indigo-700">{moneyByCurrency(row.mano_obra_con_igv, row.moneda)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{moneyByCurrency(row.costo_repuestos, row.moneda)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">{moneyByCurrency(row.utilidad_repuestos, row.moneda)}</td>
                  <td className="py-2 pl-3 text-right font-semibold text-slate-950">{pct(row.margen_repuestos_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function AsesoresDashboard({ data, filters, error }) {
  const rows = data?.rows || [];
  const advisorMixedCards = useMemo(() => {
    const grouped = new Map();
    rows.forEach((row) => {
      const advisor = row.asesor || 'Sin asesor';
      const current = grouped.get(advisor) || {
        asesor: advisor,
        soles: 0,
        dolares: 0,
        comprobantes: 0,
      };
      if (row.moneda === 'DOLARES') {
        current.dolares += Number(row.sin_igv || 0);
      } else if (row.moneda === 'SOLES') {
        current.soles += Number(row.sin_igv || 0);
      }
      current.comprobantes += Number(row.comprobantes || 0);
      grouped.set(advisor, current);
    });
    return [...grouped.values()]
      .map((row) => ({ ...row, totalMixto: row.soles + row.dolares }))
      .sort((a, b) => b.totalMixto - a.totalMixto);
  }, [rows]);
  const buildCurrency = (moneda) => {
    const filtered = rows.filter((row) => row.moneda === moneda);
    const advisors = [...new Set(filtered.map((row) => row.asesor))];
    const dates = [...new Set(filtered.map((row) => row.fecha))].sort();
    const totals = advisors.map((asesor) => ({
      asesor,
      total: filtered
        .filter((row) => row.asesor === asesor)
        .reduce((sum, row) => sum + Number(row.sin_igv || 0), 0),
    })).sort((a, b) => b.total - a.total);
    return { moneda, filtered, advisors: totals.map((row) => row.asesor), dates, totals };
  };
  const groups = [buildCurrency('SOLES'), buildCurrency('DOLARES')];

  return (
    <div className={`mx-auto max-w-[1440px] px-4 py-5 transition-all duration-200 sm:px-6 lg:px-8 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard por Asesor</h1>
          <p className="mt-1 text-sm text-slate-500">Facturacion por asesor separada por moneda.</p>
        </div>
        <DashboardFilterBar {...filters} />
      </header>
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="space-y-4">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Total por asesor</h2>
            <span className="text-xs font-medium text-amber-700">Soles + dolares sin conversion</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {advisorMixedCards.map((row, index) => (
              <section key={row.asesor} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-500" title={row.asesor}>
                      #{index + 1} {row.asesor}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {money(row.totalMixto)}
                    </p>
                  </div>
                  <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                    <Users size={20} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-blue-50 px-2 py-2">
                    <p className="text-blue-600">Soles</p>
                    <p className="mt-1 font-semibold text-blue-900">{money(row.soles)}</p>
                  </div>
                  <div className="rounded-md bg-emerald-50 px-2 py-2">
                    <p className="text-emerald-600">Dólares</p>
                    <p className="mt-1 font-semibold text-emerald-900">{moneyByCurrency(row.dolares, 'DOLARES')}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {number.format(row.comprobantes)} comprobantes
                </p>
              </section>
            ))}
          </div>
        </section>
        {groups.map((group) => {
          const option = {
            tooltip: { trigger: 'axis' },
            legend: { type: 'scroll', top: 0 },
            grid: { left: 55, right: 25, top: 55, bottom: 35 },
            xAxis: { type: 'category', data: group.dates.map(shortDate) },
            yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
            series: group.advisors.map((asesor) => ({
              name: asesor,
              type: 'line',
              smooth: true,
              symbolSize: 7,
              data: group.dates.map((fecha) => {
                const row = group.filtered.find((item) => item.fecha === fecha && item.asesor === asesor);
                return Number(row?.sin_igv || 0);
              }),
            })),
          };
          return (
            <Panel
              key={group.moneda}
              title={`Avance diario por asesor · ${group.moneda === 'DOLARES' ? 'Dólares' : 'Soles'}`}
              right={<span className="text-xs text-slate-500">Venta diaria</span>}
            >
              {group.filtered.length ? (
                <>
                  <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {group.totals.slice(0, 4).map((row, index) => (
                      <div key={row.asesor} className="rounded-md bg-slate-50 p-3">
                        <p className="truncate text-xs text-slate-500" title={row.asesor}>#{index + 1} {row.asesor}</p>
                        <p className="mt-1 font-bold text-slate-950">{moneyByCurrency(row.total, group.moneda)}</p>
                      </div>
                    ))}
                  </div>
                  <ReactECharts option={option} style={{ height: 390 }} />
                </>
              ) : (
                <div className="grid h-60 place-items-center text-sm text-slate-500">Sin datos para esta moneda.</div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CATEGORIA_LABELS = {
  GENERAL: 'Ventas generales',
  MANTENIMIENTO_PREVENTIVO: 'Mantenimiento preventivo',
  MANTENIMIENTO_CORRECTIVO: 'Mantenimiento correctivo',
  PLANCHADO_PINTURA: 'Planchado y pintura',
  OTROS: 'Otros servicios',
  SIN_CLASIFICAR: 'Sin clasificar',
  CLIENTE_FINAL: 'Cliente final',
  CORPORATIVO: 'Corporativos',
  FLOTA: 'Flotas',
  ARVAL: 'Arval',
  RENTING: 'Renting',
  MAREAUTOS: 'Mareautos',
  ALD: 'ALD',
  ANC: 'ANC',
  OTRAS_FLOTAS: 'Otras flotas',
};

const CUOTA_CATEGORIAS = [
  'GENERAL',
  'MANTENIMIENTO_PREVENTIVO',
  'MANTENIMIENTO_CORRECTIVO',
  'PLANCHADO_PINTURA',
  'CLIENTE_FINAL',
  'CORPORATIVO',
  'FLOTA',
  'ARVAL',
  'RENTING',
  'MAREAUTOS',
  'ALD',
  'ANC',
  'OTRAS_FLOTAS',
];

function ventaRealPorCategoria(categoria, data) {
  if (categoria === 'GENERAL') {
    return (data?.porCliente || [])
      .filter((row) => row.moneda === 'SOLES')
      .reduce((sum, row) => sum + Number(row.sin_igv || 0), 0);
  }
  if (['CLIENTE_FINAL', 'CORPORATIVO', 'FLOTA'].includes(categoria)) {
    const row = (data?.porCliente || []).find(
      (item) => item.categoria === categoria && item.moneda === 'SOLES',
    );
    return Number(row?.sin_igv || 0);
  }
  if (['ARVAL', 'RENTING', 'MAREAUTOS', 'ALD', 'ANC', 'OTRAS_FLOTAS'].includes(categoria)) {
    const row = (data?.porFlota || []).find(
      (item) => item.nombre === categoria && item.moneda === 'SOLES',
    );
    return Number(row?.sin_igv || 0);
  }
  const row = (data?.porServicio || []).find(
    (item) => item.categoria === categoria && item.moneda === 'SOLES',
  );
  return Number(row?.sin_igv || 0);
}

function promedioMensualCategorias(porMes, anio, categorias) {
  const filtrado = porMes.filter(
    (row) => row.anio === anio && categorias.includes(row.categoria) && row.moneda === 'SOLES',
  );
  const meses = [...new Set(filtrado.map((row) => row.mes))];
  if (meses.length === 0) return 0;
  const total = filtrado.reduce((sum, row) => sum + Number(row.sin_igv || 0), 0);
  return total / meses.length;
}

function CuotaForm({ anio, locales, onSaveCuota }) {
  const [mes, setMes] = useState('0');
  const [categoria, setCategoria] = useState('GENERAL');
  const [localNombre, setLocalNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!monto || Number(monto) < 0) return;
    setSaving(true);
    try {
      await onSaveCuota({
        anio,
        mes: Number(mes),
        categoria,
        local_nombre: localNombre,
        monto: Number(monto),
      });
      setMonto('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submit}>
      <label className="text-xs font-medium text-slate-500">
        Categoria
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-950"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
        >
          {CUOTA_CATEGORIAS.map((value) => (
            <option key={value} value={value}>{CATEGORIA_LABELS[value] || value}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">
        Periodo
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-950"
          value={mes}
          onChange={(event) => setMes(event.target.value)}
        >
          <option value="0">Cuota anual</option>
          {MESES.map((label, index) => (
            <option key={label} value={index + 1}>{label}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">
        Local
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-950"
          value={localNombre}
          onChange={(event) => setLocalNombre(event.target.value)}
        >
          <option value="">Todos</option>
          {(locales || []).map((row) => (
            <option key={row.local_nombre} value={row.local_nombre}>{row.local_nombre}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">
        Monto (S/)
        <input
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-950"
          type="number"
          min="0"
          step="100"
          value={monto}
          onChange={(event) => setMonto(event.target.value)}
        />
      </label>
      <button
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        disabled={saving}
      >
        <Plus size={16} />
        {saving ? 'Guardando...' : 'Guardar cuota'}
      </button>
    </form>
  );
}

function ComercialMetricCard({ label, value, hint, icon: Icon, tone = 'blue', badge }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    green: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    rose: 'border-rose-100 bg-rose-50/70 text-rose-700',
    violet: 'border-indigo-100 bg-indigo-50/70 text-indigo-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg border p-2 ${tones[tone] || tones.blue}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 flex min-h-5 items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-500">{hint}</p>
        {badge}
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-950',
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-emerald-50 text-emerald-900',
    amber: 'bg-amber-50 text-amber-900',
  };

  return (
    <div className={`rounded-lg p-3 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function ProgressBar({ value }) {
  const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Math.min(Number(value), 140)) : 0;
  const color = safeValue >= 100 ? 'bg-emerald-500' : safeValue >= 70 ? 'bg-blue-600' : 'bg-amber-500';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(safeValue, 100)}%` }} />
    </div>
  );
}

function ComercialDashboard({ data, anualData, cuotas, filters, onSaveCuota, onDeleteCuota, error }) {
  const yearNum = Number((filters.month || '').slice(0, 4)) || new Date().getFullYear();
  const monthNum = Number((filters.month || '').slice(5, 7)) || 1;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === yearNum && today.getMonth() + 1 === monthNum;
  const diasMes = new Date(yearNum, monthNum, 0).getDate();
  const diasTranscurridos = isCurrentMonth ? today.getDate() : diasMes;

  const totalSoles = ventaRealPorCategoria('GENERAL', data);
  const totalDolares = (data?.porCliente || [])
    .filter((row) => row.moneda === 'DOLARES')
    .reduce((sum, row) => sum + Number(row.sin_igv || 0), 0);
  const mantenimientoPreventivo = ventaRealPorCategoria('MANTENIMIENTO_PREVENTIVO', data);
  const mantenimientoCorrectivo = ventaRealPorCategoria('MANTENIMIENTO_CORRECTIVO', data);
  const planchadoPintura = ventaRealPorCategoria('PLANCHADO_PINTURA', data);
  const clienteFinal = ventaRealPorCategoria('CLIENTE_FINAL', data);
  const corporativos = ventaRealPorCategoria('CORPORATIVO', data);
  const flotas = ventaRealPorCategoria('FLOTA', data);
  const sinClasificar = ventaRealPorCategoria('SIN_CLASIFICAR', data);

  const comparativoServicio = data?.comparativoServicio || [];
  const variacionDe = (categoria) =>
    comparativoServicio.find((row) => row.categoria === categoria)?.variacionPct ?? null;

  const porMes = anualData?.porMes || [];
  const buildYearSeries = (anio) =>
    MESES.map((_, index) => {
      const mes = index + 1;
      return porMes
        .filter((row) => row.anio === anio && row.mes === mes && row.moneda === 'SOLES')
        .reduce((sum, row) => sum + Number(row.sin_igv || 0), 0);
    });
  const serieActual = buildYearSeries(yearNum);
  const serieAnterior = buildYearSeries(yearNum - 1);
  const sinDatosAnioAnterior = serieAnterior.every((value) => value === 0);

  const anualOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value) => money(value) },
    legend: { bottom: 0 },
    grid: { left: 55, right: 20, top: 25, bottom: 40 },
    xAxis: { type: 'category', data: MESES },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    series: [
      { name: String(yearNum - 1), type: 'line', smooth: true, itemStyle: { color: '#94a3b8' }, data: serieAnterior },
      {
        name: String(yearNum),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.12 },
        lineStyle: { width: 3 },
        itemStyle: { color: '#155eef' },
        data: serieActual,
      },
    ],
  };

  const mantenimientoRows = [
    {
      categoria: 'MANTENIMIENTO_PREVENTIVO',
      nombre: 'Preventivo',
      row: (data?.porServicio || []).find((r) => r.categoria === 'MANTENIMIENTO_PREVENTIVO' && r.moneda === 'SOLES'),
    },
    {
      categoria: 'MANTENIMIENTO_CORRECTIVO',
      nombre: 'Correctivo',
      row: (data?.porServicio || []).find((r) => r.categoria === 'MANTENIMIENTO_CORRECTIVO' && r.moneda === 'SOLES'),
    },
  ];
  const mantenimientoTotal = mantenimientoPreventivo + mantenimientoCorrectivo;
  const mantenimientoPromedioMensual = promedioMensualCategorias(
    porMes,
    yearNum,
    ['MANTENIMIENTO_PREVENTIVO', 'MANTENIMIENTO_CORRECTIVO'],
  );
  const mantenimientoPromedioDiario = mantenimientoTotal / diasTranscurridos;

  const ppRow = (data?.porServicio || []).find((r) => r.categoria === 'PLANCHADO_PINTURA' && r.moneda === 'SOLES');
  const ppPromedioMensual = promedioMensualCategorias(porMes, yearNum, ['PLANCHADO_PINTURA']);
  const ppPromedioDiario = planchadoPintura / diasTranscurridos;

  const FLOTA_ORDEN = ['ARVAL', 'RENTING', 'MAREAUTOS', 'ALD', 'ANC', 'OTRAS_FLOTAS'];
  const flotaRows = FLOTA_ORDEN.map((codigo) => ({
    codigo,
    nombre: CATEGORIA_LABELS[codigo],
    soles: (data?.porFlota || []).find((r) => r.nombre === codigo && r.moneda === 'SOLES'),
    dolares: (data?.porFlota || []).find((r) => r.nombre === codigo && r.moneda === 'DOLARES'),
  }));
  const flotaTotalSoles = flotaRows.reduce((sum, r) => sum + Number(r.soles?.sin_igv || 0), 0);
  const flotaTotalUnidades = flotaRows.reduce((sum, r) => sum + Number(r.soles?.unidades || 0), 0);

  const cuotaMesActual = (categoria) =>
    (cuotas?.cuotas || []).find(
      (row) => row.categoria === categoria && (row.mes === monthNum || row.mes === 0),
    );

  const cumplimientoRows = CUOTA_CATEGORIAS.map((categoria) => {
    const cuota = cuotaMesActual(categoria);
    const ventaReal = ventaRealPorCategoria(categoria, data);
    const montoCuota = Number(cuota?.monto || 0);
    return {
      categoria,
      nombre: CATEGORIA_LABELS[categoria],
      cuota,
      montoCuota,
      ventaReal,
      cumplimiento: montoCuota > 0 ? (ventaReal / montoCuota) * 100 : null,
    };
  }).filter((row) => row.cuota);

  const cuotaGeneral = cumplimientoRows.find((row) => row.categoria === 'GENERAL');
  const cumplimientoGeneral = cuotaGeneral?.cumplimiento ?? null;
  const categoriaLider = [
    { nombre: 'Mantenimiento', valor: mantenimientoTotal },
    { nombre: 'Planchado y pintura', valor: planchadoPintura },
    { nombre: 'Cliente final', valor: clienteFinal },
    { nombre: 'Corporativos', valor: corporativos },
    { nombre: 'Flotas', valor: flotas },
  ].sort((a, b) => b.valor - a.valor)[0];
  const flotaLider = flotaRows
    .map((row) => ({ ...row, total: Number(row.soles?.sin_igv || 0) }))
    .sort((a, b) => b.total - a.total)[0];
  const flotaMax = Math.max(...flotaRows.map((row) => Number(row.soles?.sin_igv || 0)), 1);
  const resumenCards = [
    {
      label: 'Ventas generales',
      value: money(totalSoles),
      hint: `${moneyByCurrency(totalDolares, 'DOLARES')} en dolares, sin convertir`,
      icon: Banknote,
      tone: 'green',
      badge: cumplimientoGeneral !== null ? <VariationBadge value={cumplimientoGeneral - 100} /> : null,
    },
    {
      label: 'Mantenimiento',
      value: money(mantenimientoTotal),
      hint: `Preventivo ${money(mantenimientoPreventivo)} | Correctivo ${money(mantenimientoCorrectivo)}`,
      icon: Car,
      tone: 'blue',
      badge: <VariationBadge value={variacionDe('MANTENIMIENTO_PREVENTIVO')} />,
    },
    {
      label: 'Planchado y pintura',
      value: money(planchadoPintura),
      hint: `${number.format(ppRow?.unidades || 0)} unidades atendidas`,
      icon: Gauge,
      tone: 'amber',
      badge: <VariationBadge value={variacionDe('PLANCHADO_PINTURA')} />,
    },
    {
      label: 'Cliente final',
      value: money(clienteFinal),
      hint: 'DNI / usuarios finales',
      icon: Users,
      tone: 'violet',
      badge: <VariationBadge value={variacionDe('CLIENTE_FINAL')} />,
    },
    {
      label: 'Corporativos',
      value: money(corporativos),
      hint: 'RUC sin flota identificada',
      icon: Briefcase,
      tone: 'blue',
      badge: <VariationBadge value={variacionDe('CORPORATIVO')} />,
    },
    {
      label: 'Flotas',
      value: money(flotas),
      hint: `${number.format(flotaTotalUnidades)} unidades atendidas`,
      icon: TrendingUp,
      tone: 'green',
      badge: <VariationBadge value={variacionDe('FLOTA')} />,
    },
  ];

  return (
    <div className={`mx-auto max-w-[1440px] px-4 py-5 transition-all duration-200 sm:px-6 lg:px-8 ${filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
      <header className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              <Briefcase size={14} />
              Informe comercial
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Resumen ejecutivo {MESES[monthNum - 1]} {yearNum}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Facturacion oficial clasificada por servicio, tipo de cliente, flota y cumplimiento de cuotas.
            </p>
          </div>
          <DashboardFilterBar {...filters} />
        </div>
        <div className="grid border-t border-slate-100 bg-slate-50/70 md:grid-cols-4">
          <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Venta real</p>
            <p className="mt-1 text-xl font-black text-slate-950">{money(totalSoles)}</p>
          </div>
          <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cumplimiento general</p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {cumplimientoGeneral === null ? 'Sin cuota' : pct(cumplimientoGeneral)}
            </p>
          </div>
          <div className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria lider</p>
            <p className="mt-1 text-xl font-black text-slate-950">{categoriaLider?.nombre || '-'}</p>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flota lider</p>
            <p className="mt-1 text-xl font-black text-slate-950">{flotaLider?.nombre || '-'}</p>
          </div>
        </div>
      </header>
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {resumenCards.map((card) => (
          <ComercialMetricCard key={card.label} {...card} />
        ))}
        {sinClasificar > 0 && (
          <ComercialMetricCard label="Sin clasificar" value={money(sinClasificar)} hint="Documentos sin orden de trabajo asociada" icon={ReceiptText} tone="rose" />
        )}
      </section>
      <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <Panel
          title={`Comparativo Mensual ${yearNum - 1} vs ${yearNum}`}
          right={<span className="text-xs text-slate-500">Soles, sin IGV</span>}
        >
          {sinDatosAnioAnterior && (
            <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Aun no hay datos cargados de {yearNum - 1}. En cuanto se importen los CSV de ese anio, esta serie se completa sola.
            </p>
          )}
          <ReactECharts option={anualOption} style={{ height: 335 }} notMerge lazyUpdate />
        </Panel>
        <Panel title="Lectura rapida" right={<Goal size={18} className="text-blue-700" />}>
          <div className="space-y-3">
            <MiniStat label="Promedio mensual mantenimiento" value={money(mantenimientoPromedioMensual)} tone="blue" />
            <MiniStat label="Promedio diario P&P" value={money(ppPromedioDiario)} tone="amber" />
            <MiniStat label="Unidades flota" value={number.format(flotaTotalUnidades)} tone="green" />
          </div>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            La categoria con mayor venta del periodo es <strong className="text-slate-950">{categoriaLider?.nombre || '-'}</strong>.
            En flotas destaca <strong className="text-slate-950">{flotaLider?.nombre || '-'}</strong> con {money(flotaLider?.total || 0)}.
          </p>
        </Panel>
      </section>
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Mantenimiento"
          right={<VariationBadge value={variacionDe('MANTENIMIENTO_PREVENTIVO')} />}
        >
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-md bg-slate-50 p-2">
              <p>Promedio mensual ({yearNum})</p>
              <p className="mt-1 font-bold text-slate-950">{money(mantenimientoPromedioMensual)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p>Promedio diario (mes actual)</p>
              <p className="mt-1 font-bold text-slate-950">{money(mantenimientoPromedioDiario)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Tipo</th>
                  <th className="px-3 py-2 text-right font-semibold">Comprobantes</th>
                  <th className="px-3 py-2 text-right font-semibold">Unidades</th>
                  <th className="py-2 pl-3 text-right font-semibold">Sin IGV</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientoRows.map((item) => (
                  <tr key={item.categoria} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{item.nombre}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{number.format(item.row?.comprobantes || 0)}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{number.format(item.row?.unidades || 0)}</td>
                    <td className="py-2 pl-3 text-right font-semibold text-slate-950">{money(item.row?.sin_igv)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="py-2 pr-3 text-slate-950">Total</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2" />
                  <td className="py-2 pl-3 text-right text-slate-950">{money(mantenimientoTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel
          title="Planchado y Pintura"
          right={<VariationBadge value={variacionDe('PLANCHADO_PINTURA')} />}
        >
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-md bg-slate-50 p-2">
              <p>Promedio mensual ({yearNum})</p>
              <p className="mt-1 font-bold text-slate-950">{money(ppPromedioMensual)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p>Promedio diario (mes actual)</p>
              <p className="mt-1 font-bold text-slate-950">{money(ppPromedioDiario)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Comprobantes</p>
              <p className="mt-1 font-bold text-slate-950">{number.format(ppRow?.comprobantes || 0)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Unidades</p>
              <p className="mt-1 font-bold text-slate-950">{number.format(ppRow?.unidades || 0)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Sin IGV</p>
              <p className="mt-1 font-bold text-slate-950">{money(ppRow?.sin_igv)}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mb-4">
        <Panel
          title="Flotas por Cliente"
          right={<span className="text-xs text-slate-500">{number.format(flotaTotalUnidades)} unidades atendidas</span>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Flota</th>
                  <th className="px-3 py-2 text-right font-semibold">Comprobantes</th>
                  <th className="px-3 py-2 text-right font-semibold">Unidades</th>
                  <th className="px-3 py-2 text-right font-semibold">Sin IGV (S/)</th>
                  <th className="py-2 pl-3 text-right font-semibold">Sin IGV (US$)</th>
                </tr>
              </thead>
              <tbody>
                {flotaRows.map((row) => {
                  const ventaSoles = Number(row.soles?.sin_igv || 0);
                  return (
                    <tr key={row.codigo} className="border-b border-slate-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-700">{row.nombre}</div>
                        <div className="mt-2">
                          <ProgressBar value={(ventaSoles / flotaMax) * 100} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.soles?.comprobantes || 0)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.soles?.unidades || 0)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-950">{money(ventaSoles)}</td>
                      <td className="py-2 pl-3 text-right text-slate-600">{moneyByCurrency(row.dolares?.sin_igv, 'DOLARES')}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="py-2 pr-3 text-slate-950">Total</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right text-slate-950">{number.format(flotaTotalUnidades)}</td>
                  <td className="px-3 py-2 text-right text-slate-950">{money(flotaTotalSoles)}</td>
                  <td className="py-2 pl-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mb-4">
        <Panel
          title="Cumplimiento de Cuotas"
          right={<span className="text-xs text-slate-500">{MESES[monthNum - 1]} {yearNum}</span>}
        >
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Categoria</th>
                  <th className="px-3 py-2 font-semibold">Periodo</th>
                  <th className="px-3 py-2 text-right font-semibold">Cuota</th>
                  <th className="px-3 py-2 text-right font-semibold">Venta real</th>
                  <th className="px-3 py-2 text-right font-semibold">Cumplimiento</th>
                  <th className="py-2 pl-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {cumplimientoRows.map((row) => (
                  <tr key={row.categoria} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium text-slate-700">{row.nombre}</td>
                    <td className="px-3 py-2 text-slate-600">{row.cuota.mes === 0 ? 'Anual' : MESES[row.cuota.mes - 1]}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{money(row.montoCuota)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-950">{money(row.ventaReal)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="ml-auto w-32">
                        <div className="mb-1 text-xs font-semibold text-slate-700">{pct(row.cumplimiento)}</div>
                        <ProgressBar value={row.cumplimiento} />
                      </div>
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => onDeleteCuota(row.cuota.id)}
                        title="Eliminar cuota"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cumplimientoRows.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={6}>
                      No hay cuotas configuradas para este mes todavia. Agrega una abajo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <CuotaForm anio={yearNum} locales={filters.locales} onSaveCuota={onSaveCuota} />
        </Panel>
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('facturacion');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocal] = useState('Todos');
  const [meta, setMeta] = useState(200000);
  const [tipoCambio, setTipoCambio] = useState(3.75);
  const [locales, setLocales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [advisorData, setAdvisorData] = useState(null);
  const [comercialData, setComercialData] = useState(null);
  const [anualData, setAnualData] = useState(null);
  const [cuotas, setCuotas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(
    () => ({ month, local, meta, tipoCambio }),
    [month, local, meta, tipoCambio],
  );
  const anio = Number(month.slice(0, 4)) || new Date().getFullYear();

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
        comercialRes,
        anualRes,
        cuotasRes,
      ] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/resumen', { params }),
        api.get('/dashboard/series', { params }),
        api.get('/dashboard/facturacion', { params }),
        api.get('/dashboard/asesores', { params }),
        api.get('/dashboard/comercial', { params }),
        api.get('/dashboard/comercial/anual', { params: { year: anio, local } }),
        api.get('/dashboard/cuotas', { params: { anio } }),
      ]);
      setLocales(localesRes.data);
      setSummary(summaryRes.data);
      setSeries(seriesRes.data);
      setFinancial(financialRes.data);
      setAdvisorData(advisorRes.data);
      setComercialData(comercialRes.data);
      setAnualData(anualRes.data);
      setCuotas(cuotasRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function saveCuota(payload) {
    await api.post('/dashboard/cuotas', payload);
    const cuotasRes = await api.get('/dashboard/cuotas', { params: { anio } });
    setCuotas(cuotasRes.data);
  }

  async function deleteCuotaById(id) {
    await api.delete(`/dashboard/cuotas/${id}`);
    const cuotasRes = await api.get('/dashboard/cuotas', { params: { anio } });
    setCuotas(cuotasRes.data);
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
      ) : page === 'asesores' ? (
        <AsesoresDashboard
          data={advisorData}
          filters={dashboardFilters}
          error={error}
        />
      ) : page === 'comercial' ? (
        <ComercialDashboard
          data={comercialData}
          anualData={anualData}
          cuotas={cuotas}
          filters={dashboardFilters}
          onSaveCuota={saveCuota}
          onDeleteCuota={deleteCuotaById}
          error={error}
        />
      ) : (
      <div className={`mx-auto max-w-[1440px] px-4 py-5 transition-all duration-200 sm:px-6 lg:px-8 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Dashboard Operativo</h1>
            <p className="mt-1 text-sm text-slate-500">
              Actividad, producción, estados, vehículos y rentabilidad de órdenes de trabajo.
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-[150px_180px_180px_130px_44px]">
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
              <label className="text-xs font-medium text-slate-500">
                Tipo de cambio
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={tipoCambio}
                  onChange={(event) => setTipoCambio(Number(event.target.value))}
                />
              </label>
              <button
                className="mt-5 grid h-10 place-items-center rounded-md bg-blue-700 text-white hover:bg-blue-800"
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
            hint={`${money(summary?.facturadoSoles)} + ${moneyByCurrency(summary?.facturadoDolares, 'DOLARES')} sin conversion`}
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
          <Card label="OT no facturadas" value={money(pendingPotential)} hint={`${number.format(pendingOts)} OT sin estado FACTURADO`} icon={CalendarDays} tone="rose" />
        </section>

        <section className="mb-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Panel title="Avance Diario por OT Facturada" right={<span className="text-xs text-slate-500">Corte {summary?.fechaCorte || '-'}</span>}>
            <ReactECharts option={dailyOption} style={{ height: 330 }} notMerge lazyUpdate />
          </Panel>
          <Panel title="Avance de Meta">
            <ReactECharts option={gaugeOption} style={{ height: 330 }} notMerge lazyUpdate />
          </Panel>
        </section>

        <section className="mb-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Avance por Local">
            <ReactECharts option={localOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Panel>
          <Panel title="Tipo de Documento">
            <ReactECharts option={typeOption} style={{ height: 300 }} notMerge lazyUpdate />
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
                    <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
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
                        <ReactECharts option={visual.margin} style={{ height: 280 }} notMerge lazyUpdate />
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
            <ReactECharts option={ticketOtOption} style={{ height: 330 }} notMerge lazyUpdate />
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
            <ReactECharts option={estadoOption} style={{ height: 320 }} notMerge lazyUpdate />
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

export default App;
