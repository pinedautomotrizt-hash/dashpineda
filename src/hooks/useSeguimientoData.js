import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

// Datos del modulo Seguimiento de mantenimientos.
//
// El backend decide que filas devuelve segun el rol: una asesora recibe solo su
// cartera y el selector de asesora no se le muestra. Aqui no se replica esa
// regla (seria una validacion falsa), solo se pinta lo que llega.
//
// Los filtros de bandeja, estado y busqueda se aplican en memoria: la lista es
// de ~100 filas por asesora y asi el filtrado es inmediato, sin ir al servidor.
export default function useSeguimientoData() {
  const [asesora, setAsesora] = useState('');
  const [bandeja, setBandeja] = useState('abiertos');
  const [estado, setEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const [data, setData] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/seguimiento', {
        params: asesora ? { asesora } : {},
      });
      setData(res.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
          || requestError.message
          || 'No se pudo cargar el seguimiento de mantenimientos',
      );
    } finally {
      setLoading(false);
    }
  }, [asesora]);

  useEffect(() => { load(); }, [load]);

  // Linea de tiempo de una ficha. Se pide al abrir el panel y no con el listado:
  // solo hace falta para el vehiculo que se esta mirando.
  const cargarHistorial = useCallback(async (id) => {
    if (!id) { setHistorial(null); return; }
    setHistorial({ cargando: true, eventos: [] });
    try {
      const res = await api.get(`/dashboard/seguimiento/${id}/historial`);
      setHistorial({ cargando: false, eventos: res.data.historial });
    } catch {
      // Que falle el historial no debe tapar la ficha: se muestra vacio.
      setHistorial({ cargando: false, eventos: [] });
    }
  }, []);

  // Guarda la gestion y reemplaza solo esa fila con lo que devuelve el backend,
  // en vez de recargar toda la lista: la asesora no pierde su posicion ni los
  // filtros mientras va llamando cliente por cliente.
  const guardarGestion = useCallback(async (id, gestion) => {
    setGuardando(id);
    setError('');
    try {
      const res = await api.patch(`/dashboard/seguimiento/${id}`, gestion);
      setData((previo) => (previo ? {
        ...previo,
        seguimientos: previo.seguimientos.map(
          (fila) => (fila.id === id ? res.data.seguimiento : fila),
        ),
      } : previo));
      // No se recarga el historial: al guardar se cierra el panel, y al volver a
      // abrir la ficha se pide de nuevo. Seria una peticion que nadie llega a ver.
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo guardar la gestión');
      return false;
    } finally {
      setGuardando(null);
    }
  }, []);

  // Pedir un estado que cierra (Atendido, No desea) mientras la bandeja es
  // "Por gestionar" no devolveria nada nunca, porque esa bandeja oculta
  // justamente lo cerrado. Cuando se elige uno de esos estados se abre la
  // vista a todos: el filtro que el usuario acaba de tocar es el que manda.
  const aplicarEstado = useCallback((nuevo) => {
    setEstado(nuevo);
    const cierra = data?.estados?.find((item) => item.id === nuevo)?.cierra;
    if (cierra && bandeja === 'abiertos') setBandeja('todos');
  }, [data, bandeja]);

  const seguimientos = useMemo(() => {
    const filas = data?.seguimientos ?? [];
    const texto = busqueda.trim().toUpperCase();
    return filas.filter((fila) => {
      if (bandeja === 'abiertos' && fila.bandeja === 'cerrado') return false;
      if (bandeja !== 'abiertos' && bandeja !== 'todos' && fila.bandeja !== bandeja) return false;
      if (estado !== 'Todos') {
        const actual = fila.estadoErp === 'ATENDIDO' ? 'ATENDIDO' : (fila.sgEstado || 'PENDIENTE');
        if (actual !== estado) return false;
      }
      if (!texto) return true;
      return [fila.placa, fila.cliente, fila.contacto, fila.marca, fila.modelo]
        .some((campo) => String(campo || '').toUpperCase().includes(texto));
    });
  }, [data, bandeja, estado, busqueda]);

  // Totales de la bandeja abierta: el recuento que de verdad le importa a la
  // asesora cuando entra. Las cerradas no suman urgencia.
  const resumen = data?.resumen ?? null;

  return {
    asesora, setAsesora,
    bandeja, setBandeja,
    estado, setEstado: aplicarEstado,
    busqueda, setBusqueda,
    data, seguimientos, resumen,
    historial, cargarHistorial,
    loading, guardando, error, load, guardarGestion,
  };
}
