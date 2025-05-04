import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu,
  X,
  ChevronDown,
  Search,
  Bell,
  User,
  MessageSquare,
  HelpCircle,
  Settings,
  Users,
  BookOpen,
  Link as LinkIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  submenu?: {
    label: string;
    path: string;
    description?: string;
  }[];
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  // Navigation items with dropdown submenus - RESTRUCTURED & REORDERED
  const navigationItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      label: 'Business Plans',
      path: '/create-business-plan',
      submenu: [
        { 
          label: 'Create New Plan', 
          path: '/create-business-plan',
          description: 'Start with our step-by-step wizard' 
        },
        { 
          label: 'My Plans', 
          path: '/my-plans',
          description: 'View and edit your saved plans'
        },
        { 
          label: 'Templates', 
          path: '/plan-templates',
          description: 'Pre-made business plan templates'
        }
      ]
    },
    {
      label: 'Analysis Engine',
      path: '/analysis-engine',
      submenu: [
        {
          label: 'Set KPIs',
          path: '/analysis-engine/set-kpis',
          description: 'Define Key Performance Indicators'
        }
      ]
    },
    {
      label: 'Documents',
      path: '/docs',
      submenu: [
        { 
          label: 'Marketing Materials', 
          path: '/docs/marketing',
          description: 'Brochures, value propositions, and datasheets'
        },
        { 
          label: 'Case Studies', 
          path: '/docs/case-studies',
          description: 'Customer success stories and implementations'
        },
        { 
          label: 'Presentations', 
          path: '/docs/presentations',
          description: 'Slides, decks and presentation materials'
        },
        { 
          label: 'Images & Graphics', 
          path: '/docs/images',
          description: 'Logos, illustrations and brand assets'
        }
      ]
    },
    // Grouped Items under "Settings"
    {
      label: 'Settings',
      path: '/settings', // Main path for the group
      submenu: [
        {
          label: 'Team Management',
          path: '/team',
          description: 'Manage users, roles, and permissions'
        },
        {
          label: 'Tutorials & Help',
          path: '/tutorials',
          description: 'Learn how to use the platform effectively'
        },
        {
          label: 'Integrations',
          path: '/integrations',
          description: 'Connect with other tools and services'
        },
        {
          label: 'Account Settings',
          path: '/settings',
          description: 'Manage your profile and account preferences'
        },
        {
          label: 'Security Analysis',
          path: '/settings/security-analysis',
          description: 'AI-powered security footprint analysis'
        }
      ]
    }
  ];

  // Listen for scroll events to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle dropdown menu toggle
  const toggleDropdown = (label: string) => {
    if (openDropdown === label) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(label);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Prevent closing when clicking inside dropdown
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <nav 
      className="fixed top-0 w-full z-50 transition-all duration-300 bg-white shadow-md"
    >
      <div className="mx-auto px-4 sm:px-6 lg:pl-0 lg:pr-6">
        <div className="flex justify-between h-28">
          {/* Left side: Desktop navigation Links ONLY */}
          <div className="flex items-center h-full">
            {/* Logo and Motto for Splash Page */}
            {location.pathname === '/' && (
              <Link to="/" className="flex flex-col items-start ml-24 mr-24">
                <img 
                  className="w-80 h-20"
                  src="/images/logo-light.png"
                  alt="Nexus"
                />
                <p className="text-lg w-80 text-center text-black italic font-medium font-serif leading-none">
                  Where data converges, insight emerges.
                </p>
              </Link>
            )}
            
            {/* Desktop Navigation Links */}
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
                        <ChevronDown 
                          size={16} 
                          className={`ml-1 transition-transform ${
                            openDropdown === item.label ? 'transform rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdown === item.label && (
                        <div 
                          className="absolute top-full left-0 w-60 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        >
                          <div className="py-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <div className="font-medium">{subItem.label}</div>
                                {subItem.description && (
                                  <p className="text-xs text-gray-500 mt-1">{subItem.description}</p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                        location.pathname === item.path
                          ? 'text-blue-600'
                          : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Search and user actions */}
          <div className="flex items-center space-x-4 pr-6">
            {/* Search */}
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
            
            {/* Notification icon */}
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <Bell size={20} />
            </button>
            
            {/* Help icon */}
            <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              <HelpCircle size={20} />
            </button>
            
            {/* User profile */}
            <div className="relative ml-3">
              <button 
                className="flex items-center bg-gray-100 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                onClick={() => toggleDropdown('profile')}
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <User size={18} />
                </div>
              </button>
              
              {/* User dropdown */}
              {openDropdown === 'profile' && (
                <div 
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  onClick={handleDropdownClick}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-500">john@example.com</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Your Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </Link>
                  <Link to="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Sign out
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-500 hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationItems.map((item) => (
              <div key={item.label}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className="w-full flex justify-between items-center px-3 py-2 text-base font-medium rounded-md text-gray-700 hover:text-blue-500 hover:bg-gray-100"
                    >
                      {item.label}
                      <ChevronDown 
                        size={16} 
                        className={openDropdown === item.label ? 'transform rotate-180' : ''}
                      />
                    </button>
                    
                    {openDropdown === item.label && (
                      <div className="pl-4 space-y-1 mt-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.path 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-500 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile search */}
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-3 py-2 w-full text-sm bg-gray-100 border-0 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Mobile profile */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <User size={20} />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">John Doe</div>
                <div className="text-sm font-medium text-gray-500">john@example.com</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Your Profile
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Settings
              </Link>
              <Link
                to="/logout"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 