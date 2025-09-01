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
      className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
    >
      <div className="bg-white rounded-2xl p-4 max-w-3xl w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Фотография</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Закрыть просмотр изображения"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className="w-full max-h-[80vh] object-contain rounded-lg"
          />
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                aria-label="Предыдущее изображение"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                aria-label="Следующее изображение"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;