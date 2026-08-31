import { useAuth } from '../auth/AuthContext';
import styles from './Home.module.css';

export default function Home() {
  const { logout } = useAuth();

  return (
    <div className={styles.page}>
      <button type="button" className={styles.logout} onClick={() => logout()}>
        Cerrar sesión
      </button>
      <div className={styles.welcome}>
        <h1>Bienvenido</h1>
        <h1>OficiosYA</h1>
      </div>
    </div>
  );
}
