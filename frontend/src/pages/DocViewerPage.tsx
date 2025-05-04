import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Search, Download, Share, Star, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import DocViewer from '../components/docs-viewer/DocViewer';
import FileExplorer from '../components/docs-viewer/FileExplorer';

type DocType = 'markdown' | 'html' | 'pdf' | 'image' | 'image-gallery' | 'pptx' | 'docx';

const DocViewerPage: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    name: string;
    type: DocType;
  } | null>({
    id: '/images/color_palette.svg',
    name: 'Color Palette',
    type: 'image',
  });

  const handleFileSelect = (filePath: string, fileType: DocType) => {
    // Extract file name from path for display
    const fileName = filePath.split('/').pop() || filePath;
    
    setSelectedDocument({
      id: filePath,
      name: fileName,
      type: fileType,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-neutral-dark">Documents</h1>
        
        <div className="relative w-1/3 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
            className="pl-10 pr-3 py-2 w-full text-sm bg-white border border-gray-200 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
        </div>
              </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 shrink-0">
          <Card className="h-full overflow-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-brand-neutral-dark mb-4">Files</h2>
              <FileExplorer 
                onFileSelect={handleFileSelect}
              />
            </div>
          </Card>
        </div>

        {/* Document Viewer */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Document viewer toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-0 mr-4">
              <h2 className="font-medium text-brand-neutral-dark truncate max-w-xs sm:max-w-md">
                {selectedDocument?.name || 'No document selected'}
              </h2>
              {selectedDocument && (
                <div className="flex items-center mt-1 sm:mt-0">
                  <span className="mx-2 text-gray-400 hidden sm:inline">|</span>
                  <span className="text-sm text-gray-500 truncate max-w-xs sm:max-w-md overflow-hidden">
                    {selectedDocument.id}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <Button variant="outline" size="sm" leftIcon={Download}>
                Download
              </Button>
              <Button variant="outline" size="sm" leftIcon={Share}>
                Share
              </Button>
              <Button variant="outline" size="sm" leftIcon={Star}>
                Favorite
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Document content */}
          <div className="flex-1 overflow-auto p-6 bg-white flex items-center justify-center">
            {selectedDocument ? (
              <DocViewer 
                filePath={selectedDocument.id} 
                fileType={selectedDocument.type} 
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>Select a document to view</p>
              </div>
            )}
        </div>
        </Card>
      </div>
    </div>
  );
};

export default DocViewerPage; 