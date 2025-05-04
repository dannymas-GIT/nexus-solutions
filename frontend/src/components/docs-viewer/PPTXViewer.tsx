import React, { useEffect, useRef, useState } from 'react';

interface PPTXViewerProps {
  filePath: string;
}

const PPTXViewer: React.FC<PPTXViewerProps> = ({ filePath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, this would use the actual pptxjs library
  // For this mock, we'll simulate loading slides as images
  useEffect(() => {
    setLoading(true);
    
    // Simulate PPTX loading
    const timer = setTimeout(() => {
      try {
        // Mock data for demonstration
        setTotalSlides(5);
        setLoading(false);
      } catch (err) {
        setError('Failed to load presentation. Please try again later.');
        setLoading(false);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [filePath]);

  const previousSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Mock slide content
  const renderSlide = (slideNumber: number) => {
    const slides = [
      <div className="slide-content flex flex-col items-center justify-center h-full">
        <h1 className="text-3xl font-bold text-nexus-blue mb-6">Nexus Solutions</h1>
        <h2 className="text-xl text-gray-600 italic">Where Data Converges, Insight Emerges</h2>
      </div>,
      <div className="slide-content h-full">
        <h2 className="text-2xl font-bold text-nexus-blue mb-4">About Us</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>Industry leader in data convergence solutions</li>
          <li>Over 10 years of experience in data analytics</li>
          <li>Serving 500+ enterprise clients globally</li>
          <li>Award-winning technology platform</li>
        </ul>
      </div>,
      <div className="slide-content h-full">
        <h2 className="text-2xl font-bold text-nexus-blue mb-4">Our Services</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-gray-200 rounded">
            <h3 className="font-bold mb-2">Data Integration</h3>
            <p className="text-sm">Seamlessly connect disparate data sources</p>
          </div>
          <div className="p-3 border border-gray-200 rounded">
            <h3 className="font-bold mb-2">Advanced Analytics</h3>
            <p className="text-sm">Derive actionable insights from your data</p>
          </div>
          <div className="p-3 border border-gray-200 rounded">
            <h3 className="font-bold mb-2">Visualization</h3>
            <p className="text-sm">Beautiful, intuitive data dashboards</p>
          </div>
          <div className="p-3 border border-gray-200 rounded">
            <h3 className="font-bold mb-2">Predictive Models</h3>
            <p className="text-sm">AI-powered forecasting and predictions</p>
          </div>
        </div>
      </div>,
      <div className="slide-content h-full">
        <h2 className="text-2xl font-bold text-nexus-blue mb-4">Case Studies</h2>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-bold">Financial Services</h3>
          <p className="text-sm">Reduced data processing time by 87% for a Fortune 500 bank</p>
        </div>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-bold">Healthcare</h3>
          <p className="text-sm">Improved patient outcomes by 35% through predictive analytics</p>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-bold">Retail</h3>
          <p className="text-sm">Increased conversion rates by 42% with personalized recommendations</p>
        </div>
      </div>,
      <div className="slide-content flex flex-col items-center justify-center h-full">
        <h2 className="text-3xl font-bold text-nexus-blue mb-6">Thank You</h2>
        <p className="text-xl mb-8">Questions?</p>
        <div className="text-gray-600">
          <p>contact@nexussolutions.com</p>
          <p>www.nexussolutions.com</p>
        </div>
      </div>
    ];

    return slides[slideNumber - 1] || <div>Slide not available</div>;
  };

  return (
    <div className="pptx-viewer">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-nexus-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-nexus-blue">Loading presentation...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="controls bg-gray-100 p-3 rounded-lg mb-4 flex justify-between items-center">
            <div className="pagination flex items-center">
              <button 
                onClick={previousSlide} 
                disabled={currentSlide <= 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded mr-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="mx-2">
                Slide {currentSlide} of {totalSlides}
              </span>
              <button 
                onClick={nextSlide} 
                disabled={currentSlide >= totalSlides}
                className="px-3 py-1 bg-white border border-gray-300 rounded ml-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="slide-container border border-gray-300 rounded-lg bg-white p-8 aspect-[4/3] relative"
            style={{ minHeight: '400px' }}
          >
            {renderSlide(currentSlide)}
          </div>
        </>
      )}
    </div>
  );
};

export default PPTXViewer; 