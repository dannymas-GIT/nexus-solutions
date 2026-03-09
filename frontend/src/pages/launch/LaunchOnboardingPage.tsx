import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { api } from '../../lib/api';
import { WorkspaceOut } from '../../lib/api';

/**
 * First-step onboarding for Nexus Launch: name your venture, then go to dashboard.
 */
const LaunchOnboardingPage: React.FC = () => {
  const [ventureName, setVentureName] = useState('');
  const [workspaces, setWorkspaces] = useState<WorkspaceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api<WorkspaceOut[]>('/workspaces')
      .then((ws) => {
        setWorkspaces(ws.filter((w) => w.workspace_type === 'launch'));
        if (ws.filter((w) => w.workspace_type === 'launch').length > 0) {
          setVentureName(ws.filter((w) => w.workspace_type === 'launch')[0].name);
        }
      })
      .catch(() => setWorkspaces([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const launchWs = workspaces.find((w) => w.workspace_type === 'launch');
    try {
      if (launchWs && ventureName.trim()) {
        await api(`/workspaces/${launchWs.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: ventureName.trim() }),
        });
      }
      navigate('/launch');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-amber-100">
            <Rocket className="h-8 w-8 text-amber-600" />
          </div>
          <span className="text-amber-700 font-semibold">Nexus Launch</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Name your venture</h1>
        <p className="text-gray-600 mb-6">
          Give your project a name. You can change it later in settings.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venture name</label>
            <input
              type="text"
              value={ventureName}
              onChange={(e) => setVentureName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="My Startup"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Continue to Launch'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => navigate('/launch')}
          className="mt-4 w-full text-gray-500 text-sm hover:text-gray-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default LaunchOnboardingPage;
