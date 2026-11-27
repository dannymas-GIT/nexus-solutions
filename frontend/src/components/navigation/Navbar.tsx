import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User, Compass } from 'lucide-react';

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
  onOpenTour?: () => void;
}

const NAVIGATION_ITEMS: NavItem[] = [
  {
    label: 'Command Center',
    path: '/dashboard',
    matchPrefixes: ['/dashboard'],
  },
  {
    label: 'Data & KPIs',
    path: '/integrations',
    matchPrefixes: ['/integrations', '/analysis-engine'],
    submenu: [
      {
        label: 'Data Sources & CSV Upload',
        path: '/integrations',
        description: 'Upload CSV exports, profile numeric columns, and track sources',
      },
      {
        label: 'Corporate KPI Engine',
        path: '/analysis-engine/set-kpis',
        description: 'Define corporate KPIs and bind metrics to CSV columns',
      },
    ],
  },
  {
    label: 'Reports & Studio',
    path: '/reports',
    matchPrefixes: ['/reports', '/idea-studio', '/create-business-plan', '/my-plans', '/docs'],
    submenu: [
      {
        label: 'Executive Report Studio',
        path: '/reports',
        description: 'Build KPI reports, export PDF/DOCX/PPTX, and publish to Portal',
      },
      {
        label: 'Idea Studio',
        path: '/idea-studio',
        description: 'M1/M2 validation, approval gates, and *.nexus-solutions.us staging',
      },
      {
        label: 'Strategic Plan Wizard',
        path: '/create-business-plan',
        description: '5-step strategic plan builder with document export',
      },
      {
        label: 'Document Library',
        path: '/docs',
        description: 'Browse workspace collateral and presentations',
      },
    ],
  },
  {
    label: 'Client Portal',
    path: '/portal-manager',
    matchPrefixes: ['/portal-manager'],
  },
  {
    label: 'Administration',
    path: '/admin/users',
    matchPrefixes: ['/admin', '/team', '/tutorials', '/tour', '/settings'],
    submenu: [
      {
        label: 'Users & Access',
        path: '/admin/users',
        description: 'Manage users, protected role tiers, password resets, and audit logs',
      },
      {
        label: 'Workspace Settings',
        path: '/settings',
        description: 'Configure reporting and workspace preferences',
      },
      {
        label: 'Guides & Guided Tour',
        path: '/tutorials',
        description: 'Interactive 5-step walkthrough and operator playbooks',
      },
    ],
  },
];

const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar, onOpenTour }) => {
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

          <nav aria-label="Workspace navigation" className="hidden md:flex items-center gap-1">
            {NAVIGATION_ITEMS.map((item) => {
              const active = isSectionActive(item);
              return (
                <div key={item.label} className="relative" onClick={(e) => e.stopPropagation()}>
                  {item.submenu ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={openDropdown === item.label}
                        onClick={() => toggleDropdown(item.label)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                          active || openDropdown === item.label
                            ? 'bg-blue-50 text-blue-800'
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
                        <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
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
                          ? 'bg-blue-50 text-blue-800'
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

        {/* Account & Help cluster (outside primary domains) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenTour && (
            <button
              type="button"
              onClick={onOpenTour}
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 text-base font-medium transition-colors"
            >
              <Compass className="h-4 w-4" />
              <span>Guided tour</span>
            </button>
          )}

          <Link
            to="/profile"
            className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
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
