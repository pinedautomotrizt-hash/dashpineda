import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { APP_DEFAULTS, monthlyGoalForLocal } from '../config/appConfig';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Mismo shape que useEmpresasData/useDashboardData (para reusar DashboardFilterBar
// tal cual), pero trae el reporte de una sola empresa (GET /dashboard/empresas/:empresa).
export default function useEmpresaDetalleData(nombreEmpresa) {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));
  const [tipoCambio] = useState(APP_DEFAULTS.exchangeRate);

  const setLocal = useCallback((nextLocal) => {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }, []);

  const [locales, setLocales] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ month, local }), [month, local]);

  const load = useCallback(async () => {
    if (!nombreEmpresa) return;
    setLoading(true);
    setError('');
    try {
      const [localesRes, detalleRes] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get(`/dashboard/empresas/${encodeURIComponent(nombreEmpresa)}`, { params }),
      ]);
      setLocales(localesRes.data);
      setDetalle(detalleRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar el reporte de la empresa');
    } finally {
      setLoading(false);
    }
  }, [nombreEmpresa, params]);

  useEffect(() => { load(); }, [load]);

  return {
    month, setMonth, local, setLocal, meta, setMeta, tipoCambio,
    locales, detalle, loading, error, load,
  };
}
