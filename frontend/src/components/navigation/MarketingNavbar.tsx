import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, LogIn } from 'lucide-react';

const PUBLIC_LINKS = [
  { label: 'Overview', path: '/' },
  { label: 'Corporate Services', path: '/services' },
];

const MarketingNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5rem] py-3 gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md"
          >
            <img
              src="/favicon.svg"
              alt="Nexus Solutions"
              className="h-10 w-10 shrink-0"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold tracking-wide text-white">
                nex<span className="text-blue-300">us</span>
                <span className="font-normal text-blue-200/80 ml-1.5 text-base hidden sm:inline">
                  Solutions
                </span>
              </span>
              <span className="text-sm text-blue-200/80 hidden md:block">
                Where data converges, insight emerges.
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-2"
          >
            {PUBLIC_LINKS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2.5 min-h-[44px] inline-flex items-center rounded-lg text-base font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border text-base font-medium transition-colors ${
                location.pathname === '/login'
                  ? 'border-blue-400 bg-white/15 text-white'
                  : 'border-white/25 bg-white/5 hover:bg-white/15 text-blue-100 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
            <Link
              to="/request-audit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-base font-semibold shadow-sm transition-colors"
            >
              Request Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg text-blue-100 hover:bg-white/10"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-950 px-4 py-4 space-y-2">
          {PUBLIC_LINKS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 min-h-[44px] rounded-lg text-base font-medium ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[44px] rounded-lg border border-white/25 bg-white/5 hover:bg-white/15 text-white text-base font-medium"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
          <Link
            to="/request-audit"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 min-h-[44px] rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-base font-semibold"
          >
            Request Data Audit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
};

export default MarketingNavbar;
