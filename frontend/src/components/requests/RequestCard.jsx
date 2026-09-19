import styles from '../../pages/Requests.module.css';

const STATUS_CLASS = {
  Enviada: styles.sent,
  Aceptada: styles.accepted,
  'En proceso': styles.progress,
  Completada: styles.completed,
  Rechazada: styles.rejected,
  Cancelada: styles.cancelled,
};

const date = (value) => value
  ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Sin fecha propuesta';

export default function RequestCard({ request, perspective, actions, busy }) {
  const person = perspective === 'worker' ? request.cliente : request.trabajador;
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.requestId}>Solicitud #{request.id_solicitud}</p>
          <h2>{request.servicio?.nombre || 'Servicio'}</h2>
          <p className={styles.person}>
            {perspective === 'worker' ? 'Cliente' : 'Trabajador'}: <strong>{person?.nombre || 'No disponible'}</strong>
          </p>
        </div>
        <span className={`${styles.status} ${STATUS_CLASS[request.estado] || ''}`}>{request.estado}</span>
      </div>
      <p className={styles.description}>{request.descripcion}</p>
      <dl className={styles.details}>
        <div><dt>Fecha deseada</dt><dd>{date(request.fecha_deseada)}</dd></div>
        <div><dt>Ubicación</dt><dd>{request.ubicacion_aprox || 'No indicada'}</dd></div>
        <div><dt>Prioridad</dt><dd>{request.urgente ? 'Urgente' : 'Normal'}</dd></div>
      </dl>
      {request.resena && (
        <div className={styles.review}>
          <span aria-label={`${request.resena.calificacion} de 5 estrellas`}>
            {'★'.repeat(request.resena.calificacion)}{'☆'.repeat(5 - request.resena.calificacion)}
          </span>
          {request.resena.comentario && <p>{request.resena.comentario}</p>}
        </div>
      )}
      {actions && <div className={styles.actions} aria-busy={busy}>{actions}</div>}
    </article>
  );
}
