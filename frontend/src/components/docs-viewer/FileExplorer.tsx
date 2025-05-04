import React, { useState, useEffect } from 'react';
import { FiFile, FiFolder, FiChevronRight, FiChevronDown, FiImage, FiFileText, FiPieChart, FiBookOpen, FiSliders, FiLoader, FiAlertCircle } from 'react-icons/fi';

// Define the file tree structure (matching backend response)
interface FileNode {
  id: string; // Now the full relative path
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  fileType?: 'markdown' | 'html' | 'pdf' | 'image' | 'image-gallery' | 'pptx' | 'docx';
}

interface FileExplorerProps {
  onFileSelect: (filePath: string, fileType: 'markdown' | 'html' | 'pdf' | 'image' | 'image-gallery' | 'pptx' | 'docx') => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  // Remove Mock file structure
  // const initialFiles: FileNode[] = [ ... ];

  // State for the actual file tree, loading, and errors
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for expanded folders and selected file
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // Start empty
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Fetch file tree from backend on mount
  useEffect(() => {
    const fetchFileTree = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/documents/tree');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(`HTTP error ${response.status}: ${errorData?.detail || 'Failed to fetch tree'}`);
        }
        const data: FileNode[] = await response.json();
        setFileTree(data);
        // Optionally expand the top-level folders by default
        const initialExpanded = new Set(data.filter(node => node.type === 'folder').map(node => node.id));
        setExpandedFolders(initialExpanded);

      } catch (err) {
        console.error("Failed to fetch file tree:", err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching files');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileTree();
  }, []); // Empty dependency array means run once on mount

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }
    setExpandedFolders(newExpandedFolders);
  };

  // Handle file selection
  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file' && file.fileType) {
      // Use the ID which is now the full relative path
      setSelectedFile(file.id);
      onFileSelect(file.id, file.fileType);
    }
  };

  // Get icon for file type
  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'image':
      case 'image-gallery':
        return <FiImage className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <FiFileText className="w-4 h-4 text-red-500" />;
      case 'pptx':
        return <FiSliders className="w-4 h-4 text-orange-500" />;
      case 'docx':
        return <FiFileText className="w-4 h-4 text-blue-600" />;
      case 'markdown':
        return <FiBookOpen className="w-4 h-4 text-blue-500" />;
      default:
        return <FiFile className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get folder icon based on folder ID (adjust if needed based on API response IDs)
  const getFolderIcon = (folderId: string) => {
    // Use includes or startsWith if IDs are now full paths like 'marketing/...'
    const baseFolder = folderId.split('/')[0]; // Get the top-level folder name
    switch (baseFolder) {
      case 'marketing':
        return <FiPieChart className="w-4 h-4 text-purple-500" />;
      case 'presentations': // Assuming presentations folder exists
        return <FiSliders className="w-4 h-4 text-orange-500" />;
       // Add cases for other potential top-level folders if needed
      default:
        // Icon for subfolders or other top-level folders
        return <FiFolder className="w-4 h-4 text-yellow-500" />;
    }
  };

  // Recursive function to render the file tree (uses fileTree state)
  const renderTree = (nodes: FileNode[]) => {
    return (
      <ul className="space-y-1">
        {nodes.map((node) => (
          <li key={node.id} className="py-0.5">
            {node.type === 'folder' ? (
              <div>
                <button 
                  onClick={() => toggleFolder(node.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <span className="text-gray-400 w-4">
                    {expandedFolders.has(node.id) ? (
                      <FiChevronDown className="w-4 h-4" />
                    ) : (
                      <FiChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  {getFolderIcon(node.id)}
                  <span className="text-sm font-medium">{node.name}</span>
                </button>
                {expandedFolders.has(node.id) && node.children && (
                  <div className="pl-3 mt-1 border-l border-gray-200 ml-3">
                    {renderTree(node.children)}
                  </div>
                )}
              </div>
            ) : (
              <button
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md 
                  ${selectedFile === node.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'hover:bg-gray-100 text-gray-700'}
                  transition-colors`}
                onClick={() => handleFileClick(node)}
              >
                <span className="w-4"></span> {/* Indentation spacer */}
                {getFileIcon(node.fileType)}
                <span className="text-sm truncate">{node.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <FiLoader className="animate-spin mr-2" /> Loading files...
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          <strong>Error loading files:</strong>
        </div>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  // Render the tree using the fetched data
  return <div>{renderTree(fileTree)}</div>;
};

export default FileExplorer; 