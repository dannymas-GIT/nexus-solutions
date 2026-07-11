import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Calendar } from 'lucide-react';
import Navbar from '../components/navigation/Navbar';

const PACKAGES = [
  {
    id: 'book-launch-kit',
    icon: BookOpen,
    name: 'Book Launch Kit',
    price: '$199',
    tagline: 'Everything to launch your book in 30 days',
    features: [
      'Blurb + metadata keywords',
      '30-day launch plan',
      '30 social media posts',
      '5-email launch sequence',
    ],
    highlighted: true,
  },
  {
    id: 'author-platform-seo',
    icon: Search,
    name: 'Author Platform SEO',
    price: '$249',
    tagline: 'Get found by readers searching for books like yours',
    features: [
      'Lighthouse + accessibility audit',
      'Prioritized SEO fixes list',
      '4 SEO-optimized articles',
    ],
    highlighted: false,
  },
  {
    id: 'content-engine',
    icon: Calendar,
    name: 'Content Engine',
    price: '$129/mo',
    tagline: 'Weekly blog + social calendar on autopilot',
    features: [
      '1 SEO blog post per week',
      '7-day social media calendar',
      'Scheduled agent delivery',
      'Brand voice consistency',
    ],
    highlighted: false,
  },
];

const PackagesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 text-white">
        <div className="container mx-auto px-6 py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Author Service Packages</h1>
          <p className="text-xl text-blue-200 max-w-2xl mb-16">
            Productized outcomes for self-published authors. Delivered by AI agents, reviewed by humans,
            owned by you. Also available on Upwork and Fiverr.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-xl p-8 border ${
                  pkg.highlighted
                    ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {pkg.highlighted && (
                  <span className="text-xs font-medium text-blue-300 bg-blue-800/50 px-2 py-1 rounded mb-4 inline-block">
                    Most Popular
                  </span>
                )}
                <pkg.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-semibold">{pkg.name}</h3>
                <p className="text-3xl font-bold mt-2">{pkg.price}</p>
                <p className="text-blue-200/80 mt-2 mb-6">{pkg.tagline}</p>
                <ul className="space-y-2 mb-8">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-100">
                      <span className="text-green-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full py-3 rounded-lg font-medium ${
                    pkg.highlighted
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          <div className="text-center text-blue-300">
            <p>Also explore our author SaaS: <a href="https://author2publish.com" className="text-indigo-300 underline">Author2Publish</a></p>
            <p className="mt-2">
              <button onClick={() => navigate('/services')} className="text-indigo-300 underline">
                Learn how agent services work
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PackagesPage;
