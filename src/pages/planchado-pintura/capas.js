// Capas del despiece. El id coincide con la clasificacion de lineas del
// backend (planchadoPintura.controllers.js).
export const CAPAS = Object.freeze([
  { id: 'carroceria', label: 'Carrocería', color: '#b91c1c' },
  { id: 'vidrios', label: 'Vidrios y espejos', color: '#0284c7' },
  { id: 'luces', label: 'Luces', color: '#f59e0b' },
  { id: 'interior', label: 'Interior', color: '#7c3aed' },
  { id: 'exterior', label: 'Exterior y accesorios', color: '#0f766e' },
  { id: 'chasis', label: 'Chasis y mecánica', color: '#475569' },
  { id: 'ruedas', label: 'Ruedas y frenos', color: '#1e293b' },
]);

// Un modelo por sede: cada taller ve el vehiculo que mas entra ahi. Las mallas
// se asignan a una capa por el nombre de su material; un material que no este
// listado cae en "exterior". Si se cambia un modelo, esto es lo unico que hay
// que recalibrar.
const BRONCO = '021_Ford_Bronco_Wildtrak_';
const MODELOS = Object.freeze({
  ranger: {
    nombre: 'Ford Ranger',
    url: '/assets/ranger_despiece.glb',
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
  bronco: {
    nombre: 'Ford Bronco',
    url: '/assets/bronco_despiece.glb',
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
});

// Trujillo ve la Ranger; Callao (Lima) y la vista de todas las sedes, la Bronco.
export function modeloPorLocal(local) {
  return local === 'Pineda Trujillo' ? MODELOS.ranger : MODELOS.bronco;
}
