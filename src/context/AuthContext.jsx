import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

// La sesion vive en cookies httpOnly (el navegador las maneja solo); aca solo
// guardamos el usuario en memoria para pintar la UI, y lo recuperamos con
// /auth/me al cargar la app (recarga de pagina, pestaña nueva, etc).
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUsuario(data.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUsuario(data.usuario);
    return data.usuario;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUsuario(null);
    }
  };

  const value = useMemo(() => ({
    usuario,
    loading,
    isAuthenticated: Boolean(usuario),
    isAdmin: usuario?.rol === 'ADMIN',
    login,
    logout,
  }), [usuario, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
}
