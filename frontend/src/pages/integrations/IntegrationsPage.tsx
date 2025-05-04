import React, { useState } from 'react';
import { Search, Filter, Plus, ExternalLink, Check, X, AlertCircle, Grid, Settings, RefreshCw } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'Analytics' | 'CRM' | 'Financial' | 'Marketing' | 'Productivity' | 'Other';
  logoUrl: string;
  isConnected: boolean;
  isPopular: boolean;
  isNew: boolean;
}

const IntegrationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showConnected, setShowConnected] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Sample integrations data
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Google Analytics',
      description: 'Connect your Google Analytics account to track website traffic and user behavior.',
      category: 'Analytics',
      logoUrl: 'https://via.placeholder.com/80x80/4285F4/FFFFFF?text=GA',
      isConnected: true,
      isPopular: true,
      isNew: false,
    },
    {
      id: '2',
      name: 'Salesforce',
      description: 'Integrate with Salesforce CRM to sync customers, leads, and opportunities.',
      category: 'CRM',
      logoUrl: 'https://via.placeholder.com/80x80/00A1E0/FFFFFF?text=SF',
      isConnected: false,
      isPopular: true,
      isNew: false,
    },
    {
      id: '3',
      name: 'QuickBooks',
      description: 'Connect with QuickBooks to manage your financial data and reporting.',
      category: 'Financial',
      logoUrl: 'https://via.placeholder.com/80x80/2CA01C/FFFFFF?text=QB',
      isConnected: true,
      isPopular: true,
      isNew: false,
    },
    {
      id: '4',
      name: 'Mailchimp',
      description: 'Integrate with Mailchimp to sync contact lists and manage email campaigns.',
      category: 'Marketing',
      logoUrl: 'https://via.placeholder.com/80x80/FFE01B/000000?text=MC',
      isConnected: false,
      isPopular: false,
      isNew: false,
    },
    {
      id: '5',
      name: 'Slack',
      description: 'Get notifications and updates directly in your Slack channels.',
      category: 'Productivity',
      logoUrl: 'https://via.placeholder.com/80x80/4A154B/FFFFFF?text=SL',
      isConnected: false,
      isPopular: true,
      isNew: false,
    },
    {
      id: '6',
      name: 'Xero',
      description: 'Connect with Xero for accounting, invoicing, and financial reporting.',
      category: 'Financial',
      logoUrl: 'https://via.placeholder.com/80x80/13B5EA/FFFFFF?text=XE',
      isConnected: false,
      isPopular: false,
      isNew: false,
    },
    {
      id: '7',
      name: 'HubSpot',
      description: 'Integrate with HubSpot for marketing, sales, and customer service.',
      category: 'CRM',
      logoUrl: 'https://via.placeholder.com/80x80/FF7A59/FFFFFF?text=HS',
      isConnected: false,
      isPopular: true,
      isNew: false,
    },
    {
      id: '8',
      name: 'Shopify',
      description: 'Connect your Shopify store to sync products, orders, and customers.',
      category: 'Financial',
      logoUrl: 'https://via.placeholder.com/80x80/96BF48/FFFFFF?text=SH',
      isConnected: false,
      isPopular: false,
      isNew: true,
    },
    {
      id: '9',
      name: 'Microsoft Teams',
      description: 'Collaborate and share updates with your team directly from Nexus.',
      category: 'Productivity',
      logoUrl: 'https://via.placeholder.com/80x80/6264A7/FFFFFF?text=MT',
      isConnected: false,
      isPopular: false,
      isNew: true,
    },
    {
      id: '10',
      name: 'Google Workspace',
      description: 'Connect with Google Workspace for document management and collaboration.',
      category: 'Productivity',
      logoUrl: 'https://via.placeholder.com/80x80/4285F4/FFFFFF?text=GW',
      isConnected: false,
      isPopular: true,
      isNew: false,
    },
    {
      id: '11',
      name: 'Stripe',
      description: 'Integrate with Stripe for payment processing and subscription management.',
      category: 'Financial',
      logoUrl: 'https://via.placeholder.com/80x80/635BFF/FFFFFF?text=ST',
      isConnected: false,
      isPopular: true,
      isNew: false,
    },
    {
      id: '12',
      name: 'Airtable',
      description: 'Sync your Airtable databases with Nexus for enhanced data management.',
      category: 'Productivity',
      logoUrl: 'https://via.placeholder.com/80x80/FFAE00/FFFFFF?text=AT',
      isConnected: false,
      isPopular: false,
      isNew: true,
    },
  ];

  // Filter integrations based on search, category, and connection status
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || integration.category === activeCategory;
    const matchesConnection = !showConnected || integration.isConnected;
    
    return matchesSearch && matchesCategory && matchesConnection;
  });

  const popularIntegrations = integrations.filter(integration => integration.isPopular);
  const newIntegrations = integrations.filter(integration => integration.isNew);
  const connectedIntegrations = integrations.filter(integration => integration.isConnected);

  // Toggle connection status (in a real app, this would call an API)
  const toggleConnection = (integration: Integration) => {
    // This is just for demo purposes - in a real app you would make an API call
    const updatedIntegrations = integrations.map(item => {
      if (item.id === integration.id) {
        return { ...item, isConnected: !item.isConnected };
      }
      return item;
    });
    
    // For now, just close the modal
    setSelectedIntegration(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect Nexus with your favorite services and tools
        </p>
      </div>

      {selectedIntegration ? (
        // Integration detail view
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <img 
                  src={selectedIntegration.logoUrl} 
                  alt={selectedIntegration.name} 
                  className="w-16 h-16 rounded-lg mr-4"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedIntegration.name}</h2>
                  <div className="flex items-center text-sm mt-1">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs mr-2">
                      {selectedIntegration.category}
                    </span>
                    {selectedIntegration.isConnected && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedIntegration(null)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mt-4">
              {selectedIntegration.description}
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Connection Details</h3>
              
              {selectedIntegration.isConnected ? (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Connected</h4>
                      <p className="text-sm text-green-700 mt-1">
                        This integration is active and data is syncing properly.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Not Connected</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Connect your account to start syncing data with Nexus.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Data Permissions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Read access to your account information
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Ability to import data into Nexus
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Automatic synchronization of updates
                  </li>
                </ul>
              </div>

              <div className="flex justify-end mt-8">
                {selectedIntegration.isConnected ? (
                  <>
                    <button 
                      className="flex items-center mr-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
                      onClick={() => {/* Configuration logic */}}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </button>
                    <button 
                      className="flex items-center mr-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
                      onClick={() => {/* Sync logic */}}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </button>
                    <button 
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                      onClick={() => toggleConnection(selectedIntegration)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    onClick={() => toggleConnection(selectedIntegration)}
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Integrations listing view
        <>
          {/* Connected integrations */}
          {connectedIntegrations.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Connected Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedIntegrations.map(integration => (
                  <div 
                    key={integration.id}
                    className="bg-white rounded-lg shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <img 
                      src={integration.logoUrl} 
                      alt={integration.name} 
                      className="w-12 h-12 rounded mr-4"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">{integration.category}</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative inline-block">
                <button
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => {/* Dropdown logic */}}
                >
                  <Filter className="w-5 h-5 mr-2" />
                  <span>Category</span>
                </button>
              </div>
              
              <div className="relative inline-block">
                <button
                  className={`flex items-center px-4 py-2 border rounded-lg ${
                    showConnected 
                      ? 'bg-blue-50 border-blue-200 text-blue-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowConnected(!showConnected)}
                >
                  {showConnected ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <Filter className="w-5 h-5 mr-2" />
                  )}
                  <span>Connected Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Popular integrations */}
          {popularIntegrations.length > 0 && !showConnected && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Integrations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {popularIntegrations.map(integration => (
                  <div 
                    key={integration.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <img 
                      src={integration.logoUrl} 
                      alt={integration.name} 
                      className="w-16 h-16 rounded-lg mb-3"
                    />
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <span className="text-xs text-gray-500 mt-1">{integration.category}</span>
                    {integration.isConnected && (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center mt-2">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New integrations */}
          {newIntegrations.length > 0 && !showConnected && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">New Integrations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newIntegrations.map(integration => (
                  <div 
                    key={integration.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative flex flex-col items-center text-center"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                      New
                    </div>
                    <img 
                      src={integration.logoUrl} 
                      alt={integration.name} 
                      className="w-16 h-16 rounded-lg mb-3"
                    />
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <span className="text-xs text-gray-500 mt-1">{integration.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All integrations */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              All Integrations
              {activeCategory !== 'all' && ` - ${activeCategory}`}
              {showConnected && ' (Connected)'}
            </h2>
            
            {filteredIntegrations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredIntegrations.map(integration => (
                  <div 
                    key={integration.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex items-center mb-3">
                      <img 
                        src={integration.logoUrl} 
                        alt={integration.name} 
                        className="w-12 h-12 rounded mr-3"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500 mr-2">{integration.category}</span>
                          {integration.isConnected && (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              Connected
                            </span>
                          )}
                          {integration.isNew && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center ml-1">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{integration.description}</p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        Learn more
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                      {integration.isConnected ? (
                        <span className="text-xs text-green-600 flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <button className="text-sm flex items-center text-blue-600 hover:text-blue-800">
                          <Plus className="w-4 h-4 mr-1" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No integrations found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
          
          {/* Request integration */}
          <div className="mt-12 bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Don't see what you're looking for?</h3>
            <p className="text-blue-700 mb-4">Request a new integration and we'll consider adding it to our platform.</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              Request Integration
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IntegrationsPage; 