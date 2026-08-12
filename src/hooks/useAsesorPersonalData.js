import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { APP_DEFAULTS, monthlyGoalForLocal } from '../config/appConfig';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Mismo shape que useDashboardData/useEmpresasData (para reusar DashboardFilterBar
// tal cual), pero solo trae lo que necesita el modulo Asesor personal. Hook
// dedicado (no el useDashboardData generico) porque ese pide varios endpoints
// a la vez que el backend bloquea con 403 para el rol ASESOR_INDIVIDUAL.
export default function useAsesorPersonalData() {
  const [month, setMonth] = useState(currentMonth());
  const [local, setLocalState] = useState('Todos');
  const [meta, setMeta] = useState(monthlyGoalForLocal('Todos'));
  const [tipoCambio] = useState(APP_DEFAULTS.exchangeRate);

  const setLocal = useCallback((nextLocal) => {
    setLocalState(nextLocal);
    setMeta(monthlyGoalForLocal(nextLocal));
  }, []);

  const [locales, setLocales] = useState([]);
  const [asesorData, setAsesorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ month, local }), [month, local]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [localesRes, asesorRes] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/asesor-personal', { params }),
      ]);
      setLocales(localesRes.data);
      setAsesorData(asesorRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'No se pudo cargar tu facturación');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  // Precarga la sede del asesor (ej. Trujillo) apenas se sabe cual es, para
  // no arrancar siempre en "Todos". Se calcula sola en el backend segun donde
  // trabaja de verdad cada asesor (sedePrincipal), asi que sirve igual el dia
  // que se sumen asesoras de Callao, sin tocar este codigo. Solo se aplica
  // una vez: si el usuario ya toco el selector a mano, se respeta su eleccion.
  const sedeAutoAplicada = useRef(false);
  useEffect(() => {
    if (sedeAutoAplicada.current) return;
    if (local !== 'Todos') { sedeAutoAplicada.current = true; return; }
    if (!asesorData?.sedePrincipal) return;
    sedeAutoAplicada.current = true;
    setLocal(asesorData.sedePrincipal);
  }, [asesorData, local, setLocal]);

  return {
    month, setMonth, local, setLocal, meta, setMeta, tipoCambio,
    locales, asesorData, loading, error, load,
  };
}
