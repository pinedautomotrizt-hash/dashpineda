// Enlaces de WhatsApp para el seguimiento.
//
// Se usa el esquema wa.me (click-to-chat), no la API de WhatsApp Business ni
// librerias tipo whatsapp-web.js. La razon es que wa.me abre la sesion de
// WhatsApp de quien hace clic: el mensaje sale del numero de la propia asesora
// sin registrar nada, y no hay riesgo de que baneen su linea personal. El texto
// va prellenado pero ella decide si lo envia.

import { esCelular, numeroLocal } from './telefonos';

// ---------------------------------------------------------------- modo prueba
//
// Mientras esto tenga un numero, TODOS los enlaces apuntan ahi en vez de al
// cliente real. Es para probar el modulo sin escribirle a nadie.
// Para salir a produccion: dejarlo en cadena vacia.
// El dashboard muestra un aviso naranja mientras este activo, para que nadie
// crea que le esta escribiendo al cliente.
export const WHATSAPP_NUMERO_PRUEBA = '';

const CODIGO_PAIS_PERU = '51';

/** Numero en el formato que espera wa.me: codigo de pais + numero, sin signos. */
function paraWaMe(telefono) {
  return `${CODIGO_PAIS_PERU}${numeroLocal(telefono)}`;
}

// Celular de cada asesora, para que el cliente sepa a que numero responder.
// La clave es el nombre tal como viene en asesora_asignada.
//
// Esto NO define desde que numero sale el mensaje: wa.me abre la sesion de
// WhatsApp de quien hace clic, asi que el emisor siempre es la propia asesora.
// Este dato solo se imprime en la firma.
const CELULAR_ASESORA = Object.freeze({
  'KAREN ROSAS': '934 820 171',
  'MARIA VALERIANO': '960 824 291',
});

// "KAREN ROSAS" -> "Karen". El cliente recibe un nombre, no un registro de RR. HH.
function nombreCorto(asesora) {
  const primero = String(asesora || '').trim().split(/\s+/)[0] || '';
  if (!primero) return '';
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
}

// El ERP guarda la sede como "Pineda Trujillo" / "Pineda Callao", pero al
// cliente se le escribe con el nombre comercial completo.
function nombreComercial(local) {
  const sede = String(local || '').trim().replace(/^pineda\s+/i, '');
  return sede ? `Pineda Automotriz ${sede}` : 'Pineda Automotriz';
}

function trato(contacto) {
  const limpio = String(contacto || '').trim();
  return limpio ? `Sr(a). ${limpio}` : 'estimado cliente';
}

/** Texto prellenado del mensaje, armado con los datos de la fila. */
export function mensajeWhatsApp(fila, asesora) {
  const vehiculo = [fila.marca, fila.modelo].map((p) => String(p || '').trim()).filter(Boolean).join(' ');
  const firma = nombreCorto(asesora);
  const sede = nombreComercial(fila.local);

  const lineas = [
    `Buen día, ${trato(fila.contacto)}.`,
    '',
    `Le escribo de ${sede}. Según nuestro registro, su ${vehiculo || 'vehículo'} de placa ${fila.placa} tiene pendiente el mantenimiento${fila.servicioKm ? ` de ${new Intl.NumberFormat('es-PE').format(fila.servicioKm)} km` : ''}.`,
  ];

  if (fila.recomendacion) {
    lineas.push('', `Recomendación del taller: ${fila.recomendacion}`);
  }

  lineas.push('', '¿Desea que le agende una cita? Quedo atenta.');

  if (firma) {
    lineas.push('', firma);
    const celular = CELULAR_ASESORA[String(asesora || '').trim().toUpperCase()];
    if (celular) lineas.push(`Cel. ${celular}`);
  }

  return lineas.join('\n');
}

/**
 * Enlace wa.me listo para abrir, o null si al numero no se le puede escribir.
 * Devuelve tambien si se esta redirigiendo al numero de prueba, para avisarlo
 * en pantalla.
 */
export function enlaceWhatsApp(fila, asesora) {
  if (!esCelular(fila.telefono)) return null;
  const destinoReal = paraWaMe(fila.telefono);
  const prueba = Boolean(WHATSAPP_NUMERO_PRUEBA);
  const destino = prueba ? paraWaMe(WHATSAPP_NUMERO_PRUEBA) : destinoReal;
  return {
    url: `https://wa.me/${destino}?text=${encodeURIComponent(mensajeWhatsApp(fila, asesora))}`,
    prueba,
    destinoReal,
  };
}
