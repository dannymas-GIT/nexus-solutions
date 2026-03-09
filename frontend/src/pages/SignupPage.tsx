import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/navigation/NavBar';

const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pathParam = searchParams.get('path'); // launch | intelligence
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onboardingPath =
    pathParam === 'launch' || pathParam === 'intelligence' ? pathParam : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName || undefined, onboardingPath);
      if (onboardingPath === 'launch') navigate('/onboarding/launch', { replace: true });
      else if (onboardingPath === 'intelligence') navigate('/onboarding/intelligence', { replace: true });
      else navigate('/choose-workspace', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="relative z-10 container mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Create account</h1>
            {onboardingPath && (
              <p className="text-blue-200/90 text-sm text-center mb-4">
                Signing up for Nexus {onboardingPath === 'launch' ? 'Launch' : 'Intelligence'}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-red-300 text-sm bg-red-900/30 px-3 py-2 rounded-lg">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Full name (optional)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:ring-2 focus:ring-indigo-400"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:ring-2 focus:ring-indigo-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/60 focus:ring-2 focus:ring-indigo-400"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <p className="mt-6 text-center text-blue-200/90 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-300 hover:text-indigo-200 underline"
              >
                Sign in
              </button>
            </p>
          </div>
          <p className="mt-8 text-blue-300/80 text-sm">
            <button onClick={() => navigate('/')} className="hover:text-blue-200 underline">
              Back to Nexus
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
