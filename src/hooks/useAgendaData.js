import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

// Compromisos de la asesora para el calendario.
//
// El rango lo manda FullCalendar cada vez que el usuario cambia de mes o de
// vista, asi que no se traen todas las citas de la historia: solo las del
// periodo que se esta mirando.
export default function useAgendaData() {
  const [rango, setRango] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [asesora, setAsesora] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!rango) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/seguimiento/agenda', { params: rango });
      setEventos(res.data.eventos);
      setAsesora(res.data.asesora || '');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
          || requestError.message
          || 'No se pudo cargar la agenda',
      );
    } finally {
      setLoading(false);
    }
  }, [rango]);

  useEffect(() => { load(); }, [load]);

  // FullCalendar avisa el rango visible en cada navegacion. Se compara antes de
  // guardar para no disparar una recarga cuando el rango no cambio de verdad.
  const cambiarRango = useCallback((desde, hasta) => {
    setRango((previo) => (
      previo?.desde === desde && previo?.hasta === hasta ? previo : { desde, hasta }
    ));
  }, []);

  return { eventos, asesora, loading, error, cambiarRango, load };
}
