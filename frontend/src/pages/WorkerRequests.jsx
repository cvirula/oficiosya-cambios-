import { useEffect, useMemo, useState } from 'react';
import { listWorkerRequests, updateRequestStatus } from '../api/requests';
import { useAuth } from '../auth/AuthContext';
import RequestCard from '../components/requests/RequestCard';
import { Link } from '../router';
import ui from '../components/search/Search.module.css';
import styles from './Requests.module.css';

const ACTIONS = {
  Enviada: [{ estado: 'Aceptada', label: 'Aceptar' }, { estado: 'Rechazada', label: 'Rechazar', secondary: true }],
  Aceptada: [{ estado: 'En proceso', label: 'Iniciar trabajo' }, { estado: 'Completada', label: 'Marcar completada' }],
  'En proceso': [{ estado: 'Completada', label: 'Marcar completada' }],
};

export default function WorkerRequests() {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Activas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    listWorkerRequests(session.accessToken, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setRequests(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message || 'No se pudieron cargar las peticiones.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session.accessToken, retry]);

  const visible = useMemo(() => requests.filter((item) => {
    if (filter === 'Todas') return true;
    if (filter === 'Finalizadas') return ['Completada', 'Rechazada', 'Cancelada'].includes(item.estado);
    return ['Enviada', 'Aceptada', 'En proceso'].includes(item.estado);
  }), [filter, requests]);

  const changeStatus = async (request, estado) => {
    setBusyId(request.id_solicitud); setError('');
    try {
      const updated = await updateRequestStatus(request.id_solicitud, estado, session.accessToken);
      setRequests((items) => items.map((item) => item.id_solicitud === updated.id_solicitud ? updated : item));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la solicitud.');
    } finally { setBusyId(null); }
  };

  return (
    <div className={styles.page}>
      <header className={styles.top}><Link to="/">← Inicio</Link><Link to="/client/requests">Mis solicitudes como cliente</Link></header>
      <main className={styles.main}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>ÁREA DEL TRABAJADOR</p><h1>Peticiones recibidas</h1><p>Acepta trabajos, actualiza su avance y consulta las calificaciones recibidas.</p></div><Link className={ui.secondary} to="/worker/profile">Tarifas y cobertura</Link></div>
        <div className={styles.filters} role="group" aria-label="Filtrar peticiones">
          {['Activas', 'Finalizadas', 'Todas'].map((value) => <button key={value} className={filter === value ? styles.filterActive : styles.filter} onClick={() => setFilter(value)}>{value}</button>)}
        </div>
        {error && <div className={styles.inlineError} role="alert">{error} <button className={ui.textButton} onClick={() => setRetry((n) => n + 1)}>Actualizar panel</button></div>}
        {loading ? <div className={styles.message} role="status">Cargando peticiones…</div> : visible.length === 0 ? (
          <div className={styles.message}><h2>No hay peticiones en esta vista</h2><p>Cuando un cliente solicite uno de tus servicios aparecerá aquí.</p></div>
        ) : <div className={styles.list}>{visible.map((request) => {
          const options = ACTIONS[request.estado] || [];
          return <RequestCard key={request.id_solicitud} request={request} perspective="worker" busy={busyId === request.id_solicitud}
            actions={options.map((action) => <button key={action.estado} disabled={busyId !== null} className={action.secondary ? ui.secondary : ui.primary} onClick={() => changeStatus(request, action.estado)}>{busyId === request.id_solicitud ? 'Guardando…' : action.label}</button>)} />;
        })}</div>}
      </main>
    </div>
  );
}
