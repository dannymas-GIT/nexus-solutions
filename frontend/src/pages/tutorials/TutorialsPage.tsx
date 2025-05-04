import React, { useState } from 'react';
import {
  // BookOpen, // Unused
  Play, CheckCircle, Clock, Search,
  Filter, ChevronDown, Star, ArrowRight, 
  // ChevronRight, // Unused
  Monitor, FileText, Database, PieChart
} from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'Getting Started' | 'Business Planning' | 'Reporting' | 'Data Integration';
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnailUrl: string;
  videoUrl: string;
  completed: boolean;
  featured: boolean;
}

const TutorialsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState<Tutorial | null>(null);
  
  // Sample tutorials data
  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Welcome to Nexus',
      description: 'Learn the basics of Nexus and how to navigate the platform.',
      category: 'Getting Started',
      duration: 5,
      difficulty: 'Beginner',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=Welcome+to+Nexus',
      videoUrl: 'https://example.com/videos/welcome-to-nexus',
      completed: false,
      featured: true,
    },
    {
      id: '2',
      title: 'Creating Your First Business Plan',
      description: 'Step-by-step guide to creating your first business plan in Nexus.',
      category: 'Business Planning',
      duration: 12,
      difficulty: 'Beginner',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=First+Business+Plan',
      videoUrl: 'https://example.com/videos/first-business-plan',
      completed: false,
      featured: true,
    },
    {
      id: '3',
      title: 'Advanced Financial Reporting',
      description: 'Learn how to create detailed financial reports and forecasts.',
      category: 'Reporting',
      duration: 18,
      difficulty: 'Advanced',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=Financial+Reporting',
      videoUrl: 'https://example.com/videos/advanced-financial-reporting',
      completed: false,
      featured: false,
    },
    {
      id: '4',
      title: 'Importing Data from External Sources',
      description: 'Connect your external data sources to Nexus for comprehensive analysis.',
      category: 'Data Integration',
      duration: 15,
      difficulty: 'Intermediate',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=Data+Import',
      videoUrl: 'https://example.com/videos/importing-data',
      completed: false,
      featured: false,
    },
    {
      id: '5',
      title: 'Team Collaboration Features',
      description: 'Discover how to collaborate with your team using Nexus.',
      category: 'Getting Started',
      duration: 8,
      difficulty: 'Beginner',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=Team+Collaboration',
      videoUrl: 'https://example.com/videos/team-collaboration',
      completed: false,
      featured: true,
    },
    {
      id: '6',
      title: 'Creating Custom Reports',
      description: 'Build tailored reports for your specific business needs.',
      category: 'Reporting',
      duration: 22,
      difficulty: 'Intermediate',
      thumbnailUrl: 'https://via.placeholder.com/320x180/2563eb/ffffff?text=Custom+Reports',
      videoUrl: 'https://example.com/videos/custom-reports',
      completed: false,
      featured: false,
    },
  ];
  
  // Filter tutorials based on search, category, and difficulty
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tutorial.category === activeCategory;
    const matchesDifficulty = activeDifficulty === 'all' || tutorial.difficulty === activeDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  
  // Get featured tutorials
  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured);
  
  // Category icons
  const categoryIcons = {
    'Getting Started': <Monitor className="w-5 h-5 text-blue-500" />,
    'Business Planning': <FileText className="w-5 h-5 text-green-500" />,
    'Reporting': <PieChart className="w-5 h-5 text-purple-500" />,
    'Data Integration': <Database className="w-5 h-5 text-amber-500" />
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tutorials & Learning Resources</h1>
        <p className="text-gray-600 mt-2">
          Master Nexus with our comprehensive learning resources and step-by-step tutorials
        </p>
      </div>
      
      {activeVideo ? (
        // Video player view
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="aspect-w-16 aspect-h-9 bg-gray-800">
            <div className="flex items-center justify-center">
              <div className="text-white text-center">
                <Play className="w-16 h-16 mx-auto mb-2" />
                <p>Video player would be here</p>
                <p className="text-sm text-gray-400">Currently showing a placeholder for: {activeVideo.title}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeVideo.title}</h2>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{activeVideo.duration} minutes</span>
                  <span className="mx-2">•</span>
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    activeVideo.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                    activeVideo.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activeVideo.difficulty}
                  </div>
                  <span className="mx-2">•</span>
                  <div className="flex items-center">
                    {categoryIcons[activeVideo.category]}
                    <span className="ml-1">{activeVideo.category}</span>
                  </div>
                </div>
              </div>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                onClick={() => setActiveVideo(null)}
              >
                Back to Tutorials
              </button>
            </div>
            
            <p className="text-gray-600 mt-4">
              {activeVideo.description}
            </p>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Lesson Content</h3>
              
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div className="flex-grow">
                    <h4 className="font-medium">Introduction</h4>
                    <p className="text-sm text-gray-500">Overview of what you'll learn</p>
                  </div>
                  <span className="text-sm text-gray-500">1:30</span>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                    <span className="text-xs">2</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">Key Concepts</h4>
                    <p className="text-sm text-gray-500">Understanding the fundamentals</p>
                  </div>
                  <span className="text-sm text-gray-500">3:45</span>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                    <span className="text-xs">3</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">Practical Application</h4>
                    <p className="text-sm text-gray-500">Hands-on demonstration</p>
                  </div>
                  <span className="text-sm text-gray-500">5:20</span>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                    <span className="text-xs">4</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">Advanced Tips</h4>
                    <p className="text-sm text-gray-500">Expert tricks and shortcuts</p>
                  </div>
                  <span className="text-sm text-gray-500">4:15</span>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <FileText className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="font-medium">Downloadable Guide</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </a>
                  <a href="#" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <FileText className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="font-medium">Exercise Files</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tutorials listing view
        <>
          {/* Featured tutorials */}
          {featuredTutorials.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Tutorials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTutorials.map(tutorial => (
                  <div 
                    key={tutorial.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setActiveVideo(tutorial)}
                  >
                    <div className="relative">
                      <img 
                        src={tutorial.thumbnailUrl} 
                        alt={tutorial.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" fill="white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        Featured
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{tutorial.duration} min</span>
                        <span className="mx-2">•</span>
                        <div className={`px-2 py-0.5 rounded text-xs ${
                          tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tutorial.difficulty}
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-gray-900">{tutorial.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{tutorial.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutorials..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="relative inline-block">
                <button
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  <span>Category</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 hidden">
                  <div className="p-2">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeCategory === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveCategory('all')}
                    >
                      All Categories
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeCategory === 'Getting Started' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveCategory('Getting Started')}
                    >
                      Getting Started
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeCategory === 'Business Planning' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveCategory('Business Planning')}
                    >
                      Business Planning
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeCategory === 'Reporting' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveCategory('Reporting')}
                    >
                      Reporting
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeCategory === 'Data Integration' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveCategory('Data Integration')}
                    >
                      Data Integration
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative inline-block">
                <button
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Star className="w-5 h-5 mr-2" />
                  <span>Difficulty</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 hidden">
                  <div className="p-2">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeDifficulty === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveDifficulty('all')}
                    >
                      All Levels
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeDifficulty === 'Beginner' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveDifficulty('Beginner')}
                    >
                      Beginner
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeDifficulty === 'Intermediate' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveDifficulty('Intermediate')}
                    >
                      Intermediate
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded hover:bg-gray-100 ${activeDifficulty === 'Advanced' ? 'bg-blue-50 text-blue-600' : ''}`}
                      onClick={() => setActiveDifficulty('Advanced')}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow transition-all cursor-pointer"
                onClick={() => setActiveCategory('Getting Started')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    {categoryIcons['Getting Started']}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Getting Started</h3>
                    <p className="text-sm text-gray-500">Foundational tutorials</p>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow transition-all cursor-pointer"
                onClick={() => setActiveCategory('Business Planning')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    {categoryIcons['Business Planning']}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Business Planning</h3>
                    <p className="text-sm text-gray-500">Create effective plans</p>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow transition-all cursor-pointer"
                onClick={() => setActiveCategory('Reporting')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    {categoryIcons['Reporting']}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Reporting</h3>
                    <p className="text-sm text-gray-500">Generate insights</p>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow transition-all cursor-pointer"
                onClick={() => setActiveCategory('Data Integration')}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                    {categoryIcons['Data Integration']}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Data Integration</h3>
                    <p className="text-sm text-gray-500">Connect data sources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* All tutorials */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              All Tutorials
              {activeCategory !== 'all' && ` - ${activeCategory}`}
              {activeDifficulty !== 'all' && ` (${activeDifficulty})`}
            </h2>
            
            {filteredTutorials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutorials.map(tutorial => (
                  <div 
                    key={tutorial.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setActiveVideo(tutorial)}
                  >
                    <div className="relative">
                      <img 
                        src={tutorial.thumbnailUrl} 
                        alt={tutorial.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" fill="white" />
                        </div>
                      </div>
                      {tutorial.completed && (
                        <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <div className="flex items-center mr-2">
                          {categoryIcons[tutorial.category]}
                          <span className="ml-1 text-xs">{tutorial.category}</span>
                        </div>
                        <span className="mx-1">•</span>
                        <Clock className="w-4 h-4 mx-1" />
                        <span>{tutorial.duration} min</span>
                        <span className="mx-1">•</span>
                        <div className={`px-2 py-0.5 rounded text-xs ${
                          tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tutorial.difficulty}
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{tutorial.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{tutorial.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No tutorials found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TutorialsPage; 