import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, BarChart, FileOutput, Menu, X, ChevronDown, Search, Bell } from 'lucide-react';
import MegaMenu from './MegaMenu';

/**
 * NavBar component
 * 
 * Main navigation bar with mega menu dropdown functionality
 */
const NavBar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
  // Check if a route is active
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) {
      setMegaMenuOpen(false);
    }
  };

  // Handle menu trigger clicks
  const handleMenuTrigger = (menuType: string) => {
    if (activeMenu === menuType && megaMenuOpen) {
      setMegaMenuOpen(false);
      setActiveMenu(null);
    } else {
      setMegaMenuOpen(true);
      setActiveMenu(menuType);
    }
  };

  // Close mega menu
  const closeMegaMenu = () => {
    setMegaMenuOpen(false);
    setActiveMenu(null);
  };

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

  // Close mega menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mega menu when route changes
  useEffect(() => {
    setMegaMenuOpen(false);
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-lg dark:bg-gray-900 dark:border-gray-700" ref={navRef}>
      <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between h-24">
          {/* Logo and brand */}
          <div className="flex-shrink-0 flex items-center pl-0">
            <Link to="/" className="flex flex-col items-center">
              <img 
                className="h-16 w-auto mb-1" 
                src="/images/logo-transparent.png" 
                alt="Nexus"
              />
              <div className="hidden md:block">
                <p className="text-base text-gray-600 italic font-light leading-none dark:text-gray-300">
                  Where data converges, insight emerges.
                </p>
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-2">
            {/* Create dropdown trigger */}
            <button 
              className={`px-4 py-2 rounded-md text-base font-medium h-20 flex items-center transition-colors duration-150 ${
                activeMenu === 'create' && megaMenuOpen
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:bg-blue-900/30'
                  : 'text-gray-600 hover:text-[#0047AB] hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleMenuTrigger('create')}
              aria-expanded={activeMenu === 'create' && megaMenuOpen}
            >
              <span>Create</span>
              <ChevronDown className={`w-5 h-5 ml-1 transition-transform ${
                activeMenu === 'create' && megaMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Manage dropdown trigger */}
            <button
              className={`px-4 py-2 rounded-md text-base font-medium h-20 flex items-center transition-colors duration-150 ${
                activeMenu === 'manage' && megaMenuOpen
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-blue-50'
                  : 'text-gray-600 hover:text-[#0047AB] hover:bg-gray-50'
              }`}
              onClick={() => handleMenuTrigger('manage')}
              aria-expanded={activeMenu === 'manage' && megaMenuOpen}
            >
              <span>Manage</span>
              <ChevronDown className={`w-5 h-5 ml-1 transition-transform ${
                activeMenu === 'manage' && megaMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Resources dropdown trigger */}
            <button
              className={`px-4 py-2 rounded-md text-base font-medium h-20 flex items-center transition-colors duration-150 ${
                activeMenu === 'resources' && megaMenuOpen
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-blue-50'
                  : 'text-gray-600 hover:text-[#0047AB] hover:bg-gray-50'
              }`}
              onClick={() => handleMenuTrigger('resources')}
              aria-expanded={activeMenu === 'resources' && megaMenuOpen}
            >
              <span>Resources</span>
              <ChevronDown className={`w-5 h-5 ml-1 transition-transform ${
                activeMenu === 'resources' && megaMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Direct links */}
            <Link
              to="/docs"
              className={`px-4 py-2 rounded-md text-base font-medium h-20 flex items-center transition-colors duration-150 ${
                isActive('/docs')
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-blue-50'
                  : 'text-gray-600 hover:text-[#0047AB] hover:bg-gray-50'
              }`}
            >
              <FileOutput className="w-5 h-5 mr-1.5" aria-hidden="true" />
              <span>Documents</span>
            </Link>
            
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-md text-base font-medium h-20 flex items-center transition-colors duration-150 ${
                isActive('/dashboard')
                  ? 'text-[#0047AB] border-b-2 border-[#0047AB] bg-blue-50'
                  : 'text-gray-600 hover:text-[#0047AB] hover:bg-gray-50'
              }`}
            >
              <BarChart className="w-5 h-5 mr-1.5" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* User menu and notification (desktop) */}
          <div className="hidden sm:flex sm:items-center space-x-4">
            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0047AB]"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>
          
            {/* User Profile */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0047AB]"
                id="user-menu-button"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-[#0047AB] to-[#2177FF] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105">
                  <span className="font-medium text-base">JD</span>
                </div>
              </button>
            </div>
            
            {/* Search bar (desktop) - moved to rightmost position */}
            <div className="hidden lg:flex items-center ml-3">
              <div className="w-72 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-full text-base bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#0047AB] focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0047AB]"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="block h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mega Menu */}
      {megaMenuOpen && (
        <MegaMenu 
          isOpen={megaMenuOpen} 
          onClose={closeMegaMenu} 
          activeMenu={activeMenu || undefined} 
        />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-gray-200" id="mobile-menu">
          {/* Mobile search bar */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 rounded-full text-sm bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-[#0047AB] focus:border-transparent"
                placeholder="Search..."
              />
            </div>
          </div>
        
          {/* Mobile navigation links */}
          <div className="pt-2 pb-3 space-y-1 px-3">
            <Link
              to="/create-business-plan"
              className="flex items-center p-2 rounded-lg text-base font-medium text-gray-700 hover:text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-[#F0F4FF] flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-[#0047AB]" aria-hidden="true" />
              </div>
              <span>Create Business Plan</span>
            </Link>
            
            <Link
              to="/docs"
              className="flex items-center p-2 rounded-lg text-base font-medium text-gray-700 hover:text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-[#F0F4FF] flex items-center justify-center mr-3">
                <FileOutput className="w-4 h-4 text-[#0047AB]" aria-hidden="true" />
              </div>
              <span>Documents</span>
            </Link>
            
            <Link
              to="/dashboard"
              className="flex items-center p-2 rounded-lg text-base font-medium text-gray-700 hover:text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-[#F0F4FF] flex items-center justify-center mr-3">
                <BarChart className="w-4 h-4 text-[#0047AB]" aria-hidden="true" />
              </div>
              <span>Dashboard</span>
            </Link>
          </div>
          
          {/* Mobile user profile */}
          <div className="pt-4 pb-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center px-4 py-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-r from-[#0047AB] to-[#2177FF] text-white flex items-center justify-center shadow-md">
                  <span className="font-medium">JD</span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">John Doe</div>
                <div className="text-sm font-medium text-gray-500">john@example.com</div>
              </div>
              <button
                type="button"
                className="ml-auto p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0047AB]"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-1 px-3">
              <Link
                to="/settings"
                className="block px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                className="block w-full text-left px-4 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar; 