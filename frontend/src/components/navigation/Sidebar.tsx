import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Database,
  BarChart3,
  FolderOpen,
  Send,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  User,
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  matchPrefixes?: string[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const PRIMARY_ITEMS: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    label: 'Command Center',
    path: '/dashboard',
  },
  {
    icon: <Database size={20} />,
    label: 'Data Sources',
    path: '/integrations',
  },
  {
    icon: <BarChart3 size={20} />,
    label: 'KPI Engine',
    path: '/analysis-engine/set-kpis',
    matchPrefixes: ['/analysis-engine'],
  },
  {
    icon: <FileText size={20} />,
    label: 'Report Studio',
    path: '/reports',
  },
  {
    icon: <Send size={20} />,
    label: 'Client Portal',
    path: '/portal-manager',
  },
  {
    icon: <Lightbulb size={20} />,
    label: 'Idea Studio',
    path: '/idea-studio',
    matchPrefixes: ['/idea-studio', '/my-plans', '/create-business-plan', '/plan-templates'],
  },
  {
    icon: <FolderOpen size={20} />,
    label: 'Documents',
    path: '/docs',
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    icon: <Users size={20} />,
    label: 'Team & Access',
    path: '/team',
  },
  {
    icon: <Settings size={20} />,
    label: 'Settings',
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: NavItem) => {
    const prefixes = item.matchPrefixes || [item.path];
    return prefixes.some(
      (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );
  };

  const renderLinks = (items: NavItem[], isMobile: boolean) => (
    <ul className="space-y-1 px-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={isMobile ? onCloseMobile : undefined}
              className={`flex items-center ${
                !isMobile && collapsed ? 'justify-center' : 'gap-3'
              } px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={!isMobile && collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {(isMobile || !collapsed) && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const sidebarContent = (isMobile: boolean) => (
    <div
      className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-200 ${
        !isMobile && collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between min-h-[4.5rem] px-4 border-b border-slate-200">
        <Link
          to="/"
          onClick={isMobile ? onCloseMobile : undefined}
          className="flex items-center gap-2.5 min-h-[44px]"
        >
          <img src="/favicon.svg" alt="Nexus Solutions" className="h-9 w-9 shrink-0" />
          {(isMobile || !collapsed) && (
            <span className="text-xl font-bold tracking-wide text-slate-900">
              nex<span className="text-blue-600">us</span>
            </span>
          )}
        </Link>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close workspace navigation"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto py-4 space-y-6">
        <div>
          {(isMobile || !collapsed) && (
            <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </p>
          )}
          {renderLinks(PRIMARY_ITEMS, isMobile)}
        </div>

        <div>
          {(isMobile || !collapsed) && (
            <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>
          )}
          {renderLinks(ADMIN_ITEMS, isMobile)}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link
          to="/profile"
          onClick={isMobile ? onCloseMobile : undefined}
          className={`flex items-center ${
            !isMobile && collapsed ? 'justify-center' : 'gap-3'
          } px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100`}
        >
          <User size={20} className="shrink-0" />
          {(isMobile || !collapsed) && <span>Profile</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex h-full shrink-0">{sidebarContent(false)}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{sidebarContent(true)}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
