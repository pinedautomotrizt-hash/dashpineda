// Capas del despiece. El id coincide con la clasificacion de lineas del
// backend (planchadoPintura.controllers.js); "materiales" son los nombres de
// material del modelo ranger_despiece.glb que se dibujan en cada capa.
export const CAPAS = Object.freeze([
  { id: 'carroceria', label: 'Carrocería', color: '#b91c1c', materiales: ['carpaint', 'Material__27'] },
  { id: 'vidrios', label: 'Vidrios y espejos', color: '#0284c7', materiales: ['clearglass', 'windows_glass', 'mirror'] },
  { id: 'luces', label: 'Luces', color: '#f59e0b', materiales: ['redglass'] },
  { id: 'interior', label: 'Interior', color: '#7c3aed', materiales: ['interior'] },
  { id: 'exterior', label: 'Exterior y accesorios', color: '#0f766e', materiales: ['chrome', 'black_gloss', 'Material__29', 'Material__31', 'Material__32', 'material'] },
  { id: 'chasis', label: 'Chasis y mecánica', color: '#475569', materiales: ['black'] },
  { id: 'ruedas', label: 'Ruedas y frenos', color: '#1e293b', materiales: ['tyre', 'black_rim', 'disc', 'Material__34'] },
]);
