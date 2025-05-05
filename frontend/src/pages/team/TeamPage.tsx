import React, { useState } from 'react';
import { 
  Users, UserPlus, UserMinus, UserCog, Shield, 
  Mail, Search, X 
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending' | 'Inactive';
  lastActive: string;
}

const TeamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'invites'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Sample team members data
  const [teamMembers, _setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'Owner',
      status: 'Active',
      lastActive: '2023-10-25T14:30:00Z',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2023-10-24T09:15:00Z',
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      role: 'Editor',
      status: 'Active',
      lastActive: '2023-10-23T16:45:00Z',
    },
    {
      id: '4',
      name: 'Lisa Wong',
      email: 'lisa.w@example.com',
      role: 'Viewer',
      status: 'Pending',
      lastActive: '-',
    }
  ]);
  
  const filteredMembers = teamMembers.filter((member: TeamMember) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchLower) || 
      member.email.toLowerCase().includes(searchLower) ||
      member.role.toLowerCase().includes(searchLower)
    );
  });
  
  const roleDescriptions = {
    Owner: 'Full access to all features. Can modify billing, add team members, and manage all content.',
    Admin: 'Can manage team members and access all content. Cannot modify billing information.',
    Editor: 'Can create and edit business plans and reports. Cannot manage team or billing settings.',
    Viewer: 'Read-only access to shared business plans and reports. Cannot make any changes.'
  };
  
  const formatLastActive = (lastActive: string) => {
    if (lastActive === '-') return 'Never';
    const date = new Date(lastActive);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleInviteSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Logic to send invitations would go here
    setIsInviteModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your team members and access permissions for your Nexus workspace
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('members')}
            className={`mr-8 py-4 px-1 ${
              activeTab === 'members'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`mr-8 py-4 px-1 ${
              activeTab === 'roles'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium`}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            Roles & Permissions
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-4 px-1 ${
              activeTab === 'invites'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium`}
          >
            <Mail className="w-5 h-5 inline mr-2" />
            Pending Invites
          </button>
        </nav>
      </div>
      
      {/* Members Tab Content */}
      {activeTab === 'members' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Team Member
            </button>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${member.role === 'Owner' ? 'bg-purple-100 text-purple-800' : 
                          member.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 
                          member.role === 'Editor' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {member.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          member.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}
                      `}>
                        {member.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastActive(member.lastActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <UserCog className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} className="bg-white p-6 rounded-lg shadow-md">
              <div className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2
                ${role === 'Owner' ? 'bg-purple-100 text-purple-800' : 
                  role === 'Admin' ? 'bg-blue-100 text-blue-800' : 
                  role === 'Editor' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-800'}
              `}>
                {role}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{role} Role</h3>
              <p className="text-gray-600 mt-2">{description}</p>
              
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Capabilities:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {role === 'Owner' && (
                    <>
                      <li>• Full data access and management</li>
                      <li>• Billing and subscription management</li>
                      <li>• Team member management</li>
                      <li>• All content creation and editing</li>
                      <li>• System settings configuration</li>
                    </>
                  )}
                  {role === 'Admin' && (
                    <>
                      <li>• Full data access and management</li>
                      <li>• Team member management</li>
                      <li>• All content creation and editing</li>
                      <li>• System settings configuration</li>
                      <li className="text-gray-400">• Cannot modify billing information</li>
                    </>
                  )}
                  {role === 'Editor' && (
                    <>
                      <li>• Create and edit business plans</li>
                      <li>• Generate and edit reports</li>
                      <li>• Access to all shared data</li>
                      <li className="text-gray-400">• Cannot manage team members</li>
                      <li className="text-gray-400">• Cannot modify system settings</li>
                    </>
                  )}
                  {role === 'Viewer' && (
                    <>
                      <li>• View all shared business plans</li>
                      <li>• View all shared reports</li>
                      <li>• Export data as PDF or CSV</li>
                      <li className="text-gray-400">• Cannot edit any content</li>
                      <li className="text-gray-400">• Cannot access system settings</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Invites Tab Content */}
      {activeTab === 'invites' && (
        <div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
              <p className="text-gray-500 text-sm mt-1">
                Invitations that have been sent but not yet accepted
              </p>
            </div>
            
            {/* Sample pending invites */}
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <p className="font-medium">david.nguyen@example.com</p>
                <div className="flex items-center mt-1">
                  <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full">
                    Admin
                  </div>
                  <p className="text-sm text-gray-500 ml-2">
                    Sent Oct 20, 2023
                  </p>
                </div>
              </div>
              <div className="flex">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4">
                  Resend
                </button>
                <button className="text-sm font-medium text-red-600 hover:text-red-800">
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="font-medium">alex.parker@example.com</p>
                <div className="flex items-center mt-1">
                  <div className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                    Editor
                  </div>
                  <p className="text-sm text-gray-500 ml-2">
                    Sent Oct 22, 2023
                  </p>
                </div>
              </div>
              <div className="flex">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4">
                  Resend
                </button>
                <button className="text-sm font-medium text-red-600 hover:text-red-800">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Invite Team Members</h3>
              <button 
                className="text-gray-400 hover:text-gray-500" 
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Addresses
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter email addresses (one per line)"
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  Enter multiple emails separated by line breaks
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  defaultValue="Editor"
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personalized Message (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add a personal message to your invitation"
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Send Invitations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage; 