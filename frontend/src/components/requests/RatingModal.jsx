import { useEffect, useRef, useState } from 'react';
import { createReview } from '../../api/requests';
import { useAuth } from '../../auth/AuthContext';
import ui from '../search/Search.module.css';
import styles from './RatingModal.module.css';

export default function RatingModal({ request, onClose, onSaved }) {
  const { session } = useAuth();
  const dialog = useRef(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current.showModal();
    return () => { dialog.current?.close(); trigger?.focus(); };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) { setError('Selecciona de 1 a 5 estrellas.'); return; }
    setBusy(true); setError('');
    try {
      const review = await createReview(request.id_solicitud, {
        calificacion: rating,
        comentario: comment.trim() || undefined,
      }, session.accessToken);
      onSaved(review);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la calificación.');
    } finally { setBusy(false); }
  };

  return (
    <dialog ref={dialog} className={styles.dialog} onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }} aria-labelledby="rating-title">
      <button className={styles.close} type="button" aria-label="Cerrar" onClick={onClose} disabled={busy}>×</button>
      <p className={styles.eyebrow}>CALIFICAR SERVICIO</p>
      <h2 id="rating-title">¿Cómo fue tu experiencia?</h2>
      <p>{request.trabajador?.nombre} · {request.servicio?.nombre}</p>
      <form onSubmit={submit} className={styles.form}>
        <fieldset className={styles.stars} disabled={busy}>
          <legend>Calificación *</legend>
          <div role="radiogroup" aria-label="Calificación en estrellas">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" role="radio" aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                className={value <= rating ? styles.starActive : styles.star}
                onClick={() => { setRating(value); setError(''); }}>★</button>
            ))}
          </div>
        </fieldset>
        <label className={ui.field}>Comentario opcional
          <textarea maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Cuéntanos qué salió bien o qué podría mejorar." />
        </label>
        <p className={styles.counter}>{comment.length}/1000</p>
        {error && <p role="alert" className={ui.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={ui.secondary} onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className={ui.primary} disabled={busy}>{busy ? 'Guardando…' : 'Publicar calificación'}</button>
        </div>
      </form>
    </dialog>
  );
}
