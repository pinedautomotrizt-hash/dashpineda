import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { APP_DEFAULTS, monthlyGoalForLocal } from '../config/appConfig';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
// Centraliza filtros, carga paralela y estado remoto utilizado por los dashboards.
export default function useDashboardData() {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));
  const [tipoCambio, setTipoCambio] = useState(APP_DEFAULTS.exchangeRate);

  // Al cambiar de sede, sugiere la meta de esa sede; el usuario igual la puede
  // sobrescribir a mano en el campo de meta despues.
  const setLocal = useCallback((nextLocal) => {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }, []);
  const [locales, setLocales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [advisorData, setAdvisorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ month, local, meta, tipoCambio }), [month, local, meta, tipoCambio]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [localesRes, summaryRes, seriesRes, financialRes, advisorRes] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/resumen', { params }),
        api.get('/dashboard/series', { params }),
        api.get('/dashboard/facturacion', { params }),
        api.get('/dashboard/asesores', { params }),
      ]);
      setLocales(localesRes.data);
      setSummary(summaryRes.data);
      setSeries(seriesRes.data);
      setFinancial(financialRes.data);
      setAdvisorData(advisorRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  return {
    month, setMonth, local, setLocal, meta, setMeta, tipoCambio, setTipoCambio,
    locales, summary, series, financial, advisorData, loading, error, load,
  };
}
