import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ImageGallery from './ImageGallery';
import PDFViewer from './PDFViewer';
import PPTXViewer from './PPTXViewer';
import DOCXViewer from './DOCXViewer';

// Define types for the document types and content
type DocType = 'markdown' | 'html' | 'pdf' | 'image' | 'image-gallery' | 'pptx' | 'docx';

interface DocViewerProps {
  filePath: string;
  fileType: DocType;
}

// Mock image gallery data
const mockImageGallery = [
  {
    id: 'nexus-logo',
    name: 'Nexus Logo',
    path: '/images/logo-light.png',
    description: 'Official Nexus Solutions logo with hexagon design and data flow representation'
  },
  {
    id: 'logo-design',
    name: 'Detailed Logo Design',
    path: '/images/logo_design.svg',
    description: 'Comprehensive logo design with hexagon shapes, gradients, and data flow visualization'
  },
  {
    id: 'color-palette',
    name: 'Color Palette',
    path: '/images/color_palette.svg',
    description: 'Official Nexus color palette with primary and secondary colors'
  },
  {
    id: 'pdf-mockup',
    name: 'PDF Template Mockup',
    path: '/images/pdf_template_mockup.svg',
    description: 'Full page layout with header gradient, logo, and text placeholders'
  }
];

// Mock PDF file paths
// const mockPdfFiles: Record<string, string> = { ... };

// Mock PPTX file paths
// const mockPptxFiles: Record<string, string> = { ... };

// Mock DOCX file paths
// const mockDocxFiles: Record<string, string> = { ... };

const DocViewer: React.FC<DocViewerProps> = ({ filePath, fileType }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Add state for file paths that are served directly (like PDF, PPTX, DOCX)
  const [servedFilePath, setServedFilePath] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);
      setServedFilePath(null); // Reset served file path
      setContent(''); // Reset content

      // Construct the API endpoint URL
      // Assuming the backend API is served at /api/v1 (adjust if needed)
      const apiUrl = `/api/v1/documents/files/${encodeURIComponent(filePath)}`;

      try {
        // Only fetch content for markdown/html for now
        // Other types might just need the validated path
        if (fileType === 'markdown' || fileType === 'html') { 
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(`HTTP error ${response.status}: ${errorData?.detail || 'Failed to fetch'}`);
          }
          
          const data = await response.json();
          if (data && typeof data.content === 'string') {
            setContent(data.content);
          } else {
            throw new Error('Invalid content format received from API');
          }
        } else if (fileType === 'pdf' || fileType === 'pptx' || fileType === 'docx' || fileType === 'image') {
            // For binary types or images served directly,
            // we might just need to confirm the file exists and construct a serving URL.
            // For now, let's assume the backend endpoint isn't needed for these yet,
            // and we pass the original filePath. If serving via backend is needed,
            // this would need adjustment (e.g., fetch metadata or use a dedicated serve URL).
            // We will pass the original filePath to the specific viewers for now.
            setServedFilePath(filePath); // Use the original path for now
        } else if (fileType === 'image-gallery') {
             // Image gallery uses mock data, no fetch needed yet
        } else {
           setContent(`# Unsupported file type: ${fileType}`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load document: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();

  }, [filePath, fileType]);

  if (isLoading) {
    return (
      <div className="doc-viewer-loading p-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-nexus-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-nexus-blue">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-viewer-error bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <h3 className="text-red-600 font-semibold text-lg mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (fileType) {
      case 'markdown':
        return (
          <div className="markdown-container prose prose-lg max-w-none max-h-[80vh] overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ node, inline, className, children, ...props }: {
                  node: any;
                  inline?: boolean;
                  className?: string;
                  children: React.ReactNode;
                }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              } as Components}
            >
              {content}
            </ReactMarkdown>
          </div>
        );
      case 'html':
        return (
          <div 
            className="html-container"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      case 'pdf':
        // Use servedFilePath if available, otherwise filePath (handles loading state)
        return servedFilePath ? <PDFViewer filePath={servedFilePath} /> : null;
      
      case 'pptx':
        // Use servedFilePath if available
        return servedFilePath ? <PPTXViewer filePath={servedFilePath} /> : null;
      
      case 'docx':
        // Use servedFilePath if available
        return servedFilePath ? <DOCXViewer filePath={servedFilePath} /> : null;
      
      case 'image':
        // Use servedFilePath if available
        const displayPath = servedFilePath || filePath;
        return (
          <div className="image-container flex flex-col items-center justify-center p-6">
            <div className="max-w-full overflow-auto border border-gray-200 rounded-lg p-4 bg-white">
              {displayPath.endsWith('.svg') ? (
                <object
                  data={displayPath}
                  type="image/svg+xml"
                  className="max-w-full"
                  style={{ minHeight: '300px' }}
                >
                  SVG not supported
                </object>
              ) : (
                <img 
                  src={displayPath} 
                  alt="Document" 
                  className="max-w-full"
                />
              )}
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold text-nexus-blue">{displayPath.split('/').pop()}</h3>
              <p className="text-gray-600 mt-2">{displayPath}</p>
              <a
                href={displayPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-nexus-blue text-white rounded hover:bg-blue-700 transition"
              >
                View Full Size
              </a>
            </div>
          </div>
        );
      case 'image-gallery':
        // Still uses mock data
        return <ImageGallery images={mockImageGallery} />;
      default:
        return <p>Unsupported document type: {fileType}</p>;
    }
  };

  return (
    <div className="doc-viewer">
      {renderContent()}
    </div>
  );
};

export default DocViewer; 