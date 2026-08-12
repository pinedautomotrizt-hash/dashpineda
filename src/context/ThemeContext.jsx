import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);
const DARK_MODE_KEY = 'pineda_dark_mode';

// Modo oscuro compartido entre el menu lateral y las paginas que lo soportan
// (por ahora, el modulo Asesor y su pantalla de Ajustes). Se guarda en el
// navegador de cada usuario, asi que no afecta a nadie mas con la misma sesion.
export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_MODE_KEY) === '1');

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem(DARK_MODE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return context;
}
