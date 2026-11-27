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
  Compass,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import MobileNav, { type MobileNavItem } from './MobileNav';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenTour?: () => void;
}

const PRIMARY_ITEMS: MobileNavItem[] = [
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

const ADMIN_ITEMS: MobileNavItem[] = [
  {
    icon: <Users size={20} />,
    label: 'Users & Access',
    path: '/admin/users',
    matchPrefixes: ['/admin', '/team'],
  },
  {
    icon: <Settings size={20} />,
    label: 'Settings',
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile, onOpenTour }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: MobileNavItem) => {
    const prefixes = item.matchPrefixes || [item.path];
    return prefixes.some(
      (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );
  };

  const renderLinks = (items: MobileNavItem[]) => (
    <ul className="space-y-1 px-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'gap-3'
              } px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <aside className="hidden lg:flex h-full shrink-0">
        <div
          className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-200 ${
            collapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="flex items-center justify-between min-h-[4.5rem] px-4 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-2.5 min-h-[44px]">
              <img src="/favicon.svg" alt="Nexus Solutions" className="h-9 w-9 shrink-0" />
              {!collapsed && (
                <span className="text-xl font-bold tracking-wide text-slate-900">
                  nex<span className="text-blue-600">us</span>
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav aria-label="Sidebar navigation" className="flex-1 overflow-y-auto py-4 space-y-6">
            <div>
              {!collapsed && (
                <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Workspace
                </p>
              )}
              {renderLinks(PRIMARY_ITEMS)}
            </div>

            <div>
              {!collapsed && (
                <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Administration
                </p>
              )}
              {renderLinks(ADMIN_ITEMS)}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-3 space-y-1">
            {onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center' : 'gap-3'
                } px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium text-blue-800 hover:bg-blue-50`}
                title={collapsed ? 'Guided tour' : undefined}
              >
                <Compass size={20} className="shrink-0" />
                {!collapsed && <span>Guided tour</span>}
              </button>
            )}
            <Link
              to="/profile"
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'gap-3'
              } px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100`}
            >
              <User size={20} className="shrink-0" />
              {!collapsed && <span>Profile</span>}
            </Link>
          </div>
        </div>
      </aside>

      <MobileNav
        open={mobileOpen}
        onClose={onCloseMobile}
        onOpenTour={onOpenTour}
        primaryItems={PRIMARY_ITEMS}
        adminItems={ADMIN_ITEMS}
        isActive={isActive}
      />
    </>
  );
};

export default Sidebar;
