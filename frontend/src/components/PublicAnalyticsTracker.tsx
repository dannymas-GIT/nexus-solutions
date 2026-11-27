import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPublicPageView } from '../lib/analytics';

export const PublicAnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    trackPublicPageView(location.pathname);
  }, [location.pathname]);

  return null;
};

export default PublicAnalyticsTracker;
