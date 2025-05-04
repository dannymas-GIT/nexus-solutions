import React, { useState } from 'react';

interface SearchResult {
  title: string;
  path: string;
  snippet: string;
  type: 'markdown' | 'html' | 'pdf' | 'image' | 'image-gallery' | 'pptx' | 'docx';
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onResultSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    try {
      // In a real implementation, this would be an API call to search through the documents
      // For now, we'll mock some results
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock results based on the search query
      const mockResults: SearchResult[] = [];
      const query = searchQuery.toLowerCase();
      
      if (query.includes('data') || query.includes('convergence') || query.includes('insight')) {
        mockResults.push({
          title: 'Value Proposition',
          path: '/marketing/content/value_proposition.md',
          snippet: '...Where Data Converges, Insight Emerges. Nexus Solutions transforms scattered data assets...',
          type: 'markdown'
        });
        
        mockResults.push({
          title: 'Data Convergence Email',
          path: '/marketing/campaigns/data_convergence_email.html',
          snippet: '...Transform Disconnected Data into Strategic Advantage...',
          type: 'html'
        });
      }
      
      if (query.includes('product') || query.includes('overview') || query.includes('features')) {
        mockResults.push({
          title: 'Product Overview',
          path: 'product_overview',
          snippet: '...Nexus Solutions is a data convergence platform that serves as the central point for all your business data...',
          type: 'docx'
        });
      }
      
      if (query.includes('user') || query.includes('guide') || query.includes('documentation')) {
        mockResults.push({
          title: 'User Guide',
          path: 'user_guide',
          snippet: '...Complete guide to setting up and using the Nexus platform for data integration and analysis...',
          type: 'docx'
        });
      }
      
      if (query.includes('case') || query.includes('study') || query.includes('manufacturing')) {
        mockResults.push({
          title: 'Manufacturing Case Study',
          path: '/marketing/content/manufacturing_case_study.md',
          snippet: '...Global Precision Manufacturing (GPM), a leader in high-tolerance industrial components...',
          type: 'markdown'
        });
      }
      
      if (query.includes('presentation') || query.includes('sales') || query.includes('script')) {
        mockResults.push({
          title: 'Sales Presentation Script',
          path: '/presentations/templates/sales_presentation_script.md',
          snippet: '...comprehensive script for the Nexus Solutions sales presentation...',
          type: 'markdown'
        });
      }
      
      if (query.includes('webinar') || query.includes('outline')) {
        mockResults.push({
          title: 'Webinar Outline',
          path: '/presentations/templates/webinar_outline.md',
          snippet: '...From Data Chaos to Convergence: Building the Foundation for AI-Driven Insights...',
          type: 'markdown'
        });
      }
      
      // If no specific matches, return some general results
      if (mockResults.length === 0) {
        mockResults.push({
          title: 'Brand Style Guide',
          path: '/marketing/content/brand_style_guide.md',
          snippet: '...This comprehensive guide defines the Nexus Solutions brand identity...',
          type: 'markdown'
        });
        
        mockResults.push({
          title: 'Product Datasheet',
          path: '/marketing/content/product_datasheet.md',
          snippet: '...The Nexus Convergence Platform unifies disparate data sources...',
          type: 'markdown'
        });
      }
      
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {showResults && results.length > 0 && (
        <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
          <ul className="py-1">
            {results.map((result, index) => (
              <li key={index}>
                <button
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium">{result.title}</div>
                  <div className="text-sm text-gray-600 truncate">{result.snippet}</div>
                  <div className="text-xs text-gray-500">{result.path}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 