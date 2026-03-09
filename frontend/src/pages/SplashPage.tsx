/**
 * Nexus - routing hub (shared brand layer)
 * Routes users to Launch or Intelligence landing pages. Keep only shared brand material here.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket, Database } from 'lucide-react';
import NavBar from '../components/navigation/NavBar';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <NavBar />
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/6 w-96 h-96 bg-purple-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

        <div className="relative z-10 container mx-auto px-6 pb-12 pt-32 flex flex-col items-center min-h-screen">
          <div className={`text-center transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-6xl md:text-8xl font-bold tracking-wide text-white mb-4">
              nex<span className="text-blue-300">us</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-200/90 max-w-xl mx-auto">
              Where data converges, insight emerges. Choose your path.
            </p>
          </div>

          {/* Dual CTA - Route to dedicated Launch vs Intelligence landing pages */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={() => navigate('/launch-landing')}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-amber-500/20 hover:border-amber-400/40 transition-all duration-300"
            >
              <Rocket className="h-12 w-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg mb-2">Nexus Launch</span>
              <span className="text-blue-200/80 text-sm mb-4">Start a new venture</span>
              <span className="flex items-center text-amber-400 font-medium">
                Learn more
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>
            <button
              onClick={() => navigate('/intelligence-landing')}
              className="group flex flex-col items-center p-8 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300"
            >
              <Database className="h-12 w-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg mb-2">Nexus Intelligence</span>
              <span className="text-blue-200/80 text-sm mb-4">Optimize an existing business</span>
              <span className="flex items-center text-indigo-400 font-medium">
                Learn more
                <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </button>
          </div>

          <p className="mt-12 text-blue-300/80 text-sm flex items-center justify-center gap-4 flex-wrap">
            <span>Already have an account?</span>
            <button type="button" onClick={() => navigate('/login')} className="text-indigo-300 hover:text-indigo-200 underline font-medium">
              Log in
            </button>
            <span className="text-blue-300/60">|</span>
            <span>New here?</span>
            <button type="button" onClick={() => navigate('/signup')} className="text-indigo-300 hover:text-indigo-200 underline font-medium">
              Create account
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SplashPage; 