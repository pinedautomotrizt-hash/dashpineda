import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

// Datos del modulo KPI: el resumen de los 9 repuestos y, cuando hay una pieza
// seleccionada, su detalle. El detalle se pide aparte para no traer miles de
// intervalos al abrir la pagina.
export default function useKpiData() {
  const [local, setLocal] = useState('Todos');
  const [soloFlota, setSoloFlota] = useState(true);
  const [empresa, setEmpresa] = useState('Todas');
  const [seleccionado, setSeleccionado] = useState(null);

  const [locales, setLocales] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ local, soloFlota, empresa }), [local, soloFlota, empresa]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [localesRes, resumenRes] = await Promise.all([
        api.get('/dashboard/locales'),
        api.get('/dashboard/kpi/repuestos', { params }),
      ]);
      setLocales(localesRes.data);
      setResumen(resumenRes.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
          || requestError.message
          || 'No se pudo cargar el módulo KPI',
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!seleccionado) {
      setDetalle(null);
      return undefined;
    }
    // Si el usuario cambia de pieza antes de que llegue la respuesta anterior,
    // se descarta la vieja para no pintar el detalle equivocado.
    let vigente = true;
    setLoadingDetalle(true);
    api.get(`/dashboard/kpi/repuestos/${seleccionado}`, { params })
      .then((res) => { if (vigente) setDetalle(res.data); })
      .catch((requestError) => {
        if (vigente) {
          setError(requestError.response?.data?.message || 'No se pudo cargar el detalle del repuesto');
        }
      })
      .finally(() => { if (vigente) setLoadingDetalle(false); });
    return () => { vigente = false; };
  }, [seleccionado, params]);

  return {
    local, setLocal,
    soloFlota, setSoloFlota,
    empresa, setEmpresa,
    seleccionado, setSeleccionado,
    locales, resumen, detalle,
    loading, loadingDetalle, error, load,
  };
}
