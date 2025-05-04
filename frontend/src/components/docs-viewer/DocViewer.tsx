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

// Mock content for different document types
const mockContent: Record<string, string> = {
  'value_proposition': `# Nexus Solutions: Where Data Converges, Insight Emerges

## Transforming Business Intelligence

At Nexus Solutions, we provide a central hub for all your data, enabling you to:

- **Connect disparate data sources** into a unified view
- **Automate analytics** with intelligent algorithms
- **Visualize insights** through intuitive dashboards
- **Make decisions faster** with real-time data processing

## Key Benefits

| Benefit | Description |
|---------|-------------|
| Increased Efficiency | Reduce analysis time by 75% |
| Cost Reduction | Lower data management costs by 40% |
| Enhanced Decision Making | Improve decision accuracy by 65% |
| Competitive Advantage | Stay ahead with predictive analytics |

[Contact us today](#) to learn how Nexus can transform your business data landscape.`,

  'product_datasheet': `# Nexus Platform Technical Specifications

## System Architecture

The Nexus Platform utilizes a cloud-native, microservices architecture designed for scalability and resilience:

\`\`\`typescript
interface NexusArchitecture {
  frontend: {
    framework: 'React';
    stateManagement: 'Redux';
    ui: 'MaterialUI';
  };
  backend: {
    runtime: 'Node.js';
    api: 'GraphQL';
    authentication: 'OAuth2/JWT';
  };
  dataProcessing: {
    engines: ['Apache Spark', 'TensorFlow'];
    storage: ['S3', 'MongoDB', 'PostgreSQL'];
  };
}
\`\`\`

## Performance Metrics

- **Data Processing Speed**: 1TB/hour
- **Concurrent Users**: 10,000+
- **API Response Time**: <100ms
- **Availability**: 99.99% uptime

## Security Features

1. End-to-end encryption
2. Role-based access control
3. Compliance with GDPR, HIPAA, and SOC2
4. Regular security audits and penetration testing`,

  'case_study': `# Case Study: Global Financial Services Firm

## Client Profile
A Fortune 500 financial services company with operations in 35 countries needed to consolidate data from 48 different systems to improve customer insights and regulatory compliance.

## Challenge
- Disparate legacy systems with incompatible data formats
- Regulatory requirements necessitating data lineage tracking
- 300+ TB of historical data requiring migration
- Real-time analytics needs for fraud detection

## Solution
Nexus Solutions implemented our flagship data convergence platform with:

1. Custom API integrations for legacy systems
2. Automated data quality validation pipelines
3. Blockchain-based data lineage tracking
4. Distributed computing framework for real-time analytics

## Results

![Results Chart](https://example.com/results-chart.png)

- **87% reduction** in data preparation time
- **$4.2M annual savings** in operational costs
- **99.97% accuracy** in regulatory reporting
- **3x faster** fraud detection capabilities`,

  'white_paper': `# White Paper: The Future of Data Convergence

## Abstract
This paper examines the emerging paradigm of data convergence and its implications for enterprise intelligence. We propose a framework for implementing unified data architectures that balance flexibility, security, and performance.

## 1. Introduction

The exponential growth of data sources has created both opportunities and challenges for organizations. As Gartner notes, "By 2025, 80% of enterprises will shut down their traditional data centers." This shift necessitates new approaches to data management.

## 2. The Convergence Imperative

Data convergence represents more than consolidation; it enables:

- Cross-domain insights
- Reduced data redundancy
- Enhanced governance
- Accelerated innovation

## 3. Technical Approaches

### 3.1 Data Mesh Architecture

\`\`\`
Domain-driven ownership + self-serve infrastructure + federated governance = Data Mesh
\`\`\`

### 3.2 Data Fabric Implementation

A data fabric provides a unified environment through:

- Metadata-driven integration
- AI-powered data discovery
- Automated policy enforcement
- Dynamic data virtualization

## 4. Conclusion

Organizations that successfully implement data convergence strategies will gain significant competitive advantages in analytics capabilities, operational efficiency, and innovation capacity.

## References

1. Smith, J. (2023). "Enterprise Data Architecture: Patterns for Success"
2. Kim, L. et al. (2024). "Quantifying ROI of Data Integration Initiatives"
3. Gartner Research. (2022). "Future of Enterprise Data Centers"`,

  'business_plan': `# Placeholder for Business Plan Content`,
  'investor_deck': `# Placeholder for Investor Deck Content`,
};

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
const mockPdfFiles: Record<string, string> = {
  'business_plan': '/sample-pdfs/business_plan.pdf',
  'investor_deck': '/sample-pdfs/investor_deck.pdf',
};

// Mock PPTX file paths
const mockPptxFiles: Record<string, string> = {
  'presentation': '/sample-pptx/presentation.pptx',
};

// Mock DOCX file paths
const mockDocxFiles: Record<string, string> = {
  'product_overview': '/sample-docx/product_overview.docx',
  'user_guide': '/sample-docx/user_guide.docx',
};

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