import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Layout } from './components/ui';
import DocViewerPage from './pages/DocViewerPage';
import SplashPage from './pages/SplashPage';
import WorkspaceChoicePage from './pages/WorkspaceChoicePage';
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

/**
 * App component - Dual-offering routing (Nexus Launch / Nexus Intelligence)
 */
function App() {
  return (
    <WorkspaceProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/launch-landing" element={<LaunchLandingPage />} />
          <Route path="/intelligence-landing" element={<IntelligenceLandingPage />} />
          <Route path="/choose-workspace" element={<WorkspaceChoicePage />} />

          {/* Nexus Launch workspace */}
          <Route path="/launch" element={
            <Layout>
              <LaunchDashboard />
            </Layout>
          } />
          <Route path="/launch/intake" element={
            <Layout>
              <LaunchIntakePage />
            </Layout>
          } />

          {/* Nexus Intelligence workspace */}
          <Route path="/intelligence" element={
            <Layout>
              <IntelligenceDashboard />
            </Layout>
          } />

          {/* Legacy dashboard - redirect to workspace choice if no workspace set */}
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />

          {/* Document routes - shared */}
          <Route path="/docs" element={
            <Layout>
              <DocViewerPage />
            </Layout>
          } />
          <Route path="/docs/:category" element={
            <Layout>
              <DocViewerPage />
            </Layout>
          } />
          <Route path="/docs/:category/:id" element={
            <Layout>
              <DocViewerPage />
            </Layout>
          } />

          {/* Business Plan - used by Launch */}
          <Route path="/create-business-plan" element={
            <Layout>
              <BusinessPlanWizard />
            </Layout>
          } />
          <Route path="/my-plans" element={
            <Layout>
              <BusinessPlanWizard />
            </Layout>
          } />
          <Route path="/plan-templates" element={
            <Layout>
              <BusinessPlanWizard />
            </Layout>
          } />

          {/* Shared: Team, Tutorials, Integrations */}
          <Route path="/team" element={
            <Layout>
              <TeamPage />
            </Layout>
          } />
          <Route path="/tutorials" element={
            <Layout>
              <TutorialsPage />
            </Layout>
          } />
          <Route path="/integrations" element={
            <Layout>
              <IntegrationsPage />
            </Layout>
          } />

          {/* Analysis Engine - used by Intelligence */}
          <Route path="/analysis-engine/set-kpis" element={
            <Layout>
              <SetKpisPage />
            </Layout>
          } />

          {/* Settings - shared */}
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />
          <Route path="/settings/security-analysis" element={
            <Layout>
              <div>Security Analysis Page (Placeholder)</div>
            </Layout>
          } />
          <Route path="/profile" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WorkspaceProvider>
  );
}

export default App;
