import { useState } from 'react';
import Logo from '../components/Logo';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { MailIcon, LockIcon } from '../components/icons/Icons';
import { Link } from '../router';
import authStyles from '../styles/auth.module.css';
import styles from './Login.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  if (!value.trim()) return 'El correo electrónico es obligatorio.';
  if (!EMAIL_REGEX.test(value.trim())) return 'El correo electrónico no es válido.';
  return '';
}

function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria.';
  return '';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
  };

  const emailIsValid = touched.email && !errors.email && email.trim() !== '';
  const showEmailError = touched.email && errors.email;
  const showPasswordError = touched.password && errors.password;

  return (
    <div className={authStyles.card}>
      <Logo />

      <header className={authStyles.header}>
        <h1 className={authStyles.title}>Iniciar sesión</h1>
        <p className={authStyles.subtitle}>
          Ingresa tus datos para acceder a tu cuenta.
        </p>
      </header>

      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          icon={MailIcon}
          error={showEmailError ? errors.email : ''}
          success={emailIsValid}
          autoComplete="email"
          disabled={loading}
        />

        <PasswordInput
          id="login-password"
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          icon={LockIcon}
          error={showPasswordError ? errors.password : ''}
          autoComplete="current-password"
          disabled={loading}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
        />

        <div className={styles.options}>
          <Checkbox
            id="remember"
            label="Recordarme"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
          />
          <a href="#" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <Button type="submit" loading={loading} disabled={loading}>
          Iniciar sesión
        </Button>
      </form>

      <p className={authStyles.footer}>
        ¿No tienes una cuenta?{' '}
        <Link to="/register" className={authStyles.footerLink}>
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
