// Capas del despiece. El id coincide con la clasificacion de lineas del
// backend (planchadoPintura.controllers.js) y con las capas del despiece
// geometrico (components/despiece/despieceGeometrico.js).
// Los vehiculos y como se reparten sus mallas: config/vehiculosDespiece.js.
export const CAPAS = Object.freeze([
  { id: 'carroceria', label: 'Carrocería', color: '#b91c1c' },
  { id: 'vidrios', label: 'Vidrios y espejos', color: '#0284c7' },
  { id: 'luces', label: 'Luces', color: '#f59e0b' },
  { id: 'interior', label: 'Interior', color: '#7c3aed' },
  { id: 'exterior', label: 'Exterior y accesorios', color: '#0f766e' },
  { id: 'chasis', label: 'Chasis y mecánica', color: '#475569' },
  { id: 'ruedas', label: 'Ruedas y frenos', color: '#1e293b' },
]);
