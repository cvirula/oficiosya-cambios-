import { useCallback, useEffect, useState } from 'react';
import AppHeader from '../components/AppHeader';
import BackLink from '../components/BackLink';
import Button from '../components/ui/Button';
import { useAuth } from '../auth/AuthContext';
import { getWorkerProfile } from '../api/worker';
import { deletePortfolioPhoto, listPortfolio, uploadPortfolioPhoto } from '../api/portfolio';
import { createService, deleteService, listCategories, listMyServices, updateService } from '../api/offerings';
import { listReviews, replyToReview } from '../api/reviews';
import styles from './WorkerContent.module.css';

const emptyService = { nombre: '', descripcion: '', id_categoria: '', activo: true };

export default function WorkerContent() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [service, setService] = useState(emptyService);
  const [file, setFile] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [reply, setReply] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const current = await getWorkerProfile(token);
      setProfile(current);
      if (!current.id_perfil) return;
      const [serviceRows, categoryRows, photoRows, reviewRows] = await Promise.all([
        listMyServices(current.id_perfil, token),
        listCategories(),
        listPortfolio(token),
        listReviews({ id_trabajador: current.id_perfil, order: 'fecha:desc' }, token),
      ]);
      setServices(serviceRows);
      setCategories(categoryRows);
      setPhotos(photoRows);
      setReviews(reviewRows);
    } catch (err) {
      setError(err.message || 'No se pudo cargar tu contenido.');
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const run = async (key, action, message) => {
    setBusy(key); setError(''); setSuccess('');
    try { await action(); setSuccess(message); await load(); }
    catch (err) { setError(err.message || 'No se pudo completar la operación.'); }
    finally { setBusy(''); }
  };

  const addService = (event) => {
    event.preventDefault();
    if (!profile?.id_perfil || service.nombre.trim().length < 2 || !service.id_categoria) {
      setError('Escribe el servicio y selecciona una categoría.'); return;
    }
    run('service-new', async () => {
      await createService({
        id_perfil: profile.id_perfil,
        id_categoria: Number(service.id_categoria),
        nombre: service.nombre.trim(),
        descripcion: service.descripcion.trim() || null,
        activo: true,
      }, token);
      setService(emptyService);
    }, 'Servicio agregado.');
  };

  const upload = (event) => {
    event.preventDefault();
    if (!file) { setError('Selecciona una imagen.'); return; }
    run('photo-new', async () => {
      await uploadPortfolioPhoto({ file, titulo: photoTitle.trim(), descripcion: photoDescription.trim(), token });
      setFile(null); setPhotoTitle(''); setPhotoDescription('');
      event.target.reset();
    }, 'Foto agregada al portafolio.');
  };

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        <BackLink to="/worker/profile">Volver a mi oferta</BackLink>
        <header><p className={styles.eyebrow}>MI OFERTA</p><h1>Servicios, portafolio y reseñas</h1><p>Administra lo que ven tus clientes.</p></header>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {success && <p className={styles.success} role="status">{success}</p>}

        <section className={styles.card}>
          <h2>Servicios ofrecidos</h2>
          <form className={styles.form} onSubmit={addService}>
            <input aria-label="Nombre del servicio" placeholder="Ej. Instalación eléctrica" value={service.nombre} onChange={(e) => setService((v) => ({ ...v, nombre: e.target.value }))} />
            <select aria-label="Categoría" value={service.id_categoria} onChange={(e) => setService((v) => ({ ...v, id_categoria: e.target.value }))}>
              <option value="">Selecciona una categoría</option>
              {categories.map((item) => <option key={item.id_categoria} value={item.id_categoria}>{item.nombre}</option>)}
            </select>
            <textarea aria-label="Descripción" placeholder="Descripción breve" value={service.descripcion} onChange={(e) => setService((v) => ({ ...v, descripcion: e.target.value }))} />
            <Button loading={busy === 'service-new'} disabled={Boolean(busy)}>Agregar servicio</Button>
          </form>
          <ul className={styles.list}>{services.map((item) => <li key={item.id_servicio}>
            <div><strong>{item.nombre}</strong><p>{item.descripcion || 'Sin descripción'} · {item.activo ? 'Activo' : 'Pausado'}</p></div>
            <div className={styles.actions}>
              <button type="button" onClick={() => run(`service-${item.id_servicio}`, () => updateService(item.id_servicio, { activo: !item.activo }, token), item.activo ? 'Servicio pausado.' : 'Servicio reactivado.')}>{item.activo ? 'Pausar' : 'Reactivar'}</button>
              <button type="button" className={styles.danger} onClick={() => run(`service-${item.id_servicio}`, () => deleteService(item.id_servicio, token), 'Servicio eliminado.')}>Eliminar</button>
            </div>
          </li>)}</ul>
        </section>

        <section className={styles.card}>
          <h2>Portafolio</h2>
          <form className={styles.form} onSubmit={upload}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <input placeholder="Título del trabajo" value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} />
            <textarea placeholder="Descripción" value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)} />
            <Button loading={busy === 'photo-new'} disabled={Boolean(busy)}>Subir fotografía</Button>
          </form>
          <div className={styles.gallery}>{photos.map((item) => <article key={item.id_elemento}>
            <img src={item.imagen_thumb_url || item.imagen_url} alt={item.titulo || 'Trabajo realizado'} loading="lazy" />
            <strong>{item.titulo}</strong><p>{item.descripcion}</p>
            <button type="button" className={styles.danger} onClick={() => run(`photo-${item.id_elemento}`, () => deletePortfolioPhoto(item.id_elemento, token), 'Foto eliminada.')}>Eliminar</button>
          </article>)}</div>
        </section>

        <section className={styles.card}>
          <h2>Reseñas recibidas</h2>
          <ul className={styles.list}>{reviews.map((item) => {
            const answered = item.respuesta_trabajador || item.respuesta;
            return <li key={item.id_resena}><div><strong>{'★'.repeat(Number(item.calificacion) || 0)}</strong><p>{item.comentario || 'Sin comentario'}</p>{answered && <p><b>Tu respuesta:</b> {answered}</p>}</div>
              {!answered && <form className={styles.reply} onSubmit={(e) => { e.preventDefault(); run(`review-${item.id_resena}`, () => replyToReview(item.id_resena, reply[item.id_resena] || '', token), 'Respuesta publicada.'); }}>
                <input minLength="2" maxLength="1000" required placeholder="Responder públicamente" value={reply[item.id_resena] || ''} onChange={(e) => setReply((v) => ({ ...v, [item.id_resena]: e.target.value }))} />
                <button>Responder</button>
              </form>}
            </li>;
          })}</ul>
        </section>
      </main>
    </div>
  );
}
