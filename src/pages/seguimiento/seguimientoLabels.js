// Etiquetas y colores del modulo Seguimiento. Aparte del componente para que el
// listado y el panel de gestion no se desincronicen.

export const BANDEJAS = Object.freeze([
  { id: 'abiertos', label: 'Por gestionar' },
  { id: 'vencido', label: 'Vencidos' },
  { id: 'porVencer', label: 'Por vencer' },
  { id: 'cerrado', label: 'Cerrados' },
  { id: 'todos', label: 'Todos' },
]);

const COLOR_ESTADO = Object.freeze({
  PENDIENTE: { bg: '#f1f5f9', fg: '#475569' },
  CONTACTADO: { bg: '#dbeafe', fg: '#1d4ed8' },
  AGENDADO: { bg: '#dcfce7', fg: '#15803d' },
  NO_CONTESTA: { bg: '#fef3c7', fg: '#b45309' },
  ATENDIDO: { bg: '#d1fae5', fg: '#047857' },
  NO_DESEA: { bg: '#fee2e2', fg: '#b91c1c' },
});

export function colorEstado(id) {
  return COLOR_ESTADO[id] ?? COLOR_ESTADO.PENDIENTE;
}

// El estado que se muestra: si el ERP ya facturo el servicio, eso manda sobre
// lo que haya anotado la asesora.
export function estadoEfectivo(fila) {
  if (fila.estadoErp === 'ATENDIDO') return 'ATENDIDO';
  return fila.sgEstado || 'PENDIENTE';
}

export function etiquetaEstado(estados, id) {
  return estados?.find((estado) => estado.id === id)?.label ?? id;
}

const COLOR_BANDEJA = Object.freeze({
  vencido: { bg: '#fee2e2', fg: '#b91c1c', label: 'Vencido' },
  porVencer: { bg: '#fef3c7', fg: '#b45309', label: 'Por vencer' },
  cerrado: { bg: '#d1fae5', fg: '#047857', label: 'Cerrado' },
});

export function colorBandeja(id) {
  return COLOR_BANDEJA[id] ?? COLOR_BANDEJA.porVencer;
}

// Dias de atraso o de holgura respecto de la fecha propuesta. Negativo = vencido.
export function diasRestantes(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const objetivo = new Date(fecha);
  objetivo.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
}

export function textoDias(dias) {
  if (dias === null) return '—';
  if (dias === 0) return 'Hoy';
  if (dias < 0) return `${Math.abs(dias)} d. de atraso`;
  return `en ${dias} d.`;
}

export function fecha(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  });
}

// Valor para un <input type="date">: necesita exactamente YYYY-MM-DD.
export function fechaInput(valor) {
  if (!valor) return '';
  return new Date(valor).toISOString().slice(0, 10);
}

export function km(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return `${new Intl.NumberFormat('es-PE').format(valor)} km`;
}

export function texto(valor) {
  const limpio = String(valor ?? '').trim();
  return limpio || '—';
}

// Fecha y hora de un evento del historial. A diferencia de las fechas del ERP
// (que son dias sueltos en UTC), estas son instantes y van en hora local.
export function fechaHora(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// Valor para un <input type="datetime-local">: "YYYY-MM-DDTHH:mm" en hora local.
// No se puede usar toISOString() porque pasa a UTC y correria la hora de la cita.
export function fechaHoraInput(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
