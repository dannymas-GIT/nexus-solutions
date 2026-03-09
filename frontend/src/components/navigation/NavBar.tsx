import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Bell, User, HelpCircle, Rocket, Database } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  submenu?: { label: string; path: string; description?: string }[];
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setWorkspace, isLaunch, isIntelligence } = useWorkspace();
  const { user, logout } = useAuth();

  // Launch workspace navigation
  const launchNavItems: NavItem[] = [
    { label: 'Launch', path: '/launch' },
    {
      label: 'Business Plans',
      path: '/create-business-plan',
      submenu: [
        { label: 'Create New Plan', path: '/create-business-plan', description: 'Step-by-step wizard' },
        { label: 'My Plans', path: '/my-plans', description: 'View and edit saved plans' },
        { label: 'Templates', path: '/plan-templates', description: 'Pre-made templates' },
      ],
    },
    {
      label: 'Documents',
      path: '/docs',
      submenu: [
        { label: 'Marketing', path: '/docs/marketing' },
        { label: 'Case Studies', path: '/docs/case-studies' },
        { label: 'Presentations', path: '/docs/presentations' },
      ],
    },
  ];

  // Intelligence workspace navigation
  const intelligenceNavItems: NavItem[] = [
    { label: 'Intelligence', path: '/intelligence' },
    { label: 'Integrations', path: '/integrations' },
    {
      label: 'Analysis Engine',
      path: '/analysis-engine/set-kpis',
      submenu: [
        { label: 'Set KPIs', path: '/analysis-engine/set-kpis', description: 'Define KPIs' },
      ],
    },
    {
      label: 'Documents',
      path: '/docs',
      submenu: [
        { label: 'Marketing', path: '/docs/marketing' },
        { label: 'Case Studies', path: '/docs/case-studies' },
        { label: 'Presentations', path: '/docs/presentations' },
      ],
    },
  ];

  // Shared navigation (when in app, show workspace-specific + shared)
  const sharedNavItems: NavItem[] = [
    {
      label: 'Settings',
      path: '/settings',
      submenu: [
        { label: 'Team', path: '/team', description: 'Users and permissions' },
        { label: 'Tutorials', path: '/tutorials', description: 'Help and guides' },
        { label: 'Integrations', path: '/integrations', description: 'Connect tools' },
        { label: 'Account', path: '/settings', description: 'Profile and preferences' },
      ],
    },
  ];

  const navigationItems: NavItem[] = isLaunch
    ? [...launchNavItems, ...sharedNavItems]
    : isIntelligence
      ? [...intelligenceNavItems, ...sharedNavItems]
      : [
          { label: 'Dashboard', path: '/dashboard' },
          {
            label: 'Documents',
            path: '/docs',
            submenu: [
              { label: 'Marketing', path: '/docs/marketing' },
              { label: 'Case Studies', path: '/docs/case-studies' },
              { label: 'Presentations', path: '/docs/presentations' },
            ],
          },
          ...sharedNavItems,
        ];

  const handleSwitchWorkspace = () => {
    setWorkspace(null);
    navigate('/choose-workspace');
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };
  const handleDropdownClick = (e: React.MouseEvent) => e.stopPropagation();

  const showAppNav = location.pathname !== '/' && location.pathname !== '/choose-workspace';
  const isPublicPage = ['/', '/login', '/signup', '/launch-landing', '/intelligence-landing'].includes(location.pathname);

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white shadow-md">
      <div className="mx-auto px-4 sm:px-6 lg:pl-0 lg:pr-6">
        <div className="flex justify-between h-28">
          <div className="flex items-center h-full">
            {location.pathname === '/' && (
              <Link to="/" className="flex flex-col items-start ml-24 mr-24">
                <img className="w-80 h-20" src="/images/logo-light.png" alt="Nexus" />
                <p className="text-lg w-80 text-center text-black italic font-medium font-serif leading-none">
                  Where data converges, insight emerges.
                </p>
              </Link>
            )}

            {showAppNav && (
              <>
                <div className="hidden md:flex items-center h-full space-x-1">
                  {navigationItems.map((item) => (
                    <div key={item.label} className="relative h-full flex items-center" onClick={handleDropdownClick}>
                      {item.submenu ? (
                        <div className="h-full flex items-center">
                          <button
                            onClick={() => toggleDropdown(item.label)}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                              location.pathname.startsWith(item.path) || openDropdown === item.label
                                ? 'text-blue-600'
                                : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
                            }`}
                          >
                            {item.label}
                            <ChevronDown size={16} className={`ml-1 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                          </button>
                          {openDropdown === item.label && (
                            <div className="absolute top-full left-0 w-60 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
                              {item.submenu!.map((sub) => (
                                <Link
                                  key={sub.path}
                                  to={sub.path}
                                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <div className="font-medium">{sub.label}</div>
                                  {sub.description && <p className="text-xs text-gray-500 mt-1">{sub.description}</p>}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          to={item.path}
                          className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                            location.pathname === item.path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4 pr-6">
            {/* Public pages: show Log in + Create account when not logged in, or Continue when logged in */}
            {isPublicPage && (
              <div className="flex items-center gap-3">
                {user ? (
                  <Link
                    to="/choose-workspace"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue to app
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}

            {showAppNav && user && (
              <button
                onClick={handleSwitchWorkspace}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Switch workspace"
              >
                {isLaunch ? <Rocket size={16} /> : isIntelligence ? <Database size={16} /> : null}
                <span>{isLaunch ? 'Launch' : isIntelligence ? 'Intelligence' : 'Switch'}</span>
                <ChevronDown size={14} />
              </button>
            )}

            {showAppNav && user && (
              <>
                <div className="hidden md:flex relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-3 py-1.5 w-56 text-sm bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                  <Bell size={20} />
                </button>
                <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
                  <HelpCircle size={20} />
                </button>
                <div className="relative ml-3">
                  <button
                    className="flex items-center bg-gray-100 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                    onClick={() => toggleDropdown('profile')}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <User size={18} />
                    </div>
                  </button>
                  {openDropdown === 'profile' && (
                    <div
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
                      onClick={handleDropdownClick}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.full_name || user.email || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Your Profile
                      </Link>
                      <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Settings
                      </Link>
                      <button
                        onClick={handleSwitchWorkspace}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Switch workspace
                      </button>
                      <button
                        onClick={() => { logout(); navigate('/'); setOpenDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-500 hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isOpen && showAppNav && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {navigationItems.map((item) => (
            <div key={item.label}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className="w-full flex justify-between items-center px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    {item.label}
                    <ChevronDown size={16} className={openDropdown === item.label ? 'rotate-180' : ''} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="pl-4 space-y-1 mt-1">
                      {item.submenu!.map((sub) => (
                        <Link key={sub.path} to={sub.path} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path ? 'text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
