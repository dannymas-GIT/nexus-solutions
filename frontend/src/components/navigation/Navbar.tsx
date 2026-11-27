import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User } from 'lucide-react';

interface NavSubItem {
  label: string;
  path: string;
  description?: string;
}

interface NavItem {
  label: string;
  path: string;
  matchPrefixes?: string[];
  submenu?: NavSubItem[];
}

interface NavbarProps {
  onOpenMobileSidebar?: () => void;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    label: 'Command Center',
    path: '/dashboard',
    matchPrefixes: ['/dashboard'],
  },
  {
    label: 'Idea Studio',
    path: '/idea-studio',
    matchPrefixes: ['/idea-studio', '/create-business-plan', '/my-plans', '/plan-templates'],
    submenu: [
      {
        label: 'Submit Brief',
        path: '/idea-studio/submit',
        description: 'Submit a new concept for M1/M2 validation',
      },
      {
        label: 'Milestone & Approval Inbox',
        path: '/idea-studio/inbox',
        description: 'Review M1/M2 reports and sequential approval gates',
      },
      {
        label: 'App Workspace & Staging',
        path: '/idea-studio/workspace',
        description: 'Graduated apps, sprints, and *.nexus-solutions.us staging',
      },
      {
        label: 'Strategic Plan Wizard',
        path: '/create-business-plan',
        description: '5-step plan builder with DOCX, PPTX, and PDF export',
      },
    ],
  },
  {
    label: 'Data & KPIs',
    path: '/analysis-engine/set-kpis',
    matchPrefixes: ['/analysis-engine', '/integrations'],
    submenu: [
      {
        label: 'Set KPIs',
        path: '/analysis-engine/set-kpis',
        description: 'Define and track operational KPIs',
      },
      {
        label: 'Data Sources & Integrations',
        path: '/integrations',
        description: 'Manage CRM, finance, and ops connectors',
      },
    ],
  },
  {
    label: 'Documents',
    path: '/docs',
    matchPrefixes: ['/docs'],
    submenu: [
      {
        label: 'Document Library',
        path: '/docs',
        description: 'Browse collateral, reports, and templates',
      },
      {
        label: 'Marketing Materials',
        path: '/docs/marketing',
        description: 'Value propositions and datasheets',
      },
      {
        label: 'Presentations',
        path: '/docs/presentations',
        description: 'Decks and sales scripts',
      },
    ],
  },
  {
    label: 'Administration',
    path: '/team',
    matchPrefixes: ['/team', '/tutorials', '/settings'],
    submenu: [
      {
        label: 'Team & Access',
        path: '/team',
        description: 'Manage workspace members and roles',
      },
      {
        label: 'Workspace Settings',
        path: '/settings',
        description: 'Configure workspace preferences',
      },
      {
        label: 'Guides & Tutorials',
        path: '/tutorials',
        description: 'Platform walkthroughs and documentation',
      },
    ],
  },
];

const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isSectionActive = (item: NavItem) => {
    const prefixes = item.matchPrefixes || [item.path];
    return prefixes.some(
      (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 flex items-center justify-between min-h-[4.5rem] gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open workspace navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          <Link
            to="/"
            className="lg:hidden flex items-center gap-2 min-h-[44px] pr-2 text-slate-900 font-bold text-lg"
          >
            <img src="/favicon.svg" alt="Nexus" className="h-8 w-8" />
            <span>Nexus</span>
          </Link>

          <nav
            aria-label="Workspace navigation"
            className="hidden md:flex items-center gap-1"
          >
            {NAVIGATION_ITEMS.map((item) => {
              const active = isSectionActive(item);
              return (
                <div
                  key={item.label}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.submenu ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={openDropdown === item.label}
                        onClick={() => toggleDropdown(item.label)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                          active || openDropdown === item.label
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {item.label}
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            openDropdown === item.label ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {openDropdown === item.label && (
                        <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-3 text-base text-slate-800 hover:bg-slate-50"
                            >
                              <div className="font-medium text-slate-900">{subItem.label}</div>
                              {subItem.description && (
                                <p className="text-sm text-slate-600 mt-0.5 leading-snug">
                                  {subItem.description}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`inline-flex items-center px-3.5 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Account cluster (outside primary domains) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/request-audit"
            className="hidden xl:inline-flex items-center px-4 py-2 min-h-[44px] rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-base font-medium transition-colors"
          >
            Request Audit
          </Link>

          <Link
            to="/profile"
            className={`inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
              location.pathname === '/profile'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
