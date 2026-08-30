import { useEffect, useState } from 'react';
import AuthLayout from './components/auth/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import { Router, useNavigate, usePath } from './router';

const AUTH_PATHS = new Set(['/login', '/register']);

function AuthRoutes({ mode, onModeChange }) {
  const path = usePath();
  const navigate = useNavigate();

  useEffect(() => {
    if (!AUTH_PATHS.has(path)) {
      navigate('/login', { replace: true });
    }
  }, [path, navigate]);

  const content = path === '/register' ? <Register /> : <Login />;

  return (
    <AuthLayout mode={mode} onModeChange={onModeChange}>
      {content}
    </AuthLayout>
  );
}

export default function App() {
  const [mode, setMode] = useState('client');

  return (
    <Router>
      <AuthRoutes mode={mode} onModeChange={setMode} />
    </Router>
  );
}
