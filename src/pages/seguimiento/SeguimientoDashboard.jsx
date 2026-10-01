import React, { useState } from 'react';
import {
  CalendarClock, CircleAlert, ClipboardList, MessageCircle, Phone, RefreshCw,
  Search, StickyNote, TriangleAlert,
} from 'lucide-react';
import { Card, LoadingOverlay } from '../../components/dashboard/DashboardPrimitives';
import PanelGestion from './PanelGestion';
import {
  BANDEJAS, colorBandeja, colorEstado, diasRestantes, estadoEfectivo,
  etiquetaEstado, fecha, km, texto, textoDias,
} from './seguimientoLabels';
import { WHATSAPP_NUMERO_PRUEBA, enlaceWhatsApp } from './whatsapp';
import { esTelefonoInvalido, motivoTelefonoInvalido } from './telefonos';

function Filtros({ filters, data }) {
  const {
    bandeja, setBandeja, estado, setEstado, busqueda, setBusqueda,
    asesora, setAsesora, loading, load,
  } = filters;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_1fr_44px]">
      {/* El selector de asesora solo tiene sentido para quien ve varias carteras. */}
      {data.soloPropias ? null : (
        <label className="text-xs font-medium text-slate-500">
          Asesora
          <select
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
            value={asesora}
            onChange={(event) => setAsesora(event.target.value)}
          >
            <option value="">Todas</option>
            {data.asesoras.map((fila) => (
              <option key={fila.asesora} value={fila.asesora}>
                {fila.asesora} ({fila.n})
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="text-xs font-medium text-slate-500">
        Bandeja
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
          value={bandeja}
          onChange={(event) => setBandeja(event.target.value)}
        >
          {BANDEJAS.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>{opcion.label}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-slate-500">
        Estado
        <select
          className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-950"
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
        >
          <option>Todos</option>
          {data.estados.map((opcion) => (
            <option key={opcion.id} value={opcion.id}>{opcion.label}</option>
          ))}
        </select>
      </label>

      <label className="col-span-2 text-xs font-medium text-slate-500 md:col-span-1">
        Buscar
        <span className="relative mt-1 block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-950"
            placeholder="Placa o cliente"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </span>
      </label>

      <button
        type="button"
        className="mt-5 grid h-10 place-items-center rounded-md bg-red-700 text-white hover:bg-red-800"
        onClick={load}
        title="Actualizar"
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}

function ChipsEstado({ porEstado, estado, setEstado }) {
  return (
    <div className="flex flex-wrap gap-2">
      {porEstado.filter((fila) => fila.n > 0).map((fila) => {
        const color = colorEstado(fila.id);
        const activo = estado === fila.id;
        return (
          <button
            key={fila.id}
            type="button"
            onClick={() => setEstado(activo ? 'Todos' : fila.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activo ? 'ring-2 ring-slate-400' : 'hover:opacity-80'}`}
            style={{ backgroundColor: color.bg, color: color.fg }}
          >
            {fila.label} · {fila.n}
          </button>
        );
      })}
    </div>
  );
}

function FilaSeguimiento({ fila, estados, asesora, onGestionar }) {
  const actual = estadoEfectivo(fila);
  const colorEst = colorEstado(actual);
  const bandejaColor = colorBandeja(fila.bandeja);
  const dias = diasRestantes(fila.fecServicioPropuesto);
  const whatsapp = enlaceWhatsApp(fila, asesora);
  // Telefono mal cargado en el ERP: la fila entera va en rojo porque nadie
  // puede contactar a ese cliente hasta que alguien corrija el dato de origen.
  const telMalo = esTelefonoInvalido(fila.telefono);

  return (
    <tr
      className={`border-t align-top ${
        telMalo
          ? 'border-rose-200 bg-rose-50 hover:bg-rose-100'
          : 'border-slate-100 hover:bg-slate-50'
      }`}
    >
      <td className="px-3 py-3">
        <p className={`font-bold ${telMalo ? 'text-rose-900' : 'text-slate-900'}`}>{fila.placa}</p>
        <p className={`text-xs ${telMalo ? 'text-rose-700' : 'text-slate-500'}`}>
          {texto(fila.marca)} {texto(fila.modelo)}
        </p>
      </td>

      <td className="px-3 py-3">
        <p
          className={`max-w-[260px] truncate font-medium ${telMalo ? 'text-rose-900' : 'text-slate-800'}`}
          title={fila.cliente}
        >
          {texto(fila.cliente)}
        </p>
        <p className={`text-xs ${telMalo ? 'text-rose-700' : 'text-slate-500'}`}>{texto(fila.contacto)}</p>
        {telMalo ? (
          <span
            className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-700"
            title={motivoTelefonoInvalido(fila.telefono)}
          >
            <TriangleAlert size={11} />
            {texto(fila.telefono)} · teléfono inválido
          </span>
        ) : fila.telefono ? (
          <a
            href={`tel:${fila.telefono}`}
            className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
          >
            <Phone size={11} />
            {fila.telefono}
          </a>
        ) : null}
      </td>

      <td className={`px-3 py-3 text-xs ${telMalo ? 'text-rose-700' : 'text-slate-600'}`}>
        {fecha(fila.fecUltimoServicio)}
      </td>

      <td className="px-3 py-3">
        <p className={`text-sm font-semibold ${telMalo ? 'text-rose-900' : 'text-slate-800'}`}>
          {km(fila.servicioKm)}
        </p>
        <p className={`text-xs ${telMalo ? 'text-rose-700' : 'text-slate-500'}`}>
          {fecha(fila.fecServicioPropuesto)}
        </p>
        {fila.bandeja === 'cerrado' ? null : (
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: bandejaColor.bg, color: bandejaColor.fg }}
          >
            {textoDias(dias)}
          </span>
        )}
      </td>

      <td className="px-3 py-3">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: colorEst.bg, color: colorEst.fg }}
        >
          {etiquetaEstado(estados, actual)}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {fila.sgProximoContacto ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <CalendarClock size={11} />
              {fecha(fila.sgProximoContacto)}
            </span>
          ) : null}
          {/* La nota puede ser larga: aqui solo se anuncia y se lee en el panel. */}
          {fila.sgNota ? (
            <button
              type="button"
              onClick={() => onGestionar(fila)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:underline"
            >
              <StickyNote size={11} />
              Ver nota
            </button>
          ) : null}
        </div>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {/* Solo aparece si el telefono es celular: a un fijo no se le escribe. */}
          {whatsapp && fila.bandeja !== 'cerrado' ? (
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Escribir por WhatsApp"
              className="grid h-7 w-7 place-items-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <MessageCircle size={14} />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onGestionar(fila)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
          >
            Gestionar
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SeguimientoDashboard({ filters }) {
  const {
    data, seguimientos, resumen, loading, guardando, error,
    guardarGestion, historial, cargarHistorial,
  } = filters;
  const [abierto, setAbierto] = useState(null);

  // Abrir y cerrar la ficha es tambien lo que dispara y descarta su historial.
  const abrirFicha = (id) => { setAbierto(id); cargarHistorial(id); };
  const cerrarFicha = () => { setAbierto(null); cargarHistorial(null); };

  const contenedor = `mx-auto max-w-[1440px] px-4 pb-5 pt-[4.5rem] transition-all duration-200 sm:px-6 lg:px-8 lg:pt-5 ${
    filters.sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
  }`;

  if (!data) {
    return (
      <div className={contenedor}>
        <LoadingOverlay show={loading} label="Cargando seguimientos..." />
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}
      </div>
    );
  }

  // La fila abierta se vuelve a leer de la lista para que el panel muestre lo
  // recien guardado sin tener que cerrarlo y volver a abrirlo.
  const filaAbierta = abierto
    ? data.seguimientos.find((fila) => fila.id === abierto) ?? null
    : null;

  return (
    <div className={contenedor}>
      <LoadingOverlay show={loading} label="Cargando seguimientos..." />

      <header className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-red-950 via-red-800 to-red-600 p-5 text-white shadow-lg lg:flex lg:items-end lg:justify-between lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">
            {data.asesora || 'Todas las carteras'}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Seguimiento de mantenimientos
          </h1>
        </div>
        <div className="rounded-lg bg-white p-2 text-slate-900 shadow-sm">
          <Filtros filters={filters} data={data} />
        </div>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {WHATSAPP_NUMERO_PRUEBA ? (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Modo prueba de WhatsApp activo.</span>{' '}
          Todos los mensajes se abren hacia {WHATSAPP_NUMERO_PRUEBA}, no hacia el cliente.
        </p>
      ) : null}

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Vencidos" value={resumen.vencidos} icon={TriangleAlert} tone="rose"
          hint="La fecha propuesta ya pasó" />
        <Card label="Por vencer" value={resumen.porVencer} icon={CalendarClock} tone="amber"
          hint="Aún dentro de plazo" />
        <Card label="Sin gestionar" value={resumen.sinGestion} icon={CircleAlert} tone="blue"
          hint="Nunca se registró un contacto" />
        <Card label="Cerrados" value={resumen.cerrados} icon={ClipboardList} tone="green"
          hint="Atendidos o descartados" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <ChipsEstado porEstado={data.porEstado} estado={filters.estado} setEstado={filters.setEstado} />
          <p className="text-xs text-slate-500">
            {seguimientos.length} de {resumen.total} vehículos
          </p>
        </div>

        {seguimientos.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No hay vehículos que coincidan con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Vehículo</th>
                  <th className="px-3 py-2 font-semibold">Cliente</th>
                  <th className="px-3 py-2 font-semibold">Últ. servicio</th>
                  <th className="px-3 py-2 font-semibold">Servicio propuesto</th>
                  <th className="px-3 py-2 font-semibold">Gestión</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {seguimientos.map((fila) => (
                  <FilaSeguimiento
                    key={fila.id}
                    fila={fila}
                    estados={data.estados}
                    asesora={data.asesora}
                    onGestionar={(elegida) => abrirFicha(elegida.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PanelGestion
        fila={filaAbierta}
        estados={data.estados}
        asesora={data.asesora}
        historial={historial}
        guardando={guardando}
        onCerrar={cerrarFicha}
        onGuardar={guardarGestion}
      />
    </div>
  );
}
