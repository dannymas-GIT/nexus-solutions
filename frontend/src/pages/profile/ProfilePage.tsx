import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  LogIn,
} from 'lucide-react';
import { authApi, getAuthToken, type UserProfile } from '@/services/authApi';

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasUsers, setHasUsers] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Auth form when signed out
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authOrg, setAuthOrg] = useState('Nexus Workspace');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Profile edit form
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Self-service password form (#password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const status = await authApi.status();
      setHasUsers(status.hasUsers);
      if (!status.hasUsers) setMode('register');

      if (!getAuthToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await authApi.me();
      setUser(me);
      setFullName(me.fullName);
      setOrganizationName(me.organizationName);
      setError(null);
    } catch {
      authApi.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!loading && location.hash === '#password') {
      const el = document.getElementById('password');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAuth(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'register') {
        await authApi.register({
          email: authEmail.trim(),
          password: authPassword,
          fullName: authFullName.trim(),
          organizationName: authOrg.trim() || 'Nexus Workspace',
        });
        setNotice('Account created and signed in.');
      } else {
        await authApi.login(authEmail.trim(), authPassword);
        setNotice('Signed in successfully.');
      }
      setAuthPassword('');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await authApi.updateMe({
        fullName: fullName.trim(),
        organizationName: organizationName.trim(),
      });
      setUser(updated);
      setNotice('Profile details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice(res.message || 'Password updated successfully.');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = () => {
    authApi.logout();
    setUser(null);
    setNotice('You have signed out.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section className="rounded-2xl bg-slate-950 text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-sm font-medium">
            <User className="w-4 h-4" />
            <span>Personal Account</span>
          </div>
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-lg text-slate-300">
            Review your access context and manage your personal password.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-base font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
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
          Loading account profile...
        </div>
      ) : !user ? (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LogIn className="w-6 h-6 text-blue-700" />
              <h2 className="text-2xl font-bold text-slate-900">
                {mode === 'login' ? 'Sign In to Nexus' : 'Create Your Account'}
              </h2>
            </div>
            {hasUsers && (
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-base font-semibold text-blue-700 hover:underline min-h-[44px] px-2"
              >
                {mode === 'login' ? 'Need an account?' : 'Have an account? Sign in'}
              </button>
            )}
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="prof-reg-name" className="block text-base font-medium text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="prof-reg-name"
                    type="text"
                    required
                    minLength={2}
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
                  />
                </div>
                <div>
                  <label htmlFor="prof-reg-org" className="block text-base font-medium text-slate-800 mb-1">
                    Organization
                  </label>
                  <input
                    id="prof-reg-org"
                    type="text"
                    value={authOrg}
                    onChange={(e) => setAuthOrg(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="prof-email" className="block text-base font-medium text-slate-800 mb-1">
                Email or Username *
              </label>
              <input
                id="prof-email"
                type={mode === 'register' ? 'email' : 'text'}
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
              />
            </div>

            <div>
              <label htmlFor="prof-pass" className="block text-base font-medium text-slate-800 mb-1">
                Password *
              </label>
              <input
                id="prof-pass"
                type="password"
                required
                minLength={mode === 'register' ? 10 : 1}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimum 10 characters' : 'Enter your password'}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base"
              />
            </div>

            <button
              type="submit"
              disabled={submittingAuth}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
            >
              {submittingAuth
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : hasUsers
                    ? 'Create Account'
                    : 'Create Initial Platform Admin'}
            </button>
          </form>
        </section>
      ) : (
        <>
          {user.mustChangePassword && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-base"
            >
              Your account is using a temporary password. Please update your password below before
              continuing.
            </div>
          )}

          {/* Account Details Card */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
                <h2 className="text-2xl font-bold text-slate-900">Account Identity &amp; Access</h2>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-950 text-sm font-semibold">
                Role: {user.role}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-base">
              <div>
                <p className="text-sm font-semibold text-slate-500">Username</p>
                <p className="text-slate-900 font-medium">@{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Email Address</p>
                <p className="text-slate-900 font-medium">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-name" className="block text-base font-medium text-slate-800 mb-1">
                    Full Name
                  </label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    minLength={2}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="p-org" className="block text-base font-medium text-slate-800 mb-1">
                    Organization / Workspace
                  </label>
                  <input
                    id="p-org"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>

          {/* Self-Service Password Change (#password) */}
          <section
            id="password"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 scroll-mt-24"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-blue-700" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
                <p className="text-base text-slate-600">
                  Use a unique passphrase of at least 10 characters.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label htmlFor="pw-current" className="block text-base font-medium text-slate-800 mb-1">
                  Current Password *
                </label>
                <input
                  id="pw-current"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="pw-new" className="block text-base font-medium text-slate-800 mb-1">
                  New Password (min 10 characters) *
                </label>
                <input
                  id="pw-new"
                  type="password"
                  required
                  minLength={10}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="pw-confirm" className="block text-base font-medium text-slate-800 mb-1">
                  Confirm New Password *
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  required
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 text-base text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold disabled:opacity-50"
              >
                <KeyRound className="w-5 h-5" />
                {savingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
