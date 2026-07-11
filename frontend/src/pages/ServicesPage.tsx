import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, FileText, MessageSquare, Rocket } from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: MessageSquare,
      title: 'Tell us your goal',
      description: 'Choose a package or describe what you need. Our planning agent scopes the work.',
    },
    {
      icon: Bot,
      title: 'Agents do the work',
      description: 'Specialized agents produce deliverables — content, audits, launch plans, research reports.',
    },
    {
      icon: FileText,
      title: 'Review in your portal',
      description: 'Everything lands in your Nexus client portal. You own every artifact we produce.',
    },
    {
      icon: Rocket,
      title: 'Launch and grow',
      description: 'Apply deliverables immediately. Agents remember what worked and improve next time.',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 text-white">
        <div className="container mx-auto px-6 py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How Nexus Agent Services Work</h1>
          <p className="text-xl text-blue-200 max-w-2xl mb-16">
            We rent outcomes, not hours. Every package is fulfilled by a team of specialized AI agents
            coordinated through our Agent Fabric — the same technology behind Author2Publish and TheHelm.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {steps.map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <step.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-blue-200/80 text-sm">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Ethic</h2>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> You own every deliverable — plans, content, audits, and reports.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Flat, legible pricing — no surprise hourly bills.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Agents compound knowledge — every client makes the next delivery better.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-5 h-5 text-green-400 mt-0.5" /> Human QA on every package before it reaches your portal.</li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/packages')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-medium"
          >
            See Author Packages
          </button>
        </div>
      </div>
    </>
  );
};

export default ServicesPage;
