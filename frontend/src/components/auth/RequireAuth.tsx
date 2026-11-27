import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/services/authApi';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Protects workspace routes so unauthenticated visitors are redirected to /login?next=<path>
 * without ever rendering the workspace Sidebar or Navbar.
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const hasToken = Boolean(getAuthToken());

  const nextPath = `${location.pathname}${location.search}${location.hash}`;

  if (!hasToken) {
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-blue-400/30 border-t-blue-400 animate-spin"
            aria-hidden="true"
          />
          <p className="text-lg text-blue-100 font-medium">Verifying your Nexus session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
