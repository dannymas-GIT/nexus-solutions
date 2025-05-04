import React from 'react';

interface ImageInfo {
  id: string;
  name: string;
  path: string;
  description: string;
}

interface ImageGalleryProps {
  images: ImageInfo[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  return (
    <div className="image-gallery">
      <h2 className="text-2xl font-bold text-nexus-blue mb-6">Image Gallery</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="image-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative h-48 bg-gray-100 flex items-center justify-center p-4">
              {image.path.endsWith('.svg') ? (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ 
                    __html: `<object data="${image.path}" type="image/svg+xml" class="max-h-full max-w-full"></object>` 
                  }}
                />
              ) : (
                <img 
                  src={image.path} 
                  alt={image.name} 
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-nexus-blue">{image.name}</h3>
              <p className="text-gray-600 text-sm mt-2">{image.description}</p>
              <div className="mt-3 text-xs text-gray-500">{image.path}</div>
              <a 
                href={image.path} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-3 inline-block text-nexus-blue hover:text-nexus-accent hover:underline text-sm"
              >
                View Full Size
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery; 