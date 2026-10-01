// Clasificacion de los telefonos que trae el ERP.
//
// Hay que distinguir tres casos y no confundir los dos ultimos:
//   celular  -> 9 digitos que empiezan en 9. Se le puede escribir por WhatsApp.
//   fijo     -> numero correcto pero sin WhatsApp. Solo se le puede llamar.
//   invalido -> el dato esta mal cargado en el ERP (le faltan digitos, tiene
//               de mas, o no es un numero peruano). Nadie puede contactarlo
//               hasta que se corrija en el origen.
//
// Un fijo NO es un error: es contactable por telefono. Por eso solo se marca en
// rojo el invalido, que si exige que alguien vaya a arreglar el dato.

export const TELEFONO_CELULAR = 'celular';
export const TELEFONO_FIJO = 'fijo';
export const TELEFONO_INVALIDO = 'invalido';

const CODIGO_PAIS_PERU = '51';

// Celular: 9 digitos empezando en 9.
const CELULAR = /^9\d{8}$/;
// Fijo de Lima: 1 + 7 digitos. Fijo de provincia: codigo de area de 2 digitos
// (4x, 5x, 6x, 7x, 8x) + 6 digitos, con o sin el 0 de larga distancia.
const FIJO_LIMA = /^1\d{7}$/;
const FIJO_PROVINCIA = /^0?[4-8]\d{7}$/;

function soloDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

/** Quita el codigo de pais si viene, para evaluar el numero local. */
export function numeroLocal(telefono) {
  const digitos = soloDigitos(telefono);
  if (digitos.startsWith(CODIGO_PAIS_PERU) && digitos.length === 11) return digitos.slice(2);
  return digitos;
}

export function clasificarTelefono(telefono) {
  const local = numeroLocal(telefono);
  if (!local) return TELEFONO_INVALIDO;
  if (CELULAR.test(local)) return TELEFONO_CELULAR;
  if (FIJO_LIMA.test(local) || FIJO_PROVINCIA.test(local)) return TELEFONO_FIJO;
  return TELEFONO_INVALIDO;
}

export function esCelular(telefono) {
  return clasificarTelefono(telefono) === TELEFONO_CELULAR;
}

export function esTelefonoInvalido(telefono) {
  return clasificarTelefono(telefono) === TELEFONO_INVALIDO;
}

/** Por que esta mal, para explicarselo a quien tiene que corregirlo. */
export function motivoTelefonoInvalido(telefono) {
  const local = numeroLocal(telefono);
  if (!local) return 'El ERP no tiene ningún teléfono para este cliente.';
  if (local.length < 7) return `Número incompleto (${local.length} dígitos). Corregir en el ERP.`;
  if (local.length === 7) return 'Falta el código de área (fijo incompleto). Corregir en el ERP.';
  if (local.length > 9) return `Número demasiado largo (${local.length} dígitos). Corregir en el ERP.`;
  return 'El número no corresponde a un celular ni a un fijo peruano. Corregir en el ERP.';
}
