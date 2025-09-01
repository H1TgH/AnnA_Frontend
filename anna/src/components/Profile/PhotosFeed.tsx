import React from 'react';

interface PhotosFeedProps {
  allPhotos: string[];
  handleImageClick: (imageUrl: string, index: number) => void;
}

const PhotosFeed: React.FC<PhotosFeedProps> = ({ allPhotos, handleImageClick }) => {
  if (allPhotos.length === 0) return null;

  return (
    <div className="px-8 pb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" 
          className="h-8 w-6 text-rose-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" 
              d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
        Фотографии ({allPhotos.length})
      </h2>
      
      <div className="relative">
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-100">
          {allPhotos.map((photo, index) => (
            <div key={index} className="relative group flex-shrink-0">
              <img
                src={photo}
                alt={`Фотография ${index + 1}`}
                className="h-28 w-28 object-cover rounded-2xl cursor-pointer hover:shadow-xl hover:scale-110 transition-all duration-300 border-2 border-transparent hover:border-rose-300"
                onClick={() => handleImageClick(photo, index)}
                role="button"
                aria-label={`Открыть фотографию ${index + 1}`}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleImageClick(photo, index)}
              />
              
              {/* Наложение при наведении */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-2xl transition-all duration-300 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              
              {/* Номер фотографии */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        
        {/* Индикатор прокрутки */}
        {allPhotos.length > 4 && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
            <div className="w-2 h-2 bg-rose-200 rounded-full"></div>
            <div className="w-2 h-2 bg-rose-200 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosFeed;