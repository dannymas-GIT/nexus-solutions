import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import DocViewerPage from './pages/DocViewerPage';
import SplashPage from './pages/SplashPage';
import WorkspaceChoicePage from './pages/WorkspaceChoicePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import LaunchDashboard from './pages/launch/LaunchDashboard';
import LaunchIntakePage from './pages/launch/LaunchIntakePage';
import LaunchLandingPage from './pages/launch/LaunchLandingPage';
import IntelligenceDashboard from './pages/intelligence/IntelligenceDashboard';
import IntelligenceLandingPage from './pages/intelligence/IntelligenceLandingPage';
import BusinessPlanWizard from './pages/BusinessPlanWizard';
import SettingsPage from './pages/SettingsPage';
import TeamPage from './pages/team/TeamPage';
import TutorialsPage from './pages/tutorials/TutorialsPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import SetKpisPage from './pages/analysis-engine/SetKpisPage';
import LaunchOnboardingPage from './pages/launch/LaunchOnboardingPage';
import IntelligenceOnboardingPage from './pages/intelligence/IntelligenceOnboardingPage';

/**
 * App component - Dual-offering routing (Nexus Launch / Nexus Intelligence)
 */
function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/launch-landing" element={<LaunchLandingPage />} />
            <Route path="/intelligence-landing" element={<IntelligenceLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/choose-workspace" element={
              <ProtectedRoute>
                <WorkspaceChoicePage />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/launch" element={
              <ProtectedRoute>
                <LaunchOnboardingPage />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/intelligence" element={
              <ProtectedRoute>
                <IntelligenceOnboardingPage />
              </ProtectedRoute>
            } />

            {/* Nexus Launch workspace - protected */}
            <Route path="/launch" element={
              <ProtectedRoute>
                <Layout>
                  <LaunchDashboard />
                </Layout>
              </ProtectedRoute>
            } />
          <Route path="/launch/intake" element={
            <ProtectedRoute>
              <Layout>
                <LaunchIntakePage />
              </Layout>
            </ProtectedRoute>
          } />

            {/* Nexus Intelligence workspace - protected */}
            <Route path="/intelligence" element={
              <ProtectedRoute>
                <Layout>
                  <IntelligenceDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Legacy dashboard - protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Document routes - shared, protected */}
            <Route path="/docs" element={
              <ProtectedRoute>
                <Layout>
                  <DocViewerPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/docs/:category" element={
              <ProtectedRoute>
                <Layout>
                  <DocViewerPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/docs/:category/:id" element={
              <ProtectedRoute>
                <Layout>
                  <DocViewerPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Business Plan - used by Launch, protected */}
            <Route path="/create-business-plan" element={
              <ProtectedRoute>
                <Layout>
                  <BusinessPlanWizard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/my-plans" element={
              <ProtectedRoute>
                <Layout>
                  <BusinessPlanWizard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/plan-templates" element={
              <ProtectedRoute>
                <Layout>
                  <BusinessPlanWizard />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Shared: Team, Tutorials, Integrations - protected */}
            <Route path="/team" element={
              <ProtectedRoute>
                <Layout>
                  <TeamPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/tutorials" element={
              <ProtectedRoute>
                <Layout>
                  <TutorialsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute>
                <Layout>
                  <IntegrationsPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Analysis Engine - used by Intelligence, protected */}
            <Route path="/analysis-engine/set-kpis" element={
              <ProtectedRoute>
                <Layout>
                  <SetKpisPage />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Settings - shared, protected */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings/security-analysis" element={
              <ProtectedRoute>
                <Layout>
                  <div>Security Analysis Page (Placeholder)</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
