import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { AlertTriangle, Coins, Info, PackageSearch, Percent, ReceiptText, TrendingDown, TrendingUp, Wrench } from 'lucide-react';
import { api } from '../../api';
import { Card, Panel, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { money, number } from '../../utils/formatters';
import { MONTH_NAMES } from '../../config/appConfig';

// Tarifa de mano de obra por hora (S/ sin IGV) acordada para el taller. Se usa
// para convertir la venta de mano de obra en horas y estimar su costo con el
// costo por hora del tecnico que ingresa el usuario.
const TARIFA_MO_HORA = 80;
const CLAVE_COSTO_HORA = 'margen.costoHoraTecnico';

function leerCostoHora() {
  try {
    const valor = Number(window.localStorage.getItem(CLAVE_COSTO_HORA));
    return valor > 0 ? valor : '';
  } catch {
    return '';
  }
}

const pct1 = (value) => (value === null || Number.isNaN(value) ? '—' : `${value.toFixed(1)}%`);
const pctDelTotal = (parte, total) => (total ? `${((parte / total) * 100).toFixed(0)}%` : '—');

// Semaforo del margen: verde sano, ambar a vigilar, rojo bajo.
function toneMargen(margen) {
  if (margen === null || Number.isNaN(margen)) return 'bg-slate-100 text-slate-500';
  if (margen >= 50) return 'bg-emerald-50 text-emerald-700';
  if (margen >= 30) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export default function MargenPanel({ month, local }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [costoHora, setCostoHora] = useState(leerCostoHora);

  useEffect(() => {
    let vigente = true;
    setLoading(true);
    setError('');
    api.get('/dashboard/margen', { params: { month, local } })
      .then((response) => { if (vigente) setData(response.data); })
      .catch((requestError) => {
        if (vigente) setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar el margen');
      })
      .finally(() => { if (vigente) setLoading(false); });
    return () => { vigente = false; };
  }, [month, local]);

  const guardarCostoHora = (valor) => {
    setCostoHora(valor);
    try {
      if (Number(valor) > 0) window.localStorage.setItem(CLAVE_COSTO_HORA, String(valor));
      else window.localStorage.removeItem(CLAVE_COSTO_HORA);
    } catch {
      // Sin almacenamiento disponible: el valor vale solo para esta sesion.
    }
  };

  const horaTecnico = Number(costoHora) > 0 ? Number(costoHora) : 0;
  // Costo de mano de obra: el registrado en el sistema o, si se ingreso el
  // costo por hora del tecnico, el estimado (horas = venta MO / tarifa).
  const costoManoObra = (mo) => (
    horaTecnico ? Math.max(mo.costo, (mo.venta / TARIFA_MO_HORA) * horaTecnico) : mo.costo
  );
  const calcular = (grupo) => {
    const rep = grupo?.rep || { venta: 0, costo: 0 };
    const mo = grupo?.mo || { venta: 0, costo: 0 };
    const costoMo = costoManoObra(mo);
    const venta = rep.venta + mo.venta;
    const costo = rep.costo + costoMo;
    return {
      venta,
      costo,
      margen: venta - costo,
      margenPct: venta ? ((venta - costo) / venta) * 100 : null,
      margenRepPct: rep.venta ? ((rep.venta - rep.costo) / rep.venta) * 100 : null,
      margenMoPct: mo.venta ? ((mo.venta - costoMo) / mo.venta) * 100 : null,
      rep: { venta: rep.venta, margen: rep.venta - rep.costo },
      mo: { venta: mo.venta, margen: mo.venta - costoMo },
    };
  };

  const totales = data?.totales;
  const actual = calcular(totales);
  const anterior = calcular(data?.mesAnterior);
  const variacionPp = actual.margenPct !== null && anterior.margenPct !== null ? actual.margenPct - anterior.margenPct : null;
  const pctMoSinCosto = totales?.mo?.lineas ? (totales.mo.lineasSinCosto / totales.mo.lineas) * 100 : 0;

  const evolucion = useMemo(() => (data?.evolucion || []).map((row) => ({ mes: row.mes, ...calcular(row) })), [data, horaTecnico]);
  const porServicio = useMemo(
    () => (data?.porServicio || []).map((row) => ({ nombre: row.servicio, ots: row.ots, ...calcular(row) }))
      .filter((row) => row.venta > 0).sort((a, b) => b.venta - a.venta),
    [data, horaTecnico],
  );
  const porSede = useMemo(
    () => (data?.porSede || []).map((row) => ({ nombre: row.sede, ots: row.ots, ...calcular(row) })).sort((a, b) => b.venta - a.venta),
    [data, horaTecnico],
  );
  const porAsesor = useMemo(
    () => (data?.porAsesor || []).map((row) => ({ nombre: row.asesor, ots: row.ots, ...calcular(row) }))
      .filter((row) => row.venta > 0).sort((a, b) => b.venta - a.venta).slice(0, 12),
    [data, horaTecnico],
  );
  const alertas = data?.alertas || [];
  const comentarios = totales
    ? armarComentarios({ month, actual, anterior, totales, porServicio, porSede, porAsesor, alertas, estimado: Boolean(horaTecnico) })
    : [];

  const etiquetaMes = (yyyymm) => {
    const [anio, mes] = String(yyyymm).split('-').map(Number);
    return `${MONTH_NAMES[mes - 1]} ${String(anio).slice(2)}`;
  };

  const evolucionOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const row = evolucion[params[0]?.dataIndex] || {};
        return [
          `<strong>${params[0]?.axisValue}</strong>`,
          `Venta: ${money(row.venta)}`,
          `Costo: ${money(row.costo)}`,
          `Margen: ${money(row.margen)} (${pct1(row.margenPct)})`,
          `&nbsp;&nbsp;Repuestos: ${money(row.rep?.margen)} (${pct1(row.margenRepPct)})`,
          `&nbsp;&nbsp;Mano de obra: ${money(row.mo?.margen)} (${pct1(row.margenMoPct)})`,
        ].join('<br/>');
      },
    },
    legend: { top: 0 },
    grid: { left: 55, right: 45, top: 40, bottom: 25 },
    xAxis: { type: 'category', data: evolucion.map((row) => etiquetaMes(row.mes)) },
    yAxis: [
      { type: 'value', axisLabel: { formatter: (v) => `${Math.round(v / 1000)}k` } },
      { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' }, splitLine: { show: false } },
    ],
    series: [
      { name: 'Venta', type: 'bar', data: evolucion.map((row) => Math.round(row.venta)), itemStyle: { color: '#cbd5e1', borderRadius: [4, 4, 0, 0] } },
      // Margen apilado: repuestos + mano de obra = margen bruto del mes.
      { name: 'Margen repuestos', type: 'bar', stack: 'margen', data: evolucion.map((row) => Math.round(row.rep.margen)), itemStyle: { color: '#6366f1' } },
      { name: 'Margen mano de obra', type: 'bar', stack: 'margen', data: evolucion.map((row) => Math.round(row.mo.margen)), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
      {
        name: 'Margen %',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 7,
        data: evolucion.map((row) => (row.margenPct === null ? null : Number(row.margenPct.toFixed(1)))),
        itemStyle: { color: '#b91c1c' },
        label: { show: true, position: 'top', formatter: '{c}%', fontSize: 10, color: '#7f1d1d' },
      },
    ],
  };

  return (
    <div className="relative space-y-4">
      <LoadingOverlay show={loading} />
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {/* Supuesto de costo de mano de obra */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="max-w-3xl text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Margen = Venta sin IGV − Costo</span> de las OT facturadas en el mes
          (por fecha de cierre). El costo de repuestos es el del kardex; el de mano de obra se estima con el costo por hora del técnico.
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Costo hora técnico
          <span className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">S/</span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={costoHora}
              onChange={(event) => guardarCostoHora(event.target.value)}
              placeholder="Sin dato"
              className="w-28 rounded-md border border-slate-300 py-1.5 pl-7 pr-2 text-right text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none"
            />
          </span>
        </label>
      </section>

      {!horaTecnico && totales && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            El {pct1(pctMoSinCosto)} de las líneas de mano de obra no tiene costo en el sistema (no se carga el sueldo del técnico),
            por eso su margen sale casi 100%. Ingresa el <strong>costo hora técnico</strong> para estimarlo; el margen de repuestos sí es real.
          </p>
        </div>
      )}

      {/* Indicadores */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Card label="Venta sin IGV" value={money(actual.venta)} hint={`${number.format(totales?.ots || 0)} OT facturadas`} icon={ReceiptText} tone="blue" />
        <Card label="Costo" value={money(actual.costo)} hint="Lo que costó lo vendido" icon={Coins} tone="amber" />
        <Card label="Margen bruto" value={money(actual.margen)} hint="Lo que queda después del costo" icon={Coins} tone="green" />
        <Card
          label="Margen %"
          value={pct1(actual.margenPct)}
          hint={variacionPp === null ? 'Sin mes anterior para comparar' : `${variacionPp >= 0 ? '▲' : '▼'} ${Math.abs(variacionPp).toFixed(1)} pp vs. mes anterior`}
          icon={Percent}
          tone={variacionPp !== null && variacionPp < 0 ? 'rose' : 'green'}
        />
        {/* Margen bruto partido en sus dos fuentes: los dos cuadros suman el Margen bruto. */}
        <Card
          label="Margen repuestos"
          value={money(actual.rep.margen)}
          hint={`${pctDelTotal(actual.rep.margen, actual.margen)} del margen bruto · ${pct1(actual.margenRepPct)} de ${money(actual.rep.venta)} vendidos`}
          icon={PackageSearch}
          tone="violet"
        />
        <Card
          label="Margen mano de obra"
          value={money(actual.mo.margen)}
          hint={`${pctDelTotal(actual.mo.margen, actual.margen)} del margen bruto · ${pct1(actual.margenMoPct)} de ${money(actual.mo.venta)} vendidos${horaTecnico ? ' (estimado)' : ' (sin costo técnico)'}`}
          icon={Wrench}
          tone="blue"
        />
      </section>

      {/* Tendencia + por servicio */}
      <section className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Panel title="Evolución del margen" right={<span className="text-xs text-slate-500">Últimos 12 meses</span>}>
            <div className="h-[320px]">
              <ReactECharts option={evolucionOption} style={{ height: '100%' }} notMerge lazyUpdate />
            </div>
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel title="Margen por tipo de servicio" right={<span className="text-xs text-slate-500">Mes seleccionado</span>}>
            <div className="space-y-3">
              {porServicio.map((row) => (
                <BarraMargen key={row.nombre} row={row} estimado={Boolean(horaTecnico)} />
              ))}
              {!porServicio.length && <p className="text-sm text-slate-500">Sin OT facturadas en el mes.</p>}
            </div>
          </Panel>
        </div>
      </section>

      {/* Sedes + asesores */}
      <section className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Panel title="Margen por sede" right={<span className="text-xs text-slate-500">Todas las sedes</span>}>
            <div className="space-y-3">
              {porSede.map((row) => (
                <BarraMargen key={row.nombre} row={{ ...row, nombre: row.nombre.replace('Pineda ', '') }} estimado={Boolean(horaTecnico)} />
              ))}
            </div>
          </Panel>
        </div>
        <div className="xl:col-span-3">
          <Panel title="Margen por asesor" right={<span className="text-xs text-slate-500">Ordenado por venta</span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Asesor</th>
                    <th className="px-3 py-2 text-right font-semibold">OT</th>
                    <th className="px-3 py-2 text-right font-semibold">Venta</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen repuestos</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen MO</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen</th>
                    <th className="py-2 pl-3 text-right font-semibold">Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {porAsesor.map((row) => (
                    <tr key={row.nombre} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-slate-800">{row.nombre}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{number.format(row.ots)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{money(row.venta)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{money(row.rep.margen)}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{money(row.mo.margen)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{money(row.margen)}</td>
                      <td className="py-2 pl-3 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${toneMargen(row.margenPct)}`}>{pct1(row.margenPct)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </section>

      {/* Alertas */}
      <Panel
        title={(
          <span className="flex items-center gap-2">
            <PackageSearch size={18} className="text-rose-600" />
            Repuestos con margen bajo
          </span>
        )}
        right={<span className="text-xs text-slate-500">Margen menor a {Math.round((data?.margenAlerta || 0.15) * 100)}% o vendidos bajo costo</span>}
      >
        {alertas.length ? (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Repuesto</th>
                  <th className="px-3 py-2 font-semibold">Servicio</th>
                  <th className="px-3 py-2 text-right font-semibold">Venta</th>
                  <th className="px-3 py-2 text-right font-semibold">Costo</th>
                  <th className="px-3 py-2 text-right font-semibold">Margen %</th>
                  <th className="py-2 pl-3 font-semibold">OT</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((row) => {
                  const margenPct = row.venta ? ((row.venta - row.costo) / row.venta) * 100 : null;
                  return (
                    <tr key={row.codigo} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-900">{row.descripcion}</p>
                        <p className="text-xs text-slate-400">{row.codigo}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">{row.servicio}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{money(row.venta)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{money(row.costo)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${toneMargen(margenPct)}`}>
                          {margenPct !== null && margenPct < 0 ? 'Bajo costo' : pct1(margenPct)}
                        </span>
                      </td>
                      <td className="py-2 pl-3 text-xs text-slate-500">{row.ultimas_ot}{row.ots > 3 ? ` (+${row.ots - 3})` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Ningún repuesto con margen bajo en el mes. 👍</p>
        )}
      </Panel>

      {/* Comentario del mes */}
      {totales && actual.venta > 0 && (
        <Panel title={`¿Cómo nos fue en ${nombreMes(month)}?`} right={<span className="text-xs text-slate-500">Resumen automático</span>}>
          <ul className="space-y-2.5">
            {comentarios.map((item) => {
              const { Icono, clase } = ESTILO_COMENTARIO[item.tono];
              return (
                <li key={item.texto} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                  <span className={`mt-0.5 shrink-0 rounded-md p-1 ${clase}`}><Icono size={14} /></span>
                  <span>{item.texto}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}

const ESTILO_COMENTARIO = {
  bien: { Icono: TrendingUp, clase: 'bg-emerald-50 text-emerald-700' },
  mal: { Icono: TrendingDown, clase: 'bg-rose-50 text-rose-700' },
  info: { Icono: Info, clase: 'bg-slate-100 text-slate-600' },
};

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function nombreMes(yyyymm, desplazamiento = 0) {
  const [anio, mes] = String(yyyymm).split('-').map(Number);
  const fecha = new Date(anio, mes - 1 + desplazamiento, 1);
  return `${MESES_LARGOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// Cambios menores al umbral no se pintan ni como buenos ni como malos.
const tonoCambio = (cambio, umbral) => {
  if (cambio === null || Math.abs(cambio) < umbral) return 'info';
  return cambio > 0 ? 'bien' : 'mal';
};

// Arma el comentario del mes con reglas simples sobre los mismos datos del
// panel; no inventa nada que no se vea en los cuadros de arriba.
function armarComentarios({ month, actual, anterior, totales, porServicio, porSede, porAsesor, alertas, estimado }) {
  const items = [];
  const mesAnterior = nombreMes(month, -1);
  const cambioVenta = anterior.venta ? ((actual.venta - anterior.venta) / anterior.venta) * 100 : null;

  items.push({
    tono: tonoCambio(cambioVenta, 1),
    texto: `Se vendieron ${money(actual.venta)} sin IGV en ${number.format(totales.ots)} OT facturadas`
      + (cambioVenta === null ? '.' : `, ${Math.abs(cambioVenta).toFixed(1)}% ${cambioVenta >= 0 ? 'más' : 'menos'} que en ${mesAnterior} (${money(anterior.venta)}).`),
  });

  if (actual.margenPct !== null) {
    const pp = anterior.margenPct !== null ? actual.margenPct - anterior.margenPct : null;
    items.push({
      tono: tonoCambio(pp, 0.5),
      texto: `El margen bruto fue ${money(actual.margen)} (${pct1(actual.margenPct)})`
        + (pp === null ? '.' : `, ${Math.abs(pp) < 0.05 ? 'igual que' : `${Math.abs(pp).toFixed(1)} puntos ${pp > 0 ? 'por encima de' : 'por debajo de'}`} ${mesAnterior}.`),
    });
  }

  if (actual.margen > 0) {
    items.push({
      tono: 'info',
      texto: `Del margen bruto, ${money(actual.rep.margen)} vinieron de repuestos (${pctDelTotal(actual.rep.margen, actual.margen)})`
        + ` y ${money(actual.mo.margen)} de mano de obra (${pctDelTotal(actual.mo.margen, actual.margen)}${estimado ? ', estimado' : ''}).`,
    });
  }

  if (actual.margenRepPct !== null) {
    const pp = anterior.margenRepPct !== null ? actual.margenRepPct - anterior.margenRepPct : null;
    items.push({
      tono: tonoCambio(pp, 0.5),
      texto: `Los repuestos dejaron ${pct1(actual.margenRepPct)} de margen`
        + (pp === null ? '' : ` (${pct1(anterior.margenRepPct)} en ${mesAnterior})`)
        + (actual.margenMoPct !== null
          ? `; la mano de obra, ${pct1(actual.margenMoPct)}${estimado ? ' estimado' : ', pero sin costo del técnico no es un dato real'}.`
          : '.'),
    });
  }

  const principal = porServicio[0];
  if (principal) {
    items.push({
      tono: 'info',
      texto: `${principal.nombre} fue el servicio con más venta: ${money(principal.venta)} (${((principal.venta / actual.venta) * 100).toFixed(0)}% del mes).`,
    });
  }
  const conRepuestos = porServicio.filter((row) => row.rep.venta >= 1000 && row.margenRepPct !== null);
  if (conRepuestos.length > 1) {
    const peor = conRepuestos.reduce((a, b) => (b.margenRepPct < a.margenRepPct ? b : a));
    const mejor = conRepuestos.reduce((a, b) => (b.margenRepPct > a.margenRepPct ? b : a));
    items.push({
      tono: peor.margenRepPct < 40 ? 'mal' : 'info',
      texto: `En repuestos, ${mejor.nombre.toLowerCase()} tuvo el mejor margen (${pct1(mejor.margenRepPct)}) y ${peor.nombre.toLowerCase()} el más bajo (${pct1(peor.margenRepPct)}).`,
    });
  }

  if (porSede.length > 1) {
    items.push({
      tono: 'info',
      texto: `Por sede: ${porSede.map((row) => `${row.nombre.replace('Pineda ', '')} vendió ${money(row.venta)} con ${pct1(row.margenRepPct)} de margen en repuestos`).join('; ')}.`,
    });
  }

  if (porAsesor[0] && porAsesor[0].nombre !== 'Sin asesor') {
    items.push({
      tono: 'info',
      texto: `${porAsesor[0].nombre} fue quien más vendió: ${money(porAsesor[0].venta)} en ${number.format(porAsesor[0].ots)} OT.`,
    });
  }

  const bajoCosto = alertas.filter((row) => row.costo > row.venta);
  if (!alertas.length) {
    items.push({ tono: 'bien', texto: 'Ningún repuesto se vendió con margen menor al 15%.' });
  } else {
    const critico = alertas[0];
    items.push({
      tono: 'mal',
      texto: `${alertas.length} repuesto${alertas.length > 1 ? 's' : ''} con margen bajo`
        + (bajoCosto.length ? ` (${bajoCosto.length} vendido${bajoCosto.length > 1 ? 's' : ''} bajo costo)` : '')
        + `; el más crítico es ${critico.descripcion} en la OT ${String(critico.ultimas_ot).split(',')[0]}. Revisar precio de lista o descuento.`,
    });
  }

  return items;
}

// Grupo (servicio o sede) con una barra para repuestos y otra para mano de
// obra: no se combinan porque el costo de repuestos es real y el de mano de
// obra es estimado. Largo de la barra = margen %.
function BarraMargen({ row, estimado }) {
  const lineas = [
    { etiqueta: 'Repuestos', ...row.rep, margenPct: row.margenRepPct },
    { etiqueta: estimado ? 'Mano de obra (est.)' : 'Mano de obra', ...row.mo, margenPct: row.margenMoPct },
  ].filter((linea) => linea.venta > 0);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{row.nombre}</span>
        <span className="text-xs text-slate-500">
          venta {money(row.venta)} · <span className="font-semibold text-slate-700">margen {money(row.margen)}</span>
        </span>
      </div>
      <div className="space-y-1.5">
        {lineas.map((linea) => (
          <div key={linea.etiqueta} className="flex items-center gap-2 text-xs">
            <span className="w-32 shrink-0 text-slate-500">{linea.etiqueta}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${linea.margenPct >= 50 ? 'bg-emerald-500' : linea.margenPct >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(4, Math.min(100, linea.margenPct ?? 0))}%` }}
              />
            </div>
            <span className="hidden w-36 shrink-0 text-right text-slate-500 sm:inline">
              {money(linea.venta)} · {money(linea.margen)}
            </span>
            <span className={`w-14 shrink-0 rounded-full px-1.5 py-0.5 text-center font-semibold ${toneMargen(linea.margenPct)}`}>{pct1(linea.margenPct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
