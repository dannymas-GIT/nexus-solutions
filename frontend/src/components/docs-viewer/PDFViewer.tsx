import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Use a fake worker to avoid external dependencies
pdfjs.GlobalWorkerOptions.workerSrc = '';

interface PDFViewerProps {
  filePath: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError(`Unable to load PDF. Please check if the file exists and try again later.`);
    setLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.max(1, Math.min(numPages || 1, prevPageNumber + offset)));
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(2.0, prevScale + 0.1));
  const zoomOut = () => setScale(prevScale => Math.max(0.5, prevScale - 0.1));
  const resetZoom = () => setScale(1.0);

  const toggleFallbackMode = () => {
    setFallbackMode(!fallbackMode);
  };

  // Mock content for fallback mode - in a real application, this would be fetched from an API
  const renderFallbackContent = () => {
    // Extract file name from path
    const fileName = filePath.split('/').pop() || 'document';
    
    if (filePath.includes('business_plan')) {
      return (
        <div className="fallback-content p-6">
          <h1 className="text-2xl font-bold mb-4">Nexus Solutions Business Plan</h1>
          <h2 className="text-xl text-gray-600 italic mb-6">Where Data Converges, Insight Emerges</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
            <p className="mb-2">Nexus Solutions provides a revolutionary data convergence platform that enables businesses to integrate, analyze, and visualize all their data in one central location.</p>
            <p>Our platform reduces data analysis time by 75% and improves decision accuracy by 65%, giving our clients a significant competitive advantage.</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Market Opportunity</h3>
            <p>The global data integration market is projected to reach $19.6 billion by 2026, growing at a CAGR of 14.2%.</p>
          </div>
          
          <div className="text-sm text-gray-500 mt-8 border-t pt-4">
            <p>Note: This is a simplified text version of the PDF document. For the complete document with charts and formatting, please view the PDF directly.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fallback-content p-6">
        <h1 className="text-xl font-bold mb-4">{fileName}</h1>
        <p className="text-gray-600 mb-6">PDF content preview is not available</p>
        <div className="bg-gray-100 p-4 rounded">
          <p>This is a simplified text representation of the document.</p>
          <p className="mt-2">To view the complete document with proper formatting, please download and open it in a PDF viewer.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="pdf-viewer">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-nexus-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-nexus-blue">Loading PDF...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h3 className="font-semibold mb-2">PDF Viewer Error</h3>
          <p>{error}</p>
          <div className="mt-4">
            <p className="text-sm">You can try:</p>
            <ul className="list-disc pl-5 text-sm mt-2">
              <li>Checking if the file exists at the specified path</li>
              <li>Using a different browser</li>
              <li>Downloading the PDF and viewing it locally</li>
            </ul>
          </div>
          <button 
            onClick={toggleFallbackMode}
            className="mt-4 px-4 py-2 bg-nexus-blue text-white rounded hover:bg-blue-700 transition"
          >
            {fallbackMode ? "Hide Text Preview" : "Show Text Preview"}
          </button>
          
          {fallbackMode && (
            <div className="mt-4 border border-gray-200 rounded-lg bg-white">
              {renderFallbackContent()}
            </div>
          )}
        </div>
      )}

      <div className="controls bg-gray-100 p-3 rounded-lg mb-4 flex justify-between items-center">
        <div className="pagination flex items-center">
          <button 
            onClick={previousPage} 
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-white border border-gray-300 rounded mr-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-2">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <button 
            onClick={nextPage} 
            disabled={!numPages || pageNumber >= numPages}
            className="px-3 py-1 bg-white border border-gray-300 rounded ml-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        
        <div className="zoom-controls flex items-center">
          <button 
            onClick={zoomOut}
            className="px-3 py-1 bg-white border border-gray-300 rounded mr-2"
          >
            -
          </button>
          <button 
            onClick={resetZoom}
            className="px-3 py-1 bg-white border border-gray-300 rounded mr-2"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={zoomIn}
            className="px-3 py-1 bg-white border border-gray-300 rounded"
          >
            +
          </button>
        </div>
      </div>

      <div className="document-container border border-gray-300 rounded-lg p-4 bg-white flex justify-center">
        <Document
          file={filePath}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-nexus-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 