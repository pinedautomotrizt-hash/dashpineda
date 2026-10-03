import React, { useMemo, useState } from 'react';
import { Car, Search, TrendingDown, TrendingUp } from 'lucide-react';
import RepuestoIcono from './RepuestoIcono';
import { kmText, zonaColor } from './kpiLabels';

// Vida util por modelo de vehiculo.
//
// La pregunta de un dueno de flota no es "cuanto dura una pastilla" sino
// "cuanto me dura en las unidades que tengo". Por eso se elige un modelo y se
// ve su ficha, en vez de una matriz donde hay que buscar la celda: cada pieza
// se compara contra el total de la flota, que es lo que dice si ese modelo
// rinde mejor o peor que el resto.

// Diferencia porcentual contra la referencia general. Debajo de este umbral se
// considera que el modelo se comporta como el promedio y no se marca nada: un
// 4% arriba o abajo con estas muestras no significa nada.
const UMBRAL_DIFERENCIA = 10;

function comparar(valorModelo, valorGeneral) {
  if (!valorModelo || !valorGeneral) return null;
  const diferencia = Math.round(((valorModelo - valorGeneral) / valorGeneral) * 100);
  if (Math.abs(diferencia) < UMBRAL_DIFERENCIA) return { diferencia, tono: 'igual' };
  return { diferencia, tono: diferencia > 0 ? 'mejor' : 'peor' };
}

function FichaRepuesto({ repuesto, dato, general }) {
  const color = zonaColor(repuesto.zona);
  const contraste = comparar(dato.kmMediana, general?.km?.kmMediana);
  const esProgramado = repuesto.naturaleza === 'programado';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-md p-1" style={{ backgroundColor: `${color}12` }}>
          <RepuestoIcono id={repuesto.id} color={color} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700">{repuesto.label}</p>
          <p className={`mt-0.5 text-lg font-bold tracking-tight ${dato.confiable ? 'text-slate-950' : 'text-slate-400'}`}>
            {kmText(dato.kmMediana)}
          </p>
        </div>
      </div>

      <dl className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
        <div className="flex gap-1">
          <dt className="text-slate-500">B10</dt>
          <dd className="font-medium text-slate-700">{dato.kmB10 ? `${Math.round(dato.kmB10 / 1000)}k` : '—'}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-slate-500">{esProgramado ? 'cambios' : 'fallas'}</dt>
          <dd className={`font-medium ${dato.confiable ? 'text-slate-700' : 'text-amber-600'}`}>{dato.n}</dd>
        </div>
      </dl>

      {/* Lo que de verdad se quiere saber: si este modelo rinde distinto. */}
      {contraste && contraste.tono !== 'igual' ? (
        <p
          className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${
            contraste.tono === 'mejor' ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {contraste.tono === 'mejor' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {contraste.diferencia > 0 ? '+' : ''}{contraste.diferencia}% vs. toda la flota
        </p>
      ) : null}
    </div>
  );
}

export default function ModelosPanel({ filas, repuestos, muestraMinima }) {
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState(null);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toUpperCase();
    if (!texto) return filas;
    return filas.filter((fila) => `${fila.marca} ${fila.modelo}`.toUpperCase().includes(texto));
  }, [filas, busqueda]);

  // Si no hay eleccion previa, se abre el modelo con mas unidades: es el que
  // mas le importa a quien entra.
  const clave = (fila) => `${fila.marca}||${fila.modelo}`;
  const modelo = visibles.find((fila) => clave(fila) === elegido) || visibles[0] || null;

  const porId = Object.fromEntries(repuestos.map((fila) => [fila.id, fila]));

  if (!filas.length) {
    return <p className="py-10 text-center text-sm text-slate-500">—</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* ------------------------------------------------ selector de modelo */}
      <div className="min-w-0">
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-950"
            placeholder="Buscar modelo"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </label>

        <div className="mt-2 max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {visibles.map((fila) => {
            const activo = modelo && clave(fila) === clave(modelo);
            return (
              <button
                key={clave(fila)}
                type="button"
                onClick={() => setElegido(clave(fila))}
                className={`flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition ${
                  activo
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-slate-800">{fila.marca}</span>
                  <span className="block truncate text-[11px] text-slate-500">{fila.modelo}</span>
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">{fila.placas}</span>
              </button>
            );
          })}
          {!visibles.length ? (
            <p className="px-3 py-6 text-center text-xs text-slate-500">Sin coincidencias.</p>
          ) : null}
        </div>
      </div>

      {/* --------------------------------------------- ficha del modelo */}
      {modelo ? (
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
                <Car size={18} className="shrink-0 text-slate-400" />
                <span className="truncate">{modelo.marca} {modelo.modelo}</span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {modelo.placas} {modelo.placas === 1 ? 'unidad atendida' : 'unidades atendidas'}
                {' · '}
                {modelo.medidas} {modelo.medidas === 1 ? 'repuesto medido' : 'repuestos medidos'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {repuestos
              .filter((repuesto) => modelo.piezas[repuesto.id]?.kmMediana)
              .map((repuesto) => (
                <FichaRepuesto
                  key={repuesto.id}
                  repuesto={porId[repuesto.id]}
                  dato={modelo.piezas[repuesto.id]}
                  general={repuesto}
                />
              ))}
          </div>

          {!modelo.medidas ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Este modelo todavía no tiene repuestos con mediciones.
            </p>
          ) : (
            <p className="mt-3 text-[11px] leading-snug text-slate-500">
              En gris, los repuestos con menos de {muestraMinima} registros en este modelo:
              la cifra existe pero aún puede moverse. El porcentaje compara contra el total
              de la flota con los filtros activos.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
