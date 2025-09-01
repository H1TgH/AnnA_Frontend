import React from 'react';

interface PhotosFeedProps {
  allPhotos: string[];
  handleImageClick: (imageUrl: string, index: number) => void;
}

const PhotosFeed: React.FC<PhotosFeedProps> = ({ allPhotos, handleImageClick }) => {
  if (allPhotos.length === 0) return null;

  return (
    <div className="px-8 pb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Фотографии</h2>
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-100">
        {allPhotos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`Фотография ${index + 1}`}
            className="h-24 w-24 object-cover rounded-lg cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
            onClick={() => handleImageClick(photo, index)}
            role="button"
            aria-label={`Открыть фотографию ${index + 1}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleImageClick(photo, index)}
          />
        ))}
      </div>
    </div>
  );
};

export default PhotosFeed;