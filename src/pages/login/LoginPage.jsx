import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import PinedaLogo from '../../components/layout/PinedaLogo';
import { useAuth } from '../../context/AuthContext';
import { APP_PATHS } from '../../config/appConfig';

export default function LoginPage() {
  const { login, isAuthenticated, loading: sessionLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (sessionLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-500">Cargando…</div>;
  }
  if (isAuthenticated) {
    const redirectTo = location.state?.from || APP_PATHS.facturacion;
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || APP_PATHS.facturacion, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <PinedaLogo />
        </div>
        <h1 className="mb-1 text-center text-lg font-bold text-slate-950">Iniciar sesión</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Reporte de facturación</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            <div className="mt-1 flex items-center rounded-md border border-slate-200 px-3">
              <Mail size={16} className="text-slate-400" />
              <input
                type="email"
                required
                autoComplete="username"
                placeholder='Email'
                className="h-11 w-full border-0 bg-transparent px-2 text-sm text-slate-950 outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <div className="mt-1 flex items-center rounded-md border border-slate-200 px-3">
              <Lock size={16} className="text-slate-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder='Contraseña'
                className="h-11 w-full border-0 bg-transparent px-2 text-sm text-slate-950 outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-md bg-red-700 text-sm font-bold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
