import React from 'react';

interface ImageModalProps {
  selectedImage: string | null;
  allPhotos: string[];
  currentImageIndex: number;
  handleCloseModal: () => void;
  handlePrevImage: () => void;
  handleNextImage: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  selectedImage,
  allPhotos,
  currentImageIndex,
  handleCloseModal,
  handlePrevImage,
  handleNextImage,
}) => {
  if (!selectedImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      onClick={handleCloseModal}
    >
      <div 
        className="bg-white rounded-3xl p-6 max-w-5xl w-full max-h-[90vh] animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Просмотр фотографии</h2>
          </div>
          
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Закрыть просмотр изображения"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Изображение */}
        <div className="relative bg-gray-50 rounded-2xl p-4">
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className="w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
          />
          
          {/* Навигация по изображениям */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-700 p-4 rounded-full hover:bg-white shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 group"
                aria-label="Предыдущее изображение"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 text-gray-700 p-4 rounded-full hover:bg-white shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-rose-200 group"
                aria-label="Следующее изображение"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Индикатор текущего изображения */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="text-sm font-medium">
                  {currentImageIndex + 1} из {allPhotos.length}
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* Миниатюры всех изображений */}
        {allPhotos.length > 1 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Все фотографии:</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-100">
              {allPhotos.map((photo, index) => (
                <div 
                  key={index} 
                  className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'ring-4 ring-rose-500 scale-110' 
                      : 'hover:scale-105'
                  }`}
                  onClick={() => {
                    // Здесь можно добавить логику для перехода к конкретному изображению
                  }}
                >
                  <img
                    src={photo}
                    alt={`Миниатюра ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Информация об изображении */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Размер: {allPhotos.length > 0 ? 'Оригинал' : 'Неизвестно'}</span>
            <span>Формат: Изображение</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;