import axios from 'axios';

// El access/refresh token viven en cookies httpOnly puestas por el backend;
// el navegador las manda solo si mandamos las peticiones con credenciales.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
});

// Si varias peticiones fallan por access token vencido al mismo tiempo, todas
// esperan el mismo refresh en vez de disparar uno por cada una.
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Ante un 401 (access token vencido), intenta renovar con /auth/refresh y
// reintenta la peticion original una sola vez. Si el refresh tambien falla
// (o ya se reintento), manda al login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.endsWith('/auth/login') || config?.url?.endsWith('/auth/refresh');

    if (response?.status === 401 && !isAuthEndpoint && !config._retry) {
      config._retry = true;
      try {
        await refreshSession();
        return api(config);
      } catch {
        // sigue abajo y manda al login
      }
    }

    if (response?.status === 401 && !isAuthEndpoint && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
