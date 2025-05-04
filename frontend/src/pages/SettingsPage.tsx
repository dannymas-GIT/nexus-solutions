import React, { useState } from 'react';
import { Card } from '../components/ui/Card';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('account');

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-brand-neutral-dark">Settings</h1>
        <p className="text-brand-neutral-medium">Manage your account settings and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <nav>
              <ul className="divide-y divide-gray-100">
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 ${
                      activeTab === 'account' 
                      ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-4 border-brand-primary' 
                      : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('account')}
                  >
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 ${
                      activeTab === 'profile' 
                      ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-4 border-brand-primary' 
                      : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 ${
                      activeTab === 'notifications' 
                      ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-4 border-brand-primary' 
                      : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 ${
                      activeTab === 'billing' 
                      ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-4 border-brand-primary' 
                      : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('billing')}
                  >
                    Billing
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-4 py-3 ${
                      activeTab === 'security' 
                      ? 'bg-brand-primary/10 text-brand-primary font-medium border-l-4 border-brand-primary' 
                      : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    Security
                    </button>
                </li>
              </ul>
            </nav>
          </Card>
                  </div>
        
        {/* Content Area */}
        <div className="md:col-span-3">
          <Card>
            {activeTab === 'account' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                <p className="text-gray-600 mb-6">Manage your account settings and preferences.</p>
                
                {/* Account settings form */}
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      defaultValue="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      defaultValue="John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      defaultValue="Nexus Solutions"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Profile</h2>
                <p className="text-gray-500 mb-6">Update your public profile information.</p>
                
                <div className="mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-full bg-brand-primary flex items-center justify-center text-white text-xl font-medium">
                      JD
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      Change Profile Photo
                    </button>
                  </div>
                </div>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      rows={4}
                      placeholder="Tell us about yourself"
                    ></textarea>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                <p className="text-gray-500 mb-6">Manage how you receive notifications.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" name="toggle" id="email-toggle" defaultChecked className="sr-only peer" />
                      <label htmlFor="email-toggle" className="block h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-brand-primary cursor-pointer transition-colors duration-300"></label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Browser Notifications</h3>
                      <p className="text-sm text-gray-500">Receive in-app notifications</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" name="toggle" id="browser-toggle" className="sr-only peer" />
                      <label htmlFor="browser-toggle" className="block h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-brand-primary cursor-pointer transition-colors duration-300"></label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'billing' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Billing</h2>
                <p className="text-gray-500 mb-6">Manage your billing information and view your subscription.</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-800">Current Plan: Free</h3>
                  <p className="text-sm text-blue-600 mt-1">You are currently on the free plan. Upgrade for more features.</p>
                  <button className="mt-3 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90">
                    Upgrade Plan
                  </button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Payment Methods</h3>
                  <p className="text-gray-500 text-sm">No payment methods added yet.</p>
                  <button className="mt-3 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    Add Payment Method
                  </button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Security</h2>
                <p className="text-gray-500 mb-6">Manage your account security settings.</p>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Change Password</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring focus:ring-brand-primary focus:ring-opacity-50"
                      />
                </div>
                
                    <div className="mt-6">
                      <button
                        type="button"
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    Enable 2FA
                    </button>
              </div>
            </div>
          )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 