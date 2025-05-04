import React, { useState, useEffect } from 'react';

interface DOCXViewerProps {
  filePath: string;
}

const DOCXViewer: React.FC<DOCXViewerProps> = ({ filePath }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // In a real implementation, this would use a library like mammoth.js or docx-preview
  // For this mock, we'll simulate loading Word document content
  useEffect(() => {
    setLoading(true);
    
    // Simulate DOCX loading
    const timer = setTimeout(() => {
      try {
        // Mock data for demonstration - in a real app this would parse the DOCX file
        const mockPages = [
          '<div class="page"><h1>Nexus Solutions</h1><h2>Business Overview</h2><p>Nexus Solutions is a data convergence platform that serves as the central point for all your business data.</p></div>',
          '<div class="page"><h2>Our Mission</h2><p>To enable businesses to make better decisions by providing a unified platform for data integration, analysis, and visualization.</p><p>Where Data Converges, Insight Emerges.</p></div>',
          '<div class="page"><h2>Products & Services</h2><ul><li>Data Integration Platform</li><li>Analytics Solutions</li><li>Visualization Tools</li><li>Custom Dashboards</li></ul></div>',
          '<div class="page"><h2>Contact Information</h2><p>Email: contact@nexussolutions.com</p><p>Phone: (555) 123-4567</p><p>Website: www.nexussolutions.com</p></div>'
        ];
        
        setPages(mockPages);
        setTotalPages(mockPages.length);
        setLoading(false);
      } catch (err) {
        setError('Failed to load document. Please try again later.');
        setLoading(false);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [filePath]);

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  return (
    <div className="docx-viewer">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-nexus-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-nexus-blue">Loading document...</span>
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
                onClick={previousPage} 
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded mr-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="mx-2">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={nextPage} 
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-white border border-gray-300 rounded ml-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="zoom-controls flex items-center">
              <button 
                onClick={zoomOut}
                className="px-3 py-1 bg-white border border-gray-300 rounded mr-2"
                title="Zoom Out"
              >
                -
              </button>
              <span className="mx-2">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={zoomIn}
                className="px-3 py-1 bg-white border border-gray-300 rounded ml-2"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>

          <div 
            className="document-container border border-gray-300 rounded-lg bg-white p-8 min-h-[800px]"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            <div 
              className="page-content"
              dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] || '' }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DOCXViewer; 