import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCog,
  Shield,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';

interface OrganizationOut {
  id: number;
  name: string;
}

interface MemberOut {
  user_id: number;
  email: string;
  full_name: string | null;
  role: string;
}

const roleDisplay: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const roleDescriptions: Record<string, string> = {
  Owner: 'Full access to all features. Can add team members and manage organization settings.',
  Admin: 'Can manage team members and access all content. Cannot change organization ownership.',
  Member: 'Can create and edit content in workspaces. Cannot manage team or organization settings.',
};

const TeamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'invites'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [org, setOrg] = useState<OrganizationOut | null>(null);
  const [members, setMembers] = useState<MemberOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<OrganizationOut>('/organizations/current')
      .then((currentOrg) => {
        if (cancelled) return;
        setOrg(currentOrg);
        return api<MemberOut[]>(`/organizations/${currentOrg.id}/members`);
      })
      .then((memberList) => {
        if (cancelled) return;
        if (Array.isArray(memberList)) setMembers(memberList);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load team');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredMembers = members.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    const name = (m.full_name || '').toLowerCase();
    const email = m.email.toLowerCase();
    const role = (roleDisplay[m.role] || m.role).toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower) || role.includes(searchLower);
  });

  const handleInviteSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Invite API not yet implemented - show message or close
    setIsInviteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-gray-500">Loading team...</div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">{error || 'No organization found. Create a workspace first.'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your team members and access permissions for {org.name}
        </p>
      </div>

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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {(member.full_name || member.email)
                              .split(/\s+/)
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.full_name || '—'}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {roleDisplay[member.role] || member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3" title="Edit role (coming soon)">
                        <UserCog className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">No members match your search.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['Owner', 'Admin', 'Member'] as const).map((role) => (
            <div key={role} className="bg-white p-6 rounded-lg shadow-md">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${
                  role === 'Owner'
                    ? 'bg-purple-100 text-purple-800'
                    : role === 'Admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {role}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{role} Role</h3>
              <p className="text-gray-600 mt-2">{roleDescriptions[role]}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Pending Invitations</h2>
            <p className="text-gray-500 text-sm mt-1">
              Invitations that have been sent but not yet accepted. Invite API coming soon.
            </p>
          </div>
          <div className="p-8 text-center text-gray-500">No pending invites.</div>
        </div>
      )}

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
              <p className="text-gray-500 text-sm mb-4">
                Sending invitations is not yet available. You can add members by sharing your
                organization and having them sign up; full invite flow is coming soon.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Close
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
