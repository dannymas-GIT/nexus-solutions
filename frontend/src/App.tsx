import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui';
import PublicAnalyticsTracker from './components/PublicAnalyticsTracker';
import SaasErrorPage, { SaasErrorBoundary } from './components/SaasErrorPage';
import DocViewerPage from './pages/DocViewerPage';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
import BusinessPlanWizard from './pages/BusinessPlanWizard';
import SettingsPage from './pages/SettingsPage';
import TutorialsPage from './pages/tutorials/TutorialsPage';
import TourPage from './pages/TourPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import SetKpisPage from './pages/analysis-engine/SetKpisPage';
import PortalPage from './pages/PortalPage';
import ServicesPage from './pages/ServicesPage';
import PackagesPage from './pages/PackagesPage';
import IdeaStudioPage from './pages/IdeaStudioPage';
import RequestAuditPage from './pages/RequestAuditPage';
import ReportsPage from './pages/ReportsPage';
import PortalManagerPage from './pages/PortalManagerPage';
import AdminUsersPage from './pages/admin/users/AdminUsersPage';
import ProfilePage from './pages/profile/ProfilePage';

/**
 * Main application component with routing configuration.
 */
function App() {
  return (
    <SaasErrorBoundary>
      <Router>
        <PublicAnalyticsTracker />
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

          {/* Administration: Users & Access (canonical /admin/users + /team alias) */}
          <Route
            path="/admin/users"
            element={
              <Layout>
                <AdminUsersPage />
              </Layout>
            }
          />
          <Route
            path="/team"
            element={
              <Layout>
                <AdminUsersPage />
              </Layout>
            }
          />

          {/* Onboarding Guides & Guided Tour */}
          <Route
            path="/tutorials"
            element={
              <Layout>
                <TutorialsPage />
              </Layout>
            }
          />
          <Route
            path="/tour"
            element={
              <Layout>
                <TourPage />
              </Layout>
            }
          />

          {/* Workspace Settings */}
          <Route
            path="/settings"
            element={
              <Layout>
                <SettingsPage />
              </Layout>
            }
          />

          {/* Personal Profile & Self-Service Password (/profile#password) */}
          <Route
            path="/profile"
            element={
              <Layout>
                <ProfilePage />
              </Layout>
            }
          />

          {/* Branded 403 / 404 error pages */}
          <Route path="/403" element={<SaasErrorPage status={403} />} />
          <Route path="*" element={<SaasErrorPage status={404} />} />
        </Routes>
      </Router>
    </SaasErrorBoundary>
  );
}

export default App;
