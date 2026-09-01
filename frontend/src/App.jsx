import { useEffect, useState } from 'react';
import AuthLayout from './components/auth/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import WorkerProfile from './pages/WorkerProfile';
import { Router, useNavigate, usePath } from './router';
import { AuthProvider, useAuth } from './auth/AuthContext';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

function AppRoutes({ mode, onModeChange }) {
  const path = usePath();
  const navigate = useNavigate();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (isAuthenticated && AUTH_PATHS.has(path)) {
      navigate('/', { replace: true });
      return;
    }

    if (!isAuthenticated && !AUTH_PATHS.has(path)) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, path, ready]);

  if (!ready) {
    return <div style={{ minHeight: '100vh', background: '#ffffff' }} />;
  }

  if (isAuthenticated && !AUTH_PATHS.has(path)) {
    if (path === '/worker/profile') {
      return <WorkerProfile />;
    }
    return <Home />;
  }

  const content =
    path === '/register' ? (
      <Register mode={mode} />
    ) : path === '/forgot-password' ? (
      <ForgotPassword />
    ) : path === '/reset-password' ? (
      <ResetPassword />
    ) : (
      <Login />
    );

  return (
    <AuthLayout mode={mode} onModeChange={onModeChange}>
      {content}
    </AuthLayout>
  );
}

export default function App() {
  const [mode, setMode] = useState('client');

  return (
    <AuthProvider>
      <Router>
        <AppRoutes mode={mode} onModeChange={setMode} />
      </Router>
    </AuthProvider>
  );
}
