import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import MarketingNavbar from '../components/navigation/MarketingNavbar';

const AGENT_IFY_PACKAGES_URL = 'https://agent-ify.com/packages';

const PackagesPage: React.FC = () => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(AGENT_IFY_PACKAGES_URL);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
      <MarketingNavbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          Solo Founder & Author Packages Moved to Agent-ify
        </h1>
        <p className="text-lg text-blue-100/90 leading-relaxed">
          Nexus Solutions focuses on corporate data convergence, KPI workflows, and Idea Studio.
          Productized author and solo-founder packages are hosted at{' '}
          <strong className="text-white">agent-ify.com</strong>.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <a
            href={AGENT_IFY_PACKAGES_URL}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-base font-semibold"
          >
            Continue to Agent-ify Packages
            <ExternalLink className="w-5 h-5" />
          </a>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-base font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Stay on Nexus Corporate Services
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PackagesPage;
