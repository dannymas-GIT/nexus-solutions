import React from 'react';
import { Link } from 'react-router-dom';
import { X, Compass, User } from 'lucide-react';

export interface MobileNavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  matchPrefixes?: string[];
}

interface MobileNavProps {
  open: boolean;
  onClose?: () => void;
  onOpenTour?: () => void;
  primaryItems: MobileNavItem[];
  adminItems: MobileNavItem[];
  isActive: (item: MobileNavItem) => boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({
  open,
  onClose,
  onOpenTour,
  primaryItems,
  adminItems,
  isActive,
}) => {
  if (!open) return null;

  const renderLinks = (items: MobileNavItem[]) => (
    <ul className="space-y-1 px-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.path}>
            <Link
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                active
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Workspace navigation">
      <div
        className="fixed inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-white border-r border-slate-200 shadow-xl">
        <div className="flex items-center justify-between min-h-[4.5rem] px-4 border-b border-slate-200">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 min-h-[44px]">
            <img src="/favicon.svg" alt="Nexus Solutions" className="h-9 w-9 shrink-0" />
            <span className="text-xl font-bold tracking-wide text-slate-900">
              nex<span className="text-blue-600">us</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Close workspace navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Mobile workspace navigation" className="flex-1 overflow-y-auto py-4 space-y-6">
          <div>
            <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </p>
            {renderLinks(primaryItems)}
          </div>

          <div>
            <p className="px-4 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>
            {renderLinks(adminItems)}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-3 space-y-1">
          {onOpenTour && (
            <button
              type="button"
              onClick={onOpenTour}
              className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium text-blue-800 hover:bg-blue-50"
            >
              <Compass size={20} className="shrink-0" />
              <span>Guided tour</span>
            </button>
          )}
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            <User size={20} className="shrink-0" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
