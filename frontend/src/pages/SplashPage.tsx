import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Rocket, BarChart3, Users, Bot, Sparkles } from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/6 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 pb-12 pt-32 flex flex-col min-h-screen">
          <div className={`mb-10 flex justify-between items-center flex-wrap transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <div className="text-2xl md:text-3xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200/70 to-blue-100/70">
              Your AI Workforce
            </div>
            <div className="text-2xl md:text-3xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200/70 to-blue-100/70">
              Agent Services for Entrepreneurs
            </div>
          </div>

          <div className={`text-center transition-all duration-1000 delay-300 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="flex items-center justify-center">
                <span className="text-blue-300/80 text-8xl font-serif mr-4 font-light italic">"</span>
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-wide text-white">
                  nex<span className="text-blue-300">us</span>
                </h1>
                <span className="text-blue-300/80 text-8xl font-serif ml-4 rotate-180 font-light italic">"</span>
              </div>
            </div>

            <p className="text-xl text-blue-100 font-light max-w-3xl mx-auto leading-relaxed mt-6">
              <span className="text-blue-300 italic">nex·us</span> | Where specialized AI agents converge to help you succeed — from book launches and SEO to content engines and business planning. Rent outcomes, not hours.
            </p>
          </div>

          <div className="bg-[#1e3a8a] text-white py-12 px-8 md:px-16 lg:px-24 mt-12 rounded-xl shadow-lg border border-blue-800">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-blue-300">AI Workforce Platform</h3>
                  <p className="text-lg leading-relaxed">
                    Nexus deploys specialized agents for real work — SEO audits, launch kits, email campaigns, industry research, and more. Each engagement produces artifacts you own. Agents learn from every delivery, so quality compounds over time.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong>For Authors:</strong> Book Launch Kits, platform SEO, and recurring content engines — designed for self-publishers ready to grow their readership.
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-blue-300">Business Command Center</h3>
                  <p className="text-lg leading-relaxed">
                    Beyond agent services, Nexus remains your planning hub — business plans, KPIs, team collaboration, and client deliverable portals. The same infrastructure powers Author2Publish, Cultivar, and TheHelm.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong>For Entrepreneurs:</strong> Start with a service package, scale to full marketing automation, and track everything from one command center.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-600 my-12 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Agent Services</h3>
              <p className="text-blue-200/80">Productized packages delivered by specialized AI agents — SEO, content, launches, and research.</p>
            </div>

            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-indigo-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compounding Quality</h3>
              <p className="text-blue-200/80">Every engagement distills into playbooks. Your agents get smarter with every project.</p>
            </div>

            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Client Portal</h3>
              <p className="text-blue-200/80">Review deliverables, approve work, and access everything you own through a secure portal.</p>
            </div>
          </div>

          <div className={`text-center transition-all duration-1000 delay-900 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/packages')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-medium text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center group"
              >
                View Packages
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/services')}
                className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-medium text-white hover:bg-white/20 transition-all duration-300"
              >
                How It Works
              </button>
            </div>

            <p className="mt-6 text-blue-300">
              Authors: explore <a href="https://author2publish.com" className="text-indigo-300 hover:text-indigo-200 underline">Author2Publish</a>
              {' · '}
              Founders: try <a href="https://cultivar.life" className="text-indigo-300 hover:text-indigo-200 underline">Cultivar</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashPage;
