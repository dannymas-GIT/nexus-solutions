import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, BarChart3, FileText, Link2, CheckCircle } from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();

  const offerings = [
    {
      icon: Link2,
      title: 'Data integration',
      description: 'Connect CRM, finance, marketing, and operations systems into a unified Nexus workspace.',
    },
    {
      icon: BarChart3,
      title: 'KPI targeting',
      description: 'Define the metrics that matter, build dashboards, and align teams on measurable outcomes.',
    },
    {
      icon: FileText,
      title: 'Reporting automation',
      description: 'Replace manual spreadsheet cycles with scheduled, audit-ready reports your leadership can trust.',
    },
    {
      icon: Database,
      title: 'Insight workflows',
      description: 'Centralize scattered data so analysts and operators can answer questions faster.',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 text-white">
        <div className="container mx-auto px-6 py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nexus Corporate Services</h1>
          <p className="text-xl text-blue-200 max-w-2xl mb-16">
            When data converges, insight emerges. Nexus helps established businesses streamline workflows,
            centralize information, and target the KPIs that drive performance.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {offerings.map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <item.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-blue-200/80 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Built for operators</h2>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Analysis Engine for KPI definition and tracking.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Integrations hub to connect your existing tools.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Document and reporting templates for client-ready deliverables.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Secure client portal for review and approval workflows.</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => navigate('/analysis-engine/set-kpis')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-medium"
            >
              Explore Analysis Engine
            </button>
            <p className="text-blue-300 text-sm">
              Entrepreneurs: productized agent packages live at{' '}
              <a href="https://agent-ify.com/packages" className="text-indigo-300 underline">agent-ify.com</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;
