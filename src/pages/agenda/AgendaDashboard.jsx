import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CalendarCheck, Phone, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { Card, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import { fecha, fechaHora, km, texto } from '../seguimiento/seguimientoLabels';

// Una cita de taller no se agenda al minuto: se bloquea una hora.
const DURACION_CITA_MIN = 60;

// El color no depende solo de si es cita o recordatorio, sino de como quedo.
// Lo que de verdad importa ver de un vistazo es la cita vencida que nadie
// atendio: el cliente no vino y nadie se entero.
const SITUACIONES = Object.freeze({
  citaPendiente: { label: 'Cita por atender', fondo: '#059669', texto: '#ffffff' },
  citaNoVino: { label: 'Cita vencida sin atender', fondo: '#dc2626', texto: '#ffffff' },
  citaCumplida: { label: 'Cita atendida', fondo: '#d1fae5', texto: '#065f46' },
  citaDescartada: { label: 'Descartada', fondo: '#e2e8f0', texto: '#475569' },
  recontacto: { label: 'Volver a llamar', fondo: '#94a3b8', texto: '#ffffff' },
  recontactoVencido: { label: 'Llamada atrasada', fondo: '#f59e0b', texto: '#ffffff' },
});

function inicioDeHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

/** En que situacion esta el compromiso, que es lo que decide su color. */
function situacionDe(evento, hoy) {
  const cumplida = evento.estadoErp === 'ATENDIDO' || evento.sgEstado === 'ATENDIDO';
  const cuando = new Date(evento.cuando);

  if (evento.tipo === 'recontacto') {
    if (cumplida || evento.sgEstado === 'NO_DESEA') return 'citaDescartada';
    return cuando < hoy ? 'recontactoVencido' : 'recontacto';
  }
  if (evento.sgEstado === 'NO_DESEA') return 'citaDescartada';
  if (cumplida) return 'citaCumplida';
  // Para la cita se compara el instante: una cita de hoy a las 3 p. m. no esta
  // vencida a las 9 a. m.
  return cuando < new Date() ? 'citaNoVino' : 'citaPendiente';
}

function Detalle({ evento, onCerrar }) {
  if (!evento) return null;
  const esCita = evento.tipo === 'cita';
  const situacion = SITUACIONES[situacionDe(evento, inicioDeHoy())];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cerrar" className="flex-1 cursor-default" onClick={onCerrar} />
      <aside className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-slate-900">{evento.placa}</p>
            <p className="truncate text-sm text-slate-500">
              {texto(evento.marca)} {texto(evento.modelo)}
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
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: situacion.fondo, color: situacion.texto }}
          >
            {situacion.label}
          </span>

          {/* El recordatorio solo tiene dia: mostrarle una hora seria inventarla. */}
          <p className="text-sm font-semibold text-slate-800">
            {esCita ? fechaHora(evento.cuando) : fecha(evento.cuando)}
          </p>

          <dl className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Cliente</dt>
              <dd className="text-right font-medium text-slate-700">{texto(evento.cliente)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Contacto</dt>
              <dd className="text-right font-medium text-slate-700">{texto(evento.contacto)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Teléfono</dt>
              <dd className="text-right font-medium text-slate-700">
                {evento.telefono ? (
                  <a className="inline-flex items-center gap-1 text-slate-700 hover:underline" href={`tel:${evento.telefono}`}>
                    <Phone size={12} />
                    {evento.telefono}
                  </a>
                ) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Servicio</dt>
              <dd className="text-right font-medium text-slate-700">{km(evento.servicioKm)}</dd>
            </div>
          </dl>

          <p className="text-[11px] text-slate-400">
            La gestión de esta ficha se edita en el módulo Seguimientos.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function AgendaDashboard({ filters }) {
  const { eventos, asesora, loading, error, cambiarRango, load } = filters;
  const [abierto, setAbierto] = useState(null);

  const { eventosCalendario, conteo } = useMemo(() => {
    const hoy = inicioDeHoy();
    const acumulado = {};

    const calendario = eventos.map((evento, indice) => {
      const clave = situacionDe(evento, hoy);
      acumulado[clave] = (acumulado[clave] ?? 0) + 1;

      const situacion = SITUACIONES[clave];
      const inicio = new Date(evento.cuando);
      const esCita = evento.tipo === 'cita';

      return {
        id: `${evento.tipo}-${evento.id}-${indice}`,
        title: `${evento.placa} · ${evento.cliente ?? ''}`.trim(),
        start: inicio,
        // El recordatorio va como evento de dia completo: solo se acordo el dia.
        end: esCita ? new Date(inicio.getTime() + DURACION_CITA_MIN * 60000) : undefined,
        allDay: !esCita,
        backgroundColor: situacion.fondo,
        borderColor: situacion.fondo,
        textColor: situacion.texto,
        extendedProps: { ...evento, situacion: clave },
      };
    });

    return { eventosCalendario: calendario, conteo: acumulado };
  }, [eventos]);

  const porAtender = (conteo.citaPendiente ?? 0);
  const noVino = (conteo.citaNoVino ?? 0);
  const atendidas = (conteo.citaCumplida ?? 0);
  const llamadas = (conteo.recontacto ?? 0) + (conteo.recontactoVencido ?? 0);

  return (
    <div
      className={`mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${
        filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}
    >
      <LoadingOverlay show={loading} label="Cargando agenda..." />

      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            {asesora || 'Todas las carteras'}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Agenda</h1>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg bg-white text-red-800 hover:bg-red-50"
          onClick={load}
          title="Actualizar"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Citas por atender" value={porAtender} icon={CalendarCheck} tone="green"
          hint="El cliente aún no llega" />
        <Card label="No vinieron" value={noVino} icon={TriangleAlert} tone="rose"
          hint="Pasó la cita sin atender" />
        <Card label="Citas atendidas" value={atendidas} icon={CalendarCheck} tone="blue"
          hint="El cliente sí llegó" />
        <Card label="Llamadas pendientes" value={llamadas} icon={Phone} tone="amber"
          hint="Recordatorios de la asesora" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          {Object.entries(SITUACIONES).map(([clave, situacion]) => (
            <span key={clave} className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded border border-slate-300"
                style={{ backgroundColor: situacion.fondo }}
              />
              {situacion.label}
            </span>
          ))}
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
          events={eventosCalendario}
          // FullCalendar avisa aqui el rango visible: es lo que dispara la carga.
          datesSet={(info) => cambiarRango(
            info.startStr.slice(0, 10),
            info.endStr.slice(0, 10),
          )}
          eventClick={(info) => setAbierto(info.event.extendedProps)}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          nowIndicator
          dayMaxEvents={3}
        />
      </section>

      <Detalle evento={abierto} onCerrar={() => setAbierto(null)} />
    </div>
  );
}
