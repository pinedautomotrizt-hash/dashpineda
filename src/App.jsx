import React from 'react';
import AppRouter from './routes/AppRouter';

// Componente raíz: mantiene visible el punto de entrada de la aplicación y
// delega exclusivamente la resolución de URLs al módulo de rutas.
export default function App() {
  return <AppRouter />;
}
