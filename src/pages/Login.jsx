import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token, data.user);
      toast.success('Welcome back');
      const isAdmin = data.user.role === 'superadmin';
      if (isAdmin) {
        navigate('/admin', { replace: true });
        return;
      }
      const dest =
        from && typeof from === 'string' && !from.startsWith('/admin') && from !== '/login'
          ? from
          : '/';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-theme-page relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent" />
      <div className="glass-panel relative w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-2xl font-bold text-white shadow-xl">
            R
          </div>
          <h1 className="font-admin text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Super Admin or Business Owner</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
            <input
              className="input-field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Password</label>
            <input
              className="input-field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary mt-2 w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-500">
          Business owner accounts are issued by the platform admin.{' '}
          <Link
            to="/signup"
            className="font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Why no signup?
          </Link>
        </p>
      </div>
    </div>
  );
}
