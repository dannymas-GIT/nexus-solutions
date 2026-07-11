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

/**
 * App component
 * 
 * Main application component with routing configuration
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        {/* Client deliverable review (magic link — no app chrome) */}
        <Route path="/portal/:token" element={<PortalPage />} />
        
        {/* Main app routes with Layout */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        {/* Document routes */}
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
        
        {/* Business Plan routes */}
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
        
        {/* Team Management */}
        <Route path="/team" element={
          <Layout>
            <TeamPage />
          </Layout>
        } />
        
        {/* Tutorials */}
        <Route path="/tutorials" element={
          <Layout>
            <TutorialsPage />
          </Layout>
        } />
        
        {/* Integrations */}
        <Route path="/integrations" element={
          <Layout>
            <IntegrationsPage />
          </Layout>
        } />
        
        {/* Analysis Engine routes */}
        <Route path="/analysis-engine/set-kpis" element={
          <Layout>
            <SetKpisPage />
          </Layout>
        } />
        
        {/* Settings */}
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
        
        {/* Profile */}
        <Route path="/profile" element={
          <Layout>
            <SettingsPage />
          </Layout>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 