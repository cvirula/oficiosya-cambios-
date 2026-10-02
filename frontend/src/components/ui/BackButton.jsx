import { Link } from '../../router';
import styles from './BackButton.module.css';

export default function BackButton({ to = '/', children = 'Regresar' }) {
  return (
    <Link to={to} className={styles.back} aria-label={children}>
      <span aria-hidden="true">←</span>
      <span>{children}</span>
    </Link>
  );
}
