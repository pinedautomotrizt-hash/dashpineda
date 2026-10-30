// Vehiculos 3D con vista explosionada (Planchado y Pintura, KPI Repuestos).
//
// Cada malla se asigna a una capa del despiece:
//   - materiales: capa fija por nombre de material (lo que el modelo trae bien
//     nombrado: pintura, vidrios, luces, llantas).
//   - resto: que hacer con los materiales no listados. 'geometrico' los reparte
//     por posicion (despieceGeometrico.js); 'exterior' los manda a esa capa.
//   - colores: color por capa para modelos que vienen sin color.
//   - rotacionY: giro para dejar el largo en X con el frente hacia -X (lo
//     usan los anclajes del KPI y las reglas de posicion). Se calibra mirando
//     donde quedan los faros: casi todos los modelos vienen con el largo en Z.
//
// Todos son de Sketchfab con licencia CC-BY: hay que mostrar el autor.
// Los .glb son versiones optimizadas (indices de 16 bits, normales y posiciones
// cuantizadas) de los originales; si se cambia un modelo, recalibrar aqui.
const BRONCO = '021_Ford_Bronco_Wildtrak_';

export const VEHICULOS = Object.freeze([
  {
    id: 'hilux',
    nombre: 'Toyota Hilux',
    url: '/assets/hilux_despiece.glb',
    autor: 'BHP3D',
    rotacionY: Math.PI / 2,
    resto: 'geometrico',
    materiales: {
      vidrios: ['glass', 'glass.001', 'glass.002'],
      luces: [
        'right_rear_light', 'left_rear_light', 'right_front_light', 'revlight_L', 'revlight_r',
        'indicator_lr', 'indicator_rr', 'indicator_lf', 'indicator_rf', 'indicator_lm', 'indicator_rm',
        'foglight_l', 'foglight_r', 'hilux_headlight.0',
      ],
      interior: ['hilux_seat_mech.11', 'hilux_speedometer.4', 'hilux_speedometer.5', 'hilux_speedometer.11', 'hilux_dashboard.3'],
    },
  },
  {
    id: 'triton',
    nombre: 'Mitsubishi L200 Triton',
    url: '/assets/triton_despiece.glb',
    autor: 'Nieve5677',
    rotacionY: 0,
    resto: 'geometrico',
    materiales: {},
    // Viene sin color: se tiñe por capa.
    colores: { carroceria: '#b91c1c', interior: '#52525b', chasis: '#3f3f46', ruedas: '#27272a' },
  },
  {
    id: 'navara',
    nombre: 'Nissan Frontier (Navara)',
    url: '/assets/navara_despiece.glb',
    autor: 'Asadawut.Kaewma',
    rotacionY: -Math.PI / 2,
    resto: 'geometrico',
    materiales: {
      carroceria: ['carpaint'],
      vidrios: ['clear_glass', 'windows_glass'],
      luces: ['red_glass', 'Light', 'red_taillight', 'orangeglass', 'gloss_light'],
      exterior: ['chrome', 'silver', 'plate_cover_titanium', 'license_plate'],
      ruedas: ['tire', 'rim_gloss'],
    },
  },
  {
    id: 'ranger',
    nombre: 'Ford Ranger',
    url: '/assets/ranger_despiece.glb',
    autor: 'Asadawut.Kaewma',
    rotacionY: -Math.PI / 2,
    resto: 'exterior',
    materiales: {
      carroceria: ['carpaint', 'Material__27'],
      vidrios: ['clearglass', 'windows_glass', 'mirror'],
      luces: ['redglass'],
      interior: ['interior'],
      exterior: ['chrome', 'black_gloss', 'Material__29', 'Material__31', 'Material__32', 'material'],
      chasis: ['black'],
      ruedas: ['tyre', 'black_rim', 'disc', 'Material__34'],
    },
  },
  {
    id: 'partner',
    nombre: 'Peugeot Partner',
    url: '/assets/partner_despiece.glb',
    autor: 'Nieve5677',
    rotacionY: -Math.PI / 2,
    resto: 'geometrico',
    materiales: {
      carroceria: ['carpaint.221'],
      vidrios: ['greenglass.039', 'clearglass.221', 'darkglass.044', 'mirror.210'],
      luces: ['redglass.220', 'orangeglass.191'],
      interior: ['interior.206'],
      exterior: ['chrome.221'],
      ruedas: ['tire.221', 'disc.032', 'brakedisk.170'],
    },
  },
  {
    id: 'doblo',
    nombre: 'Fiat Doblò (RAM V700)',
    url: '/assets/doblo_despiece.glb',
    autor: 'szymonpasterczyk734',
    rotacionY: -Math.PI / 2,
    resto: 'geometrico',
    materiales: {
      carroceria: ['doblo2_body'],
      vidrios: ['doblo2_glass'],
      luces: [
        'doblo2_foglight', 'doblo2_red', 'doblo2_signal_R', 'doblo2_signal_L', 'doblo2_redglass',
        'doblo2_lowbeam', 'doblo2_highbeam', 'doblo2_chmsl', 'doblo2_taillight', 'doblo2_reverselight',
      ],
    },
  },
  {
    id: 'kia',
    nombre: 'Kia Sportage',
    url: '/assets/modelo_camioneta.glb',
    autor: 'mayjolvargas.2',
    rotacionY: 0,
    resto: 'geometrico',
    materiales: {},
  },
  {
    id: 'l200',
    nombre: 'Mitsubishi L200 clásica',
    url: '/assets/1978-2006_mitsubishi_l200_red_offroader_v4.glb',
    autor: 'zairiq-zairiq-123-pixar-cars-bfdi',
    rotacionY: -Math.PI / 2,
    resto: 'geometrico',
    materiales: {},
  },
  {
    id: 'bronco',
    nombre: 'Ford Bronco',
    url: '/assets/bronco_despiece.glb',
    autor: 'Casacade Models',
    rotacionY: -Math.PI / 2,
    resto: 'exterior',
    materiales: {
      carroceria: ['Carbonized_Grey'],
      vidrios: [`${BRONCO}vitres_exterieur`, `${BRONCO}vehicle_generic_glasswindows2`],
      luces: [`${BRONCO}lights_red`, `${BRONCO}red2`, 'Signals', 'Color_M03'],
      interior: [`${BRONCO}seats_paint`, `${BRONCO}ceinture2`],
      exterior: [`${BRONCO}ford_bronco_4door_2021_wildtrak_logo`, `${BRONCO}dinghyblack`, 'material'],
      chasis: [`${BRONCO}black`],
      ruedas: [`${BRONCO}vehicle_generic_tyrewallblack`, `${BRONCO}Brake_disk_380_272`, `${BRONCO}vehicle_generic_smallspecmap`],
    },
  },
]);

const POR_ID = Object.fromEntries(VEHICULOS.map((vehiculo) => [vehiculo.id, vehiculo]));

export function vehiculoPorId(id) {
  return POR_ID[id] || VEHICULOS[0];
}

// Vehiculo con el que abre cada modulo segun la sede: el que mas entra ahi
// entre los disponibles. El usuario puede cambiarlo en el visor.
const POR_DEFECTO = {
  planchadoPintura: { 'Pineda Trujillo': 'ranger', otros: 'hilux' },
  kpi: { 'Pineda Trujillo': 'triton', otros: 'partner' },
};

export function vehiculoPorDefecto(modulo, local) {
  const tabla = POR_DEFECTO[modulo] || {};
  return vehiculoPorId(tabla[local] || tabla.otros);
}

// Capa fija de una malla segun el material, o null para repartirla por
// posicion. Con resto 'exterior' nunca devuelve null.
export function capaFijaDe(vehiculo) {
  const capaPorMaterial = Object.fromEntries(
    Object.entries(vehiculo.materiales || {}).flatMap(([capa, materiales]) => materiales.map((m) => [m, capa])),
  );
  return (malla, material) => capaPorMaterial[material?.name] || (vehiculo.resto === 'exterior' ? 'exterior' : null);
}
