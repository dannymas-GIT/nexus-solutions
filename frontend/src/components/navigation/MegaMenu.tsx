import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, FileCheck, Settings, Users, Building, BarChart, 
  FileQuestion, BookOpen, Headphones, Star, ChevronRight, X, 
  FileCode, Database, FileSearch
} from 'lucide-react';

interface MenuItem {
  name: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu?: string;
}

/**
 * MegaMenu component for displaying categorized navigation options
 */
const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose, activeMenu = 'create' }) => {
  // Business Tools Section
  const businessTools: MenuSection = {
    title: 'Business Tools',
    items: [
      {
        name: 'Business Plan',
        description: 'Create and manage complete business plans',
        icon: <FileText className="w-4 h-4 text-blue-500" aria-hidden="true" />,
        to: '/create-business-plan',
      },
      {
        name: 'Financial Projections',
        description: 'Generate detailed financial forecasts',
        icon: <BarChart className="w-4 h-4 text-green-500" aria-hidden="true" />,
        to: '/financial-projections',
      },
      {
        name: 'Market Analysis',
        description: 'Research and analyze target markets',
        icon: <Building className="w-4 h-4 text-purple-500" aria-hidden="true" />,
        to: '/market-analysis',
      },
    ],
  };

  // Data Management Section
  const dataManagement: MenuSection = {
    title: 'Data Management',
    items: [
      {
        name: 'Document Library',
        description: 'Manage and organize all your documents',
        icon: <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />,
        to: '/documents',
      },
      {
        name: 'Templates',
        description: 'Access pre-built business templates',
        icon: <FileCheck className="w-4 h-4 text-teal-500" aria-hidden="true" />,
        to: '/templates',
      },
      {
        name: 'Data Import',
        description: 'Import external data into your workspace',
        icon: <Database className="w-4 h-4 text-amber-500" aria-hidden="true" />,
        to: '/data-import',
      },
    ],
  };

  // Team Tools Section
  const teamTools: MenuSection = {
    title: 'Team Tools',
    items: [
      {
        name: 'Team Management',
        description: 'Invite and manage team members',
        icon: <Users className="w-4 h-4 text-rose-500" aria-hidden="true" />,
        to: '/team',
      },
      {
        name: 'Document Sharing',
        description: 'Share and collaborate on documents',
        icon: <FileSearch className="w-4 h-4 text-cyan-500" aria-hidden="true" />,
        to: '/share',
      },
    ],
  };

  // Settings Section
  const settingsSection: MenuSection = {
    title: 'Settings',
    items: [
      {
        name: 'Account Settings',
        description: 'Manage your account preferences',
        icon: <Settings className="w-4 h-4 text-gray-500" aria-hidden="true" />,
        to: '/settings',
      },
    ],
  };

  // Learning Center Section
  const learningCenter: MenuSection = {
    title: 'Learning Center',
    items: [
      {
        name: 'Tutorials',
        description: 'Learn how to use the platform',
        icon: <BookOpen className="w-4 h-4 text-orange-500" aria-hidden="true" />,
        to: '/tutorials',
      },
      {
        name: 'FAQs',
        description: 'Find answers to common questions',
        icon: <FileQuestion className="w-4 h-4 text-blue-400" aria-hidden="true" />,
        to: '/faqs',
      },
    ],
  };

  // Support Section
  const supportSection: MenuSection = {
    title: 'Support',
    items: [
      {
        name: 'Contact Support',
        description: 'Get help from our support team',
        icon: <Headphones className="w-4 h-4 text-pink-500" aria-hidden="true" />,
        to: '/support',
      },
    ],
  };

  const getMenuSections = (): MenuSection[] => {
    switch (activeMenu) {
      case 'create':
        return [businessTools, dataManagement];
      case 'manage':
        return [teamTools, dataManagement, settingsSection];
      case 'resources':
        return [learningCenter, supportSection];
      default:
        return [businessTools, dataManagement];
    }
  };

  const menuSections = getMenuSections();

  return (
    <div className={`absolute w-full bg-white shadow-xl rounded-b-xl border-b border-l border-r border-gray-200 overflow-hidden transition-all transform ${isOpen ? 'opacity-100' : 'opacity-0 translate-y-1'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Close button at top right */}
        <div className="flex justify-end pt-3 pr-3">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0047AB]"
          >
            <span className="sr-only">Close menu</span>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        
        {/* Menu Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-b from-[#F7FAFF] to-white">
          {/* Menu Sections */}
          <div className="space-y-8">
            {menuSections.slice(0, Math.ceil(menuSections.length / 2)).map((section, idx) => (
              <section key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="h-5 w-1 rounded-r-full bg-[#0047AB] mr-2"></div>
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        to={item.to}
                        className="group flex items-start p-2 rounded-lg hover:bg-[#F0F7FF] transition-colors duration-150"
                        onClick={onClose}
                      >
                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gray-50 group-hover:bg-white text-[#0047AB] border border-gray-100 group-hover:border-blue-100 shadow-sm flex items-center justify-center mr-3 transition-colors duration-150">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-[#0047AB] transition-colors duration-150">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0047AB] opacity-0 group-hover:opacity-100 transition-all duration-150" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          
          <div className="space-y-8">
            {menuSections.slice(Math.ceil(menuSections.length / 2)).map((section, idx) => (
              <section key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <div className="h-5 w-1 rounded-r-full bg-[#0047AB] mr-2"></div>
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        to={item.to}
                        className="group flex items-start p-2 rounded-lg hover:bg-[#F0F7FF] transition-colors duration-150"
                        onClick={onClose}
                      >
                        <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-gray-50 group-hover:bg-white text-[#0047AB] border border-gray-100 group-hover:border-blue-100 shadow-sm flex items-center justify-center mr-3 transition-colors duration-150">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-[#0047AB] transition-colors duration-150">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0047AB] opacity-0 group-hover:opacity-100 transition-all duration-150" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            
            {/* Call-to-action Section */}
            {activeMenu === 'create' && (
              <div className="bg-gradient-to-r from-[#0047AB] to-[#2177FF] text-white p-5 rounded-xl shadow-md">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-medium mb-2">Ready to accelerate your business?</h3>
                    <p className="text-sm opacity-80 mb-4">Get access to all premium features with our Pro plan.</p>
                    <div className="flex space-x-3">
                      <Link 
                        to="/pricing" 
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white text-[#0047AB] hover:bg-blue-50 transition-colors duration-150"
                        onClick={onClose}
                      >
                        <Star className="w-4 h-4 mr-1.5" aria-hidden="true" />
                        Request a demo
                      </Link>
                      <Link 
                        to="/signup" 
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-150"
                        onClick={onClose}
                      >
                        Start for free
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu; 