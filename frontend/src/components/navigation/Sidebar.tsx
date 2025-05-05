import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  // FileText, // Removed unused import
  // LayoutDashboard, // Removed unused import
  Settings, 
  ChevronLeft, 
  LogOut,
  Search,
  ChevronRight,
  Folder,
  Database,
  Briefcase
} from 'lucide-react';
// import { ModeToggle } from '../ui/ModeToggle'; // Commented out - File not found

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userName = 'John Doe', 
  userEmail = 'john@example.com' 
}) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [_isDarkMode, setIsDarkMode] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'images-graphics': true
  });

  // Define the new main sidebar navigation items
  const mainNavItems: NavItem[] = [
    {
      icon: <Database size={20} />,
      label: 'Data Convergence Framework',
      path: '/data-convergence',
    },
    {
      icon: <Briefcase size={20} />,
      label: 'Business Command Center',
      path: '/command-center',
    },
  ];

  // Detect dark mode
  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    
    // Listen for changes in system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 dark:bg-gray-900 dark:border-gray-700 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="flex flex-col h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {collapsed ? (
          // Collapsed state - vertical layout
          <div className="flex flex-col items-center justify-center h-full">
            <Link to="/" className="mb-1">
              <img 
                className="h-7 w-7" 
                src="/images/logo-n.png" 
                alt="N"
              />
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          // Expanded state - horizontal layout
          <div className="flex items-center justify-between w-full h-full">
            <Link to="/" className="flex items-center">
              <img 
                className="h-10 w-auto" 
                src="/images/logo-transparent.png" 
                alt="Nexus"
              />
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          {collapsed ? (
            <button className="p-2 w-full rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <Search size={16} />
            </button>
          ) : (
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-3 py-2 w-full text-sm bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-brand-primary"
            />
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {mainNavItems.map((item, i) => (
            <li key={i}>
              <Link
                to={item.path}
                className={`flex items-center ${
                  collapsed ? 'justify-center' : 'justify-between'
                } px-3 py-2 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <span className={collapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="bg-brand-accent text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {!collapsed && location.pathname === '/docs' && (
          <div className="mt-6">
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Documents</h3>
            <ul className="space-y-1 px-2">
              <li>
                <button 
                  onClick={() => toggleFolder('marketing')}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center">
                    <Folder size={18} className="mr-2" />
                    <span>Marketing Materials</span>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform ${
                      expandedFolders['marketing'] ? 'transform rotate-90' : ''
                    }`} 
                  />
                </button>
              </li>
              <li>
                <button
                  onClick={() => toggleFolder('case-studies')}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center">
                    <Folder size={18} className="mr-2" />
                    <span>Case Studies</span>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform ${
                      expandedFolders['case-studies'] ? 'transform rotate-90' : ''
                    }`} 
                  />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => toggleFolder('presentations')}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center">
                    <Folder size={18} className="mr-2" />
                    <span>Presentations</span>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform ${
                      expandedFolders['presentations'] ? 'transform rotate-90' : ''
                    }`} 
                  />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => toggleFolder('images-graphics')}
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center">
                    <Folder size={18} className="mr-2" />
                    <span>Images & Graphics</span>
              </div>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform ${
                      expandedFolders['images-graphics'] ? 'transform rotate-90' : ''
                    }`} 
                  />
                </button>
              </li>
              
              {/* Nested folder items */}
              {expandedFolders['images-graphics'] && (
                <ul className="pl-6 pt-1 space-y-1">
                  <li>
                    <Link to="/docs/image-gallery" className="flex items-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                      <span className="text-sm">Image Gallery</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs/nexus-logo" className="flex items-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                      <span className="text-sm">Nexus Logo</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs/detailed-logo" className="flex items-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                      <span className="text-sm">Detailed Logo Design</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs/logo-options" className="flex items-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                      <span className="text-sm">Logo Design Options</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs/color-palette" className="flex items-center px-3 py-1.5 text-blue-600 font-medium bg-blue-50 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
                      <span className="text-sm">Color Palette</span>
                    </Link>
                  </li>
                </ul>
              )}
            </ul>
          </div>
        )}
      </nav>

      {/* User Info */}
      <div className={`border-t border-gray-200 p-4 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? (
          <div className="h-8 w-8 mx-auto overflow-hidden rounded-full bg-brand-primary text-white flex items-center justify-center">
            <span className="font-medium text-sm">JD</span>
          </div>
        ) : (
          <>
            <div className="flex items-center">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-brand-primary text-white flex items-center justify-center">
                <span className="font-medium text-sm">JD</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center text-gray-600 hover:text-gray-900">
              <Link to="/settings" className="flex items-center text-sm">
                <Settings size={16} className="mr-2" />
                <span>Settings</span>
              </Link>
            </div>
            <div className="mt-2 flex items-center text-gray-600 hover:text-gray-900">
              <Link to="/logout" className="flex items-center text-sm">
                <LogOut size={16} className="mr-2" />
                <span>Sign out</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 