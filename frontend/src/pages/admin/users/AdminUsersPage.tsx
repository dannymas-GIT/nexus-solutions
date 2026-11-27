import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  Pencil,
  CheckCircle2,
  AlertCircle,
  History,
  LogIn,
} from 'lucide-react';
import {
  authApi,
  getAuthToken,
  type AuditLogEntry,
  type RoleDefinition,
  type UserProfile,
} from '@/services/authApi';

const ROLE_STYLES: Record<string, { label: string; className: string }> = {
  platform_admin: {
    label: 'Platform Admin',
    className: 'bg-purple-100 text-purple-950 border-purple-300',
  },
  workspace_admin: {
    label: 'Workspace Admin',
    className: 'bg-blue-100 text-blue-950 border-blue-300',
  },
  analyst: {
    label: 'Analyst',
    className: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  },
  viewer: {
    label: 'Viewer',
    className: 'bg-slate-100 text-slate-900 border-slate-300',
  },
};

function initials(name: string): string {
  const parts = (name || 'U').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

const AdminUsersPage: React.FC = () => {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [hasUsers, setHasUsers] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [roleCatalog, setRoleCatalog] = useState<RoleDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Dialog refs & active target
  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const resetDialogRef = useRef<HTMLDialogElement | null>(null);
  const detailDialogRef = useRef<HTMLDialogElement | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Create form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrg, setNewOrg] = useState('Nexus Workspace');
  const [newRole, setNewRole] = useState('analyst');
  const [newTempPass, setNewTempPass] = useState('');

  // Edit form
  const [editFullName, setEditFullName] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [editRole, setEditRole] = useState('viewer');

  // Reset password form
  const [resetTempPass, setResetTempPass] = useState('');

  // Inline sign-in / bootstrap form when unauthenticated
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const loadData = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const status = await authApi.status();
      setHasUsers(status.hasUsers);

      if (!getAuthToken()) {
        setMe(null);
        setUsers([]);
        setLoading(false);
        return;
      }

      const currentUser = await authApi.me();
      setMe(currentUser);

      if (currentUser.role === 'platform_admin' || currentUser.role === 'workspace_admin') {
        const [listRes, logs] = await Promise.all([
          authApi.listAdminUsers(query),
          authApi.listAuditLogs().catch(() => [] as AuditLogEntry[]),
        ]);
        setUsers(listRes.users);
        setTotal(listRes.total);
        setRoleCatalog(listRes.roleCatalog);
        setAuditLogs(logs);
      }
    } catch (err) {
      setMe(null);
      setError(err instanceof Error ? err.message : 'Unable to load user directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(search);
  }, [loadData, search]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setError(null);
    try {
      if (!hasUsers) {
        await authApi.register({
          email: authEmail.trim(),
          password: authPassword,
          fullName: authName.trim() || 'Platform Administrator',
          organizationName: 'Nexus Solutions',
        });
        setNotice('Initialized first Platform Admin account.');
      } else {
        await authApi.login(authEmail.trim(), authPassword);
        setNotice('Signed in successfully.');
      }
      setAuthPassword('');
      await loadData(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const created = await authApi.createAdminUser({
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        organizationName: newOrg.trim() || 'Nexus Workspace',
        role: newRole,
        temporaryPassword: newTempPass,
      });
      createDialogRef.current?.close();
      setNewFullName('');
      setNewEmail('');
      setNewTempPass('');
      setNotice(`Added ${created.fullName} (${created.email}).`);
      await loadData(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user.');
    }
  };

  const openEdit = (u: UserProfile) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditOrg(u.organizationName);
    setEditRole(u.role);
    editDialogRef.current?.showModal();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    setNotice(null);
    try {
      const updated = await authApi.updateAdminUser(selectedUser.id, {
        fullName: editFullName.trim(),
        organizationName: editOrg.trim(),
        role: editRole,
      });
      editDialogRef.current?.close();
      setNotice(`Updated ${updated.fullName}.`);
      await loadData(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleToggleActive = async (u: UserProfile) => {
    setError(null);
    setNotice(null);
    try {
      const updated = await authApi.updateAdminUser(u.id, { isActive: !u.isActive });
      setNotice(
        updated.isActive
          ? `Reactivated ${updated.fullName}.`
          : `Soft-deactivated ${updated.fullName}.`
      );
      await loadData(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const openReset = (u: UserProfile) => {
    setSelectedUser(u);
    setResetTempPass('');
    resetDialogRef.current?.showModal();
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError(null);
    setNotice(null);
    try {
      const res = await authApi.resetAdminUserPassword(selectedUser.id, resetTempPass);
      resetDialogRef.current?.close();
      setResetTempPass('');
      setNotice(res.message);
      await loadData(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    }
  };

  const isAdmin = me && (me.role === 'platform_admin' || me.role === 'workspace_admin');
  const assignableRoles = roleCatalog.filter(
    (r) => !r.locked || me?.role === 'platform_admin'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Dark navy hero header (AquaSafe / WW360 user management standard) */}
      <section className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>Administration · Role-Based Access Control</span>
          </div>
          <h1 className="text-3xl font-bold">Users &amp; Access</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Manage workspace accounts, protected role tiers, soft-deactivation, and audited password
            resets.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => createDialogRef.current?.showModal()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-base font-bold shrink-0"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-base flex items-center gap-2.5"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-lg text-slate-600">
          Loading Users &amp; Access...
        </div>
      ) : !me ? (
        <section className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {hasUsers ? 'Admin Sign In Required' : 'Create First Platform Admin'}
              </h2>
              <p className="text-base text-slate-600">
                {hasUsers
                  ? 'Sign in with an administrator account to manage workspace users.'
                  : 'No users exist yet. Register the initial Platform Admin account below.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!hasUsers && (
              <div>
                <label htmlFor="boot-name" className="block text-base font-medium text-slate-800 mb-1">
                  Full Name *
                </label>
                <input
                  id="boot-name"
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>
            )}
            <div>
              <label htmlFor="boot-email" className="block text-base font-medium text-slate-800 mb-1">
                Work Email *
              </label>
              <input
                id="boot-email"
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="boot-pass" className="block text-base font-medium text-slate-800 mb-1">
                Password *
              </label>
              <input
                id="boot-pass"
                type="password"
                required
                minLength={hasUsers ? 1 : 10}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={hasUsers ? 'Enter password' : 'Minimum 10 characters'}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
            >
              {authSubmitting
                ? 'Authenticating...'
                : hasUsers
                  ? 'Sign In'
                  : 'Initialize Platform Admin'}
            </button>
          </form>
        </section>
      ) : !isAdmin ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-700 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Administrator Role Required</h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            You are signed in as <strong>{me.fullName}</strong> ({me.role}). Only Platform Admins
            and Workspace Admins can manage users.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-5 py-3 min-h-[44px] rounded-xl bg-slate-900 text-white text-base font-semibold"
          >
            Go to Your Profile
          </Link>
        </section>
      ) : (
        <>
          {/* Underline tabs: Users | Roles & permissions | Audit log */}
          <div className="border-b border-slate-200">
            <nav aria-label="User management tabs" className="flex flex-wrap gap-6 -mb-px">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                className={`inline-flex items-center gap-2 py-3.5 px-1 min-h-[48px] border-b-2 text-base font-semibold transition-colors ${
                  activeTab === 'users'
                    ? 'border-sky-600 text-sky-800'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Users ({total})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'roles'}
                onClick={() => setActiveTab('roles')}
                className={`inline-flex items-center gap-2 py-3.5 px-1 min-h-[48px] border-b-2 text-base font-semibold transition-colors ${
                  activeTab === 'roles'
                    ? 'border-sky-600 text-sky-800'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5" />
                Roles &amp; permissions
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
                className={`inline-flex items-center gap-2 py-3.5 px-1 min-h-[48px] border-b-2 text-base font-semibold transition-colors ${
                  activeTab === 'audit'
                    ? 'border-sky-600 text-sky-800'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-5 h-5" />
                Audit log ({auditLogs.length})
              </button>
            </nav>
          </div>

          {activeTab === 'users' && (
            <section className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, username, or role..."
                    className="w-full min-h-[44px] pl-11 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-base text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => createDialogRef.current?.showModal()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
                >
                  <UserPlus className="w-5 h-5" />
                  Add User
                </button>
              </div>

              {/* Users table card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Users ({users.length})</h2>
                    <p className="text-sm text-slate-600">
                      {search ? `Filtered (${users.length} of ${total} users)` : `All users (${total})`}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700">
                          User
                        </th>
                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700">
                          Role
                        </th>
                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-left text-sm font-semibold text-slate-700">
                          Organization
                        </th>
                        <th className="px-6 py-3.5 text-right text-sm font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {users.map((u) => {
                        const roleBadge = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-base font-bold shrink-0">
                                  {initials(u.fullName)}
                                </div>
                                <div>
                                  <p className="text-base font-semibold text-slate-900">
                                    {u.fullName}
                                  </p>
                                  <p className="text-sm text-slate-600">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${roleBadge.className}`}
                              >
                                {roleBadge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${
                                  u.isActive
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : 'bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-base text-slate-700">
                              {u.organizationName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="View details"
                                  aria-label={`View details for ${u.fullName}`}
                                  onClick={() => {
                                    setSelectedUser(u);
                                    detailDialogRef.current?.showModal();
                                  }}
                                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  title="Edit user"
                                  aria-label={`Edit ${u.fullName}`}
                                  onClick={() => openEdit(u)}
                                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-blue-700"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  title="Reset password"
                                  aria-label={`Reset password for ${u.fullName}`}
                                  onClick={() => openReset(u)}
                                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-amber-800"
                                >
                                  <KeyRound className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  title={u.isActive ? 'Deactivate user' : 'Reactivate user'}
                                  aria-label={
                                    u.isActive
                                      ? `Deactivate ${u.fullName}`
                                      : `Reactivate ${u.fullName}`
                                  }
                                  disabled={u.id === me.id}
                                  onClick={() => handleToggleActive(u)}
                                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-40"
                                >
                                  {u.isActive ? (
                                    <Lock className="w-5 h-5" />
                                  ) : (
                                    <Unlock className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'roles' && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roleCatalog.map((r) => {
                const badge = ROLE_STYLES[r.code] || ROLE_STYLES.viewer;
                return (
                  <div
                    key={r.code}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${badge.className}`}
                      >
                        {r.label}
                      </span>
                      {r.locked && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
                          <Lock className="w-4 h-4" />
                          Protected Tier
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{r.label}</h3>
                    <p className="text-base text-slate-700 leading-relaxed">{r.description}</p>
                  </div>
                );
              })}
            </section>
          )}

          {activeTab === 'audit' && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Administrative Audit Trail</h2>
                <p className="text-sm text-slate-600">
                  Records user creation, role updates, soft-deactivation, and admin password resets
                  (passwords are never logged).
                </p>
              </div>
              {auditLogs.length === 0 ? (
                <p className="p-6 text-base text-slate-600">No administrative actions recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="px-6 py-4 flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{log.action}</p>
                        <p className="text-sm text-slate-600">
                          Actor: {log.actorEmail} · Details: {JSON.stringify(log.detail)}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">{log.createdAt || ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {/* Create User Native <dialog> */}
      <dialog
        ref={createDialogRef}
        className="rounded-2xl p-0 max-w-lg w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <form onSubmit={handleCreateUser} className="p-6 sm:p-7 bg-white text-slate-900 space-y-4">
          <h3 className="text-2xl font-bold">Add User</h3>
          <div>
            <label htmlFor="cu-name" className="block text-base font-medium text-slate-800 mb-1">
              Full Name *
            </label>
            <input
              id="cu-name"
              type="text"
              required
              minLength={2}
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <div>
            <label htmlFor="cu-email" className="block text-base font-medium text-slate-800 mb-1">
              Email *
            </label>
            <input
              id="cu-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <div>
            <label htmlFor="cu-org" className="block text-base font-medium text-slate-800 mb-1">
              Organization
            </label>
            <input
              id="cu-org"
              type="text"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-base font-medium text-slate-800">Assign Role *</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignableRoles.map((r) => (
                <label
                  key={r.code}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border cursor-pointer text-base font-medium ${
                    newRole === r.code
                      ? 'bg-blue-50 border-blue-600 text-blue-950'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="create-role"
                    value={r.code}
                    checked={newRole === r.code}
                    onChange={() => setNewRole(r.code)}
                    className="h-4 w-4 text-blue-700"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="cu-pass" className="block text-base font-medium text-slate-800 mb-1">
              Temporary Password (min 10 chars) *
            </label>
            <input
              id="cu-pass"
              type="password"
              required
              minLength={10}
              value={newTempPass}
              onChange={(e) => setNewTempPass(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => createDialogRef.current?.close()}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white text-slate-800 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
            >
              Create User
            </button>
          </div>
        </form>
      </dialog>

      {/* Edit User Native <dialog> */}
      <dialog
        ref={editDialogRef}
        className="rounded-2xl p-0 max-w-lg w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <form onSubmit={handleEditSubmit} className="p-6 sm:p-7 bg-white text-slate-900 space-y-4">
          <h3 className="text-2xl font-bold">Edit User</h3>
          <div>
            <label htmlFor="eu-name" className="block text-base font-medium text-slate-800 mb-1">
              Full Name *
            </label>
            <input
              id="eu-name"
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <div>
            <label htmlFor="eu-org" className="block text-base font-medium text-slate-800 mb-1">
              Organization
            </label>
            <input
              id="eu-org"
              type="text"
              value={editOrg}
              onChange={(e) => setEditOrg(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-base font-medium text-slate-800">Role</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignableRoles.map((r) => (
                <label
                  key={r.code}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 min-h-[44px] rounded-xl border cursor-pointer text-base font-medium ${
                    editRole === r.code
                      ? 'bg-blue-50 border-blue-600 text-blue-950'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="edit-role"
                    value={r.code}
                    checked={editRole === r.code}
                    onChange={() => setEditRole(r.code)}
                    className="h-4 w-4 text-blue-700"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => editDialogRef.current?.close()}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white text-slate-800 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold"
            >
              Save Changes
            </button>
          </div>
        </form>
      </dialog>

      {/* Admin Reset Password Native <dialog> */}
      <dialog
        ref={resetDialogRef}
        className="rounded-2xl p-0 max-w-md w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <form onSubmit={handleResetSubmit} className="p-6 bg-white text-slate-900 space-y-4">
          <h3 className="text-2xl font-bold">Reset User Password</h3>
          <p className="text-base text-slate-600">
            Set a temporary password for <strong>{selectedUser?.email}</strong>. This action is
            audited (the password itself is never logged).
          </p>
          <div>
            <label htmlFor="rp-pass" className="block text-base font-medium text-slate-800 mb-1">
              New Temporary Password (min 10 chars) *
            </label>
            <input
              id="rp-pass"
              type="password"
              required
              minLength={10}
              value={resetTempPass}
              onChange={(e) => setResetTempPass(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => resetDialogRef.current?.close()}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white text-slate-800 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
            >
              Reset Password
            </button>
          </div>
        </form>
      </dialog>

      {/* User Details Native <dialog> */}
      <dialog
        ref={detailDialogRef}
        className="rounded-2xl p-0 max-w-md w-[calc(100%-2rem)] shadow-2xl border border-slate-200 backdrop:bg-slate-900/60"
      >
        <div className="p-6 bg-white text-slate-900 space-y-4">
          <h3 className="text-2xl font-bold">Account Details</h3>
          {selectedUser && (
            <dl className="space-y-2.5 text-base">
              <div>
                <dt className="text-sm font-semibold text-slate-500">Full Name</dt>
                <dd className="text-slate-900">{selectedUser.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">Username / Email</dt>
                <dd className="text-slate-900">
                  @{selectedUser.username} · {selectedUser.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">Role &amp; Organization</dt>
                <dd className="text-slate-900">
                  {selectedUser.role} · {selectedUser.organizationName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-500">Password Policy</dt>
                <dd className="text-slate-900">
                  {selectedUser.mustChangePassword
                    ? 'Must change temporary password on next login'
                    : 'Standard active password'}
                </dd>
              </div>
            </dl>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => detailDialogRef.current?.close()}
              className="px-5 py-2.5 min-h-[44px] rounded-lg bg-slate-900 text-white text-base font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default AdminUsersPage;
