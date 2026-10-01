import React, { useEffect, useState } from 'react';
import { MessageCircle, Phone, Save, TriangleAlert, X } from 'lucide-react';
import {
  colorEstado, estadoEfectivo, etiquetaEstado, fecha, fechaHora, fechaHoraInput,
  fechaInput, km, texto,
} from './seguimientoLabels';
import { enlaceWhatsApp } from './whatsapp';
import { esTelefonoInvalido, motivoTelefonoInvalido } from './telefonos';

// Panel lateral para registrar la llamada: estado, cuando volver a llamar y que
// paso. Es lo unico que la asesora puede escribir; el resto de la ficha lo trae
// el ERP y se muestra como referencia.
// Linea de tiempo: cada vez que se registro una gestion sobre esta ficha, de lo
// mas reciente a lo mas antiguo. Es lo que permite reconstruir como quedo la
// cita cuando el cliente vuelve a llamar.
function Historial({ historial, estados }) {
  if (!historial) return null;

  if (historial.cargando) {
    return <p className="text-xs text-slate-400">Cargando historial…</p>;
  }
  if (!historial.eventos.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
        Todavía no se registró ninguna gestión en esta ficha.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {historial.eventos.map((evento) => {
        const color = colorEstado(evento.estado);
        return (
          <li key={evento.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color.fg }} />
            <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: color.bg, color: color.fg }}
                >
                  {etiquetaEstado(estados, evento.estado)}
                </span>
                {evento.estadoAnterior ? (
                  <span className="text-[11px] text-slate-400">
                    antes: {etiquetaEstado(estados, evento.estadoAnterior)}
                  </span>
                ) : null}
              </div>
              {evento.nota ? (
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-600">
                  {evento.nota}
                </p>
              ) : null}
              {evento.citaEn ? (
                <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                  Cita acordada: {fechaHora(evento.citaEn)}
                </p>
              ) : null}
              {evento.proximoContacto ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Quedó en volver a llamar el {fecha(evento.proximoContacto)}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-slate-400">
                {fechaHora(evento.fecha)}{evento.autor ? ` · ${evento.autor}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function PanelGestion({
  fila, estados, asesora, historial, guardando, onCerrar, onGuardar,
}) {
  const [sgEstado, setSgEstado] = useState('PENDIENTE');
  const [sgProximoContacto, setSgProximoContacto] = useState('');
  const [sgNota, setSgNota] = useState('');
  const [sgCitaEn, setSgCitaEn] = useState('');

  // Al cambiar de ficha se recarga el formulario con lo ya registrado, para que
  // la asesora corrija sobre lo anterior en vez de empezar de cero.
  useEffect(() => {
    if (!fila) return;
    setSgEstado(estadoEfectivo(fila));
    setSgProximoContacto(fechaInput(fila.sgProximoContacto));
    setSgNota(fila.sgNota ?? '');
    setSgCitaEn(fechaHoraInput(fila.sgCitaEn));
  }, [fila]);

  if (!fila) return null;

  const cerradoEnErp = fila.estadoErp === 'ATENDIDO';
  const color = colorEstado(sgEstado);
  // null cuando el telefono es fijo: a esos no se les puede escribir.
  const whatsapp = enlaceWhatsApp(fila, asesora);
  const telMalo = esTelefonoInvalido(fila.telefono);

  const enviar = async (event) => {
    event.preventDefault();
    // Al guardar se cierra el panel y la fila de la tabla queda actualizada en
    // el acto: la asesora pasa al siguiente cliente sin recargar la pagina.
    const ok = await onGuardar(fila.id, { sgEstado, sgNota, sgProximoContacto, sgCitaEn });
    if (ok) onCerrar();
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true">
      {/* Clic fuera del panel = cerrar, igual que en el resto del dashboard. */}
      <button type="button" aria-label="Cerrar" className="flex-1 cursor-default" onClick={onCerrar} />

      <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-slate-900">{fila.placa}</p>
            <p className="truncate text-sm text-slate-500">
              {texto(fila.marca)} {texto(fila.modelo)}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onCerrar}
          >
            <X size={18} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {/* -------------------------------------------- ficha del ERP */}
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">{texto(fila.cliente)}</p>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Contacto</dt>
                <dd className="text-right font-medium text-slate-700">{texto(fila.contacto)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Teléfono</dt>
                <dd className="text-right font-medium text-slate-700">
                  {telMalo ? (
                    <span
                      className="inline-flex items-center gap-1 font-semibold text-rose-700"
                      title={motivoTelefonoInvalido(fila.telefono)}
                    >
                      <TriangleAlert size={12} />
                      {texto(fila.telefono)}
                    </span>
                  ) : fila.telefono ? (
                    <a className="inline-flex items-center gap-1 text-slate-700 hover:underline" href={`tel:${fila.telefono}`}>
                      <Phone size={12} />
                      {fila.telefono}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Último servicio</dt>
                <dd className="text-right font-medium text-slate-700">{fecha(fila.fecUltimoServicio)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Servicio propuesto</dt>
                <dd className="text-right font-medium text-slate-700">
                  {km(fila.servicioKm)} · {fecha(fila.fecServicioPropuesto)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Último asesor</dt>
                <dd className="text-right font-medium text-slate-700">{texto(fila.ultimoAsesor)}</dd>
              </div>
            </dl>
            {fila.recomendacion ? (
              <p className="mt-3 break-words border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">Recomendación: </span>
                {fila.recomendacion}
              </p>
            ) : null}
          </section>

          {/* Abrir WhatsApp deja el estado en Contactado para que, al guardar,
              quede el registro del intento. No pisa un estado mas avanzado. */}
          {whatsapp && !cerradoEnErp ? (
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSgEstado((actual) => (actual === 'PENDIENTE' ? 'CONTACTADO' : actual))}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle size={16} />
              Escribir por WhatsApp
            </a>
          ) : null}

          {whatsapp?.prueba ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Modo prueba:</span> el mensaje se abrirá
              hacia el número de pruebas, no hacia el cliente
              (su número real es +{whatsapp.destinoReal}).
            </p>
          ) : null}

          {telMalo ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              <span className="font-semibold">Teléfono inválido:</span>{' '}
              {motivoTelefonoInvalido(fila.telefono)} No se puede llamar ni escribir
              a este cliente hasta corregirlo.
            </p>
          ) : null}

          {/* ----------------------------------------- gestión editable */}
          <form className="space-y-4" onSubmit={enviar}>
            <fieldset disabled={cerradoEnErp} className="space-y-4 disabled:opacity-60">
              <label className="block text-xs font-medium text-slate-500">
                Estado del contacto
                <select
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold"
                  style={{ backgroundColor: color.bg, color: color.fg }}
                  value={sgEstado}
                  onChange={(event) => setSgEstado(event.target.value)}
                >
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.id}>{estado.label}</option>
                  ))}
                </select>
              </label>

              {sgEstado === 'AGENDADO' ? (
                <label className="block text-xs font-medium text-slate-500">
                  Fecha y hora de la cita
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 h-10 w-full rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-900"
                    value={sgCitaEn}
                    onChange={(event) => setSgCitaEn(event.target.value)}
                  />
                  <span className="mt-1 block font-normal text-[11px] text-slate-400">
                    Aparecerá en el calendario del módulo Agenda.
                  </span>
                </label>
              ) : null}

              <label className="block text-xs font-medium text-slate-500">
                Volver a llamar el
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900"
                  value={sgProximoContacto}
                  onChange={(event) => setSgProximoContacto(event.target.value)}
                />
              </label>

              <label className="block text-xs font-medium text-slate-500">
                Qué pasó en la llamada
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  placeholder="Ej.: coordinó traer la unidad el viernes 10 a las 9 a. m."
                  value={sgNota}
                  onChange={(event) => setSgNota(event.target.value)}
                />
              </label>
            </fieldset>

            {fila.sgActualizadoPor ? (
              <p className="text-[11px] text-slate-400">
                Última gestión: {fila.sgActualizadoPor} · {fecha(fila.sgActualizadoEn)}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={cerradoEnErp || guardando === fila.id}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-red-700 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={16} />
                {guardando === fila.id ? 'Guardando…' : 'Guardar gestión'}
              </button>
              <button
                type="button"
                className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={onCerrar}
              >
                Cerrar
              </button>
            </div>
          </form>

          <section className="border-t border-slate-200 pt-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Historial de gestiones
            </h2>
            <Historial historial={historial} estados={estados} />
          </section>
        </div>
      </aside>
    </div>
  );
}
