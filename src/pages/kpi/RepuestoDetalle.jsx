import React from 'react';
import ReactECharts from 'echarts-for-react';
import { AlertTriangle, X } from 'lucide-react';
import { Panel } from '../../components/dashboard/DashboardPrimitives';
import { number } from '../../utils/formatters';
import RepuestoIcono from './RepuestoIcono';
import { estadoMuestra, kmText, vidaText, zonaColor, zonaLabel } from './kpiLabels';

function Metrica({ label, valor, ayuda, destacado = false }) {
  return (
    <div className={`rounded-lg border p-3 ${destacado ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 font-bold tracking-tight ${destacado ? 'text-xl text-slate-950' : 'text-lg text-slate-800'}`}>
        {valor}
      </p>
      {ayuda && <p className="mt-1 text-[11px] leading-snug text-slate-500">{ayuda}</p>}
    </div>
  );
}

function TablaSimple({ columnas, filas, vacio }) {
  if (!filas.length) {
    return <p className="py-6 text-center text-sm text-slate-500">{vacio}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            {columnas.map((col) => (
              <th key={col.key} className={`py-2 pr-3 font-semibold ${col.align === 'right' ? 'text-right' : ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, indice) => (
            <tr key={fila.key ?? indice} className="border-b border-slate-100 last:border-0">
              {columnas.map((col) => (
                <td
                  key={col.key}
                  className={`py-2 pr-3 ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.className || 'text-slate-700'}`}
                >
                  {col.render ? col.render(fila) : fila[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RepuestoDetalle({ detalle, cargando, onCerrar }) {
  if (cargando) {
    return (
      <Panel title="Detalle del repuesto">
        <p className="py-10 text-center text-sm text-slate-500">Cargando detalle…</p>
      </Panel>
    );
  }
  if (!detalle) return null;

  const { repuesto, resumen, porModelo, porVariante, histograma, codigos, descartados, limites } = detalle;
  const color = zonaColor(repuesto.zona);
  const estado = estadoMuestra(resumen, limites.muestraMinima);

  // Escalonada: la supervivencia se mantiene constante entre falla y falla.
  const curvaOption = {
    grid: { left: 48, right: 16, top: 16, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      formatter: (puntos) => {
        const p = puntos[0];
        return `${number.format(p.value[0])} km<br/><b>${p.value[1]}%</b> siguen en servicio`;
      },
    },
    xAxis: {
      type: 'value',
      name: 'km',
      nameLocation: 'middle',
      nameGap: 24,
      axisLabel: { formatter: (v) => `${Math.round(v / 1000)}k` },
    },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'line',
      step: 'end',
      showSymbol: false,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.08 },
      data: (resumen.km?.curva ?? []).map((p) => [p.km, Number((p.s * 100).toFixed(1))]),
      markLine: {
        silent: true,
        symbol: 'none',
        label: { formatter: (p) => (p.value === 90 ? 'B10' : 'Mediana'), fontSize: 10 },
        lineStyle: { type: 'dashed', color: '#94a3b8' },
        data: [{ yAxis: 90 }, { yAxis: 50 }],
      },
    }],
  };

  const histogramaOption = {
    grid: { left: 48, right: 16, top: 24, bottom: 48 },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const punto = params[0];
        return `${punto.name}<br/>${punto.value} ${punto.value === 1 ? 'vehículo' : 'vehículos'}`;
      },
    },
    xAxis: {
      type: 'category',
      data: histograma.map((tramo) => `${Math.round(tramo.desde / 1000)}–${Math.round(tramo.hasta / 1000)}k`),
      axisLabel: { fontSize: 10, rotate: histograma.length > 10 ? 40 : 0 },
      name: 'km recorridos',
      nameLocation: 'middle',
      nameGap: 34,
      nameTextStyle: { fontSize: 11, color: '#64748b' },
    },
    yAxis: { type: 'value', minInterval: 1, name: 'vehículos', nameTextStyle: { fontSize: 11, color: '#64748b' } },
    series: [{
      type: 'bar',
      data: histograma.map((tramo) => tramo.cantidad),
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 46,
    }],
  };

  return (
    <div className="space-y-4">
      <Panel
        title={(
          <span className="flex items-center gap-3">
            <RepuestoIcono id={repuesto.id} color={color} size={30} />
            {repuesto.label}
          </span>
        )}
        right={(
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}1a`, color }}>
              {zonaLabel(repuesto.zona)}
            </span>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              aria-label="Cerrar detalle"
            >
              <X size={16} />
            </button>
          </div>
        )}
      >
        <div className={`mb-4 flex items-start gap-2 rounded-md px-3 py-2 text-xs ${estado.chip}`}>
          {estado.id !== 'confiable' && <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
          <span><strong>{estado.label}.</strong> {estado.detalle}</span>
        </div>

        {/* Las dos primeras salen de Kaplan-Meier, que usa tambien las piezas
            que todavia no fallaron. El promedio queda como referencia. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            label="Vida B10"
            valor={vidaText(resumen.km?.kmB10, resumen.km?.curva)}
            ayuda="Ya falló el 10%"
            destacado
          />
          <Metrica
            label="Mediana de vida"
            valor={vidaText(resumen.km?.kmMediana, resumen.km?.curva)}
            ayuda="Ya falló la mitad"
          />
          <Metrica
            label="Observaciones"
            valor={`${resumen.km?.nFallas ?? 0} + ${resumen.km?.nCensurados ?? 0}`}
            ayuda="fallas + aún en servicio"
          />
          <Metrica
            label="Promedio entre cambios"
            valor={kmText(resumen.mttf)}
            ayuda={resumen.min ? `${kmText(resumen.min)} a ${kmText(resumen.max)}` : null}
          />
        </div>

      </Panel>

      {/* La curva responde "que probabilidad hay de que la pieza siga viva a
          X km". Baja solo cuando hay una falla; los tramos planos son piezas
          que salieron del seguimiento sin fallar. */}
      {resumen.km?.curva?.length > 1 ? (
        <Panel title="Curva de supervivencia">
          <ReactECharts option={curvaOption} style={{ height: 280 }} notMerge />
          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            Calculada con {resumen.km.nFallas} fallas y {resumen.km.nCensurados} piezas
            que aún no fallaron. Las líneas marcan el 10% y el 50% de fallas acumuladas.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cómo se reparte la duración">
          {histograma.length ? (
            <ReactECharts option={histogramaOption} style={{ height: 260 }} notMerge />
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">—</p>
          )}
        </Panel>

        <Panel title="Por marca y modelo">
          <TablaSimple
            vacio="—"
            columnas={[
              { key: 'modelo', label: 'Vehículo', render: (f) => `${f.marca} ${f.modelo}`, className: 'font-medium text-slate-800' },
              { key: 'n', label: 'Mediciones', align: 'right' },
              { key: 'mttf', label: 'Media', align: 'right', render: (f) => kmText(f.mttf) },
              { key: 'b10', label: 'B10', align: 'right', render: (f) => kmText(f.b10) },
            ]}
            filas={porModelo.slice(0, 12).map((f) => ({ ...f, key: `${f.marca}-${f.modelo}` }))}
          />
        </Panel>
      </div>

      {porVariante.length > 1 && (
        <Panel title="Delantero vs. posterior">
          <TablaSimple
            vacio="—"
            columnas={[
              { key: 'variante', label: 'Eje', className: 'font-medium text-slate-800' },
              { key: 'n', label: 'Mediciones', align: 'right' },
              { key: 'mttf', label: 'Media', align: 'right', render: (f) => kmText(f.mttf) },
              { key: 'mediana', label: 'Mediana', align: 'right', render: (f) => kmText(f.mediana) },
              { key: 'b10', label: 'B10', align: 'right', render: (f) => kmText(f.b10) },
            ]}
            filas={porVariante.map((f) => ({ ...f, key: f.variante }))}
          />
        </Panel>
      )}

      <Panel
        title="Códigos usados para esta pieza"
        right={<span className="text-xs text-slate-500">{codigos.length} códigos distintos</span>}
      >
        <TablaSimple
          vacio="—"
          columnas={[
            { key: 'codigo', label: 'Código', className: 'font-mono text-xs font-semibold text-slate-900' },
            { key: 'descripcion', label: 'Descripción', className: 'text-slate-600' },
            { key: 'veces', label: 'Veces instalado', align: 'right' },
            {
              key: 'importe',
              label: 'Facturado',
              align: 'right',
              render: (f) => `S/ ${number.format(Math.round(f.importe))}`,
            },
          ]}
          filas={codigos.slice(0, 20).map((f) => ({ ...f, key: f.codigo }))}
        />
      </Panel>

      {descartados.length > 0 && (
        <Panel
          title="Intervalos descartados"
          right={<span className="text-xs text-amber-700">{descartados.length} casos</span>}
        >
          <TablaSimple
            vacio=""
            columnas={[
              { key: 'placa', label: 'Placa', className: 'font-mono text-xs font-semibold text-slate-900' },
              { key: 'kmInicio', label: 'Km inicial', align: 'right', render: (f) => number.format(f.kmInicio || 0) },
              { key: 'kmFin', label: 'Km final', align: 'right', render: (f) => number.format(f.kmFin || 0) },
              { key: 'motivo', label: 'Motivo', className: 'text-amber-700' },
            ]}
            filas={descartados.slice(0, 15).map((f, i) => ({ ...f, key: `${f.placa}-${i}` }))}
          />
        </Panel>
      )}
    </div>
  );
}
