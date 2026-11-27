import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function getSafeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/login')) {
    return '/dashboard';
  }
  return trimmed;
}

const LoginPage: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const nextPath = useMemo(() => getSafeNextPath(searchParams.get('next')), [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isAuthenticated) {
    return <Navigate to={nextPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 min-h-[44px] px-2 text-base font-medium text-blue-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Nexus Overview</span>
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1"
            >
              <img src="/favicon.svg" alt="Nexus Solutions" className="h-12 w-12" />
              <span className="text-3xl font-bold tracking-wide text-white">
                nex<span className="text-blue-300">us</span>
              </span>
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Workspace Sign In</h1>
              <p className="text-base text-blue-100/85">
                Sign in with your provisioned Nexus Solutions account to continue.
              </p>
            </div>
          </div>

          <section className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-base flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-base font-medium text-slate-800 mb-1.5"
                >
                  Work Email or Username
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full min-h-[46px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-base font-medium text-slate-800 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[46px] px-3.5 py-2.5 rounded-lg border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 flex items-start gap-2.5 text-sm text-slate-600">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Workspace access is administrator-provisioned only. Contact your Nexus
                administrator for credentials, or{' '}
                <Link to="/request-audit" className="text-blue-700 hover:underline font-medium">
                  request a Data Convergence Audit
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
