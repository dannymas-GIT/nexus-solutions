import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BarChart, Settings, ArrowRight } from 'lucide-react';

/**
 * DemoPage component
 * 
 * Showcases the main features of the Nexus Business Builder
 */
const DemoPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Build Your Business Plan <span className="text-[#0047AB]">Faster</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Nexus Business Builder helps entrepreneurs and business owners create
            professional business plans in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create-business-plan"
              className="px-8 py-3 bg-[#0047AB] text-white rounded-md font-medium hover:bg-[#003d91] transition-colors"
            >
              Get Started For Free
            </Link>
            <Link
              to="/demo"
              className="px-8 py-3 bg-white border border-[#0047AB] text-[#0047AB] rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Nexus?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-[#0047AB]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Professional Templates</h3>
            <p className="text-gray-600">
              Access dozens of industry-specific templates designed by business experts.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6 text-[#0047AB]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Financial Projections</h3>
            <p className="text-gray-600">
              Generate accurate financial forecasts with our simple-to-use tools.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-[#0047AB]" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Customizable</h3>
            <p className="text-gray-600">
              Tailor every aspect of your business plan to match your unique vision.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#0047AB] text-white p-8 sm:p-12 rounded-xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Business Plan?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who have successfully launched their business with Nexus.
          </p>
          <Link
            to="/create-business-plan"
            className="inline-flex items-center px-8 py-3 bg-white text-[#0047AB] rounded-md font-medium hover:bg-gray-100 transition-colors"
          >
            Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-lg font-semibold text-gray-600">JD</span>
              </div>
              <div>
                <h4 className="font-semibold">John Doe</h4>
                <p className="text-gray-600 text-sm">CEO, TechStart</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "Nexus helped me put together a compelling business plan that secured our first round of funding. The process was incredibly smooth."
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-lg font-semibold text-gray-600">SJ</span>
              </div>
              <div>
                <h4 className="font-semibold">Sarah Johnson</h4>
                <p className="text-gray-600 text-sm">Founder, Wellness Co.</p>
              </div>
            </div>
            <p className="text-gray-600 italic">
              "I had no idea how to create a business plan until I found Nexus. Now I have a roadmap for my business that I can share with investors."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DemoPage; 