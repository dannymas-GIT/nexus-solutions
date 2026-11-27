import React from 'react';
import { useNavigate } from 'react-router-dom';
import SaasTourOverlay from '../components/SaasTourOverlay';

const TourPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Nexus Guided Tour</h1>
        <p className="text-lg text-slate-600 mt-1">
          Step through how Nexus converges CSV sources, calculates KPIs, builds executive reports,
          and delivers interactive client portals.
        </p>
      </div>
      <SaasTourOverlay open={true} embedded={true} onClose={() => navigate('/dashboard')} />
    </div>
  );
};

export default TourPage;
