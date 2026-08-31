import { useState } from 'react';
import Logo from '../components/Logo';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import { UserIcon, MailIcon, LockIcon, PhoneIcon } from '../components/icons/Icons';
import { Link, useNavigate } from '../router';
import { useAuth } from '../auth/AuthContext';
import authStyles from '../styles/auth.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s()-]{7,20}$/;

function validateName(value) {
  if (!value.trim()) return 'El nombre completo es obligatorio.';
  return '';
}

function validateEmail(value) {
  if (!value.trim()) return 'El correo electrónico es obligatorio.';
  if (!EMAIL_REGEX.test(value.trim())) return 'El correo electrónico no es válido.';
  return '';
}

function validatePhone(value) {
  if (!value.trim()) return '';
  if (!PHONE_REGEX.test(value.trim())) return 'Ingresa un teléfono válido.';
  return '';
}

function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  return '';
}

function validateConfirmPassword(value, password) {
  if (!value) return 'Debes confirmar tu contraseña.';
  if (value !== password) return 'Las contraseñas no coinciden.';
  return '';
}

const INITIAL_ERRORS = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const INITIAL_TOUCHED = {
  name: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
};

export default function Register({ mode = 'cliente' }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNameBlur = () => {
    markTouched('name');
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  };

  const handleEmailBlur = () => {
    markTouched('email');
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePhoneBlur = () => {
    markTouched('phone');
    setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
  };

  const handlePasswordBlur = () => {
    markTouched('password');
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(password),
      confirmPassword: touched.confirmPassword
        ? validateConfirmPassword(confirmPassword, password)
        : prev.confirmPassword,
    }));
  };

  const handleConfirmPasswordBlur = () => {
    markTouched('confirmPassword');
    setErrors((prev) => ({
      ...prev,
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };

    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });
    setErrors(nextErrors);
    setFormError('');

    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await register({
        nombre: name.trim(),
        correo: email.trim(),
        telefono: phone.trim() || undefined,
        password,
        modo: mode === 'worker' ? 'trabajador' : 'cliente',
      });
      sessionStorage.setItem(
        'oficiosya.registerSuccess',
        JSON.stringify({ correo: email.trim() }),
      );
      navigate('/login', { replace: true });
    } catch (error) {
      setFormError(error.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const emailIsValid = touched.email && !errors.email && email.trim() !== '';

  return (
    <div className={authStyles.card}>
      <Logo />

      <header className={authStyles.header}>
        <h1 className={authStyles.title}>Crear cuenta</h1>
        <p className={authStyles.subtitle}>
          Completa tus datos para comenzar.
        </p>
      </header>

      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={authStyles.formError} role="alert">
            {formError}
          </p>
        )}

        <Input
          id="register-name"
          label="Nombre completo"
          type="text"
          placeholder="Tu nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          icon={UserIcon}
          error={touched.name && errors.name ? errors.name : ''}
          autoComplete="name"
          disabled={loading}
        />

        <Input
          id="register-email"
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          icon={MailIcon}
          error={touched.email && errors.email ? errors.email : ''}
          success={emailIsValid}
          autoComplete="email"
          disabled={loading}
        />

        <Input
          id="register-phone"
          label="Teléfono (opcional)"
          type="tel"
          placeholder="Ej. 7000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={handlePhoneBlur}
          icon={PhoneIcon}
          error={touched.phone && errors.phone ? errors.phone : ''}
          autoComplete="tel"
          disabled={loading}
        />

        <PasswordInput
          id="register-password"
          label="Contraseña"
          placeholder="Crea una contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          icon={LockIcon}
          error={touched.password && errors.password ? errors.password : ''}
          autoComplete="new-password"
          disabled={loading}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
        />

        <PasswordInput
          id="register-confirm-password"
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={handleConfirmPasswordBlur}
          icon={LockIcon}
          error={
            touched.confirmPassword && errors.confirmPassword
              ? errors.confirmPassword
              : ''
          }
          autoComplete="new-password"
          disabled={loading}
          showPassword={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
        />

        <Button type="submit" loading={loading} disabled={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className={authStyles.footer}>
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" className={authStyles.footerLink}>
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
