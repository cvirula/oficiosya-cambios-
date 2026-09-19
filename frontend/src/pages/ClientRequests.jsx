import { useEffect, useState } from 'react';
import { listClientRequests } from '../api/requests';
import { useAuth } from '../auth/AuthContext';
import RequestCard from '../components/requests/RequestCard';
import RatingModal from '../components/requests/RatingModal';
import { Link } from '../router';
import ui from '../components/search/Search.module.css';
import styles from './Requests.module.css';

export default function ClientRequests() {
  const { session } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    listClientRequests(session.accessToken, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setRequests(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message || 'No se pudo cargar el historial.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session.accessToken, retry]);

  return (
    <div className={styles.page}>
      <header className={styles.top}><Link to="/">← Volver a buscar</Link><Link to="/worker/requests">Panel del trabajador</Link></header>
      <main className={styles.main}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>ÁREA DEL CLIENTE</p><h1>Mis solicitudes</h1><p>Consulta el avance de tus servicios y califica los trabajos completados.</p></div></div>
        {loading ? <div className={styles.message} role="status">Cargando tu historial…</div> : error ? (
          <div className={styles.message}><p role="alert">{error}</p><button className={ui.secondary} onClick={() => setRetry((n) => n + 1)}>Reintentar</button></div>
        ) : requests.length === 0 ? (
          <div className={styles.message}><h2>Aún no tienes solicitudes</h2><p>Busca un profesional y envía tu primera petición.</p><Link className={ui.primary} to="/">Buscar profesionales</Link></div>
        ) : <div className={styles.list}>{requests.map((request) => (
          <RequestCard key={request.id_solicitud} request={request} perspective="client"
            actions={request.estado === 'Completada' && !request.resena ? <button className={ui.primary} onClick={() => setRating(request)}>Calificar servicio</button> : null} />
        ))}</div>}
      </main>
      {rating && <RatingModal request={rating} onClose={() => setRating(null)} onSaved={(review) => {
        setRequests((items) => items.map((item) => item.id_solicitud === rating.id_solicitud ? { ...item, resena: review } : item));
        setRating(null);
      }} />}
    </div>
  );
}
