import React from 'react';

interface PhotosFeedProps {
  allPhotos: string[];
  handleImageClick: (imageUrl: string, index: number) => void;
}

const PhotosFeed: React.FC<PhotosFeedProps> = ({ allPhotos, handleImageClick }) => {
  if (allPhotos.length === 0) return null;

  const maxVisible = 4;

  const visiblePhotos = allPhotos.slice(0, maxVisible);
  const extraCount = allPhotos.length - maxVisible;

  return (
    <div className="px-8 pb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-6 text-rose-600" 
            fill="none" viewBox="0 0 24 24" 
            stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" 
                d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        Фотографии ({allPhotos.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
        {visiblePhotos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo}
              alt={`Фотография ${index + 1}`}
              className="w-full h-28 object-cover rounded-2xl cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-rose-300"
              onClick={() => handleImageClick(photo, index)}
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {index + 1}
            </div>
          </div>
        ))}

        {extraCount > 0 && (
          <div
            className="relative group w-full h-28 bg-black/20 rounded-2xl flex items-center justify-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => handleImageClick(allPhotos[maxVisible], maxVisible)}
          >
            <span className="text-white text-lg font-semibold">+{extraCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosFeed;
