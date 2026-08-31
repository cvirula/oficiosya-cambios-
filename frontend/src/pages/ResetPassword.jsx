import { useMemo, useState } from 'react';
import Logo from '../components/Logo';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import { LockIcon } from '../components/icons/Icons';
import { Link, useNavigate } from '../router';
import { useAuth } from '../auth/AuthContext';
import authStyles from '../styles/auth.module.css';

function readRecoveryTokens() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const search = new URLSearchParams(window.location.search);
  return {
    accessToken: hash.get('access_token') || search.get('access_token') || '',
    refreshToken: hash.get('refresh_token') || search.get('refresh_token') || '',
    type: hash.get('type') || search.get('type') || '',
  };
}

function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return '';
}

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const tokens = useMemo(() => readRecoveryTokens(), []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(
    tokens.accessToken ? '' : 'Abre el enlace que enviamos a tu correo para continuar.',
  );
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(password);
    const confirmError = !confirmPassword
      ? 'Debes confirmar tu contraseña.'
      : password !== confirmPassword
        ? 'Las contraseñas no coinciden.'
        : '';

    setErrors({ password: passwordError, confirmPassword: confirmError });
    setFormError(tokens.accessToken ? '' : 'Abre el enlace que enviamos a tu correo para continuar.');
    setSuccess('');
    if (passwordError || confirmError || !tokens.accessToken) return;

    setLoading(true);
    try {
      const data = await resetPassword({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        password,
      });
      setSuccess(data.message || 'La contraseña se restableció correctamente.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (error) {
      setFormError(error.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={authStyles.card}>
      <Logo />

      <header className={authStyles.header}>
        <h1 className={authStyles.title}>Nueva contraseña</h1>
        <p className={authStyles.subtitle}>
          Elige una contraseña nueva para tu cuenta.
        </p>
      </header>

      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={authStyles.formError} role="alert">
            {formError}
          </p>
        )}
        {success && (
          <p className={authStyles.formSuccess} role="status">
            {success}
          </p>
        )}

        <PasswordInput
          id="reset-password"
          label="Nueva contraseña"
          placeholder="Crea una contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={LockIcon}
          error={errors.password}
          autoComplete="new-password"
          disabled={loading || !tokens.accessToken}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
        />

        <PasswordInput
          id="reset-confirm-password"
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={LockIcon}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={loading || !tokens.accessToken}
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
        />

        <Button type="submit" loading={loading} disabled={loading || !tokens.accessToken}>
          Guardar contraseña
        </Button>
      </form>

      <p className={authStyles.footer}>
        <Link to="/login" className={authStyles.footerLink}>
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
