import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { APP_DEFAULTS, monthlyGoalForLocal } from '../config/appConfig';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Mismo shape que useDashboardData (para reusar DashboardFilterBar tal cual),
// pero solo trae lo que necesita el modulo Empresas.
export default function useEmpresasData() {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));
  const [tipoCambio] = useState(APP_DEFAULTS.exchangeRate);

  const setLocal = useCallback((nextLocal) => {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }, []);

  const [locales, setLocales] = useState([]);
  const [empresas, setEmpresas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ month, local }), [month, local]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [localesRes, empresasRes] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/empresas', { params }),
      ]);
      setLocales(localesRes.data);
      setEmpresas(empresasRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar el modulo de empresas');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  return {
    month, setMonth, local, setLocal, meta, setMeta, tipoCambio,
    locales, empresas, loading, error, load,
  };
}
