import React, { useMemo } from 'react';
import { money, number } from '../../utils/formatters';

// Seguimiento diario de quien emite los comprobantes.
//
// Es otra pregunta que la del avance por asesor: ahi se mide quien ATIENDE la
// OT, aqui quien la FACTURA. En Trujillo factura Kassandra y en Lima Tania, asi
// que esta tabla sirve para ver su ritmo dia a dia y sobre cuantas OT.
//
// Las OT se cuentan desde la operacion relacionada del propio comprobante, no
// desde el total de la sede: son las que esa persona efectivamente facturo.

const fechaCorta = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}`;
};

export default function EmisorDiario({ filas }) {
  const { dias, personas, totales } = useMemo(() => {
    const porDia = new Map();
    const porPersona = new Map();

    filas.forEach((fila) => {
      const clave = `${fila.asesor}||${fila.local_nombre}`;
      const dia = String(fila.fecha);
      if (!porDia.has(dia)) porDia.set(dia, new Map());
      porDia.get(dia).set(clave, {
        monto: Number(fila.sin_igv || 0),
        ots: Number(fila.ots || 0),
      });
      if (!porPersona.has(clave)) {
        porPersona.set(clave, {
          clave,
          asesor: fila.asesor,
          local: fila.local_nombre,
          monto: 0,
          ots: 0,
          dias: 0,
        });
      }
      const acumulado = porPersona.get(clave);
      acumulado.monto += Number(fila.sin_igv || 0);
      acumulado.ots += Number(fila.ots || 0);
      acumulado.dias += 1;
    });

    return {
      dias: [...porDia.entries()].sort((a, b) => a[0].localeCompare(b[0])),
      // Mas facturacion primero: es el orden en que se quiere leer.
      personas: [...porPersona.values()].sort((a, b) => b.monto - a.monto),
      totales: porPersona,
    };
  }, [filas]);

  if (!filas.length) return null;

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Seguimiento diario</h3>
        <span className="text-xs text-slate-500">Facturación y OT por día</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 font-semibold">Día</th>
              {personas.map((persona) => (
                <th key={persona.clave} className="px-2 py-2 text-right font-semibold">
                  <span className="block text-slate-700">{persona.asesor}</span>
                  <span className="block font-normal normal-case text-slate-400">{persona.local}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dias.map(([dia, porPersona]) => (
              <tr key={dia} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 font-medium text-slate-700">{fechaCorta(dia)}</td>
                {personas.map((persona) => {
                  const celda = porPersona.get(persona.clave);
                  return (
                    <td key={persona.clave} className="px-2 py-2 text-right">
                      {celda ? (
                        <>
                          <span className="block tabular-nums font-medium text-slate-900">
                            {money(celda.monto)}
                          </span>
                          <span className="block text-[11px] tabular-nums text-slate-500">
                            {number.format(celda.ots)} {celda.ots === 1 ? 'OT' : 'OT'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="py-2 pr-3 text-xs font-bold uppercase text-slate-600">Total</td>
              {personas.map((persona) => {
                const fila = totales.get(persona.clave);
                return (
                  <td key={persona.clave} className="px-2 py-2 text-right">
                    <span className="block tabular-nums font-bold text-slate-900">{money(fila.monto)}</span>
                    <span className="block text-[11px] tabular-nums text-slate-500">
                      {number.format(fila.ots)} OT · {fila.dias} {fila.dias === 1 ? 'día' : 'días'}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="py-1.5 pr-3 text-[11px] text-slate-500">Promedio por día</td>
              {personas.map((persona) => {
                const fila = totales.get(persona.clave);
                return (
                  <td key={persona.clave} className="px-2 py-1.5 text-right text-[11px] tabular-nums text-slate-600">
                    {money(fila.dias ? fila.monto / fila.dias : 0)}
                    <span className="text-slate-400">
                      {' · '}
                      {fila.dias ? (fila.ots / fila.dias).toFixed(1) : '0'} OT
                    </span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
