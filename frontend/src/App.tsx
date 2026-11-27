import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/ui';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import PublicAnalyticsTracker from './components/PublicAnalyticsTracker';
import SaasErrorPage, { SaasErrorBoundary } from './components/SaasErrorPage';
import DocViewerPage from './pages/DocViewerPage';
import SplashPage from './pages/SplashPage';
import LoginPage from './pages/LoginPage';
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

function ProtectedWorkspaceLayout() {
  return (
    <RequireAuth>
      <Layout>
        <Outlet />
      </Layout>
    </RequireAuth>
  );
}

/**
 * Main application component with routing configuration.
 */
function App() {
  return (
    <SaasErrorBoundary>
      <Router>
        <AuthProvider>
          <PublicAnalyticsTracker />
          <Routes>
            {/* Public marketing & authentication routes (no workspace sidebar/navbar) */}
            <Route path="/" element={<SplashPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/request-audit" element={<RequestAuditPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Client deliverable review (magic link — dedicated client portal chrome) */}
            <Route path="/portal/:token" element={<PortalPage />} />

            {/* Authenticated Nexus workspace routes (gated behind RequireAuth) */}
            <Route element={<ProtectedWorkspaceLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/analysis-engine/set-kpis" element={<SetKpisPage />} />
              <Route path="/kpis" element={<SetKpisPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/portal-manager" element={<PortalManagerPage />} />

              {/* Documents */}
              <Route path="/docs" element={<DocViewerPage />} />
              <Route path="/docs/:category" element={<DocViewerPage />} />
              <Route path="/docs/:category/:id" element={<DocViewerPage />} />
              <Route path="/documents" element={<DocViewerPage />} />

              {/* Strategic Plan routes */}
              <Route path="/create-business-plan" element={<BusinessPlanWizard />} />
              <Route path="/my-plans" element={<ReportsPage />} />
              <Route path="/plan-templates" element={<BusinessPlanWizard />} />

              {/* Idea Studio routes */}
              <Route path="/idea-studio" element={<IdeaStudioPage />} />
              <Route path="/idea-studio/:tab" element={<IdeaStudioPage />} />

              {/* Administration: Users & Access (canonical /admin/users + /team alias) */}
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/team" element={<AdminUsersPage />} />

              {/* Onboarding Guides & Guided Tour */}
              <Route path="/tutorials" element={<TutorialsPage />} />
              <Route path="/tour" element={<TourPage />} />

              {/* Workspace Settings & Personal Profile */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Branded 403 / 404 error pages */}
            <Route path="/403" element={<SaasErrorPage status={403} />} />
            <Route path="*" element={<SaasErrorPage status={404} />} />
          </Routes>
        </AuthProvider>
      </Router>
    </SaasErrorBoundary>
  );
}

export default App;
