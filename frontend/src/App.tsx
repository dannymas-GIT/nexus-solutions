import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/ui';
import DocViewerPage from './pages/DocViewerPage';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import BusinessPlanWizard from './pages/BusinessPlanWizard';
import SettingsPage from './pages/SettingsPage';
import TeamPage from './pages/team/TeamPage';
import TutorialsPage from './pages/tutorials/TutorialsPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import SetKpisPage from './pages/analysis-engine/SetKpisPage';
import PortalPage from './pages/PortalPage';
import ServicesPage from './pages/ServicesPage';
import PackagesPage from './pages/PackagesPage';
import IdeaStudioPage from './pages/IdeaStudioPage';
import RequestAuditPage from './pages/RequestAuditPage';
import ReportsPage from './pages/ReportsPage';
import PortalManagerPage from './pages/PortalManagerPage';

/**
 * Main application component with routing configuration.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Public marketing routes (MarketingNavbar, no app sidebar) */}
        <Route path="/" element={<SplashPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/request-audit" element={<RequestAuditPage />} />
        <Route path="/packages" element={<PackagesPage />} />

        {/* Client deliverable review (magic link — dedicated client portal chrome) */}
        <Route path="/portal/:token" element={<PortalPage />} />

        {/* Main app routes with Workspace Layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* Data Sources & CSV Ingestion */}
        <Route
          path="/integrations"
          element={
            <Layout>
              <IntegrationsPage />
            </Layout>
          }
        />

        {/* Corporate KPI Engine */}
        <Route
          path="/analysis-engine/set-kpis"
          element={
            <Layout>
              <SetKpisPage />
            </Layout>
          }
        />

        {/* Executive Report Studio */}
        <Route
          path="/reports"
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />

        {/* Internal Client Portal Console */}
        <Route
          path="/portal-manager"
          element={
            <Layout>
              <PortalManagerPage />
            </Layout>
          }
        />

        {/* Document routes */}
        <Route
          path="/docs"
          element={
            <Layout>
              <DocViewerPage />
            </Layout>
          }
        />
        <Route
          path="/docs/:category"
          element={
            <Layout>
              <DocViewerPage />
            </Layout>
          }
        />
        <Route
          path="/docs/:category/:id"
          element={
            <Layout>
              <DocViewerPage />
            </Layout>
          }
        />

        {/* Strategic Plan routes */}
        <Route
          path="/create-business-plan"
          element={
            <Layout>
              <BusinessPlanWizard />
            </Layout>
          }
        />
        <Route
          path="/my-plans"
          element={
            <Layout>
              <ReportsPage />
            </Layout>
          }
        />
        <Route
          path="/plan-templates"
          element={
            <Layout>
              <BusinessPlanWizard />
            </Layout>
          }
        />

        {/* Idea Studio routes */}
        <Route
          path="/idea-studio"
          element={
            <Layout>
              <IdeaStudioPage />
            </Layout>
          }
        />
        <Route
          path="/idea-studio/:tab"
          element={
            <Layout>
              <IdeaStudioPage />
            </Layout>
          }
        />

        {/* Team Management */}
        <Route
          path="/team"
          element={
            <Layout>
              <TeamPage />
            </Layout>
          }
        />

        {/* Tutorials */}
        <Route
          path="/tutorials"
          element={
            <Layout>
              <TutorialsPage />
            </Layout>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
