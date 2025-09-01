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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      onClick={handleCloseModal}
    >
      {/* Кнопка закрытия */}
      <button
        onClick={handleCloseModal}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2 hover:bg-black/20 rounded-full"
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

      {/* Главное изображение */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={selectedImage}
          alt="Увеличенное изображение"
          className="max-w-full max-h-full object-contain"
          style={{ maxWidth: '100vw', maxHeight: '100vh' }}
        />
        
        {/* Навигация по изображениям */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30 group"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30 group"
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
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium">
                {currentImageIndex + 1} из {allPhotos.length}
              </span>
            </div>
          </>
        )}

        {/* Точки-индикаторы для переключения между изображениями */}
        {allPhotos.length > 1 && allPhotos.length <= 10 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
            {allPhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  // Здесь можно добавить логику для перехода к конкретному изображению
                  // Но для этого нужно будет передать дополнительный проп
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentImageIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Перейти к изображению ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Информация об изображении */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-sm">
        Изображение {currentImageIndex + 1} из {allPhotos.length}
      </div>
    </div>
  );
};

export default ImageModal;