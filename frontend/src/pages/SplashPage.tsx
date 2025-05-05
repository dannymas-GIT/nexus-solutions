import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, BarChart3, Users } from 'lucide-react';
import NavBar from '../components/navigation/NavBar';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Trigger animations after component mounts
    setLoaded(true);
  }, []);

  return (
    <>
      <NavBar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Decorative shapes */}
          <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/6 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 pb-12 pt-32 flex flex-col min-h-screen">
          
          {/* Centered Logo Removed */}
          {/* 
          <div className="mb-8 flex justify-center">
             <img
                className={`block h-16 w-auto transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                src="/images/logo-transparent.png"
                alt="Nexus Logo"
              />
          </div>
          */}

          {/* Header Text Section */}
          <div className="mb-10 flex justify-between items-center flex-wrap">
            {/* Left Side Text */}
            <div className={`text-2xl md:text-3xl lg:text-4xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200/70 to-blue-100/70 transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'} mb-2 sm:mb-0`}>
              Data Convergence Framework
            </div>
            {/* Right Side Text */}
            <div className={`text-2xl md:text-3xl lg:text-4xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200/70 to-blue-100/70 transition-all duration-1000 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
              Business Command Center
            </div>
          </div>
          
          {/* Title section with Nexus definition */}
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
            
            <p className="text-xl text-blue-100 font-light max-w-2xl mx-auto leading-relaxed mt-6">
              <span className="text-blue-300 italic">nex·us</span> | The command center where fragmented business data converges and transforms into actionable intelligence. The catalyst that empowers leaders to see clearly, decide confidently, and execute precisely.
            </p>
          </div>
          
          {/* Consolidated Definition & Features section */}
          <div className="bg-[#1e3a8a] text-white py-12 px-8 md:px-16 lg:px-24 mt-12 rounded-xl shadow-lg border border-blue-800">
            <div className="max-w-6xl mx-auto">              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-blue-300">Data Convergence Framework</h3>
                  <p className="text-lg leading-relaxed mb-4"> 
                    Break down information silos and bring all your critical business data into one cohesive environment. Whether you're a startup building a solid foundation or an established company seeking unified intelligence, the DCF empowers confident decision-making.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Liberate your trapped data. Integrate disparate systems (CRMs, ERPs, spreadsheets) to unlock hidden trends, optimize resource allocation, and gain the holistic performance view needed to dominate your market.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-blue-300">The Business Command Center</h3>
                  <p className="text-lg leading-relaxed">
                    The bridge between your business vision and its execution. Transform entrepreneurial ideas into structured, actionable plans with our comprehensive business planning platform.
                  </p>
                  <p className="text-lg leading-relaxed mb-4"> 
                    Begin by defining your data storage strategy with efficient options tailored to your needs. Seamlessly connect to the tools you already use, including Office 365, Google Workspace, QuickBooks, and more, ensuring your command center integrates smoothly with your existing ecosystem.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Business owners and managers who operate from the Nexus achieve unparalleled clarity across all operations, unlocking organizational peak performance through centralized intelligence and data-driven decision-making.
                  </p>
                  <p className="text-lg leading-relaxed mb-4">
                    <strong>For Entrepreneurs:</strong> Start smart. Connect sales, marketing, customer feedback, and financials from day one. Avoid data chaos, accelerate growth, and make the data-driven moves that impress investors and build momentum.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features section */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-600 my-12 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-blue-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Business Planning</h3>
              <p className="text-blue-200/80">Create comprehensive business plans with financial projections, market analysis, and strategic roadmaps.</p>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-indigo-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Strategy Execution</h3>
              <p className="text-blue-200/80">Transform your plans into actionable tasks with milestone tracking and performance analytics.</p>
            </div>
            
            <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 hover:bg-white/40 transition-all duration-300 border border-white/30 shadow-2xl">
              <div className="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-blue-200/80">Share your vision, assign responsibilities, and collaborate with stakeholders in real-time.</p>
            </div>
          </div>
          
          {/* CTA */}
          <div className={`text-center transition-all duration-1000 delay-900 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-medium text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center mx-auto group"
            >
              Get Started 
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <p className="mt-4 text-blue-300">
              Already have an account? <button onClick={() => navigate('/dashboard')} className="text-indigo-300 hover:text-indigo-200 underline transition">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SplashPage; 